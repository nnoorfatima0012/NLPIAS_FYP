// // server/routes/mockRoutes.js
// const express = require("express");
// const router = express.Router();
// const ctrl = require("../controllers/mockController");

// // If you want JWT-protected mock APIs, uncomment:
// // const mockAuth = require("../middleware/mockAuth");
// // router.use(mockAuth);

// router.post("/start", ctrl.startMock);
// router.get("/session/:sessionId", ctrl.getSession);
// router.post("/answer", ctrl.submitAnswer);
// router.post("/finish", ctrl.finishMock);
// router.get("/analytics", ctrl.getMockAnalytics);

// module.exports = router;

// // server/routes/mockRoutes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/mockController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.use(protect, authorize('candidate', 'admin'));

router.post("/start", ctrl.startMock);
router.get("/session/:sessionId", ctrl.getSession);
router.post("/answer", ctrl.submitAnswer);
router.post("/finish", ctrl.finishMock);
router.get("/analytics", ctrl.getMockAnalytics);

module.exports = router;