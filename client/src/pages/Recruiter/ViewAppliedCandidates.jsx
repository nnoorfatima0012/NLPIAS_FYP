// // client/src/pages/Recruiter/ViewAppliedCandidates.jsx
// import React, { useEffect, useMemo, useState } from "react";
// import axios from "axios";
// import { useParams, useLocation } from "react-router-dom";
// import "./ViewAppliedCandidates.css";

// const API_BASE = import.meta?.env?.VITE_API_BASE || "http://127.0.0.1:5000";

// const authHeaders = () => {
//   const token = localStorage.getItem("token");
//   return token ? { Authorization: `Bearer ${token}` } : {};
// };

// const fullUrl = (p) =>
//   /^https?:\/\//i.test(p)
//     ? p
//     : `${API_BASE}${p?.startsWith("/") ? "" : "/"}${p || ""}`;

// const fmtDateTime = (d) => {
//   try {
//     const x = new Date(d);
//     return Number.isNaN(x.getTime()) ? String(d) : x.toLocaleString();
//   } catch {
//     return String(d);
//   }
// };
// const fmtScore = (v) => {
//   if (typeof v !== "number") return "—";
//   // adjust if your backend sends 0–1 instead of 0–100
//   if (v <= 1 && v >= 0) return `${Math.round(v * 100)}%`;
//   return `${Math.round(v)}%`;
// };

// export default function ViewAppliedCandidates() {
//   const { jobId: pathId } = useParams();
//   const { search, state } = useLocation();

//   const queryId = useMemo(
//     () => new URLSearchParams(search).get("jobId"),
//     [search]
//   );

//   const isObjectId = (v) =>
//     typeof v === "string" && /^[0-9a-fA-F]{24}$/.test(v);

//   const jobId = useMemo(() => {
//     if (isObjectId(pathId)) return pathId;
//     if (isObjectId(queryId)) return queryId;
//     if (isObjectId(state?.jobId)) return state.jobId;
//     return null;
//   }, [pathId, queryId, state]);

//   const [apps, setApps] = useState([]);
//   const [jobs, setJobs] = useState([]);
//   const [filterJob, setFilterJob] = useState("all");
//   const [err, setErr] = useState("");
//   const [loading, setLoading] = useState(true);
//   const [actionMsg, setActionMsg] = useState("");

//   const [inviteModal, setInviteModal] = useState({ open: false, app: null });
//   const [answersModal, setAnswersModal] = useState({
//     open: false,
//     app: null,
//     job: null,
//   });
//   const [inviteDates, setInviteDates] = useState(["", "", ""]);

//   const [invitedSet, setInvitedSet] = useState(() => {
//     try {
//       return new Set(
//         JSON.parse(localStorage.getItem("invited_applications") || "[]")
//       );
//     } catch {
//       return new Set();
//     }
//   });

//   const findJobDetails = (jobId) => {
//     return jobs.find((j) => String(j._id) === String(jobId));
//   };

//   const handleCallInterview = (app) => {
//     setInviteModal({ open: true, app });
//     setInviteDates(["", "", ""]);
//   };

//   const handleViewAnswers = async (app) => {
//     const jobId = app.job?._id || app.job;
//     if (!jobId) return;

//     try {
//       const res = await axios.get(
//         `${API_BASE}/api/applications/job/${jobId}`,
//         {
//           headers: authHeaders(),
//         }
//       );
//       const jobDetailsWithQs = res.data.job;
//       setAnswersModal({ open: true, app, job: jobDetailsWithQs });
//     } catch (e) {
//       console.error("Failed to fetch job details for answers:", e);
//       alert("Failed to load screening questions for this job.");
//     }
//   };

//   const closeModal = () => setInviteModal({ open: false, app: null });

//   const closeAnswersModal = () =>
//     setAnswersModal({ open: false, app: null, job: null });

//   const submitInvite = async () => {
//     const filled = inviteDates.filter(Boolean);
//     if (filled.length < 2) {
//       setActionMsg("❌ Please select at least 2 interview date options.");
//       setTimeout(() => setActionMsg(""), 1500);
//       return;
//     }

