const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getCourses,
  createCourse,
  getCourseDetails,
  updateCourse, // NEW
  deleteCourse, // NEW
  addModule,
  updateModule, // NEW
  deleteModule, // NEW
  addTopic,
  updateTopic, // NEW
  deleteTopic // NEW
} = require('../controllers/courseController');
const { upload } = require('../middleware/upload');

router.get('/courses', protect, getCourses);
router.post('/courses', protect, authorize('admin'), upload.single('thumbnail'), createCourse);
router.get('/courses/:id', protect, getCourseDetails);
router.put('/courses/:id', protect, authorize('admin'), updateCourse); // NEW
router.delete('/courses/:id', protect, authorize('admin'), deleteCourse); // NEW

router.post('/courses/:id/modules', protect, authorize('admin'), addModule);
router.put('/modules/:id', protect, authorize('admin'), updateModule); // NEW
router.delete('/modules/:id', protect, authorize('admin'), deleteModule); // NEW

router.post('/modules/:id/topics', protect, authorize('admin'), addTopic);
router.put('/topics/:id', protect, authorize('admin'), updateTopic); // NEW
router.delete('/topics/:id', protect, authorize('admin'), deleteTopic); // NEW

module.exports = router;