//server/workers/interviewWorker.js
require("dotenv").config();
const mongoose = require("mongoose");
const { Worker } = require("bullmq");
const { connection } = require("../queue/redis");
const Interview = require("../models/Interview");
const Application = require("../models/Application");
const ProcessedResume = require("../models/ProcessedResume");
const { generateQuestions, evaluateAnswer } = require("../utils/nlpInterviewClient");

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Interview worker DB connected"))
  .catch((err) => {
    console.error("❌ Interview worker DB connection error:", err);
    process.exit(1);
  });

const worker = new Worker(
  "interview-processing",
  async (job) => {
    const { type } = job.data;

    if (type === "generate_questions") {
      const { interviewId, payload } = job.data;

      const interview = await Interview.findById(interviewId);
      if (!interview) throw new Error("Interview not found");

      interview.generationStatus = "pending";
      interview.generationJobId = String(job.id);
      await interview.save();

      try {
        const ai = await generateQuestions(payload);

        interview.questions = ai.questions || [];
        interview.generationStatus = "completed";
        interview.status = "in_progress";
        interview.startedAt = interview.startedAt || new Date();

        await interview.save();

        await Application.findByIdAndUpdate(interview.applicationId, {
          interviewStatus: "in_progress",
        });
      } catch (err) {
        interview.generationStatus = "failed";
        await interview.save();
        throw err;
      }

      return;
    }

    if (type === "evaluate_answer") {
      const { interviewId, answerPayload, answerMeta } = job.data;

      const interview = await Interview.findById(interviewId);
      if (!interview) throw new Error("Interview not found");

      interview.lastAnswerEvaluationStatus = "pending";
      interview.lastAnswerEvaluationJobId = String(job.id);
      interview.lastAnswerEvaluationError = null;
      await interview.save();

      const q = interview.questions.find(
        (x) => Number(x.questionId) === Number(answerPayload.questionId)
      );

      if (!q) throw new Error("Question not found");

      const alreadyAnswered = interview.answers.some(
        (a) => Number(a.questionId) === Number(answerPayload.questionId)
      );

      if (alreadyAnswered) {
        interview.lastAnswerEvaluationStatus = "completed";
        await interview.save();
        return;
      }

      try {
        const evalResp = await evaluateAnswer({
          question: q.question,
          skill: q.skill,
          jobTitle: interview.contextSnapshot?.jobTitle,
          jobDescription: interview.contextSnapshot?.jobDescription,
          mustHaveSkills: interview.contextSnapshot?.mustHaveSkills || [],
          candidateSkills: interview.contextSnapshot?.candidateSkills || [],
          answer: answerPayload.answerText,
          meta: answerMeta,
        });

        interview.answers.push({
          questionId: q.questionId,
          question: q.question,
          skill: q.skill,
          type: q.type,
          difficulty: q.difficulty,
          answerText: answerPayload.answerText,
          timeTakenSec: answerMeta.timeTakenSec,
          tabSwitchCount: answerMeta.tabSwitchCount,
          pasteCount: answerMeta.pasteCount,
          hiddenTimeMs: answerMeta.hiddenTimeMs,
          answerMode: answerMeta.answerMode || "text",
          score: evalResp.score,
          feedback: evalResp.feedback,
          grading: evalResp.grading || {},
          aiAnalysis: evalResp.aiAnalysis || evalResp,
          cheatingRisk: evalResp.cheatingRisk || 0,
        });

        interview.lastAnswerEvaluationStatus = "completed";
        interview.lastAnswerEvaluationError = null;
        await interview.save();
      } catch (err) {
        interview.lastAnswerEvaluationStatus = "failed";
        interview.lastAnswerEvaluationError =
          err?.response?.data?.message ||
          err?.response?.data?.detail ||
          err.message ||
          "Answer evaluation failed";
        await interview.save();
        throw err;
      }

      return;
    }

    throw new Error(`Unknown interview job type: ${type}`);
  },
  { connection }
);

worker.on("completed", (job) => {
  console.log(`✅ Interview worker completed job ${job.id}`);
});

worker.on("failed", (job, err) => {
  console.error(`❌ Interview worker failed job ${job?.id}:`, err.message);
});