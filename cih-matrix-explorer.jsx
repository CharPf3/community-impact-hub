import React, { useState, useEffect } from "react";

/**
 * CIH Matrix Explorer — v0 DRAFT
 * NASA Commercial Impact Hub — Satellite data for energy applications
 *
 * Grid: 4 applications (Solar / Wind / Fossil Fuels / Transmission)
 *       x 4 sensing approaches (Infrared / Visible / Advanced RS / NASA POWER)
 *
 * Three cell display types:
 *   "banner"    — image appears in the top banner strip (transmission/visible)
 *   "cell-fill" — the matrix cell itself expands and fills with the image (fossil/ir)
 *   "modal"     — a large scrollable overlay replaces the side panel (solar/ir)
 *   default     — standard side-panel detail card
 */

const SENSORS = [
  { id: "ir",      label: "Infrared",     sub: "thermal / SWIR" },
  { id: "visible", label: "Visible",      sub: "optical / VNIR" },
  { id: "advrs",   label: "Advanced RS",  sub: "SAR + LiDAR" },
  { id: "power",   label: "NASA POWER",   sub: "modeled, not imagery" },
];

const APPS = [
  { id: "solar",        label: "Solar",        blurb: "siting, performance, irradiance" },
  { id: "wind",         label: "Wind",         blurb: "siting + generation potential" },
  { id: "fossil",       label: "Fossil Fuels", blurb: "production / refinery monitoring, emissions" },
  { id: "transmission", label: "Transmission", blurb: "lines, veg encroachment, grid resilience" },
];

const CELLS = {
  // ---- SOLAR ----
  "solar/ir": {
    fit: "partial",
    display: "modal",
    image: null,
    cases: "TIR can be used to detect panel temperature — a hotter panel means lower efficiency, so thermal imagery flags bad or underperforming panels. SWIR also catches dust and snow buildup. Free public data is currently too coarse for individual panel analysis.",
    instruments: [
      { name: "Landsat 8/9 TIRS", spec: "~100 m (resampled 30 m), 16-day revisit (8-day with combined L8+L9)" },
      { name: "ASTER (Terra)", spec: "~90 m" },
      { name: "HotSat-3", spec: "3.5 m resolution (commercial)" },
      { name: "Constellr SkyBee-1 & -2", spec: "30 m resolution (commercial)" },
    ],
    using: "UAV thermal inspection is well documented, but satellite-based panel monitoring has not yet been systematically attempted. Some commercial products offer resolution capable of individual panel detection.",
    gap: "Public TIR cannot do panel-level analysis. Commercial hi-res thermal inspection from orbit is technically possible but not yet documented in practice.",
  },
  "solar/visible": {
    fit: "strong",
    display: "modal",
    image: null,
    cases: "Optical imagery for siting + monitoring — construction progress, snow/obstruction detection, and eventually automated PV-array detection. O'Brien Solar Farm (Fitchburg WI) = our worked example.",
    instruments: [
      { name: "Sentinel-2 MSI", spec: "20 m, 5-day revisit" },
    ],
    using: "",
    gap: "",
  },
  "solar/advrs": {
    fit: "strong",
    image: null,
    cases: "",
    instruments: [],
    using: "",
    gap: "",
  },
  "solar/power": {
    fit: "strong",
    image: null,
    cases: "",
    instruments: [],
    using: "",
    gap: "",
  },
  // ---- WIND ----
  "wind/ir": {
    fit: "partial",
    image: null,
    cases: "",
    instruments: [],
    using: "",
    gap: "",
  },
  "wind/visible": {
    fit: "strong",
    image: null,
    cases: "",
    instruments: [],
    using: "",
    gap: "",
  },
  "wind/advrs": {
    fit: "partial",
    image: null,
    cases: "",
    instruments: [],
    using: "",
    gap: "",
  },
  "wind/power": {
    fit: "strong",
    image: null,
    cases: "",
    instruments: [],
    using: "",
    gap: "",
  },
  // ---- FOSSIL FUELS ----
  "fossil/ir": {
    fit: "strong",
    display: "cell-fill",
    image: {
      src: `${import.meta.env.BASE_URL}tropomi_ch4_column_2020_01_04.png`,
      alt: "TROPOMI methane column density plume detection, January 4 2020",
      caption: "TROPOMI / Sentinel-5P — CH₄ column density, Jan 4 2020",
    },
    cases: "SWIR-band sensors detect methane (CH₄) and other greenhouse gas plumes from production sites, pipelines, and refineries. TROPOMI on Sentinel-5P provides daily global methane maps at 5.5 × 3.5 km resolution — sufficient to identify large point-source emitters.",
    instruments: [
      { name: "TROPOMI (Sentinel-5P)", spec: "5.5 × 3.5 km, daily global" },
      { name: "Landsat 8/9 TIRS", spec: "100 m thermal, 16-day" },
    ],
    using: "",
    gap: "",
  },
  "fossil/visible": {
    fit: "strong",
    image: null,
    cases: "",
    instruments: [],
    using: "",
    gap: "",
  },
  "fossil/advrs": {
    fit: "strong",
    image: null,
    cases: "",
    instruments: [],
    using: "",
    gap: "",
  },
  "fossil/power": {
    fit: "strong",
    image: null,
    cases: "",
    instruments: [],
    using: "",
    gap: "",
  },
  // ---- TRANSMISSION ----
  "transmission/ir": {
    fit: "strong",
    image: null,
    cases: "",
    instruments: [],
    using: "",
    gap: "",
  },
  "transmission/visible": {
    fit: "strong",
    display: "banner",
    image: {
      src: `${import.meta.env.BASE_URL}pr-nightlights.gif`,
      alt: "Puerto Rico night lights before and after Hurricane Maria",
      caption: "VIIRS Day/Night Band — Puerto Rico grid collapse after Hurricane Maria, Sept 2017",
    },
    cases: "",
    instruments: [],
    using: "",
    gap: "",
  },
  "transmission/advrs": {
    fit: "strong",
    image: null,
    cases: "",
    instruments: [],
    using: "",
    gap: "",
  },
  "transmission/power": {
    fit: "strong",
    image: null,
    cases: "",
    instruments: [],
    using: "",
    gap: "",
  },
};

