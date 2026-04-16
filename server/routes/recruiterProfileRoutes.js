// server/routes/recruiterProfileRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const RecruiterProfile = require('../models/RecruiterProfile');
const User = require('../models/User');
const { protect ,authorize} = require('../middleware/authMiddleware');

const router = express.Router();

/* ---------- Helper to get userId from token ---------- */
function getUserId(req) {
  return req.user?._id || req.user?.id || req.user?.userId || null;
}

/* ---------- Ensure upload folders exist ---------- */

const photosDir = path.join(__dirname, '../uploads/profile-photos');
if (!fs.existsSync(photosDir)) {
  fs.mkdirSync(photosDir, { recursive: true });
}

const logosDir = path.join(__dirname, '../uploads/company-logos');
if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true });
}

const docsDir = path.join(__dirname, '../uploads/company-docs');
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

/* ---------- Multer storages ---------- */

const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, photosDir),
  filename: (req, file, cb) => {
    const userId = getUserId(req) || 'unknown';
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `recruiter_${userId}_${Date.now()}${ext}`);
  },
});

const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, logosDir),
  filename: (req, file, cb) => {
    const userId = getUserId(req) || 'unknown';
    const ext = path.extname(file.originalname) || '.png';
    cb(null, `logo_${userId}_${Date.now()}${ext}`);
  },
});

const docStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, docsDir),
  filename: (req, file, cb) => {
    const userId = getUserId(req) || 'unknown';
    const ext = path.extname(file.originalname) || path.extname(file.originalname) || '.pdf';
    cb(null, `doc_${userId}_${Date.now()}${ext || '.pdf'}`);
  },
});

const uploadPhoto = multer({ storage: photoStorage });
const uploadLogo = multer({ storage: logoStorage });
const uploadDoc = multer({ storage: docStorage });

/* ---------- Helpers ---------- */

/**
 * Merge frontend payload into the structure expected by the schema.
 * Uses the NEW field names (recruiterName, recruiterPhotoUrl, etc.).
 */
function mergeRecruiterPayload(userId, body) {
  const {
    // Personal
    recruiterName,
    recruiterTitle,
    recruiterEmail,
    recruiterPhone,
    recruiterBio,
    recruiterPhotoUrl,

    // Company overview
    companyName,
    companyLogoUrl,
    companyWebsite,
    companyIndustry,
    companySize,
    companyType,
    companyHeadOffice,
    aboutCompany,

    // Verification
    registrationNumber,
    registrationDocUrl,
    businessEmailDomain,
    companyLinkedin,

    // Admin / approval
    approvalStatus,
    reviewedBy,
    lastReviewedOn,
    rejectionReason,

    // Hiring focus
    hiringDepartments,
    typicalRoles,
    hiringLocations,
    seniorityLevels,

    // Employer branding
    tagline,
    whyWorkWithUs,
    coreValues,
    perksBenefits,
    diversityStatement,
  } = body || {};

  return {
    user: userId,

    recruiterName,
    recruiterTitle,
    recruiterEmail,
    recruiterPhone,
    recruiterBio,
    recruiterPhotoUrl,

    companyName,
    companyLogoUrl,
    companyWebsite,
    companyIndustry,
    companySize,
    companyType,
    companyHeadOffice,
    aboutCompany,

    registrationNumber,
    registrationDocUrl,
    businessEmailDomain,
    companyLinkedin,

    approvalStatus,
    reviewedBy,
    lastReviewedOn,
    rejectionReason,

    hiringDepartments,
    typicalRoles,
    hiringLocations,
    seniorityLevels,

    tagline,
    whyWorkWithUs,
    coreValues,
    perksBenefits,
    diversityStatement,
  };
}

/* ---------- GET /api/recruiter/profile/me ---------- */
// Load or auto-create a profile for logged-in recruiter
router.get('/me', protect,authorize('recruiter', 'admin'), async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res
      .status(401)
      .json({ message: 'Invalid token payload. No user id found.' });
  }

  try {
    let profile = await RecruiterProfile.findOne({ user: userId });

    if (!profile) {
      const user = await User.findById(userId);
      profile = await RecruiterProfile.create({
        user: userId,
        recruiterName: user?.name || '',
        recruiterEmail: user?.email || '',
      });
    }

    res.json(profile);
  } catch (err) {
    console.error('GET /api/recruiter/profile/me error:', err);
    res.status(500).json({ message: 'Failed to load recruiter profile' });
  }
});

