// client/src/pages/Recruiter/MyJobPosts.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { jobApi } from "../../utils/jobApi";
import "./myjobposts.css";

const money = (n) => (typeof n === "number" ? n.toLocaleString() : "—");

const timeAgo = (d) => {
  try {
    const diffSec = (Date.now() - new Date(d).getTime()) / 1000;
    const days = Math.floor(diffSec / 86400);
    if (Number.isNaN(days)) return "";
    if (days < 1) return "today";
    if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
    const w = Math.floor(days / 7);
    return `${w} week${w > 1 ? "s" : ""} ago`;
  } catch {
    return "";
  }
};

const fmtDate = (d) => {
  try {
    const dt = new Date(d);
    return Number.isNaN(dt.getTime()) ? String(d) : dt.toLocaleDateString();
  } catch {
    return String(d);
  }
};

export default function MyJobPosts() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  // Search + sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest"); // 'newest' or 'oldest'

  // NEW: active job for the detail CARD modal
  const [activeJob, setActiveJob] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await jobApi.mine();
        setJobs(Array.isArray(data) ? data : data?.jobs || []);
      } catch (e) {
        console.error(e);
        alert("❌ Failed to load your jobs.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleClearFilters = () => {
    setSearchQuery("");
    setSortBy("newest");
  };

  // Filter + sort jobs
  const rows = useMemo(() => {
    let list = [...jobs];

    const query = searchQuery.toLowerCase().trim();
    if (query) {
      list = list.filter((j) => {
        const title = (j.title || "").toLowerCase();
        const created = fmtDate(j.createdAt || "").toLowerCase();
        const deadline = fmtDate(j.applicationDeadline || "").toLowerCase();
        return (
          title.includes(query) ||
          created.includes(query) ||
          deadline.includes(query)
        );
      });
    }

    list.sort((a, b) => {
      const aTime = new Date(a.createdAt || 0).getTime();
      const bTime = new Date(b.createdAt || 0).getTime();
      return sortBy === "newest" ? bTime - aTime : aTime - bTime;
    });

    return list;
  }, [jobs, searchQuery, sortBy]);

  const closeDetailCard = () => setActiveJob(null);

  // Delete handler for the detail card
  const handleDelete = async (jobId) => {
    if (!window.confirm("Are you sure you want to delete this job post?")) {
      return;
    }
    try {
      setDeleting(true);
      // Adjust method name if your jobApi uses a different one (e.g. jobApi.delete)
      await jobApi.remove(jobId);
      setJobs((prev) => prev.filter((j) => j._id !== jobId));
      setActiveJob(null);
    } catch (e) {
      console.error(e);
      alert("❌ Failed to delete job. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <p style={{ padding: 16 }}>Loading…</p>;

  return (
    <div className="myjobs-container">
      <h2>My Job Posts</h2>

      <p className="myjobs-subtext">
        You have posted {jobs.length} job{jobs.length !== 1 ? "s" : ""}.
      </p>

      {/* Search + Sort + Clear Filters (90vw) */}
      <div className="myjobs-search-row">
        <input
          type="text"
          placeholder="Search by Job Title or Date (e.g. 1/11/2026)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="myjobs-search-input"
        />

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="myjobs-sort-select"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>

        <button
          onClick={handleClearFilters}
          className="myjobs-clear-btn"
          type="button"
        >
          <i className="fas fa-times" style={{ marginRight: 5 }}></i>
          Clear Filters
        </button>
      </div>

      {/* Horizontal job cards only (no table) */}
      <div className="myjobs-card-list">
        {rows.map((j) => {
          const company = j.createdBy?.companyName || "Company";
          const showLocation =
            j.workArrangement === "Remote"
              ? j.remote?.mustReside
                ? j.remote?.location || "Remote (restricted)"
                : "Remote"
              : j.jobLocation || "Location";
          const open = !j.isClosed;

          return (
            <div key={j._id} className="myjobs-card">
              {/* Left side: main text */}
              <div className="myjobs-card-main">
                <div className="myjobs-title">{j.title}</div>
                <div className="myjobs-company">{company}</div>

                {/* Row: location + salary + deadline (small font) */}
                <div className="myjobs-meta-row">
                  <span className="myjobs-meta-item">
                    <i className="fas fa-map-marker-alt myjobs-icon" />
                    {showLocation}
                  </span>

                  {j.salaryVisible === "Yes" && (
                    <span className="myjobs-meta-item">
                      <i className="fas fa-dollar-sign myjobs-icon" />
                      {money(j.salaryMin)} - {money(j.salaryMax)} /month
                    </span>
                  )}

                  <span className="myjobs-meta-item">
                    <i className="far fa-calendar-alt myjobs-icon" />
                    Deadline: {fmtDate(j.applicationDeadline)}
                  </span>
                </div>

                {/* Status + posted below meta */}
                <div className="myjobs-bottom-wrap">
                  <span
                    className={
                      open
                        ? "myjobs-status myjobs-status-open"
                        : "myjobs-status myjobs-status-closed"
                    }
                  >
                    {open ? "Actively hiring" : "Closed"}
                  </span>

                  <div className="myjobs-posted">
                    <i className="far fa-clock myjobs-icon" />
                    Posted {timeAgo(j.createdAt)}
                  </div>
                </div>
              </div>

              {/* Right side: actions */}
              <div className="myjobs-actions">
                <button
                  type="button"
                  onClick={() => setActiveJob(j)} // open detail CARD
                  className="myjobs-btn-primary"
                >
                  View
                </button>
                <button
                  type="button"
                  onClick={() => nav(`/recruiter/jobs/${j._id}/applications`)}
                  className="myjobs-btn-primary myjobs-btn-secondary"
                >
                  View applications
                </button>
              </div>
            </div>
          );
        })}

        {rows.length === 0 && (
          <p className="myjobs-empty">No job posts match your filters.</p>
        )}
      </div>

      {/* DETAIL CARD MODAL */}
      {activeJob && (
        <div className="jobdetail-overlay">
          <div className="jobdetail-card">
            {/* Close (X) */}
            <button
              type="button"
              className="jobdetail-close"
              onClick={closeDetailCard}
            >
              <i className="fas fa-times"></i>
            </button>

            {/* Title + company */}
            <h3 className="jobdetail-title">{activeJob.title}</h3>
            <div className="jobdetail-company">
              {activeJob.createdBy?.companyName || "Company"}
            </div>

            {/* Top meta line: location / arrangement */}
            <div className="jobdetail-meta-row">
              {activeJob.careerLevel && (
                <span className="jobdetail-meta-item">
                  <i className="fas fa-briefcase jobdetail-icon"></i>
                  {activeJob.careerLevel}
                </span>
              )}
              {activeJob.workArrangement && (
                <span className="jobdetail-meta-item">
                  <i className="fas fa-building jobdetail-icon"></i>
                  {activeJob.workArrangement}
                </span>
              )}
              <span className="jobdetail-meta-item">
                <i className="fas fa-map-marker-alt jobdetail-icon"></i>
                {activeJob.jobLocation || "Location"}
              </span>
            </div>

            {/* Second meta: salary, positions, qualification, deadline, status */}
            <div className="jobdetail-meta-row jobdetail-meta-row--second">
              {activeJob.salaryVisible === "Yes" && (
                <span className="jobdetail-meta-item">
                  <i className="fas fa-dollar-sign jobdetail-icon"></i>
                  {money(activeJob.salaryMin)} - {money(activeJob.salaryMax)} /
                  month
                </span>
              )}

              {/* {activeJob.noOfPositions && (
                <span className="jobdetail-meta-item">
                  <i className="fas fa-users jobdetail-icon"></i>
                  Positions: {activeJob.noOfPositions}
                </span>
              )} */}
              {activeJob.numberOfPositions && (
                <span className="jobdetail-meta-item">
                  <i className="fas fa-users jobdetail-icon"></i>
                  Positions: {activeJob.numberOfPositions}
                </span>
              )}
              {activeJob.qualification && (
                <span className="jobdetail-meta-item">
                  <i className="fas fa-graduation-cap jobdetail-icon"></i>
                  {activeJob.qualification}
                </span>
              )}

              <span className="jobdetail-meta-item">
                <i className="far fa-calendar-alt jobdetail-icon"></i>
                Deadline: {fmtDate(activeJob.applicationDeadline)}
              </span>

              <span
                className={
                  !activeJob.isClosed
                    ? "jobdetail-status jobdetail-status-open"
                    : "jobdetail-status jobdetail-status-closed"
                }
              >
                {!activeJob.isClosed ? "Open" : "Closed"}
              </span>
            </div>

            {/* Posted info */}
            <div className="jobdetail-posted">
              <i className="far fa-clock jobdetail-icon"></i>
              Posted {timeAgo(activeJob.createdAt)}
            </div>

            {/* Description */}
            <div className="jobdetail-section">
              <h4 className="jobdetail-section-title">Description</h4>
              <div className="jobdetail-desc">
                {typeof activeJob.description === "string" &&
                activeJob.description.trim() ? (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: activeJob.description,
                    }}
                  />
                ) : (
                  <p>No description provided.</p>
                )}
              </div>
            </div>

            {/* Skills (if you have them) */}
            {Array.isArray(activeJob.skillsRequired) &&
              activeJob.skillsRequired.length > 0 && (
                <div className="jobdetail-section">
                  <h4 className="jobdetail-section-title">Skills</h4>
                  <div className="jobdetail-skills">
                    {activeJob.skillsRequired.map((sk, idx) => (
                      <span key={idx} className="jobdetail-skill-pill">
                        {sk}
                        {activeJob.rateSkills?.[sk]
                          ? ` • ${activeJob.rateSkills[sk]}`
                          : ""}
                      </span>
                    ))}
                  </div>
                </div>
              )}

            {/* Bottom actions: Edit (blue), Delete (red) */}
            <div className="jobdetail-actions">
              <button
                type="button"
                className="jobdetail-btn jobdetail-btn-edit"
                onClick={() => nav(`/recruiter/post-job/${activeJob._id}`)}
              >
                <i className="fas fa-edit" style={{ marginRight: 6 }}></i>
                Edit
              </button>
              <button
                type="button"
                className="jobdetail-btn jobdetail-btn-delete"
                onClick={() => handleDelete(activeJob._id)}
                disabled={deleting}
              >
                <i className="fas fa-trash-alt" style={{ marginRight: 6 }}></i>
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
