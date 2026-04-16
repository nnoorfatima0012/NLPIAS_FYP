// server/models/RecruiterProfile.js
const mongoose = require('mongoose');

const recruiterProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      unique: true,
      required: true,
    },

    // 1) Personal Details (Recruiter)
    recruiterName: { type: String, default: '' },        // e.g. Sana Khan
    recruiterTitle: { type: String, default: '' },       // e.g. HR Manager
    recruiterEmail: { type: String, default: '' },       // Work email
    recruiterPhone: { type: String, default: '' },       // Work phone / WhatsApp
    recruiterBio: { type: String, default: '' },         // Short bio
    recruiterPhotoUrl: { type: String, default: '' },    // /uploads/profile-photos/xyz.jpg

    // 2) Company Overview
    companyName: { type: String, default: '' },
    companyLogoUrl: { type: String, default: '' },       // /uploads/company-logos/xyz.png
    companyWebsite: { type: String, default: '' },       // matches Profile.jsx
    companyIndustry: { type: String, default: '' },      // IT / Banking / etc.
    companySize: { type: String, default: '' },          // "1–10", "11–50", etc.
    companyType: { type: String, default: '' },          // Startup / NGO / Enterprise...
    companyHeadOffice: { type: String, default: '' },    // e.g. Karachi, Pakistan
    aboutCompany: { type: String, default: '' },

    // 3) Company Verification
    registrationNumber: { type: String, default: '' },
    registrationDocUrl: { type: String, default: '' },   // /uploads/company-docs/xyz.pdf
    businessEmailDomain: { type: String, default: '' },  // "@company.com"
    companyLinkedin: { type: String, default: '' },      // LinkedIn company URL

    // 4) Approval Status (for admin UI)
    approvalStatus: {
      type: String,
      default: 'Pending', // NOTE: capital P to match frontend
    },
    reviewedBy: { type: String, default: '' },
    lastReviewedOn: { type: Date },
    rejectionReason: { type: String, default: '' },

    // 5) Hiring Focus & Talent Segments
    // Stored as simple strings (comma-separated text) to match the React form
    hiringDepartments: { type: String, default: '' },    // e.g. "IT, Sales, Finance"
    typicalRoles: { type: String, default: '' },         // e.g. "SWE, Sales Associate"
    hiringLocations: { type: String, default: '' },      // e.g. "Karachi, Lahore, Remote"
    seniorityLevels: { type: String, default: '' },      // e.g. "Entry, Mid, Senior"

    // 6) Employer Branding & Candidate View
    tagline: { type: String, default: '' },              // Company Tagline
    whyWorkWithUs: { type: String, default: '' },        // paragraph / bullets in textarea
    coreValues: { type: String, default: '' },           // "Integrity, Growth, Inclusivity"
    perksBenefits: { type: String, default: '' },        // "Health insurance, remote Fridays"
    diversityStatement: { type: String, default: '' },   // Equal opportunity statement
  },
  { timestamps: true }
);

module.exports = mongoose.model('RecruiterProfile', recruiterProfileSchema);
