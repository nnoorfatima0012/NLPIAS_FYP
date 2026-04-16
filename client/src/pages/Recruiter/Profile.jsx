// client/src/pages/Recruiter/Profile.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../utils/api";
import "./RecruiterProfile.css";
import { useAuth } from "../../context/authContext";

const API_BASE = import.meta?.env?.VITE_API_BASE || "http://127.0.0.1:5000";

const EMPTY_PROFILE = {
  // Personal details (recruiter)
  recruiterName: "",
  recruiterTitle: "",
  recruiterEmail: "",
  recruiterPhone: "",
  recruiterBio: "",
  recruiterPhotoUrl: "",

  // Company overview
  companyName: "",
  companyWebsite: "",
  companyIndustry: "",
  companySize: "",
  companyType: "",
  companyHeadOffice: "",
  aboutCompany: "",
  companyLogoUrl: "",

  // Company verification (approval fields exist in DB but not shown as a section)
  registrationNumber: "",
  businessEmailDomain: "",
  companyLinkedin: "",
  registrationDocUrl: "",
  approvalStatus: "Pending", // still kept in payload, just not shown
  reviewedBy: "",
  lastReviewedOn: "",
  rejectionReason: "",

  // Hiring focus
  hiringDepartments: "",
  typicalRoles: "",
  hiringLocations: "",
  seniorityLevels: "",

  // Employer branding
  tagline: "",
  whyWorkWithUs: "",
  coreValues: "",
  perksBenefits: "",
  diversityStatement: "",
};

