// client/src/components/CandidateNavbar.jsx 
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const CandidateNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <nav className="candidate-navbar">
      <div className="nav-container">
        {/* Logo Section */}
        <div className="nav-logo">
          <img
            src="/logo.png"
            alt="CareerConnect"
            className="logo-img"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <div className="logo-fallback" style={{ display: 'none' }}>
            <span>CareerConnect</span>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="nav-links">
          <Link
            to="/candidate/job-search"
            className={isActive('/candidate/job-search')}
          >
            <i className="fa-solid fa-magnifying-glass nav-icon"></i>
            <span>Job Search</span>
          </Link>

          <Link
            to="/candidate/resume-builder"
            className={isActive('/candidate/resume-builder')}
          >
            <i className="fa-regular fa-file-lines nav-icon"></i>
            <span>Resume Builder</span>
          </Link>

          <Link
            to="/candidate/applied-jobs"
            className={isActive('/candidate/applied-jobs')}
          >
            <i className="fa-regular fa-clipboard nav-icon"></i>
            <span>Applied Jobs</span>
          </Link>

          <Link
            to="/candidate/manage-cv"
            className={isActive('/candidate/manage-cv')}
          >
            <i className="fa-solid fa-briefcase nav-icon"></i>
            <span>Manage CV</span>
          </Link>

          <Link
            to="/candidate/mock-interview"
            className={isActive('/candidate/mock-interview')}
          >
            <i className="fa-solid fa-microphone nav-icon"></i>
            <span>Mock Interview</span>
          </Link>

          {/* ❌ CV Ranking link removed */}

          <Link
            to="/candidate/interview-invitation"
            className={isActive('/candidate/interview-invitation')}
          >
            <i className="fa-regular fa-calendar-check nav-icon"></i>
            <span>Interview Invitation</span>
          </Link>
        </div>

        {/* Profile Shortcut (NO dropdown, NO logout here) */}
        <div className="nav-profile">
          <button
            className="profile-trigger profile-trigger-inline"
            onClick={() => navigate('/candidate/profile')}
          >
            <div className="profile-avatar">
              <i className="fa-regular fa-user"></i>
            </div>
            <i className="fa-solid fa-chevron-right profile-arrow"></i>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default CandidateNavbar;
