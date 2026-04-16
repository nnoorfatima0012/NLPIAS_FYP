// src/components/RecruiterNavbar.jsx
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const RecruiterNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <nav className="recruiter-navbar">
      <div className="nav-container">
        {/* Logo Section */}
        <div className="nav-logo">
          <img
            src="/logo.png"
            alt="Recruiter Portal"
            className="logo-img"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <div className="logo-fallback" style={{ display: 'none' }}>
            <span>Recruiter Portal</span>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="nav-links">
          <Link to="/recruiter" className={isActive('/recruiter')}>
            <i className="fa-solid fa-gauge nav-icon"></i>
            <span>Dashboard</span>
          </Link>

          <Link
            to="/recruiter/post-job"
            className={isActive('/recruiter/post-job')}
          >
            <i className="fa-solid fa-file-circle-plus nav-icon"></i>
            <span>Post Job</span>
          </Link>

          <Link
            to="/recruiter/my-jobs"
            className={isActive('/recruiter/my-jobs')}
          >
            <i className="fa-solid fa-briefcase nav-icon"></i>
            <span>My Job Posts</span>
          </Link>

          <Link
            to="/recruiter/view-applied-candidates"
            className={isActive('/recruiter/view-applied-candidates')}
          >
            <i className="fa-solid fa-users nav-icon"></i>
            <span>Applied Candidates</span>
          </Link>

          <Link
            to="/recruiter/search-candidates"
            className={isActive('/recruiter/search-candidates')}
          >
            <i className="fa-solid fa-magnifying-glass nav-icon"></i>
            <span>Search Candidates</span>
          </Link>
        </div>

        {/* Profile Shortcut */}
        <div className="nav-profile">
          <button
            className="profile-trigger profile-trigger-inline"
            onClick={() => navigate('/recruiter/profile')}
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

export default RecruiterNavbar;
