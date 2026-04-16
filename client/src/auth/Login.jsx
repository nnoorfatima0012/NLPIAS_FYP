// // client/src/auth/Login.jsx
// import { useState } from 'react';
// import { Formik, Form, Field, ErrorMessage } from 'formik';
// import * as Yup from 'yup';
// import { useNavigate, Link } from 'react-router-dom';
// import { api } from '../utils/api';
// import './Login.css';

// const LoginSchema = Yup.object().shape({
//   email: Yup.string().email('Invalid email').required('Email is required'),
//   password: Yup.string().required('Password is required'),
// });

// export default function Login() {
//   const nav = useNavigate();
//   const [showPassword, setShowPassword] = useState(false);

//   const handleSubmit = async (values, { setSubmitting, setErrors }) => {
//   try {
//     const { data } = await api.post('/auth/login', values);

//     const { accessToken, user } = data;
//     const {
//       id,
//       role,
//       name,
//       status,
//       declineReason,
//       emailVerified,
//       onboardingStep,
//     } = user;

//     localStorage.setItem('token', accessToken);
//     localStorage.setItem('role', role);
//     localStorage.setItem('name', name);
//     localStorage.setItem('userId', id);
//     localStorage.setItem('status', status);
//     localStorage.setItem('emailVerified', String(emailVerified));
//     localStorage.setItem('onboardingStep', onboardingStep || 'choose-role');

//     if (role === 'admin') {
//       alert('✅ Logged in as admin');
//       nav('/admin');
//       return;
//     }

//     if (role === 'pending' || onboardingStep === 'choose-role') {
//       alert('✅ Please choose your role to continue.');
//       nav('/choose-role');
//       return;
//     }

//     if (role === 'recruiter') {
//       if (!emailVerified) {
//         setErrors({
//           general: (
//             <span>
//               Please verify your email. Didn’t get the email?{' '}
//               <button
//                 type="button"
//                 onClick={async () => {
//                   try {
//                     await api.post('/auth/resend-verification', { email: values.email });
//                     alert('📧 Verification email resent. Please check your inbox.');
//                   } catch {
//                     alert('Could not resend verification email.');
//                   }
//                 }}
//                 style={{
//                   background: 'none',
//                   border: 'none',
//                   color: '#1d4ed8',
//                   textDecoration: 'underline',
//                   cursor: 'pointer',
//                   padding: 0,
//                 }}
//               >
//                 Resend it
//               </button>.
//             </span>
//           ),
//         });
//         return;
//       }

//       if (status === 'pending') {
//         alert('✅ Your recruiter account is pending admin approval.');
//         nav('/recruiter/pending');
//         return;
//       }

//       if (status === 'declined') {
//         alert(`❌ Your account was declined. Reason: ${declineReason || 'No reason provided'}`);
//         nav('/recruiter/declined');
//         return;
//       }

//       alert('✅ Logged in as recruiter');
//       nav('/recruiter');
//       return;
//     }

//     if (role === 'candidate') {
//       if (!emailVerified) {
//         setErrors({
//           general: (
//             <span>
//               Please verify your email. Didn’t get the email?{' '}
//               <button
//                 type="button"
//                 onClick={async () => {
//                   try {
//                     await api.post('/auth/resend-verification', { email: values.email });
//                     alert('📧 Verification email resent. Please check your inbox.');
//                   } catch {
//                     alert('Could not resend verification email.');
//                   }
//                 }}
//                 style={{
//                   background: 'none',
//                   border: 'none',
//                   color: '#1d4ed8',
//                   textDecoration: 'underline',
//                   cursor: 'pointer',
//                   padding: 0,
//                 }}
//               >
//                 Resend it
//               </button>.
//             </span>
//           ),
//         });
//         return;
//       }

//       alert('✅ Logged in as candidate');
//       nav('/candidate');
//       return;
//     }

//     setErrors({ general: 'Login flow could not determine account state.' });
//   } catch (error) {
//     const msg = error.response?.data?.message || 'Login failed. Please check your credentials.';
//     const needsVerification = error.response?.data?.needsVerification;
//     const needsRoleSelection = error.response?.data?.needsRoleSelection;
//     const pendingApproval = error.response?.data?.pendingApproval;
//     const declined = error.response?.data?.declined;
//     const declineReason = error.response?.data?.declineReason;

