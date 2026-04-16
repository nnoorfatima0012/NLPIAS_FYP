
//server/middleware/uploadMiddleware
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload folder exists
const resumesDir = path.join(__dirname, "../uploads/resumes");
if (!fs.existsSync(resumesDir)) {
  fs.mkdirSync(resumesDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, resumesDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [".pdf", ".doc", ".docx"];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF/DOC/DOCX allowed"));
  }
};

module.exports = multer({ storage, fileFilter });
