// // server/controllers/resumeController.js
// const Resume = require("../models/Resume");
// const { generateResumePdf } = require("../utils/nlpPdfClient");
// const path = require("path");
// const fs = require("fs");
// const { processPlatformResume } = require("../utils/processedResumeService");

// exports.submitResume = async (req, res) => {
//   try {
//     const data = req.body;

//     if (!data.userId) return res.status(400).json({ error: "userId is required" });

//     const userId = data.userId;
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
//       resume = new Resume({ ...data, templateId, viewModel });
//       await resume.save();
//     }

//     // ✅ Generate template PDF only if we have viewModel
//     // ✅ Generate template PDF only if we have viewModel
// if (viewModel) {
//   const theme =
//     data.themeColor || viewModel?.themeColor || resume.themeColor || "#111827";

//   const pdfBytes = await generateResumePdf({
//     userId,
//     templateId,
//     viewModel,
//     themeColor: theme,
//   });

//   const resumesDir = path.join(__dirname, "..", "uploads", "resumes");
//   if (!fs.existsSync(resumesDir)) fs.mkdirSync(resumesDir, { recursive: true });

//   const pdfPath = path.join(resumesDir, `resume_${userId}_${templateId}.pdf`);
//   fs.writeFileSync(pdfPath, pdfBytes);
// }

// // Keep your processed resume pipeline
// try {
//   await processPlatformResume(resume);
// } catch (e) {
//   console.error("Error processing platform resume:", e);
// }

//     return res.json({
//       message: "Resume saved successfully!",
//       pdfUrl: `/api/resume/pdf/${userId}?templateId=${encodeURIComponent(templateId)}`,
//     });
//   } catch (err) {
//     console.error("❌ Error in submitResume:", err);
//     return res.status(500).json({ error: "Server Error" });
//   }
// };

// exports.getResume = async (req, res) => {
//   try {
//     const resume = await Resume.findOne({ userId: req.params.userId });
//     if (!resume) return res.status(404).json({ message: "No resume found" });
//     return res.json(resume);
//   } catch (err) {
//     return res.status(500).json({ error: "Server Error" });
//   }
// };

// // /api/resume/pdf/:userId?templateId=classic
// exports.getPDF = async (req, res) => {
//   try {
//     const userId = req.params.userId;
//     const templateId = req.query.templateId || "classic";

//     const pdfPath = path.join(__dirname, "..", "uploads", "resumes", `resume_${userId}_${templateId}.pdf`);

//     if (!fs.existsSync(pdfPath)) {
//       return res.status(404).json({ message: "PDF not found" });
//     }

//     res.setHeader("Content-Type", "application/pdf");
//     res.setHeader("Content-Disposition", `attachment; filename=resume_${userId}_${templateId}.pdf`);
//     fs.createReadStream(pdfPath).pipe(res);
//   } catch (err) {
//     return res.status(500).json({ error: "Server Error" });
//   }
// };

// exports.deleteResume = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const resume = await Resume.findOneAndDelete({ userId });

//     const resumesDir = path.join(__dirname, "..", "uploads", "resumes");
//     if (fs.existsSync(resumesDir)) {
//       const files = fs.readdirSync(resumesDir);
//       for (const f of files) {
//         if (f.startsWith(`resume_${userId}_`) && f.endsWith(".pdf")) {
//           fs.unlinkSync(path.join(resumesDir, f));
//         }
//       }
//     }

//     if (!resume) return res.status(404).json({ message: "No resume found" });
//     return res.json({ message: "Resume deleted successfully" });
//   } catch (err) {
//     return res.status(500).json({ error: "Server Error" });
//   }
// };

//// // server/controllers/resumeController.js
const Resume = require("../models/Resume");
const { generateResumePdf } = require("../utils/nlpPdfClient");
const path = require("path");
const fs = require("fs");
const { processPlatformResume } = require("../utils/processedResumeService");
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

    try {
      await processPlatformResume(resume);
    } catch (e) {
      console.error("Error processing platform resume:", e);
    }

    return res.json({
      message: "Resume saved successfully!",
      pdfUrl: `/api/resume/me/pdf?templateId=${encodeURIComponent(templateId)}`,
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