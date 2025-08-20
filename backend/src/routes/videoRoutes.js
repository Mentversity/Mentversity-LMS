const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { uploadVideo, getVideo, deleteVideo } = require('../controllers/videoController'); // NEW: deleteVideo

router.post('/topics/:id/video', protect, authorize('admin'), upload.single('video'), uploadVideo);
router.get('/topics/:id/video', protect, getVideo);
router.delete('/topics/:id/video', protect, authorize('admin'), deleteVideo); // NEW

module.exports = router;
