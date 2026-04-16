// server/models/MockSession.js
const mongoose = require("mongoose");

const mockQuestionSchema = new mongoose.Schema(
  {
    index: { type: Number, required: true }, // 0..N-1
    question: { type: String, required: true },
    skillTag: { type: String, default: "" },
    difficulty: { type: String, default: "Medium" }, // Easy/Medium/Hard/Adaptive
    answer: { type: String, default: "" },

    evaluation: {
      score: { type: Number, default: null }, // 0..10
      strengths: { type: [String], default: [] },
      weaknesses: { type: [String], default: [] },
      missingKeywords: { type: [String], default: [] },
      suggestion: { type: String, default: "" },
      idealAnswer: { type: String, default: "" },
    },
  },
  { _id: false }
);

const mockSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    // structured inputs
    role: { type: String, required: true },
    level: { type: String, required: true }, // Junior/Mid/Senior
    interviewType: { type: String, required: true }, // Technical/HR/Mixed/System Design
    skills: { type: [String], default: [] },
    difficulty: { type: String, default: "Medium" }, // Easy/Medium/Hard/Adaptive
    mode: { type: String, enum: ["text", "voice"], default: "text" },

    // state
    status: { type: String, enum: ["active", "completed"], default: "active" },
    currentIndex: { type: Number, default: 0 },

    // questions + answers + evaluations
    questions: { type: [mockQuestionSchema], default: [] },

    // analytics snapshot
    overallScore: { type: Number, default: null }, // 0..100
    skillBreakdown: { type: Object, default: {} }, // { "React": 78, ... }
    communicationScore: { type: Number, default: null }, // optional future
    technicalScore: { type: Number, default: null }, // optional future
  },
  { timestamps: true }
);

module.exports = mongoose.model("MockSession", mockSessionSchema);
