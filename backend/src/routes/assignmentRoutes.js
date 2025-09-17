const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const {
  uploadAssignment,
  submitAssignment,
  getAssignmentStatus,
  gradeSubmission,
  getStudentAssignmentsStructured,
  getTrainerAssignmentsOverview,
  getAssignmentCompletion
} = require('../controllers/assignmentController'); 
// Admin can upload a new assignment for a topic
router.post('/topics/:id/assignment', protect, authorize('admin', 'trainer'), upload.single('file'), uploadAssignment);

// Student can submit an assignment for a topic
router.post('/topics/:id/assignment/submit', protect, upload.single('file'), submitAssignment);

// Student can get the status of their assignment submission for a topic
router.get('/topics/:id/assignment/status', protect, getAssignmentStatus);

// Admin can grade a submitted assignment
router.post('/assignments/:id/grade', protect, authorize('admin', 'trainer'), gradeSubmission);

// Assignments completion percentage for a course
router.get('/courses/:id/assignments/completion', protect, getAssignmentCompletion);

// --- NEW ROUTE FOR STUDENT ASSIGNMENTS PAGE ---
// Student can get a structured list of all their assignments
router.get('/student/assignments/structured', protect, authorize('student'), getStudentAssignmentsStructured);

router.get('/trainer/assignments/overview', protect, authorize('trainer'), getTrainerAssignmentsOverview);


module.exports = router;