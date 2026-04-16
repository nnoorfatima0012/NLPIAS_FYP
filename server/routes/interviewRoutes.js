// // server/routes/interviewRoutes.js
// const express = require("express");
// const router = express.Router();
// const { protect } = require("../middleware/authMiddleware");
// const ctrl = require("../controllers/interviewController");

// // ⚠️  ORDER MATTERS — specific paths before :interviewId
// router.get("/:appId/status", protect, ctrl.getStatus);
// router.get("/:appId/result", protect, ctrl.getResult);
// router.post("/:appId/start", protect, ctrl.startInterview);
// router.post("/:interviewId/answer", protect, ctrl.submitAnswer);
// router.post("/:interviewId/complete", protect, ctrl.completeInterview);

// module.exports = router;

// // server/routes/interviewRoutes.js
const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const ctrl = require("../controllers/interviewController");

// Candidate only
router.get("/:appId/status", protect, authorize('candidate', 'admin'), ctrl.getStatus);
router.get("/:appId/result", protect, authorize('candidate', 'admin'), ctrl.getResult);
router.post("/:appId/start", protect, authorize('candidate', 'admin'), ctrl.startInterview);
router.post("/:interviewId/answer", protect, authorize('candidate', 'admin'), ctrl.submitAnswer);
router.post("/:interviewId/complete", protect, authorize('candidate', 'admin'), ctrl.completeInterview);

module.exports = router;