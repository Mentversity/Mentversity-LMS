const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    topic: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fileUrl: { type: String, required: true },
    status: { type: String, enum: ['submitted', 'graded'], default: 'submitted' },
    grade: { type: Number, min: 0, max: 100 },
    feedback: String
  },
  { timestamps: true }
);

submissionSchema.index({ topic: 1, student: 1 }, { unique: true }); // one submission per student per topic

module.exports = mongoose.model('Submission', submissionSchema);
