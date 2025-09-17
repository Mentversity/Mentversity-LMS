const Course = require('../models/Course');
const ModuleModel = require('../models/Module');
const Topic = require('../models/Topic');
const Submission = require('../models/Submission');
const Progress = require('../models/Progress');
const ApiResponse = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');
const cloudinary = require('../config/cloudinary'); // Import your Cloudinary config
const fs = require('fs'); // Required for file cleanup if using disk storage

// GET /api/courses
exports.getCourses = catchAsync(async (req, res) => {
  let courses;
  console.log(req.user);

  if (req.user.role === 'admin') {
    // Admins see all courses
    courses = await Course.find()
      .populate({
        path: 'trainers',
        model: 'User', // explicitly say User model
        select: 'name email role', // choose only safe fields
      })
      .lean();
  } else if (req.user.role === 'student') {
    // Students see ONLY enrolled courses
    const enrolledCourseIds = req.user.enrolledCourses || [];

    if (enrolledCourseIds.length === 0) {
      courses = [];
    } else {
      courses = await Course.find({ _id: { $in: enrolledCourseIds } })
        .populate({
          path: 'trainers',
          model: 'User',
          select: 'name email role',
        })
        .lean();
    }
  } else if (req.user.role === 'trainer') {
    // Trainers see ONLY teaching courses
    const teachingCourseIds = req.user.teachingCourses || [];

    if (teachingCourseIds.length === 0) {
      courses = [];
    } else {
      courses = await Course.find({ _id: { $in: teachingCourseIds } })
        .populate({
          path: 'trainers',
          model: 'User',
          select: 'name email role',
        })
        .lean();
    }
  } else {
    courses = [];
  }

  res.json(ApiResponse.ok({ courses }));
});


// POST /api/courses (admin)
// NOTE: This now expects the 'thumbnail' file to be in req.file
exports.createCourse = catchAsync(async (req, res) => {

  const { title, description, category, level } = req.body;
  if (!req.file) {
    return res.status(400).json(ApiResponse.fail('Thumbnail image is required.'));
  }

  // Upload thumbnail to Cloudinary
  const result = await cloudinary.uploader.upload_stream(
    { resource_type: 'image', folder: 'lms-thumbnails' },
    async (error, uploadResult) => {
      if (error) {
        console.error('Cloudinary upload error:', error);
        return res.status(500).json(ApiResponse.fail('Thumbnail upload failed'));
      }

      // Create a new course with the uploaded thumbnail URL and public ID
      const course = await Course.create({
        title,
        description,
        category,
        level,
        thumbnail: {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
        },
      });
      res.status(201).json(ApiResponse.ok({ course }, 'Course created'));
    }
  ).end(req.file.buffer);
});

// GET /api/courses/:id
exports.getCourseDetails = catchAsync(async (req, res) => {
  const courseId = req.params.id;
  const course = await Course.findById(courseId).lean();
  if (!course) return res.status(404).json(ApiResponse.fail('Course not found'));

  const modules = await ModuleModel.find({ course: courseId }).sort({ order: 1 }).lean();
  const moduleIds = modules.map(m => m._id);
  const topics = await Topic.find({ module: { $in: moduleIds } }).sort({ order: 1 }).lean();

  res.json(ApiResponse.ok({ course, modules, topics }));
});

// PUT /api/courses/:id (admin)
// NOTE: This now supports updating the thumbnail via req.file
exports.updateCourse = catchAsync(async (req, res) => {
  const courseId = req.params.id;
  const { title, description, category, level } = req.body;
  console.log(req.body)
  console.log(req.file)
  const course = await Course.findById(courseId);
  if (!course) return res.status(404).json(ApiResponse.fail('Course not found'));

  const updateData = { title, description, level, category };
  
  if (req.file) {
    // If a new thumbnail file is provided, upload it to Cloudinary
    // and delete the old one if it exists
    if (course.thumbnail && course.thumbnail.publicId) {
      await cloudinary.uploader.destroy(course.thumbnail.publicId);
    }

    const result = await cloudinary.uploader.upload_stream(
      { resource_type: 'image', folder: 'lms-thumbnails' },
      async (error, uploadResult) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          return res.status(500).json(ApiResponse.fail('Thumbnail update failed'));
        }
        
        updateData.thumbnail = {
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
        };

        const updatedCourse = await Course.findByIdAndUpdate(
          courseId,
          updateData,
          { new: true, runValidators: true }
        );
        res.json(ApiResponse.ok({ course: updatedCourse }, 'Course updated'));
      }
    ).end(req.file.buffer);
  } else {
    // If no new file, just update the other fields
    const updatedCourse = await Course.findByIdAndUpdate(
      courseId,
      updateData,
      { new: true, runValidators: true }
    );
    res.json(ApiResponse.ok({ course: updatedCourse }, 'Course updated'));
  }
});

