const Topic = require('../models/Topic');
const Submission = require('../models/Submission');
const ApiResponse = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');
const User = require('../models/User');
const Course = require('../models/Course');
const ModuleModel = require('../models/Module');
const cloudinary = require('../config/cloudinary'); // Ensure this path is correct

// Utility to delete a file from Cloudinary
async function deleteCloudinaryFile(publicId, resourceType) {
  if (publicId) {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      console.log(`Cloudinary file ${publicId} (${resourceType}) deleted.`);
    } catch (error) {
      console.error(`Failed to delete Cloudinary file ${publicId} (${resourceType}):`, error);
      // Log the error but don't stop the main process if file deletion fails
    }
  }
}

// POST /api/topics/:id/assignment (admin) - field: file
exports.uploadAssignment = catchAsync(async (req, res) => {
  const topicId = req.params.id;
  const { title, description } = req.body; // Assuming these come from req.body after multer parsing
  const topic = await Topic.findById(topicId);

  if (!topic) return res.status(404).json(ApiResponse.fail('Topic not found'));

  // If an old assignment file exists, delete it from Cloudinary first
  if (topic.assignment && topic.assignment.publicId) {
    await deleteCloudinaryFile(topic.assignment.publicId, 'raw'); // 'raw' for non-image/video files
  }

  // Handle file upload to Cloudinary
  if (req.file) {
    await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { resource_type: 'raw', folder: 'lms-assignments' }, // 'raw' for general files
        async (error, uploadResult) => {
          if (error) {
            console.error('Cloudinary assignment upload error:', error);
            return reject(new Error('Assignment file upload failed'));
          }
          topic.assignment = {
            title: title || 'Assignment',
            description: description || '',
            fileUrl: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            // You might want to save originalName and mimetype too
            originalName: req.file.originalname,
            mimetype: req.file.mimetype,
          };
          resolve();
        }
      ).end(req.file.buffer);
    });
  } else {
    // If no file is provided, update only metadata or remove existing file if it was explicitly removed
    topic.assignment = {
      title: title || 'Assignment',
      description: description || '',
      fileUrl: '', // Clear old file URL if no new file is provided
      publicId: '', // Clear old publicId
    };
  }

  await topic.save();
  res.status(201).json(ApiResponse.ok({ assignment: topic.assignment }, 'Assignment uploaded'));
});

// POST /api/topics/:id/assignment/submit (student) - field: file
exports.submitAssignment = catchAsync(async (req, res) => {
  const topicId = req.params.id;
  if (!req.file) return res.status(400).json(ApiResponse.fail('No submission file uploaded'));

  const studentId = req.user._id;

  // Find existing submission to delete old file if it exists
  const existingSubmission = await Submission.findOne({ topic: topicId, student: studentId });
  if (existingSubmission && existingSubmission.publicId) {
    await deleteCloudinaryFile(existingSubmission.publicId, 'raw'); // 'raw' for submission files
  }

  // Upload new submission file to Cloudinary
  let submissionFileUrl = null;
  let submissionPublicId = null;

  await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'raw', folder: `lms-submissions/${studentId}` }, // Organize by student
      async (error, uploadResult) => {
        if (error) {
          console.error('Cloudinary submission upload error:', error);
          return reject(new Error('Submission file upload failed'));
        }
        submissionFileUrl = uploadResult.secure_url;
        submissionPublicId = uploadResult.public_id;
        resolve();
      }
    ).end(req.file.buffer);
  });

  const submission = await Submission.findOneAndUpdate(
    { topic: topicId, student: studentId },
    { 
      fileUrl: submissionFileUrl, 
      publicId: submissionPublicId,
      status: 'submitted',
      submittedAt: new Date(), // Add submitted timestamp
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  res.status(201).json(ApiResponse.ok({ submission }, 'Assignment submitted'));
});

// GET /api/topics/:id/assignment/status (student)
exports.getAssignmentStatus = catchAsync(async (req, res) => {
  const topicId = req.params.id;
  const submission = await Submission.findOne({ topic: topicId, student: req.user._id }).lean();
  res.json(ApiResponse.ok({ submission: submission || null }));
});

// POST /api/assignments/:id/grade (admin)
exports.gradeSubmission = catchAsync(async (req, res) => {
  const { id } = req.params;
  console.log(req.body)
  const { grade, feedback } = req.body;
  console.log('Grading submission:', id, 'with grade:', grade, 'and feedback:', feedback);

  const submission = await Submission.findOne({topic: id});
  if (!submission) return res.status(404).json(ApiResponse.fail('Submission not found'));
  console.log('Found submission:', submission);
  submission.grade = grade;
  submission.feedback = feedback || '';
  submission.status = 'graded';
  await submission.save();

  res.json(ApiResponse.ok({ submission }, 'Submission graded'));
});

