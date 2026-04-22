

// // // server/routes/interviewRoutes.js
// const express = require("express");
// const router = express.Router();
// const { protect, authorize } = require("../middleware/authMiddleware");
// const ctrl = require("../controllers/interviewController");

// // Candidate only
// router.get("/:appId/status", protect, authorize('candidate', 'admin'), ctrl.getStatus);
// router.get("/:appId/result", protect, authorize('candidate', 'admin'), ctrl.getResult);
// router.post("/:appId/start", protect, authorize('candidate', 'admin'), ctrl.startInterview);
// router.post("/:interviewId/answer", protect, authorize('candidate', 'admin'), ctrl.submitAnswer);
// router.post("/:interviewId/complete", protect, authorize('candidate', 'admin'), ctrl.completeInterview);

// module.exports = router;

// // // server/routes/interviewRoutes.js
const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");
const ctrl = require("../controllers/interviewController");

router.get("/:appId/status", protect, authorize('candidate', 'admin'), ctrl.getStatus);
router.get("/:appId/result", protect, authorize('candidate', 'admin'), ctrl.getResult);

router.post("/:appId/start", protect, authorize('candidate', 'admin'), ctrl.startInterview);

router.post("/:interviewId/answer", protect, authorize('candidate', 'admin'), ctrl.submitAnswer);
router.get("/:interviewId/answer-status/:questionId", protect, authorize('candidate', 'admin'), ctrl.getAnswerStatus);

router.post("/:interviewId/complete", protect, authorize('candidate', 'admin'), ctrl.completeInterview);

module.exports = router;