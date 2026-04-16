// server/controllers/transcribeController.js
const fs = require("fs");
const { transcribeAudio } = require("../utils/groqWhisperClient");

const MAX_FILE_MB = 25;

exports.transcribe = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No audio file uploaded." });
  }

  const filePath = req.file.path;
  const fileSizeMB = req.file.size / (1024 * 1024);

  try {
    if (fileSizeMB > MAX_FILE_MB) {
      return res.status(400).json({ message: `Audio file too large (max ${MAX_FILE_MB} MB).` });
    }

    const mimeType = req.file.mimetype || "audio/webm";
    const { text, duration_sec } = await transcribeAudio(filePath, mimeType);
    const transcript = (text || "").trim();

    return res.json({
      transcript,
      duration_sec: duration_sec ?? null,
      word_count: transcript ? transcript.split(/\s+/).filter(Boolean).length : 0,
    });
  } catch (err) {
    console.error("Transcription error:", err?.response?.data || err.message);
    return res.status(500).json({ message: "Transcription failed. Please try again." });
  } finally {
    fs.unlink(filePath, (unlinkErr) => {
      if (unlinkErr) console.warn("Failed to delete temp audio file:", unlinkErr.message);
    });
  }
};