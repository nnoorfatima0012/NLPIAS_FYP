
// // server/routes/jobRoutes.js
// const express = require('express');
// const router = express.Router();
// const { protect } = require('../middleware/authMiddleware');
// const {
//   postJob,
//   getMyJobs,
//   getJobById,
//   updateJob,
//   deleteJob,
//   getPublicJobs,
//   searchJobs, // ✅ NEW 7:40 1/15/2026
// } = require('../controllers/jobController');

// // Create
// router.post('/post', protect, postJob);

// // Read (mine)
// router.get('/mine', protect, getMyJobs);

// // Read (public list for candidates)
// router.get('/', getPublicJobs);

// router.post('/search', searchJobs); // NEW- public for candidates


// // Read (detail)
// router.get('/:id', protect, getJobById);

// // Update
// router.put('/:id', protect, updateJob);

// // Delete
// router.delete('/:id', protect, deleteJob);

// module.exports = router;

// // // server/routes/jobRoutes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
  postJob,
  getMyJobs,
  getJobById,
  updateJob,
  deleteJob,
  getPublicJobs,
  searchJobs,
  getPublicJobById,
} = require('../controllers/jobController');

// Recruiter/Admin only
router.post('/post', protect, authorize('recruiter', 'admin'), postJob);
router.get('/mine', protect, authorize('recruiter', 'admin'), getMyJobs);
router.put('/:id', protect, authorize('recruiter', 'admin'), updateJob);
router.delete('/:id', protect, authorize('recruiter', 'admin'), deleteJob);

// Public
router.get('/', getPublicJobs);
router.post('/search', searchJobs);

router.get('/public/:id', protect, authorize('candidate', 'admin', 'recruiter'), getPublicJobById);

// Protected detail
router.get('/:id', protect, authorize('recruiter', 'admin'), getJobById);

module.exports = router;