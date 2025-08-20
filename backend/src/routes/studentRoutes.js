// Example: routes/adminRoutes.js
const express = require('express');
const { getAllStudents, getStudentsByCourse } = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth'); // Assuming you have auth middleware

const router = express.Router();

// Protect these routes for admin users
router.use(protect);
router.use(authorize('admin'));

router.route('/students').get(getAllStudents);
router.route('/students/course/:courseId').get(getStudentsByCourse);

module.exports = router;