// client/src/pages/Candidate/InterviewInvitation.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { api } from "../../utils/api";
import { useNavigate } from "react-router-dom";



const fmtDateTime = (d) => {
  try {
    const dt = new Date(d);
    return Number.isNaN(dt.getTime()) ? String(d) : dt.toLocaleString();
  } catch { return String(d); }
};

async function fetchMyApplications() {
  const res = await api.get("/applications/mine");
  const data = res.data;
  return Array.isArray(data) ? data : data?.applications || data || [];
}

// ── Window state ──
// Opens 10 min before, button expires at +10 min (not 15), full window expires at +15 min
function getWindowState(chosenDate) {
  if (!chosenDate) return "unknown";
  const diff = Date.now() - new Date(chosenDate).getTime();
  if (diff < -10 * 60 * 1000) return "upcoming";       // not open yet
  if (diff <= 10 * 60 * 1000) return "live";            // can start/resume
  if (diff <= 15 * 60 * 1000) return "btn_expired";     // button expired but window still "counts"
  return "expired";                                      // full window expired
}

// ── Resume attempt tracking (sessionStorage per appId) ──
function getResumeCount(appId) {
  try { return parseInt(sessionStorage.getItem(`iv_resume_${appId}`) || "0", 10); }
  catch { return 0; }
}
function incResumeCount(appId) {
  try {
    const n = getResumeCount(appId) + 1;
    sessionStorage.setItem(`iv_resume_${appId}`, String(n));
    return n;
  } catch { return 1; }
}

// ── Popup retry tracking (sessionStorage per appId) ──
// popup shows max 5 times, with 2 min gap between each
function getPopupState(appId) {
  try {
    return JSON.parse(sessionStorage.getItem(`iv_popup_${appId}`) || '{"count":0,"nextShow":0}');
  } catch { return { count: 0, nextShow: 0 }; }
}
function updatePopupState(appId, state) {
  try { sessionStorage.setItem(`iv_popup_${appId}`, JSON.stringify(state)); }
  catch {}
}

