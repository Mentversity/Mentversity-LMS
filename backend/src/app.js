const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const videoRoutes = require('./routes/videoRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const progressRoutes = require('./routes/progressRoutes');
const studentRoutes = require('./routes/studentRoutes');
const trainerRoutes = require('./routes/trainerRoutes');

const app = express();

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cors({ origin: "*", credentials: true }));

// static for uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads')));

// routes
app.use('/api/auth', authRoutes);
app.use('/api', courseRoutes);
app.use('/api', videoRoutes);
app.use('/api', assignmentRoutes);
app.use('/api', progressRoutes);
app.use('/api', studentRoutes)
app.use('/api', trainerRoutes);
// health check
app.get('/health', (_, res) => res.json({ success: true, message: 'OK' }));

// error handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;