//     const id = inviteModal.app?._id;
//     if (!id) return closeModal();

//     try {
//       await axios.put(
//         `${API_BASE}/api/applications/${id}/invite`,
//         { inviteDates: filled },
//         { headers: authHeaders() }
//       );

//       const next = new Set(invitedSet);
//       next.add(id);
//       setInvitedSet(next);
//       localStorage.setItem(
//         "invited_applications",
//         JSON.stringify(Array.from(next))
//       );

//       setApps((prev) =>
//         prev.map((a) =>
//           a._id === id
//             ? {
//                 ...a,
//                 status: "Invited, not yet confirmed",
//                 inviteDates: filled,
//               }
//             : a
//         )
//       );

//       setActionMsg("✅ Invitation sent. Waiting for candidate to confirm.");
//       setInviteModal({ open: false, app: null });
//       setTimeout(() => setActionMsg(""), 1500);
//     } catch (e) {
//       console.error(e);
//       setActionMsg(
//         e?.response?.data?.message || "❌ Failed to send invitation."
//       );
//       setTimeout(() => setActionMsg(""), 2000);
//     }
//   };

//   useEffect(() => {
//     (async () => {
//       try {
//         const res = await axios.get(
//           `${API_BASE}/api/applications/recruiter/all`,
//           {
//             headers: authHeaders(),
//           }
//         );
//         setApps(res.data.applications || []);
//         setJobs(res.data.jobs || []);
//       } catch (e) {
//         const status = e?.response?.status;
//         const msg =
//           e?.response?.data?.message ||
//           (status === 401
//             ? "Please sign in as recruiter."
//             : "Failed to load applications.");
//         setErr(msg);
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, [jobId]);

//   const filtered = useMemo(() => {
//     if (filterJob === "all") return apps;
//     return apps.filter((a) => String(a.job?._id || a.job) === filterJob);
//   }, [apps, filterJob]);

//     // For single-job view (when jobId is present), rank by matchScore (desc)
//   const rows = useMemo(() => {
//     if (!jobId) return filtered; // global page: keep current ordering
//     const copy = [...filtered];
//     copy.sort((a, b) => {
//       const sa = typeof a.matchScore === "number" ? a.matchScore : -Infinity;
//       const sb = typeof b.matchScore === "number" ? b.matchScore : -Infinity;
//       return sb - sa; // highest score first
//     });
//     return copy;
//   }, [filtered, jobId]);

//   if (loading) return <p style={{ padding: 16 }}>Loading…</p>;
//   if (err) return <p style={{ padding: 16, color: "#dc2626" }}>{err}</p>;

//   return (
//     <div className="vac-container">
//       <h2 className="vac-heading">Applied Candidates</h2>

//       {actionMsg && <div className="vac-alert">{actionMsg}</div>}

//       {/* Invite modal – with X on top-right, single centered button */}
//       {inviteModal.open && (
//         <div className="vac-modal-overlay">
//           <div className="vac-modal-card">
//             <button
//               type="button"
//               className="vac-modal-close"
//               onClick={closeModal}
//             >
//               ×
//             </button>

//             <h3 className="vac-modal-title">Call for Interview</h3>
//             <p className="vac-modal-text">
//               Select <strong>2–3 date/time</strong> options to invite{" "}
//               {inviteModal.app?.candidate?.name || "the candidate"}.
//             </p>

//             {inviteDates.map((v, idx) => (
//               <div key={idx} className="vac-modal-field">
//                 <label className="vac-modal-label">Option {idx + 1}</label>
//                 <input
//                   type="datetime-local"
//                   value={v}
//                   onChange={(e) => {
//                     const copy = [...inviteDates];
//                     copy[idx] = e.target.value;
//                     setInviteDates(copy);
//                   }}
//                   className="vac-modal-input"
//                 />
//               </div>
//             ))}