/* ---------- PUT /api/recruiter/profile/me ---------- */
// Create or update recruiter profile
router.put('/me', protect,authorize('recruiter', 'admin'), async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res
      .status(401)
      .json({ message: 'Invalid token payload. No user id found.' });
  }

  try {
    const payload = mergeRecruiterPayload(userId, req.body);

    const profile = await RecruiterProfile.findOneAndUpdate(
      { user: userId },
      payload,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json(profile);
  } catch (err) {
    console.error('PUT /api/recruiter/profile/me error:', err);
    res.status(500).json({ message: 'Failed to save recruiter profile' });
  }
});

/* ---------- DELETE /api/recruiter/profile/me ---------- */
router.delete('/me', protect,authorize('recruiter', 'admin'), async (req, res) => {
  const userId = getUserId(req);
  if (!userId) {
    return res
      .status(401)
      .json({ message: 'Invalid token payload. No user id found.' });
  }

  try {
    await RecruiterProfile.findOneAndDelete({ user: userId });
    res.json({ message: 'Recruiter profile deleted' });
  } catch (err) {
    console.error('DELETE /api/recruiter/profile/me error:', err);
    res.status(500).json({ message: 'Failed to delete recruiter profile' });
  }
});

/* ---------- POST /api/recruiter/profile/photo ---------- */
// Upload recruiter profile photo
router.post(
  '/photo',
  protect,authorize('recruiter', 'admin'),
  uploadPhoto.single('photo'),
  async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res
        .status(401)
        .json({ message: 'Invalid token payload. No user id found.' });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const relativePath = `/uploads/profile-photos/${req.file.filename}`;

      const profile = await RecruiterProfile.findOneAndUpdate(
        { user: userId },
        { user: userId, recruiterPhotoUrl: relativePath },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      // IMPORTANT: return recruiterPhotoUrl key to match frontend
      res.json({ recruiterPhotoUrl: relativePath, profile });
    } catch (err) {
      console.error('POST /api/recruiter/profile/photo error:', err);
      res.status(500).json({ message: 'Failed to upload photo' });
    }
  }
);

/* ---------- POST /api/recruiter/profile/logo ---------- */
// Upload company logo
router.post(
  '/logo',
  protect,
  authorize('recruiter', 'admin'),
  uploadLogo.single('logo'),
  async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res
        .status(401)
        .json({ message: 'Invalid token payload. No user id found.' });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const relativePath = `/uploads/company-logos/${req.file.filename}`;

      const profile = await RecruiterProfile.findOneAndUpdate(
        { user: userId },
        { user: userId, companyLogoUrl: relativePath },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      res.json({ companyLogoUrl: relativePath, profile });
    } catch (err) {
      console.error('POST /api/recruiter/profile/logo error:', err);
      res.status(500).json({ message: 'Failed to upload logo' });
    }
  }
);

/* ---------- POST /api/recruiter/profile/registration-doc ---------- */
// Upload registration / NTN document
router.post(
  '/registration-doc',
  protect,
  authorize('recruiter', 'admin'),
  uploadDoc.single('registrationDoc'),
  async (req, res) => {
    const userId = getUserId(req);
    if (!userId) {
      return res
        .status(401)
        .json({ message: 'Invalid token payload. No user id found.' });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      const relativePath = `/uploads/company-docs/${req.file.filename}`;

      const profile = await RecruiterProfile.findOneAndUpdate(
        { user: userId },
        { user: userId, registrationDocUrl: relativePath },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );

      res.json({ registrationDocUrl: relativePath, profile });
    } catch (err) {
      console.error(
        'POST /api/recruiter/profile/registration-doc error:',
        err
      );
      res
        .status(500)
        .json({ message: 'Failed to upload registration document' });
    }
  }
);

module.exports = router;
