//client/src/pages/Candidate/AppliedJobs.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AppliedJobs.css";
import { api } from "../../utils/api";

import { getApplicationResumeBlob } from "../../utils/resumeApi";

const money = (n) => (typeof n === "number" ? n.toLocaleString() : "—");


async function fetchMyApplications() {
  const res = await api.get('/applications/mine');
  const data = res.data;
  return Array.isArray(data) ? data : data?.applications || data || [];
}

const fmtDate = (d) => {
  try {
    const dt = new Date(d);
    return Number.isNaN(dt.getTime()) ? String(d) : dt.toLocaleDateString();
  } catch {
    return String(d);
  }
};

const fmtDateTime = (d) => {
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return String(d);
    return dt.toLocaleString();
  } catch {
    return String(d);
  }
};

const fmtScore = (v) => {
  if (typeof v !== "number") return "—";
  if (v >= 0 && v <= 1) return `${Math.round(v * 100)}%`;
  return `${Math.round(v)}%`;
};

export default function AppliedJobs() {
  const [apps, setApps] = useState([]);
  const [jobs, setJobs] = useState({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");

  const [confirmModal, setConfirmModal] = useState({ open: false, appId: null, dates: [] });
  const [selectedDate, setSelectedDate] = useState("");
  const [wantReschedule, setWantReschedule] = useState(false);
  const [requestedDate, setRequestedDate] = useState("");
  const [rescheduleNote, setRescheduleNote] = useState("");

  const [resumeModal, setResumeModal] = useState({
  open: false,
  url: null,
});

const closeResumeModal = () => {
  if (resumeModal.url) {
    URL.revokeObjectURL(resumeModal.url);
  }
  setResumeModal({ open: false, url: null });
};

const previewSubmittedResume = async (appId) => {
  try {
    const res = await getApplicationResumeBlob(appId);

    const blob = new Blob([res.data], {
      type: res.headers["content-type"] || "application/octet-stream",
    });

    const url = URL.createObjectURL(blob);
    setResumeModal({ open: true, url });
  } catch (err) {
    console.error("Preview failed:", err);
    setActionMsg(
      err?.response?.data?.message || "❌ Could not open submitted resume."
    );
    setTimeout(() => setActionMsg(""), 2500);
  }
};

useEffect(() => {
  (async () => {
    try {
      const list = await fetchMyApplications();
      setApps(list);
    } catch (e) {
      console.error(e);
      const status = e?.response?.status;
      const msg =
        e?.response?.data?.message ||
        e?.response?.data?.error ||
        (status === 401 ? "Please sign in to view applied jobs." : "Failed to load applied jobs.");
      setErr(msg);
    } finally {
      setLoading(false);
    }
  })();
}, []);

  

  const confirmPresence = (appId) => {
    const app = apps.find((a) => a._id === appId);
    const dates = Array.isArray(app?.inviteDates) ? app.inviteDates.filter(Boolean) : [];
    if (dates.length < 2) {
      setActionMsg("No interview date options available yet.");
      setTimeout(() => setActionMsg(""), 1800);
      return;
    }
    setSelectedDate("");
    setWantReschedule(false);
    setRequestedDate("");
    setRescheduleNote("");
    setConfirmModal({ open: true, appId, dates });
  };

  const closeConfirmModal = () => {
    setConfirmModal({ open: false, appId: null, dates: [] });
    setSelectedDate("");
    setWantReschedule(false);
    setRequestedDate("");
    setRescheduleNote("");
  };

  const submitConfirmChoice = async () => {
    if (!selectedDate) {
      setActionMsg("Please choose a date to confirm your presence.");
      setTimeout(() => setActionMsg(""), 1500);
      return;
    }
    const readable = fmtDateTime(selectedDate);
    try {
      const res = await api.put(
        `/applications/${confirmModal.appId}/confirm`,
         { chosenDate: selectedDate }
           );
      const updated = res?.data?.application;
      setApps((prev) =>
        prev.map((a) =>
          a._id === confirmModal.appId
            ? {
                ...a,
                status: "InterviewConfirmed",
                chosenDate: updated?.chosenDate || selectedDate,
                confirmedAt: updated?.confirmedAt || new Date().toISOString(),
                reschedule: updated?.reschedule || a.reschedule,
              }
            : a
        )
      );
      setActionMsg(`✅ Confirmed for ${readable}.`);
      setTimeout(() => setActionMsg(""), 2500);
      closeConfirmModal();
    } catch (e) {
      console.error(e);
      setActionMsg(e?.response?.data?.message || "❌ Failed to confirm your interview date.");
      setTimeout(() => setActionMsg(""), 2500);
    }
  };

  const submitRescheduleRequest = async () => {
    if (!requestedDate) {
      setActionMsg("Please pick a new date/time to request.");
      setTimeout(() => setActionMsg(""), 1500);
      return;
    }
    try {
      const res = await api.put(
  `/applications/${confirmModal.appId}/reschedule-request`,
  { requestedDate, note: rescheduleNote }
);
      const updated = res?.data?.application;
      setApps((prev) =>
        prev.map((a) =>
          a._id === confirmModal.appId
            ? { ...a, reschedule: updated?.reschedule || a.reschedule }
            : a
        )
      );
      setActionMsg("✅ Reschedule request sent to recruiter.");
      setTimeout(() => setActionMsg(""), 2500);
      closeConfirmModal();
    } catch (e) {
      console.error(e);
      setActionMsg(e?.response?.data?.message || "❌ Failed to send reschedule request.");
      setTimeout(() => setActionMsg(""), 2500);
    }
  };

  const rows = useMemo(() => {
    let list = apps.map((a) => {
      const job = a.job || {};
      const invited =
        a.status === "Invited, not yet confirmed" ||
        (Array.isArray(a.inviteDates) && a.inviteDates.length >= 2);

      const rank =
        typeof a.applicantRank === "number" || typeof a.applicantRank === "string"
          ? Number(a.applicantRank) : null;
      const total =
        typeof a.totalApplicants === "number" || typeof a.totalApplicants === "string"
          ? Number(a.totalApplicants) : null;

      return {
        appId: a._id,
        appliedAt: a.createdAt || a.appliedAt,
        jobId: job._id || a.jobId,
        title: job.title || "Job",
        company:
          job.createdBy?.companyName || job.companyName || job.createdBy?.name || "Recruiter",
        location: job.jobLocation || job.location || (job.isRemote ? "Remote" : "—"),
        salaryVisible: job.salaryVisible,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        status: a.status || "Applied",
        // ✅ track interview completion
        interviewStatus: a.interviewStatus || "none",
        invited,
        inviteDates: a.inviteDates || [],
        chosenDate: a.chosenDate || null,
        reschedule: a.reschedule || { status: "none" },
        matchScore: typeof a.matchScore === "number" ? a.matchScore : null,
        applicantRank: Number.isFinite(rank) ? rank : null,
        totalApplicants: Number.isFinite(total) ? total : null,
      };
    });

    const query = searchQuery.toLowerCase().trim();
    if (query) {
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(query) ||
          r.company.toLowerCase().includes(query)
      );
    }

    list.sort((a, b) => {
      const dateA = new Date(a.appliedAt).getTime();
      const dateB = new Date(b.appliedAt).getTime();
      return sortBy === "newest" ? dateB - dateA : dateA - dateB;
    });

    return list;
  }, [apps,searchQuery, sortBy]);

  const handleClearFilters = () => {
    setSearchQuery("");
    setSortBy("newest");
  };

  if (loading) return <p style={{ padding: 16 }}>Loading…</p>;
  if (err) return <p style={{ padding: 16, color: "#dc2626" }}>{err}</p>;

  return (
    <div className="applied-jobs-container">
      <h2>Applied Jobs</h2>

      {actionMsg && (
        <div style={{
          margin: "12px 0", padding: "10px 12px", borderRadius: 8,
          background: "#e8f5e9", border: "1px solid #a5d6a7",
          color: "#1b5e20", fontWeight: 600,
        }}>
          {actionMsg}
        </div>
      )}

      <p style={{ color: "#64748b", margin: "0 0 15px 0" }}>
        You've applied to {apps.length} job{apps.length !== 1 ? "s" : ""}.
      </p>

      <div className="search-filter-row">
        <input
          type="text"
          placeholder="Search by Job Title or Company"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flexGrow: 3, padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8 }}
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          style={{ width: "15%", minWidth: "120px", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8 }}
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
        </select>
        <button
          onClick={handleClearFilters}
          style={{ width: "25%", padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, background: "#f3f4f6", color: "#6b7280", fontWeight: 600, cursor: "pointer" }}
        >
          <i className="fas fa-times" style={{ marginRight: 5 }}></i> Clear Filters
        </button>
      </div>

      <div className="job-card-list">
        {rows.map((r) => {
          const isInvited = r.invited;
          const isInterviewed = r.interviewStatus === "completed"; // ✅ NEW

          const displayStatus =
            r.status === "Applied" ? "Applied" : isInvited ? "Invited" : r.status;

          const statusBg    = r.status === "Applied" || isInvited ? "#d1fae5" : "#eef2f7";
          const statusColor = r.status === "Applied" || isInvited ? "#065f46" : "#64748b";
          const rescheduleStatus = r.reschedule?.status || "none";

          return (
            <div
              key={r.appId || r.jobId}
              style={{
                width: "100%", padding: 18,
                border: "1px solid #e2e8f0", borderRadius: 12,
                background: "#fff", display: "flex",
                justifyContent: "space-between", alignItems: "center",
                gap: 15, boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
              }}
            >
              <div style={{ flexGrow: 1, maxWidth: "70%" }}>
                <div style={{ fontWeight: 700, fontSize: 18, color: "#1f2937" }}>{r.title}</div>
                <div style={{ color: "#64748b", marginTop: 2, marginBottom: 8 }}>{r.company}</div>

                {typeof r.matchScore === "number" && (
                  <div style={{ marginTop: 4, marginBottom: 6, fontSize: "0.9rem", color: "#1f2937" }}>
                    Match score: <strong>{fmtScore(r.matchScore)}</strong>
                    {r.applicantRank !== null && (
                      <span style={{ marginLeft: 8, color: "#6b7280" }}>
                        • Your position: {r.applicantRank}
                        {r.totalApplicants !== null ? ` of ${r.totalApplicants} applicants` : " (total applicants unavailable)"}
                      </span>
                    )}
                  </div>
                )}

                <div style={{ fontSize: "0.9rem", color: "#374151" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "nowrap", whiteSpace: "nowrap" }}>
                    <span>
                      <i className="fas fa-map-marker-alt" style={{ marginRight: 5, color: "#1f2937", fontSize: "0.95em" }} />
                      {r.location}
                    </span>
                    {r.salaryVisible === "Yes" && (
                      <span>
                        <i className="fas fa-dollar-sign" style={{ marginRight: 5, color: "#1f2937", fontSize: "0.95em" }} />
                        {money(r.salaryMin)} - {money(r.salaryMax)} /month
                      </span>
                    )}
                    <span>
                      <i className="far fa-calendar-check" style={{ marginRight: 5, color: "#1f2937", fontSize: "0.95em" }} />
                      Applied on: {fmtDate(r.appliedAt)}
                    </span>
                  </div>

                  <div style={{ marginTop: 6 }}>
                    <span style={{ padding: "4px 10px", borderRadius: 6, background: statusBg, color: statusColor, fontWeight: 600, fontSize: "0.85em", border: "1px solid #cbd5f5" }}>
                      Status: {displayStatus}
                    </span>
                  </div>
                  <div style={{ marginTop: 8 }}>
  <button
    onClick={() => previewSubmittedResume(r.appId)}
    style={{
      padding: "7px 10px",
      borderRadius: 8,
      border: "1px solid #10b981",
      background: "#10b981",
      color: "#fff",
      cursor: "pointer",
      fontWeight: 700,
    }}
  >
    View Submitted Resume
  </button>
</div>
                </div>

                {/* ✅ INTERVIEWED STATE — replaces confirmed block when interview is done */}
                {r.status === "InterviewConfirmed" && isInterviewed ? (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ color: "#15803d", fontWeight: 700, fontSize: "0.9rem" }}>
                      <i className="fas fa-circle-check" style={{ marginRight: 6 }} />
                      Interviewed on {fmtDateTime(r.chosenDate)}
                    </div>
                    <button
                      onClick={() => navigate(`/candidate/interview-invitation`)}
                      style={{
                        marginTop: 8, padding: "7px 10px", borderRadius: 8,
                        border: "1px solid #2563eb", background: "#2563eb",
                        color: "#fff", cursor: "pointer", fontWeight: 700,
                      }}
                    >
                      View Interview Invitation
                    </button>
                  </div>

                ) : r.status === "InterviewConfirmed" && r.chosenDate ? (
                  /* ── Normal confirmed (not yet interviewed) ── */
                  <div style={{ marginTop: 10 }}>
                    <div style={{ color: "#15803d", fontWeight: 700, fontSize: "0.9rem" }}>
                      <i className="fas fa-check-circle" style={{ marginRight: 6 }} />
                      Confirmed for {fmtDateTime(r.chosenDate)}
                    </div>

                    {rescheduleStatus === "requested" && (
                      <div style={{ marginTop: 6, color: "#b45309", fontWeight: 700 }}>
                        Reschedule requested: {fmtDateTime(r.reschedule?.requestedDate)}
                      </div>
                    )}
                    {rescheduleStatus === "approved" && (
                      <div style={{ marginTop: 6, color: "#15803d", fontWeight: 700 }}>
                        Reschedule approved ✅
                      </div>
                    )}
                    {rescheduleStatus === "declined" && (
                      <div style={{ marginTop: 6, color: "#dc2626", fontWeight: 700 }}>
                        Reschedule declined ❌
                      </div>
                    )}

                    <button
                      onClick={() => navigate(`/candidate/interview-invitation/${r.appId}`)}
                      style={{
                        marginTop: 8, padding: "7px 10px", borderRadius: 8,
                        border: "1px solid #2563eb", background: "#2563eb",
                        color: "#fff", cursor: "pointer", fontWeight: 700,
                      }}
                    >
                      View Interview Invitation
                    </button>
                  </div>
                ) : null}

                {/* Invitation Action */}
                {isInvited && r.status !== "InterviewConfirmed" && (
                  <div style={{
                    marginTop: 10, padding: "8px 10px", borderRadius: 8,
                    background: "#dff3e3", border: "1px solid #a5d6a7",
                    color: "#1b5e20", display: "flex", alignItems: "center",
                    gap: 10, flexWrap: "wrap", fontSize: "0.9rem",
                    position: "relative", zIndex: 1,
                  }}>
                    <span>
                      <i className="fas fa-user-check" style={{ marginRight: 5 }} />
                      Congratulations! You've been invited for interview.
                    </span>
                    <button
                      type="button"
                      onClick={() => confirmPresence(r.appId)}
                      style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #15803d", background: "#16a34a", color: "#fff", cursor: "pointer" }}
                    >
                      Confirm my Presence
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => navigate(`/candidate/job-search`)}
                style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid #2563eb", background: "#2563eb", color: "#fff", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", whiteSpace: "nowrap" }}
              >
                Find more jobs
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {confirmModal.open && (
        <div className="aj-modal-overlay" onClick={closeConfirmModal}>
          <div className="aj-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="aj-modal-close" onClick={closeConfirmModal} type="button">×</button>
            <h3 className="aj-modal-title">Confirm Interview Presence</h3>
            <p className="aj-modal-sub">Select one of the recruiter's proposed dates:</p>

            <div className="aj-date-list">
              {confirmModal.dates.map((d) => (
                <label key={String(d)} className="aj-date-item">
                  <input
                    type="radio"
                    name="selectedDate"
                    value={d}
                    checked={selectedDate === String(d)}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                  <span>{fmtDateTime(d)}</span>
                </label>
              ))}
            </div>

            <div className="aj-modal-actions">
              <button className="aj-btn-primary" type="button" onClick={submitConfirmChoice}>
                Confirm Selected Date
              </button>
              <button className="aj-btn-secondary" type="button" onClick={() => setWantReschedule((v) => !v)}>
                {wantReschedule ? "Cancel Date Change Request" : "I'm not available — request a new date"}
              </button>
            </div>

            {wantReschedule && (
              <div className="aj-reschedule-box">
                <div className="aj-field">
                  <label className="aj-label">Pick your available date/time</label>
                  <input type="datetime-local" value={requestedDate} onChange={(e) => setRequestedDate(e.target.value)} className="aj-input" />
                </div>
                <div className="aj-field">
                  <label className="aj-label">Message (optional)</label>
                  <textarea value={rescheduleNote} onChange={(e) => setRescheduleNote(e.target.value)} className="aj-textarea" placeholder="Explain your availability…" rows={3} />
                </div>
                <button className="aj-btn-warning" type="button" onClick={submitRescheduleRequest}>
                  Send Reschedule Request
                </button>
              </div>
            )}
          </div>
        </div>
      )}

            {resumeModal.open && (
        <div
          className="aj-modal-overlay"
          onClick={closeResumeModal}
        >
          <div
            className="aj-modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{ width: "80%", height: "80%" }}
          >
            <button
              className="aj-modal-close"
              onClick={closeResumeModal}
              type="button"
            >
              ×
            </button>

            <iframe
              src={resumeModal.url}
              title="Submitted Resume Preview"
              width="100%"
              height="100%"
              style={{ border: "none", borderRadius: 8 }}
            />
          </div>
        </div>
      )}


    </div>
  );
}