//             <div className="vac-modal-actions">
//               <button
//                 onClick={submitInvite}
//                 type="button"
//                 className="vac-modal-primary-btn"
//               >
//                 Invite Candidate for Interview
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Screening Answers modal – with X only, no bottom Close button */}
//       {answersModal.open && answersModal.app && answersModal.job && (
//         <div className="vac-answers-overlay">
//           <div className="vac-answers-card">
//             <button
//               type="button"
//               className="vac-answers-close"
//               onClick={closeAnswersModal}
//             >
//               ×
//             </button>

//             <h3
//               style={{
//                 marginTop: 0,
//                 marginBottom: 10,
//                 color: "#1f2937",
//                 fontSize: "1rem",
//               }}
//             >
//               Screening Answers from{" "}
//               {answersModal.app.candidate?.name || "Candidate"}
//             </h3>
//             <p
//               style={{
//                 color: "#64748b",
//                 marginBottom: 15,
//                 fontSize: "0.85rem",
//               }}
//             >
//               Job: <strong>{answersModal.job.title}</strong>
//             </p>

//             <div style={{ maxHeight: 400, overflowY: "auto" }}>
//               {answersModal.job.screeningQuestions &&
//               answersModal.app.screeningAnswers ? (
//                 answersModal.job.screeningQuestions.map((question, index) => (
//                   <div
//                     key={index}
//                     style={{
//                       marginBottom: 15,
//                       padding: 10,
//                       border: "1px solid #f1f5f9",
//                       borderRadius: 8,
//                     }}
//                   >
//                     <p
//                       style={{
//                         margin: 0,
//                         fontWeight: 700,
//                         color: "#2563eb",
//                         fontSize: "0.85rem",
//                       }}
//                     >
//                       {index + 1}. {question}
//                     </p>
//                     <p
//                       style={{
//                         margin: "5px 0 0 0",
//                         padding: "5px 8px",
//                         background: "#f8fafc",
//                         borderRadius: 4,
//                         whiteSpace: "pre-wrap",
//                         fontSize: "0.85rem",
//                       }}
//                     >
//                       {answersModal.app.screeningAnswers[index] ||
//                         "No answer provided"}
//                     </p>
//                   </div>
//                 ))
//               ) : (
//                 <p
//                   style={{
//                     color: "#9ca3af",
//                     textAlign: "center",
//                     fontSize: "0.85rem",
//                   }}
//                 >
//                   No screening questions found for this job, or candidate did not
//                   provide answers.
//                 </p>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Filter row */}
//       <div className="vac-filter-row">
//         <label htmlFor="jobFilter" className="vac-filter-label">
//           Filter by job:
//         </label>
//         <select
//           id="jobFilter"
//           value={filterJob}
//           onChange={(e) => setFilterJob(e.target.value)}
//           className="vac-filter-select"
//         >
//           <option value="all">All jobs ({jobs.length})</option>
//           {jobs.map((j) => (
//             <option key={j._id} value={j._id}>
//               {j.title}
//             </option>
//           ))}
//         </select>
//         <div className="vac-filter-count">
//           Showing {filtered.length} application
//           {filtered.length !== 1 ? "s" : ""}
//         </div>
//       </div>

//       {/* Table */}
//       <div className="vac-table-wrap">
//         <table className="vac-table">
//           <thead>
//             <tr>
//               <th>Job</th>
//               <th>Candidate</th>
//               <th>Email</th>
//               <th>Resume</th>
//               <th>Source</th>
//               {jobId && <th>Score</th>}
//               <th>Status</th>
//               <th>Applied At</th>
//               <th>Screening Answers</th>
//               <th>Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {rows.map((a) => {
//               const confirmed = a.status === "InterviewConfirmed";
//               const invited =
//                 a.status === "Invited, not yet confirmed" ||
//                 invitedSet.has(a._id);
//               const hasAnswers =
//                 Array.isArray(a.screeningAnswers) &&
//                 a.screeningAnswers.length > 0;
//               const currentJob = findJobDetails(a.job?._id || a.job);

//               const statusStr =
//                 a.status === "InterviewConfirmed"
//                   ? "Interview Confirmed"
//                   : a.status || "Applied";

