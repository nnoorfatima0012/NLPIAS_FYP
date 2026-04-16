import React from "react";
import CustomSectionsBlock from "./CustomSectionsBlock";

const hasAny = (arr) => Array.isArray(arr) && arr.length > 0;
const safe = (s) => (s ? String(s).trim() : "");

const ModernTemplateV10 = ({ data, themeColor = "#111827" }) => {
  const header = data?.header || {};
  const name = safe(header.name) || "Your Name";
  const accent = themeColor;

  const card = {
    border: "1px solid #e5e7eb",
    borderRadius: 14,
    background: "#fff",
  };

  const meta = { color: "#6b7280", fontSize: 12 };

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

  const dot = { width: 10, height: 10, borderRadius: 999, background: themeColor };

  const chip = {
    fontSize: 12,
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid #e5e7eb",
    background: "#fff",
  };

  const railWrap = { display: "grid", gridTemplateColumns: "18px 1fr", gap: 12 };
  const rail = { position: "relative", width: 18, display: "flex", justifyContent: "center" };
  const railLine = { position: "absolute", top: 0, bottom: 0, width: 2, background: "#e5e7eb", borderRadius: 999 };
  const railNode = {
    width: 12,
    height: 12,
    borderRadius: 999,
    background: themeColor,
    border: "2px solid #fff",
    boxShadow: "0 0 0 1px #e5e7eb",
    marginTop: 2,
  };

  const contact = [safe(header.email), safe(header.phone), safe(header.address)].filter(Boolean).join(" • ");

  /**
   * ✅ Custom sections wrapper styles (efficient + consistent)
   * - full-width, visually separated from the 3-column grid
   * - uses the same template "card" language
   * - prevents long text from breaking layout
   */
  const customWrap = {
    ...card,
    marginTop: 16,
    overflow: "hidden",
  };

  const customHeader = {
    padding: "12px 16px",
    background: "#fafafa",
    borderBottom: "1px solid #eef2f7",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  };

  const customTitle = {
    ...title,
    marginBottom: 0,
  };

  const customBody = {
    padding: 16,
  };

  // Helps CustomSectionsBlock visually match (if it uses titleStyle)
  const customSectionTitleStyle = {
    ...title,
    marginBottom: 8,
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
      {/* Header */}
      <div style={{ ...card, overflow: "hidden" }}>
        <div style={{ height: 8, background: themeColor }} />
        <div style={{ padding: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "start" }}>
            <div>
              <div style={{ fontSize: 30, fontWeight: 950, lineHeight: 1.1 }}>{name}</div>
              <div style={{ marginTop: 8, color: "#374151" }}>
                {contact || "email@example.com • 000-000-0000 • City, Country"}
              </div>
            </div>
            <div style={{ width: 14, height: 56, borderRadius: 999, background: themeColor }} />
          </div>
        </div>
      </div>

      {/* 3-column layout */}
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr 260px", gap: 16, marginTop: 16 }}>
        {/* Left rail */}
        <aside style={{ ...card, padding: 14, background: "#fafafa" }}>
          {hasAny(data?.skills) && (
            <section style={{ marginBottom: 14 }}>
              <div style={title}>
                <span style={dot} /> Skills
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {data.skills
                  .filter(Boolean)
                  .slice(0, 22)
                  .map((s, i) => (
                    <span key={i} style={chip}>
                      {s}
                    </span>
                  ))}
              </div>
            </section>
          )}

          {hasAny(data?.languages) && (
            <section>
              <div style={title}>
                <span style={dot} /> Languages
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {data.languages.map((l, i) => (
                  <div key={i}>
                    <div style={{ fontWeight: 950 }}>{safe(l.name) || "Language"}</div>
                    {safe(l.level) ? <div style={meta}>{l.level}</div> : null}
                  </div>
                ))}
              </div>
            </section>
          )}
        </aside>

        {/* Center timeline main */}
        <main style={{ ...card, padding: 14 }}>
          {safe(data?.summary) && (
            <section style={{ marginBottom: 14 }}>
              <div style={title}>
                <span style={dot} /> Summary
              </div>
              <p style={{ margin: 0, lineHeight: 1.7, color: "#374151" }}>{data.summary}</p>
            </section>
          )}

          {hasAny(data?.experience) && (
            <section style={{ marginBottom: 14 }}>
              <div style={title}>
                <span style={dot} /> Experience
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {data.experience.map((x, i) => (
                  <div key={i} style={railWrap}>
                    <div style={rail}>
                      <div style={railLine} />
                      <div style={railNode} />
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                        <div style={{ fontWeight: 950 }}>
                          {safe(x.role) || "Role"}
                          {safe(x.company) ? (
                            <span style={{ color: "#6b7280", fontWeight: 700 }}> • {x.company}</span>
                          ) : null}
                        </div>
                        {safe(x.dateRange) ? <div style={meta}>{x.dateRange}</div> : null}
                      </div>

                      {hasAny(x.bullets) && (
                        <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 18, color: "#374151" }}>
                          {x.bullets
                            .filter(Boolean)
                            .slice(0, 5)
                            .map((b, idx) => (
                              <li key={idx} style={{ lineHeight: 1.6 }}>
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

          {hasAny(data?.projects) && (
            <section>
              <div style={title}>
                <span style={dot} /> Projects
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {data.projects.map((p, i) => (
                  <div key={i} style={railWrap}>
                    <div style={rail}>
                      <div style={railLine} />
                      <div style={railNode} />
                    </div>

                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                        <div style={{ fontWeight: 950 }}>{safe(p.name) || "Project"}</div>
                        {safe(p.link) ? (
                          <a
                            href={p.link}
                            target="_blank"
                            rel="noreferrer"
                            style={{ fontSize: 12, color: themeColor, textDecoration: "none", fontWeight: 800 }}
                          >
                            View ↗
                          </a>
                        ) : null}
                      </div>

                      {safe(p.description) ? (
                        <div style={{ marginTop: 6, color: "#374151", lineHeight: 1.6 }}>{p.description}</div>
                      ) : null}
                      {hasAny(p.tech) ? (
                        <div style={{ marginTop: 6, color: "#6b7280", fontSize: 12 }}>
                          {p.tech.filter(Boolean).slice(0, 12).join(", ")}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>

        {/* Right rail */}
        <aside style={{ ...card, padding: 14, background: "#fafafa" }}>
          {hasAny(data?.education) && (
            <section style={{ marginBottom: 14 }}>
              <div style={title}>
                <span style={dot} /> Education
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {data.education.map((e, i) => (
                  <div key={i}>
                    <div style={{ fontWeight: 950 }}>{safe(e.degree) || "Degree"}</div>
                    <div style={{ color: "#374151" }}>{safe(e.institution) || "Institution"}</div>
                    {safe(e.dateRange) ? <div style={meta}>{e.dateRange}</div> : null}
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
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {data.certifications.map((c, i) => (
                  <div key={i}>
                    <div style={{ fontWeight: 950 }}>{safe(c.name) || "Certification"}</div>
                    <div style={meta}>{[safe(c.issuer), safe(c.date)].filter(Boolean).join(" • ")}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </aside>
      </div>

      {/* ✅ Custom Sections (efficient + clean + consistent) */}
      {hasAny(data?.customSections) && (
        <section style={customWrap}>
          {/* Header strip */}
          <div style={customHeader}>
            <div style={customTitle}>
              <span style={dot} /> Additional Sections
            </div>

            {/* small hint chip (optional, but helps visually) */}
            <span
              style={{
                fontSize: 12,
                padding: "6px 10px",
                borderRadius: 999,
                border: "1px solid #e5e7eb",
                background: "#fff",
                color: "#374151",
                whiteSpace: "nowrap",
              }}
            >
              {data.customSections.length} item{data.customSections.length === 1 ? "" : "s"}
            </span>
          </div>

          {/* Content */}
          <div style={customBody}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 14,
              }}
            >
              {/* If CustomSectionsBlock already formats each section,
                  we just give it a nice container + better titleStyle. */}
              <div style={{ gridColumn: "1 / -1" }}>
                <CustomSectionsBlock
                  customSections={data.customSections}
                  themeColor={themeColor}
                  titleStyle={customSectionTitleStyle}
                />
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default ModernTemplateV10;