const RecruiterProfile = () => {
  const navigate = useNavigate();
  const { logoutAuth } = useAuth();

  const [activeSection, setActiveSection] = useState("summary");
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingSections, setEditingSections] = useState({
    personal: true,
    company: true,
    verification: true,
    hiring: true,
    branding: true,
    settings: true,
  });

  const [saveStatus, setSaveStatus] = useState({
    section: null,
    message: "",
  });

  /* ---------- Load recruiter profile ---------- */

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/recruiter/profile/me");
        const data = res.data || {};
        setProfile({ ...EMPTY_PROFILE, ...data });
      } catch (err) {
        console.error("Load recruiter profile error:", err?.response || err);
        setProfile(EMPTY_PROFILE);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  /* ---------- Completion % ---------- */
  // Count 5 sections: personal, company, verification, hiring, branding

  const completion = useMemo(() => {
    let total = 5;
    let done = 0;

    const hasPersonal =
      profile.recruiterName &&
      profile.recruiterEmail &&
      profile.recruiterPhone &&
      profile.recruiterTitle &&
      profile.recruiterBio;

    const hasCompany =
      profile.companyName &&
      profile.companyWebsite &&
      profile.companyIndustry &&
      profile.companySize &&
      profile.companyHeadOffice;

    const hasVerification =
      profile.registrationNumber &&
      profile.businessEmailDomain &&
      profile.companyLinkedin;

    const hasHiring =
      profile.hiringDepartments &&
      profile.typicalRoles &&
      profile.hiringLocations &&
      profile.seniorityLevels;

    const hasBranding =
      profile.tagline &&
      profile.whyWorkWithUs &&
      profile.coreValues &&
      profile.perksBenefits &&
      profile.diversityStatement;

    if (hasPersonal) done++;
    if (hasCompany) done++;
    if (hasVerification) done++;
    if (hasHiring) done++;
    if (hasBranding) done++;

    if (!done) return 0;
    return Math.round((done / total) * 100);
  }, [profile]);

  /* ---------- Save helpers ---------- */

  const buildPayload = (override = {}) => {
    const merged = { ...profile, ...override };

    return {
      recruiterName: merged.recruiterName || "",
      recruiterTitle: merged.recruiterTitle || "",
      recruiterEmail: merged.recruiterEmail || "",
      recruiterPhone: merged.recruiterPhone || "",
      recruiterBio: merged.recruiterBio || "",
      recruiterPhotoUrl: merged.recruiterPhotoUrl || "",

      companyName: merged.companyName || "",
      companyWebsite: merged.companyWebsite || "",
      companyIndustry: merged.companyIndustry || "",
      companySize: merged.companySize || "",
      companyType: merged.companyType || "",
      companyHeadOffice: merged.companyHeadOffice || "",
      aboutCompany: merged.aboutCompany || "",
      companyLogoUrl: merged.companyLogoUrl || "",

      registrationNumber: merged.registrationNumber || "",
      businessEmailDomain: merged.businessEmailDomain || "",
      companyLinkedin: merged.companyLinkedin || "",
      registrationDocUrl: merged.registrationDocUrl || "",

      // keep these in DB but not shown visually
      approvalStatus: merged.approvalStatus || "Pending",
      reviewedBy: merged.reviewedBy || "",
      lastReviewedOn: merged.lastReviewedOn || "",
      rejectionReason: merged.rejectionReason || "",

      hiringDepartments: merged.hiringDepartments || "",
      typicalRoles: merged.typicalRoles || "",
      hiringLocations: merged.hiringLocations || "",
      seniorityLevels: merged.seniorityLevels || "",

      tagline: merged.tagline || "",
      whyWorkWithUs: merged.whyWorkWithUs || "",
      coreValues: merged.coreValues || "",
      perksBenefits: merged.perksBenefits || "",
      diversityStatement: merged.diversityStatement || "",
    };
  };

  const saveProfile = async (override = {}, sectionKey = null) => {
    try {
      setSaving(true);
      const payload = buildPayload(override);

      const res = await api.put("/recruiter/profile/me", payload);

      const data = res.data || {};
      setProfile((prev) => ({ ...prev, ...data }));

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
      console.error("Save recruiter profile error:", err?.response || err);
      alert("Failed to save recruiter profile. Check console for details.");
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
      case "personal":
        overrides = {
          recruiterName: "",
          recruiterTitle: "",
          recruiterEmail: "",
          recruiterPhone: "",
          recruiterBio: "",
          recruiterPhotoUrl: "",
        };
        break;
      case "company":
        overrides = {
          companyName: "",
          companyWebsite: "",
          companyIndustry: "",
          companySize: "",
          companyType: "",
          companyHeadOffice: "",
          aboutCompany: "",
          companyLogoUrl: "",
        };
        break;
      case "verification":
        overrides = {
          registrationNumber: "",
          businessEmailDomain: "",
          companyLinkedin: "",
          registrationDocUrl: "",
        };
        break;
      case "hiring":
        overrides = {
          hiringDepartments: "",
          typicalRoles: "",
          hiringLocations: "",
          seniorityLevels: "",
        };
        break;
      case "branding":
        overrides = {
          tagline: "",
          whyWorkWithUs: "",
          coreValues: "",
          perksBenefits: "",
          diversityStatement: "",
        };
        break;
      default:
        break;
    }

    if (Object.keys(overrides).length) {
      saveProfile(overrides, sectionKey);
    }
  };

  /* ---------- Logout / Delete ---------- */

  const handleLogout = async () => {
  try {
    await logoutAuth();
  } catch (err) {
    console.error("Logout error:", err);
  } finally {
    navigate("/login");
  }
};

  const handleDeleteProfile = async () => {
    const sure = window.confirm(
      "This will clear your recruiter profile data but keep your login. Continue?",
    );
    if (!sure) return;

    try {
      await api.delete("/recruiter/profile/me");
      setProfile(EMPTY_PROFILE);
    } catch (err) {
      console.error("Delete recruiter profile error:", err?.response || err);
      alert("Failed to delete recruiter profile.");
    }
  };

  const handleDeleteAccount = async () => {
    const sure = window.confirm(
      "This will permanently delete your recruiter account and all profile data. This action cannot be undone. Continue?",
    );
    if (!sure) return;

    try {
      await api.delete("/account/me");

      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      localStorage.removeItem("userRole");
      navigate("/login");
    } catch (err) {
      console.error("Delete account error:", err?.response || err);
      alert("Failed to delete account. Please try again.");
    }
  };

  /* ---------- Upload handlers ---------- */

  const handleRecruiterPhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const form = new FormData();
    form.append("photo", file);

    try {
      const res = await api.post("/recruiter/profile/photo", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { recruiterPhotoUrl, photoUrl, profile: updated } = res.data || {};

      setProfile((prev) => ({
        ...prev,
        recruiterPhotoUrl:
          recruiterPhotoUrl || photoUrl || prev.recruiterPhotoUrl,
        ...(updated || {}),
      }));
    } catch (err) {
      console.error("Upload recruiter photo error:", err?.response || err);
      alert("Failed to upload recruiter photo.");
    }
  };

  const handleCompanyLogoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const form = new FormData();
    form.append("logo", file);

    try {
      const res = await api.post("/recruiter/profile/logo", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { companyLogoUrl, logoUrl, profile: updated } = res.data || {};

      setProfile((prev) => ({
        ...prev,
        companyLogoUrl: companyLogoUrl || logoUrl || prev.companyLogoUrl,
        ...(updated || {}),
      }));
    } catch (err) {
      console.error("Upload company logo error:", err?.response || err);
      alert("Failed to upload company logo.");
    }
  };

  const handleRegistrationDocUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const form = new FormData();
    form.append("registrationDoc", file);

    try {
      const res = await api.post("/recruiter/profile/registration-doc", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { registrationDocUrl, docUrl, profile: updated } = res.data || {};

      setProfile((prev) => ({
        ...prev,
        registrationDocUrl:
          registrationDocUrl || docUrl || prev.registrationDocUrl,
        ...(updated || {}),
      }));
    } catch (err) {
      console.error("Upload registration doc error:", err?.response || err);
      alert("Failed to upload registration document.");
    }
  };

  /* ---------- Summary renderer ---------- */

  const renderSummary = () => {
    const hasPersonal =
      profile.recruiterName ||
      profile.recruiterTitle ||
      profile.recruiterEmail ||
      profile.recruiterPhone ||
      profile.recruiterBio;

    const hasCompany =
      profile.companyName ||
      profile.companyWebsite ||
      profile.companyIndustry ||
      profile.companySize ||
      profile.companyType ||
      profile.companyHeadOffice;

    const hasVerification =
      profile.registrationNumber ||
      profile.businessEmailDomain ||
      profile.companyLinkedin ||
      profile.registrationDocUrl;

    const hasHiring =
      profile.hiringDepartments ||
      profile.typicalRoles ||
      profile.hiringLocations ||
      profile.seniorityLevels;

    const hasBranding =
      profile.tagline ||
      profile.whyWorkWithUs ||
      profile.coreValues ||
      profile.perksBenefits ||
      profile.diversityStatement;

    return (
      <div className="r-card">
        <h2 className="r-card-title">Recruiter Profile Summary</h2>
        <p className="r-card-subtitle">
          Quick overview of your recruiter details, company, verification and
          hiring focus.
        </p>

        <div className="r-summary-grid">
          {/* Personal details summary */}
          <div className="r-summary-section-card">
            <div className="r-summary-header">
              <h3 className="r-summary-title">Personal Details</h3>
              <button
                type="button"
                className="r-summary-edit-btn"
                onClick={() => handleEditSection("personal")}
                title="Edit Personal Details"
              >
                <i className="fa-solid fa-pen"></i>
              </button>
            </div>
            {hasPersonal ? (
              <ul className="r-summary-list">
                {profile.recruiterName && (
                  <li>
                    <strong>Name:</strong> {profile.recruiterName}
                  </li>
                )}
                {profile.recruiterTitle && (
                  <li>
                    <strong>Role:</strong> {profile.recruiterTitle}
                  </li>
                )}
                {profile.recruiterEmail && (
                  <li>
                    <strong>Email:</strong> {profile.recruiterEmail}
                  </li>
                )}
                {profile.recruiterPhone && (
                  <li>
                    <strong>Phone:</strong> {profile.recruiterPhone}
                  </li>
                )}
                {profile.recruiterBio && (
                  <li>
                    <strong>Bio:</strong> {profile.recruiterBio}
                  </li>
                )}
              </ul>
            ) : (
              <p className="r-summary-empty">No personal details added yet.</p>
            )}
          </div>

          {/* Company overview summary */}
          <div className="r-summary-section-card">
            <div className="r-summary-header">
              <h3 className="r-summary-title">Company Overview</h3>
              <button
                type="button"
                className="r-summary-edit-btn"
                onClick={() => handleEditSection("company")}
                title="Edit Company Overview"
              >
                <i className="fa-solid fa-pen"></i>
              </button>
            </div>
            {hasCompany ? (
              <ul className="r-summary-list">
                {profile.companyName && (
                  <li>
                    <strong>Company:</strong> {profile.companyName}
                  </li>
                )}
                {profile.companyIndustry && (
                  <li>
                    <strong>Industry:</strong> {profile.companyIndustry}
                  </li>
                )}
                {profile.companySize && (
                  <li>
                    <strong>Size:</strong> {profile.companySize}
                  </li>
                )}
                {profile.companyType && (
                  <li>
                    <strong>Type:</strong> {profile.companyType}
                  </li>
                )}
                {profile.companyHeadOffice && (
                  <li>
                    <strong>Head Office:</strong> {profile.companyHeadOffice}
                  </li>
                )}
              </ul>
            ) : (
              <p className="r-summary-empty">No company details added yet.</p>
            )}
          </div>

          {/* Verification summary */}
          <div className="r-summary-section-card">
            <div className="r-summary-header">
              <h3 className="r-summary-title">Company Verification</h3>
              <button
                type="button"
                className="r-summary-edit-btn"
                onClick={() => handleEditSection("verification")}
                title="Edit Company Verification"
              >
                <i className="fa-solid fa-pen"></i>
              </button>
            </div>
            {hasVerification ? (
              <ul className="r-summary-list">
                {profile.registrationNumber && (
                  <li>
                    <strong>Reg #:</strong> {profile.registrationNumber}
                  </li>
                )}
                {profile.businessEmailDomain && (
                  <li>
                    <strong>Business Domain:</strong>{" "}
                    {profile.businessEmailDomain}
                  </li>
                )}
                {profile.companyLinkedin && (
                  <li>
                    <strong>LinkedIn:</strong> {profile.companyLinkedin}
                  </li>
                )}
                {profile.registrationDocUrl && (
                  <li>
                    <strong>Registration Doc:</strong> Uploaded
                  </li>
                )}
              </ul>
            ) : (
              <p className="r-summary-empty">
                No verification details added yet.
              </p>
            )}
          </div>

          {/* Hiring focus summary */}
          <div className="r-summary-section-card">
            <div className="r-summary-header">
              <h3 className="r-summary-title">Hiring Focus</h3>
              <button
                type="button"
                className="r-summary-edit-btn"
                onClick={() => handleEditSection("hiring")}
                title="Edit Hiring Focus"
              >
                <i className="fa-solid fa-pen"></i>
              </button>
            </div>
            {hasHiring ? (
              <ul className="r-summary-list">
                {profile.hiringDepartments && (
                  <li>
                    <strong>Departments:</strong> {profile.hiringDepartments}
                  </li>
                )}
                {profile.typicalRoles && (
                  <li>
                    <strong>Typical Roles:</strong> {profile.typicalRoles}
                  </li>
                )}
                {profile.hiringLocations && (
                  <li>
                    <strong>Locations:</strong> {profile.hiringLocations}
                  </li>
                )}
                {profile.seniorityLevels && (
                  <li>
                    <strong>Seniority:</strong> {profile.seniorityLevels}
                  </li>
                )}
              </ul>
            ) : (
              <p className="r-summary-empty">
                No hiring focus information added yet.
              </p>
            )}
          </div>

          {/* Employer branding summary */}
          <div className="r-summary-section-card">
            <div className="r-summary-header">
              <h3 className="r-summary-title">Employer Branding</h3>
              <button
                type="button"
                className="r-summary-edit-btn"
                onClick={() => handleEditSection("branding")}
                title="Edit Employer Branding"
              >
                <i className="fa-solid fa-pen"></i>
              </button>
            </div>
            {hasBranding ? (
              <ul className="r-summary-list">
                {profile.tagline && (
                  <li>
                    <strong>Tagline:</strong> {profile.tagline}
                  </li>
                )}
                {profile.whyWorkWithUs && (
                  <li>
                    <strong>Why Work With Us:</strong> {profile.whyWorkWithUs}
                  </li>
                )}
                {profile.coreValues && (
                  <li>
                    <strong>Core Values:</strong> {profile.coreValues}
                  </li>
                )}
                {profile.perksBenefits && (
                  <li>
                    <strong>Perks & Benefits:</strong> {profile.perksBenefits}
                  </li>
                )}
                {profile.diversityStatement && (
                  <li>
                    <strong>Diversity Statement:</strong>{" "}
                    {profile.diversityStatement}
                  </li>
                )}
              </ul>
            ) : (
              <p className="r-summary-empty">
                No employer branding details added yet.
              </p>
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
        return renderSummary();

      case "personal":
        return (
          <div className="r-card">
            <h2 className="r-card-title">Personal Details</h2>
            <p className="r-card-subtitle">
              Information about you as the recruiter / HR contact.
            </p>

            <div className="r-grid-2">
              <div className="r-photo-block">
                {profile.recruiterPhotoUrl ? (
                  <img
                    src={`${API_BASE}${profile.recruiterPhotoUrl}`}
                    alt="Recruiter"
                    className="r-photo-img"
                  />
                ) : (
                  <div className="r-photo-placeholder">
                    <span>Upload Photo</span>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleRecruiterPhotoChange}
                  className="r-photo-upload-input"
                  disabled={!editingSections.personal}
                />
              </div>

              <div className="r-form">
                <div className="r-form-row">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={profile.recruiterName}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        recruiterName: e.target.value,
                      }))
                    }
                    className="r-input"
                    placeholder="e.g. Sana Khan"
                    disabled={!editingSections.personal}
                  />
                </div>

                <div className="r-form-row">
                  <label>Job Title</label>
                  <input
                    type="text"
                    value={profile.recruiterTitle}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        recruiterTitle: e.target.value,
                      }))
                    }
                    className="r-input"
                    placeholder="e.g. HR Manager, Talent Acquisition"
                    disabled={!editingSections.personal}
                  />
                </div>

                <div className="r-form-row">
                  <label>Work Email</label>
                  <input
                    type="email"
                    value={profile.recruiterEmail}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        recruiterEmail: e.target.value,
                      }))
                    }
                    className="r-input"
                    placeholder="name@company.com"
                    disabled={!editingSections.personal}
                  />
                </div>

                <div className="r-form-row">
                  <label>Work Phone / WhatsApp</label>
                  <input
                    type="tel"
                    value={profile.recruiterPhone}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        recruiterPhone: e.target.value,
                      }))
                    }
                    className="r-input"
                    placeholder="+92-300-0000000"
                    disabled={!editingSections.personal}
                  />
                </div>
              </div>
            </div>

            <div className="r-form-row">
              <label>Short Bio</label>
              <textarea
                rows={3}
                value={profile.recruiterBio}
                onChange={(e) =>
                  setProfile((p) => ({
                    ...p,
                    recruiterBio: e.target.value,
                  }))
                }
                className="r-textarea"
                placeholder="2–3 lines about your experience and recruitment role."
                disabled={!editingSections.personal}
              />
            </div>

            <div className="r-actions-row">
              {editingSections.personal ? (
                <button
                  className="btn-primary"
                  onClick={() => saveProfile({}, "personal")}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Personal Details"}
                </button>
              ) : (
                <>
                  <span className="r-save-message">
                    {saveStatus.section === "personal" && saveStatus.message
                      ? saveStatus.message
                      : "Your changes are saved."}
                  </span>
                  <div className="r-actions-buttons">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => handleEditSection("personal")}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-light-danger"
                      onClick={() => handleClearSection("personal")}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case "company":
        return (
          <div className="r-card">
            <h2 className="r-card-title">Company Overview</h2>
            <p className="r-card-subtitle">
              Basic company information that will appear on job posts.
            </p>

            <div className="r-grid-2">
              <div className="r-photo-block">
                {profile.companyLogoUrl ? (
                  <img
                    src={`${API_BASE}${profile.companyLogoUrl}`}
                    alt="Company Logo"
                    className="r-photo-img"
                  />
                ) : (
                  <div className="r-photo-placeholder">
                    <span>Upload Logo</span>
                  </div>
                )}

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCompanyLogoChange}
                  className="r-photo-upload-input"
                  disabled={!editingSections.company}
                />
              </div>

              <div className="r-form">
                <div className="r-form-row">
                  <label>Company Name</label>
                  <input
                    type="text"
                    value={profile.companyName}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        companyName: e.target.value,
                      }))
                    }
                    className="r-input"
                    placeholder="e.g. NexaSoft Pvt. Ltd."
                    disabled={!editingSections.company}
                  />
                </div>

                <div className="r-form-row">
                  <label>Company Website</label>
                  <input
                    type="url"
                    value={profile.companyWebsite}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        companyWebsite: e.target.value,
                      }))
                    }
                    className="r-input"
                    placeholder="https://www.company.com"
                    disabled={!editingSections.company}
                  />
                </div>

                <div className="r-form-row">
                  <label>Industry</label>
                  <select
                    value={profile.companyIndustry}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        companyIndustry: e.target.value,
                      }))
                    }
                    className="r-select"
                    disabled={!editingSections.company}
                  >
                    <option value="">Select industry...</option>
                    <option value="IT / Software">IT / Software</option>
                    <option value="Banking / FinTech">Banking / FinTech</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Education">Education</option>
                    <option value="E-Commerce">E-Commerce</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Government">Government</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="r-form-row">
                  <label>Company Size</label>
                  <select
                    value={profile.companySize}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        companySize: e.target.value,
                      }))
                    }
                    className="r-select"
                    disabled={!editingSections.company}
                  >
                    <option value="">Select size...</option>
                    <option value="1-10">1–10</option>
                    <option value="11-50">11–20</option>
                    <option value="51-200">21–50</option>
                    <option value="51-200">51–200</option>
                    <option value="200+">200+</option>
                  </select>
                </div>

                <div className="r-form-row">
                  <label>Company Type</label>
                  <select
                    value={profile.companyType}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        companyType: e.target.value,
                      }))
                    }
                    className="r-select"
                    disabled={!editingSections.company}
                  >
                    <option value="">Select type...</option>
                    <option value="Startup">Startup</option>
                    <option value="SME">SME</option>
                    <option value="Enterprise">Enterprise</option>
                    <option value="NGO / Non-profit">NGO / Non-profit</option>
                    <option value="Government">Government</option>
                  </select>
                </div>

                <div className="r-form-row">
                  <label>Head Office Location</label>
                  <input
                    type="text"
                    value={profile.companyHeadOffice}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        companyHeadOffice: e.target.value,
                      }))
                    }
                    className="r-input"
                    placeholder="e.g. Karachi, Pakistan"
                    disabled={!editingSections.company}
                  />
                </div>
              </div>
            </div>

            <div className="r-form-row">
              <label>About Company</label>
              <textarea
                rows={3}
                value={profile.aboutCompany}
                onChange={(e) =>
                  setProfile((p) => ({
                    ...p,
                    aboutCompany: e.target.value,
                  }))
                }
                className="r-textarea"
                placeholder="Short description about what your company does and culture."
                disabled={!editingSections.company}
              />
            </div>

            <div className="r-actions-row">
              {editingSections.company ? (
                <button
                  className="btn-primary"
                  onClick={() => saveProfile({}, "company")}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Company Info"}
                </button>
              ) : (
                <>
                  <span className="r-save-message">
                    {saveStatus.section === "company" && saveStatus.message
                      ? saveStatus.message
                      : "Your changes are saved."}
                  </span>
                  <div className="r-actions-buttons">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => handleEditSection("company")}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-light-danger"
                      onClick={() => handleClearSection("company")}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case "verification":
        return (
          <div className="r-card">
            <h2 className="r-card-title">Company Verification</h2>
            <p className="r-card-subtitle">
              Details used by admin to verify your company.
            </p>

            {/* Added logo preview, like other sections */}
            <div className="r-grid-2">
              <div className="r-photo-block">
                {profile.companyLogoUrl ? (
                  <img
                    src={`${API_BASE}${profile.companyLogoUrl}`}
                    alt="Company Logo"
                    className="r-photo-img"
                  />
                ) : (
                  <div className="r-photo-placeholder">
                    <span>Company Logo</span>
                  </div>
                )}
                <small className="r-hint"></small>
              </div>

              <div className="r-form">
                <div className="r-form-row">
                  <label>Official Registration / NTN Number</label>
                  <input
                    type="text"
                    value={profile.registrationNumber}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        registrationNumber: e.target.value,
                      }))
                    }
                    className="r-input"
                    placeholder="e.g. NTN-1234567"
                    disabled={!editingSections.verification}
                  />
                </div>

                <div className="r-form-row">
                  <label>Business Email Domain</label>
                  <input
                    type="text"
                    value={profile.businessEmailDomain}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        businessEmailDomain: e.target.value,
                      }))
                    }
                    className="r-input"
                    placeholder="e.g. @company.com"
                    disabled={!editingSections.verification}
                  />
                </div>

                <div className="r-form-row">
                  <label>LinkedIn Company Page</label>
                  <input
                    type="url"
                    value={profile.companyLinkedin}
                    onChange={(e) =>
                      setProfile((p) => ({
                        ...p,
                        companyLinkedin: e.target.value,
                      }))
                    }
                    className="r-input"
                    placeholder="https://www.linkedin.com/company/your-company"
                    disabled={!editingSections.verification}
                  />
                </div>

                <div className="r-form-row">
                  <label>Registration Document</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleRegistrationDocUpload}
                    className="r-photo-upload-input"
                    disabled={!editingSections.verification}
                  />
                  {profile.registrationDocUrl && (
                    <small className="r-hint">
                      Current file:{" "}
                      <a
                        href={`${API_BASE}${profile.registrationDocUrl}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View uploaded document
                      </a>
                    </small>
                  )}
                </div>
              </div>
            </div>

            {/* Approval status block REMOVED as requested */}

            <div className="r-actions-row">
              {editingSections.verification ? (
                <button
                  className="btn-primary"
                  onClick={() => saveProfile({}, "verification")}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Verification"}
                </button>
              ) : (
                <>
                  <span className="r-save-message">
                    {saveStatus.section === "verification" && saveStatus.message
                      ? saveStatus.message
                      : "Your changes are saved."}
                  </span>
                  <div className="r-actions-buttons">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => handleEditSection("verification")}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-light-danger"
                      onClick={() => handleClearSection("verification")}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case "hiring":
        return (
          <div className="r-card">
            <h2 className="r-card-title">Hiring Focus & Talent Segments</h2>
            <p className="r-card-subtitle">
              High-level information about roles and locations you typically
              hire for. This does not override per-job settings.
            </p>

            <div className="r-form">
              <div className="r-form-row">
                <label>Main Departments</label>
                <input
                  type="text"
                  value={profile.hiringDepartments}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      hiringDepartments: e.target.value,
                    }))
                  }
                  className="r-input"
                  placeholder="e.g. IT, Sales, Finance, HR"
                  disabled={!editingSections.hiring}
                />
                <small className="r-hint">
                  Comma-separated list of departments you usually recruit for.
                </small>
              </div>

              <div className="r-form-row">
                <label>Typical Positions</label>
                <input
                  type="text"
                  value={profile.typicalRoles}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      typicalRoles: e.target.value,
                    }))
                  }
                  className="r-input"
                  placeholder="e.g. Software Engineer, Sales Associate, Accountant"
                  disabled={!editingSections.hiring}
                />
              </div>

              <div className="r-form-row">
                <label>Usual Hiring Locations</label>
                <input
                  type="text"
                  value={profile.hiringLocations}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      hiringLocations: e.target.value,
                    }))
                  }
                  className="r-input"
                  placeholder="e.g. Karachi, Lahore, Remote"
                  disabled={!editingSections.hiring}
                />
              </div>

              <div className="r-form-row">
                <label>Common Seniority Levels</label>
                <input
                  type="text"
                  value={profile.seniorityLevels}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      seniorityLevels: e.target.value,
                    }))
                  }
                  className="r-input"
                  placeholder="e.g. Entry, Mid, Senior, Leadership"
                  disabled={!editingSections.hiring}
                />
              </div>
            </div>

            <div className="r-actions-row">
              {editingSections.hiring ? (
                <button
                  className="btn-primary"
                  onClick={() => saveProfile({}, "hiring")}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Hiring Focus"}
                </button>
              ) : (
                <>
                  <span className="r-save-message">
                    {saveStatus.section === "hiring" && saveStatus.message
                      ? saveStatus.message
                      : "Your changes are saved."}
                  </span>
                  <div className="r-actions-buttons">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => handleEditSection("hiring")}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-light-danger"
                      onClick={() => handleClearSection("hiring")}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case "branding":
        return (
          <div className="r-card">
            <h2 className="r-card-title">Employer Branding & Candidate View</h2>
            <p className="r-card-subtitle">
              Text candidates will see on job pages. Great place to reflect fair
              and unbiased hiring.
            </p>

            <div className="r-form">
              <div className="r-form-row">
                <label>Company Tagline</label>
                <input
                  type="text"
                  value={profile.tagline}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      tagline: e.target.value,
                    }))
                  }
                  className="r-input"
                  placeholder="e.g. Innovating digital banking solutions"
                  disabled={!editingSections.branding}
                />
              </div>

              <div className="r-form-row">
                <label>Why Work With Us?</label>
                <textarea
                  rows={3}
                  value={profile.whyWorkWithUs}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      whyWorkWithUs: e.target.value,
                    }))
                  }
                  className="r-textarea"
                  placeholder="3–5 short bullet-style statements about culture, growth, learning, etc."
                  disabled={!editingSections.branding}
                />
              </div>

              <div className="r-form-row">
                <label>Core Values</label>
                <textarea
                  rows={2}
                  value={profile.coreValues}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      coreValues: e.target.value,
                    }))
                  }
                  className="r-textarea"
                  placeholder="e.g. Integrity, Growth, Inclusivity"
                  disabled={!editingSections.branding}
                />
              </div>

              <div className="r-form-row">
                <label>Perks & Benefits</label>
                <textarea
                  rows={2}
                  value={profile.perksBenefits}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      perksBenefits: e.target.value,
                    }))
                  }
                  className="r-textarea"
                  placeholder="e.g. Health insurance, fuel allowance, remote Fridays"
                  disabled={!editingSections.branding}
                />
              </div>

              <div className="r-form-row">
                <label>Diversity & Equal Opportunity Statement</label>
                <textarea
                  rows={3}
                  value={profile.diversityStatement}
                  onChange={(e) =>
                    setProfile((p) => ({
                      ...p,
                      diversityStatement: e.target.value,
                    }))
                  }
                  className="r-textarea"
                  placeholder="e.g. We follow a fair hiring process and welcome applicants from all backgrounds."
                  disabled={!editingSections.branding}
                />
              </div>
            </div>

            <div className="r-actions-row">
              {editingSections.branding ? (
                <button
                  className="btn-primary"
                  onClick={() => saveProfile({}, "branding")}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Branding"}
                </button>
              ) : (
                <>
                  <span className="r-save-message">
                    {saveStatus.section === "branding" && saveStatus.message
                      ? saveStatus.message
                      : "Your changes are saved."}
                  </span>
                  <div className="r-actions-buttons">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => handleEditSection("branding")}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-light-danger"
                      onClick={() => handleClearSection("branding")}
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
          <div className="r-card">
            <h2 className="r-card-title">Security & Access</h2>
            <p className="r-card-subtitle">
              Manage your session and account-level actions.
            </p>

            <div
              className="r-actions-row"
              style={{ justifyContent: "flex-start" }}
            >
              <button className="btn-text" onClick={handleLogout}>
                Logout from this account
              </button>
            </div>

            <hr className="r-section-divider" />

            <div className="r-danger-zone">
              <h3>Danger Zone</h3>
              <p className="r-hint">
                <strong>Delete profile data</strong> will clear your recruiter
                profile and company details. Your login account will remain.
              </p>

              <button className="btn-danger" onClick={handleDeleteProfile}>
                Delete Recruiter Profile Data
              </button>

              <p className="r-hint" style={{ marginTop: "12px" }}>
                <strong>Delete account</strong> will permanently remove your
                recruiter user account and profile from the system. This cannot
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
    return <div className="recruiter-profile-page">Loading profile…</div>;
  }

  return (
    <div className="recruiter-profile-page">
      {/* Completion bar */}
      {completion < 100 && (
        <div className="recruiter-profile-progress">
          <div className="recruiter-profile-progress-header">
            <span style={{ color: "#151313ff" }}>
              Profile completion: {completion}%
            </span>
          </div>
          <div className="recruiter-profile-progress-bar">
            <div
              className="recruiter-profile-progress-fill"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
      )}

      <div className="recruiter-profile-container">
        {/* Sidebar */}
        <aside className="recruiter-profile-sidebar">
          <h2 className="recruiter-profile-sidebar-title">Recruiter Profile</h2>

          <ul className="recruiter-profile-menu">
            <li>
              <button
                className={
                  activeSection === "summary"
                    ? "recruiter-profile-menu-item active"
                    : "recruiter-profile-menu-item"
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
                  activeSection === "personal"
                    ? "recruiter-profile-menu-item active"
                    : "recruiter-profile-menu-item"
                }
                onClick={() => setActiveSection("personal")}
              >
                <i className="fa-regular fa-user"></i>
                <span>Personal Details</span>
              </button>
            </li>

            <li>
              <button
                className={
                  activeSection === "company"
                    ? "recruiter-profile-menu-item active"
                    : "recruiter-profile-menu-item"
                }
                onClick={() => setActiveSection("company")}
              >
                <i className="fa-solid fa-building"></i>
                <span>Company Overview</span>
              </button>
            </li>

            <li>
              <button
                className={
                  activeSection === "verification"
                    ? "recruiter-profile-menu-item active"
                    : "recruiter-profile-menu-item"
                }
                onClick={() => setActiveSection("verification")}
              >
                <i className="fa-solid fa-badge-check"></i>
                <span>Company Verification</span>
              </button>
            </li>

            <li>
              <button
                className={
                  activeSection === "hiring"
                    ? "recruiter-profile-menu-item active"
                    : "recruiter-profile-menu-item"
                }
                onClick={() => setActiveSection("hiring")}
              >
                <i className="fa-solid fa-users"></i>
                <span>Hiring Focus</span>
              </button>
            </li>

            <li>
              <button
                className={
                  activeSection === "branding"
                    ? "recruiter-profile-menu-item active"
                    : "recruiter-profile-menu-item"
                }
                onClick={() => setActiveSection("branding")}
              >
                <i className="fa-solid fa-bullhorn"></i>
                <span>Employer Branding</span>
              </button>
            </li>

            <li>
              <button
                className={
                  activeSection === "settings"
                    ? "recruiter-profile-menu-item active"
                    : "recruiter-profile-menu-item"
                }
                onClick={() => setActiveSection("settings")}
              >
                <i className="fa-solid fa-gear"></i>
                <span>Security & Access</span>
              </button>
            </li>

            <li className="recruiter-profile-menu-divider" />

            <li>
              <button
                className="recruiter-profile-menu-item logout"
                onClick={handleLogout}
              >
                <i className="fa-solid fa-right-from-bracket"></i>
                <span>Logout</span>
              </button>
            </li>
          </ul>
        </aside>

        {/* Content */}
        <section className="recruiter-profile-content">
          {renderSection()}
        </section>
      </div>
    </div>
  );
};

export default RecruiterProfile;
