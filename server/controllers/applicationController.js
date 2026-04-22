// //server/controllers/applicationController.js
// const Application = require('../models/Application');
// const Job = require('../models/Job');
// const ProcessedResume = require('../models/ProcessedResume');
// const { computeJobResumeMatch } = require('../utils/nlpMatchClient');
// const mongoose = require('mongoose');
// const fs = require('fs');
// const path = require('path');
// const Resume = require('../models/Resume');
const Application = require('../models/Application');
const Job = require('../models/Job');
const ProcessedResume = require('../models/ProcessedResume');
const { applicationQueue } = require('../queue/applicationQueue');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Resume = require('../models/Resume');

function getMimeTypeFromFilename(filename = '') {
  const lower = String(filename).toLowerCase();

  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.doc')) return 'application/msword';
  if (lower.endsWith('.docx')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }

  return 'application/octet-stream';
}

// ✅ helper: ensure reschedule object exists (important for old DB records)
function ensureReschedule(appDoc) {
  if (!appDoc.reschedule) {
    appDoc.reschedule = {
      status: 'none',
      requestedDate: null,
      requestedAt: null,
      recruiterReplyAt: null,
      recruiterNote: null,
    };
  } else {
    // ensure missing keys don't crash
    appDoc.reschedule.status = appDoc.reschedule.status || 'none';
    if (typeof appDoc.reschedule.requestedDate === 'undefined') appDoc.reschedule.requestedDate = null;
    if (typeof appDoc.reschedule.requestedAt === 'undefined') appDoc.reschedule.requestedAt = null;
    if (typeof appDoc.reschedule.recruiterReplyAt === 'undefined') appDoc.reschedule.recruiterReplyAt = null;
    if (typeof appDoc.reschedule.recruiterNote === 'undefined') appDoc.reschedule.recruiterNote = null;
  }
}

// // POST /api/applications
// exports.create = async (req, res) => {
//   try {
//     const candidateId = req.user?.id || req.user?._id;
//     const {
//       jobId,
//       resumeSource,
//       resumeFileId,
//       resumeName,
//       screeningAnswers,
//     } = req.body;

//     if (!candidateId) return res.status(401).json({ message: 'Unauthorized' });
//     if (!jobId) return res.status(400).json({ message: 'jobId is required' });

//     const job = await Job.findById(jobId).select(
//       'isClosed applicationDeadline title createdBy customQuestions screeningQuestions' +
//       'description skillsRequired rateSkills experience qualification location careerLevel'
//     );
//     if (!job) return res.status(404).json({ message: 'Job not found' });

//     const now = new Date();
//     if (job.isClosed === true)
//       return res.status(400).json({ message: 'This job is closed' });
//     if (job.applicationDeadline && new Date(job.applicationDeadline) < now) {
//       return res
//         .status(400)
//         .json({ message: 'Application deadline has passed' });
//     }

//     const exists = await Application.findOne({
//       candidate: candidateId,
//       job: jobId,
//     });
//     if (exists)
//       return res
//         .status(409)
//         .json({ message: 'You already applied to this job' });

//     // --- Validate screening answers ---
//     if (
//       job.customQuestions &&
//       Array.isArray(job.screeningQuestions) &&
//       job.screeningQuestions.length > 0
//     ) {
//       if (
//         !Array.isArray(screeningAnswers) ||
//         screeningAnswers.length !== job.screeningQuestions.length
//       ) {
//         return res.status(400).json({
//           message: `This job requires ${job.screeningQuestions.length} screening answers.`,
//         });
//       }
//       const allAnswered = screeningAnswers.every(
//         (a) => typeof a === 'string' && a.trim().length > 0
//       );
//       if (!allAnswered) {
//         return res
//           .status(400)
//           .json({ message: 'All screening questions must be answered.' });
//       }
//     } else if (Array.isArray(screeningAnswers) && screeningAnswers.length > 0) {
//       screeningAnswers.length = 0;
//     }

//     // ----------------- Resolve ProcessedResume for matching -----------------
//     let processedResume = null;
//     const rSource = resumeSource || 'default';

