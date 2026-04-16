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

const ModernTemplateV3 = ({ data, themeColor = "#111827" }) => {
  const header = data?.header || {};
  const name = safe(header.name) || "Your Name";

  const accent = safe(themeColor) || "#111827";
  const accentSoft = hexToRgba(accent, 0.12);

  const page = {
    width: "100%",
    overflow: "visible",
    boxSizing: "border-box",
    maxWidth: "100%",
    margin: "0 auto",
    color: "#111827",
    background: "#fff",
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
  const row = { padding: "12px 0" };

  const dot = {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: accent,
    boxShadow: `0 0 0 4px ${accentSoft}`,
    flex: "0 0 auto",
  };

  // Section headings: neutral text + accent dot (more premium than all-accent text)
  const sectionTitle = {
    fontWeight: 950,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    fontSize: 12,
    color: "#111827",
    marginBottom: 10,
    display: "flex",
    alignItems: "center",
    gap: 10,
  };

  const bodyText = { color: "#374151", lineHeight: 1.7, fontSize: 13.25 };
  const metaText = { color: "#6b7280", fontSize: 12.5 };

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

  const safeWrap = { wordBreak: "break-word", overflowWrap: "anywhere" };

  // ✅ Custom sections
  const customSections = Array.isArray(data?.customSections) ? data.customSections : [];
  const customCount = customSections.length;

  const customCard = {
    ...card,
    marginTop: 16,
    overflow: "hidden",
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

  const customBody = { padding: 14, background: "#fff" };

  return (
    <div style={page}>
      {/* Header - refined card + thin accent bar + subtle accent wash */}
      <div style={{ ...card, borderRadius: 18, overflow: "hidden" }}>
        <div style={{ height: 10, background: accent }} />
        <div style={{ position: "relative", padding: 16 }}>
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(90deg, ${accentSoft} 0%, rgba(255,255,255,0) 55%)`,
              pointerEvents: "none",
            }}
          />
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 30, fontWeight: 950, letterSpacing: -0.3, lineHeight: 1.12 }}>{name}</div>
            <div style={{ marginTop: 8, ...bodyText }}>
              {[safe(header.email), safe(header.phone), safe(header.address)].filter(Boolean).join(" • ") ||
                "email@example.com • 000-000-0000 • City, Country"}
            </div>
          </div>
        </div>
      </div>

      {/* 2-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        {/* Left column */}
        <div style={{ ...card, padding: 16 }}>
          {safe(data?.summary) && (
            <section style={{ marginBottom: 16 }}>
              <div style={sectionTitle}>
                <span style={dot} /> Summary
              </div>
              <p style={{ margin: 0, ...bodyText }}>{data.summary}</p>
            </section>
          )}

          {hasAny(data?.experience) && (
            <section>
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
        </div>

        {/* Right column */}
        <div style={{ ...softCard, padding: 16 }}>
          {hasAny(data?.skills) && (
            <section style={{ marginBottom: 16 }}>
              <div style={sectionTitle}>
                <span style={dot} /> Skills
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {data.skills
                  .filter(Boolean)
                  .slice(0, 20)
                  .map((s, i) => (
                    <span key={i} style={pill}>
                      {s}
                    </span>
                  ))}
              </div>
            </section>
          )}

          {hasAny(data?.education) && (
            <section style={{ marginBottom: 16 }}>
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

          {hasAny(data?.projects) && (
            <section style={{ marginBottom: 16 }}>
              <div style={sectionTitle}>
                <span style={dot} /> Projects
              </div>

              {data.projects.map((p, i) => (
                <div key={i} style={{ ...row, ...(i === 0 ? null : divider) }}>
                  <div style={{ fontWeight: 950, color: "#111827" }}>{safe(p.name) || "Project"}</div>
                  {safe(p.description) && <div style={{ ...bodyText, marginTop: 6 }}>{p.description}</div>}
                  {hasAny(p.tech) && (
                    <div style={{ ...metaText, marginTop: 6 }}>
                      <span style={{ fontWeight: 800, color: "#374151" }}>Tech:</span>{" "}
                      {p.tech.filter(Boolean).join(", ")}
                    </div>
                  )}
                </div>
              ))}
            </section>
          )}

          {hasAny(data?.languages) && (
            <section style={{ marginBottom: 16 }}>
              <div style={sectionTitle}>
                <span style={dot} /> Languages
              </div>

              {data.languages.map((l, i) => (
                <div key={i} style={{ paddingTop: i === 0 ? 0 : 10, ...(i === 0 ? null : divider) }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <strong style={{ fontWeight: 900 }}>{safe(l.name) || "Language"}</strong>
                    {safe(l.level) ? <span style={metaText}>{l.level}</span> : null}
                  </div>
                </div>
              ))}
            </section>
          )}

          {hasAny(data?.certifications) && (
            <section>
              <div style={sectionTitle}>
                <span style={dot} /> Certifications
              </div>

              {data.certifications.map((c, i) => (
                <div key={i} style={{ paddingTop: i === 0 ? 0 : 12, ...(i === 0 ? null : divider) }}>
                  <div style={{ fontWeight: 950, color: "#111827" }}>{safe(c.name) || "Certification"}</div>
                  <div style={{ ...metaText, marginTop: 4 }}>
                    {[safe(c.issuer), safe(c.date)].filter(Boolean).join(" • ")}
                  </div>
                </div>
              ))}
            </section>
          )}
        </div>
      </div>

      {/* Custom Sections */}
      {customCount > 0 && (
        <section style={customCard}>
          <div style={customHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <span style={dot} />
              <div
                style={{
                  fontWeight: 950,
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

          <div style={{ ...customBody, ...safeWrap }}>
            <CustomSectionsBlock customSections={customSections} themeColor={accent} titleStyle={sectionTitle} />
          </div>
        </section>
      )}
    </div>
  );
};

export default ModernTemplateV3;