//     if (needsVerification) {
//       setErrors({
//         general: (
//           <span>
//             {msg} Didn’t get the email?{' '}
//             <button
//               type="button"
//               onClick={async () => {
//                 try {
//                   await api.post('/auth/resend-verification', { email: values.email });
//                   alert('📧 Verification email resent. Please check your inbox.');
//                 } catch {
//                   alert('Could not resend verification email.');
//                 }
//               }}
//               style={{
//                 background: 'none',
//                 border: 'none',
//                 color: '#1d4ed8',
//                 textDecoration: 'underline',
//                 cursor: 'pointer',
//                 padding: 0,
//               }}
//             >
//               Resend it
//             </button>.
//           </span>
//         ),
//       });
//     } else if (needsRoleSelection) {
//       setErrors({ general: msg });
//       nav('/choose-role');
//     } else if (pendingApproval) {
//       alert('✅ Your recruiter account is pending admin approval.');
//       nav('/recruiter/pending');
//     } else if (declined) {
//       alert(`❌ ${declineReason || msg}`);
//       nav('/recruiter/declined');
//     } else {
//       setErrors({ general: msg });
//     }
//   } finally {
//     setSubmitting(false);
//   }
// };

//   return (
//     <div className="login-page">
//       <div className="background-section">
//         <div className="auth-container">
//           {/* LEFT SIDE HERO */}
//           <div className="auth-left">
//             <div className="hero-logo-wrapper">
//               <img src="logo.png" alt="Talent Hire Logo" className="hero-logo" />
//             </div>

//             <h1 className="hero-title">
//               Smart screening for<br /> smarter hiring
//             </h1>

//             <p className="hero-subtitle">
//               The Future of Tech Interviews. Streamline your recruitment process
//               with our AI-powered assessment platform.
//             </p>

//             <div className="hero-image-wrapper">
//               <img src="login.png" alt="Talent Hire Illustration" className="hero-image" />
//             </div>
//           </div>

//           {/* RIGHT SIDE FORM */}
//           <div className="auth-right">
//             <div className="auth-card">
//               <h2 className="auth-title">Welcome Back</h2>
//               <p className="auth-subtitle">Login to your Talent Hire account</p>

//               {/* Tabs row */}
//               <div className="auth-tabs">
//                 <button type="button" className="auth-tab active">
//                   Login
//                 </button>
//                 <Link to="/signup" className="auth-tab">
//                   Sign Up
//                 </Link>
//               </div>

//               <Formik
//                 initialValues={{ email: '', password: '' }}
//                 validationSchema={LoginSchema}
//                 onSubmit={handleSubmit}
//               >
//                 {({ isSubmitting, errors }) => (
//                   <Form>
//                     <label className="field-label">Email Address</label>
//                     <Field
//                       type="email"
//                       name="email"
//                       placeholder="Enter your email"
//                       className="text-input"
//                     />
//                     <ErrorMessage name="email" component="div" className="error" />

//                     <label className="field-label">Password</label>
//                     <div className="password-wrapper">
//                       <Field
//                         type={showPassword ? 'text' : 'password'}
//                         name="password"
//                         placeholder="Enter your password"
//                         className="text-input password-input"
//                       />
//                       <button
//                         type="button"
//                         className="password-eye"
//                         onClick={() => setShowPassword((v) => !v)}
//                         aria-label={showPassword ? 'Hide password' : 'Show password'}
//                       >
//                         {/* 👁 open / 👁‍🗨 “crossed” style, no monkey */}
//                         {showPassword ? '👁‍🗨' : '👁'}
//                       </button>
//                     </div>
//                     <ErrorMessage name="password" component="div" className="error" />

//                     <div className="forgot-row">
//                       <Link to="/forgot-password" className="forgot-link">
//                         Forgot password?
//                       </Link>
//                     </div>

//                     {errors.general && <div className="error">{errors.general}</div>}

//                     <button type="submit" className="primary-btn" disabled={isSubmitting}>
//                       Login
//                     </button>

//                     <p className="signup-footer">
//                       Not registered?{' '}
//                       <Link to="/signup" className="signup-footer-link">
//                         Sign up here
//                       </Link>
//                     </p>
//                   </Form>
//                 )}
//               </Formik>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }


// client/src/auth/Login.jsx
import { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { useAuth } from '../context/authContext';
import './Login.css';

const LoginSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().required('Password is required'),
});

