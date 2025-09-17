const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { login, me, registerStudent, registerTrainer } = require('../controllers/authController');

router.post('/login', login);
router.get('/me', protect, me);
router.post('/register-student', protect, authorize('admin'), registerStudent);
router.post('/register-trainer', protect, authorize('admin'), registerTrainer);


module.exports = router;