export default function InterviewInvitation() {
  const navigate = useNavigate();

  const [loading, setLoading]           = useState(true);
  const [err, setErr]                   = useState("");
  const [apps, setApps]                 = useState([]);
  const [toast, setToast]               = useState("");
  const [popup, setPopup]               = useState(null);
  const [windowStates, setWindowStates] = useState({});
  // ivStatus: appId -> { status, answeredCount, totalCount, overallScore }
  const [ivStatus, setIvStatus]         = useState({});

  const tickRef = useRef(null);

  const fetchStatus = async (appId) => {
    try {
      const r = await api.get(`/interview/${appId}/status`);
      setIvStatus((prev) => ({ ...prev, [String(appId)]: r.data }));
    } catch {
      setIvStatus((prev) => ({ ...prev, [String(appId)]: { status: "none" } }));
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const list = await fetchMyApplications();
        const confirmed = list.filter((a) => a.status === "InterviewConfirmed" && a.chosenDate);
        setApps(confirmed);
        await Promise.all(confirmed.map((a) => fetchStatus(a._id)));
      } catch (e) {
        console.error(e);
        setErr(e?.response?.data?.message || "Failed to load interview invitations.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Tick every 15 s — update window states + popup retry logic ──
  const computeWindowStates = useCallback(() => {
    const next = {};
    const now = Date.now();

    apps.forEach((app) => {
      const appId = String(app._id);
      const ws = getWindowState(app.chosenDate);
      next[appId] = ws;

      // Popup retry: show up to 5 times, every 2 min gap, only while live
      if (ws === "live" && (ivStatus[appId]?.status || "none") !== "completed") {
        const ps = getPopupState(appId);
        if (ps.count < 5 && now >= ps.nextShow) {
          updatePopupState(appId, { count: ps.count + 1, nextShow: now + 2 * 60 * 1000 });
          const jobTitle = app?.job?.title || "Interview";
          const company  = app?.job?.createdBy?.companyName || app?.job?.companyName || app?.job?.createdBy?.name || "";
          setPopup({ appId, jobTitle, company, scheduledAt: app.chosenDate });
        }
      }
    });
    setWindowStates(next);
  }, [apps, ivStatus]);

  useEffect(() => {
    computeWindowStates();
    tickRef.current = setInterval(computeWindowStates, 15_000);
    return () => clearInterval(tickRef.current);
  }, [computeWindowStates]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 3000); };

  const dismissPopup = () => setPopup(null);
  // Dismiss without resetting count — popup will retry after 2 min if count < 5

  const goToInterview = (app) => {
    const appId = String(app._id);
    const ws = windowStates[appId] || getWindowState(app.chosenDate);
    if (ws === "expired" || ws === "btn_expired") {
      showToast("The interview start window has expired.");
      return;
    }
    if (ws !== "live") {
      showToast(`Interview opens 10 min before: ${fmtDateTime(app.chosenDate)}`);
      return;
    }

    const iv = ivStatus[appId] || { status: "none" };
    const isInProgress = iv.status === "in_progress";

    if (isInProgress) {
      const count = incResumeCount(appId);
      if (count > 3) {
        showToast("Maximum resume attempts reached. Interview has been cancelled.");
        return;
      }
    }

    setPopup(null);
    navigate(`/candidate/interview/${app._id}`);
  };

  /* ── Loading ── */
  if (loading) return (
    <div style={st.centeredMsg}>
      <i className="fas fa-circle-notch fa-spin" style={{ fontSize: 28, color: "#2563eb" }} />
      <p style={{ color: "#64748b", marginTop: 12, fontWeight: 600 }}>Loading invitations…</p>
    </div>
  );

  /* ── Error ── */
  if (err) return (
    <div style={st.centeredMsg}>
      <i className="fas fa-triangle-exclamation" style={{ fontSize: 28, color: "#dc2626", marginBottom: 10 }} />
      <p style={{ color: "#dc2626", fontWeight: 600 }}>{err}</p>
    </div>
  );

  return (
    <div style={st.page}>

      {/* ── Popup ── */}
      {popup && (
        <div style={popSt.backdrop}>
          <div style={popSt.box}>
            <button style={popSt.closeBtn} onClick={dismissPopup}>✕</button>
            <div style={popSt.liveRow}>
              <span style={popSt.dot} />
              <span style={popSt.liveLabel}>Live Now</span>
            </div>
            <h3 style={popSt.title}>Your interview is ready!</h3>
            <div style={popSt.infoBox}>
              <p style={popSt.role}>{popup.jobTitle}</p>
              {popup.company && <p style={popSt.company}>{popup.company}</p>}
              <p style={popSt.time}>
                <i className="fas fa-clock" style={{ marginRight: 5 }} />
                Scheduled: {fmtDateTime(popup.scheduledAt)}
              </p>
            </div>
            <p style={popSt.sub}>The interview window is open. Start now to avoid missing it.</p>
            <div style={popSt.btns}>
              <button style={popSt.laterBtn} onClick={dismissPopup}>Later</button>
              <button style={popSt.startBtn} onClick={() => {
                const app = apps.find((a) => String(a._id) === popup.appId);
                if (app) goToInterview(app);
              }}>
                <i className="fas fa-play" style={{ marginRight: 7, fontSize: 12 }} />
                Start Interview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div style={st.headerRow}>
        <div>
          <h2 style={st.heading}>
            <i className="fas fa-envelope-open-text" style={{ marginRight: 10, color: "#2563eb", fontSize: 22 }} />
            Interview Invitations
          </h2>
          <p style={st.subheading}>
            {apps.length > 0
              ? `You have ${apps.length} confirmed interview${apps.length !== 1 ? "s" : ""}`
              : "No confirmed interviews yet"}
          </p>
        </div>
        <button type="button" onClick={() => navigate("/candidate/applied-jobs")} style={st.backBtn}>
          <i className="fas fa-arrow-left" style={{ marginRight: 6 }} />Applied Jobs
        </button>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div style={st.toast}>
          <i className="fas fa-clock" style={{ marginRight: 8, fontSize: 14 }} />{toast}
        </div>
      )}

      {/* ── Empty ── */}
      {apps.length === 0 && (
        <div style={st.emptyCard}>
          <i className="fas fa-inbox" style={{ fontSize: 38, color: "#cbd5e1", marginBottom: 12 }} />
          <p style={{ color: "#64748b", fontWeight: 700, margin: 0, fontSize: "1rem" }}>No confirmed interview invitations yet.</p>
          <p style={{ color: "#94a3b8", fontSize: "0.83rem", marginTop: 6 }}>Once a recruiter invites you and you confirm a date, it will appear here.</p>
          <button type="button" onClick={() => navigate("/candidate/applied-jobs")}
            style={{ ...st.actionBtn("#2563eb"), marginTop: 16 }}>
            <i className="fas fa-briefcase" style={{ marginRight: 7 }} />View Applied Jobs
          </button>
        </div>
      )}

      {/* ── Cards ── */}
      <div style={st.cardList}>
        {apps.map((app, listIdx) => {
          const appId       = String(app._id);
          const ws          = windowStates[appId] || getWindowState(app.chosenDate);
          const isLive      = ws === "live";
          const isBtnExpired = ws === "btn_expired";
          const isExpired   = ws === "expired";
          const iv          = ivStatus[appId] || { status: "none" };
          const isCompleted  = iv.status === "completed";
          const isInProgress = iv.status === "in_progress";
          const resumeCount  = getResumeCount(appId);
          const isCancelled  = isInProgress && resumeCount >= 3;

          const jobTitle = app?.job?.title || "Interview";
          const company  = app?.job?.createdBy?.companyName || app?.job?.companyName || app?.job?.createdBy?.name || "Company";
          const rescheduleStatus = app?.reschedule?.status || "none";

          // ════════════════════════════════════
          // COMPLETED CARD
          // ════════════════════════════════════
          if (isCompleted) {
            const score = iv.overallScore;
            const scoreColor = score == null ? "#fff" : score >= 7 ? "#fff" : score >= 4 ? "#fff" : "#fff";

            return (
              <div key={appId} style={cSt.completedCard}>
                <div style={st.rankBadge}>#{listIdx + 1}</div>
                <div style={cSt.inner}>

                  {/* LEFT */}
                  <div style={{ flexGrow: 1, minWidth: 0 }}>
                    <span style={cSt.interviewedPill}>
                      <i className="fas fa-circle-check" style={{ marginRight: 5 }} />Interviewed
                    </span>
                    <div style={st.jobTitle}>{jobTitle}</div>
                    <div style={st.company}>
                      <i className="fas fa-building" style={{ marginRight: 6, color: "#94a3b8", fontSize: 13 }} />
                      {company}
                    </div>
                    <div style={st.timeRow}>
                      <i className="fas fa-calendar-check" style={{ color: "#2563eb", fontSize: 14, marginRight: 8, marginTop: 2 }} />
                      <div>
                        <span style={st.timeLabel}>Interview Date</span>
                        <span style={st.timeValue}>{fmtDateTime(app.chosenDate)}</span>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT — compact boxes, all white text, no emoji */}
                  <div style={cSt.right}>
                    {score != null && (
                      <div style={cSt.scoreBox}>
                        <span style={cSt.scoreBig}>{Number(score).toFixed(1)}</span>
                        <span style={cSt.scoreLabel}>Score / 10</span>
                      </div>
                    )}
                    <div style={cSt.awaitingBox}>
                      <p style={cSt.awaitingTitle}>Interviewed</p>
                      <p style={cSt.awaitingSub}>Awaiting recruiter decision</p>
                    </div>
                  </div>

                </div>
              </div>
            );
          }

          // ════════════════════════════════════
          // NORMAL CARD
          // ════════════════════════════════════

          let cardOverride = {};
          if (isExpired || isBtnExpired) cardOverride = { border: "1px solid #fecaca", borderLeft: "4px solid #ef4444" };
          else if (isInProgress && isLive && !isCancelled) cardOverride = { border: "1px solid #bbf7d0", borderLeft: "4px solid #16a34a" };

          // Determine right-side content
          let rightContent;

          if (isExpired) {
            rightContent = (
              <div style={cSt.expiredBox}>
                <p style={cSt.expiredTitle}>Window Closed</p>
                <p style={cSt.expiredSub}>Contact recruiter to reschedule.</p>
              </div>
            );
          } else if (isBtnExpired) {
            rightContent = (
              <button type="button" disabled style={cSt.timeExpiredBtn}>
                <i className="fas fa-ban" style={{ marginRight: 7, fontSize: 13 }} />
                Interview Time Expired
              </button>
            );
          } else if (isCancelled) {
            rightContent = (
              <button type="button" disabled style={cSt.cancelledBtn}>
                <i className="fas fa-circle-xmark" style={{ marginRight: 7, fontSize: 13 }} />
                Interview Cancelled
              </button>
            );
          } else {
            // normal: locked / start / resume
            const btnLabel = !isLive
              ? <><i className="fas fa-lock"         style={{ marginRight: 7, fontSize: 13 }} />Start Interview</>
              : isInProgress
              ? <><i className="fas fa-rotate-right" style={{ marginRight: 7, fontSize: 13 }} />Resume Interview</>
              : <><i className="fas fa-play"          style={{ marginRight: 7, fontSize: 13 }} />Start Interview</>;

            const btnBg  = !isLive ? "#e2e8f0" : isInProgress ? "#16a34a" : "#2563eb";
            const btnClr = !isLive ? "#94a3b8" : "#fff";

            rightContent = (
              <>
                <button
                  type="button"
                  onClick={() => goToInterview(app)}
                  disabled={!isLive}
                  style={st.actionBtn(btnBg, btnClr, !isLive)}
                >
                  {btnLabel}
                </button>
                {isLive && (
                  <div style={st.liveTag}>
                    <i className="fas fa-circle" style={{ fontSize: 7, marginRight: 5, color: "#16a34a" }} />
                    {isInProgress ? `In Progress (${resumeCount}/3)` : "Live Now"}
                  </div>
                )}
              </>
            );
          }

          return (
            <div key={appId} style={{ ...st.card(isLive && !isBtnExpired), ...cardOverride }}>
              <div style={st.rankBadge}>#{listIdx + 1}</div>
              <div style={st.cardInner}>

                {/* LEFT */}
                <div style={st.cardLeft}>
                  <span style={st.confirmedPill}>
                    <i className="fas fa-circle-check" style={{ marginRight: 5, color: "#16a34a" }} />Confirmed
                  </span>
                  <div style={st.jobTitle}>{jobTitle}</div>
                  <div style={st.company}>
                    <i className="fas fa-building" style={{ marginRight: 6, color: "#94a3b8", fontSize: 13 }} />{company}
                  </div>
                  <div style={st.timeRow}>
                    <i className="fas fa-calendar-check" style={{ color: "#2563eb", fontSize: 14, marginRight: 8, marginTop: 2 }} />
                    <div>
                      <span style={st.timeLabel}>Interview Scheduled</span>
                      <span style={st.timeValue}>{fmtDateTime(app.chosenDate)}</span>
                    </div>
                  </div>

                  {rescheduleStatus === "requested" && (
                    <div style={st.rescheduleTag("#fef3c7", "#92400e")}>
                      <i className="fas fa-hourglass-half" style={{ marginRight: 6 }} />
                      Reschedule requested: {fmtDateTime(app?.reschedule?.requestedDate)}
                    </div>
                  )}
                  {rescheduleStatus === "approved" && (
                    <div style={st.rescheduleTag("#d1fae5", "#065f46")}>
                      <i className="fas fa-circle-check" style={{ marginRight: 6 }} />Reschedule approved
                    </div>
                  )}
                  {rescheduleStatus === "declined" && (
                    <div style={st.rescheduleTag("#fee2e2", "#991b1b")}>
                      <i className="fas fa-circle-xmark" style={{ marginRight: 6 }} />Reschedule declined
                    </div>
                  )}

                  {!isLive && !isExpired && !isBtnExpired && (
                    <div style={st.hintText}>
                      <i className="fas fa-lock" style={{ marginRight: 5, fontSize: 11 }} />
                      Button activates 10 min before scheduled time
                    </div>
                  )}
                  {(isExpired || isBtnExpired) && (
                    <div style={{ ...st.hintText, color: "#ef4444", fontStyle: "normal" }}>
                      <i className="fas fa-clock" style={{ marginRight: 5, fontSize: 11 }} />
                      {isBtnExpired ? "Start window closed (10 min after scheduled time)" : "Window closed 15 min after scheduled time"}
                    </div>
                  )}
                  {isInProgress && isLive && !isCancelled && (
                    <div style={{ ...st.hintText, color: "#16a34a", fontStyle: "normal" }}>
                      <i className="fas fa-circle-play" style={{ marginRight: 5, fontSize: 11 }} />
                      {iv.answeredCount || 0} of {iv.totalCount || 0} questions answered
                    </div>
                  )}
                  {isCancelled && (
                    <div style={{ ...st.hintText, color: "#dc2626", fontStyle: "normal" }}>
                      <i className="fas fa-ban" style={{ marginRight: 5, fontSize: 11 }} />
                      Max resume attempts (3) reached
                    </div>
                  )}
                </div>

                {/* RIGHT */}
                <div style={st.cardRight}>{rightContent}</div>
              </div>
            </div>
          );
        })}
      </div>

      {apps.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <button type="button" onClick={() => navigate("/candidate/applied-jobs")} style={st.backBtn}>
            <i className="fas fa-arrow-left" style={{ marginRight: 6 }} />Back to Applied Jobs
          </button>
        </div>
      )}
    </div>
  );
}