export default function Login() {
  const nav = useNavigate();
  const { loginAuth } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (values, { setSubmitting, setErrors }) => {
    try {
      const { data } = await api.post('/auth/login', values);

      const { user } = data;
      const {
        role,
        status,
        declineReason,
        emailVerified,
        onboardingStep,
      } = user;

      loginAuth({ user });

      if (role === 'admin') {
        alert('✅ Logged in as admin');
        nav('/admin');
        return;
      }

      if (role === 'pending' || onboardingStep === 'choose-role') {
        alert('✅ Please choose your role to continue.');
        nav('/choose-role');
        return;
      }

      if (role === 'recruiter') {
        if (!emailVerified) {
          setErrors({
            general: (
              <span>
                Please verify your email. Didn’t get the email?{' '}
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await api.post('/auth/resend-verification', { email: values.email });
                      alert('📧 Verification email resent. Please check your inbox.');
                    } catch {
                      alert('Could not resend verification email.');
                    }
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#1d4ed8',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Resend it
                </button>.
              </span>
            ),
          });
          return;
        }

        if (status === 'pending') {
          alert('✅ Your recruiter account is pending admin approval.');
          nav('/recruiter/pending');
          return;
        }

        if (status === 'declined') {
          alert(`❌ Your account was declined. Reason: ${declineReason || 'No reason provided'}`);
          nav('/recruiter/declined');
          return;
        }

        alert('✅ Logged in as recruiter');
        nav('/recruiter');
        return;
      }

      if (role === 'candidate') {
        if (!emailVerified) {
          setErrors({
            general: (
              <span>
                Please verify your email. Didn’t get the email?{' '}
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await api.post('/auth/resend-verification', { email: values.email });
                      alert('📧 Verification email resent. Please check your inbox.');
                    } catch {
                      alert('Could not resend verification email.');
                    }
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#1d4ed8',
                    textDecoration: 'underline',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  Resend it
                </button>.
              </span>
            ),
          });
          return;
        }

        alert('✅ Logged in as candidate');
        nav('/candidate');
        return;
      }

      setErrors({ general: 'Login flow could not determine account state.' });
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed. Please check your credentials.';
      const needsVerification = error.response?.data?.needsVerification;
      const needsRoleSelection = error.response?.data?.needsRoleSelection;
      const pendingApproval = error.response?.data?.pendingApproval;
      const declined = error.response?.data?.declined;
      const declineReason = error.response?.data?.declineReason;

      if (needsVerification) {
        setErrors({
          general: (
            <span>
              {msg} Didn’t get the email?{' '}
              <button
                type="button"
                onClick={async () => {
                  try {
                    await api.post('/auth/resend-verification', { email: values.email });
                    alert('📧 Verification email resent. Please check your inbox.');
                  } catch {
                    alert('Could not resend verification email.');
                  }
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1d4ed8',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Resend it
              </button>.
            </span>
          ),
        });
      } else if (needsRoleSelection) {
        setErrors({ general: msg });
        nav('/choose-role');
      } else if (pendingApproval) {
        alert('✅ Your recruiter account is pending admin approval.');
        nav('/recruiter/pending');
      } else if (declined) {
        alert(`❌ ${declineReason || msg}`);
        nav('/recruiter/declined');
      } else {
        setErrors({ general: msg });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="background-section">
        <div className="auth-container">
          <div className="auth-left">
            <div className="hero-logo-wrapper">
              <img src="/logo.png" alt="Talent Hire Logo" className="hero-logo" />
            </div>

            <h1 className="hero-title">
              Smart screening for<br /> smarter hiring
            </h1>

            <p className="hero-subtitle">
              The Future of Tech Interviews. Streamline your recruitment process
              with our AI-powered assessment platform.
            </p>

            <div className="hero-image-wrapper">
              <img src="/login.png" alt="Talent Hire Illustration" className="hero-image" />
            </div>
          </div>

          <div className="auth-right">
            <div className="auth-card">
              <h2 className="auth-title">Welcome Back</h2>
              <p className="auth-subtitle">Login to your Talent Hire account</p>

              <div className="auth-tabs">
                <button type="button" className="auth-tab active">
                  Login
                </button>
                <Link to="/signup" className="auth-tab">
                  Sign Up
                </Link>
              </div>

              <Formik
                initialValues={{ email: '', password: '' }}
                validationSchema={LoginSchema}
                onSubmit={handleSubmit}
              >
                {({ isSubmitting, errors }) => (
                  <Form>
                    <label className="field-label">Email Address</label>
                    <Field
                      type="email"
                      name="email"
                      placeholder="Enter your email"
                      className="text-input"
                    />
                    <ErrorMessage name="email" component="div" className="error" />

                    <label className="field-label">Password</label>
                    <div className="password-wrapper">
                      <Field
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="Enter your password"
                        className="text-input password-input"
                      />
                      <button
                        type="button"
                        className="password-eye"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? '👁‍🗨' : '👁'}
                      </button>
                    </div>
                    <ErrorMessage name="password" component="div" className="error" />

                    <div className="forgot-row">
                      <Link to="/forgot-password" className="forgot-link">
                        Forgot password?
                      </Link>
                    </div>

                    {errors.general && <div className="error">{errors.general}</div>}

                    <button type="submit" className="primary-btn" disabled={isSubmitting}>
                      Login
                    </button>

                    <p className="signup-footer">
                      Not registered?{' '}
                      <Link to="/signup" className="signup-footer-link">
                        Sign up here
                      </Link>
                    </p>
                  </Form>
                )}
              </Formik>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}