// server/models/Interview.js
const mongoose = require("mongoose");

const AnswerSchema = new mongoose.Schema(
  {
    questionId: Number,
    question: String,
    skill: String,
    type: String,
    difficulty: String,

    answerText: String,
    transcriptText: String,
    audioPath: String,

    timeTakenSec: Number,
    tabSwitchCount: { type: Number, default: 0 },
    pasteCount: { type: Number, default: 0 },
    hiddenTimeMs: { type: Number, default: 0 },

    // VOICE: "text" or "voice" — stored so recruiter can see how candidate answered
    answerMode: { type: String, enum: ["text", "voice"], default: "text" },

    score: Number,
    feedback: String,
    grading: mongoose.Schema.Types.Mixed,
    aiAnalysis: mongoose.Schema.Types.Mixed,
    cheatingRisk: { type: Number, default: 0 },
  },
  { _id: false }
);

const QuestionSchema = new mongoose.Schema(
  {
    questionId: Number,
    question: String,
    skill: String,
    type: String,
    difficulty: String,
  },
  { _id: false }
);

const InterviewSchema = new mongoose.Schema(
  {
    applicationId: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true, index: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    contextSnapshot: {
      jobTitle: String,
      jobDescription: String,
      mustHaveSkills: [String],
      niceToHaveSkills: [String],
      candidateSkills: [String],
      matchedSkills: [String],
      missingSkills: [String],
      weights: {
        jobDescriptionAndRequirements: Number,
        candidateSkills: Number,
      },
    },

    questions: [QuestionSchema],
    answers: [AnswerSchema],

    overallScore: Number,
    finalCheatingRisk: Number,

    status: { type: String, enum: ["generated", "in_progress", "completed"], default: "generated" },
    startedAt: Date,
    completedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Interview", InterviewSchema);