/* ─────────────── Original styles — unchanged ─────────────── */
const st = {
  page:          { width: "90vw", margin: "0 auto", padding: "24px 0 36px" },
  headerRow:     { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 },
  heading:       { margin: 0, fontSize: 24, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px", display: "flex", alignItems: "center" },
  subheading:    { margin: "4px 0 0 0", color: "#64748b", fontSize: "0.9rem" },
  backBtn:       { padding: "8px 14px", borderRadius: 8, border: "1px solid #d1d5db", background: "#f8fafc", fontWeight: 700, fontSize: "0.83rem", cursor: "pointer", color: "#374151", whiteSpace: "nowrap", display: "flex", alignItems: "center" },
  toast:         { marginBottom: 14, padding: "11px 16px", borderRadius: 10, background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8", fontWeight: 700, display: "flex", alignItems: "center", fontSize: "0.88rem" },
  emptyCard:     { padding: "36px 24px", borderRadius: 16, border: "1px dashed #cbd5e1", background: "#f8fafc", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" },
  cardList:      { display: "flex", flexDirection: "column", gap: 14 },
  card: (able) => ({
    background: "#fff",
    border: `1px solid ${able ? "#bfdbfe" : "#e2e8f0"}`,
    borderLeft: `4px solid ${able ? "#2563eb" : "#94a3b8"}`,
    borderRadius: 12, padding: "14px 18px",
    boxShadow: able ? "0 4px 14px rgba(37,99,235,0.09)" : "0 2px 6px rgba(0,0,0,0.05)",
    position: "relative",
  }),
  rankBadge:     { position: "absolute", top: 12, right: 14, fontSize: "0.68rem", fontWeight: 700, color: "#cbd5e1", letterSpacing: "0.5px" },
  cardInner:     { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 },
  cardLeft:      { flexGrow: 1, minWidth: 0 },
  cardRight:     { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 },
  confirmedPill: { display: "inline-flex", alignItems: "center", padding: "2px 10px", borderRadius: 20, background: "#d1fae5", color: "#065f46", fontSize: "0.7rem", fontWeight: 700, marginBottom: 7, letterSpacing: "0.3px" },
  jobTitle:      { fontWeight: 800, fontSize: 18, color: "#0f172a", marginBottom: 3, textTransform: "capitalize" },
  company:       { color: "#64748b", fontSize: "0.85rem", marginBottom: 9, display: "flex", alignItems: "center" },
  timeRow:       { display: "flex", alignItems: "flex-start", marginBottom: 7 },
  timeLabel:     { display: "block", fontSize: "0.67rem", fontWeight: 700, color: "#94a3b8", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 1 },
  timeValue:     { display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#1e40af" },
  rescheduleTag: (bg, color) => ({ display: "inline-flex", alignItems: "center", marginTop: 6, padding: "3px 10px", borderRadius: 8, background: bg, color, fontSize: "0.75rem", fontWeight: 700 }),
  hintText:      { marginTop: 7, fontSize: "0.7rem", color: "#94a3b8", fontStyle: "italic", display: "flex", alignItems: "center" },
  liveTag:       { fontSize: "0.68rem", fontWeight: 700, color: "#16a34a", letterSpacing: "0.5px", display: "flex", alignItems: "center" },
  centeredMsg:   { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 60 },
  actionBtn: (bg, color = "#fff", disabled = false) => ({
    display: "flex", alignItems: "center",
    padding: "9px 16px", borderRadius: 9, border: "none",
    background: bg, color,
    fontWeight: 800, fontSize: "0.85rem",
    cursor: disabled ? "not-allowed" : "pointer",
    whiteSpace: "nowrap",
    boxShadow: disabled ? "none" : `0 3px 10px ${bg}55`,
  }),
};

/* ─── Card-specific styles ─── */
const cSt = {
  // Completed card
  completedCard: {
    background: "#f0f9ff", border: "1px solid #bfdbfe",
    borderLeft: "4px solid #2563eb", borderRadius: 12,
    padding: "14px 18px", position: "relative",
    boxShadow: "0 2px 10px rgba(37,99,235,0.07)",
  },
  inner:          { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 },
  interviewedPill:{ display: "inline-flex", alignItems: "center", padding: "2px 10px", borderRadius: 20, background: "#16a34a", color: "#fff", fontSize: "0.7rem", fontWeight: 700, marginBottom: 7, letterSpacing: "0.3px" },
  right:          { display: "flex", flexDirection: "column", alignItems: "center", gap: 6, flexShrink: 0 },

  // Score box — compact, blue bg, white text
  scoreBox: {
    display: "flex", flexDirection: "column", alignItems: "center",
    background: "#2563eb", borderRadius: 8,
    padding: "6px 14px", minWidth: 72,
  },
  scoreBig:   { fontSize: 22, fontWeight: 900, lineHeight: 1, color: "#fff" },
  scoreLabel: { fontSize: "0.6rem", fontWeight: 700, color: "#bfdbfe", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 2 },

  // Awaiting box — compact, blue bg, white text, no emoji
  awaitingBox: {
    display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
    padding: "6px 12px", background: "#2563eb", borderRadius: 8, minWidth: 130,
  },
  awaitingTitle: { margin: 0, fontWeight: 800, fontSize: "0.78rem", color: "#fff" },
  awaitingSub:   { margin: "2px 0 0", fontSize: "0.65rem", color: "#bfdbfe", lineHeight: 1.3 },

  // Expired
  expiredBox:   { textAlign: "center", padding: "8px 14px", background: "#fff5f5", border: "1px solid #fecaca", borderRadius: 8, minWidth: 130 },
  expiredTitle: { margin: 0, fontWeight: 800, fontSize: "0.78rem", color: "#991b1b" },
  expiredSub:   { margin: "2px 0 0", fontSize: "0.65rem", color: "#ef4444" },

  // Interview Time Expired button (non-clickable)
  timeExpiredBtn: {
    display: "flex", alignItems: "center",
    padding: "9px 14px", borderRadius: 9, border: "none",
    background: "#fef3c7", color: "#92400e",
    fontWeight: 800, fontSize: "0.82rem",
    cursor: "not-allowed", whiteSpace: "nowrap",
    opacity: 0.9,
  },

  // Interview Cancelled button (non-clickable)
  cancelledBtn: {
    display: "flex", alignItems: "center",
    padding: "9px 14px", borderRadius: 9, border: "none",
    background: "#fee2e2", color: "#991b1b",
    fontWeight: 800, fontSize: "0.82rem",
    cursor: "not-allowed", whiteSpace: "nowrap",
    opacity: 0.9,
  },
};

/* ─── Popup styles ─── */
const popSt = {
  backdrop: { position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 },
  box:      { background: "#fff", borderRadius: 16, padding: "26px 26px 22px", width: 360, boxShadow: "0 28px 72px rgba(0,0,0,0.22)", position: "relative" },
  closeBtn: { position: "absolute", top: 12, right: 14, background: "none", border: "none", fontSize: 15, color: "#94a3b8", cursor: "pointer", padding: 4 },
  liveRow:  { display: "flex", alignItems: "center", gap: 7, marginBottom: 12 },
  dot:      { display: "inline-block", width: 11, height: 11, borderRadius: "50%", background: "#16a34a" },
  liveLabel:{ fontSize: 11, fontWeight: 800, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.7px" },
  title:    { margin: "0 0 12px", fontWeight: 800, fontSize: 18, color: "#0f172a" },
  infoBox:  { background: "#f8fafc", border: "1px solid #e2e8f0", borderLeft: "4px solid #2563eb", borderRadius: 10, padding: "11px 14px", marginBottom: 12 },
  role:     { margin: 0, fontWeight: 800, fontSize: 15, color: "#0f172a" },
  company:  { margin: "3px 0 0", fontSize: 13, color: "#64748b" },
  time:     { margin: "7px 0 0", fontSize: 12, fontWeight: 700, color: "#2563eb" },
  sub:      { margin: "0 0 16px", fontSize: 13, color: "#64748b", lineHeight: 1.5 },
  btns:     { display: "flex", gap: 10 },
  laterBtn: { flex: 1, padding: "10px", borderRadius: 9, border: "1.5px solid #e2e8f0", background: "#f8fafc", color: "#374151", fontWeight: 700, fontSize: 13, cursor: "pointer" },
  startBtn: { flex: 2, padding: "10px", borderRadius: 9, border: "none", background: "#2563eb", color: "#fff", fontWeight: 800, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 14px rgba(37,99,235,0.3)" },
};