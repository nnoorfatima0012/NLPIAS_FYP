// // server/controllers/interviewController.js
// const mongoose = require("mongoose");
// const Application = require("../models/Application");
// const ProcessedResume = require("../models/ProcessedResume");
// const Interview = require("../models/Interview");
// const { generateQuestions, evaluateAnswer } = require("../utils/nlpInterviewClient");

// function cleanHtmlToText(html = "") {
//   return String(html).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
// }

// function canStartServer(chosenDate) {
//   const scheduledAt = chosenDate ? new Date(chosenDate) : null;
//   if (!scheduledAt || Number.isNaN(scheduledAt.getTime())) return false;
//   const now = new Date();
//   const diffMs = now.getTime() - scheduledAt.getTime();
//   return diffMs >= -10 * 60 * 1000 && diffMs <= 15 * 60 * 1000;
// }

// exports.getStatus = async (req, res) => {
//   try {
//     const userId = req.user?.id || req.user?._id;
//     const { appId } = req.params;
//     if (!mongoose.Types.ObjectId.isValid(appId))
//       return res.status(400).json({ message: "Invalid application id" });
//     const interview = await Interview.findOne({ applicationId: appId, candidateId: userId })
//       .select("status answers questions overallScore finalCheatingRisk completedAt")
//       .lean();
//     if (!interview) return res.json({ status: "none" });
//     return res.json({
//       status: interview.status,
//       answeredCount: (interview.answers || []).length,
//       totalCount: (interview.questions || []).length,
//       overallScore: interview.overallScore ?? null,
//       finalCheatingRisk: interview.finalCheatingRisk ?? null,
//       completedAt: interview.completedAt ?? null,
//     });
//   } catch (err) {
//     console.error("getStatus error:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

// exports.getResult = async (req, res) => {
//   try {
//     const userId = req.user?.id || req.user?._id;
//     const { appId } = req.params;
//     if (!mongoose.Types.ObjectId.isValid(appId))
//       return res.status(400).json({ message: "Invalid application id" });
//     const interview = await Interview.findOne({
//       applicationId: appId, candidateId: userId, status: "completed",
//     }).select("overallScore finalCheatingRisk completedAt status").lean();
//     if (!interview) return res.status(404).json({ message: "No completed interview found." });
//     return res.json({
//       overallScore: interview.overallScore,
//       finalCheatingRisk: interview.finalCheatingRisk,
//       completedAt: interview.completedAt,
//     });
//   } catch (err) {
//     console.error("getResult error:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

// exports.startInterview = async (req, res) => {
//   try {
//     const userId = req.user?.id || req.user?._id;
//     const { appId } = req.params;
//     if (!mongoose.Types.ObjectId.isValid(appId))
//       return res.status(400).json({ message: "Invalid application id" });

//     const app = await Application.findById(appId)
//       .populate({ path: "job", select: "title description skillsRequired rateSkills experience qualification careerLevel" })
//       .lean();
//     if (!app) return res.status(404).json({ message: "Application not found" });
//     if (String(app.candidate) !== String(userId)) return res.status(403).json({ message: "Forbidden" });
//     if (app.status !== "InterviewConfirmed" || !app.chosenDate)
//       return res.status(400).json({ message: "Interview not confirmed yet." });
//     if (!canStartServer(app.chosenDate)) {
//       const diffMs = new Date().getTime() - new Date(app.chosenDate).getTime();
//       if (diffMs > 15 * 60 * 1000)
//         return res.status(403).json({ message: "Interview window has expired.", expired: true });
//       return res.status(403).json({ message: "Interview can only start within 10 minutes of scheduled time." });
//     }

//     const existing = await Interview.findOne({
//       applicationId: appId, candidateId: userId, status: { $ne: "completed" },
//     }).lean();
//     if (existing) {
//       return res.json({
//         interviewId: existing._id, questions: existing.questions,
//         answers: existing.answers || [], status: existing.status,
//       });
//     }

//     const job = app.job;
//     if (!job) return res.status(404).json({ message: "Job not found" });
//     const jobDescription = cleanHtmlToText(job.description || "");
//     const jobSkills = job.skillsRequired || [];
//     const rateSkills = job.rateSkills || {};
//     const mustHaveSkills = [], niceToHaveSkills = [];
//     jobSkills.forEach((skill) => {
//       const keyVariants = [skill, skill.replace(/\s+/g, "_"), skill.replace(/[^a-zA-Z0-9]/g, "_")];
//       let rating = "Nice to Have";
//       for (const k of keyVariants) { if (rateSkills[k]) { rating = rateSkills[k]; break; } }
//       (rating === "Must Have" ? mustHaveSkills : niceToHaveSkills).push(skill);
//     });

