// client/src/components/MainNavbar.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./MainNavbar.css";

const MainNavbar = () => {
  const navigate = useNavigate();

  return (
    <nav className="main-navbar">
      <div className="nav-inner">

        {/* LOGO IMAGE */}
        <img
          src="/logo.png"
          alt="TalentHire Logo"
          className="nav-logo-img"
          onClick={() => navigate("/")}
        />

        <div className="nav-links">
          <a href="#about" className="nav-link">
            About
          </a>

          <a href="#services" className="nav-link">
            Services
          </a>

          <button
            className="nav-login-btn"
            onClick={() => navigate("/login")}
          >
            Login
          </button>

          <button
            className="nav-signup-btn"
            onClick={() => navigate("/signup")}
          >
            Sign Up
          </button>
        </div>
      </div>
    </nav>
  );
};

export default MainNavbar;
