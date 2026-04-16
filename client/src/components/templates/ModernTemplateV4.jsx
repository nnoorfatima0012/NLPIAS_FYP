import React from "react";
import CustomSectionsBlock from "./CustomSectionsBlock";

const hasAny = (arr) => Array.isArray(arr) && arr.length > 0;
const safe = (s) => (s ? String(s).trim() : "");

// small helper to create a soft accent background
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

const ModernTemplateV4 = ({ data, themeColor = "#111827" }) => {
  const header = data?.header || {};
  const name = safe(header.name) || "Your Name";

  const accent = safe(themeColor) || "#111827";
  const accentSoft = hexToRgba(accent, 0.12);

  // Base type scale
  const metaText = { color: "#6b7280", fontSize: 12.5, lineHeight: 1.4 };
  const bodyText = { color: "#374151", fontSize: 13.25, lineHeight: 1.7 };

  // Cards (consistent premium look)
  const card = {
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    background: "#fff",
    boxShadow: "0 2px 10px rgba(17,24,39,0.04)",
  };

  // Section heading system
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
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  };

  const sectionRule = {
    height: 1,
    background: "#eef2f7",
    marginTop: 10,
    marginBottom: 12,
  };

  // Badges (cleaner + modern)
  const badge = {
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

  // Timeline layout bits
  const railWrap = { display: "grid", gridTemplateColumns: "18px 1fr", gap: 12 };
  const rail = {
    position: "relative",
    width: 18,
    display: "flex",
    justifyContent: "center",
  };
  const railLine = {
    position: "absolute",
    top: 2,
    bottom: 2,
    width: 2,
    background: "#eef2f7",
    borderRadius: 999,
  };
  const railNode = (active = true) => ({
    width: 12,
    height: 12,
    borderRadius: 999,
    background: active ? accent : "#e5e7eb",
    border: "2px solid #fff",
    boxShadow: "0 0 0 1px #e5e7eb",
    marginTop: 2,
  });

  const contactItems = [safe(header.email), safe(header.phone), safe(header.address)].filter(Boolean);

  // Custom Sections wrapper
  const customSections = Array.isArray(data?.customSections) ? data.customSections : [];
  const customCount = customSections.length;
  const safeWrap = { wordBreak: "break-word", overflowWrap: "anywhere" };

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

  const customHeaderTitle = {
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

  const customTitleStyleForBlock = { ...sectionTitle, marginBottom: 8 };

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
      {/* Header */}
      <div style={{ ...card, overflow: "hidden", borderRadius: 18 }}>
        <div style={{ height: 8, background: accent }} />
        <div style={{ position: "relative", padding: 16 }}>
          {/* soft accent wash */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(90deg, ${accentSoft} 0%, rgba(255,255,255,0) 58%)`,
              pointerEvents: "none",
            }}
          />
          <div style={{ position: "relative" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "start" }}>
              <div>
                <div style={{ fontSize: 30, fontWeight: 950, lineHeight: 1.1, letterSpacing: -0.3 }}>{name}</div>
                <div style={{ marginTop: 8, ...bodyText }}>
                  {contactItems.length > 0 ? contactItems.join(" • ") : "email@example.com • 000-000-0000 • City, Country"}
                </div>
              </div>

              {/* Right tiny accent / brand chip */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 12, height: 42, borderRadius: 999, background: accent }} />
              </div>
            </div>

            {/* Quick chips row */}
            <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
              {hasAny(data?.skills) &&
                data.skills
                  .filter(Boolean)
                  .slice(0, 8)
                  .map((s, i) => (
                    <span key={i} style={{ ...badge, borderColor: hexToRgba(accent, 0.35) }}>
                      {s}
                    </span>
                  ))}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 290px", gap: 16, marginTop: 16 }}>
        {/* Main timeline */}
        <main style={{ ...card, padding: 16 }}>
          {/* Summary */}
          {safe(data?.summary) && (
            <section style={{ marginBottom: 16 }}>
              <div style={sectionTitle}>
                <span style={dot} /> Summary
              </div>
              <div style={sectionRule} />
              <p style={{ margin: 0, ...bodyText }}>{data.summary}</p>
            </section>
          )}

          {/* Experience */}
          {hasAny(data?.experience) && (
            <section style={{ marginBottom: 16 }}>
              <div style={sectionTitle}>
                <span style={dot} /> Experience
              </div>
              <div style={sectionRule} />

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {data.experience.map((x, i) => (
                  <div key={i} style={railWrap}>
                    <div style={rail}>
                      <div style={railLine} />
                      <div style={railNode(true)} />
                    </div>

                    <div style={{ paddingBottom: 2 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                        <div style={{ fontWeight: 950, color: "#111827" }}>
                          {safe(x.role) || "Role"}
                          {safe(x.company) ? <span style={{ color: "#6b7280", fontWeight: 700 }}> • {x.company}</span> : null}
                        </div>
                        {safe(x.dateRange) ? <div style={metaText}>{x.dateRange}</div> : null}
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
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Projects */}
          {hasAny(data?.projects) && (
            <section style={{ marginBottom: 16 }}>
              <div style={sectionTitle}>
                <span style={dot} /> Projects
              </div>
              <div style={sectionRule} />

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {data.projects.map((p, i) => (
                  <div key={i} style={railWrap}>
                    <div style={rail}>
                      <div style={railLine} />
                      <div style={railNode(true)} />
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                        <div style={{ fontWeight: 950, color: "#111827" }}>{safe(p.name) || "Project"}</div>
                        {safe(p.link) ? (
                          <a
                            href={p.link}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              fontSize: 12.5,
                              color: accent,
                              textDecoration: "none",
                              fontWeight: 900,
                              borderBottom: `1px solid ${hexToRgba(accent, 0.35)}`,
                              whiteSpace: "nowrap",
                            }}
                          >
                            View ↗
                          </a>
                        ) : null}
                      </div>

                      {safe(p.description) && <div style={{ marginTop: 6, ...bodyText }}>{p.description}</div>}

                      {hasAny(p.tech) && (
                        <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {p.tech
                            .filter(Boolean)
                            .slice(0, 12)
                            .map((t, ti) => (
                              <span key={ti} style={badge}>
                                {t}
                              </span>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Education */}
          {hasAny(data?.education) && (
            <section>
              <div style={sectionTitle}>
                <span style={dot} /> Education
              </div>
              <div style={sectionRule} />

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {data.education.map((e, i) => (
                  <div key={i} style={railWrap}>
                    <div style={rail}>
                      <div style={railLine} />
                      <div style={railNode(true)} />
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                        <div style={{ fontWeight: 950, color: "#111827" }}>{safe(e.degree) || "Degree"}</div>
                        {safe(e.dateRange) ? <div style={metaText}>{e.dateRange}</div> : null}
                      </div>
                      <div style={{ marginTop: 4, ...bodyText }}>{safe(e.institution) || "Institution"}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Custom Sections */}
          {customCount > 0 && (
            <section style={customCard}>
              <div style={customHeader}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <span style={dot} />
                  <div style={customHeaderTitle}>Additional Sections</div>
                </div>
                <span style={countChip}>
                  {customCount} item{customCount === 1 ? "" : "s"}
                </span>
              </div>

              <div style={{ ...customBody, ...safeWrap }}>
                <CustomSectionsBlock customSections={customSections} themeColor={accent} titleStyle={customTitleStyleForBlock} />
              </div>
            </section>
          )}
        </main>

        {/* Side panel */}
        <aside style={{ ...card, padding: 16, background: "#fbfcfe" }}>
          {/* Skills */}
          {hasAny(data?.skills) && (
            <section style={{ marginBottom: 16 }}>
              <div style={sectionTitle}>
                <span style={dot} /> Skills
              </div>
              <div style={sectionRule} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {data.skills.filter(Boolean).slice(0, 20).map((s, i) => (
                  <span key={i} style={badge}>
                    {s}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Languages */}
          {hasAny(data?.languages) && (
            <section style={{ marginBottom: 16 }}>
              <div style={sectionTitle}>
                <span style={dot} /> Languages
              </div>
              <div style={sectionRule} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {data.languages.map((l, i) => (
                  <div key={i} style={{ color: "#374151" }}>
                    <div style={{ fontWeight: 950, color: "#111827" }}>{safe(l.name) || "Language"}</div>
                    {safe(l.level) ? <div style={metaText}>{l.level}</div> : null}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Certifications */}
          {hasAny(data?.certifications) && (
            <section>
              <div style={sectionTitle}>
                <span style={dot} /> Certifications
              </div>
              <div style={sectionRule} />
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {data.certifications.map((c, i) => (
                  <div key={i}>
                    <div style={{ fontWeight: 950, color: "#111827" }}>{safe(c.name) || "Certification"}</div>
                    <div style={metaText}>{[safe(c.issuer), safe(c.date)].filter(Boolean).join(" • ")}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
};

export default ModernTemplateV4;
