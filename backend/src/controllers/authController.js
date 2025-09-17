// controllers/authController.js

const User = require('../models/User');
const Course = require('../models/Course');
const ApiResponse = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');
const { generateToken } = require('../utils/generateToken');
const { sendAccountEmail } = require('../utils/sendEmail');
const { accountWelcomeEmail } = require('../utils/emailTemplates');


// @desc Login user
exports.login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt:', { email, password });

  if (!email || !password) {
    return res.status(400).json(ApiResponse.fail('Email and password are required'));
  }

  // Explicitly select password and enrolledCourses
  const user = await User.findOne({ email }).select('+password +enrolledCourses');

  if (!user) {
    console.log('No user found with email:', email);
    return res.status(401).json(ApiResponse.fail('Invalid credentials'));
  }

  // Ensure password exists and matches
  // Added !user.password check to prevent "Illegal arguments: string, undefined"
  // if a user record somehow has a missing password hash.
  const isMatch = user.password && (await user.matchPassword(password));
  if (!isMatch) {
    console.log('Password mismatch for user:', email);
    return res.status(401).json(ApiResponse.fail('Invalid credentials'));
  }

  const token = generateToken(user._id);

  res.json(ApiResponse.ok({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      enrolledCourses: user.enrolledCourses || []
    }
  }, 'Login successful'));
});

// @desc Get current user
exports.me = catchAsync(async (req, res) => {
  const user = await User.findById(req.user.id)
    .select('name email role enrolledCourses')
    .lean();

  if (!user) {
    return res.status(404).json(ApiResponse.fail('User not found.'));
  }

  res.json(ApiResponse.ok({ user }));
});

// controller.js (or appropriate controller file)

exports.registerTrainer = catchAsync(async (req, res) => {
  const { email, password, name, assignedCourseIds = [] } = req.body;
  console.log('Request body:', req.body);

  if (!email) {
    return res.status(400).json(ApiResponse.fail('Email is required.'));
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json(ApiResponse.fail('Only admins can manage trainer assignments.'));
  }

  let user = await User.findOne({ email });
  let message = '';
  let statusCode = 200;
  let isNewUser = false;

  // ✅ Validate provided course IDs and filter for valid ones
  let validCourseObjectIds = [];
  let courses = [];
  if (assignedCourseIds.length > 0) {
    courses = await Course.find({ _id: { $in: assignedCourseIds } });
    validCourseObjectIds = courses.map(c => c._id);

    if (validCourseObjectIds.length !== assignedCourseIds.length) {
      console.warn('Some provided course IDs were invalid or not found.');
    }
  }

  console.log('Valid course IDs:', validCourseObjectIds);

  // ✅ Case 1: User already exists
  if (user) {
    if (user.role !== 'trainer') {
      return res.status(400).json(ApiResponse.fail(`User with email ${email} is not a trainer. Cannot modify assignments.`));
    }

    // Add new valid course IDs to the existing trainer's teachingCourses array (avoid duplicates)
    user.teachingCourses = [...new Set([...(user.teachingCourses || []), ...validCourseObjectIds])];
    await user.save();
    console.log(`Existing trainer ${user._id} updated with new courses.`);

    message = 'Existing trainer assigned to additional courses successfully.';
  } else {
    // ✅ Case 2: New trainer registration
    if (!password) {
      return res.status(400).json(ApiResponse.fail('Password is required for new trainer registration.'));
    }

    user = await User.create({
      email,
      password,
      role: 'trainer',
      teachingCourses: validCourseObjectIds,
      name: name || `Trainer-${Date.now()}`
    });

    console.log(`New trainer ${user._id} created and assigned to courses.`);

    message = 'New trainer registered and assigned to courses successfully.';
    statusCode = 201;
    isNewUser = true;
  }

  // ✅ Update each Course to include this trainer in the `trainers` array (no duplicates)
  if (validCourseObjectIds.length > 0) {
    try {
      await Course.updateMany(
        { _id: { $in: validCourseObjectIds } },
        { $addToSet: { trainers: user._id } }  // <-- $addToSet prevents duplicates
      );
      console.log(`Courses updated with trainer ${user._id}.`);
    } catch (updateError) {
      console.error('Failed to update Course documents:', updateError);
    }
  }

  // ✅ Send welcome email
  try {
    await sendAccountEmail({
      to: user.email,
      subject: 'Welcome to Mentversity - Trainer Registration',
      html: accountWelcomeEmail({
        name: user.name,
        email: user.email,
        password: isNewUser ? password : '',
        role: 'trainer',
        courses: courses.map(c => c.title)
      }),
    });
    console.log(`Registration email sent to trainer ${user.email}`);
  } catch (emailErr) {
    console.error('Could not send trainer registration email:', emailErr);
  }

  res.status(statusCode).json(ApiResponse.ok({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      teachingCourses: user.teachingCourses
    }
  }, message));
});