//     let candidateSkills = [];
//     if (app.matchBreakdown?.candidate_skills && typeof app.matchBreakdown.candidate_skills === "object")
//       candidateSkills = Object.keys(app.matchBreakdown.candidate_skills);
//     if (candidateSkills.length === 0) {
//       const processed = await ProcessedResume.findOne({ userId: String(app.candidate) })
//         .sort({ createdAt: -1 }).lean();
//       if (processed?.structured?.skills?.length) candidateSkills = processed.structured.skills;
//     }

//     const jobLower = jobSkills.map((s) => s.toLowerCase());
//     const candLower = candidateSkills.map((s) => s.toLowerCase());
//     const matchedSkills = candidateSkills.filter((s) =>
//       jobLower.some((js) => js.includes(s.toLowerCase()) || s.toLowerCase().includes(js))
//     );
//     const missingSkills = jobSkills.filter((s) =>
//       !candLower.some((cs) => cs.includes(s.toLowerCase()) || s.toLowerCase().includes(cs))
//     );

//     const contextSnapshot = {
//       jobTitle: job.title, jobDescription, mustHaveSkills, niceToHaveSkills,
//       candidateSkills, matchedSkills, missingSkills,
//       weights: { jobDescriptionAndRequirements: 0.7, candidateSkills: 0.3 },
//     };
//     const ai = await generateQuestions({
//       ...contextSnapshot,
//       jobRequirements: { experience: job.experience, qualification: job.qualification, careerLevel: job.careerLevel },
//       questionCount: 8,
//     });
//     const interview = await Interview.create({
//       applicationId: appId, jobId: job._id, candidateId: userId,
//       contextSnapshot, questions: ai.questions || [], answers: [],
//       status: "in_progress", startedAt: new Date(),
//     });
//     return res.json({
//       interviewId: interview._id, questions: interview.questions,
//       answers: [], status: interview.status,
//     });
//   } catch (err) {
//     console.error("startInterview error:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

// // ── VOICE: answerMode, voiceEditRatio, voiceWordsPerSec extracted from body
// //    and forwarded to NLP evaluator inside meta. Score is unchanged.
// //    Only cheatingRisk is adjusted on the Python side for voice signals.
// exports.submitAnswer = async (req, res) => {
//   try {
//     const userId = req.user?.id || req.user?._id;
//     const { interviewId } = req.params;
//     const {
//       questionId,
//       answerText,
//       timeTakenSec,
//       tabSwitchCount,
//       pasteCount,
//       hiddenTimeMs,
//       // VOICE: extra integrity fields (null/undefined for text answers — safe to pass)
//       answerMode,
//       voiceEditRatio,
//       voiceWordsPerSec,
//     } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(interviewId))
//       return res.status(400).json({ message: "Invalid interview id" });
//     const interview = await Interview.findById(interviewId);
//     if (!interview) return res.status(404).json({ message: "Interview not found" });
//     if (String(interview.candidateId) !== String(userId)) return res.status(403).json({ message: "Forbidden" });
//     if (interview.status === "completed") return res.status(400).json({ message: "Interview already completed" });

//     const q = interview.questions.find((x) => x.questionId === Number(questionId));
//     if (!q) return res.status(404).json({ message: "Question not found" });
//     const alreadyAnswered = interview.answers.some((a) => Number(a.questionId) === Number(questionId));
//     if (alreadyAnswered) return res.status(409).json({ message: "Question already answered." });

//     // Build meta — voice signals included so NLP Python can adjust cheatingRisk
//     const meta = {
//       timeTakenSec,
//       tabSwitchCount,
//       pasteCount,
//       hiddenTimeMs,
//       answerMode: answerMode || "text",
//       voiceEditRatio: voiceEditRatio ?? null,
//       voiceWordsPerSec: voiceWordsPerSec ?? null,
//     };

//     const evalResp = await evaluateAnswer({
//       question: q.question,
//       skill: q.skill,
//       jobTitle: interview.contextSnapshot?.jobTitle,
//       jobDescription: interview.contextSnapshot?.jobDescription,
//       mustHaveSkills: interview.contextSnapshot?.mustHaveSkills || [],
//       candidateSkills: interview.contextSnapshot?.candidateSkills || [],
//       answer: answerText,
//       meta,
//     });

