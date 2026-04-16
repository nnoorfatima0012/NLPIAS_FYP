import React from "react";
import CustomSectionsBlock from "./CustomSectionsBlock";

const hasAny = (arr) => Array.isArray(arr) && arr.length > 0;
const safe = (s) => (s ? String(s).trim() : "");

const hexToRgba = (hex, alpha = 0.12) => {
  const h = safe(hex).replace("#", "");
  if (![3, 6].includes(h.length)) return `rgba(0,0,0,${alpha})`;
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const int = parseInt(full, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r},${g},${b},${alpha})`;
};

const ModernTemplate = ({ data, themeColor = "#111827" }) => {
  const header = data?.header || {};
  const name = safe(header.name) || "Your Name";

  const accent = safe(themeColor) || "#111827";
  const accentSoft = hexToRgba(accent, 0.12);

  // 🔹 shared atoms
  const dot = {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: accent,
    boxShadow: `0 0 0 4px ${hexToRgba(accent, 0.12)}`,
    flex: "0 0 auto",
  };

  const sectionTitleStyle = {
    fontWeight: 900,
    marginBottom: 10,
    color: "#111827",
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 13,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  };

  const pill = {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#fff",
    fontSize: 12,
    color: "#111827",
    lineHeight: 1,
    boxShadow: "0 1px 1px rgba(0,0,0,0.03)",
  };

  const card = {
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    background: "#fff",
    boxShadow: "0 2px 10px rgba(17,24,39,0.04)",
  };

  const softCard = {
    ...card,
    background: "#fbfcfe",
  };

  const divider = { borderTop: "1px solid #eef2f7" };

  const row = {
    padding: "12px 0",
  };

  // ✅ custom sections (kept)
  const customSections = Array.isArray(data?.customSections) ? data.customSections : [];
  const customCount = customSections.length;

  const customShell = {
    marginTop: 16,
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    overflow: "hidden",
    background: "#fff",
    boxShadow: "0 2px 10px rgba(17,24,39,0.04)",
  };

  const customHeader = {
    padding: "12px 14px",
    background: "#fbfcfe",
    borderBottom: "1px solid #eef2f7",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  };

  const countChip = {
    fontSize: 12,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#fff",
    color: "#374151",
    whiteSpace: "nowrap",
  };

  const customBody = {
    padding: 14,
    background: "#fff",
    wordBreak: "break-word",
    overflowWrap: "anywhere",
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "100%",
        margin: "0 auto",
        color: "#111827",
        background: "#ffffff",
        boxSizing: "border-box",
      }}
    >
      {/* Premium header */}
      <div
        style={{
          position: "relative",
          padding: 18,
          borderRadius: 18,
          marginBottom: 16,
          color: "#fff",
          background: `linear-gradient(135deg, ${accent} 100%)`,
          overflow: "hidden",
          boxShadow: "0 10px 24px rgba(17,24,39,0.12)",
        }}
      >
        {/* subtle decorative glow */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            right: -80,
            top: -80,
            width: 220,
            height: 220,
            borderRadius: 999,
            background: accentSoft,
            filter: "blur(2px)",
          }}
        />
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: -0.3 }}>{name}</div>
          <div style={{ marginTop: 8, color: "rgba(255,255,255,0.92)", fontSize: 13.5, lineHeight: 1.45 }}>
            {[safe(header.email), safe(header.phone), safe(header.address)].filter(Boolean).join(" • ") ||
              "email@example.com • 000-000-0000 • City, Country"}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 16 }}>
        {/* Sidebar */}
        <aside style={{ ...softCard, padding: 14 }}>
          {hasAny(data?.skills) && (
            <div style={{ marginBottom: 16 }}>
              <div style={sectionTitleStyle}>
                <span style={dot} /> Skills
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {data.skills.filter(Boolean).map((s, i) => (
                  <span key={i} style={pill}>
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}

          {hasAny(data?.languages) && (
            <div style={{ marginBottom: 16 }}>
              <div style={sectionTitleStyle}>
                <span style={dot} /> Languages
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, color: "#374151" }}>
                {data.languages.map((l, i) => (
                  <div
                    key={i}
                    style={{
                      paddingTop: i === 0 ? 0 : 10,
                      ...(i === 0 ? null : divider),
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                      <strong style={{ fontWeight: 800 }}>{safe(l.name) || "Language"}</strong>
                      {safe(l.level) ? <span style={{ color: "#6b7280", fontSize: 12.5 }}>{l.level}</span> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasAny(data?.certifications) && (
            <div>
              <div style={sectionTitleStyle}>
                <span style={dot} /> Certifications
              </div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {data.certifications.map((c, i) => (
                  <div
                    key={i}
                    style={{
                      paddingTop: i === 0 ? 0 : 12,
                      ...(i === 0 ? null : divider),
                    }}
                  >
                    <div style={{ color: "#111827", fontWeight: 850 }}>
                      {safe(c.name) || "Certification"}
                    </div>
                    <div style={{ color: "#6b7280", fontSize: 12.5, marginTop: 4 }}>
                      {[safe(c.issuer), safe(c.date)].filter(Boolean).join(" • ")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Main */}
        <main style={{ ...card, padding: 16 }}>
          {safe(data?.summary) && (
            <section style={{ marginBottom: 16 }}>
              <div style={sectionTitleStyle}>
                <span style={dot} /> Summary
              </div>
              <p style={{ margin: 0, lineHeight: 1.7, color: "#374151", fontSize: 13.5 }}>
                {data.summary}
              </p>
            </section>
          )}

          {hasAny(data?.experience) && (
            <section style={{ marginBottom: 16 }}>
              <div style={sectionTitleStyle}>
                <span style={dot} /> Experience
              </div>

              {data.experience.map((x, i) => (
                <div key={i} style={{ ...row, ...(i === 0 ? null : divider) }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 850, color: "#111827" }}>
                        {safe(x.role) || "Role"}
                        {safe(x.company) ? <span style={{ color: "#6b7280", fontWeight: 700 }}> • {x.company}</span> : null}
                      </div>
                    </div>
                    {safe(x.dateRange) && (
                      <div style={{ color: "#6b7280", fontSize: 12.5, whiteSpace: "nowrap" }}>{x.dateRange}</div>
                    )}
                  </div>

                  {hasAny(x.bullets) && (
                    <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 18, color: "#374151" }}>
                      {x.bullets.map((b, idx) => (
                        <li key={idx} style={{ lineHeight: 1.65, margin: "4px 0", fontSize: 13.25 }}>
                          {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </section>
          )}

          {hasAny(data?.projects) && (
            <section style={{ marginBottom: 16 }}>
              <div style={sectionTitleStyle}>
                <span style={dot} /> Projects
              </div>

              {data.projects.map((p, i) => (
                <div key={i} style={{ ...row, ...(i === 0 ? null : divider) }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ fontWeight: 850, color: "#111827", minWidth: 0 }}>
                      {safe(p.name) || "Project"}
                    </div>
                    {safe(p.link) ? (
                      <a
                        href={p.link}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: 12.5,
                          color: accent,
                          textDecoration: "none",
                          borderBottom: `1px solid ${hexToRgba(accent, 0.35)}`,
                          whiteSpace: "nowrap",
                        }}
                      >
                        View ↗
                      </a>
                    ) : null}
                  </div>

                  {safe(p.description) && (
                    <div style={{ color: "#374151", marginTop: 6, lineHeight: 1.65, fontSize: 13.25 }}>
                      {p.description}
                    </div>
                  )}

                  {hasAny(p.tech) && (
                    <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {p.tech.filter(Boolean).map((t, ti) => (
                        <span key={ti} style={pill}>
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </section>
          )}

          {hasAny(data?.education) && (
            <section>
              <div style={sectionTitleStyle}>
                <span style={dot} /> Education
              </div>

              {data.education.map((e, i) => (
                <div key={i} style={{ ...row, ...(i === 0 ? null : divider) }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
                    <div style={{ fontWeight: 850, color: "#111827" }}>{safe(e.degree) || "Degree"}</div>
                    {safe(e.dateRange) && (
                      <div style={{ color: "#6b7280", fontSize: 12.5, whiteSpace: "nowrap" }}>{e.dateRange}</div>
                    )}
                  </div>
                  <div style={{ color: "#374151", marginTop: 4, fontSize: 13.25 }}>
                    {safe(e.institution) || "Institution"}
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* ✅ Custom Sections (same logic, improved container) */}
          {customCount > 0 && (
            <section style={customShell}>
              <div style={customHeader}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <span style={dot} />
                  <div
                    style={{
                      fontWeight: 900,
                      fontSize: 12,
                      letterSpacing: 0.8,
                      textTransform: "uppercase",
                      color: "#111827",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    Additional Sections
                  </div>
                </div>
                <span style={countChip}>
                  {customCount} item{customCount === 1 ? "" : "s"}
                </span>
              </div>

              <div style={customBody}>
                <CustomSectionsBlock
                  customSections={customSections}
                  themeColor={accent}
                  titleStyle={sectionTitleStyle}
                />
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
};

export default ModernTemplate;
