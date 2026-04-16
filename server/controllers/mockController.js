// // server/controllers/mockController.js
// const MockSession = require("../models/MockSession");
// const { generateMockQuestionsWithGroq, evaluateMockAnswerWithGroq } = require("../services/mockGroqService");

// // simple helper: average question scores -> 0..100
// function calcOverallPercent(questions) {
//   const scores = (questions || [])
//     .map((q) => q?.evaluation?.score)
//     .filter((x) => typeof x === "number");
//   if (!scores.length) return null;
//   const avg10 = scores.reduce((a, b) => a + b, 0) / scores.length;
//   return Math.round((avg10 / 10) * 100);
// }

// function calcSkillBreakdown(questions) {
//   const bucket = {}; // skill -> [scores]
//   for (const q of questions || []) {
//     const s = q?.skillTag || "General";
//     const score = q?.evaluation?.score;
//     if (typeof score !== "number") continue;
//     if (!bucket[s]) bucket[s] = [];
//     bucket[s].push(score);
//   }

//   const out = {};
//   for (const [skill, arr] of Object.entries(bucket)) {
//     const avg10 = arr.reduce((a, b) => a + b, 0) / arr.length;
//     out[skill] = Math.round((avg10 / 10) * 100);
//   }
//   return out;
// }

// // POST /api/mock/start
// exports.startMock = async (req, res) => {
//   try {
//     const userId = req.user?.id || req.body.userId; // allow fallback if you don’t have auth middleware
//     const { role, level, interviewType, skills = [], difficulty = "Medium", mode = "text" } = req.body;

//     if (!userId || !role || !level || !interviewType) {
//       return res.status(400).json({ message: "userId, role, level, interviewType are required" });
//     }

//     const questionCount = 8;

//     const generated = await generateMockQuestionsWithGroq({
//       role,
//       level,
//       interviewType,
//       skills,
//       difficulty,
//       questionCount,
//     });

//     const questions = generated.slice(0, questionCount).map((q, idx) => ({
//       index: idx,
//       question: String(q.question || "").trim(),
//       skillTag: String(q.skillTag || "General").trim(),
//       difficulty: String(q.difficulty || difficulty).trim(),
//     }));

//     const session = await MockSession.create({
//       userId,
//       role,
//       level,
//       interviewType,
//       skills: Array.isArray(skills) ? skills : [],
//       difficulty,
//       mode,
//       status: "active",
//       currentIndex: 0,
//       questions,
//     });

//     return res.status(201).json({
//       sessionId: session._id.toString(),
//       session,
//     });
//   } catch (err) {
//     console.error("startMock error:", err);
//     return res.status(500).json({ message: "Failed to start mock session" });
//   }
// };

// // GET /api/mock/session/:sessionId
// exports.getSession = async (req, res) => {
//   try {
//     const { sessionId } = req.params;
//     const session = await MockSession.findById(sessionId).lean();
//     if (!session) return res.status(404).json({ message: "Session not found" });
//     return res.json(session);
//   } catch (err) {
//     console.error("getSession error:", err);
//     return res.status(500).json({ message: "Failed to fetch session" });
//   }
// };

// // POST /api/mock/answer
// // body: { sessionId, index, answer }
// exports.submitAnswer = async (req, res) => {
//   try {
//     const { sessionId, index, answer } = req.body;
//     if (!sessionId || typeof index !== "number" || !answer) {
//       return res.status(400).json({ message: "sessionId, index(number), answer are required" });
//     }

//     const session = await MockSession.findById(sessionId);
//     if (!session) return res.status(404).json({ message: "Session not found" });
//     if (session.status !== "active") return res.status(400).json({ message: "Session is not active" });

//     const q = session.questions.find((x) => x.index === index);
//     if (!q) return res.status(404).json({ message: "Question not found" });

//     q.answer = String(answer).trim();

//     const evalResult = await evaluateMockAnswerWithGroq({
//       role: session.role,
//       level: session.level,
//       interviewType: session.interviewType,
//       difficulty: q.difficulty || session.difficulty,
//       skillTag: q.skillTag,
//       question: q.question,
//       answer: q.answer,
//     });

//     q.evaluation = {
//       score: Math.max(0, Math.min(10, Number(evalResult.score ?? 0))),
//       strengths: Array.isArray(evalResult.strengths) ? evalResult.strengths : [],
//       weaknesses: Array.isArray(evalResult.weaknesses) ? evalResult.weaknesses : [],
//       missingKeywords: Array.isArray(evalResult.missingKeywords) ? evalResult.missingKeywords : [],
//       suggestion: String(evalResult.suggestion || ""),
//       idealAnswer: String(evalResult.idealAnswer || ""),
//     };

