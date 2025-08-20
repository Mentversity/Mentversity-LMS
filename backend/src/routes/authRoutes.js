const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { login, me, registerStudent } = require('../controllers/authController');

router.post('/login', login);
router.get('/me', protect, me);
router.post('/register-student', protect, authorize('admin'), registerStudent);


module.exports = router;
