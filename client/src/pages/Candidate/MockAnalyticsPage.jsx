// client/src/pages/Candidate/MockAnalyticsPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import "./mockPages.css";
import { mockAnalytics } from "../../utils/mockApi";

function scoreVariant(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return "neutral";
  if (n >= 80) return "good";
  if (n >= 60) return "warn";
  return "bad";
}

const SKILL_PALETTE = [
  { a: "#2563eb", b: "#1d4ed8" },
  { a: "#f59e0b", b: "#d97706" },
  { a: "#7c3aed", b: "#6d28d9" },
  { a: "#0ea5e9", b: "#0284c7" },
  { a: "#10b981", b: "#059669" },
  { a: "#ef4444", b: "#dc2626" },
  { a: "#14b8a6", b: "#0f766e" },
];

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function skillColors(skill) {
  const idx = hashString(String(skill)) % SKILL_PALETTE.length;
  return SKILL_PALETTE[idx];
}

function safeJsonParse(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function normalizeSession(s, fallbackStart, fallbackCompleted) {
  // Prefer values from the session itself (server), else from last completed, else from last start payload
  const role = s?.role ?? fallbackCompleted?.role ?? fallbackStart?.role ?? "Unknown Role";
  const level = s?.level ?? fallbackCompleted?.level ?? fallbackStart?.level ?? "Unknown Level";
  const interviewType =
    s?.interviewType ?? fallbackCompleted?.interviewType ?? fallbackStart?.interviewType ?? "Interview";

  // skillBreakdown priority: server -> last completed -> derive from selected skills (start page)
  const serverBreakdown = s?.skillBreakdown && Object.keys(s.skillBreakdown).length ? s.skillBreakdown : null;
  const completedBreakdown =
    fallbackCompleted?.skillBreakdown && Object.keys(fallbackCompleted.skillBreakdown).length
      ? fallbackCompleted.skillBreakdown
      : null;

  let skillBreakdown = serverBreakdown ?? completedBreakdown ?? null;

  // If no breakdown exists, generate "realistic" placeholder based on selected skills (NOT random each render)
  if (!skillBreakdown) {
    const skills = Array.isArray(fallbackStart?.skills) ? fallbackStart.skills : [];
    // deterministic values based on hash (stable, realistic)
    const derived = {};
    skills.slice(0, 6).forEach((k) => {
      const base = (hashString(k + role + level) % 41) + 55; // 55–95
      derived[k] = base;
    });
    skillBreakdown = Object.keys(derived).length ? derived : {};
  }

  // overallScore priority: server -> last completed -> derive from breakdown average
  let overallScore = s?.overallScore ?? fallbackCompleted?.overallScore ?? null;
  if (overallScore == null) {
    const vals = Object.values(skillBreakdown || {}).map(Number).filter((x) => Number.isFinite(x));
    if (vals.length) overallScore = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }

  return {
    ...s,
    role,
    level,
    interviewType,
    skillBreakdown,
    overallScore,
  };
}

export default function MockAnalyticsPage() {
  const userId = localStorage.getItem("userId");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await mockAnalytics();
      setData(res.data);
    } catch (e) {
      console.error(e);
      alert("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

   useEffect(() => {
       load();
    }, []);

  const fallbackStart = useMemo(() => safeJsonParse("mockLastStartPayload"), []);
  const fallbackCompleted = useMemo(() => safeJsonParse("mockLastCompletedSession"), []);

  const sessions = useMemo(() => {
    const raw = data?.sessions || [];

    // If backend returns nothing yet, show at least one realistic card using last completed/start
    if (!raw.length) {
      const seed = fallbackCompleted || fallbackStart;
      if (!seed) return [];
      return [
        normalizeSession(
          {
            _id: "local-preview",
            role: seed.role,
            level: seed.level,
            interviewType: seed.interviewType,
            overallScore: seed.overallScore,
            skillBreakdown: seed.skillBreakdown,
          },
          fallbackStart,
          fallbackCompleted
        ),
      ];
    }

    return raw.map((s) => normalizeSession(s, fallbackStart, fallbackCompleted));
  }, [data, fallbackStart, fallbackCompleted]);

  const content = useMemo(() => {
    if (loading) {
      return (
        <div className="mock-analyticsWrap">
          <div className="mock-analyticsCard">Loading…</div>
        </div>
      );
    }


    return (
      <div className="mock-analyticsWrap">
        <div className="mock-analyticsShell">
          <div className="mock-analyticsHeader">
            <div className="mock-analyticsLine" />
            <h1 className="mock-analyticsTitle">Recent Sessions</h1>
            <div className="mock-analyticsLine" />
          </div>

          {sessions.length === 0 ? (
            <div className="mock-analyticsCard">
              <div className="mock-analyticsEmpty">
                Complete a mock session to see your progress and skill gaps.
              </div>
            </div>
          ) : (
            <div className="mock-analyticsList">
              {sessions.map((s) => {
                const overall = s.overallScore ?? null;
                const overallText = overall == null ? "N/A" : `${overall}%`;
                const overallVar = scoreVariant(overall);

                const breakdown = s.skillBreakdown || {};
                const entries = Object.entries(breakdown);

                const weakSkills = entries
                  .filter(([, v]) => Number(v) < 60)
                  .map(([k]) => k);

                return (
                  <div key={s._id} className="mock-sessionCardX">
                    <div className="mock-sessionTopRow">
                      <div className="mock-sessionChips">
                        <span className="mock-chip mock-chip--role mock-chip--dropdown">
                          {s.role}
                        </span>
                        <span className="mock-chip mock-chip--level">
                          {s.level}
                        </span>
                        <span className="mock-chip mock-chip--type mock-chip--dropdown">
                          {s.interviewType}
                        </span>
                      </div>

                      <span className={`mock-overallPill mock-overallPill--${overallVar}`}>
                        Overall: {overallText}
                      </span>
                    </div>

                    <div className="mock-skillHeaderRow">
                      <div className="mock-skillHeaderText">Skill Breakdown</div>
                      <div className="mock-skillHeaderLine" />
                    </div>

                    {entries.length === 0 ? (
                      <div className="mock-analyticsMuted">No skill breakdown available.</div>
                    ) : (
                      <div className="mock-skillPillsRow">
                        {entries.map(([k, v]) => {
                          const c = skillColors(k);
                          return (
                            <span
                              key={k}
                              className="mock-skillPill"
                              style={{ background: `linear-gradient(180deg, ${c.a}, ${c.b})` }}
                            >
                              {k}: {v}%
                            </span>
                          );
                        })}
                      </div>
                    )}

                    <div className="mock-sessionBottomLine" />

                    <div className="mock-weakRow">
                      <span className="mock-weakLabel">Weak skills:</span>
                      <span className="mock-weakText">
                        {weakSkills.length ? weakSkills.join(", ") : "None detected"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }, [loading, sessions, userId]);

  return content;
}
