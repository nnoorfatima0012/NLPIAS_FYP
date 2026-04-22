
// //// // server/controllers/resumeController.js
// const Resume = require("../models/Resume");
// const { generateResumePdf } = require("../utils/nlpPdfClient");
// const path = require("path");
// const fs = require("fs");
// const { processPlatformResume } = require("../utils/processedResumeService");
// function getAuthUserId(req) {
//   return req.user?.id || req.user?._id || null;
// }

// exports.submitResume = async (req, res) => {
//   try {
//     const userId = getAuthUserId(req);
//     if (!userId) {
//       return res.status(401).json({ error: "Unauthorized" });
//     }

//     const data = { ...req.body, userId };
//     const templateId = data.templateId || "classic";
//     const viewModel = data.viewModel || null;

//     let resume = await Resume.findOne({ userId });

//     if (resume) {
//       Object.assign(resume, data);
//       resume.templateId = templateId;
//       resume.themeColor = data.themeColor || resume.themeColor;
//       resume.viewModel = viewModel;
//       await resume.save();
//     } else {
//       resume = new Resume({ ...data, userId, templateId, viewModel });
//       await resume.save();
//     }

//     if (viewModel) {
//       const theme =
//         data.themeColor || viewModel?.themeColor || resume.themeColor || "#111827";

//       const pdfBytes = await generateResumePdf({
//         userId,
//         templateId,
//         viewModel,
//         themeColor: theme,
//       });

//       const resumesDir = path.join(__dirname, "..", "uploads", "resumes");
//       if (!fs.existsSync(resumesDir)) fs.mkdirSync(resumesDir, { recursive: true });

//       const pdfPath = path.join(resumesDir, `resume_${userId}_${templateId}.pdf`);
//       fs.writeFileSync(pdfPath, pdfBytes);
//     }

//     try {
//       await processPlatformResume(resume);
//     } catch (e) {
//       console.error("Error processing platform resume:", e);
//     }

//     return res.json({
//       message: "Resume saved successfully!",
//       pdfUrl: `/api/resume/me/pdf?templateId=${encodeURIComponent(templateId)}`,
//     });
//   } catch (err) {
//     console.error("❌ Error in submitResume:", err);
//     return res.status(500).json({ error: "Server Error" });
//   }
// };


const Resume = require("../models/Resume");
const ProcessedResume = require("../models/ProcessedResume");
const { generateResumePdf } = require("../utils/nlpPdfClient");
const path = require("path");
const fs = require("fs");
const { resumeQueue } = require("../queue/resumeQueue");

function getAuthUserId(req) {
  return req.user?.id || req.user?._id || null;
}

exports.submitResume = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const data = { ...req.body, userId };
    const templateId = data.templateId || "classic";
    const viewModel = data.viewModel || null;

    let resume = await Resume.findOne({ userId });

    if (resume) {
      Object.assign(resume, data);
      resume.templateId = templateId;
      resume.themeColor = data.themeColor || resume.themeColor;
      resume.viewModel = viewModel;
      await resume.save();
    } else {
      resume = new Resume({ ...data, userId, templateId, viewModel });
      await resume.save();
    }

    if (viewModel) {
      const theme =
        data.themeColor || viewModel?.themeColor || resume.themeColor || "#111827";

      const pdfBytes = await generateResumePdf({
        userId,
        templateId,
        viewModel,
        themeColor: theme,
      });

      const resumesDir = path.join(__dirname, "..", "uploads", "resumes");
      if (!fs.existsSync(resumesDir)) fs.mkdirSync(resumesDir, { recursive: true });

      const pdfPath = path.join(resumesDir, `resume_${userId}_${templateId}.pdf`);
      fs.writeFileSync(pdfPath, pdfBytes);
    }

    let processed = await ProcessedResume.findOne({
      userId: String(userId),
      sourceType: "builder_form",
    });

    if (!processed) {
      processed = await ProcessedResume.create({
        userId: String(userId),
        sourceType: "builder_form",
        resumeDocId: resume._id,
        processingStatus: "pending",
        processingStartedAt: new Date(),
      });
    } else {
      processed.resumeDocId = resume._id;
      processed.processingStatus = "pending";
      processed.processingStartedAt = new Date();
      processed.processingCompletedAt = null;
      processed.processingError = null;
      await processed.save();
    }

    const queueJob = await resumeQueue.add("platform_resume_process", {
      type: "platform_resume_process",
      userId: String(userId),
      resumeId: String(resume._id),
    });

    processed.processingJobId = String(queueJob.id);
    await processed.save();

    return res.json({
      message: "Resume saved successfully! Processing started.",
      pdfUrl: `/api/resume/me/pdf?templateId=${encodeURIComponent(templateId)}`,
      processing: {
        status: processed.processingStatus,
        jobId: String(queueJob.id),
      },
    });
  } catch (err) {
    console.error("❌ Error in submitResume:", err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.getResume = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const resume = await Resume.findOne({ userId });
    if (!resume) return res.status(404).json({ message: "No resume found" });

    return res.json(resume);
  } catch (err) {
    console.error("getResume error:", err);
    return res.status(500).json({ error: "Server Error" });
  }
};


