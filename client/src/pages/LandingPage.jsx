// client/src/pages/LandingPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import MainNavbar from "../components/MainNavbar";
import Footer from "../components/Footer";
import "./LandingPage.css";

const LandingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  /* ----------------------------------------------------------
     WHY CHOOSE US SLIDES
  ----------------------------------------------------------- */
  const whySlides = [
    {
      id: 0,
      text:
        "Companies choose our platform for its accuracy, speed, and AI-driven hiring intelligence. Recruiters report that we cut screening time dramatically while improving quality.",
    },
    {
      id: 1,
      text:
        "Our AI models are trained on real hiring scenarios, giving you explainable scores, structured feedback, and a consistent process across every team and location.",
    },
    {
      id: 2,
      text:
        "TalentHire is built to scale with you from first hire to global teams while staying unbiased, compliant, and easy to plug into your existing ATS or HR tools.",
    },
  ];

  const [activeWhyIndex, setActiveWhyIndex] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveWhyIndex((prev) => (prev + 1) % whySlides.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [whySlides.length]);

  /* ----------------------------------------------------------
     SCROLL FUNCTION — WORKING VERSION
  ----------------------------------------------------------- */
  const scrollToSection = useCallback((sectionId) => {
    const el = document.getElementById(sectionId);
    if (!el) {
      console.warn(`Element with id "${sectionId}" NOT found`);
      return;
    }

    const NAV_OFFSET = 80; // Height of fixed navbar
    const y = el.getBoundingClientRect().top + window.pageYOffset - NAV_OFFSET;

    window.scrollTo({
      top: y,
      behavior: "smooth",
    });
  }, []);

  /* ----------------------------------------------------------
     AUTO-SCROLL WHEN COMING FROM ANOTHER PAGE
  ----------------------------------------------------------- */
  useEffect(() => {
    if (location.state?.scrollTo) {
      const id = location.state.scrollTo;

      setTimeout(() => {
        requestAnimationFrame(() => scrollToSection(id));
      }, 300);
    }
  }, [location.state, scrollToSection]);

  /* ----------------------------------------------------------
     CTA BUTTON CLICK
  ----------------------------------------------------------- */
  const handleGetStarted = () => {
    navigate("/login");
  };

  /* ----------------------------------------------------------
     RENDER
  ----------------------------------------------------------- */
  return (
    <div className="landing-page">
      <MainNavbar onNavClick={scrollToSection} />

      {/* HERO */}
      <section className="landing-hero" id="hero">
        <div className="hero-inner">
          {/* LEFT CONTENT */}
          <div className="hero-left">
            <p className="hero-tagline">Smart Screening for Smarter Hiring</p>

            <h1 className="hero-heading">
              SMART HIRING
              <br />
              <span>By AI</span>
            </h1>

            <p className="hero-extra">
              TalentHire turns messy resumes into clear matches helping
              candidates find perfect roles and recruiters move from screening
              to offers in a fraction of the time.
            </p>

            <button className="hero-cta" onClick={handleGetStarted}>
              Get Started →
            </button>
          </div>

          {/* RIGHT ILLUSTRATION */}
          <div className="hero-right">
            <div className="hero-illustration">
              <div className="hero-illustration-content">
                <div className="hero-profile-cards">
                  <div className="hero-profile hero-profile--selected">
                    <div className="hero-avatar" />
                    <div>
                      <div className="hero-profile-name">Top Candidate</div>
                      <div className="hero-profile-role">
                        Full-Stack Engineer
                      </div>
                    </div>
                    <div className="hero-checkmark">✓</div>
                  </div>

                  <div className="hero-profile">
                    <div className="hero-avatar hero-avatar--alt" />
                    <div>
                      <div className="hero-profile-name">Shortlisted</div>
                      <div className="hero-profile-role">
                        Backend Developer
                      </div>
                    </div>
                  </div>
                </div>

                <div className="hero-tablet">
                  <div className="hero-tablet-header">
                    <span>AI Interview Summary</span>
                    <span className="hero-score-pill">Score 92%</span>
                  </div>

                  <p className="hero-tablet-text">
                    Candidate shows strong problem-solving, clear communication,
                    and deep understanding of system design.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="landing-section services-section" id="services">
        <div className="section-inner">
          <h2 className="section-title">Services we offer</h2>

          <div className="services-grid">
            <div className="service-card">
              <div className="service-icon service-icon--pink">🎤</div>
              <h3 className="service-title">Automated AI Interviews</h3>
              <p className="service-text">
                Generates tailored interview questions from each candidate&apos;s
                skills and experience and provides consistent, AI-driven scoring.
              </p>
            </div>

            <div className="service-card service-card--highlight">
              <div className="service-icon service-icon--purple">⚙️</div>
              <h3 className="service-title">Candidate Ranking</h3>
              <p className="service-text">
                Scores and ranks candidates based on résumé relevance and
                interview performance so recruiters can quickly identify top
                talent.
              </p>
            </div>

            <div className="service-card">
              <div className="service-icon service-icon--blue">🎧</div>
              <h3 className="service-title">Mock Interview Practice</h3>
              <p className="service-text">
                Gives candidates a safe environment to rehearse interviews and
                receive AI feedback to build confidence and communication skills.
              </p>
            </div>

            <div className="service-card">
              <div className="service-icon service-icon--teal">📊</div>
              <h3 className="service-title">Real-Time Insights</h3>
              <p className="service-text">
                Delivers live analytics on pipeline health, bottlenecks, and
                hiring performance across roles and teams.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="landing-section trust-section" id="about">
        <div className="trust-inner">
          <div className="trust-left">
            <p className="trust-label">About</p>
            <div className="trust-accent-line" />
            <h2 className="trust-heading">
              Leading companies trust us
              <br />
              <span>to hire developers</span>
            </h2>
            <p className="trust-text">
              We strengthen recruitment teams by adding AI intelligence at every
              stage of hiring. From automated resume analysis to smart
              interviews and candidate ranking, TalentHire ensures seamless,
              reliable, and high-quality hiring decisions.
            </p>
          </div>

          <div className="trust-right">
            <div className="trust-media">
              <div className="trust-media-overlay" />
              <div className="trust-media-footer">
                <span>Teams hiring together with MCVPARSER</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="landing-section why-section" id="why-choose-us">
        <div className="section-inner">
          <h2 className="why-heading">
            Why choose us
            <br />
            <span>to power your hiring</span>
          </h2>

          <p className="why-text">{whySlides[activeWhyIndex].text}</p>

          <div className="why-dots">
            {whySlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                className={
                  "dot" + (index === activeWhyIndex ? " dot--active" : "")
                }
                onClick={() => setActiveWhyIndex(index)}
              />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
