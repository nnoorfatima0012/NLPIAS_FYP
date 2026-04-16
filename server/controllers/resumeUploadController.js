// // server/controllers/resumeUploadController.js
// const Resume = require("../models/Resume");
// const path = require("path");
// const fs = require("fs");
// const {
//   processUploadedResume,
// } = require("../utils/processedResumeService"); 
// // Upload resume
// exports.uploadResume = async (req, res) => {
//   try {
//     if (!req.file) return res.status(400).json({ error: "No file uploaded" });

//     const { userId } = req.body;
//     let resume = await Resume.findOne({ userId });

//     if (!resume) {
//       resume = new Resume({ userId, uploadedFiles: [] });
//     }

//     // ✅ Save full URL so browser can open directly
//     const fileUrl = `${req.protocol}://${req.get("host")}/uploads/resumes/${req.file.filename}`;

//     const newFile = {
//       originalName: req.file.originalname,
//       filePath: fileUrl, // absolute URL
//     };

//     resume.uploadedFiles.push(newFile);
//     await resume.save();

//     // NOTE: after save(), Mongoose assigns _id to newFile
//     const savedFile = resume.uploadedFiles[resume.uploadedFiles.length - 1];

//     console.log("[uploadResume] calling processUploadedResume", {
//       userId,
//       fileId: savedFile._id?.toString(),
//       filePath: savedFile.filePath,
//     });

//     // 🔹 NEW: call NLP pipeline for this uploaded file
//     try {
//       await processUploadedResume(userId, savedFile);
//     } catch (e) {
//       console.error("Error processing uploaded resume:", e);
//       // You can still return success for upload; processing failure is separate.
//     }

//     res.json({
//       message: "Resume uploaded successfully!",
//       file: newFile,
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Server Error" });
//   }
// };

// // Delete resume
// exports.deleteResume = async (req, res) => {
//   try {
//     const { userId, fileId } = req.params;

//     const resume = await Resume.findOne({ userId });
//     if (!resume) return res.status(404).json({ error: "Resume not found" });

//     const fileIndex = resume.uploadedFiles.findIndex(
//       (file) => file._id.toString() === fileId
//     );
//     if (fileIndex === -1) return res.status(404).json({ error: "File not found" });

//     // ✅ Convert stored URL back to absolute file path for deletion
//     const fileUrl = resume.uploadedFiles[fileIndex].filePath;
//     const fileName = path.basename(fileUrl); 
//     const filePath = path.join(__dirname, `../uploads/resumes/${fileName}`);

//     // Remove from MongoDB
//     resume.uploadedFiles.splice(fileIndex, 1);
//     await resume.save();

//     // Delete from disk if exists
//     if (fs.existsSync(filePath)) {
//       fs.unlinkSync(filePath);
//     }

//     res.json({ message: "Resume deleted successfully" });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: "Server Error" });
//   }
// };

// // server/controllers/resumeUploadController.js
const Resume = require("../models/Resume");
const path = require("path");
const fs = require("fs");
const {
  processUploadedResume,
} = require("../utils/processedResumeService");

function getAuthUserId(req) {
  return req.user?.id || null;
}

// Upload resume
exports.uploadResume = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    let resume = await Resume.findOne({ userId });
    if (!resume) {
      resume = new Resume({ userId, uploadedFiles: [] });
    }

    const fileUrl = `${req.protocol}://${req.get("host")}/uploads/resumes/${req.file.filename}`;

    const newFile = {
      originalName: req.file.originalname,
      filePath: fileUrl,
    };

    resume.uploadedFiles.push(newFile);
    await resume.save();

    const savedFile = resume.uploadedFiles[resume.uploadedFiles.length - 1];

    console.log("[uploadResume] calling processUploadedResume", {
      userId,
      fileId: savedFile._id?.toString(),
      filePath: savedFile.filePath,
    });

    try {
      await processUploadedResume(userId, savedFile);
    } catch (e) {
      console.error("Error processing uploaded resume:", e);
    }

    res.json({
      message: "Resume uploaded successfully!",
      file: savedFile,
    });
  } catch (err) {
    console.error("uploadResume error:", err);
    res.status(500).json({ error: "Server Error" });
  }
};

// Delete uploaded resume file
exports.deleteResume = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { fileId } = req.params;

    const resume = await Resume.findOne({ userId });
    if (!resume) return res.status(404).json({ error: "Resume not found" });

    const fileIndex = resume.uploadedFiles.findIndex(
      (file) => file._id.toString() === fileId
    );
    if (fileIndex === -1) return res.status(404).json({ error: "File not found" });

    const fileUrl = resume.uploadedFiles[fileIndex].filePath;
    const fileName = path.basename(fileUrl);
    const filePath = path.join(__dirname, `../uploads/resumes/${fileName}`);

    resume.uploadedFiles.splice(fileIndex, 1);
    await resume.save();

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ message: "Resume deleted successfully" });
  } catch (err) {
    console.error("deleteUploadedResume error:", err);
    res.status(500).json({ error: "Server Error" });
  }
};
