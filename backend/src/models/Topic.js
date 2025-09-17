const mongoose = require('mongoose');

const topicSchema = new mongoose.Schema(
  {
    module: { type: mongoose.Schema.Types.ObjectId, ref: 'Module', required: true },
    title: { type: String, required: true },
    order: { type: Number, default: 0 },
    video: {
      url: String,         // e.g., /uploads/filename.mp4 or remote URL
      originalName: String
    },
    assignment: {
      fileUrl: String,     // single assignment file per topic
      title: String,
      description: String
    }
  },
  { timestamps: true }
);

topicSchema.index({ module: 1, order: 1 }, { unique: true }); 

module.exports = mongoose.model('Topic', topicSchema);