//               let btnClass = "vac-btn-primary";
//               if (confirmed) btnClass += " vac-btn-confirmed";
//               else if (invited) btnClass += " vac-btn-invited";

//               return (
//                 <tr key={a._id}>
//                   <td>{a.job?.title || "—"}</td>
//                   <td>{a.candidate?.name || "—"}</td>
//                   <td>{a.candidate?.email || "—"}</td>
//                   <td>
//                     {a.resumePath ? (
//                       <a
//                         href={fullUrl(a.resumePath)}
//                         target="_blank"
//                         rel="noreferrer"
//                         className="vac-link"
//                       >
//                         {a.resumeName || "Resume (Built in Builder)"}
//                       </a>
//                     ) : (
//                       "—"
//                     )}
//                   </td>
//                   <td>{a.resumeSource || "default"}</td>
//                   <td>
//                     <span className="vac-status-text">{statusStr}</span>
//                     {a.chosenDate && (
//                       <div className="vac-confirmed-inline">
//                         Confirmed: {fmtDateTime(a.chosenDate)}
//                       </div>
//                     )}
//                   </td>
//                   <td>{fmtDateTime(a.createdAt)}</td>

//                   <td>
//                     {hasAnswers && currentJob ? (
//                       <button
//                         type="button"
//                         onClick={() => handleViewAnswers(a)}
//                         className="vac-btn-secondary"
//                       >
//                         View ({a.screeningAnswers.length})
//                       </button>
//                     ) : (
//                       "—"
//                     )}
//                   </td>

//                   <td>
//                     <button
//                       type="button"
//                       onClick={() =>
//                         !invited && !confirmed && handleCallInterview(a)
//                       }
//                       disabled={invited || confirmed}
//                       className={btnClass}
//                       title={
//                         confirmed
//                           ? "Interview Confirmed"
//                           : invited
//                           ? "Invitation sent"
//                           : "Call for Interview"
//                       }
//                     >
//                       {confirmed
//                         ? "Interview Confirmed"
//                         : invited
//                         ? "Invited; not yet confirmed"
//                         : "Call for Interview"}
//                     </button>
//                   </td>
//                 </tr>
//               );
//             })}

//             {!filtered.length && (
//               <tr>
//                 <td colSpan={9} className="vac-empty">
//                   No applications found.
//                 </td>
//               </tr>
//             )}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }
// client/src/pages/Recruiter/ViewAppliedCandidates.jsx
// client/src/pages/Recruiter/ViewAppliedCandidates.jsx
import React, { useEffect, useMemo, useState } from "react";

import { useParams, useLocation } from "react-router-dom";
import "./ViewAppliedCandidates.css";

const API_BASE = import.meta?.env?.VITE_API_BASE || "http://127.0.0.1:5000";

const fullUrl = (p) =>
  /^https?:\/\//i.test(p)
    ? p
    : `${API_BASE}${p?.startsWith("/") ? "" : "/"}${p || ""}`;

const fmtDateTime = (d) => {
  try {
    const x = new Date(d);
    return Number.isNaN(x.getTime()) ? String(d) : x.toLocaleString();
  } catch {
    return String(d);
  }
};

const fmtScore = (v) => {
  if (typeof v !== "number") return "—";
  if (v <= 1 && v >= 0) return `${Math.round(v * 100)}%`;
  return `${Math.round(v)}%`;
};

// ✅ helper: convert Date/ISO -> datetime-local value safely
const toDateTimeLocalValue = (d) => {
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    const yyyy = dt.getFullYear();
    const mm = pad(dt.getMonth() + 1);
    const dd = pad(dt.getDate());
    const hh = pad(dt.getHours());
    const mi = pad(dt.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  } catch {
    return "";
  }
};

