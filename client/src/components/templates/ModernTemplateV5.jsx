import React from "react";
import CustomSectionsBlock from "./CustomSectionsBlock";

const hasAny = (arr) => Array.isArray(arr) && arr.length > 0;
const safe = (s) => (s ? String(s).trim() : "");

// helper for soft accent effects
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

const ModernTemplateV5 = ({ data, themeColor = "#111827" }) => {
  const header = data?.header || {};
  const name = safe(header.name) || "Your Name";

  const accent = safe(themeColor) || "#111827";
  const accentSoft = hexToRgba(accent, 0.12);

  // type scale
  const bodyText = { color: "#374151", fontSize: 13.25, lineHeight: 1.7 };
  const metaText = { color: "#6b7280", fontSize: 12.5, lineHeight: 1.4 };

  // premium cards (print-friendly subtle shadow)
  const card = {
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    padding: 16,
    background: "#fff",
    boxShadow: "0 2px 10px rgba(17,24,39,0.04)",
  };

  const softCard = {
    ...card,
    background: "#fbfcfe",
  };

  const dot = {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: accent,
    boxShadow: `0 0 0 4px ${accentSoft}`,
    flex: "0 0 auto",
  };

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

  const sectionRule = {
    height: 1,
    background: "#eef2f7",
    marginTop: 10,
    marginBottom: 12,
  };

  const row = { padding: "12px 0" };
  const rowDivider = { borderTop: "1px solid #eef2f7" };

  const pill = {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: 999,
    background: "#fff",
    border: "1px solid #e5e7eb",
    fontSize: 12,
    color: "#111827",
    lineHeight: 1,
    boxShadow: "0 1px 1px rgba(0,0,0,0.03)",
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

  // Prevent long custom content (URLs, long words) from breaking layout
  const safeWrap = { wordBreak: "break-word", overflowWrap: "anywhere" };

  // Give CustomSectionsBlock a title style that matches this template better
  const customSectionTitleStyleForBlock = {
    fontWeight: 950,
    fontSize: 12,
    color: "#111827",
    marginBottom: 8,
    display: "flex",
    alignItems: "center",
    gap: 10,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  };

  return (
    <div
      style={{
        width: "100%",
        overflow: "visible",
        boxSizing: "border-box",
        maxWidth: "100%",
        margin: "0 auto",
        background: "#fff",
        color: "#111827",
      }}
    >
      {/* Minimal header (refined) */}
      <div style={{ ...card, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", padding: 16 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 30, fontWeight: 950, lineHeight: 1.1, letterSpacing: -0.3 }}>{name}</div>
          <div style={{ marginTop: 8, ...bodyText }}>
            {[safe(header.email), safe(header.phone), safe(header.address)].filter(Boolean).join(" • ") ||
              "email@example.com • 000-000-0000 • City, Country"}
          </div>
        </div>

        {/* slim accent pill */}
        <div style={{ width: 12, height: 64, borderRadius: 999, background: accent, boxShadow: `0 6px 16px ${hexToRgba(accent, 0.25)}` }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 16, marginTop: 16 }}>
        {/* Main */}
        <main style={card}>
          {safe(data?.summary) && (
            <section style={{ marginBottom: 16 }}>
              <div style={sectionTitle}>
                <span style={dot} /> Summary
              </div>
              <div style={sectionRule} />
              <p style={{ margin: 0, ...bodyText }}>{data.summary}</p>
            </section>
          )}

          {hasAny(data?.experience) && (
            <section style={{ marginBottom: 16 }}>
              <div style={sectionTitle}>
                <span style={dot} /> Experience
              </div>
              <div style={sectionRule} />

              {data.experience.map((x, i) => (
                <div key={i} style={{ ...row, ...(i === 0 ? null : rowDivider) }}>
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

          {hasAny(data?.projects) && (
            <section style={{ marginBottom: 16 }}>
              <div style={sectionTitle}>
                <span style={dot} /> Projects
              </div>
              <div style={sectionRule} />

              {data.projects.map((p, i) => (
                <div key={i} style={{ ...row, ...(i === 0 ? null : rowDivider) }}>
                  <div style={{ fontWeight: 950, color: "#111827" }}>{safe(p.name) || "Project"}</div>
                  {safe(p.description) && <div style={{ marginTop: 6, ...bodyText }}>{p.description}</div>}
                  {hasAny(p.tech) && (
                    <div style={{ ...metaText, marginTop: 8 }}>
                      {p.tech.filter(Boolean).join(", ")}
                    </div>
                  )}
                </div>
              ))}
            </section>
          )}

          {hasAny(data?.education) && (
            <section style={{ marginBottom: 16 }}>
              <div style={sectionTitle}>
                <span style={dot} /> Education
              </div>
              <div style={sectionRule} />

              {data.education.map((e, i) => (
                <div key={i} style={{ ...row, ...(i === 0 ? null : rowDivider) }}>
                  <div style={{ fontWeight: 950, color: "#111827" }}>{safe(e.degree) || "Degree"}</div>
                  <div style={{ marginTop: 4, ...bodyText }}>{safe(e.institution) || "Institution"}</div>
                  {safe(e.dateRange) && <div style={{ marginTop: 4, ...metaText }}>{e.dateRange}</div>}
                </div>
              ))}
            </section>
          )}

          {/* ✅ Custom Sections */}
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
        </main>

        {/* Right rail */}
        <aside style={softCard}>
          {hasAny(data?.skills) && (
            <section style={{ marginBottom: 16 }}>
              <div style={sectionTitle}>
                <span style={dot} /> Skills
              </div>
              <div style={sectionRule} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {data.skills.filter(Boolean).slice(0, 20).map((s, i) => (
                  <span key={i} style={pill}>
                    {s}
                  </span>
                ))}
              </div>
            </section>
          )}

          {hasAny(data?.languages) && (
            <section style={{ marginBottom: 16 }}>
              <div style={sectionTitle}>
                <span style={dot} /> Languages
              </div>
              <div style={sectionRule} />
              {data.languages.map((l, i) => (
                <div key={i} style={{ marginBottom: 8, color: "#374151" }}>
                  <div style={{ fontWeight: 950, color: "#111827" }}>{safe(l.name) || "Language"}</div>
                  {safe(l.level) ? <div style={metaText}>{l.level}</div> : null}
                </div>
              ))}
            </section>
          )}

          {hasAny(data?.certifications) && (
            <section>
              <div style={sectionTitle}>
                <span style={dot} /> Certifications
              </div>
              <div style={sectionRule} />
              {data.certifications.map((c, i) => (
                <div key={i} style={{ marginBottom: 12 }}>
                  <div style={{ fontWeight: 950, color: "#111827" }}>{safe(c.name) || "Certification"}</div>
                  <div style={metaText}>{[safe(c.issuer), safe(c.date)].filter(Boolean).join(" • ")}</div>
                </div>
              ))}
            </section>
          )}
        </aside>
      </div>
    </div>
  );
};

export default ModernTemplateV5;
