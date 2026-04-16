// client/src/pages/Candidate/Profile.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../utils/api";
import { useAuth } from "../../context/authContext";
import "./Profile.css";

const API_BASE = import.meta?.env?.VITE_API_BASE || "http://localhost:5000";

const EMPTY_PROFILE = {
  fullName: "",
  email: "",
  phone: "",
  city: "",
  bio: "",
  skills: [],
  skillsText: "",
  photoUrl: "",
  jobTitle: "",          // NEW
  targetRole: "",        // NEW
  jobType: "",
  preferredLocations: "",
  expectedSalary: "",
  willingToRelocate: "",
  linkedin: "",
  github: "",
  portfolio: "",
  aiInterviewHistory: [],
  jobMatchInsights: [],
};

const Profile = () => {
  const navigate = useNavigate();
  const { logoutAuth } = useAuth();
  const [activeSection, setActiveSection] = useState("summary"); // default = summary
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // controls UI: Save vs Edit/Delete for each section
  const [editingSections, setEditingSections] = useState({
    overview: true,
    preferences: true,
    social: true,
    aiHistory: true,
    jobInsights: true,
  });

  // status message after saving
  const [saveStatus, setSaveStatus] = useState({
    section: null,
    message: "",
  });

  const [newInterview, setNewInterview] = useState({
    date: "",
    jobRole: "",
    score: "",
    feedback: "",
  });

  const [newInsight, setNewInsight] = useState({
    jobTitle: "",
    matchPercent: "",
    location: "",
    skillsToImprove: "",
  });

  /* ---------- Load profile from API ---------- */

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/profile/me");
        const data = res.data || {};
        setProfile({
          ...EMPTY_PROFILE,
          ...data,
          skills: Array.isArray(data.skills) ? data.skills : [],
          skillsText: Array.isArray(data.skills)
            ? data.skills.join(", ")
            : "",
        });
      } catch (err) {
        console.error("Load profile error:", err?.response || err);
        setProfile(EMPTY_PROFILE);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  /* ---------- Completion % ---------- */

  const completion = useMemo(() => {
    // 3 sections: overview, preferences, social
    let total = 3;
    let done = 0;

    const hasOverview =
      profile.fullName &&
      profile.email &&
      profile.phone &&
      profile.city &&
      profile.bio &&
      profile.skillsText &&
      profile.skillsText.trim().length > 0;

    const hasPreferences =
      (profile.jobTitle || profile.targetRole) && // new fields considered too
      profile.jobType &&
      profile.preferredLocations &&
      profile.expectedSalary &&
      profile.willingToRelocate;

    const hasSocial =
      profile.linkedin && profile.github && profile.portfolio;

    if (hasOverview) done++;
    if (hasPreferences) done++;
    if (hasSocial) done++;

    if (!done) return 0;
    return Math.round((done / total) * 100);
  }, [profile]);

  /* ---------- Save helpers ---------- */

  const buildPayload = (override = {}) => {
    const merged = { ...profile, ...override };
    const skillsArr = (merged.skillsText || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    return {
      fullName: merged.fullName,
      email: merged.email,
      phone: merged.phone,
      city: merged.city,
      bio: merged.bio,
      skills: skillsArr,
      jobTitle: merged.jobTitle,              // NEW
      targetRole: merged.targetRole,          // NEW
      jobType: merged.jobType,
      preferredLocations: merged.preferredLocations,
      expectedSalary: merged.expectedSalary,
      willingToRelocate: merged.willingToRelocate,
      linkedin: merged.linkedin,
      github: merged.github,
      portfolio: merged.portfolio,
      aiInterviewHistory: merged.aiInterviewHistory || [],
      jobMatchInsights: merged.jobMatchInsights || [],
    };
  };

  const saveProfile = async (override = {}, sectionKey = null) => {
    try {
      setSaving(true);
      const payload = buildPayload(override);

      const res = await api.put("/profile/me", payload);

      const data = res.data || {};
      setProfile({
        ...EMPTY_PROFILE,
        ...data,
        skills: Array.isArray(data.skills) ? data.skills : [],
        skillsText: Array.isArray(data.skills)
          ? data.skills.join(", ")
          : "",
      });

      if (sectionKey) {
        setEditingSections((prev) => ({
          ...prev,
          [sectionKey]: false,
        }));
        setSaveStatus({
          section: sectionKey,
          message: "Your changes are saved.",
        });
      }
    } catch (err) {
      console.error("Save profile error:", err?.response || err);
      alert("Failed to save profile. Check console for details.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditSection = (sectionKey) => {
    setEditingSections((prev) => ({
      ...prev,
      [sectionKey]: true,
    }));
    setSaveStatus({ section: null, message: "" });
    setActiveSection(sectionKey);
  };

  const handleClearSection = (sectionKey) => {
    let overrides = {};
    switch (sectionKey) {
      case "overview":
        overrides = {
          fullName: "",
          email: "",
          phone: "",
          city: "",
          bio: "",
          skills: [],
          skillsText: "",
        };
        break;
      case "preferences":
        overrides = {
          jobTitle: "",
          targetRole: "",
          jobType: "",
          preferredLocations: "",
          expectedSalary: "",
          willingToRelocate: "",
        };
        break;
      case "social":
        overrides = {
          linkedin: "",
          github: "",
          portfolio: "",
        };
        break;
      case "aiHistory":
        overrides = {
          aiInterviewHistory: [],
        };
        break;
      case "jobInsights":
        overrides = {
          jobMatchInsights: [],
        };
        break;
      default:
        break;
    }

    if (Object.keys(overrides).length) {
      saveProfile(overrides, sectionKey);
    }
  };

  const handleLogout = async () => {
  await logoutAuth();
  navigate("/login");
};

  const handleDeleteProfile = async () => {
    if (
      !window.confirm(
        "Are you sure you want to clear your profile data (but keep your login account)?"
      )
    ) {
      return;
    }
    try {
      await api.delete("/profile/me");
      setProfile(EMPTY_PROFILE);
    } catch (err) {
      console.error("Delete profile error:", err?.response || err);
      alert("Failed to delete profile.");
    }
  };

  const handleDeleteAccount = async () => {
    const sure = window.confirm(
      "This will permanently delete your candidate account and profile data. This action cannot be undone. Continue?"
    );
    if (!sure) return;

    try {
      await api.delete("/account/me");
      await logoutAuth();
      navigate("/login");
    } catch (err) {
      console.error("Delete account error:", err?.response || err);
      alert("Failed to delete account. Please try again.");
    }
  };

  /* ---------- Photo upload ---------- */

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const form = new FormData();
    form.append("photo", file);

    try {
      const res = await api.post("/profile/photo", form, {
  headers: {
    "Content-Type": "multipart/form-data",
  },
});
      const { photoUrl, profile: updated } = res.data;

      setProfile((prev) => ({
        ...prev,
        photoUrl: photoUrl || prev.photoUrl,
        ...updated,
        skillsText: Array.isArray(updated?.skills)
          ? updated.skills.join(", ")
          : prev.skillsText,
      }));
    } catch (err) {
      console.error("Upload photo error:", err?.response || err);
      alert("Failed to upload photo.");
    }
  };

  /* ---------- AI History & Job Insights helpers ---------- */

  const addInterview = () => {
    if (!newInterview.date || !newInterview.jobRole) return;
    setProfile((prev) => ({
      ...prev,
      aiInterviewHistory: [
        ...(prev.aiInterviewHistory || []),
        {
          date: newInterview.date,
          jobRole: newInterview.jobRole,
          score: newInterview.score,
          feedback: newInterview.feedback,
        },
      ],
    }));
    setNewInterview({ date: "", jobRole: "", score: "", feedback: "" });
  };

  const removeInterview = (idx) => {
    setProfile((prev) => ({
      ...prev,
      aiInterviewHistory: prev.aiInterviewHistory.filter(
        (_, i) => i !== idx
      ),
    }));
  };

  const addInsight = () => {
    if (!newInsight.jobTitle || !newInsight.matchPercent) return;
    setProfile((prev) => ({
      ...prev,
      jobMatchInsights: [
        ...(prev.jobMatchInsights || []),
        {
          jobTitle: newInsight.jobTitle,
          matchPercent: newInsight.matchPercent,
          location: newInsight.location,
          skillsToImprove: newInsight.skillsToImprove,
        },
      ],
    }));
    setNewInsight({
      jobTitle: "",
      matchPercent: "",
      location: "",
      skillsToImprove: "",
    });
  };

  const removeInsight = (idx) => {
    setProfile((prev) => ({
      ...prev,
      jobMatchInsights: prev.jobMatchInsights.filter(
        (_, i) => i !== idx
      ),
    }));
  };

  /* ---------- Summary renderer ---------- */

  const renderSummarySection = () => {
    const hasOverview =
      profile.fullName ||
      profile.email ||
      profile.phone ||
      profile.city ||
      profile.bio ||
      (profile.skillsText && profile.skillsText.trim().length > 0);

    const hasPreferences =
      profile.jobTitle ||
      profile.targetRole ||
      profile.jobType ||
      profile.preferredLocations ||
      profile.expectedSalary ||
      profile.willingToRelocate;

    const hasSocial =
      profile.linkedin || profile.github || profile.portfolio;

    return (
      <div className="profile-card">
        <h2 className="profile-card-title">Profile Summary</h2>
        <p className="profile-card-subtitle">
          A quick overview of your profile, preferences and social links.
        </p>

        <div className="profile-summary-grid">
          {/* Overview Summary */}
          <div className="summary-section-card">
            <div className="summary-header">
              <h3 className="summary-title">Profile Overview</h3>
              <button
                type="button"
                className="summary-edit-btn"
                onClick={() => handleEditSection("overview")}
                title="Edit Profile Overview"
              >
                <i className="fa-solid fa-pen"></i>
              </button>
            </div>

            {hasOverview ? (
              <ul className="summary-list">
                {profile.fullName && (
                  <li>
                    <strong>Name:</strong> {profile.fullName}
                  </li>
                )}
                {profile.email && (
                  <li>
                    <strong>Email:</strong> {profile.email}
                  </li>
                )}
                {profile.phone && (
                  <li>
                    <strong>Phone:</strong> {profile.phone}
                  </li>
                )}
                {profile.city && (
                  <li>
                    <strong>City:</strong> {profile.city}
                  </li>
                )}
                {profile.bio && (
                  <li>
                    <strong>Bio:</strong> {profile.bio}
                  </li>
                )}
                {profile.skillsText && (
                  <li>
                    <strong>Skills:</strong> {profile.skillsText}
                  </li>
                )}
              </ul>
            ) : (
              <p className="summary-empty">No overview details added yet.</p>
            )}
          </div>

          {/* Preferences Summary */}
          <div className="summary-section-card">
            <div className="summary-header">
              <h3 className="summary-title">Preferences</h3>
              <button
                type="button"
                className="summary-edit-btn"
                onClick={() => handleEditSection("preferences")}
                title="Edit Preferences"
              >
                <i className="fa-solid fa-pen"></i>
              </button>
            </div>

            {hasPreferences ? (
              <ul className="summary-list">
                {profile.jobTitle && (
                  <li>
                    <strong>Job Title:</strong> {profile.jobTitle}
                  </li>
                )}
                {profile.targetRole && (
                  <li>
                    <strong>Target Role:</strong> {profile.targetRole}
                  </li>
                )}
                {profile.jobType && (
                  <li>
                    <strong>Job Type:</strong> {profile.jobType}
                  </li>
                )}
                {profile.preferredLocations && (
                  <li>
                    <strong>Preferred Locations:</strong>{" "}
                    {profile.preferredLocations}
                  </li>
                )}
                {profile.expectedSalary && (
                  <li>
                    <strong>Expected Salary:</strong>{" "}
                    {profile.expectedSalary}
                  </li>
                )}
                {profile.willingToRelocate && (
                  <li>
                    <strong>Willing to Relocate:</strong>{" "}
                    {profile.willingToRelocate}
                  </li>
                )}
              </ul>
            ) : (
              <p className="summary-empty">No preferences added yet.</p>
            )}
          </div>

          {/* Social Links Summary */}
          <div className="summary-section-card">
            <div className="summary-header">
              <h3 className="summary-title">Social Links</h3>
              <button
                type="button"
                className="summary-edit-btn"
                onClick={() => handleEditSection("social")}
                title="Edit Social Links"
              >
                <i className="fa-solid fa-pen"></i>
              </button>
            </div>

            {hasSocial ? (
              <ul className="summary-list">
                {profile.linkedin && (
                  <li>
                    <strong>LinkedIn:</strong>{" "}
                    <a
                      href={profile.linkedin}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {profile.linkedin}
                    </a>
                  </li>
                )}
                {profile.github && (
                  <li>
                    <strong>GitHub:</strong>{" "}
                    <a
                      href={profile.github}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {profile.github}
                    </a>
                  </li>
                )}
                {profile.portfolio && (
                  <li>
                    <strong>Portfolio:</strong>{" "}
                    <a
                      href={profile.portfolio}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {profile.portfolio}
                    </a>
                  </li>
                )}
              </ul>
            ) : (
              <p className="summary-empty">No social links added yet.</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  /* ---------- Section renderers ---------- */

  const renderSection = () => {
    switch (activeSection) {
      case "summary":
        return renderSummarySection();

      case "overview":
        return (
          <div className="profile-card">
            <h2 className="profile-card-title">Profile Overview</h2>
            <p className="profile-card-subtitle">
              Basic information about you as a candidate.
            </p>

            <div className="profile-grid-2">
              <div className="profile-photo-block">
                {profile.photoUrl ? (
                  <img
                    src={`${API_BASE}${profile.photoUrl}`}
                    alt="Profile"
                    className="profile-photo-img"
                  />
                ) : (
                  <div className="profile-photo-placeholder">
                    <span>Upload Photo</span>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="photo-upload-input"
                />
              </div>

              <div className="profile-form">
                <div className="form-row">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={profile.fullName}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        fullName: e.target.value,
                      }))
                    }
                    placeholder="Sania Abdul Jalil"
                    disabled={!editingSections.overview}
                  />
                </div>

                <div className="form-row">
                  <label>Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        email: e.target.value,
                      }))
                    }
                    placeholder="you@example.com"
                    disabled={!editingSections.overview}
                  />
                </div>

                <div className="form-row">
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        phone: e.target.value,
                      }))
                    }
                    placeholder="+92-300-0000000"
                    disabled={!editingSections.overview}
                  />
                </div>

                <div className="form-row">
                  <label>City</label>
                  <input
                    type="text"
                    value={profile.city}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        city: e.target.value,
                      }))
                    }
                    placeholder="Karachi / Islamabad"
                    disabled={!editingSections.overview}
                  />
                </div>
              </div>
            </div>

            <div className="form-row">
              <label>Short Bio / Summary</label>
              <textarea
                rows={3}
                value={profile.bio}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, bio: e.target.value }))
                }
                placeholder="Short 2–3 line summary about your experience and goals."
                disabled={!editingSections.overview}
              />
            </div>

            <div className="form-row">
              <label>Skills</label>
              <input
                type="text"
                value={profile.skillsText}
                onChange={(e) =>
                  setProfile((p) => ({
                    ...p,
                    skillsText: e.target.value,
                  }))
                }
                placeholder="e.g. React, Node.js, SQL, Communication"
                disabled={!editingSections.overview}
              />
              <small className="hint">
                Separate skills with commas. These will be saved as tags.
              </small>
            </div>

            <div className="profile-actions-row">
              {editingSections.overview ? (
                <button
                  className="btn-primary"
                  onClick={() => saveProfile({}, "overview")}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              ) : (
                <>
                  <span className="save-message">
                    {saveStatus.section === "overview" &&
                    saveStatus.message
                      ? saveStatus.message
                      : "Your changes are saved."}
                  </span>
                  <div className="actions-buttons">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => handleEditSection("overview")}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-light-danger"
                      onClick={() => handleClearSection("overview")}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case "preferences":
        return (
          <div className="profile-card">
            <h2 className="profile-card-title">Preferences</h2>
            <p className="profile-card-subtitle">
              Tell us what kind of roles you are looking for.
            </p>

            <div className="form-row">
              <label>Job Title</label>
              <input
                type="text"
                value={profile.jobTitle}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, jobTitle: e.target.value }))
                }
                placeholder="e.g. Junior Software Engineer"
                disabled={!editingSections.preferences}
              />
            </div>

            <div className="form-row">
              <label>Target Job Role</label>
              <input
                type="text"
                value={profile.targetRole}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, targetRole: e.target.value }))
                }
                placeholder="e.g. Backend Developer, Data Engineer"
                disabled={!editingSections.preferences}
              />
            </div>

            <div className="form-row">
              <label>Job Type</label>
              <select
                value={profile.jobType}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, jobType: e.target.value }))
                }
                disabled={!editingSections.preferences}
              >
                <option value="">Select...</option>
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Remote</option>
                <option>Internship</option>
              </select>
            </div>

            <div className="form-row">
              <label>Preferred Locations</label>
              <input
                type="text"
                value={profile.preferredLocations}
                onChange={(e) =>
                  setProfile((p) => ({
                    ...p,
                    preferredLocations: e.target.value,
                  }))
                }
                placeholder="e.g. Karachi, Islamabad, Remote"
                disabled={!editingSections.preferences}
              />
            </div>

            <div className="form-row">
              <label>Expected Salary</label>
              <input
                type="text"
                value={profile.expectedSalary}
                onChange={(e) =>
                  setProfile((p) => ({
                    ...p,
                    expectedSalary: e.target.value,
                  }))
                }
                placeholder="e.g. 60,000 - 80,000 / month"
                disabled={!editingSections.preferences}
              />
            </div>

            <div className="form-row">
              <label>Willing to Relocate</label>
              <select
                value={profile.willingToRelocate}
                onChange={(e) =>
                  setProfile((p) => ({
                    ...p,
                    willingToRelocate: e.target.value,
                  }))
                }
                disabled={!editingSections.preferences}
              >
                <option value="">Select...</option>
                <option>Yes</option>
                <option>No</option>
                <option>Maybe</option>
              </select>
            </div>

            <div className="profile-actions-row">
              {editingSections.preferences ? (
                <button
                  className="btn-primary"
                  onClick={() => saveProfile({}, "preferences")}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Preferences"}
                </button>
              ) : (
                <>
                  <span className="save-message">
                    {saveStatus.section === "preferences" &&
                    saveStatus.message
                      ? saveStatus.message
                      : "Your changes are saved."}
                  </span>
                  <div className="actions-buttons">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => handleEditSection("preferences")}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-light-danger"
                      onClick={() => handleClearSection("preferences")}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case "social":
        return (
          <div className="profile-card">
            <h2 className="profile-card-title">Social Links</h2>
            <p className="profile-card-subtitle">
              Add your professional profiles and portfolio.
            </p>

            <div className="form-row">
              <label>LinkedIn</label>
              <input
                type="url"
                value={profile.linkedin}
                onChange={(e) =>
                  setProfile((p) => ({
                    ...p,
                    linkedin: e.target.value,
                  }))
                }
                placeholder="https://www.linkedin.com/in/username"
                disabled={!editingSections.social}
              />
            </div>

            <div className="form-row">
              <label>GitHub</label>
              <input
                type="url"
                value={profile.github}
                onChange={(e) =>
                  setProfile((p) => ({
                    ...p,
                    github: e.target.value,
                  }))
                }
                placeholder="https://github.com/username"
                disabled={!editingSections.social}
              />
            </div>

            <div className="form-row">
              <label>Portfolio Website</label>
              <input
                type="url"
                value={profile.portfolio}
                onChange={(e) =>
                  setProfile((p) => ({
                    ...p,
                    portfolio: e.target.value,
                  }))
                }
                placeholder="https://your-portfolio.example.com"
                disabled={!editingSections.social}
              />
            </div>

            <div className="profile-actions-row">
              {editingSections.social ? (
                <button
                  className="btn-primary"
                  onClick={() => saveProfile({}, "social")}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Links"}
                </button>
              ) : (
                <>
                  <span className="save-message">
                    {saveStatus.section === "social" &&
                    saveStatus.message
                      ? saveStatus.message
                      : "Your changes are saved."}
                  </span>
                  <div className="actions-buttons">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => handleEditSection("social")}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-light-danger"
                      onClick={() => handleClearSection("social")}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case "aiHistory":
        return (
          <div className="profile-card">
            <h2 className="profile-card-title">AI Interview History</h2>
            <p className="profile-card-subtitle">
              Previous AI interview attempts and feedback.
            </p>

            {/* Add new record */}
            <div className="profile-form" style={{ marginBottom: 12 }}>
              <div className="form-row">
                <label>Date</label>
                <input
                  type="date"
                  value={newInterview.date}
                  onChange={(e) =>
                    setNewInterview((n) => ({
                      ...n,
                      date: e.target.value,
                    }))
                  }
                  disabled={!editingSections.aiHistory}
                />
              </div>
              <div className="form-row">
                <label>Job Role</label>
                <input
                  type="text"
                  value={newInterview.jobRole}
                  onChange={(e) =>
                    setNewInterview((n) => ({
                      ...n,
                      jobRole: e.target.value,
                    }))
                  }
                  placeholder="Junior React Developer"
                  disabled={!editingSections.aiHistory}
                />
              </div>
              <div className="form-row">
                <label>Score</label>
                <input
                  type="text"
                  value={newInterview.score}
                  onChange={(e) =>
                    setNewInterview((n) => ({
                      ...n,
                      score: e.target.value,
                    }))
                  }
                  placeholder="e.g. 82%"
                  disabled={!editingSections.aiHistory}
                />
              </div>
              <div className="form-row">
                <label>AI Feedback</label>
                <textarea
                  rows={2}
                  value={newInterview.feedback}
                  onChange={(e) =>
                    setNewInterview((n) => ({
                      ...n,
                      feedback: e.target.value,
                    }))
                  }
                  disabled={!editingSections.aiHistory}
                />
              </div>
              <div
                className="profile-actions-row"
                style={{ justifyContent: "flex-start" }}
              >
                {editingSections.aiHistory && (
                  <button className="btn-secondary" onClick={addInterview}>
                    + Add Interview
                  </button>
                )}
              </div>
            </div>

            {/* Existing records */}
            {profile.aiInterviewHistory?.length ? (
              <div className="table-like">
                <div className="table-header">
                  <span>Date</span>
                  <span>Job Role</span>
                  <span>Score</span>
                  <span>AI Feedback</span>
                </div>
                {profile.aiInterviewHistory.map((row, idx) => (
                  <div key={idx} className="table-row">
                    <span>
                      {row.date
                        ? new Date(row.date).toISOString().slice(0, 10)
                        : ""}
                    </span>
                    <span>{row.jobRole}</span>
                    <span>{row.score}</span>
                    <span>
                      {row.feedback}{" "}
                      {editingSections.aiHistory && (
                        <button
                          type="button"
                          onClick={() => removeInterview(idx)}
                        >
                          Delete
                        </button>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="hint">No AI interviews saved yet.</p>
            )}

            <div className="profile-actions-row" style={{ marginTop: 16 }}>
              {editingSections.aiHistory ? (
                <button
                  className="btn-primary"
                  onClick={() => saveProfile({}, "aiHistory")}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save History"}
                </button>
              ) : (
                <>
                  <span className="save-message">
                    {saveStatus.section === "aiHistory" &&
                    saveStatus.message
                      ? saveStatus.message
                      : "Your changes are saved."}
                  </span>
                  <div className="actions-buttons">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => handleEditSection("aiHistory")}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-light-danger"
                      onClick={() => handleClearSection("aiHistory")}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case "jobInsights":
        return (
          <div className="profile-card">
            <h2 className="profile-card-title">Job Match Insights</h2>
            <p className="profile-card-subtitle">
              AI suggested jobs and skills to improve.
            </p>

            {/* Add new insight */}
            <div className="profile-form" style={{ marginBottom: 12 }}>
              <div className="form-row">
                <label>Job Title</label>
                <input
                  type="text"
                  value={newInsight.jobTitle}
                  onChange={(e) =>
                    setNewInsight((n) => ({
                      ...n,
                      jobTitle: e.target.value,
                    }))
                  }
                  placeholder="Junior React Developer"
                  disabled={!editingSections.jobInsights}
                />
              </div>
              <div className="form-row">
                <label>Match %</label>
                <input
                  type="text"
                  value={newInsight.matchPercent}
                  onChange={(e) =>
                    setNewInsight((n) => ({
                      ...n,
                      matchPercent: e.target.value,
                    }))
                  }
                  placeholder="e.g. 87%"
                  disabled={!editingSections.jobInsights}
                />
              </div>
              <div className="form-row">
                <label>Location</label>
                <input
                  type="text"
                  value={newInsight.location}
                  onChange={(e) =>
                    setNewInsight((n) => ({
                      ...n,
                      location: e.target.value,
                    }))
                  }
                  placeholder="Karachi (Hybrid)"
                  disabled={!editingSections.jobInsights}
                />
              </div>
              <div className="form-row">
                <label>Skills Needed for Improvement</label>
                <textarea
                  rows={2}
                  value={newInsight.skillsToImprove}
                  onChange={(e) =>
                    setNewInsight((n) => ({
                      ...n,
                      skillsToImprove: e.target.value,
                    }))
                  }
                  disabled={!editingSections.jobInsights}
                />
              </div>
              <div
                className="profile-actions-row"
                style={{ justifyContent: "flex-start" }}
              >
                {editingSections.jobInsights && (
                  <button className="btn-secondary" onClick={addInsight}>
                    + Add Insight
                  </button>
                )}
              </div>
            </div>

            {profile.jobMatchInsights?.length ? (
              <div className="insights-list">
                {profile.jobMatchInsights.map((item, idx) => (
                  <div key={idx} className="insight-item">
                    <div className="insight-main">
                      <h3>{item.jobTitle}</h3>
                      <span className="match-pill">
                        Match: {item.matchPercent}
                      </span>
                    </div>
                    <p className="insight-detail">
                      Location: {item.location || "—"}
                    </p>
                    <p className="insight-skills">
                      Skills needed to improve:{" "}
                      {item.skillsToImprove || "—"}
                    </p>
                    {editingSections.jobInsights && (
                      <button
                        type="button"
                        className="btn-text"
                        onClick={() => removeInsight(idx)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="hint">No insights saved yet.</p>
            )}

            <div className="profile-actions-row" style={{ marginTop: 16 }}>
              {editingSections.jobInsights ? (
                <button
                  className="btn-primary"
                  onClick={() => saveProfile({}, "jobInsights")}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Insights"}
                </button>
              ) : (
                <>
                  <span className="save-message">
                    {saveStatus.section === "jobInsights" &&
                    saveStatus.message
                      ? saveStatus.message
                      : "Your changes are saved."}
                  </span>
                  <div className="actions-buttons">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => handleEditSection("jobInsights")}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-light-danger"
                      onClick={() => handleClearSection("jobInsights")}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case "settings":
        return (
          <div className="profile-card">
            <h2 className="profile-card-title">Account Settings</h2>
            <p className="profile-card-subtitle">
              Manage your account data and sign-out.
            </p>

            <div
              className="profile-actions-row"
              style={{ justifyContent: "flex-start" }}
            >
              <button className="btn-text" onClick={handleLogout}>
                Logout from this account
              </button>
            </div>

            <hr className="section-divider" />

            <div className="danger-zone">
              <h3>Danger Zone</h3>
              <p className="hint">
                <strong>Delete profile data</strong> will clear your profile
                details, preferences, social links and AI data. Your login
                account will remain.
              </p>

              <button className="btn-danger" onClick={handleDeleteProfile}>
                Delete Profile Data
              </button>

              <p className="hint" style={{ marginTop: "12px" }}>
                <strong>Delete account</strong> will permanently remove your
                candidate user account and profile from the system. This cannot
                be undone.
              </p>

              <button
                className="btn-danger"
                style={{ marginTop: "4px" }}
                onClick={handleDeleteAccount}
              >
                Delete Account Permanently
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return <div className="profile-page">Loading profile…</div>;
  }

  return (
    <div className="profile-page">
      {/* Show completion bar until 100% */}
      {completion < 100 && (
        <div className="profile-progress">
          <div className="profile-progress-header">
            <span>Profile completion: {completion}%</span>
            <span>
              Fill <strong>Overview</strong>,{" "}
              <strong>Preferences</strong> &{" "}
              <strong>Social Links</strong> to reach 100%.
            </span>
          </div>
          <div className="profile-progress-bar">
            <div
              className="profile-progress-fill"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
      )}

      <div className="profile-container">
        {/* LEFT MENU */}
        <aside className="profile-sidebar">
          <h2 className="profile-sidebar-title">Candidate Profile</h2>

          <ul className="profile-menu">
            <li>
              <button
                className={
                  activeSection === "summary"
                    ? "profile-menu-item active"
                    : "profile-menu-item"
                }
                onClick={() => setActiveSection("summary")}
              >
                <i className="fa-regular fa-id-card"></i>
                <span>Profile Summary</span>
              </button>
            </li>

            <li>
              <button
                className={
                  activeSection === "overview"
                    ? "profile-menu-item active"
                    : "profile-menu-item"
                }
                onClick={() => setActiveSection("overview")}
              >
                <i className="fa-regular fa-user"></i>
                <span>Profile Overview</span>
              </button>
            </li>

            <li>
              <button
                className={
                  activeSection === "preferences"
                    ? "profile-menu-item active"
                    : "profile-menu-item"
                }
                onClick={() => setActiveSection("preferences")}
              >
                <i className="fa-solid fa-sliders"></i>
                <span>Preferences</span>
              </button>
            </li>

            <li>
              <button
                className={
                  activeSection === "social"
                    ? "profile-menu-item active"
                    : "profile-menu-item"
                }
                onClick={() => setActiveSection("social")}
              >
                <i className="fa-solid fa-share-nodes"></i>
                <span>Social Links</span>
              </button>
            </li>

            <li>
              <button
                className={
                  activeSection === "aiHistory"
                    ? "profile-menu-item active"
                    : "profile-menu-item"
                }
                onClick={() => setActiveSection("aiHistory")}
              >
                <i className="fa-solid fa-robot"></i>
                <span>AI Interview History</span>
              </button>
            </li>

            <li>
              <button
                className={
                  activeSection === "jobInsights"
                    ? "profile-menu-item active"
                    : "profile-menu-item"
                }
                onClick={() => setActiveSection("jobInsights")}
              >
                <i className="fa-solid fa-chart-line"></i>
                <span>Job Match Insights</span>
              </button>
            </li>

            <li>
              <button
                className={
                  activeSection === "settings"
                    ? "profile-menu-item active"
                    : "profile-menu-item"
                }
                onClick={() => setActiveSection("settings")}
              >
                <i className="fa-solid fa-gear"></i>
                <span>Account Settings</span>
              </button>
            </li>

            <li className="profile-menu-divider" />

            <li>
              <button
                className="profile-menu-item logout"
                onClick={handleLogout}
              >
                <i className="fa-solid fa-right-from-bracket"></i>
                <span>Logout</span>
              </button>
            </li>
          </ul>
        </aside>

        {/* RIGHT CONTENT */}
        <section className="profile-content">{renderSection()}</section>
      </div>
    </div>
  );
};

export default Profile;
