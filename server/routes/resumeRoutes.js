// // // server/routes/resumeRoutes.js
// // const express = require("express");
// // const router = express.Router();

// // const {
// //   submitResume,
// //   getResume,
// //   getPDF,
// //   deleteResume,
// // } = require("../controllers/resumeController");

// // const {
// //   uploadResume,
// //   deleteResume: deleteUploadedFile,
// // } = require("../controllers/resumeUploadController");

// // const { renderResume } = require("../controllers/resumeRenderController");

// // const upload = require("../middleware/uploadMiddleware");

// // // ✅ AI Render route (keep it before generic "/:userId" routes)
// // router.post("/render", renderResume);

// // // JSON Resume CRUD
// // router.post("/submit", submitResume);
// // router.get("/get/:userId", getResume);
// // router.get("/pdf/:userId", getPDF);

// // // REST style
// // router.post("/", submitResume);
// // router.get("/:userId", getResume);
// // router.delete("/:userId", deleteResume);

// // // Upload routes
// // router.post("/upload", upload.single("resume"), uploadResume);
// // router.delete("/delete/:userId/:fileId", deleteUploadedFile);

// // module.exports = router;
// const express = require("express");
// const router = express.Router();
// const { protect, authorize } = require('../middleware/authMiddleware');

// const {
//   submitResume,
//   getResume,
//   getPDF,
//   deleteResume,
// } = require("../controllers/resumeController");

// const {
//   uploadResume,
//   deleteResume: deleteUploadedFile,
// } = require("../controllers/resumeUploadController");

// const { renderResume } = require("../controllers/resumeRenderController");
// const upload = require("../middleware/uploadMiddleware");

// // Candidate/Admin only for now
// router.post("/render", protect, authorize('candidate', 'admin'), renderResume);

// // JSON Resume CRUD
// router.post("/submit", protect, authorize('candidate', 'admin'), submitResume);
// router.get("/get/:userId", protect, authorize('candidate', 'admin'), getResume);
// router.get("/pdf/:userId", protect, authorize('candidate', 'admin'), getPDF);

// // REST style
// router.post("/", protect, authorize('candidate', 'admin'), submitResume);
// router.get("/:userId", protect, authorize('candidate', 'admin'), getResume);
// router.delete("/:userId", protect, authorize('candidate', 'admin'), deleteResume);

// // Upload routes
// router.post("/upload", protect, authorize('candidate', 'admin'), upload.single("resume"), uploadResume);
// router.delete("/delete/:userId/:fileId", protect, authorize('candidate', 'admin'), deleteUploadedFile);

// module.exports = router;

//// // // server/routes/resumeRoutes.js
const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/authMiddleware");

const {
  submitResume,
  getResume,
  getPDF,
  deleteResume,
} = require("../controllers/resumeController");

const {
  uploadResume,
  deleteResume: deleteUploadedFile,
} = require("../controllers/resumeUploadController");

const { renderResume } = require("../controllers/resumeRenderController");
const upload = require("../middleware/uploadMiddleware");

router.use(protect, authorize("candidate", "admin"));

// AI Render
router.post("/render", renderResume);

// Self-owned resume routes
router.post("/me", submitResume);
router.get("/me", getResume);
router.get("/me/pdf", getPDF);
router.delete("/me", deleteResume);

// Uploaded file routes
router.post("/me/upload", upload.single("resume"), uploadResume);
router.delete("/me/upload/:fileId", deleteUploadedFile);

module.exports = router;