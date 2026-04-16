//server/models/Resume.js
const mongoose = require("mongoose");

const educationSchema = new mongoose.Schema({
  level: String,
  field: String,
  institution: String,
  fromYear: String,
  toYear: String,
  currentlyEnrolled: Boolean,
});

const experienceSchema = new mongoose.Schema({
  jobTitle: String,
  company: String,
  description: String,
  fromMonth: String,
  fromYear: String,
  toMonth: String,
  toYear: String,
  currentlyWorking: Boolean,
});

const certificationSchema = new mongoose.Schema({
  name: String,
  issuedBy: String,
  date: String,
});

const projectSchema = new mongoose.Schema({
  name: String,
  description: String,
  link: String,
  technologies: [String],
});

const languageSchema = new mongoose.Schema({
  language: String,
  level: String,
});

/** ✅ NEW: custom section schema */
const customSectionSchema = new mongoose.Schema(
  {
    title: String,
    content: String, // multiline text
  },
  { _id: false }
);

const resumeSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    personalDetails: {
      fullName: String,
      email: String,
      phone: String,
      address: String,
    },
    summary: String,
    education: [educationSchema],
    experience: [experienceSchema],
    certifications: [certificationSchema],
    projects: [projectSchema],
    languages: [languageSchema],
    skills: [String],

    /** ✅ NEW: custom sections */
    customSections: { type: [customSectionSchema], default: [] },

    templateId: { type: String, default: "classic" },
    themeColor: { type: String, default: "#111827" },
    viewModel: { type: mongoose.Schema.Types.Mixed, default: null },

    uploadedFiles: [
      {
        originalName: String,
        filePath: String,
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Resume", resumeSchema);
