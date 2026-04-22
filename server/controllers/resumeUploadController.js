
// // // server/controllers/resumeUploadController.js
// const Resume = require("../models/Resume");
// const path = require("path");
// const fs = require("fs");
// const {
//   processUploadedResume,
// } = require("../utils/processedResumeService");

// function getAuthUserId(req) {
//   return req.user?.id || null;
// }

// // Upload resume
// exports.uploadResume = async (req, res) => {
//   try {
//     const userId = getAuthUserId(req);
//     if (!userId) {
//       return res.status(401).json({ error: "Unauthorized" });
//     }

//     if (!req.file) return res.status(400).json({ error: "No file uploaded" });

//     let resume = await Resume.findOne({ userId });
//     if (!resume) {
//       resume = new Resume({ userId, uploadedFiles: [] });
//     }

//     const fileUrl = `${req.protocol}://${req.get("host")}/uploads/resumes/${req.file.filename}`;

//     const newFile = {
//       originalName: req.file.originalname,
//       filePath: fileUrl,
//     };

//     resume.uploadedFiles.push(newFile);
//     await resume.save();

//     const savedFile = resume.uploadedFiles[resume.uploadedFiles.length - 1];

//     console.log("[uploadResume] calling processUploadedResume", {
//       userId,
//       fileId: savedFile._id?.toString(),
//       filePath: savedFile.filePath,
//     });

//     try {
//       await processUploadedResume(userId, savedFile);
//     } catch (e) {
//       console.error("Error processing uploaded resume:", e);
//     }

//     res.json({
//       message: "Resume uploaded successfully!",
//       file: savedFile,
//     });
//   } catch (err) {
//     console.error("uploadResume error:", err);
//     res.status(500).json({ error: "Server Error" });
//   }
// };

// // Delete uploaded resume file
// exports.deleteResume = async (req, res) => {
//   try {
//     const userId = getAuthUserId(req);
//     if (!userId) {
//       return res.status(401).json({ error: "Unauthorized" });
//     }

//     const { fileId } = req.params;

//     const resume = await Resume.findOne({ userId });
//     if (!resume) return res.status(404).json({ error: "Resume not found" });

//     const fileIndex = resume.uploadedFiles.findIndex(
//       (file) => file._id.toString() === fileId
//     );
//     if (fileIndex === -1) return res.status(404).json({ error: "File not found" });

//     const fileUrl = resume.uploadedFiles[fileIndex].filePath;
//     const fileName = path.basename(fileUrl);
//     const filePath = path.join(__dirname, `../uploads/resumes/${fileName}`);

//     resume.uploadedFiles.splice(fileIndex, 1);
//     await resume.save();

//     if (fs.existsSync(filePath)) {
//       fs.unlinkSync(filePath);
//     }

//     res.json({ message: "Resume deleted successfully" });
//   } catch (err) {
//     console.error("deleteUploadedResume error:", err);
//     res.status(500).json({ error: "Server Error" });
//   }
// };


const Resume = require("../models/Resume");
const ProcessedResume = require("../models/ProcessedResume");
const path = require("path");
const fs = require("fs");
const { resumeQueue } = require("../queue/resumeQueue");

function getAuthUserId(req) {
  return req.user?.id || null;
}

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

    let processed = await ProcessedResume.findOne({
      userId,
      sourceType: "uploaded_pdf",
      uploadedFileId: savedFile._id,
    });

    if (!processed) {
      processed = await ProcessedResume.create({
        userId,
        sourceType: "uploaded_pdf",
        uploadedFileId: savedFile._id,
        fileUrl,
        processingStatus: "pending",
        processingStartedAt: new Date(),
      });
    } else {
      processed.processingStatus = "pending";
      processed.processingStartedAt = new Date();
      processed.processingCompletedAt = null;
      processed.processingError = null;
      processed.fileUrl = fileUrl;
      await processed.save();
    }

    const queueJob = await resumeQueue.add("uploaded_resume_process", {
      type: "uploaded_resume_process",
      userId,
      uploadedFileId: String(savedFile._id),
    });

    processed.processingJobId = String(queueJob.id);
    await processed.save();

    res.json({
      message: "Resume uploaded successfully. Processing started.",
      file: savedFile,
      processing: {
        status: processed.processingStatus,
        jobId: String(queueJob.id),
      },
    });
  } catch (err) {
    console.error("uploadResume error:", err);
    res.status(500).json({ error: "Server Error" });
  }
};

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

    await ProcessedResume.deleteOne({
      userId,
      sourceType: "uploaded_pdf",
      uploadedFileId: fileId,
    });

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ message: "Resume deleted successfully" });
  } catch (err) {
    console.error("deleteUploadedResume error:", err);
    res.status(500).json({ error: "Server Error" });
  }
};