//     if (rSource === 'upload' && resumeFileId) {
//       processedResume = await ProcessedResume.findOne({
//         userId: candidateId,
//         sourceType: 'uploaded_pdf',
//         uploadedFileId: resumeFileId,
//       }).lean();
//     } else {
//       processedResume = await ProcessedResume.findOne({
//         userId: candidateId,
//         sourceType: 'builder_form',
//       })
//         .sort({ createdAt: -1 })
//         .lean();
//     }

//     let matchPayload = {
//       matchScore: null,
//       semanticScore: null,
//       ruleScore: null,
//       similarity: null,
//       matchBreakdown: null,
//     };

//     if (processedResume) {
//       try {
//         const matchResult = await computeJobResumeMatch(
//           job.toObject ? job.toObject() : job,
//           processedResume
//         );

//         matchPayload = {
//           matchScore: matchResult.final_score,
//           semanticScore: matchResult.semantic_score,
//           ruleScore: matchResult.rule_score,
//           similarity: matchResult.similarity,
//           matchBreakdown: matchResult.breakdown,
//         };
//       } catch (e) {
//         console.error(
//           'Error computing job-resume match:',
//           e?.response?.data || e.message || e
//         );
//       }
//     } else {
//       console.warn('No ProcessedResume found at apply time', {
//         candidateId,
//         resumeSource: rSource,
//         resumeFileId,
//       });
//     }

//     const appDoc = await Application.create({
//       candidate: candidateId,
//       job: jobId,
//       resumeSource: rSource,
//       resumeFileId: resumeFileId || null,

//       resumeName:
//         resumeName ||
//         (rSource === 'default' ? 'Resume (Built in Builder)' : null),
//       resumePath:
        
//         rSource === 'default' ? `/api/resume/me/pdf` : null,
//       screeningAnswers: Array.isArray(screeningAnswers)
//         ? screeningAnswers
//         : [],

//       matchScore: matchPayload.matchScore,
//       semanticScore: matchPayload.semanticScore,
//       ruleScore: matchPayload.ruleScore,
//       similarity: matchPayload.similarity,
//       matchBreakdown: matchPayload.matchBreakdown,
//     });

//     return res.status(201).json(appDoc);
//   } catch (err) {
//     console.error('create application error:', err);
//     return res.status(500).json({ message: 'Server error' });
//   }
// };




