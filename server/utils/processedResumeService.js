//server/utils/processedResumeService.js
const axios = require("axios");
const ProcessedResume = require("../models/ProcessedResume");

const NLP_SERVICE_BASE =
  process.env.NLP_SERVICE_BASE || "http://127.0.0.1:8000";

async function processUploadedResume(userId, fileDoc) {
  try {
    console.log("[processUploadedResume] START", {
      userId,
      fileId: fileDoc && fileDoc._id && fileDoc._id.toString(),
      filePath: fileDoc && fileDoc.filePath,
    });

    if (!fileDoc || !fileDoc.filePath) {
      console.error("[processUploadedResume] Missing filePath on fileDoc");
      return;
    }

    // filePath is already an absolute URL
    const fileUrl = fileDoc.filePath;

    const nlpResp = await axios.post(
      `${NLP_SERVICE_BASE}/process-resume`,
      {
        source_type: "uploaded_pdf",   // IMPORTANT: must match FastAPI check
        file_url: fileUrl,
        user_id: userId,
      },
      {
        timeout: 240000, // allow up to 4 minutes for first-time model download
      }
    );

    console.log(
      "[processUploadedResume] NLP response OK - keys:",
      Object.keys(nlpResp.data)
    );

    const { scoring_text, structured, markdown } = nlpResp.data;

    const processed = new ProcessedResume({
      userId,
      sourceType: "uploaded_pdf",
      resumeDocId: null,
      uploadedFileId: fileDoc._id,
      fileUrl,
      scoringText: scoring_text,
      structured,
      markdown,
      rawText: structured?.raw_text || scoring_text,
    });

    await processed.save();
    console.log(
      "[processUploadedResume] Saved ProcessedResume",
      processed._id.toString()
    );
  } catch (err) {
    console.error(
      "[processUploadedResume] ERROR",
      err?.response?.data || err.message || err
    );
  }
}

module.exports = { processUploadedResume };