exports.getPDF = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const resume = await Resume.findOne({ userId });
    if (!resume) {
      return res.status(404).json({ message: "No resume found" });
    }

    const templateId = req.query.templateId || resume.templateId || "classic";

    const resumesDir = path.join(__dirname, "..", "uploads", "resumes");
    if (!fs.existsSync(resumesDir)) {
      fs.mkdirSync(resumesDir, { recursive: true });
    }

    const pdfPath = path.join(
      resumesDir,
      `resume_${userId}_${templateId}.pdf`
    );

    if (!fs.existsSync(pdfPath)) {
      if (!resume.viewModel) {
        return res.status(404).json({
          message: "PDF not found and no saved viewModel available to regenerate it.",
        });
      }

      const theme =
        resume.themeColor ||
        resume.viewModel?.themeColor ||
        "#111827";

      const pdfBytes = await generateResumePdf({
        userId,
        templateId,
        viewModel: resume.viewModel,
        themeColor: theme,
      });

      fs.writeFileSync(pdfPath, pdfBytes);
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=resume_${userId}_${templateId}.pdf`
    );

    fs.createReadStream(pdfPath).pipe(res);
  } catch (err) {
    console.error("getPDF error:", err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.deleteResume = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const resume = await Resume.findOneAndDelete({ userId });

    const resumesDir = path.join(__dirname, "..", "uploads", "resumes");
    if (fs.existsSync(resumesDir)) {
      const files = fs.readdirSync(resumesDir);
      for (const f of files) {
        if (f.startsWith(`resume_${userId}_`) && f.endsWith(".pdf")) {
          fs.unlinkSync(path.join(resumesDir, f));
        }
      }
    }

    if (!resume) return res.status(404).json({ message: "No resume found" });
    return res.json({ message: "Resume deleted successfully" });
  } catch (err) {
    console.error("deleteResume error:", err);
    return res.status(500).json({ error: "Server Error" });
  }
};


exports.getBuilderProcessingStatus = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const processed = await require("../models/ProcessedResume").findOne({
      userId: String(userId),
      sourceType: "builder_form",
    }).lean();

    if (!processed) {
      return res.json({ status: "not_started" });
    }

    return res.json({
      status: processed.processingStatus,
      startedAt: processed.processingStartedAt,
      completedAt: processed.processingCompletedAt,
      error: processed.processingError,
      jobId: processed.processingJobId,
    });
  } catch (err) {
    console.error("getBuilderProcessingStatus error:", err);
    return res.status(500).json({ error: "Server Error" });
  }
};

exports.getUploadedProcessingStatus = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { fileId } = req.params;

    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const processed = await require("../models/ProcessedResume").findOne({
      userId: String(userId),
      sourceType: "uploaded_pdf",
      uploadedFileId: fileId,
    }).lean();

    if (!processed) {
      return res.json({ status: "not_started" });
    }

    return res.json({
      status: processed.processingStatus,
      startedAt: processed.processingStartedAt,
      completedAt: processed.processingCompletedAt,
      error: processed.processingError,
      jobId: processed.processingJobId,
    });
  } catch (err) {
    console.error("getUploadedProcessingStatus error:", err);
    return res.status(500).json({ error: "Server Error" });
  }
};