// server/utils/groqWhisperClient.js
const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_WHISPER_URL = "https://api.groq.com/openai/v1/audio/transcriptions";

async function transcribeAudio(filePath, mimeType = "audio/webm") {
  if (!GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not set in server .env");
  }

  const form = new FormData();
  form.append("file", fs.createReadStream(filePath), {
    filename: "audio.webm",
    contentType: mimeType,
  });
  form.append("model", "whisper-large-v3");
  form.append("response_format", "verbose_json");
  form.append("language", "en");

  const { data } = await axios.post(GROQ_WHISPER_URL, form, {
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      ...form.getHeaders(),
    },
    timeout: 60_000,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });

  return {
    text: (data.text || "").trim(),
    duration_sec: typeof data.duration === "number" ? data.duration : null,
  };
}

module.exports = { transcribeAudio };