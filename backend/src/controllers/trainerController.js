const User = require('../models/User');


exports.getTotalTrainersCount = async (req, res) => {
  try {
    const totalCount = await User.countDocuments({ role: 'trainer' });
    res.status(200).json({
      success: true,
      totalCount: totalCount
    });
  } catch (error) {
    console.error(`Error fetching total trainer count: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error: Could not retrieve total trainer count.',
    });
  } 
};

// get all trainers
exports.getAllTrainers = async (req, res) => {
  try {
    const trainers = await User.find({ role: 'trainer' }).select('-password').lean();
    res.status(200).json({
      success: true,
      trainers: trainers
    });
  } catch (error) {
    console.error(`Error fetching trainers: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Server Error: Could not retrieve trainers.',
    });
  }
};

// get a single trainer by ID  
exports.getTrainerById = async (req, res) => {
  try {
    const trainerId = req.params.id;
    const trainer = await User.findOne(
      { _id: trainerId, role: 'trainer' })
      .select('-password')
      .lean();
    if (!trainer) {
      return res.status(404).json({
        success: false,
        error: 'Trainer not found.',
      });
    } 
    res.status(200).json({
      success: true,
      trainer: trainer
    });
  } catch (error) {
    console.error(`Error fetching trainer by ID: ${error.message}`);
    res.status(500).json({  
      success: false,
      error: 'Server Error: Could not retrieve trainer.',
    });
  }
};

// get trainers by course ID
exports.getTrainersByCourseId = async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const trainers = await User.find({ role: 'trainer', teachingCourses: courseId })
      .select('-password')
      .lean();
    res.status(200).json({
      success: true,
      trainers: trainers
    });
  } catch (error) {
    console.error(`Error fetching trainers by course ID: ${error.message}`);
    res.status(500).json({  
      success: false,
      error: 'Server Error: Could not retrieve trainers for the course.',
    });
  } 
};