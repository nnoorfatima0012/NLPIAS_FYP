// // server/controllers/authController.js
// const jwt = require('jsonwebtoken');
// const crypto = require('crypto');
// const User = require('../models/User');
// const { sendMail } = require('../utils/mailer');

// const {
//   signAccessToken,
//   verifyRefreshToken,
//   hashToken,
//   generateRefreshSession,
// } = require('../utils/tokenService');
// const { getRefreshCookieOptions } = require('../utils/cookieOptions');

// const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
// const SERVER_URL = process.env.SERVER_URL || 'http://127.0.0.1:5000';
// const REFRESH_COOKIE_NAME = process.env.REFRESH_COOKIE_NAME || 'refreshToken';

// function getRequestMeta(req) {
//   return {
//     userAgent: req.get('user-agent') || null,
//     ip: req.ip || req.connection?.remoteAddress || null,
//   };
// }

// function sanitizeAuthUser(user) {
//   return {
//     id: user._id.toString(),
//     role: user.role,
//     name: user.name,
//     email: user.email,
//     status: user.status || 'pending',
//     emailVerified: !!user.emailVerified,
//     onboardingStep: user.onboardingStep || 'choose-role',
//     declineReason: user.declineReason || null,
//   };
// }

// async function createSessionAndRespond(req, res, user, extra = {}) {
//   const accessToken = signAccessToken(user);

//   const { rawToken, session } = generateRefreshSession(user, getRequestMeta(req));

//   user.authSessions = Array.isArray(user.authSessions) ? user.authSessions : [];
//   user.authSessions.push(session);
//   await user.save();

//   res.cookie(REFRESH_COOKIE_NAME, rawToken, getRefreshCookieOptions());

//   return res.json({
//     accessToken,
//     user: sanitizeAuthUser(user),
//     ...extra,
//   });
// }

// function clearRefreshCookie(res) {
//   res.clearCookie(REFRESH_COOKIE_NAME, {
//     ...getRefreshCookieOptions(),
//     maxAge: undefined,
//   });
// }
// /* ========== helpers ========== */

// function signResetToken(userId) {
//   // short-lived token for password reset
//   return jwt.sign({ sub: userId, type: 'passwordReset' }, process.env.JWT_SECRET, { expiresIn: '15m' });
// }

// function resetEmailHTML(name, link) {
//   return `
//     <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
//       <h2>Reset your password</h2>
//       <p>Hi ${name || 'there'},</p>
//       <p>We received a request to reset your password. Click the button below to set a new one.</p>
//       <p style="text-align:center;margin:24px 0">
//         <a href="${link}" style="background:#1d4ed8;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;display:inline-block">
//           Reset your password
//         </a>
//       </p>
//       <p>This link will expire in 15 minutes. If you didn’t request this, you can ignore this email.</p>
//     </div>
//   `;
// }

// async function issueVerificationEmail(user) {
//   user.emailVerified = false;
//   user.verificationToken = crypto.randomBytes(32).toString('hex');
//   user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
//   await user.save();

//   const link = `${SERVER_URL}/api/auth/verify-email?token=${user.verificationToken}`;

//   const roleLabel =
//     user.role === 'recruiter' ? 'recruiter account' : 'candidate account';

//   const html = `
//     <div style="font-family:Arial,sans-serif">
//       <h2>Verify your email</h2>
//       <p>Hi ${user.name || ''},</p>
//       <p>Thanks for signing up. Please verify your email to continue setting up your ${roleLabel}.</p>
//       <p>
//         <a href="${link}" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">
//           Verify Email
//         </a>
//       </p>
//       <p>Or copy this link into your browser:<br>${link}</p>
//       <p>This link expires in 24 hours.</p>
//     </div>
//   `;

//   await sendMail(user.email, 'Verify your email', html);
// }
// /** ===================== AUTH ===================== */

// // Signup
// exports.signup = async (req, res) => {
//   try {
//     let { name, email, password, role } = req.body;

//     name = String(name || '').trim();
//     email = String(email || '').trim().toLowerCase();
//     password = String(password || '').trim();

//     if (!name || !email || !password) {
//       return res.status(400).json({ message: 'Name, email and password are required' });
//     }

//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ message: 'User already exists' });
//     }

//     const user = await User.create({
//   name,
//   email,
//   password,
//   role: role || 'pending',
//   status: 'pending',
//   onboardingStep: 'choose-role',
//    });

