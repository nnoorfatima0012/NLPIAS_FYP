// client/src/pages/Candidate/MockStartPage.jsx
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./mockPages.css";
import { mockStart } from "../../utils/mockApi";

const ROLE_SKILLS = {
  "Frontend Developer": ["HTML", "CSS", "JavaScript", "React", "Performance Optimization"],
  "Backend Developer": ["Node.js", "Express", "REST API", "Databases", "Authentication"],
  "Full Stack Developer": ["JavaScript", "React", "Node.js", "REST API", "Databases"],
  "Mobile App Developer": ["React Native", "Android", "iOS", "APIs", "State Management"],
  "Data Analyst": ["SQL", "Python", "Power BI", "Statistics", "Excel"],
};

const LEVELS = ["Junior (0–2 years)", "Mid-Level (2–5 years)", "Senior (5+ years)"];
const TYPES = ["Technical", "HR / Behavioral", "Mixed", "System Design"];
const DIFFICULTIES = ["Easy", "Medium", "Hard", "Adaptive"];

function Panel({ icon, title, children, className = "" }) {
  return (
    <section className={`mock-panel ${className}`}>
      <div className="mock-panelHead">
        <div className="mock-icon">{icon}</div>
        <h3 className="mock-panelTitle">{title}</h3>
      </div>
      <div className="mock-panelBody">{children}</div>
    </section>
  );
}

function RadioRow({ name, value, selected, onChange, label }) {
  return (
    <label className={`mock-radioRow ${selected ? "is-on" : ""}`}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={selected}
        onChange={() => onChange(value)}
      />
      <span className="mock-radioDot" aria-hidden="true" />
      <span className="mock-radioLabel">{label}</span>
    </label>
  );
}

function CheckRow({ checked, onChange, label }) {
  return (
    <label className="mock-checkRow">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="mock-checkBox" aria-hidden="true" />
      <span className="mock-checkLabel">{label}</span>
    </label>
  );
}

export default function MockStartPage() {
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const [role, setRole] = useState("Frontend Developer");
  const [customRole, setCustomRole] = useState("");

  const [level, setLevel] = useState("Junior (0–2 years)");
  const [interviewType, setInterviewType] = useState("Technical");
  const [difficulty, setDifficulty] = useState("Medium");
  const [mode, setMode] = useState("text");

  const suggestedSkills = useMemo(() => {
    return role === "Custom" ? [] : (ROLE_SKILLS[role] || []);
  }, [role]);

  const [skills, setSkills] = useState([]);

  const effectiveRole = role === "Custom" ? customRole.trim() : role;

  const toggleSkill = (s) => {
    setSkills((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const selectAll = () => setSkills(suggestedSkills);
  const clearAll = () => setSkills([]);

  const canStart =
    !!effectiveRole &&
    !!level &&
    !!interviewType &&
    !!difficulty &&
    !!mode;

  const onStart = async () => {
    if (!canStart) return;

    const payload = {
      role: effectiveRole,
      level,
      interviewType,
      skills,
      difficulty,
      mode,
    };
    localStorage.setItem("mockLastStartPayload", JSON.stringify(payload));

    const res = await mockStart(payload);
    const sessionId = res.data?.sessionId;

    if (!sessionId) {
      alert("Failed to start session.");
      return;
    }

    navigate(`/candidate/mock-interview/session/${sessionId}`);
  };
    const onViewAnalytics = () => {
    navigate("/candidate/mock-interview/analytics");
  };

  return (
    <div className="mock-page">

      <div className="mock-shell">
        {/* Top row panels */}
        <div className="mock-gridTop">
          <Panel icon="🎯" title="Target Job Role">
            <div className="mock-field">
              <div className="mock-fieldLabel">Select Role:</div>
              <select
                className="mock-select"
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  setSkills([]);
                }}
              >
                <option>Frontend Developer</option>
                <option>Backend Developer</option>
                <option>Full Stack Developer</option>
                <option>Mobile App Developer</option>
                <option>Data Analyst</option>
                <option value="Custom">Custom (User types)</option>
              </select>

              {role === "Custom" && (
                <div className="mock-field" style={{ marginTop: 10 }}>
                  <div className="mock-fieldLabel">Custom Role</div>
                  <input
                    className="mock-input"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    placeholder="e.g., QA Engineer"
                  />
                </div>
              )}
            </div>
          </Panel>

          <Panel icon="🎓" title="Experience Level">
            <div className="mock-radioGroup">
              {LEVELS.map((l) => (
                <RadioRow
                  key={l}
                  name="level"
                  value={l}
                  label={l}
                  selected={level === l}
                  onChange={setLevel}
                />
              ))}
            </div>
          </Panel>

          <Panel icon="🧠" title="Interview Type">
            <div className="mock-radioGroup">
              {TYPES.map((t) => (
                <RadioRow
                  key={t}
                  name="type"
                  value={t}
                  label={t}
                  selected={interviewType === t}
                  onChange={setInterviewType}
                />
              ))}
            </div>
          </Panel>

          <Panel icon="📊" title="Difficulty Level">
            <div className="mock-radioGroup">
              {DIFFICULTIES.map((d) => (
                <RadioRow
                  key={d}
                  name="difficulty"
                  value={d}
                  label={d}
                  selected={difficulty === d}
                  onChange={setDifficulty}
                />
              ))}
            </div>
          </Panel>
        </div>

        {/* Bottom row: skills + mode */}
        <div className="mock-gridBottom">
          <Panel icon="⚙️" title="Skills Focus (Optional)" className="span-2">
            {suggestedSkills.length === 0 ? (
              <div className="mock-mutedNote">
                Skills autosuggest will appear for predefined roles.
              </div>
            ) : (
              <>
                <div className="mock-skillTop">
                  <button type="button" className="mock-miniBtn" onClick={selectAll}>
                    Select All
                  </button>
                  <button type="button" className="mock-miniBtn" onClick={clearAll}>
                    Clear
                  </button>
                </div>

                <div className="mock-skillGrid">
                  {suggestedSkills.map((s) => (
                    <CheckRow
                      key={s}
                      label={s}
                      checked={skills.includes(s)}
                      onChange={() => toggleSkill(s)}
                    />
                  ))}
                </div>
              </>
            )}
          </Panel>

          <Panel icon="🎤" title="Interview Mode">
            <div className="mock-radioGroup">
              <RadioRow
                name="mode"
                value="text"
                label="Text-Based"
                selected={mode === "text"}
                onChange={setMode}
              />
              <RadioRow
                name="mode"
                value="voice"
                label="Voice-Based"
                selected={mode === "voice"}
                onChange={setMode}
              />
            </div>
          </Panel>
        </div>

        {/* Big centered CTA like the screenshot */}
        <div className="mock-cta">

          <button
            type="button"
            className="mock-startBtn"
            disabled={!canStart}
            onClick={onStart}
          >
            Start Mock Interview
          </button>
                    <button
            type="button"
            className="mock-secondaryBtn"
            onClick={onViewAnalytics}
          >
            View Previous Sessions Analytics
          </button>
        </div>
      </div>
    </div>
  );
}