// DELETE /api/courses/:id (admin)
exports.deleteCourse = catchAsync(async (req, res) => {
  const courseId = req.params.id;
  const course = await Course.findById(courseId);
  if (!course) return res.status(404).json(ApiResponse.fail('Course not found'));

  // Delete associated modules, topics, assignments, videos first
  const modulesToDelete = await ModuleModel.find({ course: courseId }).select('_id');
  const moduleIdsToDelete = modulesToDelete.map(m => m._id);

  // You will also need to add logic to delete videos and assignments from Cloudinary
  // before deleting the topic records. For now, this is a placeholder.
  await Topic.deleteMany({ module: { $in: moduleIdsToDelete } });
  await ModuleModel.deleteMany({ course: courseId });

  // Delete the course thumbnail from Cloudinary if it exists
  if (course.thumbnail && course.thumbnail.publicId) {
    await cloudinary.uploader.destroy(course.thumbnail.publicId);
  }

  await Course.findByIdAndDelete(courseId);

  // Also remove this course from all users' enrolledCourses arrays
  await User.updateMany(
    { enrolledCourses: courseId },
    { $pull: { enrolledCourses: courseId } }
  );

  res.json(ApiResponse.ok(null, 'Course deleted'));
});

// The following functions remain unchanged as they don't involve the Course model or thumbnail management
// POST /api/courses/:id/modules (admin)
exports.addModule = catchAsync(async (req, res) => {
  const { title, order = 0 } = req.body;
  const courseId = req.params.id;
  const course = await Course.findById(courseId);
  if (!course) return res.status(404).json(ApiResponse.fail('Course not found'));

  const moduleDoc = await ModuleModel.create({ course: courseId, title, order });
  res.status(201).json(ApiResponse.ok({ module: moduleDoc }, 'Module created'));
});

// PUT /api/modules/:id (admin)
exports.updateModule = catchAsync(async (req, res) => {
  const moduleId = req.params.id;
  const { title, order } = req.body;
  const moduleDoc = await ModuleModel.findByIdAndUpdate(
    moduleId,
    { title, order },
    { new: true, runValidators: true }
  );
  if (!moduleDoc) return res.status(404).json(ApiResponse.fail('Module not found'));
  res.json(ApiResponse.ok({ module: moduleDoc }, 'Module updated'));
});

// DELETE /api/modules/:id (admin)
exports.deleteModule = catchAsync(async (req, res) => {
  const moduleId = req.params.id;
  await Topic.deleteMany({ module: moduleId });
  const moduleDoc = await ModuleModel.findByIdAndDelete(moduleId);
  if (!moduleDoc) return res.status(404).json(ApiResponse.fail('Module not found'));
  res.json(ApiResponse.ok(null, 'Module deleted'));
});

// POST /api/modules/:id/topics (admin)
exports.addTopic = catchAsync(async (req, res) => {
  const moduleId = req.params.id;
  const { title, content, order = 0 } = req.body;
  const module = await ModuleModel.findById(moduleId);
  if (!module) return res.status(404).json(ApiResponse.fail('Module not found'));

  const topic = await Topic.create({ module: moduleId, title, content, order });
  res.status(201).json(ApiResponse.ok({ topic }, 'Topic created'));
});

// PUT /api/topics/:id (admin)
exports.updateTopic = catchAsync(async (req, res) => {
  const topicId = req.params.id;
  const { title, content, order } = req.body;
  const topic = await Topic.findByIdAndUpdate(
    topicId,
    { title, content, order },
    { new: true, runValidators: true }
  );
  if (!topic) return res.status(404).json(ApiResponse.fail('Topic not found'));
  res.json(ApiResponse.ok({ topic }, 'Topic updated'));
});

// DELETE /api/topics/:id (admin)
exports.deleteTopic = catchAsync(async (req, res) => {
  const topicId = req.params.id;
  await Submission.deleteMany({ topic: topicId });
  const topic = await Topic.findByIdAndDelete(topicId);
  if (!topic) return res.status(404).json(ApiResponse.fail('Topic not found'));
  res.json(ApiResponse.ok(null, 'Topic deleted'));
});