//     return createSessionAndRespond(req, res, user);
//   } catch (error) {
//     console.error('❌ Signup Error:', error);
//     return res.status(500).json({ message: 'Server error during signup' });
//   }
// };
// exports.login = async (req, res) => {
//   try {
//     let { email, password } = req.body;

//     email = String(email || '').trim().toLowerCase();
//     password = String(password || '').trim();

//     if (!email || !password) {
//       return res.status(400).json({ message: 'Email and password are required' });
//     }

//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(401).json({ message: 'Invalid email or password' });
//     }

//     const isMatch = await user.comparePassword(password);
//     if (!isMatch) {
//       return res.status(401).json({ message: 'Invalid email or password' });
//     }

//     if (user.role === 'candidate' && !user.emailVerified) {
//   return res.status(403).json({
//     message: 'Please verify your email to continue.',
//     needsVerification: true,
//   });
// }

// if (user.role === 'recruiter' && !user.emailVerified) {
//   return res.status(403).json({
//     message: 'Please verify your email before your recruiter account can continue to review.',
//     needsVerification: true,
//   });
// }

// if (user.role === 'pending') {
//   return res.status(403).json({
//     message: 'Your account setup is incomplete. Please choose your role.',
//     needsRoleSelection: true,
//   });
// }

// if (user.role === 'recruiter' && user.status === 'pending') {
//   return res.status(403).json({
//     message: 'Your recruiter account is pending admin approval.',
//     pendingApproval: true,
//   });
// }

// if (user.role === 'recruiter' && user.status === 'declined') {
//   return res.status(403).json({
//     message: 'Your recruiter account was declined.',
//     declined: true,
//     declineReason: user.declineReason || 'No reason provided',
//   });
// }

//     return createSessionAndRespond(req, res, user);
//   } catch (error) {
//     console.error('❌ Login Error:', error);
//     return res.status(500).json({ message: 'Server error during login' });
//   }
// };
// /** =========== ONBOARDING / ROLE SELECTION =========== */

// // Recruiter Onboarding
// exports.updateRecruiterInfo = async (req, res) => {
//   try {
//     const {
//       companyName,
//       recruiterName,
//       officialEmail,
//       contactNumber,
//       website,
//       address,
//       description,
//     } = req.body;

//     const user = await User.findById(req.user.id);

//     if (!user || user.role !== 'recruiter') {
//       return res.status(403).json({ message: 'Unauthorized. Recruiter role required.' });
//     }

//     Object.assign(user, {
//       companyName,
//       recruiterName,
//       officialEmail,
//       contactNumber,
//       website,
//       address,
//       description,
//       status: 'pending',
//       onboardingStep:'recruiter-onboarding',
//     });

//     await user.save();

//     const html = `
//       <div style="font-family:Arial,sans-serif">
//         <h2>Recruiter application received</h2>
//         <p>Hi ${recruiterName || user.name || ''},</p>
//         <p>Your recruiter onboarding form has been submitted successfully.</p>
//         <p>Your account will be activated after:</p>
//         <ul>
//           <li>your email is verified</li>
//           <li>an admin approves your recruiter profile</li>
//         </ul>
//       </div>
//     `;

//     await sendMail(user.email, 'Your recruiter application is pending review', html);
//     if (officialEmail && officialEmail !== user.email) {
//       await sendMail(officialEmail, 'Your recruiter application is pending review', html);
//     }

//     // return res.json({ message: 'Recruiter info updated successfully' });
//       return res.json({
//       message: 'Recruiter info updated successfully',
//       user: sanitizeAuthUser(user),
//       });
//   } catch (err) {
//     console.error('❌ Recruiter Info Error:', err);
//     return res.status(500).json({ message: 'Server error' });
//   }
// };
// // Candidate chooses role -> send verification email; status stays PENDING until verified
// exports.updateUserInfo = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);

//     if (!user || user.role !== 'pending') {
//       return res.status(403).json({ message: 'Unauthorized or already onboarded' });
//     }

//     user.role = 'candidate';
//     user.status = 'pending';
//     user.emailVerified = false;
//     user.onboardingStep = 'candidate-verification';

//     await user.save();
//     await issueVerificationEmail(user);

//     return res.json({
//       message: 'Candidate role selected. Verification email sent.',
//       user: sanitizeAuthUser(user),
//     });
//   } catch (err) {
//     console.error('❌ Candidate Info Error:', err);
//     return res.status(500).json({ message: 'Server error' });
//   }
// };

