const Progress = require('../models/Progress');
const Topic = require('../models/Topic');
const ModuleModel = require('../models/Module');
const ApiResponse = require('../utils/ApiResponse');
const catchAsync = require('../utils/catchAsync');

// POST /api/topics/:id/complete
exports.markComplete = catchAsync(async (req, res) => {
  const topicId = req.params.id;

  const topic = await Topic.findById(topicId).lean();
  if (!topic) return res.status(404).json(ApiResponse.fail('Topic not found'));

  const moduleDoc = await ModuleModel.findById(topic.module).lean();
  if (!moduleDoc) return res.status(404).json(ApiResponse.fail('Module not found'));
  const courseId = moduleDoc.course;

  const progress = await Progress.findOneAndUpdate(
    { user: req.user._id, course: courseId },
    { $addToSet: { completedTopics: topicId } },
    { new: true, upsert: true }
  );

  res.json(ApiResponse.ok({ progress }, 'Topic marked complete'));
});

// GET /api/progress/:courseId
exports.getCourseProgress = catchAsync(async (req, res) => {
  const { courseId } = req.params;

  // total topics in the course
  const modules = await ModuleModel.find({ course: courseId }).select('_id').lean();
  const moduleIds = modules.map(m => m._id);
  const totalTopics = await Topic.countDocuments({ module: { $in: moduleIds } });

  const progress = await Progress.findOne({ user: req.user._id, course: courseId }).lean();
  const completed = progress ? (progress.completedTopics?.length || 0) : 0;
  const percentage = totalTopics > 0 ? Math.round((completed / totalTopics) * 100) : 0;

  res.json(ApiResponse.ok({ totalTopics, completed, percentage, progress: progress || null }));
});

// GET /api/progress
exports.getAllProgress = catchAsync(async (req, res) => {
  const progresses = await Progress.find({ user: req.user._id }).lean();
  res.json(ApiResponse.ok({ progresses }));
});

