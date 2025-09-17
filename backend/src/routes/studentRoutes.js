// Example: routes/adminRoutes.js
const express = require('express');
const { getAllStudents, getStudentsByCourse, getTotalStudentsCount } = require('../controllers/studentController');
const { protect, authorize } = require('../middleware/auth'); // Assuming you have auth middleware

const router = express.Router();

// Protect these routes for admin users
router.use(protect);
router.use(authorize('admin','trainer'));

router.route('/students').get(getAllStudents);
router.route('/students/count').get(getTotalStudentsCount);
router.route('/students/course/:courseId').get(getStudentsByCourse);

module.exports = router;