// /** ===================== ADMIN ===================== */

// exports.declineRecruiter = async (req, res) => {
//   const { recruiterId, reason } = req.body;
//   await User.findByIdAndUpdate(recruiterId, {
//     status: 'declined',
//     declineReason: reason
//   });
//   res.json({ message: 'Recruiter declined with reason' });
// };

// exports.updateRecruiterStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status, declineReason } = req.body;

//     const user = await User.findById(id);
//     if (!user || user.role !== 'recruiter') {
//       return res.status(404).json({ message: 'Recruiter not found' });
//     }
//   user.status = status;

// if (status === 'approved') {
//   user.onboardingStep = 'done';
//   user.declineReason = undefined;
// } else if (status === 'declined') {
//   user.declineReason = declineReason || 'No reason provided';
// } else {
//   user.declineReason = undefined;
// }

//     await user.save();

//     // Notify recruiter by email
//     if (status === 'approved') {
//       const html = `
//         <div style="font-family:Arial,sans-serif">
//           <h2>Your recruiter account is approved</h2>
//           <p>Hello ${user.recruiterName || user.name || ''},</p>
//           <p>Your account has been approved. You can now log in and start posting jobs.</p>
//           <p><a href="${FRONTEND_URL}/" style="background:#16a34a;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Go to Login</a></p>
//         </div>
//       `;
//       await sendMail(user.email, 'Recruiter account approved', html);
//       if (user.officialEmail && user.officialEmail !== user.email) {
//         await sendMail(user.officialEmail, 'Recruiter account approved', html);
//       }
//     } else if (status === 'declined') {
//       const html = `
//         <div style="font-family:Arial,sans-serif">
//           <h2>Recruiter application declined</h2>
//           <p>Hello ${user.recruiterName || user.name || ''},</p>
//           <p>Unfortunately, your application has been declined.</p>
//           <p><strong>Reason:</strong> ${user.declineReason || 'Not provided'}</p>
//         </div>
//       `;
//       await sendMail(user.email, 'Recruiter application declined', html);
//       if (user.officialEmail && user.officialEmail !== user.email) {
//         await sendMail(user.officialEmail, 'Recruiter application declined', html);
//       }
//     }

//     res.json({ message: `Recruiter ${status} successfully.` });
//   } catch (err) {
//     console.error('❌ Admin Status Update Error:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// /** ===================== EMAIL VERIFY ===================== */
// exports.verifyEmail = async (req, res) => {
//   try {
//     const { token } = req.query;
//     if (!token) return res.status(400).send('Invalid token');

//     const user = await User.findOne({
//       verificationToken: token,
//       verificationTokenExpires: { $gt: new Date() }
//     });

//     if (!user) {
//       return res.status(400).send('Verification link is invalid or expired.');
//     }

//     user.emailVerified = true;
//     user.verificationToken = undefined;
//     user.verificationTokenExpires = undefined;

//     if (user.role === 'candidate') {
//       user.status = 'approved';
//        user.onboardingStep = 'done';
//     } else if (user.role === 'recruiter') {
//       user.status = 'pending';
//       user.onboardingStep = 'recruiter-onboarding';
//     }

//     await user.save();

//     return res.redirect(`${FRONTEND_URL}/login`);
//   } catch (err) {
//     console.error('❌ Verify Email Error:', err);
//     return res.status(500).send('Server error');
//   }
// };

// exports.resendVerification = async (req, res) => {
//   try {
//     const { email } = req.body;
//     if (!email) return res.status(400).json({ message: 'Email is required' });

//     const user = await User.findOne({ email: email.toLowerCase().trim() });
//     if (!user) return res.status(404).json({ message: 'User not found' });

//     if (user.emailVerified) {
//       return res.json({ message: 'Email is already verified' });
//     }

//     await issueVerificationEmail(user);
//     res.json({ message: 'Verification email resent' });
//   } catch (err) {
//     console.error('❌ Resend Verification Error:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// /** ===================== PASSWORD RESET ===================== */

// // Request reset
// exports.forgotPassword = async (req, res) => {
//   try {
//     const { email } = req.body || {};
//     if (!email) return res.status(400).json({ message: 'Email is required' });

//     const user = await User.findOne({ email: String(email).toLowerCase().trim() });
//     if (!user) return res.status(404).json({ message: 'Email not found' });

//     const token = signResetToken(user._id.toString());
//     user.resetPasswordToken = token;
//     user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
//     await user.save();