exports.registerStudent = catchAsync(async (req, res) => {
  const { email, password, name, courseIds = [] } = req.body;

  if (!email) {
    return res.status(400).json(ApiResponse.fail('Email is required.'));
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json(ApiResponse.fail('Only admins can manage student enrollments.'));
  }

  // Validate provided course IDs
  let validCourseObjectIds = [];
  let courses = [];
  if (courseIds.length > 0) {
    courses = await Course.find({ _id: { $in: courseIds } });
    validCourseObjectIds = courses.map(c => c._id);

    if (validCourseObjectIds.length !== courseIds.length) {
      console.warn('Some provided course IDs were invalid or not found.');
    }
  }

  let user = await User.findOne({ email });
  let message = '';
  let statusCode = 200;
  let isNewUser = false;

  if (user) {
    // Case 1: User already exists
    if (user.role !== 'student') {
      return res.status(400).json(ApiResponse.fail(`User with email ${email} is not a student. Cannot modify enrollment.`));
    }

    // Add new valid course IDs to existing student's enrolledCourses array (avoid duplicates)
    user = await User.findByIdAndUpdate(
      user._id,
      { $addToSet: { enrolledCourses: { $each: validCourseObjectIds } } },
      { new: true, runValidators: true }
    ).select('-password');

    message = 'Existing student enrolled in additional courses successfully.';
  } else {
    // Case 2: New student registration
    if (!password) {
      return res.status(400).json(ApiResponse.fail('Password is required for new student registration.'));
    }

    const newUser = await User.create({
      email,
      password,
      role: 'student',
      enrolledCourses: validCourseObjectIds,
      name: name || `Student-${Date.now()}`
    });

    newUser.password = undefined; // Hide password from response
    user = newUser;
    message = 'New student registered and enrolled successfully.';
    statusCode = 201;
    isNewUser = true;
  }

  // Update the Course documents' enrolledStudents field (add user._id if not present)
  if (validCourseObjectIds.length > 0) {
    try {
      await Course.updateMany(
        { _id: { $in: validCourseObjectIds } },
        { $addToSet: { enrolledStudents: user._id } }
      );
      console.log(`Student ${user._id} added to enrolledStudents for courses: ${validCourseObjectIds.join(', ')}`);
    } catch (updateError) {
      console.error('Failed to update Course documents with enrolled students:', updateError);
    }
  }

  try {
    await sendAccountEmail({
      to: user.email,
      subject: 'Welcome to Mentversity - Student Registration',
      html: accountWelcomeEmail({
        name: user.name,
        email: user.email,
        password: isNewUser ? password : '',
        role: 'student',
        courses: courses.map(c => c.title)
      }),
    });
    console.log(`Registration email sent to student ${user.email}`);
  } catch (emailErr) {
    console.error('Could not send student registration email:', emailErr);
  }

  res.status(statusCode).json(ApiResponse.ok({
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      enrolledCourses: user.enrolledCourses
    }
  }, message));
});

// @desc Logout
exports.logout = catchAsync(async (req, res) => {
  res.json(ApiResponse.ok(null, 'Logged out successfully'));
});
