// Example: routes/adminRoutes.js
const express = require('express');
const { getTotalTrainersCount, getAllTrainers, getTrainerById, getTrainersByCourseId } = require('../controllers/trainerController');
const { protect, authorize } = require('../middleware/auth'); // Assuming you have auth middleware

const router = express.Router();

// Protect these routes for admin users
router.use(protect);
router.use(authorize('admin','trainer'));


router.route('/trainers/count').get(getTotalTrainersCount);
router.route('/trainers').get(getAllTrainers);
router.route('/trainers/:id').get(getTrainerById);
router.route('/trainers/course/:courseId').get(getTrainersByCourseId);

module.exports = router;