//     // adaptive difficulty: only if session difficulty is "Adaptive"
//     const hint = String(evalResult.nextDifficultyHint || "Medium");
//     if ((session.difficulty || "").toLowerCase() === "adaptive") {
//       // apply hint to NEXT question (if exists)
//       const next = session.questions.find((x) => x.index === index + 1);
//       if (next && hint) next.difficulty = hint;
//     }

//     // advance pointer
//     session.currentIndex = Math.min(index + 1, session.questions.length - 1);

//     await session.save();

//     return res.json({
//       ok: true,
//       evaluation: q.evaluation,
//       nextDifficultyHint: hint,
//       session,
//     });
//   } catch (err) {
//     console.error("submitAnswer error:", err);
//     return res.status(500).json({ message: "Failed to evaluate answer" });
//   }
// };

// // POST /api/mock/finish
// // body: { sessionId }
// exports.finishMock = async (req, res) => {
//   try {
//     const { sessionId } = req.body;
//     if (!sessionId) return res.status(400).json({ message: "sessionId is required" });

//     const session = await MockSession.findById(sessionId);
//     if (!session) return res.status(404).json({ message: "Session not found" });

//     session.status = "completed";
//     session.overallScore = calcOverallPercent(session.questions);
//     session.skillBreakdown = calcSkillBreakdown(session.questions);

//     await session.save();

//     return res.json({ ok: true, session });
//   } catch (err) {
//     console.error("finishMock error:", err);
//     return res.status(500).json({ message: "Failed to finish session" });
//   }
// };

// // GET /api/mock/analytics?userId=...
// exports.getMockAnalytics = async (req, res) => {
//   try {
//     const userId = req.user?.id || req.query.userId;
//     if (!userId) return res.status(400).json({ message: "userId is required" });

//     const sessions = await MockSession.find({ userId, status: "completed" })
//       .sort({ createdAt: -1 })
//       .limit(20)
//       .lean();

//     // simple aggregated role averages
//     const roleBucket = {};
//     for (const s of sessions) {
//       if (typeof s.overallScore !== "number") continue;
//       const key = `${s.role}__${s.level}`;
//       if (!roleBucket[key]) roleBucket[key] = [];
//       roleBucket[key].push(s.overallScore);
//     }

//     const roleAverages = Object.entries(roleBucket).map(([k, arr]) => {
//       const [role, level] = k.split("__");
//       const avg = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
//       return { role, level, avgScore: avg };
//     });

//     return res.json({ sessions, roleAverages });
//   } catch (err) {
//     console.error("getMockAnalytics error:", err);
//     return res.status(500).json({ message: "Failed to load analytics" });
//   }
// };


const mongoose = require("mongoose");
const MockSession = require("../models/MockSession");
const {
  generateMockQuestionsWithGroq,
  evaluateMockAnswerWithGroq,
} = require("../services/mockGroqService");

function getAuthUserId(req) {
  return req.user?.id || null;
}

function calcOverallPercent(questions) {
  const scores = (questions || [])
    .map((q) => q?.evaluation?.score)
    .filter((x) => typeof x === "number");
  if (!scores.length) return null;
  const avg10 = scores.reduce((a, b) => a + b, 0) / scores.length;
  return Math.round((avg10 / 10) * 100);
}

function calcSkillBreakdown(questions) {
  const bucket = {};
  for (const q of questions || []) {
    const s = q?.skillTag || "General";
    const score = q?.evaluation?.score;
    if (typeof score !== "number") continue;
    if (!bucket[s]) bucket[s] = [];
    bucket[s].push(score);
  }

  const out = {};
  for (const [skill, arr] of Object.entries(bucket)) {
    const avg10 = arr.reduce((a, b) => a + b, 0) / arr.length;
    out[skill] = Math.round((avg10 / 10) * 100);
  }
  return out;
}

// POST /api/mock/start
exports.startMock = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const {
      role,
      level,
      interviewType,
      skills = [],
      difficulty = "Medium",
      mode = "text",
    } = req.body;

    if (!userId || !role || !level || !interviewType) {
      return res
        .status(400)
        .json({ message: "role, level, interviewType are required" });
    }

    const questionCount = 8;

    const generated = await generateMockQuestionsWithGroq({
      role,
      level,
      interviewType,
      skills,
      difficulty,
      questionCount,
    });

    const questions = generated.slice(0, questionCount).map((q, idx) => ({
      index: idx,
      question: String(q.question || "").trim(),
      skillTag: String(q.skillTag || "General").trim(),
      difficulty: String(q.difficulty || difficulty).trim(),
    }));

    const session = await MockSession.create({
      userId,
      role,
      level,
      interviewType,
      skills: Array.isArray(skills) ? skills : [],
      difficulty,
      mode,
      status: "active",
      currentIndex: 0,
      questions,
    });

    return res.status(201).json({
      sessionId: session._id.toString(),
      session,
    });
  } catch (err) {
    console.error("startMock error:", err);
    return res.status(500).json({ message: "Failed to start mock session" });
  }
};

