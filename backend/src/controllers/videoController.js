const Topic = require('../models/Topic');
const ApiResponse = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');
const cloudinary = require('../config/cloudinary'); // Import your Cloudinary config

// Utility to delete a file from Cloudinary
async function deleteCloudinaryFile(publicId, resourceType = 'auto') {
  if (publicId) {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
      console.log(`Cloudinary file ${publicId} (${resourceType}) deleted successfully.`);
    } catch (error) {
      console.error(`Failed to delete Cloudinary file ${publicId} (${resourceType}):`, error);
      // Log the error but don't rethrow, as it might be a cleanup operation
    }
  }
}

// POST /api/topics/:id/video (admin) - field: video
exports.uploadVideo = catchAsync(async (req, res) => {
  const topicId = req.params.id;
  const topic = await Topic.findById(topicId);

  if (!topic) {
    return res.status(404).json(ApiResponse.fail('Topic not found'));
  }
  if (!req.file) {
    return res.status(400).json(ApiResponse.fail('No video file uploaded'));
  }

  // If an old video exists for this topic, delete it from Cloudinary first
  if (topic.video && topic.video.publicId) {
    await deleteCloudinaryFile(topic.video.publicId, 'video');
  }

  try {
    // This is the updated part. Use standard upload with the buffer.
    // It is fast but not designed for multi-hour videos.
    const uploadResult = await cloudinary.uploader.upload(
      `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`, // Pass the buffer as a data URI
      {
        resource_type: 'video', // Explicitly set resource type to video
        folder: 'lms-videos', // Your desired folder in Cloudinary
      }
    );

    // Save the secure URL, public ID, and other relevant details to your database
    topic.video = {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      format: uploadResult.format,
      duration: uploadResult.duration,
      bytes: uploadResult.bytes,
    };
    await topic.save();

    res.status(201).json(ApiResponse.ok({ video: topic.video }, 'Video uploaded successfully'));
  } catch (error) {
    console.error('Cloudinary video upload error:', error);
    res.status(500).json(ApiResponse.fail('Video upload failed'));
  }
});

// GET /api/topics/:id/video
exports.getVideo = catchAsync(async (req, res) => {
  const topicId = req.params.id;
  const topic = await Topic.findById(topicId).lean();
  if (!topic) return res.status(404).json(ApiResponse.fail('Topic not found'));
  res.json(ApiResponse.ok({ video: topic.video || null }));
});

// DELETE /api/topics/:id/video (admin)
exports.deleteVideo = catchAsync(async (req, res) => {
  const topicId = req.params.id;
  const topic = await Topic.findById(topicId);
  if (!topic) return res.status(404).json(ApiResponse.fail('Topic not found'));
  if (!topic.video || !topic.video.publicId) {
    return res.status(400).json(ApiResponse.fail('No video to delete'));
  }

  // Use the utility function to delete the video from Cloudinary
  await deleteCloudinaryFile(topic.video.publicId, 'video');
  
  topic.video = undefined;
  await topic.save();

  res.json(ApiResponse.ok(null, 'Video deleted successfully'));
});