// DELETE /api/topics/:id/assignment (admin) - NEW: Delete the assignment file
exports.deleteAssignment = catchAsync(async (req, res) => {
  const topicId = req.params.id;
  const topic = await Topic.findById(topicId);
  if (!topic) return res.status(404).json(ApiResponse.fail('Topic not found'));

  // Delete the assignment file from Cloudinary if it exists
  if (topic.assignment && topic.assignment.publicId) {
    await deleteCloudinaryFile(topic.assignment.publicId, 'raw');
  }

  topic.assignment = undefined; // Remove the assignment object
  await topic.save();

  res.json(ApiResponse.ok(null, 'Assignment deleted from topic'));
});


// DELETE /api/submissions/:id (admin) - NEW: Delete a specific submission file
exports.deleteSubmission = catchAsync(async (req, res) => {
  const submissionId = req.params.id;
  const submission = await Submission.findById(submissionId);
  if (!submission) return res.status(404).json(ApiResponse.fail('Submission not found'));

  // Delete the submission file from Cloudinary if it exists
  if (submission.publicId) {
    await deleteCloudinaryFile(submission.publicId, 'raw');
  }

  await Submission.findByIdAndDelete(submissionId);

  res.json(ApiResponse.ok(null, 'Submission deleted'));
});


// GET /api/student/assignments/structured (unchanged, just added to context)
exports.getStudentAssignmentsStructured = catchAsync(async (req, res) => {
  const studentId = req.user._id; // Get student ID from authenticated user

  // 1. Get all courses the student is enrolled in
  const student = await User.findById(studentId).lean();
  if (!student || !student.enrolledCourses || student.enrolledCourses.length === 0) {
    return res.json(ApiResponse.ok({ courses: [] })); // No enrolled courses
  }

  const enrolledCourseIds = student.enrolledCourses;
  const courses = await Course.find({ _id: { $in: enrolledCourseIds } }).lean();

  const coursesWithAssignments = await Promise.all(
    courses.map(async (course) => {
      // 2. Get all modules for each course
      const modules = await ModuleModel.find({ course: course._id }).sort({ order: 1 }).lean();
      const moduleIds = modules.map(m => m._id);

      // 3. Get all topics for these modules
      const topics = await Topic.find({ module: { $in: moduleIds } }).sort({ order: 1 }).lean();

      // Create a map of topics by module for efficient lookup
      const topicsByModule = topics.reduce((acc, topic) => {
        const moduleId = topic.module.toString();
        if (!acc[moduleId]) {
          acc[moduleId] = [];
        }
        acc[moduleId].push(topic);
        return acc;
      }, {});

      // 4. For each module, attach its topics and for each topic, attach its assignment details and student's submission status
      const modulesWithAssignments = await Promise.all(
        modules.map(async (mod) => {
          const modTopics = topicsByModule[mod._id.toString()] || [];
          const topicsWithAssignments = await Promise.all(
            modTopics.map(async (topic) => {
              let submissionStatus = null;
              if (topic.assignment) {
                const submission = await Submission.findOne({ topic: topic._id, student: studentId }).lean();
                submissionStatus = submission ? {
                  status: submission.status,
                  fileUrl: submission.fileUrl,
                  grade: submission.grade,
                  feedback: submission.feedback,
                  submittedAt: submission.createdAt
                } : { status: 'Not Submitted' };
              }
              return {
                ...topic,
                assignment: topic.assignment ? { ...topic.assignment, studentSubmission: submissionStatus } : null
              };
            })
          );
          return {
            ...mod,
            topics: topicsWithAssignments,
          };
        })
      );

      return {
        ...course,
        modules: modulesWithAssignments,
      };
    })
  );

  res.json(ApiResponse.ok({ courses: coursesWithAssignments }));
});

