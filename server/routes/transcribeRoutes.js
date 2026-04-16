// // server/routes/transcribeRoutes.js
// const express = require("express");
// const router = express.Router();
// const multer = require("multer");
// const os = require("os");
// const { protect } = require("../middleware/authMiddleware");
// const { transcribe } = require("../controllers/transcribeController");

// const audioStorage = multer.diskStorage({
//   destination: (_req, _file, cb) => cb(null, os.tmpdir()),
//   filename: (_req, file, cb) => {
//     const ext = (file.originalname || "audio").split(".").pop() || "webm";
//     cb(null, `interview_audio_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`);
//   },
// });

// const audioUpload = multer({
//   storage: audioStorage,
//   limits: { fileSize: 26 * 1024 * 1024 },
//   fileFilter: (_req, file, cb) => {
//     const allowed = ["audio/webm", "audio/ogg", "audio/wav", "audio/mp4", "audio/mpeg", "video/webm"];
//     if (allowed.includes(file.mimetype)) return cb(null, true);
//     cb(new Error("Unsupported audio format. Please use webm, ogg, wav, mp4, or mpeg."));
//   },
// });

// router.post("/", protect, audioUpload.single("audio"), transcribe);

// module.exports = router;

// // server/routes/transcribeRoutes.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const os = require("os");
const { protect, authorize } = require("../middleware/authMiddleware");
const { transcribe } = require("../controllers/transcribeController");

const audioStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, os.tmpdir()),
  filename: (_req, file, cb) => {
    const ext = (file.originalname || "audio").split(".").pop() || "webm";
    cb(null, `interview_audio_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`);
  },
});

const audioUpload = multer({
  storage: audioStorage,
  limits: { fileSize: 26 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["audio/webm", "audio/ogg", "audio/wav", "audio/mp4", "audio/mpeg", "video/webm"];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error("Unsupported audio format. Please use webm, ogg, wav, mp4, or mpeg."));
  },
});

router.post("/", protect, authorize('candidate', 'admin'), audioUpload.single("audio"), transcribe);

module.exports = router;