exports.create = async (req, res) => {
  try {
    const candidateId = req.user?.id || req.user?._id;
    const {
      jobId,
      resumeSource,
      resumeFileId,
      resumeName,
      screeningAnswers,
    } = req.body;

    if (!candidateId) return res.status(401).json({ message: 'Unauthorized' });
    if (!jobId) return res.status(400).json({ message: 'jobId is required' });

    const job = await Job.findById(jobId).select(
      'isClosed applicationDeadline title createdBy customQuestions screeningQuestions'
    );
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const now = new Date();
    if (job.isClosed === true)
      return res.status(400).json({ message: 'This job is closed' });
    if (job.applicationDeadline && new Date(job.applicationDeadline) < now) {
      return res
        .status(400)
        .json({ message: 'Application deadline has passed' });
    }

    const exists = await Application.findOne({
      candidate: candidateId,
      job: jobId,
    });
    if (exists)
      return res
        .status(409)
        .json({ message: 'You already applied to this job' });

    if (
      job.customQuestions &&
      Array.isArray(job.screeningQuestions) &&
      job.screeningQuestions.length > 0
    ) {
      if (
        !Array.isArray(screeningAnswers) ||
        screeningAnswers.length !== job.screeningQuestions.length
      ) {
        return res.status(400).json({
          message: `This job requires ${job.screeningQuestions.length} screening answers.`,
        });
      }
      const allAnswered = screeningAnswers.every(
        (a) => typeof a === 'string' && a.trim().length > 0
      );
      if (!allAnswered) {
        return res
          .status(400)
          .json({ message: 'All screening questions must be answered.' });
      }
    }

    const rSource = resumeSource || 'default';

    const appDoc = await Application.create({
      candidate: candidateId,
      job: jobId,
      resumeSource: rSource,
      resumeFileId: resumeFileId || null,
      resumeName:
        resumeName ||
        (rSource === 'default' ? 'Resume (Built in Builder)' : null),
      resumePath: rSource === 'default' ? `/api/resume/me/pdf` : null,
      screeningAnswers: Array.isArray(screeningAnswers)
        ? screeningAnswers
        : [],
      matchScore: null,
      semanticScore: null,
      ruleScore: null,
      similarity: null,
      matchBreakdown: null,
      matchingStatus: 'pending',
      matchingStartedAt: new Date(),
    });

    const queueJob = await applicationQueue.add("application_match_process", {
      applicationId: String(appDoc._id),
      candidateId: String(candidateId),
      jobId: String(jobId),
      resumeSource: rSource,
      resumeFileId: resumeFileId ? String(resumeFileId) : null,
    });

    appDoc.matchingJobId = String(queueJob.id);
    await appDoc.save();

    return res.status(201).json(appDoc);
  } catch (err) {
    console.error('create application error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/applications/mine
exports.mine = async (req, res) => {
  try {
    const candidateId = req.user?.id || req.user?._id;
    if (!candidateId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    let apps = await Application.find({ candidate: candidateId })
      .sort({ createdAt: -1 })
      .select(
        'candidate job resumeSource resumeFileId resumeName resumePath ' +
          'status createdAt inviteDates invitedAt chosenDate confirmedAt ' +
          'interviewStatus interviewCompletedAt ' +
          'matchScore semanticScore ruleScore similarity matchBreakdown ' +
          'reschedule'
      )
      .populate({
        path: 'job',
        select:
          'title companyName createdBy jobLocation location isRemote salaryVisible salaryMin salaryMax',
        populate: { path: 'createdBy', select: 'companyName name' },
      })
      .lean();

    if (!apps.length) return res.json([]);

    const { Types } = mongoose;

    const rawJobIds = apps
      .map((a) => {
        if (a.job && a.job._id) return String(a.job._id);
        if (a.job) return String(a.job);
        return null;
      })
      .filter((id) => id && id !== 'null' && Types.ObjectId.isValid(id));

    const jobIds = [...new Set(rawJobIds)];
    if (!jobIds.length) return res.json(apps);

    const allAppsForJobs = await Application.find({
      job: { $in: jobIds },
    })
      .select('_id job matchScore createdAt')
      .lean();

    const groupByJob = {};
    for (const a of allAppsForJobs) {
      if (!a || !a.job) continue;
      const jId = String(a.job);
      if (!groupByJob[jId]) groupByJob[jId] = [];
      groupByJob[jId].push(a);
    }

    const rankingMap = {};
    Object.entries(groupByJob).forEach(([jobId, list]) => {
      list.sort((a, b) => {
        const sa =
          typeof a.matchScore === 'number' ? a.matchScore : -Infinity;
        const sb =
          typeof b.matchScore === 'number' ? b.matchScore : -Infinity;

        if (sb !== sa) return sb - sa;

        const ta = new Date(a.createdAt || 0).getTime() || 0;
        const tb = new Date(b.createdAt || 0).getTime() || 0;
        return ta - tb;
      });

      rankingMap[jobId] = {
        total: list.length,
        orderedIds: list.map((x) => String(x._id)),
      };
    });

    apps = apps.map((app) => {
      const jobId = app.job && app.job._id ? String(app.job._id) : null;
      if (!jobId) return app;

      const r = rankingMap[jobId];
      if (!r) return app;

      const idx = r.orderedIds.indexOf(String(app._id));
      if (idx === -1) return app;

      return {
        ...app,
        applicantRank: idx + 1,
        totalApplicants: r.total,
      };
    });

    return res.json(apps);
  } catch (err) {
    console.error('mine applications error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/applications/job/:jobId
exports.listForJob = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const jobId = req.params.jobId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ message: 'Invalid jobId' });
    }
    const jobObjectId = new mongoose.Types.ObjectId(jobId);

    const job = await Job.findById(jobObjectId)
      .select('createdBy title customQuestions screeningQuestions')
      .lean();
    if (!job) return res.status(404).json({ message: 'Job not found' });

    if (
      job.createdBy &&
      String(job.createdBy) !== String(userId) &&
      req.user?.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const apps = await Application.find({ job: jobObjectId })
      .sort({ createdAt: -1 })
      .select(
        'candidate job resumeSource resumeFileId resumeName resumePath status createdAt inviteDates invitedAt chosenDate confirmedAt screeningAnswers matchScore semanticScore ruleScore similarity matchBreakdown reschedule'
      )
      .populate({ path: 'candidate', select: 'name email' })
      .lean();

    return res.json({
      job: {
        id: job._id,
        title: job.title,
        customQuestions: job.customQuestions,
        screeningQuestions: job.screeningQuestions,
      },
      applications: apps,
    });
  } catch (err) {
    if (err?.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid jobId' });
    }
    console.error('listForJob error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/applications/recruiter/all
exports.listForRecruiterAll = async (req, res) => {
  try {
    const recruiterId = req.user?.id || req.user?._id;
    if (!recruiterId)
      return res.status(401).json({ message: 'Unauthorized' });

    const jobs = await Job.find({ createdBy: recruiterId })
      .select('_id title')
      .lean();

    if (!jobs.length) {
      return res.json({ count: 0, applications: [], jobs: [] });
    }

    const jobIds = jobs.map((j) => j._id);
    const apps = await Application.find({ job: { $in: jobIds } })
      .sort({ createdAt: -1 })
      .populate({ path: 'candidate', select: 'name email' })
      .select(
        'candidate job resumeSource resumeFileId resumeName resumePath ' +
          'status createdAt inviteDates invitedAt chosenDate confirmedAt ' +
          'interviewStatus interviewCompletedAt ' +
          'screeningAnswers matchScore semanticScore ruleScore similarity matchBreakdown reschedule'
      )
      .populate({ path: 'job', select: 'title createdBy' })
      .lean();

    return res.json({
      count: apps.length,
      applications: apps,
      jobs,
    });
  } catch (err) {
    console.error('listForRecruiterAll error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/applications/:appId/invite
exports.invite = async (req, res) => {
  try {
    const recruiterId = req.user?.id || req.user?._id;
    if (!recruiterId)
      return res.status(401).json({ message: 'Unauthorized' });

    const { appId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(appId)) {
      return res.status(400).json({ message: 'Invalid application id' });
    }

    const appDoc = await Application.findById(appId).populate(
      'job',
      'createdBy title'
    );
    if (!appDoc)
      return res.status(404).json({ message: 'Application not found' });

    if (
      appDoc.job?.createdBy &&
      String(appDoc.job.createdBy) !== String(recruiterId) &&
      req.user?.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const rawDates = Array.isArray(req.body?.inviteDates)
      ? req.body.inviteDates.filter(Boolean)
      : [];
    if (rawDates.length < 2) {
      return res.status(400).json({
        message: 'Provide at least 2 interview date options.',
      });
    }

    const parsed = rawDates.map((d) => new Date(d));
    if (parsed.some(isNaN)) {
      return res
        .status(400)
        .json({ message: 'One or more dates are invalid.' });
    }

    appDoc.inviteDates = parsed;
    appDoc.invitedAt = new Date();
    appDoc.status = 'Invited, not yet confirmed';

    // ✅ reset reschedule safely
    ensureReschedule(appDoc);
    appDoc.reschedule = {
      status: 'none',
      requestedDate: null,
      requestedAt: null,
      recruiterReplyAt: null,
      recruiterNote: null,
    };

    await appDoc.save();

    return res.json({ ok: true, application: appDoc });
  } catch (err) {
    console.error('invite error:', err);
    if (err?.name === 'ValidationError') {
      return res.status(400).json({
        message: Object.values(err.errors)
          .map((e) => e.message)
          .join(', '),
      });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

// PUT /api/applications/:appId/confirm
exports.confirm = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId)
      return res.status(401).json({ message: 'Unauthorized' });

    const { appId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(appId)) {
      return res.status(400).json({ message: 'Invalid application id' });
    }

    const chosenRaw = req.body?.chosenDate;
    if (!chosenRaw)
      return res.status(400).json({ message: 'chosenDate is required' });
    const chosen = new Date(chosenRaw);
    if (Number.isNaN(chosen.getTime())) {
      return res.status(400).json({ message: 'chosenDate is invalid' });
    }

    const appDoc = await Application.findById(appId)
      .populate('candidate', '_id name email')
      .populate('job', 'title createdBy');
    if (!appDoc)
      return res.status(404).json({ message: 'Application not found' });

    const isOwner = String(appDoc.candidate?._id) === String(userId);
    if (!isOwner && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (!Array.isArray(appDoc.inviteDates) || appDoc.inviteDates.length < 2) {
      return res.status(400).json({
        message: 'No interview options to confirm yet.',
      });
    }

    const isOneOfOptions = appDoc.inviteDates.some(
      (d) => new Date(d).getTime() === chosen.getTime()
    );
    if (!isOneOfOptions) {
      return res.status(400).json({
        message: 'Chosen date is not among proposed options.',
      });
    }

    appDoc.chosenDate = chosen;
    appDoc.confirmedAt = new Date();
    appDoc.status = 'InterviewConfirmed';

    // ✅ clear reschedule safely
    ensureReschedule(appDoc);
    appDoc.reschedule = {
      status: 'none',
      requestedDate: null,
      requestedAt: null,
      recruiterReplyAt: null,
      recruiterNote: null,
    };

    await appDoc.save();

    return res.json({ ok: true, application: appDoc });
  } catch (err) {
    console.error('confirm error:', err);
    if (err?.name === 'ValidationError') {
      return res.status(400).json({
        message: Object.values(err.errors)
          .map((e) => e.message)
          .join(', '),
      });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * GET /api/applications/:appId
 * Used by InterviewInvitation page
 */
exports.getOne = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { appId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(appId)) {
      return res.status(400).json({ message: 'Invalid application id' });
    }

    const appDoc = await Application.findById(appId)
      .populate({
        path: 'job',
        select:
          'title companyName createdBy jobLocation location isRemote',
        populate: { path: 'createdBy', select: 'companyName name' },
      })
      .populate({ path: 'candidate', select: 'name email _id' })
      .lean();

    if (!appDoc) return res.status(404).json({ message: 'Application not found' });

    const isCandidate = String(appDoc.candidate?._id) === String(userId);
    const isRecruiterOwner =
      String(appDoc.job?.createdBy?._id || appDoc.job?.createdBy) === String(userId);

    if (!isCandidate && !isRecruiterOwner && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    return res.json(appDoc);
  } catch (err) {
    console.error('getOne error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Candidate requests reschedule
 * PUT /api/applications/:appId/reschedule-request
 * body: { requestedDate, note? }
 */
exports.rescheduleRequest = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { appId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(appId)) {
      return res.status(400).json({ message: 'Invalid application id' });
    }

    const requestedRaw = req.body?.requestedDate;
    if (!requestedRaw) {
      return res.status(400).json({ message: 'requestedDate is required' });
    }
    const requested = new Date(requestedRaw);
    if (Number.isNaN(requested.getTime())) {
      return res.status(400).json({ message: 'requestedDate is invalid' });
    }

    const appDoc = await Application.findById(appId)
      .populate('candidate', '_id')
      .populate('job', 'createdBy title');
    if (!appDoc) return res.status(404).json({ message: 'Application not found' });

    const isOwner = String(appDoc.candidate?._id) === String(userId);
    if (!isOwner && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    if (appDoc.status !== 'Invited, not yet confirmed' && appDoc.status !== 'InterviewConfirmed') {
      return res.status(400).json({ message: 'Reschedule is only allowed for invited/confirmed interviews.' });
    }

    // ✅ critical fix: old DB records may not have reschedule object
    ensureReschedule(appDoc);

    appDoc.reschedule.status = 'requested';
    appDoc.reschedule.requestedDate = requested;
    appDoc.reschedule.requestedAt = new Date();
    appDoc.reschedule.recruiterReplyAt = null;
    appDoc.reschedule.recruiterNote = req.body?.note
      ? String(req.body.note).slice(0, 500)
      : null;

    await appDoc.save();
    return res.json({ ok: true, application: appDoc });
  } catch (err) {
    console.error('rescheduleRequest error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Recruiter approves reschedule (also updates chosenDate)
 * PUT /api/applications/:appId/reschedule-approve
 * body: { newDate, note? }
 */
exports.rescheduleApprove = async (req, res) => {
  try {
    const recruiterId = req.user?.id || req.user?._id;
    if (!recruiterId) return res.status(401).json({ message: 'Unauthorized' });

    const { appId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(appId)) {
      return res.status(400).json({ message: 'Invalid application id' });
    }

    const newRaw = req.body?.newDate;
    if (!newRaw) return res.status(400).json({ message: 'newDate is required' });
    const newDate = new Date(newRaw);
    if (Number.isNaN(newDate.getTime())) {
      return res.status(400).json({ message: 'newDate is invalid' });
    }

    const appDoc = await Application.findById(appId).populate('job', 'createdBy title');
    if (!appDoc) return res.status(404).json({ message: 'Application not found' });

    const isOwner = String(appDoc.job?.createdBy) === String(recruiterId);
    if (!isOwner && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // ✅ critical fix: old DB records may not have reschedule object
    ensureReschedule(appDoc);

    if (appDoc.reschedule?.status !== 'requested') {
      return res.status(400).json({ message: 'No reschedule request pending.' });
    }

    appDoc.chosenDate = newDate;
    appDoc.confirmedAt = new Date();
    appDoc.status = 'InterviewConfirmed';

    appDoc.reschedule.status = 'approved';
    appDoc.reschedule.recruiterReplyAt = new Date();
    appDoc.reschedule.recruiterNote = req.body?.note
      ? String(req.body.note).slice(0, 500)
      : null;

    await appDoc.save();
    return res.json({ ok: true, application: appDoc });
  } catch (err) {
    console.error('rescheduleApprove error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Recruiter declines reschedule
 * PUT /api/applications/:appId/reschedule-decline
 * body: { note? }
 */
exports.rescheduleDecline = async (req, res) => {
  try {
    const recruiterId = req.user?.id || req.user?._id;
    if (!recruiterId) return res.status(401).json({ message: 'Unauthorized' });

    const { appId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(appId)) {
      return res.status(400).json({ message: 'Invalid application id' });
    }

    const appDoc = await Application.findById(appId).populate('job', 'createdBy title');
    if (!appDoc) return res.status(404).json({ message: 'Application not found' });

    const isOwner = String(appDoc.job?.createdBy) === String(recruiterId);
    if (!isOwner && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // ✅ critical fix: old DB records may not have reschedule object
    ensureReschedule(appDoc);

    if (appDoc.reschedule?.status !== 'requested') {
      return res.status(400).json({ message: 'No reschedule request pending.' });
    }

    appDoc.reschedule.status = 'declined';
    appDoc.reschedule.recruiterReplyAt = new Date();
    appDoc.reschedule.recruiterNote = req.body?.note
      ? String(req.body.note).slice(0, 500)
      : null;

    await appDoc.save();
    return res.json({ ok: true, application: appDoc });
  } catch (err) {
    console.error('rescheduleDecline error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};


exports.getApplicationResume = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { appId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(appId)) {
      return res.status(400).json({ message: 'Invalid application id' });
    }

    const appDoc = await Application.findById(appId)
      .populate({
        path: 'job',
        select: 'createdBy title',
      })
      .populate({
        path: 'candidate',
        select: '_id name email',
      });

    if (!appDoc) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const isCandidate = String(appDoc.candidate?._id) === String(userId);
    const isRecruiterOwner =
      String(appDoc.job?.createdBy?._id || appDoc.job?.createdBy) === String(userId);
    const isAdmin = req.user?.role === 'admin';

    if (!isCandidate && !isRecruiterOwner && !isAdmin) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // -------------------------
    // Case 1: Built resume PDF
    // -------------------------
    if (appDoc.resumeSource === 'default') {
      const candidateId = appDoc.candidate?._id || appDoc.candidate;
      if (!candidateId) {
        return res.status(404).json({ message: 'Candidate not found for this application.' });
      }

      const resumeDoc = await Resume.findOne({ userId: String(candidateId) }).lean();
      const templateId = resumeDoc?.templateId || 'classic';

      const pdfPath = path.join(
        __dirname,
        '..',
        'uploads',
        'resumes',
        `resume_${candidateId}_${templateId}.pdf`
      );

      if (!fs.existsSync(pdfPath)) {
        return res.status(404).json({ message: 'Built resume PDF not found.' });
      }
      const filename = `resume_${candidateId}_${templateId}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `inline; filename="resume_${candidateId}_${templateId}.pdf"`
      );

      return fs.createReadStream(pdfPath).pipe(res);
    }

    // -------------------------
    // Case 2: Uploaded resume file
    // -------------------------
    if (appDoc.resumeSource === 'upload') {
      if (!appDoc.resumeFileId) {
        return res.status(404).json({ message: 'Uploaded resume file id not found in application.' });
      }

      const candidateId = appDoc.candidate?._id || appDoc.candidate;
      const resumeDoc = await Resume.findOne({ userId: String(candidateId) });

      if (!resumeDoc) {
        return res.status(404).json({ message: 'Resume document not found for candidate.' });
      }

      const uploaded = (resumeDoc.uploadedFiles || []).find(
        (file) => String(file._id) === String(appDoc.resumeFileId)
      );

      if (!uploaded || !uploaded.filePath) {
        return res.status(404).json({ message: 'Uploaded resume file not found.' });
      }

      const absolutePath = path.isAbsolute(uploaded.filePath)
        ? uploaded.filePath
        : path.join(__dirname, '..', uploaded.filePath);

      if (!fs.existsSync(absolutePath)) {
        return res.status(404).json({ message: 'Uploaded resume file is missing from server.' });
      }

      const filename = appDoc.resumeName || uploaded.originalName || path.basename(absolutePath);

      res.setHeader('Content-Type', getMimeTypeFromFilename(filename));
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${filename}"`
      );

      return fs.createReadStream(absolutePath).pipe(res);
    }

    return res.status(400).json({ message: 'Unknown resume source.' });
  } catch (err) {
    console.error('getApplicationResume error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.mineForJob = async (req, res) => {
  try {
    const candidateId = req.user?.id || req.user?._id;
    const { jobId } = req.params;

    if (!candidateId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ message: 'Invalid jobId' });
    }

    const app = await Application.findOne({
      candidate: candidateId,
      job: jobId,
    })
      .populate({
        path: 'job',
        select: 'title companyName createdBy jobLocation location isRemote salaryVisible salaryMin salaryMax',
        populate: { path: 'createdBy', select: 'companyName name' },
      })
      .lean();

    return res.json(app || null);
  } catch (err) {
    console.error('mineForJob error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

exports.getMatchingStatus = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { appId } = req.params;

    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!mongoose.Types.ObjectId.isValid(appId)) {
      return res.status(400).json({ message: "Invalid application id" });
    }

    const appDoc = await Application.findById(appId)
      .select(
        "candidate job matchingStatus matchingStartedAt matchingCompletedAt matchingError matchingJobId matchScore semanticScore ruleScore similarity matchBreakdown"
      )
      .populate("job", "createdBy");

    if (!appDoc) return res.status(404).json({ message: "Application not found" });

    const isCandidate = String(appDoc.candidate) === String(userId);
    const isRecruiterOwner =
      String(appDoc.job?.createdBy) === String(userId);
    const isAdmin = req.user?.role === "admin";

    if (!isCandidate && !isRecruiterOwner && !isAdmin) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return res.json({
      matchingStatus: appDoc.matchingStatus,
      matchingStartedAt: appDoc.matchingStartedAt,
      matchingCompletedAt: appDoc.matchingCompletedAt,
      matchingError: appDoc.matchingError,
      matchingJobId: appDoc.matchingJobId,
      matchScore: appDoc.matchScore,
      semanticScore: appDoc.semanticScore,
      ruleScore: appDoc.ruleScore,
      similarity: appDoc.similarity,
      matchBreakdown: appDoc.matchBreakdown,
    });
  } catch (err) {
    console.error("getMatchingStatus error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};