// GET /api/mock/session/:sessionId
exports.getSession = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { sessionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: "Invalid session id" });
    }

    const session = await MockSession.findById(sessionId).lean();
    if (!session) return res.status(404).json({ message: "Session not found" });

    if (String(session.userId) !== String(userId) && req.user?.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    return res.json(session);
  } catch (err) {
    console.error("getSession error:", err);
    return res.status(500).json({ message: "Failed to fetch session" });
  }
};

// POST /api/mock/answer
exports.submitAnswer = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { sessionId, index, answer } = req.body;

    if (!sessionId || typeof index !== "number" || !answer) {
      return res
        .status(400)
        .json({ message: "sessionId, index(number), answer are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: "Invalid session id" });
    }

    const session = await MockSession.findById(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });

    if (String(session.userId) !== String(userId) && req.user?.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    if (session.status !== "active") {
      return res.status(400).json({ message: "Session is not active" });
    }

    const q = session.questions.find((x) => x.index === index);
    if (!q) return res.status(404).json({ message: "Question not found" });

    q.answer = String(answer).trim();

    const evalResult = await evaluateMockAnswerWithGroq({
      role: session.role,
      level: session.level,
      interviewType: session.interviewType,
      difficulty: q.difficulty || session.difficulty,
      skillTag: q.skillTag,
      question: q.question,
      answer: q.answer,
    });

    q.evaluation = {
      score: Math.max(0, Math.min(10, Number(evalResult.score ?? 0))),
      strengths: Array.isArray(evalResult.strengths) ? evalResult.strengths : [],
      weaknesses: Array.isArray(evalResult.weaknesses) ? evalResult.weaknesses : [],
      missingKeywords: Array.isArray(evalResult.missingKeywords)
        ? evalResult.missingKeywords
        : [],
      suggestion: String(evalResult.suggestion || ""),
      idealAnswer: String(evalResult.idealAnswer || ""),
    };

    const hint = String(evalResult.nextDifficultyHint || "Medium");
    if ((session.difficulty || "").toLowerCase() === "adaptive") {
      const next = session.questions.find((x) => x.index === index + 1);
      if (next && hint) next.difficulty = hint;
    }

    session.currentIndex = Math.min(index + 1, session.questions.length - 1);

    await session.save();

    return res.json({
      ok: true,
      evaluation: q.evaluation,
      nextDifficultyHint: hint,
      session,
    });
  } catch (err) {
    console.error("submitAnswer error:", err);
    return res.status(500).json({ message: "Failed to evaluate answer" });
  }
};

// POST /api/mock/finish
exports.finishMock = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ message: "sessionId is required" });
    }

    if (!mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ message: "Invalid session id" });
    }

    const session = await MockSession.findById(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found" });

    if (String(session.userId) !== String(userId) && req.user?.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }

    session.status = "completed";
    session.overallScore = calcOverallPercent(session.questions);
    session.skillBreakdown = calcSkillBreakdown(session.questions);

    await session.save();

    return res.json({ ok: true, session });
  } catch (err) {
    console.error("finishMock error:", err);
    return res.status(500).json({ message: "Failed to finish session" });
  }
};

// GET /api/mock/analytics
exports.getMockAnalytics = async (req, res) => {
  try {
    const userId = getAuthUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const sessions = await MockSession.find({ userId, status: "completed" })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const roleBucket = {};
    for (const s of sessions) {
      if (typeof s.overallScore !== "number") continue;
      const key = `${s.role}__${s.level}`;
      if (!roleBucket[key]) roleBucket[key] = [];
      roleBucket[key].push(s.overallScore);
    }

    const roleAverages = Object.entries(roleBucket).map(([k, arr]) => {
      const [role, level] = k.split("__");
      const avg = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
      return { role, level, avgScore: avg };
    });

    return res.json({ sessions, roleAverages });
  } catch (err) {
    console.error("getMockAnalytics error:", err);
    return res.status(500).json({ message: "Failed to load analytics" });
  }
};