// GET /api/trainer/assignments/overview?courseId=COURSE_ID
exports.getTrainerAssignmentsOverview = catchAsync(async (req, res) => {
  // 1. Verify trainer role
  if (req.user.role !== 'trainer') {
    return res.status(403).json(ApiResponse.fail('Access denied. Trainers only.'));
  }

  // 2. Get list of courses taught by trainer (from user.teachingCourses)
  const trainer = await User.findById(req.user._id).select('teachingCourses').lean();
  const coursesTaught = await Course.find({ _id: { $in: trainer.teachingCourses } }).lean();

  // Optionally, support filtering by selected course (courseId)
  const selectedCourseId = req.query.courseId || (coursesTaught[0]?._id && String(coursesTaught[0]._id));

  if (!selectedCourseId) {
    return res.json(ApiResponse.ok({ courses: coursesTaught, students: [], topics: [], assignments: [] }));
  }

  // 3. Get enrolled students for selected course
  const enrolledStudents = await User.find({ enrolledCourses: selectedCourseId, role: 'student' })
    .select('_id name email avatar')
    .lean();

  // 4. Get modules and topics for that course
  const modules = await ModuleModel.find({ course: selectedCourseId }).sort({ order: 1 }).lean();
  const moduleIds = modules.map(m => m._id);
  const topics = await Topic.find({ module: { $in: moduleIds } }).sort({ order: 1 }).lean();
  const topicIds = topics.map(t => t._id);

  // 5. Get all assignment submissions for these topics and students
  const submissions = await Submission.find({
    topic: { $in: topicIds },
    student: { $in: enrolledStudents.map(s => s._id) },
  })
    .populate('student', 'name email avatar')
    .populate('topic', 'title')
    .lean();

  // 6. Structure assignments per student per topic
  const studentsList = enrolledStudents.map(student => {
    const assignmentStatus = topics.map(topic => {
      const sub = submissions.find(s => String(s.student._id) === String(student._id) && String(s.topic._id) === String(topic._id));
      return {
        topicId: topic._id,
        topicTitle: topic.title,
        assignment: topic.assignment,
        submission: sub
          ? {
              status: sub.status,
              fileUrl: sub.fileUrl,
              grade: sub.grade,
              feedback: sub.feedback,
              submittedAt: sub.createdAt
            }
          : null
      };
    });
    return {
      id: student._id,
      name: student.name,
      email: student.email,
      avatar: student.avatar,
      assignments: assignmentStatus
    };
  });

  res.json(ApiResponse.ok({
    courses: coursesTaught.map(c => ({ id: c._id, title: c.title })),
    selectedCourseId,
    students: studentsList,
    topics: topics.map(t => ({
      id: t._id,
      title: t.title,
      assignment: t.assignment
    }))
  }));
});

exports.getAssignmentCompletion = catchAsync(async (req, res) => {
  const { id: courseId } = req.params;
  const user = req.user;

  if (!courseId) {
    return res.status(400).json(ApiResponse.fail("courseId is required"));
  }

  // 1️⃣ Get all assignment topics in this course
  const modules = await ModuleModel.find({ course: courseId }).select("_id").lean();
  const moduleIds = modules.map((m) => m._id);

  const topics = await Topic.find({
    module: { $in: moduleIds },
    assignment: { $ne: null },
  }).select("_id").lean();

  const topicIds = topics.map((t) => t._id);
  const totalAssignments = topics.length;

  if (totalAssignments === 0) {
    return res.json(
      ApiResponse.ok({
        courseId,
        totalAssignments: 0,
        message: "No assignments in this course",
      })
    );
  }

  // 2️⃣ Student role → only their own completion (fast aggregation)
  if (user.role === "student") {
    const submittedCount = await Submission.countDocuments({
      topic: { $in: topicIds },
      student: user._id,
    });

    return res.json(
      ApiResponse.ok({
        courseId,
        student: {
          id: user._id,
          name: user.name,
          submitted: submittedCount,
          totalAssignments,
          completionRate: Math.round((submittedCount / totalAssignments) * 100),
        },
      })
    );
  }

  // 3️⃣ Trainer role → aggregate for ALL students in one query
  if (user.role === "trainer") {
    const enrolledStudents = await User.find({
      enrolledCourses: courseId,
      role: "student",
    })
      .select("_id name")
      .lean();

    if (!enrolledStudents.length) {
      return res.json(
        ApiResponse.ok({
          courseId,
          totalAssignments,
          totalStudents: 0,
          overallCompletionRate: 0,
          students: [],
        })
      );
    }

    // Aggregation pipeline: count submissions per student in one go
    const submissionsAgg = await Submission.aggregate([
      {
        $match: {
          topic: { $in: topicIds },
          student: { $in: enrolledStudents.map((s) => s._id) },
        },
      },
      {
        $group: {
          _id: "$student",
          submitted: { $sum: 1 },
        },
      },
    ]);

    const submissionMap = submissionsAgg.reduce((acc, s) => {
      acc[s._id.toString()] = s.submitted;
      return acc;
    }, {});

    const studentsStats = enrolledStudents.map((student) => {
      const submitted = submissionMap[student._id.toString()] || 0;
      const completionRate = (submitted / totalAssignments) * 100;
      return {
        id: student._id,
        name: student.name,
        submitted,
        totalAssignments,
        completionRate: Math.round(completionRate),
      };
    });

    // Overall completion
    const totalExpected = totalAssignments * enrolledStudents.length;
    const actualSubmissions = submissionsAgg.reduce(
      (sum, s) => sum + s.submitted,
      0
    );

    const overallCompletionRate = (actualSubmissions / totalExpected) * 100;

    return res.json(
      ApiResponse.ok({
        courseId,
        totalAssignments,
        totalStudents: enrolledStudents.length,
        overallCompletionRate: Math.round(overallCompletionRate),
        students: studentsStats,
      })
    );
  }

  return res.status(403).json(ApiResponse.fail("Unauthorized role"));
});