//     interview.answers.push({
//       questionId: q.questionId, question: q.question, skill: q.skill,
//       type: q.type, difficulty: q.difficulty, answerText,
//       timeTakenSec, tabSwitchCount, pasteCount, hiddenTimeMs,
//       answerMode: answerMode || "text",   // VOICE: stored for recruiter visibility
//       score: evalResp.score,
//       feedback: evalResp.feedback,
//       grading: evalResp.grading || {},
//       aiAnalysis: evalResp.aiAnalysis || evalResp,
//       cheatingRisk: evalResp.cheatingRisk || 0,
//     });

//     await interview.save();
//     return res.json({
//   score: evalResp.score,
//   feedback: evalResp.feedback,
//   grading: evalResp.grading || {},
//   aiAnalysis: evalResp.aiAnalysis || {},
//   cheatingRisk: evalResp.cheatingRisk || 0,
// });
//   } catch (err) {
//     console.error("submitAnswer error:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

// exports.completeInterview = async (req, res) => {
//   try {
//     const userId = req.user?.id || req.user?._id;
//     const { interviewId } = req.params;
//     const interview = await Interview.findById(interviewId);
//     if (!interview) return res.status(404).json({ message: "Interview not found" });
//     if (String(interview.candidateId) !== String(userId)) return res.status(403).json({ message: "Forbidden" });

//     const scores = interview.answers.map((a) => Number(a.score || 0));
//     const overallScore = scores.length ? scores.reduce((x, y) => x + y, 0) / scores.length : 0;
//     const finalCheatingRisk = interview.answers.length
//       ? interview.answers.reduce((acc, a) => acc + (a.cheatingRisk || 0), 0) / interview.answers.length : 0;

//     interview.overallScore = Number(overallScore.toFixed(2));
//     interview.finalCheatingRisk = Number(finalCheatingRisk.toFixed(2));
//     interview.status = "completed";
//     interview.completedAt = new Date();
//     await interview.save();

//     await Application.findByIdAndUpdate(interview.applicationId, {
//       interviewCompletedAt: new Date(), interviewStatus: "completed",
//     });
//     return res.json({
//       overallScore: interview.overallScore,
//       finalCheatingRisk: interview.finalCheatingRisk,
//       status: interview.status,
//     });
//   } catch (err) {
//     console.error("completeInterview error:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// };

// // // server/controllers/interviewController.js
const mongoose = require("mongoose");
const Application = require("../models/Application");
const ProcessedResume = require("../models/ProcessedResume");
const Interview = require("../models/Interview");
const { interviewQueue } = require("../queue/interviewQueue");

