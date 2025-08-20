const multer = require('multer');

// Configure Multer to store the file in memory
// This is the most efficient way to handle files before sending them to a third-party service
const storage = multer.memoryStorage();

const fileFilter = (_, file, cb) => {
  // Allow all file types; you can tighten this in production
  cb(null, true);
};

// Set file size limit to 200MB
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 200 }, // 200MB
});

module.exports = { upload };