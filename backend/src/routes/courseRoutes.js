const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getCourses,
  createCourse,
  getCourseDetails,
  updateCourse,
  deleteCourse,
  addModule,
  updateModule,
  deleteModule,
  addTopic,
  updateTopic,
  deleteTopic
} = require('../controllers/courseController');
const { upload } = require('../middleware/upload');

// Allow both 'admin' and 'trainer' to create a new course
router.post('/courses', protect, authorize('admin', 'trainer'), upload.single('thumbnail'), createCourse);

// Allow both 'admin' and 'trainer' to update and delete a course
router.put('/courses/:id', protect, authorize('admin', 'trainer'),upload.single('thumbnail'), updateCourse);
router.delete('/courses/:id', protect, authorize('admin', 'trainer'), deleteCourse);

// Allow both 'admin' and 'trainer' to add, update, and delete modules
router.post('/courses/:id/modules', protect, authorize('admin', 'trainer'), addModule);
router.put('/modules/:id', protect, authorize('admin', 'trainer'), updateModule);
router.delete('/modules/:id', protect, authorize('admin', 'trainer'), deleteModule);

// Allow both 'admin' and 'trainer' to add, update, and delete topics
router.post('/modules/:id/topics', protect, authorize('admin', 'trainer'), addTopic);
router.put('/topics/:id', protect, authorize('admin', 'trainer'), updateTopic);
router.delete('/topics/:id', protect, authorize('admin', 'trainer'), deleteTopic);

// These routes already have correct permissions
router.get('/courses', protect, getCourses);
router.get('/courses/:id', protect, getCourseDetails);

module.exports = router;