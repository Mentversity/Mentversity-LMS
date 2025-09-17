// models/Course.js

const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    title: { 
      type: String, 
      required: true, 
      trim: true 
    },
    description: { 
      type: String, 
      default: '' 
    },
    thumbnail: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    category: {
      type: String,
      required: true,
      trim: true,  
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    // ✅ Trainer who owns/teaches this course
    trainers: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    }],

    // ✅ Students enrolled in this course
    enrolledStudents: [
      { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
      }
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Course', courseSchema);
