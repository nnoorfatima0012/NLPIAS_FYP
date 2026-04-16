// server/models/ProcessedResume.js
const mongoose = require("mongoose");

const ProcessedResumeSchema = new mongoose.Schema(

  {
    userId: {
  type: String,
  required: true,
  index: true,
},
    // link to your Resume document (builder form)
    resumeDocId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      required: false,
      index: true,
    },

    // link to one entry inside Resume.uploadedFiles for uploaded PDFs
    uploadedFileId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      index: true,
    },

    // "builder_form" or "uploaded_pdf"
    sourceType: {
      type: String,
      enum: ["builder_form", "uploaded_pdf"],
      required: true,
    },

    // text used for JD/Resume matching later
    scoringText: {
      type: String,
      required: true,
    },

    // clean, structured object returned from your pipeline
    structured: {
      type: Object,
      required: true,
    },

    // optional – for preview / exporting
    markdown: {
      type: String,
    },
    fileUrl: { type: String },
rawText: { type: String },

  },
  {
    timestamps: true,
  }
);

// helpful uniqueness: one processed builder resume per user
ProcessedResumeSchema.index(
  { userId: 1, sourceType: 1, uploadedFileId: 1 },
  { unique: true, sparse: true }
);

module.exports = mongoose.model("ProcessedResume", ProcessedResumeSchema);
