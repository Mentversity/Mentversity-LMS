const router = require('express').Router();
const { protect } = require('../middleware/auth');
const { markComplete, getCourseProgress } = require('../controllers/progressController');

router.post('/topics/:id/complete', protect, markComplete);
router.get('/progress/:courseId', protect, getCourseProgress);

module.exports = router;
