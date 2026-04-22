// //server/utils/processedResumeService.js
// const axios = require("axios");
// const ProcessedResume = require("../models/ProcessedResume");

// const NLP_SERVICE_BASE =
//   process.env.NLP_SERVICE_BASE || "http://127.0.0.1:8000";

// async function processUploadedResume(userId, fileDoc) {
//   try {
//     console.log("[processUploadedResume] START", {
//       userId,
//       fileId: fileDoc && fileDoc._id && fileDoc._id.toString(),
//       filePath: fileDoc && fileDoc.filePath,
//     });

//     if (!fileDoc || !fileDoc.filePath) {
//       console.error("[processUploadedResume] Missing filePath on fileDoc");
//       return;
//     }

//     // filePath is already an absolute URL
//     const fileUrl = fileDoc.filePath;

//     const nlpResp = await axios.post(
//       `${NLP_SERVICE_BASE}/process-resume`,
//       {
//         source_type: "uploaded_pdf",   // IMPORTANT: must match FastAPI check
//         file_url: fileUrl,
//         user_id: userId,
//       },
//       {
//         timeout: 240000, // allow up to 4 minutes for first-time model download
//       }
//     );

//     console.log(
//       "[processUploadedResume] NLP response OK - keys:",
//       Object.keys(nlpResp.data)
//     );

//     const { scoring_text, structured, markdown } = nlpResp.data;

//     const processed = new ProcessedResume({
//       userId,
//       sourceType: "uploaded_pdf",
//       resumeDocId: null,
//       uploadedFileId: fileDoc._id,
//       fileUrl,
//       scoringText: scoring_text,
//       structured,
//       markdown,
//       rawText: structured?.raw_text || scoring_text,
//     });

//     await processed.save();
//     console.log(
//       "[processUploadedResume] Saved ProcessedResume",
//       processed._id.toString()
//     );
//   } catch (err) {
//     console.error(
//       "[processUploadedResume] ERROR",
//       err?.response?.data || err.message || err
//     );
//   }
// }

// module.exports = { processUploadedResume };

const axios = require("axios");
const ProcessedResume = require("../models/ProcessedResume");

const NLP_SERVICE_BASE =
  process.env.NLP_SERVICE_BASE || "http://127.0.0.1:8000";

async function processUploadedResume(userId, fileDoc) {
  if (!fileDoc || !fileDoc.filePath) {
    throw new Error("Missing uploaded file path");
  }

  const fileUrl = fileDoc.filePath;

  const existing = await ProcessedResume.findOne({
    userId,
    sourceType: "uploaded_pdf",
    uploadedFileId: fileDoc._id,
  });

  const targetDoc =
    existing ||
    new ProcessedResume({
      userId,
      sourceType: "uploaded_pdf",
      resumeDocId: null,
      uploadedFileId: fileDoc._id,
      fileUrl,
    });

  targetDoc.processingStatus = "pending";
  targetDoc.processingStartedAt = new Date();
  targetDoc.processingCompletedAt = null;
  targetDoc.processingError = null;
  targetDoc.fileUrl = fileUrl;

  await targetDoc.save();

  try {
    const nlpResp = await axios.post(
      `${NLP_SERVICE_BASE}/process-resume`,
      {
        source_type: "uploaded_pdf",
        file_url: fileUrl,
        user_id: userId,
      },
      {
        timeout: 240000,
      }
    );

    const { scoring_text, structured, markdown } = nlpResp.data;

    targetDoc.scoringText = scoring_text || "";
    targetDoc.structured = structured || {};
    targetDoc.markdown = markdown || "";
    targetDoc.rawText = structured?.raw_text || scoring_text || "";
    targetDoc.processingStatus = "completed";
    targetDoc.processingCompletedAt = new Date();
    targetDoc.processingError = null;

    await targetDoc.save();
    return targetDoc;
  } catch (err) {
    targetDoc.processingStatus = "failed";
    targetDoc.processingCompletedAt = new Date();
    targetDoc.processingError =
      err?.response?.data?.detail ||
      err?.response?.data?.message ||
      err.message ||
      "Resume processing failed";

    await targetDoc.save();
    throw err;
  }
}

async function processPlatformResume(resumeDoc) {
  if (!resumeDoc) {
    throw new Error("Resume document is required");
  }

  const userId = String(resumeDoc.userId);

  const existing = await ProcessedResume.findOne({
    userId,
    sourceType: "builder_form",
  });

  const targetDoc =
    existing ||
    new ProcessedResume({
      userId,
      sourceType: "builder_form",
      resumeDocId: resumeDoc._id,
    });

  targetDoc.resumeDocId = resumeDoc._id;
  targetDoc.processingStatus = "pending";
  targetDoc.processingStartedAt = new Date();
  targetDoc.processingCompletedAt = null;
  targetDoc.processingError = null;

  await targetDoc.save();

  try {
    const nlpResp = await axios.post(
      `${NLP_SERVICE_BASE}/process-resume`,
      {
        source_type: "builder_form",
        user_id: userId,
        resume_json: resumeDoc.toObject ? resumeDoc.toObject() : resumeDoc,
      },
      {
        timeout: 240000,
      }
    );

    const { scoring_text, structured, markdown } = nlpResp.data;

    targetDoc.scoringText = scoring_text || "";
    targetDoc.structured = structured || {};
    targetDoc.markdown = markdown || "";
    targetDoc.rawText = structured?.raw_text || scoring_text || "";
    targetDoc.processingStatus = "completed";
    targetDoc.processingCompletedAt = new Date();
    targetDoc.processingError = null;

    await targetDoc.save();
    return targetDoc;
  } catch (err) {
    targetDoc.processingStatus = "failed";
    targetDoc.processingCompletedAt = new Date();
    targetDoc.processingError =
      err?.response?.data?.detail ||
      err?.response?.data?.message ||
      err.message ||
      "Platform resume processing failed";

    await targetDoc.save();
    throw err;
  }
}

module.exports = { processUploadedResume, processPlatformResume };