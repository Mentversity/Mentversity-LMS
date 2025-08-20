// controllers/studentControllers.js

const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * @desc    Get all students with pagination
 * @route   GET /api/admin/students
 * @access  Private (Admin only)
 */
exports.getAllStudents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalCount = await User.countDocuments({ role: 'student' });
    const students = await User.find({ role: 'student' })
      .select('-password') // Exclude password from results
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: students,
      totalCount: totalCount,
      page: page,
      limit: limit,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    console.error(`Error fetching all students: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error: Could not retrieve students.',
    });
  }
};

/**
 * @desc    Get students by enrolled course with pagination
 * @route   GET /api/admin/students/course/:courseId
 * @access  Private (Admin only)
 */
exports.getStudentsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Validate if the courseId is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid course ID format.',
      });
    }

    const query = {
      role: 'student',
      enrolledCourses: new mongoose.Types.ObjectId(courseId),
    };

    const totalCount = await User.countDocuments(query);
    const students = await User.find(query)
      .select('-password') // Exclude password from results
      .skip(skip)
      .limit(limit);

    // If no students are found, still send 200 OK with totalCount 0
    res.status(200).json({
      success: true,
      data: students, // This will be an empty array if no students are found
      totalCount: totalCount,
      page: page,
      limit: limit,
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    console.error(`Error fetching students by course ID: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error: Could not retrieve students for the specified course.',
    });
  }
};
