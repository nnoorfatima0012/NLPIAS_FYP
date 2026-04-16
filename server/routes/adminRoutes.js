// // server/routes/adminRoutes.js
// const express = require('express');
// const router = express.Router();
// const authController = require('../controllers/authController');
// const User = require('../models/User');

// // Get all recruiters
// router.get('/recruiters', async (req, res) => {
//   try {
//     const recruiters = await User.find({ role: 'recruiter' });
//     res.status(200).json(recruiters);
//   } catch (error) {
//     console.error('Error fetching recruiters:', error);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// // Update recruiter status
// router.put('/recruiters/:id/status', authController.updateRecruiterStatus);
// // Example: POST /admin/recruiters/:id/decline
// router.post('/recruiters/:id/decline', async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { reason } = req.body;

//     const recruiter = await User.findById(id);

//     if (!recruiter) {
//       return res.status(404).json({ message: 'Recruiter not found' });
//     }

//     recruiter.status = 'declined';
//     recruiter.declineReason = reason; // 👈 Save reason

//     await recruiter.save();

//     res.json({ message: 'Recruiter declined with reason', declineReason: reason });
//   } catch (err) {
//     console.error('Decline error:', err);
//     res.status(500).json({ message: 'Server error during decline' });
//   }
// });

// module.exports = router;

// // server/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect, authorize('admin'));

// Get all recruiters
router.get('/recruiters', async (req, res) => {
  try {
    const recruiters = await User.find({ role: 'recruiter' });
    res.status(200).json(recruiters);
  } catch (error) {
    console.error('Error fetching recruiters:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update recruiter status
router.put('/recruiters/:id/status', authController.updateRecruiterStatus);

// Decline recruiter
router.post('/recruiters/:id/decline', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const recruiter = await User.findById(id);

    if (!recruiter) {
      return res.status(404).json({ message: 'Recruiter not found' });
    }

    recruiter.status = 'declined';
    recruiter.declineReason = reason;
    await recruiter.save();

    res.json({ message: 'Recruiter declined with reason', declineReason: reason });
  } catch (err) {
    console.error('Decline error:', err);
    res.status(500).json({ message: 'Server error during decline' });
  }
});

module.exports = router;