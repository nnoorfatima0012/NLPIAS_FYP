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

const ModernTemplateV8 = ({ data, themeColor = "#111827" }) => {
  const header = data?.header || {};
  const name = safe(header.name) || "Your Name";

  const accent = safe(themeColor) || "#111827";
  const accentSoft = hexToRgba(accent, 0.12);

  // Typography
  const body = { color: "#374151", fontSize: 13.25, lineHeight: 1.7 };
  const meta = { color: "#6b7280", fontSize: 12.5, lineHeight: 1.4 };

  // Card system (premium, print-friendly)
  const card = {
    border: "1px solid #e5e7eb",
    borderRadius: 16,
    background: "#fff",
    boxShadow: "0 2px 10px rgba(17,24,39,0.04)",
  };

  const softCard = { ...card, background: "#fbfcfe" };

  const pad = { padding: 16 };

  const title = {
    fontWeight: 950,
    fontSize: 12,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    color: "#111827",
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  };

  const rule = {
    height: 1,
    background: "#eef2f7",
    marginTop: 10,
    marginBottom: 12,
  };

  const dot = {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: accent,
    boxShadow: `0 0 0 4px ${accentSoft}`,
    flex: "0 0 auto",
  };

  const rowDivider = { borderTop: "1px solid #eef2f7" };
  const row = { padding: "12px 0" };

  const chip = {
    fontSize: 12,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#fff",
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

  // ✅ Custom section styles
  const customSections = Array.isArray(data?.customSections) ? data.customSections : [];
  const customCount = customSections.length;

  const customCard = { ...card, marginTop: 16, overflow: "hidden" };

  const customHeader = {
    padding: "12px 14px",
    background: "#fbfcfe",
    borderBottom: "1px solid #eef2f7",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  };

  const customTitle = { ...title, marginBottom: 0 };

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

  const customSafeWrap = { wordBreak: "break-word", overflowWrap: "anywhere" };

  const customTitleStyleForBlock = { ...title, marginBottom: 8 };

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
      {/* Header (refined) */}
      <div style={{ ...card, overflow: "hidden", borderRadius: 18 }}>
        <div style={{ height: 8, background: accent }} />
        <div style={{ position: "relative", padding: 16 }}>
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "start" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 30, fontWeight: 950, lineHeight: 1.1, letterSpacing: -0.3 }}>{name}</div>
                <div style={{ marginTop: 8, ...body }}>
                  {[safe(header.email), safe(header.phone), safe(header.address)].filter(Boolean).join(" • ") ||
                    "email@example.com • 000-000-0000 • City, Country"}
                </div>
              </div>
              <div
                style={{
                  width: 12,
                  height: 54,
                  borderRadius: 999,
                  background: accent,
                  boxShadow: `0 6px 16px ${hexToRgba(accent, 0.22)}`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3-column body */}
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr 240px", gap: 16, marginTop: 16 }}>
        {/* Left column */}
        <aside style={{ ...softCard, ...pad }}>
          {hasAny(data?.languages) && (
            <section style={{ marginBottom: 16 }}>
              <div style={title}>
                <span style={dot} /> Languages
              </div>
              <div style={rule} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {data.languages.map((l, i) => (
                  <div key={i}>
                    <div style={{ fontWeight: 950, color: "#111827" }}>{safe(l.name) || "Language"}</div>
                    {safe(l.level) ? <div style={meta}>{l.level}</div> : null}
                  </div>
                ))}
              </div>
            </section>
          )}

          {hasAny(data?.certifications) && (
            <section>
              <div style={title}>
                <span style={dot} /> Certifications
              </div>
              <div style={rule} />
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {data.certifications.map((c, i) => (
                  <div key={i}>
                    <div style={{ fontWeight: 950, color: "#111827" }}>{safe(c.name) || "Certification"}</div>
                    <div style={meta}>{[safe(c.issuer), safe(c.date)].filter(Boolean).join(" • ")}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </aside>

        {/* Middle column */}
        <main style={{ ...card, ...pad }}>
          {safe(data?.summary) && (
            <section style={{ marginBottom: 16 }}>
              <div style={title}>
                <span style={dot} /> Summary
              </div>
              <div style={rule} />
              <p style={{ margin: 0, ...body }}>{data.summary}</p>
            </section>
          )}

          {hasAny(data?.experience) && (
            <section style={{ marginBottom: 16 }}>
              <div style={title}>
                <span style={dot} /> Experience
              </div>
              <div style={rule} />

              {data.experience.map((x, i) => (
                <div key={i} style={{ ...row, ...(i === 0 ? null : rowDivider) }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "baseline" }}>
                    <div style={{ fontWeight: 950, color: "#111827", minWidth: 0 }}>
                      {safe(x.role) || "Role"}
                      {safe(x.company) ? <span style={{ color: "#6b7280", fontWeight: 700 }}> • {x.company}</span> : null}
                    </div>
                    {safe(x.dateRange) ? <div style={{ ...meta, whiteSpace: "nowrap" }}>{x.dateRange}</div> : null}
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
            <section>
              <div style={title}>
                <span style={dot} /> Projects
              </div>
              <div style={rule} />

              {data.projects.map((p, i) => (
                <div key={i} style={{ ...row, ...(i === 0 ? null : rowDivider) }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <div style={{ fontWeight: 950, color: "#111827" }}>{safe(p.name) || "Project"}</div>
                    {safe(p.link) ? (
                      <a href={p.link} target="_blank" rel="noreferrer" style={linkStyle}>
                        View ↗
                      </a>
                    ) : null}
                  </div>

                  {safe(p.description) ? <div style={{ marginTop: 6, ...body }}>{p.description}</div> : null}

                  {hasAny(p.tech) ? (
                    <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {p.tech.filter(Boolean).slice(0, 12).map((t, ti) => (
                        <span key={ti} style={chip}>
                          {t}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </section>
          )}
        </main>

        {/* Right column */}
        <aside style={{ ...softCard, ...pad }}>
          {hasAny(data?.skills) && (
            <section style={{ marginBottom: 16 }}>
              <div style={title}>
                <span style={dot} /> Skills
              </div>
              <div style={rule} />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {data.skills.filter(Boolean).slice(0, 22).map((s, i) => (
                  <span key={i} style={chip}>
                    {s}
                  </span>
                ))}
              </div>
            </section>
          )}

          {hasAny(data?.education) && (
            <section>
              <div style={title}>
                <span style={dot} /> Education
              </div>
              <div style={rule} />
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {data.education.map((e, i) => (
                  <div key={i}>
                    <div style={{ fontWeight: 950, color: "#111827" }}>{safe(e.degree) || "Degree"}</div>
                    <div style={{ marginTop: 4, ...body }}>{safe(e.institution) || "Institution"}</div>
                    {safe(e.dateRange) ? <div style={{ marginTop: 4, ...meta }}>{e.dateRange}</div> : null}
                  </div>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>

      {/* Custom Sections */}
      {customCount > 0 && (
        <section style={customCard}>
          <div style={customHeader}>
            <div style={customTitle}>
              <span style={dot} /> Additional Sections
            </div>
            <span style={countChip}>
              {customCount} item{customCount === 1 ? "" : "s"}
            </span>
          </div>

          <div style={customBody}>
            <div style={customSafeWrap}>
              <CustomSectionsBlock customSections={customSections} themeColor={accent} titleStyle={customTitleStyleForBlock} />
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default ModernTemplateV8;
