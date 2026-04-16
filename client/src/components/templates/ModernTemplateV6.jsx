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

const ModernTemplateV6 = ({ data, themeColor = "#111827" }) => {
  const header = data?.header || {};
  const name = safe(header.name) || "Your Name";

  const accent = safe(themeColor) || "#111827";
  const accentSoft = hexToRgba(accent, 0.12);

  // Typography
  const bodyText = { margin: 0, color: "#374151", fontSize: 13.25, lineHeight: 1.7 };
  const metaText = { color: "#6b7280", fontSize: 12.5, lineHeight: 1.4 };

  // Card system (subtle shadow, print-friendly)
  const card = {
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 16,
    background: "#fff",
    boxShadow: "0 2px 10px rgba(17,24,39,0.04)",
  };

  const softCard = { ...card, background: "#fbfcfe" };

  const divider = { borderTop: "1px solid #eef2f7" };
  const row = { padding: "12px 0" };

  // Section heading system
  const sectionTitle = {
    fontWeight: 950,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#111827",
    marginBottom: 10,
    display: "flex",
    alignItems: "center",
    gap: 10,
  };

  const dot = {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: accent,
    boxShadow: `0 0 0 4px ${accentSoft}`,
    flex: "0 0 auto",
  };

  // Pills / chips
  const pill = {
    fontSize: 12,
    padding: "6px 10px",
    borderRadius: 999,
    background: "#fff",
    border: "1px solid #e5e7eb",
    color: "#111827",
    lineHeight: 1,
    display: "inline-flex",
    alignItems: "center",
    boxShadow: "0 1px 1px rgba(0,0,0,0.03)",
  };

  const linkStyle = {
    fontSize: 12.5,
    color: accent,
    textDecoration: "none",
    fontWeight: 900,
    borderBottom: `1px solid ${hexToRgba(accent, 0.35)}`,
    whiteSpace: "nowrap",
  };

  // ✅ Custom sections styling helpers
  const customSections = Array.isArray(data?.customSections) ? data.customSections : [];
  const customCount = customSections.length;

  const customCard = { ...card, padding: 0, overflow: "hidden" };

  const customHeader = {
    padding: "12px 14px",
    background: "#fbfcfe",
    borderBottom: "1px solid #eef2f7",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  };

  const customHeaderLeft = { display: "flex", alignItems: "center", gap: 10, minWidth: 0 };

  const customTitleText = {
    fontWeight: 950,
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: "#111827",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
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

  const customBody = { padding: 14, background: "#fff" };

  const safeWrap = { wordBreak: "break-word", overflowWrap: "anywhere" };

  const customSectionTitleStyleForBlock = {
    fontWeight: 950,
    fontSize: 12,
    color: "#111827",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    display: "flex",
    alignItems: "center",
    gap: 10,
  };

  const contactLine =
    [safe(header.email), safe(header.phone), safe(header.address)].filter(Boolean).join(" • ") ||
    "email@example.com • 000-000-0000 • City, Country";

  return (
    <div
      style={{
        width: "100%",
        overflow: "visible",
        boxSizing: "border-box",
        maxWidth: "100%",
        margin: "0 auto",
        color: "#111827",
        background: "#fff",
      }}
    >
      {/* Left color band header (refined) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "18px 1fr",
          gap: 0,
          borderRadius: 18,
          overflow: "hidden",
          border: "1px solid #e5e7eb",
          boxShadow: "0 2px 10px rgba(17,24,39,0.04)",
          background: "#fff",
        }}
      >
        <div style={{ background: accent }} />

        <div style={{ position: "relative", padding: 16 }}>
          {/* subtle accent wash */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(90deg, ${accentSoft} 0%, rgba(255,255,255,0) 60%)`,
              pointerEvents: "none",
            }}
          />
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 30, fontWeight: 950, letterSpacing: -0.3, lineHeight: 1.12 }}>{name}</div>
            <div style={{ marginTop: 8, ...bodyText }}>{contactLine}</div>
          </div>
        </div>
      </div>

      {/* Stack layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14, marginTop: 16 }}>
        {safe(data?.summary) && (
          <section style={card}>
            <div style={sectionTitle}>
              <span style={dot} /> Summary
            </div>
            <p style={bodyText}>{data.summary}</p>
          </section>
        )}

        {hasAny(data?.experience) && (
          <section style={card}>
            <div style={sectionTitle}>
              <span style={dot} /> Experience
            </div>

            {data.experience.map((x, i) => (
              <div key={i} style={{ ...row, ...(i === 0 ? null : divider) }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
                  <div style={{ fontWeight: 950, color: "#111827", minWidth: 0 }}>
                    {safe(x.role) || "Role"}
                    {safe(x.company) ? <span style={{ color: "#6b7280", fontWeight: 700 }}> • {x.company}</span> : null}
                  </div>
                  {safe(x.dateRange) ? <div style={{ ...metaText, whiteSpace: "nowrap" }}>{x.dateRange}</div> : null}
                </div>

                {hasAny(x.bullets) && (
                  <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 18, color: "#374151" }}>
                    {x.bullets
                      .filter(Boolean)
                      .slice(0, 5)
                      .map((b, idx) => (
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

        {/* 2-up block */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          {hasAny(data?.education) && (
            <section style={card}>
              <div style={sectionTitle}>
                <span style={dot} /> Education
              </div>

              {data.education.map((e, i) => (
                <div key={i} style={{ ...row, ...(i === 0 ? null : divider) }}>
                  <div style={{ fontWeight: 950, color: "#111827" }}>{safe(e.degree) || "Degree"}</div>
                  <div style={{ ...bodyText, marginTop: 4 }}>{safe(e.institution) || "Institution"}</div>
                  {safe(e.dateRange) && <div style={{ ...metaText, marginTop: 4 }}>{e.dateRange}</div>}
                </div>
              ))}
            </section>
          )}

          <section style={softCard}>
            {hasAny(data?.skills) && (
              <div style={{ marginBottom: 16 }}>
                <div style={sectionTitle}>
                  <span style={dot} /> Skills
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {data.skills.filter(Boolean).slice(0, 20).map((s, i) => (
                    <span key={i} style={pill}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {hasAny(data?.languages) && (
              <div style={{ marginBottom: 16 }}>
                <div style={sectionTitle}>
                  <span style={dot} /> Languages
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {data.languages.map((l, i) => (
                    <div key={i} style={{ color: "#374151" }}>
                      <div style={{ fontWeight: 950, color: "#111827" }}>{safe(l.name) || "Language"}</div>
                      {safe(l.level) ? <div style={metaText}>{l.level}</div> : null}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hasAny(data?.certifications) && (
              <div>
                <div style={sectionTitle}>
                  <span style={dot} /> Certifications
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {data.certifications.map((c, i) => (
                    <div key={i}>
                      <div style={{ fontWeight: 950, color: "#111827" }}>{safe(c.name) || "Certification"}</div>
                      <div style={metaText}>{[safe(c.issuer), safe(c.date)].filter(Boolean).join(" • ")}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>

        {hasAny(data?.projects) && (
          <section style={card}>
            <div style={sectionTitle}>
              <span style={dot} /> Projects
            </div>

            {data.projects.map((p, i) => (
              <div key={i} style={{ ...row, ...(i === 0 ? null : divider) }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <div style={{ fontWeight: 950, color: "#111827" }}>{safe(p.name) || "Project"}</div>
                  {safe(p.link) ? (
                    <a href={p.link} target="_blank" rel="noreferrer" style={linkStyle}>
                      View ↗
                    </a>
                  ) : null}
                </div>
                {safe(p.description) ? <div style={{ marginTop: 6, ...bodyText }}>{p.description}</div> : null}
              </div>
            ))}
          </section>
        )}

        {/* Custom Sections */}
        {customCount > 0 && (
          <section style={customCard}>
            <div style={customHeader}>
              <div style={customHeaderLeft}>
                <span style={dot} />
                <div style={customTitleText}>Additional Sections</div>
              </div>
              <span style={countChip}>
                {customCount} item{customCount === 1 ? "" : "s"}
              </span>
            </div>

            <div style={{ ...customBody, ...safeWrap }}>
              <CustomSectionsBlock customSections={customSections} themeColor={accent} titleStyle={customSectionTitleStyleForBlock} />
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ModernTemplateV6;