const FIT_LABEL = { strong: "More developed", partial: "Early / exploratory", none: "—" };
const DISPLAY_HINT = { modal: "overlay demo", banner: "banner demo", "cell-fill": "cell-fill demo" };
const cellFor = (app, sensor) => CELLS[`${app}/${sensor}`] || { fit: "none" };

export default function CIHMatrixExplorer() {
  const [selected, setSelected] = useState(null);
  const [hover, setHover] = useState(null);
  const [fitFilter, setFitFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);

  const sel = selected
    ? {
        cell: cellFor(selected.app, selected.sensor),
        app: APPS.find((a) => a.id === selected.app),
        sensor: SENSORS.find((s) => s.id === selected.sensor),
      }
    : null;

  const matches = (fit) => fitFilter === "all" || fit === fitFilter || fit === fitFilter;

  const handleCellClick = (appId, sensorId) => {
    const cell = cellFor(appId, sensorId);
    if (!matches(cell.fit)) return;
    const display = cell.display || "default";
    if (display === "modal") {
      setSelected({ app: appId, sensor: sensorId });
      setModalOpen(true);
    } else {
      setModalOpen(false);
      setSelected({ app: appId, sensor: sensorId });
    }
  };

  const showBanner = sel?.cell.display === "banner" && sel.cell.image;

  const modalCells = APPS.flatMap((a) =>
    SENSORS
      .map((s) => ({ app: a.id, sensor: s.id }))
      .filter(({ app, sensor }) => (cellFor(app, sensor).display === "modal"))
  );
  const modalIdx = modalOpen && selected
    ? modalCells.findIndex((x) => x.app === selected.app && x.sensor === selected.sensor)
    : -1;
  const prevModal = modalIdx > 0 ? modalCells[modalIdx - 1] : null;
  const nextModal = modalIdx < modalCells.length - 1 ? modalCells[modalIdx + 1] : null;

  const goModal = (entry) => setSelected({ app: entry.app, sensor: entry.sensor });

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") { setModalOpen(false); return; }
      if (!modalOpen) return;
      if (e.key === "ArrowLeft" && prevModal) goModal(prevModal);
      if (e.key === "ArrowRight" && nextModal) goModal(nextModal);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen, prevModal, nextModal]);

  return (
    <div className="cih">
      <style>{css}</style>

      <header className="cih-head">
        <div className="eyebrow">NASA Commercial Impact Hub · rough draft</div>
        <h1>Satellite data for energy applications</h1>
        <div className="meta-row">
          <div className="legend">
            <span className="lg"><i className="mk mk-strong" /> more developed</span>
            <span className="lg"><i className="mk mk-partial" /> early / exploratory</span>
          </div>
          <div className="filters" role="group" aria-label="Filter by maturity">
            {[
              ["all", "All"],
              ["strong", "Developed"],
              ["partial", "Exploratory"],
            ].map(([f, label]) => (
              <button
                key={f}
                className={`chip ${fitFilter === f ? "chip-on" : ""}`}
                onClick={() => setFitFilter(f)}
                aria-pressed={fitFilter === f}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {showBanner && (
        <div className="cih-media">
          <img src={sel.cell.image.src} alt={sel.cell.image.alt} />
          {sel.cell.image.caption && (
            <span className="cih-media-cap">{sel.cell.image.caption}</span>
          )}
        </div>
      )}

      <div className="cih-body">
        <div className="matrix-wrap">
          <div className="matrix" role="grid" aria-label="Energy application by sensing approach">
            <div className="corner" aria-hidden="true" />
            {SENSORS.map((s) => (
              <div key={s.id} className={`col-head ${hover?.sensor === s.id ? "axis-on" : ""}`}>
                <span className="col-label">{s.label}</span>
                <span className="col-band">{s.sub}</span>
              </div>
            ))}

            {APPS.map((app) => (
              <React.Fragment key={app.id}>
                <div className={`row-head ${hover?.app === app.id ? "axis-on" : ""}`}>
                  <span className="row-label">{app.label}</span>
                  <span className="row-blurb">{app.blurb}</span>
                </div>

                {SENSORS.map((s) => {
                  const cell = cellFor(app.id, s.id);
                  const on = matches(cell.fit);
                  const isSel = selected?.app === app.id && selected?.sensor === s.id;
                  const cross = hover?.app === app.id || hover?.sensor === s.id;
                  const isCellFill = isSel && cell.display === "cell-fill" && cell.image;

                  return (
                    <button
                      key={s.id}
                      role="gridcell"
                      className={`cell fit-${cell.fit} ${isSel ? "is-sel" : ""} ${on ? "" : "is-dim"} ${cross ? "is-cross" : ""} ${isCellFill ? "cell-fill-open" : ""}`}
                      disabled={!on}
                      onMouseEnter={() => setHover({ app: app.id, sensor: s.id })}
                      onMouseLeave={() => setHover(null)}
                      onFocus={() => setHover({ app: app.id, sensor: s.id })}
                      onBlur={() => setHover(null)}
                      onClick={() => on && handleCellClick(app.id, s.id)}
                      aria-label={`${app.label}, ${s.label}: ${FIT_LABEL[cell.fit]}`}
                    >
                      {isCellFill ? (
                        <>
                          <img
                            src={cell.image.src}
                            alt={cell.image.alt}
                            className="cell-fill-img"
                          />
                          {cell.image.caption && (
                            <span className="cell-fill-cap">{cell.image.caption}</span>
                          )}
                        </>
                      ) : (
                        <>
                          {cell.fit === "strong" && <i className="mk mk-strong" />}
                          {cell.fit === "partial" && <i className="mk mk-partial" />}
                          {DISPLAY_HINT[cell.display] && (
                            <span className="demo-hint">{DISPLAY_HINT[cell.display]}</span>
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
          <p className="scale-note">Something helpful</p>
        </div>

        <aside className="detail" aria-live="polite">
          {!sel || modalOpen ? (
            <div className="detail-empty">
              <div className="empty-kicker">
                {modalOpen ? "modal open" : "nothing selected yet"}
              </div>
              <p>
                {modalOpen
                  ? "Details are shown in the popup overlay."
                  : "pick a cell to see satellite data + details."}
              </p>
            </div>
          ) : (
            <div className="detail-card">
              <div className="crumb">
                <span>{sel.app.label}</span>
                <span className="crumb-x">×</span>
                <span className="crumb-dt">{sel.sensor.label}</span>
                <span className="crumb-band">{sel.sensor.sub}</span>
              </div>

              <span className={`badge badge-${sel.cell.fit}`}>{FIT_LABEL[sel.cell.fit]}</span>

              <section className="sec">
                <h3>cases</h3>
                <p className="cases">{sel.cell.cases}</p>
              </section>

              <section className="sec">
                <h3>instruments / specs</h3>
                <ul className="instruments">
                  {sel.cell.instruments.map((i, k) => (
                    <li key={k}>
                      <span className="inst-name">{i.name}</span>
                      <span className="inst-spec">{i.spec}</span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="sec">
                <h3>who's using it</h3>
                <p className="users">{sel.cell.using}</p>
              </section>

              <section className="sec gap">
                <h3>gaps + TODO</h3>
                <p>{sel.cell.gap}</p>
              </section>
            </div>
          )}
        </aside>
      </div>

      {modalOpen && sel && (
        <div
          className="modal-overlay"
          onClick={() => setModalOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`${sel.app.label} × ${sel.sensor.label} details`}
        >
          <button
            className="modal-nav modal-nav-prev"
            disabled={!prevModal}
            onClick={(e) => { e.stopPropagation(); goModal(prevModal); }}
            aria-label="Previous cell"
          >
            &#8249;
          </button>

          <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setModalOpen(false)}
              aria-label="Close"
            >
              ×
            </button>

            <div className="modal-crumb">
              <span className="modal-app">{sel.app.label}</span>
              <span className="crumb-x">×</span>
              <span className="modal-sensor">{sel.sensor.label}</span>
              <span className="modal-band">{sel.sensor.sub}</span>
            </div>

            <span className={`badge badge-${sel.cell.fit}`}>{FIT_LABEL[sel.cell.fit]}</span>

            {sel.cell.image && (
              <div className="modal-img-wrap">
                <img src={sel.cell.image.src} alt={sel.cell.image.alt} />
                {sel.cell.image.caption && (
                  <span className="modal-img-cap">{sel.cell.image.caption}</span>
                )}
              </div>
            )}

            <section className="sec modal-sec">
              <h3>use cases</h3>
              <p className="cases">{sel.cell.cases}</p>
            </section>

            <section className="sec modal-sec">
              <h3>instruments / specs</h3>
              <ul className="instruments">
                {sel.cell.instruments.map((i, k) => (
                  <li key={k}>
                    <span className="inst-name">{i.name}</span>
                    <span className="inst-spec">{i.spec}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="sec modal-sec">
              <h3>who's using it</h3>
              <p className="users">{sel.cell.using || "—"}</p>
            </section>

            <section className="sec gap modal-sec">
              <h3>gaps + TODO</h3>
              <p>{sel.cell.gap || "—"}</p>
            </section>

            <div className="modal-counter">
              {modalIdx + 1} / {modalCells.length}
            </div>
          </div>

          <button
            className="modal-nav modal-nav-next"
            disabled={!nextModal}
            onClick={(e) => { e.stopPropagation(); goModal(nextModal); }}
            aria-label="Next cell"
          >
            &#8250;
          </button>
        </div>
      )}

      <footer className="cih-foot" />
    </div>
  );
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@400;500;700;900&family=Red+Hat+Text:wght@400;500;600&display=swap');

.cih{
  --red:#C5050C; --red-dark:#9B0000; --red-tint:#FBEAEA;
  --blue:#0479A8;
  --ink:#1A1A1A; --body:#333333; --muted:#6B7177; --faint:#8A9097;
  --bg:#FFFFFF; --surface:#F7F7F7; --line:#E1E5E7; --line-2:#D3D8DB;
  font-family:'Red Hat Text',system-ui,-apple-system,sans-serif;
  color:var(--body); background:var(--bg);
  padding:20px clamp(16px,4vw,52px) 28px; box-sizing:border-box;
  -webkit-font-smoothing:antialiased;
}
.cih *{ box-sizing:border-box; }

.eyebrow{
  font-size:12px; font-weight:600; letter-spacing:.08em; text-transform:uppercase;
  color:var(--red); margin-bottom:14px; display:flex; align-items:center; gap:12px; flex-wrap:wrap;
}
.draft-pill{
  font-size:11px; font-weight:600; letter-spacing:.04em; text-transform:none;
  color:#8a5a00; background:#FFF4D6; border:1px solid #F0D78A; padding:3px 10px; border-radius:999px;
}
.cih-head h1{
  font-family:'Red Hat Display',sans-serif; font-weight:700; color:var(--ink);
  font-size:clamp(22px,3.2vw,34px); line-height:1.08; letter-spacing:-.015em;
  margin:0 0 12px; max-width:24ch;
}
.lede{ color:var(--body); font-size:16px; line-height:1.6; max-width:66ch; margin:0 0 26px; }

.meta-row{
  display:flex; flex-wrap:wrap; gap:14px 28px; align-items:center; justify-content:space-between;
  padding:11px 0; border-top:1px solid var(--line); border-bottom:1px solid var(--line);
}
.legend{ display:flex; flex-wrap:wrap; gap:20px; align-items:center; }
.lg{ display:inline-flex; align-items:center; gap:9px; font-size:13.5px; color:var(--muted); }
.lg-note{ color:var(--faint); font-style:italic; }

.mk{ width:13px; height:13px; border-radius:50%; display:inline-block; flex:none; }
.mk-strong{ background:var(--red); }
.mk-partial{ background:var(--bg); border:2px solid var(--red); }

.filters{ display:flex; gap:8px; }
.chip{
  font-family:'Red Hat Text',sans-serif; font-size:13.5px; font-weight:500; color:var(--body);
  background:var(--bg); border:1px solid var(--line-2); padding:7px 16px; border-radius:999px;
  cursor:pointer; transition:background .15s,color .15s,border-color .15s;
}
.chip:hover{ border-color:var(--red); color:var(--red); }
.chip-on{ background:var(--red); border-color:var(--red); color:#fff; }
.chip-on:hover{ background:var(--red-dark); border-color:var(--red-dark); color:#fff; }

.cih-body{ display:flex; gap:28px; margin-top:28px; align-items:flex-start; }
.matrix-wrap{ flex:1 1 auto; min-width:0; overflow-x:auto; }

.matrix{
  display:grid;
  grid-template-columns:minmax(190px,1.3fr) repeat(4,minmax(120px,1fr));
  gap:8px; min-width:640px;
}
.corner{}
.col-head{ padding:4px 6px 11px; border-bottom:2px solid var(--line-2); display:flex; flex-direction:column; gap:3px; transition:border-color .15s; }
.col-head.axis-on{ border-bottom-color:var(--red); }
.col-label{ font-family:'Red Hat Display',sans-serif; font-weight:500; font-size:13.5px; color:var(--ink); line-height:1.2; }
.col-band{ font-size:11px; color:var(--faint); }

.row-head{ padding:14px 16px 14px 0; display:flex; flex-direction:column; gap:5px; justify-content:center; }
.row-label{ font-family:'Red Hat Display',sans-serif; font-weight:500; font-size:15px; color:var(--ink); line-height:1.2; transition:color .15s; }
.row-head.axis-on .row-label{ color:var(--red); }
.row-blurb{ font-size:11.5px; color:var(--faint); line-height:1.4; }

.cell{
  position:relative; min-height:62px; border:1px solid var(--line); border-radius:7px;
  background:var(--bg); cursor:pointer; padding:0; display:flex; align-items:center; justify-content:center;
  transition:transform .12s ease, box-shadow .15s, border-color .15s, background .15s, opacity .15s, min-height .2s ease;
  overflow:hidden;
}
.cell:hover:not(:disabled){ transform:translateY(-2px); box-shadow:0 3px 10px rgba(26,26,26,.09); }
.cell:focus-visible{ outline:none; box-shadow:0 0 0 2px var(--bg),0 0 0 4px var(--blue); }
.cell:disabled{ cursor:default; }

.cell.fit-strong{ background:var(--red); border-color:var(--red); }
.cell.fit-strong .mk-strong{ background:#fff; }
.cell.fit-strong:hover:not(:disabled){ background:var(--red-dark); border-color:var(--red-dark); }
.cell.fit-partial{ background:var(--red-tint); border-color:#EAC4C5; }

.cell.is-cross:not(.fit-strong){ border-color:var(--line-2); }
.cell.is-dim{ opacity:.16; pointer-events:none; }
.cell.is-sel{ box-shadow:0 0 0 2px var(--bg),0 0 0 4px var(--blue); }
.cell.is-sel:hover:not(:disabled){ box-shadow:0 0 0 2px var(--bg),0 0 0 4px var(--blue),0 3px 10px rgba(26,26,26,.09); }

/* Cell-fill display type */
.cell.cell-fill-open{
  min-height:200px;
  background:var(--ink) !important;
  border-color:var(--ink) !important;
  transform:none;
  cursor:pointer;
}
.cell-fill-img{
  position:absolute; inset:0; width:100%; height:100%; object-fit:cover; display:block;
  transition:transform .3s ease;
}
.cell.cell-fill-open:hover .cell-fill-img{ transform:scale(1.03); }
.cell-fill-cap{
  position:absolute; bottom:0; left:0; right:0; padding:8px 12px;
  font-size:11px; color:rgba(255,255,255,.92); text-align:left;
  background:linear-gradient(transparent,rgba(0,0,0,.72));
  pointer-events:none;
}

.demo-hint{
  position:absolute; bottom:0; left:0; right:0;
  padding:4px 6px;
  font-size:10.5px; font-weight:500; letter-spacing:.04em; text-transform:uppercase;
  color:rgba(255,255,255,.78); text-align:center;
  background:linear-gradient(transparent,rgba(0,0,0,.42));
  pointer-events:none; line-height:1.3;
}
.cell.fit-partial .demo-hint{
  color:var(--red); background:linear-gradient(transparent,rgba(197,5,12,.08));
}

.scale-note{ font-size:12px; color:var(--faint); margin:14px 2px 0; }

.detail{
  flex:0 0 340px; position:sticky; top:18px; align-self:flex-start;
  background:var(--bg); border:1px solid var(--line); border-radius:12px; min-height:300px;
}
.detail-empty{ padding:34px 26px; }
.empty-kicker{ font-family:'Red Hat Display',sans-serif; font-weight:500; color:var(--ink); font-size:15px; margin-bottom:10px; }
.detail-empty p{ font-size:13.5px; color:var(--muted); line-height:1.55; margin:0; max-width:34ch; }

.detail-card{ padding:24px 26px 28px; }
.crumb{ display:flex; flex-wrap:wrap; align-items:baseline; gap:6px 8px; margin-bottom:16px; }
.crumb > span:first-child{ font-family:'Red Hat Display',sans-serif; font-weight:500; color:var(--ink); font-size:15px; }
.crumb-x{ color:var(--faint); }
.crumb-dt{ color:var(--red); font-weight:600; font-size:14px; }
.crumb-band{ width:100%; font-size:12px; color:var(--faint); }

.badge{
  display:inline-block; font-size:12px; font-weight:600; letter-spacing:.04em; text-transform:uppercase;
  padding:5px 12px; border-radius:5px; margin-bottom:22px;
}
.badge-strong{ background:var(--red); color:#fff; }
.badge-partial{ background:var(--bg); color:var(--red); border:1px solid var(--red); }

.sec{ margin-bottom:20px; }
.sec h3{
  font-size:11px; font-weight:600; letter-spacing:.1em; text-transform:uppercase; color:var(--faint);
  margin:0 0 10px;
}
.cases{ font-size:14px; color:var(--body); line-height:1.6; margin:0; }
.instruments{ list-style:none; margin:0; padding:0; }
.instruments li{ display:flex; justify-content:space-between; align-items:baseline; gap:14px; padding:8px 0; border-bottom:1px solid var(--line); }
.instruments li:last-child{ border-bottom:0; }
.inst-name{ font-size:14px; color:var(--ink); }
.inst-spec{ font-size:12px; color:var(--muted); text-align:right; }
.users{ font-size:14px; color:var(--body); line-height:1.55; margin:0; }

.gap{ background:var(--surface); border-left:3px solid var(--red); border-radius:0 7px 7px 0; padding:14px 16px; margin-bottom:0; }
.gap h3{ color:var(--red); }
.gap p{ font-size:13.5px; color:var(--body); line-height:1.6; margin:0; }

.cih-media{
  margin:16px 0 0; border-radius:10px; overflow:hidden;
  position:relative; height:240px; background:var(--ink);
}
.cih-media img{ width:100%; height:100%; object-fit:contain; display:block; }
.cih-media-cap{
  position:absolute; bottom:0; left:0; right:0; padding:10px 16px;
  font-size:12px; color:rgba(255,255,255,.9);
  background:linear-gradient(transparent,rgba(0,0,0,.6));
}

/* Modal overlay */
.modal-overlay{
  position:fixed; inset:0; z-index:200;
  background:rgba(0,0,0,.55);
  backdrop-filter:blur(3px);
  -webkit-backdrop-filter:blur(3px);
  display:flex; align-items:center; justify-content:center;
  padding:24px;
  animation:modal-fade-in .18s ease;
}
@keyframes modal-fade-in{ from{ opacity:0; } to{ opacity:1; } }

.modal-panel{
  background:var(--bg); border-radius:14px;
  max-width:820px; width:100%; max-height:82vh;
  overflow-y:auto; padding:36px 48px 44px;
  position:relative;
  box-shadow:0 24px 64px rgba(0,0,0,.28);
  animation:modal-slide-in .2s ease;
}
@keyframes modal-slide-in{ from{ transform:translateY(14px); opacity:0; } to{ transform:none; opacity:1; } }

.modal-close{
  position:absolute; top:18px; right:22px;
  background:none; border:none;
  font-size:28px; line-height:1; color:var(--muted);
  cursor:pointer; padding:4px 8px; border-radius:6px;
  transition:color .12s, background .12s;
}
.modal-close:hover{ color:var(--ink); background:var(--surface); }

.modal-nav{
  flex:none; align-self:center;
  background:rgba(255,255,255,.92); border:1px solid rgba(255,255,255,.5);
  border-radius:50%; width:48px; height:48px;
  display:flex; align-items:center; justify-content:center;
  cursor:pointer; font-size:30px; line-height:1; color:var(--ink);
  box-shadow:0 2px 12px rgba(0,0,0,.18);
  transition:background .13s, color .13s, transform .1s;
  margin:0 14px; padding-bottom:2px;
}
.modal-nav:hover:not(:disabled){ background:var(--red); color:#fff; transform:scale(1.08); }
.modal-nav:disabled{ opacity:.22; cursor:default; pointer-events:none; }

.modal-crumb{
  display:flex; flex-wrap:wrap; align-items:baseline; gap:6px 10px;
  margin-bottom:14px; padding-right:48px;
}
.modal-app{
  font-family:'Red Hat Display',sans-serif; font-weight:700;
  font-size:22px; color:var(--ink); letter-spacing:-.01em;
}
.modal-sensor{ color:var(--red); font-weight:600; font-size:17px; }
.modal-band{ width:100%; font-size:12px; color:var(--faint); }

.modal-counter{
  text-align:center; font-size:12px; color:var(--faint); margin-top:24px;
  letter-spacing:.05em;
}

.modal-img-wrap{
  margin:20px 0 28px; border-radius:10px; overflow:hidden;
  position:relative; background:var(--ink);
}
.modal-img-wrap img{ width:100%; display:block; max-height:320px; object-fit:contain; }
.modal-img-cap{
  position:absolute; bottom:0; left:0; right:0; padding:10px 16px;
  font-size:12px; color:rgba(255,255,255,.9);
  background:linear-gradient(transparent,rgba(0,0,0,.6));
}

.modal-sec{ border-bottom:1px solid var(--line); padding-bottom:20px; margin-bottom:20px; }
.modal-sec:last-child{ border-bottom:none; }

.cih-foot{
  margin-top:32px; padding-top:18px; border-top:1px solid var(--line);
  font-size:12px; color:var(--faint); line-height:1.55; max-width:88ch;
}

@media (max-width:880px){
  .cih-body{ flex-direction:column; }
  .detail{ position:static; flex-basis:auto; width:100%; }
  .modal-panel{ padding:28px 24px 36px; max-height:90vh; }
}
@media (prefers-reduced-motion:reduce){
  .cell,.chip{ transition:none; }
  .cell:hover:not(:disabled){ transform:none; }
  .modal-overlay,.modal-panel{ animation:none; }
}
`;