//     const link = `${FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`;
//     await sendMail(user.email, 'Reset your password', resetEmailHTML(user.name, link));

//     res.json({ message: 'Password reset link sent' });
//   } catch (err) {
//     console.error('❌ forgotPassword Error:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// // Resend reset (front-end enforces 2 min timer)
// exports.resendReset = async (req, res) => {
//   try {
//     const { email } = req.body || {};
//     if (!email) return res.status(400).json({ message: 'Email is required' });

//     const user = await User.findOne({ email: String(email).toLowerCase().trim() });
//     if (!user) return res.status(404).json({ message: 'Email not found' });

//     const token = signResetToken(user._id.toString());
//     user.resetPasswordToken = token;
//     user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
//     await user.save();

//     const link = `${FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`;
//     await sendMail(user.email, 'Reset your password', resetEmailHTML(user.name, link));

//     res.json({ message: 'Password reset link re-sent' });
//   } catch (err) {
//     console.error('❌ resendReset Error:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// // Reset with token
// exports.resetPassword = async (req, res) => {
//   try {
//     const { token, password } = req.body || {};
//     if (!token || !password) return res.status(400).json({ message: 'Token and new password are required' });

//     let payload;
//     try {
//       payload = jwt.verify(token, process.env.JWT_SECRET);
//     } catch {
//       return res.status(400).json({ message: 'Invalid or expired reset link' });
//     }
//     if (payload?.type !== 'passwordReset') {
//       return res.status(400).json({ message: 'Invalid reset link' });
//     }

//     const user = await User.findById(payload.sub);
//     if (!user) return res.status(400).json({ message: 'Invalid reset link' });

//     if (user.resetPasswordToken !== token || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
//       return res.status(400).json({ message: 'Reset link expired. Please request a new one.' });
//     }

//     user.password = password; // pre-save hook will hash
//     user.resetPasswordToken = undefined;
//     user.resetPasswordExpires = undefined;
//     await user.save();

//     res.json({ message: 'Password reset successful' });
//   } catch (err) {
//     console.error('❌ resetPassword Error:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// exports.refresh = async (req, res) => {
//   try {
//     const token = req.cookies?.[REFRESH_COOKIE_NAME];
//     if (!token) {
//       return res.status(401).json({ message: 'Refresh token missing' });
//     }

//     let payload;
//     try {
//       payload = verifyRefreshToken(token);
//     } catch (err) {
//       clearRefreshCookie(res);
//       return res.status(401).json({ message: 'Invalid or expired refresh token' });
//     }

//     if (payload?.typ !== 'refresh' || !payload?.sub || !payload?.sid) {
//       clearRefreshCookie(res);
//       return res.status(401).json({ message: 'Invalid refresh token payload' });
//     }

//     const user = await User.findById(payload.sub);
//     if (!user) {
//       clearRefreshCookie(res);
//       return res.status(401).json({ message: 'User no longer exists' });
//     }

//     const sessions = Array.isArray(user.authSessions) ? user.authSessions : [];
//     const currentHash = hashToken(token);

//     const existingSessionIndex = sessions.findIndex(
//       (s) =>
//         String(s._id) === String(payload.sid) &&
//         s.tokenHash === currentHash &&
//         new Date(s.expiresAt).getTime() > Date.now()
//     );

//     if (existingSessionIndex === -1) {
//       user.authSessions = sessions.filter(
//         (s) => new Date(s.expiresAt).getTime() > Date.now()
//       );
//       await user.save();

//       clearRefreshCookie(res);
//       return res.status(401).json({ message: 'Refresh session not found or expired' });
//     }

//     const { rawToken, session: newSession } = generateRefreshSession(user, getRequestMeta(req));

//     user.authSessions.splice(existingSessionIndex, 1, newSession);
//     await user.save();

//     res.cookie(REFRESH_COOKIE_NAME, rawToken, getRefreshCookieOptions());

//     return res.json({
//       accessToken: signAccessToken(user),
//       user: sanitizeAuthUser(user),
//     });
//   } catch (error) {
//     console.error('❌ Refresh Error:', error);
//     return res.status(500).json({ message: 'Server error during refresh' });
//   }
// };

// exports.logout = async (req, res) => {
//   try {
//     const token = req.cookies?.[REFRESH_COOKIE_NAME];

//     if (!token) {
//       clearRefreshCookie(res);
//       return res.json({ message: 'Logged out successfully' });
//     }

