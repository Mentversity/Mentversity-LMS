// controllers/authController.js

const User = require('../models/User');
const Course = require('../models/Course');
const ApiResponse = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');
const { generateToken } = require('../utils/generateToken');

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

// @desc Register or enroll student (Admin only)
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
  if (courseIds.length > 0) {
    const courses = await Course.find({ _id: { $in: courseIds } });
    validCourseObjectIds = courses.map(c => c._id);

    if (validCourseObjectIds.length !== courseIds.length) {
      console.warn('Some provided course IDs were invalid or not found.');
    }
  }

  let user = await User.findOne({ email });
  let message = '';
  let statusCode = 200;

  if (user) {
    // Case 1: User already exists
    if (user.role !== 'student') {
      return res.status(400).json(ApiResponse.fail(`User with email ${email} is not a student. Cannot modify enrollment.`));
    }

    // Add new valid course IDs to the existing student's enrolledCourses array
    user = await User.findByIdAndUpdate(
      user._id,
      { $addToSet: { enrolledCourses: { $each: validCourseObjectIds } } },
      { new: true, runValidators: true }
    ).select('-password');

    message = 'Existing student enrolled in additional courses successfully.';
  } else {
    // Case 2: New user registration
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
    user = newUser; // Use newUser for the response
    message = 'New student registered and enrolled successfully.';
    statusCode = 201;
  }

  // --- NEW LOGIC: Update the Course documents with the student's ID ---
  if (validCourseObjectIds.length > 0) {
    await Course.updateMany(
      { _id: { $in: validCourseObjectIds } }, // Find courses by the valid IDs
      { $addToSet: { enrolledStudents: user._id } } // Add the student's ID to their enrolledStudents array
    );
    console.log(`Student ${user._id} added to enrolledStudents for courses: ${validCourseObjectIds.join(', ')}`);
  }
  // --- END NEW LOGIC ---

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