function cleanHtmlToText(html = "") {
  return String(html)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function canStartServer(chosenDate) {
  const scheduledAt = chosenDate ? new Date(chosenDate) : null;
  if (!scheduledAt || Number.isNaN(scheduledAt.getTime())) return false;
  const now = new Date();
  const diffMs = now.getTime() - scheduledAt.getTime();
  return diffMs >= -10 * 60 * 1000 && diffMs <= 15 * 60 * 1000;
}

exports.getStatus = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { appId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(appId)) {
      return res.status(400).json({ message: "Invalid application id" });
    }

    const interview = await Interview.findOne({
      applicationId: appId,
      candidateId: userId,
    })
      .sort({ createdAt: -1 })
      .select(
        "status answers questions overallScore finalCheatingRisk completedAt generationStatus generationJobId lastAnswerEvaluationStatus lastAnswerEvaluationError",
      )
      .lean();

    if (!interview) {
      return res.json({
        status: "none",
        generationStatus: "not_started",
        interviewId: null,
        questions: [],
        answers: [],
      });
    }

    return res.json({
      interviewId: interview._id,
      status: interview.status,
      generationStatus: interview.generationStatus || "idle",
      generationJobId: interview.generationJobId || null,
      lastAnswerEvaluationStatus:
        interview.lastAnswerEvaluationStatus || "idle",
      lastAnswerEvaluationError: interview.lastAnswerEvaluationError || null,
      answeredCount: (interview.answers || []).length,
      totalCount: (interview.questions || []).length,
      questions: interview.questions || [],
      answers: interview.answers || [],
      overallScore: interview.overallScore ?? null,
      finalCheatingRisk: interview.finalCheatingRisk ?? null,
      completedAt: interview.completedAt ?? null,
    });
  } catch (err) {
    console.error("getStatus error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getResult = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { appId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(appId))
      return res.status(400).json({ message: "Invalid application id" });

    const interview = await Interview.findOne({
      applicationId: appId,
      candidateId: userId,
      status: "completed",
    })
      .select("overallScore finalCheatingRisk completedAt status")
      .lean();

    if (!interview)
      return res.status(404).json({ message: "No completed interview found." });

    return res.json({
      overallScore: interview.overallScore,
      finalCheatingRisk: interview.finalCheatingRisk,
      completedAt: interview.completedAt,
    });
  } catch (err) {
    console.error("getResult error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.startInterview = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { appId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(appId))
      return res.status(400).json({ message: "Invalid application id" });

    const app = await Application.findById(appId)
      .populate({
        path: "job",
        select:
          "title description skillsRequired rateSkills experience qualification careerLevel",
      })
      .lean();

    if (!app) return res.status(404).json({ message: "Application not found" });
    if (String(app.candidate) !== String(userId))
      return res.status(403).json({ message: "Forbidden" });
    if (app.status !== "InterviewConfirmed" || !app.chosenDate)
      return res.status(400).json({ message: "Interview not confirmed yet." });

    if (!canStartServer(app.chosenDate)) {
      const diffMs = new Date().getTime() - new Date(app.chosenDate).getTime();
      if (diffMs > 15 * 60 * 1000)
        return res
          .status(403)
          .json({ message: "Interview window has expired.", expired: true });

      return res.status(403).json({
        message:
          "Interview can only start within 10 minutes of scheduled time.",
      });
    }

    let existing = await Interview.findOne({
      applicationId: appId,
      candidateId: userId,
      status: { $ne: "completed" },
    }).sort({ createdAt: -1 });

    if (existing) {
      return res.json({
        interviewId: existing._id,
        questions: existing.questions || [],
        answers: existing.answers || [],
        status: existing.status,
        generationStatus: existing.generationStatus,
      });
    }

    const job = app.job;
    if (!job) return res.status(404).json({ message: "Job not found" });

    const jobDescription = cleanHtmlToText(job.description || "");
    const jobSkills = job.skillsRequired || [];
    const rateSkills = job.rateSkills || {};
    const mustHaveSkills = [];
    const niceToHaveSkills = [];

    jobSkills.forEach((skill) => {
      const keyVariants = [
        skill,
        skill.replace(/\s+/g, "_"),
        skill.replace(/[^a-zA-Z0-9]/g, "_"),
      ];
      let rating = "Nice to Have";
      for (const k of keyVariants) {
        if (rateSkills[k]) {
          rating = rateSkills[k];
          break;
        }
      }
      (rating === "Must Have" ? mustHaveSkills : niceToHaveSkills).push(skill);
    });

    let candidateSkills = [];
    if (
      app.matchBreakdown?.candidate_skills &&
      typeof app.matchBreakdown.candidate_skills === "object"
    )
      candidateSkills = Object.keys(app.matchBreakdown.candidate_skills);

    if (candidateSkills.length === 0) {
      const processed = await ProcessedResume.findOne({
        userId: String(app.candidate),
      })
        .sort({ createdAt: -1 })
        .lean();

      if (processed?.structured?.skills?.length) {
        candidateSkills = processed.structured.skills;
      }
    }

    const jobLower = jobSkills.map((s) => s.toLowerCase());
    const candLower = candidateSkills.map((s) => s.toLowerCase());

    const matchedSkills = candidateSkills.filter((s) =>
      jobLower.some(
        (js) => js.includes(s.toLowerCase()) || s.toLowerCase().includes(js),
      ),
    );

    const missingSkills = jobSkills.filter(
      (s) =>
        !candLower.some(
          (cs) => cs.includes(s.toLowerCase()) || s.toLowerCase().includes(cs),
        ),
    );

    const contextSnapshot = {
      jobTitle: job.title,
      jobDescription,
      mustHaveSkills,
      niceToHaveSkills,
      candidateSkills,
      matchedSkills,
      missingSkills,
      weights: {
        jobDescriptionAndRequirements: 0.7,
        candidateSkills: 0.3,
      },
    };

    const interview = await Interview.create({
      applicationId: appId,
      jobId: job._id,
      candidateId: userId,
      contextSnapshot,
      questions: [],
      answers: [],
      status: "generated",
      generationStatus: "pending",
    });

    const payload = {
      ...contextSnapshot,
      jobRequirements: {
        experience: job.experience,
        qualification: job.qualification,
        careerLevel: job.careerLevel,
      },
      questionCount: 8,
    };

    const queueJob = await interviewQueue.add("generate_questions", {
      type: "generate_questions",
      interviewId: String(interview._id),
      payload,
    });

    interview.generationJobId = String(queueJob.id);
    await interview.save();

    return res.json({
      interviewId: interview._id,
      questions: [],
      answers: [],
      status: interview.status,
      generationStatus: interview.generationStatus,
    });
  } catch (err) {
    console.error("startInterview error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.submitAnswer = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { interviewId } = req.params;
    const {
      questionId,
      answerText,
      timeTakenSec,
      tabSwitchCount,
      pasteCount,
      hiddenTimeMs,
      answerMode,
      voiceEditRatio,
      voiceWordsPerSec,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(interviewId))
      return res.status(400).json({ message: "Invalid interview id" });

    const interview = await Interview.findById(interviewId);
    if (!interview)
      return res.status(404).json({ message: "Interview not found" });
    if (String(interview.candidateId) !== String(userId))
      return res.status(403).json({ message: "Forbidden" });
    if (interview.status === "completed")
      return res.status(400).json({ message: "Interview already completed" });

    const q = interview.questions.find(
      (x) => x.questionId === Number(questionId),
    );
    if (!q) return res.status(404).json({ message: "Question not found" });

    const alreadyAnswered = interview.answers.some(
      (a) => Number(a.questionId) === Number(questionId),
    );
    if (alreadyAnswered)
      return res.status(409).json({ message: "Question already answered." });

    interview.lastAnswerEvaluationStatus = "pending";
    interview.lastAnswerEvaluationError = null;
    await interview.save();

    const answerMeta = {
      timeTakenSec,
      tabSwitchCount,
      pasteCount,
      hiddenTimeMs,
      answerMode: answerMode || "text",
      voiceEditRatio: voiceEditRatio ?? null,
      voiceWordsPerSec: voiceWordsPerSec ?? null,
    };

    const queueJob = await interviewQueue.add("evaluate_answer", {
      type: "evaluate_answer",
      interviewId: String(interview._id),
      answerPayload: {
        questionId,
        answerText,
      },
      answerMeta,
    });

    interview.lastAnswerEvaluationJobId = String(queueJob.id);
    await interview.save();

    return res.json({
      queued: true,
      questionId: Number(questionId),
      evaluationStatus: "pending",
      jobId: String(queueJob.id),
    });
  } catch (err) {
    console.error("submitAnswer error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.getAnswerStatus = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { interviewId, questionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(interviewId)) {
      return res.status(400).json({ message: "Invalid interview id" });
    }

    const interview = await Interview.findById(interviewId).lean();
    if (!interview)
      return res.status(404).json({ message: "Interview not found" });
    if (String(interview.candidateId) !== String(userId))
      return res.status(403).json({ message: "Forbidden" });

    const answer = (interview.answers || []).find(
      (a) => Number(a.questionId) === Number(questionId),
    );

    if (answer) {
      return res.json({
        status: "completed",
        score: answer.score,
        feedback: answer.feedback,
        grading: answer.grading || {},
        aiAnalysis: answer.aiAnalysis || {},
        cheatingRisk: answer.cheatingRisk || 0,
      });
    }

    return res.json({
      status: interview.lastAnswerEvaluationStatus || "idle",
      error: interview.lastAnswerEvaluationError || null,
    });
  } catch (err) {
    console.error("getAnswerStatus error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.completeInterview = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { interviewId } = req.params;

    const interview = await Interview.findById(interviewId);
    if (!interview)
      return res.status(404).json({ message: "Interview not found" });
    if (String(interview.candidateId) !== String(userId))
      return res.status(403).json({ message: "Forbidden" });

    const scores = interview.answers.map((a) => Number(a.score || 0));
    const overallScore = scores.length
      ? scores.reduce((x, y) => x + y, 0) / scores.length
      : 0;

    const finalCheatingRisk = interview.answers.length
      ? interview.answers.reduce((acc, a) => acc + (a.cheatingRisk || 0), 0) /
        interview.answers.length
      : 0;

    interview.overallScore = Number(overallScore.toFixed(2));
    interview.finalCheatingRisk = Number(finalCheatingRisk.toFixed(2));
    interview.status = "completed";
    interview.completedAt = new Date();
    await interview.save();

    await Application.findByIdAndUpdate(interview.applicationId, {
      interviewCompletedAt: new Date(),
      interviewStatus: "completed",
    });

    return res.json({
      overallScore: interview.overallScore,
      finalCheatingRisk: interview.finalCheatingRisk,
      status: interview.status,
    });
  } catch (err) {
    console.error("completeInterview error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};
