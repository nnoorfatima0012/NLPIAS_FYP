// src/components/AdminNavbar.jsx
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const AdminNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path ? 'nav-link active' : 'nav-link';

  return (
    <nav className="admin-navbar">
      <div className="nav-container">
        {/* Logo Section */}
        <div className="nav-logo">
          <img
            src="/logo.png"
            alt="CareerConnect Admin"
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
          <Link to="/admin" className={isActive('/admin')}>
            <i className="fa-solid fa-gauge-high nav-icon"></i>
            <span>Dashboard</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default AdminNavbar;