//     try {
//       const payload = verifyRefreshToken(token);

//       if (payload?.sub && payload?.sid) {
//         const user = await User.findById(payload.sub);
//         if (user) {
//           user.authSessions = (user.authSessions || []).filter(
//             (s) => String(s._id) !== String(payload.sid)
//           );
//           await user.save();
//         }
//       }
//     } catch (err) {
//       // ignore token parsing failure, still clear cookie
//     }

//     clearRefreshCookie(res);
//     return res.json({ message: 'Logged out successfully' });
//   } catch (error) {
//     console.error('❌ Logout Error:', error);
//     return res.status(500).json({ message: 'Server error during logout' });
//   }
// };

// exports.me = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id).select('-password');
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     return res.json({ user: sanitizeAuthUser(user) });
//   } catch (error) {
//     console.error('❌ Me Error:', error);
//     return res.status(500).json({ message: 'Server error fetching current user' });
//   }
// };


// exports.selectRecruiterRole = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id);

//     if (!user || user.role !== 'pending') {
//       return res.status(403).json({ message: 'Unauthorized or role already selected' });
//     }

//     user.role = 'recruiter';
//     user.status = 'pending';
//     user.emailVerified = false;
//     user.onboardingStep = 'recruiter-onboarding';

//     await user.save();
//     await issueVerificationEmail(user);

//     return res.json({
//       message: 'Recruiter role selected. Verification email sent.',
//       user: sanitizeAuthUser(user),
//     });
//   } catch (err) {
//     console.error('❌ selectRecruiterRole Error:', err);
//     return res.status(500).json({ message: 'Server error' });
//   }
// };


// server/controllers/authController.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const { sendMail } = require('../utils/mailer');

const {
  signAccessToken,
  verifyRefreshToken,
  hashToken,
  generateRefreshSession,
} = require('../utils/tokenService');
const {
  getAccessCookieOptions,
  getRefreshCookieOptions,
} = require('../utils/cookieOptions');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const SERVER_URL = process.env.SERVER_URL || 'http://127.0.0.1:5000';
const REFRESH_COOKIE_NAME = process.env.REFRESH_COOKIE_NAME || 'refreshToken';
const ACCESS_COOKIE_NAME = process.env.ACCESS_COOKIE_NAME || 'accessToken';

function getRequestMeta(req) {
  return {
    userAgent: req.get('user-agent') || null,
    ip: req.ip || req.connection?.remoteAddress || null,
  };
}

function sanitizeAuthUser(user) {
  return {
    id: user._id.toString(),
    role: user.role,
    name: user.name,
    email: user.email,
    status: user.status || 'pending',
    emailVerified: !!user.emailVerified,
    onboardingStep: user.onboardingStep || 'choose-role',
    declineReason: user.declineReason || null,
  };
}




async function createSessionAndRespond(req, res, user, extra = {}) {
  const accessToken = signAccessToken(user);
  const { rawToken, session } = generateRefreshSession(user, getRequestMeta(req));

  user.authSessions = Array.isArray(user.authSessions) ? user.authSessions : [];
  user.authSessions.push(session);
  await user.save();

  res.cookie(ACCESS_COOKIE_NAME, accessToken, getAccessCookieOptions());
  res.cookie(REFRESH_COOKIE_NAME, rawToken, getRefreshCookieOptions());

  return res.json({
    user: sanitizeAuthUser(user),
    ...extra,
  });
}


function clearAccessCookie(res) {
  const { maxAge, ...options } = getAccessCookieOptions();
  res.clearCookie(ACCESS_COOKIE_NAME, options);
}

function clearRefreshCookie(res) {
  const { maxAge, ...options } = getRefreshCookieOptions();
  res.clearCookie(REFRESH_COOKIE_NAME, options);
}
/* ========== helpers ========== */

function signResetToken(userId) {
  // short-lived token for password reset
  return jwt.sign({ sub: userId, type: 'passwordReset' }, process.env.JWT_SECRET, { expiresIn: '15m' });
}

