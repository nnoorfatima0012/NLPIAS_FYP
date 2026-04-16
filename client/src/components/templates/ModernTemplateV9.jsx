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

const ModernTemplateV9 = ({ data, themeColor = "#111827" }) => {
  const header = data?.header || {};
  const name = safe(header.name) || "Your Name";
  const accent = safe(themeColor) || "#111827";
  const accentSoft = hexToRgba(accent, 0.12);

  // Typography
  const body = { color: "#374151", fontSize: 13.25, lineHeight: 1.72 };
  const meta = { color: "#6b7280", fontSize: 12.5, lineHeight: 1.4 };

  // Card system (premium + print friendly)
  const card = {
    border: "1px solid #e5e7eb",
    borderRadius: 18,
    background: "#fff",
    boxShadow: "0 2px 14px rgba(17,24,39,0.05)",
  };

  const softCard = { ...card, background: "#fbfcfe" };

  // Section heading system
  const heading = {
    fontWeight: 950,
    fontSize: 12,
    letterSpacing: 0.9,
    textTransform: "uppercase",
    display: "flex",
    alignItems: "center",
    gap: 10,
    color: "#111827",
    margin: 0,
  };

  const headingRow = {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  };

  const bar = {
    width: 10,
    height: 10,
    borderRadius: 4,
    background: accent,
    boxShadow: `0 0 0 4px ${accentSoft}`,
    flex: "0 0 auto",
  };

  const rule = {
    height: 1,
    background: "#eef2f7",
    flex: 1,
  };

  const rowDivider = { borderTop: "1px solid #eef2f7" };
  const row = { padding: "12px 0" };

  const linkStyle = {
    fontSize: 12.5,
    color: accent,
    textDecoration: "none",
    fontWeight: 900,
    borderBottom: `1px solid ${hexToRgba(accent, 0.35)}`,
    paddingBottom: 1,
    whiteSpace: "nowrap",
  };

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

  // ✅ Custom sections wrapper
  const customSections = Array.isArray(data?.customSections) ? data.customSections : [];
  const customCount = customSections.length;

  const customWrap = { ...card, marginTop: 16, overflow: "hidden" };

  const customHeader = {
    padding: "12px 16px",
    background: "#fbfcfe",
    borderBottom: "1px solid #eef2f7",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  };

  const customBody = { padding: 16, background: "#fff" };

  const countChip = {
    fontSize: 12,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#fff",
    color: "#374151",
    whiteSpace: "nowrap",
  };

  const customHeadingStyle = {
    ...heading,
    marginBottom: 8,
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
        background: "#fff",
        color: "#111827",
      }}
    >
      {/* Header band (more premium) */}
      <div style={{ ...card, overflow: "hidden" }}>
        <div style={{ padding: 18, position: "relative", background: "#dde9ee", color: "#0b1220" }}>
          {/* subtle accent wash */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(90deg, rgb(248, 248, 248) 65%)`,
              pointerEvents: "none",
            }}
          />
          <div style={{ position: "relative", display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 32, fontWeight: 950, lineHeight: 1.08, letterSpacing: -0.4 }}>{name}</div>
              <div style={{ marginTop: 10, color: "rgba(11,18,32,0.82)", lineHeight: 1.55 }}>
                {contactLine}
              </div>
            </div>

            <div
              style={{
                width: 14,
                height: 58,
                borderRadius: 999,
                background: accent,
                boxShadow: `0 10px 18px ${hexToRgba(accent, 0.22)}`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16, marginTop: 16 }}>
        {/* Left main */}
        <main style={{ ...card, padding: 16 }}>
          {safe(data?.summary) && (
            <section style={{ marginBottom: 16 }}>
              <div style={headingRow}>
                <span style={bar} />
                <div style={heading}>Summary</div>
                <div style={rule} />
              </div>
              <p style={{ margin: 0, ...body }}>{data.summary}</p>
            </section>
          )}

          {hasAny(data?.experience) && (
            <section style={{ marginBottom: 16 }}>
              <div style={headingRow}>
                <span style={bar} />
                <div style={heading}>Experience</div>
                <div style={rule} />
              </div>

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
              <div style={headingRow}>
                <span style={bar} />
                <div style={heading}>Projects</div>
                <div style={rule} />
              </div>

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
                    <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
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

        {/* Right rail */}
        <aside style={{ ...softCard, padding: 16 }}>
          {hasAny(data?.skills) && (
            <section style={{ marginBottom: 16 }}>
              <div style={headingRow}>
                <span style={bar} />
                <div style={heading}>Skills</div>
                <div style={rule} />
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {data.skills.filter(Boolean).slice(0, 24).map((s, i) => (
                  <span key={i} style={chip}>
                    {s}
                  </span>
                ))}
              </div>
            </section>
          )}

          {hasAny(data?.education) && (
            <section style={{ marginBottom: 16 }}>
              <div style={headingRow}>
                <span style={bar} />
                <div style={heading}>Education</div>
                <div style={rule} />
              </div>

              {data.education.map((e, i) => (
                <div key={i} style={{ paddingTop: i === 0 ? 0 : 12, ...(i === 0 ? null : rowDivider) }}>
                  <div style={{ fontWeight: 950, color: "#111827" }}>{safe(e.degree) || "Degree"}</div>
                  <div style={{ marginTop: 4, ...body }}>{safe(e.institution) || "Institution"}</div>
                  {safe(e.dateRange) ? <div style={{ marginTop: 4, ...meta }}>{e.dateRange}</div> : null}
                </div>
              ))}
            </section>
          )}

          {hasAny(data?.certifications) && (
            <section style={{ marginBottom: 16 }}>
              <div style={headingRow}>
                <span style={bar} />
                <div style={heading}>Certifications</div>
                <div style={rule} />
              </div>

              {data.certifications.map((c, i) => (
                <div key={i} style={{ paddingTop: i === 0 ? 0 : 12, ...(i === 0 ? null : rowDivider) }}>
                  <div style={{ fontWeight: 950, color: "#111827" }}>{safe(c.name) || "Certification"}</div>
                  <div style={meta}>{[safe(c.issuer), safe(c.date)].filter(Boolean).join(" • ")}</div>
                </div>
              ))}
            </section>
          )}

          {hasAny(data?.languages) && (
            <section>
              <div style={headingRow}>
                <span style={bar} />
                <div style={heading}>Languages</div>
                <div style={rule} />
              </div>

              {data.languages.map((l, i) => (
                <div key={i} style={{ paddingTop: i === 0 ? 0 : 10 }}>
                  <div style={{ fontWeight: 950, color: "#111827" }}>{safe(l.name) || "Language"}</div>
                  {safe(l.level) ? <div style={meta}>{l.level}</div> : null}
                </div>
              ))}
            </section>
          )}
        </aside>
      </div>

      {/* Custom Sections */}
      {customCount > 0 && (
        <section style={customWrap}>
          <div style={customHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <span style={bar} />
              <div style={heading}>Additional Sections</div>
            </div>

            <span style={countChip}>
              {customCount} item{customCount === 1 ? "" : "s"}
            </span>
          </div>

          <div style={customBody}>
            <div style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}>
              <CustomSectionsBlock customSections={customSections} themeColor={accent} titleStyle={customHeadingStyle} />
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default ModernTemplateV9;
