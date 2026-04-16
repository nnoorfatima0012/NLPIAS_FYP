// // // server/models/application.js
// // const mongoose = require('mongoose');

// // const ApplicationSchema = new mongoose.Schema(
// //   {
// //     candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
// //     job:       { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },

// //     // chosen resume metadata
// //     resumeSource: { type: String, enum: ['default', 'upload'], default: 'default' },
// //     resumeFileId: { type: mongoose.Schema.Types.ObjectId, default: null },
// //    // snapshot so recruiter always sees exactly what was chosen
// //    resumeName: { type: String, default: null },
// //    resumePath: { type: String, default: null },

// //     // NEW FIELD: Candidate's answers to the screening questions
// //     screeningAnswers: { type: [String], default: [] }, // <-- ADD THIS FIELD

// //    // interview invite (persisted so candidate can see it)
// //     inviteDates: [{ type: Date, default: undefined }], // 2-3 options
// //     invitedAt: { type: Date, default: null },

// //     // candidate confirmation
// //     chosenDate: { type: Date, default: null },
// //     confirmedAt: { type: Date, default: null },

// //     status: {
// //       type: String,
// //       enum: [
// //         'Applied',
// //         'Reviewed',
// //        'Shortlisted',
// //         'Rejected',
// //         'Hired',
// //         'Invited, not yet confirmed',
// //         'InterviewConfirmed'
// //       ],
// //       default: 'Applied'
// //     },
// //   },
// //   { timestamps: true }
// // );

// // ApplicationSchema.index({ candidate: 1, job: 1 }, { unique: true });

// // module.exports = mongoose.model('Application', ApplicationSchema);
// const mongoose = require('mongoose');

// const ApplicationSchema = new mongoose.Schema(
//   {
//     candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },

//     // chosen resume metadata
//     resumeSource: { type: String, enum: ['default', 'upload'], default: 'default' },
//     resumeFileId: { type: mongoose.Schema.Types.ObjectId, default: null },
//     resumeName: { type: String, default: null },
//     resumePath: { type: String, default: null },

//     // scoring from NLP hybrid matcher
//     matchScore: { type: Number, default: null },
//     semanticScore: { type: Number, default: null },
//     ruleScore: { type: Number, default: null },
//     similarity: { type: Number, default: null },
//     matchBreakdown: { type: Object, default: null },

//     // screening answers
//     screeningAnswers: { type: [String], default: [] },

//     // interview invite (persisted so candidate can see it)
//     inviteDates: [{ type: Date, default: undefined }], // 2-3 options
//     invitedAt: { type: Date, default: null },

//     // candidate confirmation
//     chosenDate: { type: Date, default: null },
//     confirmedAt: { type: Date, default: null },

//     // ✅ NEW: reschedule request flow
//     reschedule: {
//       status: {
//         type: String,
//         enum: ['none', 'requested', 'approved', 'declined'],
//         default: 'none',
//       },
//       requestedDate: { type: Date, default: null }, // candidate requested
//       requestedAt: { type: Date, default: null },
//       recruiterReplyAt: { type: Date, default: null },
//       recruiterNote: { type: String, default: null },
//     },

//     status: {
//       type: String,
//       enum: [
//         'Applied',
//         'Reviewed',
//         'Shortlisted',
//         'Rejected',
//         'Hired',
//         'Invited, not yet confirmed',
//         'InterviewConfirmed'
//       ],
//       default: 'Applied'
//     },
//   },
//   { timestamps: true }
// );

// ApplicationSchema.index({ candidate: 1, job: 1 }, { unique: true });

// module.exports = mongoose.model('Application', ApplicationSchema);
// server/models/Application.js
const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema(
  {
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },

    // chosen resume metadata
    resumeSource: { type: String, enum: ['default', 'upload'], default: 'default' },
    resumeFileId: { type: mongoose.Schema.Types.ObjectId, default: null },
    resumeName: { type: String, default: null },
    resumePath: { type: String, default: null },

    // scoring from NLP hybrid matcher
    matchScore: { type: Number, default: null },
    semanticScore: { type: Number, default: null },
    ruleScore: { type: Number, default: null },
    similarity: { type: Number, default: null },
    matchBreakdown: { type: Object, default: null },

    // screening answers
    screeningAnswers: { type: [String], default: [] },

    // interview invite (persisted so candidate can see it)
    inviteDates: [{ type: Date, default: undefined }], // 2-3 options
    invitedAt: { type: Date, default: null },

    // candidate confirmation
    chosenDate: { type: Date, default: null },
    confirmedAt: { type: Date, default: null },

    // ── Interview completion tracking ──
    interviewStatus: {
      type: String,
      enum: ['none', 'in_progress', 'completed'],
      default: 'none',
    },
    interviewCompletedAt: { type: Date, default: null },

    // reschedule request flow
    reschedule: {
      status: {
        type: String,
        enum: ['none', 'requested', 'approved', 'declined'],
        default: 'none',
      },
      requestedDate: { type: Date, default: null },
      requestedAt: { type: Date, default: null },
      recruiterReplyAt: { type: Date, default: null },
      recruiterNote: { type: String, default: null },
    },

    status: {
      type: String,
      enum: [
        'Applied',
        'Reviewed',
        'Shortlisted',
        'Rejected',
        'Hired',
        'Invited, not yet confirmed',
        'InterviewConfirmed',
      ],
      default: 'Applied',
    },
  },
  { timestamps: true }
);

ApplicationSchema.index({ candidate: 1, job: 1 }, { unique: true });

module.exports = mongoose.model('Application', ApplicationSchema);