function resetEmailHTML(name, link) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
      <h2>Reset your password</h2>
      <p>Hi ${name || 'there'},</p>
      <p>We received a request to reset your password. Click the button below to set a new one.</p>
      <p style="text-align:center;margin:24px 0">
        <a href="${link}" style="background:#1d4ed8;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;display:inline-block">
          Reset your password
        </a>
      </p>
      <p>This link will expire in 15 minutes. If you didn’t request this, you can ignore this email.</p>
    </div>
  `;
}

async function issueVerificationEmail(user) {
  user.emailVerified = false;
  user.verificationToken = crypto.randomBytes(32).toString('hex');
  user.verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();

  const link = `${SERVER_URL}/api/auth/verify-email?token=${user.verificationToken}`;

  const roleLabel =
    user.role === 'recruiter' ? 'recruiter account' : 'candidate account';

  const html = `
    <div style="font-family:Arial,sans-serif">
      <h2>Verify your email</h2>
      <p>Hi ${user.name || ''},</p>
      <p>Thanks for signing up. Please verify your email to continue setting up your ${roleLabel}.</p>
      <p>
        <a href="${link}" style="background:#2563eb;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">
          Verify Email
        </a>
      </p>
      <p>Or copy this link into your browser:<br>${link}</p>
      <p>This link expires in 24 hours.</p>
    </div>
  `;

  await sendMail(user.email, 'Verify your email', html);
}
/** ===================== AUTH ===================== */

// Signup
exports.signup = async (req, res) => {
  try {
    let { name, email, password, role } = req.body;

    name = String(name || '').trim();
    email = String(email || '').trim().toLowerCase();
    password = String(password || '').trim();

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
  name,
  email,
  password,
  role: role || 'pending',
  status: 'pending',
  onboardingStep: 'choose-role',
   });

    return createSessionAndRespond(req, res, user);
  } catch (error) {
    console.error('❌ Signup Error:', error);
    return res.status(500).json({ message: 'Server error during signup' });
  }
};
exports.login = async (req, res) => {
  try {
    let { email, password } = req.body;

    email = String(email || '').trim().toLowerCase();
    password = String(password || '').trim();

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.role === 'candidate' && !user.emailVerified) {
  return res.status(403).json({
    message: 'Please verify your email to continue.',
    needsVerification: true,
  });
}

if (user.role === 'recruiter' && !user.emailVerified) {
  return res.status(403).json({
    message: 'Please verify your email before your recruiter account can continue to review.',
    needsVerification: true,
  });
}

if (user.role === 'pending') {
  return res.status(403).json({
    message: 'Your account setup is incomplete. Please choose your role.',
    needsRoleSelection: true,
  });
}

if (user.role === 'recruiter' && user.status === 'pending') {
  return res.status(403).json({
    message: 'Your recruiter account is pending admin approval.',
    pendingApproval: true,
  });
}

if (user.role === 'recruiter' && user.status === 'declined') {
  return res.status(403).json({
    message: 'Your recruiter account was declined.',
    declined: true,
    declineReason: user.declineReason || 'No reason provided',
  });
}

    return createSessionAndRespond(req, res, user);
  } catch (error) {
    console.error('❌ Login Error:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
};
/** =========== ONBOARDING / ROLE SELECTION =========== */

// Recruiter Onboarding
exports.updateRecruiterInfo = async (req, res) => {
  try {
    const {
      companyName,
      recruiterName,
      officialEmail,
      contactNumber,
      website,
      address,
      description,
    } = req.body;

    const user = await User.findById(req.user.id);

    if (!user || user.role !== 'recruiter') {
      return res.status(403).json({ message: 'Unauthorized. Recruiter role required.' });
    }

    Object.assign(user, {
      companyName,
      recruiterName,
      officialEmail,
      contactNumber,
      website,
      address,
      description,
      status: 'pending',
      onboardingStep:'recruiter-onboarding',
    });

    await user.save();

    const html = `
      <div style="font-family:Arial,sans-serif">
        <h2>Recruiter application received</h2>
        <p>Hi ${recruiterName || user.name || ''},</p>
        <p>Your recruiter onboarding form has been submitted successfully.</p>
        <p>Your account will be activated after:</p>
        <ul>
          <li>your email is verified</li>
          <li>an admin approves your recruiter profile</li>
        </ul>
      </div>
    `;

    await sendMail(user.email, 'Your recruiter application is pending review', html);
    if (officialEmail && officialEmail !== user.email) {
      await sendMail(officialEmail, 'Your recruiter application is pending review', html);
    }

    // return res.json({ message: 'Recruiter info updated successfully' });
      return res.json({
      message: 'Recruiter info updated successfully',
      user: sanitizeAuthUser(user),
      });
  } catch (err) {
    console.error('❌ Recruiter Info Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
// Candidate chooses role -> send verification email; status stays PENDING until verified
exports.updateUserInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user || user.role !== 'pending') {
      return res.status(403).json({ message: 'Unauthorized or already onboarded' });
    }

    user.role = 'candidate';
    user.status = 'pending';
    user.emailVerified = false;
    user.onboardingStep = 'candidate-verification';

    await user.save();
    await issueVerificationEmail(user);

    return res.json({
      message: 'Candidate role selected. Verification email sent.',
      user: sanitizeAuthUser(user),
    });
  } catch (err) {
    console.error('❌ Candidate Info Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/** ===================== ADMIN ===================== */

exports.declineRecruiter = async (req, res) => {
  const { recruiterId, reason } = req.body;
  await User.findByIdAndUpdate(recruiterId, {
    status: 'declined',
    declineReason: reason
  });
  res.json({ message: 'Recruiter declined with reason' });
};

exports.updateRecruiterStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, declineReason } = req.body;

    const user = await User.findById(id);
    if (!user || user.role !== 'recruiter') {
      return res.status(404).json({ message: 'Recruiter not found' });
    }
  user.status = status;

if (status === 'approved') {
  user.onboardingStep = 'done';
  user.declineReason = undefined;
} else if (status === 'declined') {
  user.declineReason = declineReason || 'No reason provided';
} else {
  user.declineReason = undefined;
}

    await user.save();

    // Notify recruiter by email
    if (status === 'approved') {
      const html = `
        <div style="font-family:Arial,sans-serif">
          <h2>Your recruiter account is approved</h2>
          <p>Hello ${user.recruiterName || user.name || ''},</p>
          <p>Your account has been approved. You can now log in and start posting jobs.</p>
          <p><a href="${FRONTEND_URL}/" style="background:#16a34a;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Go to Login</a></p>
        </div>
      `;
      await sendMail(user.email, 'Recruiter account approved', html);
      if (user.officialEmail && user.officialEmail !== user.email) {
        await sendMail(user.officialEmail, 'Recruiter account approved', html);
      }
    } else if (status === 'declined') {
      const html = `
        <div style="font-family:Arial,sans-serif">
          <h2>Recruiter application declined</h2>
          <p>Hello ${user.recruiterName || user.name || ''},</p>
          <p>Unfortunately, your application has been declined.</p>
          <p><strong>Reason:</strong> ${user.declineReason || 'Not provided'}</p>
        </div>
      `;
      await sendMail(user.email, 'Recruiter application declined', html);
      if (user.officialEmail && user.officialEmail !== user.email) {
        await sendMail(user.officialEmail, 'Recruiter application declined', html);
      }
    }

    res.json({ message: `Recruiter ${status} successfully.` });
  } catch (err) {
    console.error('❌ Admin Status Update Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/** ===================== EMAIL VERIFY ===================== */
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).send('Invalid token');

    const user = await User.findOne({
      verificationToken: token,
      verificationTokenExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).send('Verification link is invalid or expired.');
    }

    user.emailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpires = undefined;

    if (user.role === 'candidate') {
      user.status = 'approved';
       user.onboardingStep = 'done';
    } else if (user.role === 'recruiter') {
      user.status = 'pending';
      user.onboardingStep = 'recruiter-onboarding';
    }

    await user.save();

    return res.redirect(`${FRONTEND_URL}/login`);
  } catch (err) {
    console.error('❌ Verify Email Error:', err);
    return res.status(500).send('Server error');
  }
};

exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.emailVerified) {
      return res.json({ message: 'Email is already verified' });
    }

    await issueVerificationEmail(user);
    res.json({ message: 'Verification email resent' });
  } catch (err) {
    console.error('❌ Resend Verification Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

/** ===================== PASSWORD RESET ===================== */

// Request reset
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) return res.status(404).json({ message: 'Email not found' });

    const token = signResetToken(user._id.toString());
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save();

    const link = `${FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`;
    await sendMail(user.email, 'Reset your password', resetEmailHTML(user.name, link));

    res.json({ message: 'Password reset link sent' });
  } catch (err) {
    console.error('❌ forgotPassword Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Resend reset (front-end enforces 2 min timer)
exports.resendReset = async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email: String(email).toLowerCase().trim() });
    if (!user) return res.status(404).json({ message: 'Email not found' });

    const token = signResetToken(user._id.toString());
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const link = `${FRONTEND_URL}/reset-password?token=${encodeURIComponent(token)}`;
    await sendMail(user.email, 'Reset your password', resetEmailHTML(user.name, link));

    res.json({ message: 'Password reset link re-sent' });
  } catch (err) {
    console.error('❌ resendReset Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reset with token
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body || {};
    if (!token || !password) return res.status(400).json({ message: 'Token and new password are required' });

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ message: 'Invalid or expired reset link' });
    }
    if (payload?.type !== 'passwordReset') {
      return res.status(400).json({ message: 'Invalid reset link' });
    }

    const user = await User.findById(payload.sub);
    if (!user) return res.status(400).json({ message: 'Invalid reset link' });

    if (user.resetPasswordToken !== token || !user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      return res.status(400).json({ message: 'Reset link expired. Please request a new one.' });
    }

    user.password = password; // pre-save hook will hash
    user.resetPasswordToken = undefined;
     
    // Invalidate all refresh sessions after password reset
    user.authSessions = [];

    await user.save();

    clearAccessCookie(res);
    clearRefreshCookie(res);

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('❌ resetPassword Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.refresh = async (req, res) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ message: 'Refresh token missing' });
    }

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch (err) {
      clearAccessCookie(res);
      clearRefreshCookie(res);
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    if (payload?.typ !== 'refresh' || !payload?.sub || !payload?.sid) {
      clearAccessCookie(res);
      clearRefreshCookie(res);
      return res.status(401).json({ message: 'Invalid refresh token payload' });
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      clearAccessCookie(res);
      clearRefreshCookie(res);
      return res.status(401).json({ message: 'User no longer exists' });
    }

    const sessions = Array.isArray(user.authSessions) ? user.authSessions : [];
    const currentHash = hashToken(token);

    const existingSessionIndex = sessions.findIndex(
      (s) =>
        String(s._id) === String(payload.sid) &&
        s.tokenHash === currentHash &&
        new Date(s.expiresAt).getTime() > Date.now()
    );

    if (existingSessionIndex === -1) {
      user.authSessions = sessions.filter(
        (s) => new Date(s.expiresAt).getTime() > Date.now()
      );
      await user.save();
      clearAccessCookie(res);
      clearRefreshCookie(res);
      return res.status(401).json({ message: 'Refresh session not found or expired' });
    }

    const { rawToken, session: newSession } = generateRefreshSession(user, getRequestMeta(req));

    user.authSessions.splice(existingSessionIndex, 1, newSession);
    await user.save();

  
    const newAccessToken = signAccessToken(user);

    res.cookie(ACCESS_COOKIE_NAME, newAccessToken, getAccessCookieOptions());
    res.cookie(REFRESH_COOKIE_NAME, rawToken, getRefreshCookieOptions());

    return res.json({
     user: sanitizeAuthUser(user),
       });
  } catch (error) {
    console.error('❌ Refresh Error:', error);
    return res.status(500).json({ message: 'Server error during refresh' });
  }
};


exports.logout = async (req, res) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE_NAME];

    if (!token) {
      clearAccessCookie(res);
      clearRefreshCookie(res);
      return res.json({ message: 'Logged out successfully' });
    }

    try {
      const payload = verifyRefreshToken(token);

      if (payload?.sub && payload?.sid) {
        const user = await User.findById(payload.sub);
        if (user) {
          user.authSessions = (user.authSessions || []).filter(
            (s) => String(s._id) !== String(payload.sid)
          );
          await user.save();
        }
      }
    } catch (err) {
      // ignore token parsing failure, still clear cookies
    }

    clearAccessCookie(res);
    clearRefreshCookie(res);
    return res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('❌ Logout Error:', error);
    return res.status(500).json({ message: 'Server error during logout' });
  }
};


exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ user: sanitizeAuthUser(user) });
  } catch (error) {
    console.error('❌ Me Error:', error);
    return res.status(500).json({ message: 'Server error fetching current user' });
  }
};

exports.selectRecruiterRole = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user || user.role !== 'pending') {
      return res.status(403).json({ message: 'Unauthorized or role already selected' });
    }

    user.role = 'recruiter';
    user.status = 'pending';
    user.emailVerified = false;
    user.onboardingStep = 'recruiter-onboarding';

    await user.save();
    await issueVerificationEmail(user);

    return res.json({
      message: 'Recruiter role selected. Verification email sent.',
      user: sanitizeAuthUser(user),
    });
  } catch (err) {
    console.error('❌ selectRecruiterRole Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};