export default function ViewAppliedCandidates() {
  const { jobId: pathId } = useParams();
  const { search, state } = useLocation();

  const queryId = useMemo(
    () => new URLSearchParams(search).get("jobId"),
    [search],
  );

  const isObjectId = (v) =>
    typeof v === "string" && /^[0-9a-fA-F]{24}$/.test(v);

  const jobId = useMemo(() => {
    if (isObjectId(pathId)) return pathId;
    if (isObjectId(queryId)) return queryId;
    if (isObjectId(state?.jobId)) return state.jobId;
    return null;
  }, [pathId, queryId, state]);

  useEffect(() => {
    if (jobId) {
      setFilterJob(jobId);
    }
  }, [jobId]);

  const [apps, setApps] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [filterJob, setFilterJob] = useState("all");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");

  const [inviteModal, setInviteModal] = useState({ open: false, app: null });
  const [answersModal, setAnswersModal] = useState({
    open: false,
    app: null,
    job: null,
  });
  const [inviteDates, setInviteDates] = useState(["", "", ""]);

  const invitedSet = useMemo(() => {
    return new Set(
      apps
        .filter((a) => a.status === "Invited, not yet confirmed")
        .map((a) => a._id),
    );
  }, [apps]);

  // ✅ NEW: reschedule modal (approve/decline)
  const [rescheduleModal, setRescheduleModal] = useState({
    open: false,
    app: null,
  });
  const [resNewDate, setResNewDate] = useState("");
  const [resNote, setResNote] = useState("");

  const findJobDetails = (jobId) => {
    return jobs.find((j) => String(j._id) === String(jobId));
  };

  const handleCallInterview = (app) => {
    setInviteModal({ open: true, app });
    setInviteDates(["", "", ""]);
  };

  const handleViewAnswers = async (app) => {
    const jobId = app.job?._id || app.job;
    if (!jobId) return;

    try {
      const res = await api.get(`/applications/job/${jobId}`);
      const jobDetailsWithQs = res.data.job;
      setAnswersModal({ open: true, app, job: jobDetailsWithQs });
    } catch (e) {
      console.error("Failed to fetch job details for answers:", e);
      alert("Failed to load screening questions for this job.");
    }
  };

  const closeModal = () => setInviteModal({ open: false, app: null });

  const closeAnswersModal = () =>
    setAnswersModal({ open: false, app: null, job: null });

  const submitInvite = async () => {
    const filled = inviteDates.filter(Boolean);
    if (filled.length < 2) {
      setActionMsg("❌ Please select at least 2 interview date options.");
      setTimeout(() => setActionMsg(""), 1500);
      return;
    }

    const id = inviteModal.app?._id;
    if (!id) return closeModal();

    try {
      await api.put(`/applications/${id}/invite`, { inviteDates: filled });

      setApps((prev) =>
        prev.map((a) =>
          a._id === id
            ? {
                ...a,
                status: "Invited, not yet confirmed",
                inviteDates: filled,
              }
            : a,
        ),
      );

      setActionMsg("✅ Invitation sent. Waiting for candidate to confirm.");
      setInviteModal({ open: false, app: null });
      setTimeout(() => setActionMsg(""), 1500);
    } catch (e) {
      console.error(e);
      setActionMsg(
        e?.response?.data?.message || "❌ Failed to send invitation.",
      );
      setTimeout(() => setActionMsg(""), 2000);
    }
  };

  // ✅ NEW: open reschedule modal
  const openRescheduleModal = (app) => {
    const requested = app?.reschedule?.requestedDate;
    setResNewDate(toDateTimeLocalValue(requested || new Date()));
    setResNote("");
    setRescheduleModal({ open: true, app });
  };

  const closeRescheduleModal = () => {
    setRescheduleModal({ open: false, app: null });
    setResNewDate("");
    setResNote("");
  };

  // ✅ NEW: approve reschedule
  const approveReschedule = async () => {
    const app = rescheduleModal.app;
    const id = app?._id;
    if (!id) return closeRescheduleModal();

    if (!resNewDate) {
      setActionMsg("❌ Please select a date/time to approve.");
      setTimeout(() => setActionMsg(""), 1500);
      return;
    }

    try {
      const res = await api.put(`/applications/${id}/reschedule-approve`, {
        newDate: resNewDate,
        note: resNote,
      });

      const updated = res?.data?.application;

      setApps((prev) =>
        prev.map((a) => (a._id === id ? { ...a, ...updated } : a)),
      );

      setActionMsg("✅ Reschedule approved and interview confirmed.");
      setTimeout(() => setActionMsg(""), 1800);
      closeRescheduleModal();
    } catch (e) {
      console.error(e);
      setActionMsg(
        e?.response?.data?.message || "❌ Failed to approve reschedule.",
      );
      setTimeout(() => setActionMsg(""), 2000);
    }
  };

  // ✅ NEW: decline reschedule
  const declineReschedule = async () => {
    const app = rescheduleModal.app;
    const id = app?._id;
    if (!id) return closeRescheduleModal();

    try {
      const res = await api.put(`/applications/${id}/reschedule-approve`, {
        newDate: resNewDate,
        note: resNote,
      });

      const updated = res?.data?.application;

      setApps((prev) =>
        prev.map((a) => (a._id === id ? { ...a, ...updated } : a)),
      );

      setActionMsg("✅ Reschedule declined.");
      setTimeout(() => setActionMsg(""), 1800);
      closeRescheduleModal();
    } catch (e) {
      console.error(e);
      setActionMsg(
        e?.response?.data?.message || "❌ Failed to decline reschedule.",
      );
      setTimeout(() => setActionMsg(""), 2000);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/applications/recruiter/all");
        setApps(res.data.applications || []);
        setJobs(res.data.jobs || []);
      } catch (e) {
        const status = e?.response?.status;
        const msg =
          e?.response?.data?.message ||
          (status === 401
            ? "Please sign in as recruiter."
            : "Failed to load applications.");
        setErr(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, [jobId]);

  const filtered = useMemo(() => {
    if (filterJob === "all") return apps;
    return apps.filter((a) => String(a.job?._id || a.job) === filterJob);
  }, [apps, filterJob]);

  // For single-job view (when jobId is present), rank by matchScore (desc)
  const rows = useMemo(() => {
    if (!jobId) return filtered; // global page: keep current ordering
    const copy = [...filtered];
    copy.sort((a, b) => {
      const sa = typeof a.matchScore === "number" ? a.matchScore : -Infinity;
      const sb = typeof b.matchScore === "number" ? b.matchScore : -Infinity;
      return sb - sa; // highest score first
    });
    return copy;
  }, [filtered, jobId]);

  if (loading) return <p style={{ padding: 16 }}>Loading…</p>;
  if (err) return <p style={{ padding: 16, color: "#dc2626" }}>{err}</p>;

  return (
    <div className="vac-container">
      <h2 className="vac-heading">Applied Candidates</h2>

      {actionMsg && <div className="vac-alert">{actionMsg}</div>}

      {/* ✅ NEW: Reschedule modal (Approve/Decline) */}
      {rescheduleModal.open && (
        <div className="vac-modal-overlay">
          <div className="vac-modal-card">
            <button
              type="button"
              className="vac-modal-close"
              onClick={closeRescheduleModal}
            >
              ×
            </button>

            <h3 className="vac-modal-title">Reschedule Request</h3>
            <p className="vac-modal-text">
              Candidate requested:{" "}
              <strong>
                {fmtDateTime(rescheduleModal.app?.reschedule?.requestedDate)}
              </strong>
            </p>

            <div className="vac-modal-field">
              <label className="vac-modal-label">Approve date/time</label>
              <input
                type="datetime-local"
                value={resNewDate}
                onChange={(e) => setResNewDate(e.target.value)}
                className="vac-modal-input"
              />
            </div>

            <div className="vac-modal-field">
              <label className="vac-modal-label">Note (optional)</label>
              <input
                type="text"
                value={resNote}
                onChange={(e) => setResNote(e.target.value)}
                className="vac-modal-input"
                placeholder="Message to candidate (optional)"
              />
            </div>

            <div
              className="vac-modal-actions"
              style={{ display: "flex", gap: 10, justifyContent: "center" }}
            >
              <button
                type="button"
                className="vac-modal-primary-btn"
                onClick={approveReschedule}
              >
                Approve
              </button>

              <button
                type="button"
                className="vac-modal-primary-btn"
                onClick={declineReschedule}
                style={{
                  background: "#ef4444",
                  borderColor: "#ef4444",
                }}
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite modal – with X on top-right, single centered button */}
      {inviteModal.open && (
        <div className="vac-modal-overlay">
          <div className="vac-modal-card">
            <button
              type="button"
              className="vac-modal-close"
              onClick={closeModal}
            >
              ×
            </button>

            <h3 className="vac-modal-title">Call for Interview</h3>
            <p className="vac-modal-text">
              Select <strong>2–3 date/time</strong> options to invite{" "}
              {inviteModal.app?.candidate?.name || "the candidate"}.
            </p>

            {inviteDates.map((v, idx) => (
              <div key={idx} className="vac-modal-field">
                <label className="vac-modal-label">Option {idx + 1}</label>
                <input
                  type="datetime-local"
                  value={v}
                  onChange={(e) => {
                    const copy = [...inviteDates];
                    copy[idx] = e.target.value;
                    setInviteDates(copy);
                  }}
                  className="vac-modal-input"
                />
              </div>
            ))}

            <div className="vac-modal-actions">
              <button
                onClick={submitInvite}
                type="button"
                className="vac-modal-primary-btn"
              >
                Invite Candidate for Interview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Screening Answers modal – with X only, no bottom Close button */}
      {answersModal.open && answersModal.app && answersModal.job && (
        <div className="vac-answers-overlay">
          <div className="vac-answers-card">
            <button
              type="button"
              className="vac-answers-close"
              onClick={closeAnswersModal}
            >
              ×
            </button>

            <h3
              style={{
                marginTop: 0,
                marginBottom: 10,
                color: "#1f2937",
                fontSize: "1rem",
              }}
            >
              Screening Answers from{" "}
              {answersModal.app.candidate?.name || "Candidate"}
            </h3>
            <p
              style={{
                color: "#64748b",
                marginBottom: 15,
                fontSize: "0.85rem",
              }}
            >
              Job: <strong>{answersModal.job.title}</strong>
            </p>

            <div style={{ maxHeight: 400, overflowY: "auto" }}>
              {answersModal.job.screeningQuestions &&
              answersModal.app.screeningAnswers ? (
                answersModal.job.screeningQuestions.map((question, index) => (
                  <div
                    key={index}
                    style={{
                      marginBottom: 15,
                      padding: 10,
                      border: "1px solid #f1f5f9",
                      borderRadius: 8,
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontWeight: 700,
                        color: "#2563eb",
                        fontSize: "0.85rem",
                      }}
                    >
                      {index + 1}. {question}
                    </p>
                    <p
                      style={{
                        margin: "5px 0 0 0",
                        padding: "5px 8px",
                        background: "#f8fafc",
                        borderRadius: 4,
                        whiteSpace: "pre-wrap",
                        fontSize: "0.85rem",
                      }}
                    >
                      {answersModal.app.screeningAnswers[index] ||
                        "No answer provided"}
                    </p>
                  </div>
                ))
              ) : (
                <p
                  style={{
                    color: "#9ca3af",
                    textAlign: "center",
                    fontSize: "0.85rem",
                  }}
                >
                  No screening questions found for this job, or candidate did
                  not provide answers.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filter row */}
      <div className="vac-filter-row">
        <label htmlFor="jobFilter" className="vac-filter-label">
          Filter by job:
        </label>
        <select
          id="jobFilter"
          value={filterJob}
          onChange={(e) => setFilterJob(e.target.value)}
          className="vac-filter-select"
        >
          <option value="all">All jobs ({jobs.length})</option>
          {jobs.map((j) => (
            <option key={j._id} value={j._id}>
              {j.title}
            </option>
          ))}
        </select>
        <div className="vac-filter-count">
          Showing {filtered.length} application
          {filtered.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Table */}
      <div className="vac-table-wrap">
        <table className="vac-table">
          <thead>
            <tr>
              <th>Job</th>
              <th>Candidate</th>
              <th>Email</th>
              <th>Resume</th>
              <th>Source</th>
              {jobId && <th>Score</th>}
              <th>Status</th>
              <th>Applied At</th>
              <th>Screening Answers</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => {
              const confirmed = a.status === "InterviewConfirmed";
              const invited =
                a.status === "Invited, not yet confirmed" ||
                invitedSet.has(a._id);

              const hasAnswers =
                Array.isArray(a.screeningAnswers) &&
                a.screeningAnswers.length > 0;

              const currentJob = findJobDetails(a.job?._id || a.job);

              const statusStr =
                a.status === "InterviewConfirmed"
                  ? "Interview Confirmed"
                  : a.status || "Applied";

              let btnClass = "vac-btn-primary";
              if (confirmed) btnClass += " vac-btn-confirmed";
              else if (invited) btnClass += " vac-btn-invited";

              const resStatus = a?.reschedule?.status || "none";
              const hasRescheduleRequest = resStatus === "requested";

              return (
                <tr key={a._id}>
                  <td>{a.job?.title || "—"}</td>
                  <td>{a.candidate?.name || "—"}</td>
                  <td>{a.candidate?.email || "—"}</td>

                  <td>
                    {a.resumePath ? (
                      <a
                        href={fullUrl(a.resumePath)}
                        target="_blank"
                        rel="noreferrer"
                        className="vac-link"
                      >
                        {a.resumeName || "Resume (Built in Builder)"}
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td>{a.resumeSource || "default"}</td>

                  {jobId && <td>{fmtScore(a.matchScore)}</td>}

                  <td>
                    <span className="vac-status-text">{statusStr}</span>

                    {a.chosenDate && (
                      <div className="vac-confirmed-inline">
                        Confirmed: {fmtDateTime(a.chosenDate)}
                      </div>
                    )}

                    {/* ✅ NEW: show reschedule status inline */}
                    {hasRescheduleRequest && (
                      <div
                        className="vac-confirmed-inline"
                        style={{ color: "#b45309" }}
                      >
                        Reschedule requested:{" "}
                        {fmtDateTime(a.reschedule?.requestedDate)}
                      </div>
                    )}

                    {resStatus === "approved" && (
                      <div
                        className="vac-confirmed-inline"
                        style={{ color: "#15803d" }}
                      >
                        Reschedule approved ✅
                      </div>
                    )}

                    {resStatus === "declined" && (
                      <div
                        className="vac-confirmed-inline"
                        style={{ color: "#dc2626" }}
                      >
                        Reschedule declined ❌
                      </div>
                    )}
                  </td>

                  <td>{fmtDateTime(a.createdAt)}</td>

                  <td>
                    {hasAnswers && currentJob ? (
                      <button
                        type="button"
                        onClick={() => handleViewAnswers(a)}
                        className="vac-btn-secondary"
                      >
                        View ({a.screeningAnswers.length})
                      </button>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {/* existing interview invite button */}
                    <button
                      type="button"
                      onClick={() =>
                        !invited && !confirmed && handleCallInterview(a)
                      }
                      disabled={invited || confirmed}
                      className={btnClass}
                      title={
                        confirmed
                          ? "Interview Confirmed"
                          : invited
                            ? "Invitation sent"
                            : "Call for Interview"
                      }
                    >
                      {confirmed
                        ? "Interview Confirmed"
                        : invited
                          ? "Invited; not yet confirmed"
                          : "Call for Interview"}
                    </button>

                    {/* ✅ NEW: reschedule decision button */}
                    {hasRescheduleRequest && (
                      <button
                        type="button"
                        onClick={() => openRescheduleModal(a)}
                        className="vac-btn-secondary"
                        style={{
                          background: "#f59e0b",
                          borderColor: "#f59e0b",
                        }}
                        title="Candidate requested reschedule"
                      >
                        Review Reschedule
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}

            {!filtered.length && (
              <tr>
                <td colSpan={jobId ? 10 : 9} className="vac-empty">
                  No applications found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
