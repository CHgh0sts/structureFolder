"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";

/* ─── SVG helpers ─────────────────────────────────────────────── */
function Ico({ d, size = 16, color, style, fill }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24"
      fill={fill || "none"} stroke={color || "currentColor"}
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d={d} />
    </svg>
  );
}

const P = {
  folder:    "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z",
  home:      "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10",
  desktop:   "M20 3H4a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1h7v3H8v1h8v-1h-3v-3h7a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1z",
  docs:      "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  download:  "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
  hdd:       "M22 12H2M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11zM6 16h.01M10 16h.01",
  server:    "M2 2h20v8H2zM2 14h20v8H2zM6 6h.01M6 18h.01",
  usb:       "M12 22v-6M9 19l3 3 3-3M6 12V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6M6 12h12M6 12l-2 4h16l-2-4",
  disc:      "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  chevR:     "M9 18l6-6-6-6",
  chevL:     "M15 18l-6-6 6-6",
  arrowUp:   "M12 19V5M5 12l7-7 7 7",
  x:         "M18 6 6 18M6 6l12 12",
  search:    "M11 17a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM21 21l-4.35-4.35",
  grid:      "M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z",
  list:      "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  check:     "M20 6 9 17 4 12",
  music:     "M9 18V5l12-2v13M9 9l12-2",
  pictures:  "M21 15l-5-5L5 21M1 1l22 22M8.5 8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  movies:    "M1 4h22M8 4v16M16 4v16M1 20h22M1 12h22",
};

/* ─── Big folder icon for grid ──────────────────────────────── */
function FolderBig({ selected, hover }) {
  const c = selected ? "#818cf8" : hover ? "#9ca3af" : "#6b7280";
  const fill = selected ? "rgba(91,95,203,.5)" : hover ? "rgba(107,114,128,.35)" : "rgba(107,114,128,.25)";
  const stroke = selected ? "rgba(91,95,203,.9)" : hover ? "rgba(156,163,175,.7)" : "rgba(107,114,128,.6)";
  return (
    <svg width="52" height="44" viewBox="0 0 52 44" fill="none" style={{ display: "block" }}>
      {/* back/tab */}
      <path d="M4 14 L4 36 Q4 38 6 38 L46 38 Q48 38 48 36 L48 14 Q48 12 46 12 L26 12 L21 7 Q20 5 18 5 L6 5 Q4 5 4 7 Z"
        fill={`${fill.replace('.25)', '.18)')}`} stroke={stroke} strokeWidth="1.2"/>
      {/* body */}
      <path d="M3 15 Q3 13 5 13 L47 13 Q49 13 49 15 L49 37 Q49 39 47 39 L5 39 Q3 39 3 37 Z"
        fill={fill} stroke={stroke} strokeWidth="1.2"/>
      {/* shine */}
      <path d="M3 15 Q3 13 5 13 L47 13 Q49 13 49 15 L49 18 Q49 16 47 16 L5 16 Q3 16 3 18 Z"
        fill="rgba(255,255,255,.08)"/>
    </svg>
  );
}

/* ─── Folder icon medium (list view) ────────────────────────── */
function FolderMed({ selected }) {
  const fill = selected ? "rgba(91,95,203,.55)" : "rgba(107,114,128,.32)";
  const stroke = selected ? "rgba(91,95,203,.9)" : "rgba(107,114,128,.65)";
  return (
    <svg width="20" height="17" viewBox="0 0 52 44" fill="none" style={{ display: "block", flexShrink: 0 }}>
      <path d="M4 14 L4 36 Q4 38 6 38 L46 38 Q48 38 48 36 L48 14 Q48 12 46 12 L26 12 L21 7 Q20 5 18 5 L6 5 Q4 5 4 7 Z"
        fill={fill.replace('.32)', '.18)')} stroke={stroke} strokeWidth="1.5"/>
      <path d="M3 15 Q3 13 5 13 L47 13 Q49 13 49 15 L49 37 Q49 39 47 39 L5 39 Q3 39 3 37 Z"
        fill={fill} stroke={stroke} strokeWidth="1.5"/>
    </svg>
  );
}

/* ─── Sidebar icon mapping ────────────────────────────────────── */
function sidebarIcon(name, type) {
  // Windows drive types
  if (type === "network") return P.server;
  if (type === "removable") return P.usb;
  if (type === "cdrom") return P.disc;
  if (type === "local") return P.hdd;
  // Folder names
  if (/maison|home|~/i.test(name)) return P.home;
  if (/bureau|desktop/i.test(name)) return P.desktop;
  if (/documents?/i.test(name)) return P.docs;
  if (/t[eé]l[eé]chargements?|downloads?/i.test(name)) return P.download;
  if (/volumes?/i.test(name)) return P.hdd;
  if (/music|musique/i.test(name)) return P.music;
  if (/pictures?|photos?|images?/i.test(name)) return P.pictures;
  if (/movies?|vid[eé]os?/i.test(name)) return P.movies;
  return P.hdd;
}

/* ─── Grid item (extracted to avoid hooks-in-map) ───────────── */
function GridItem({ item, selected, onClick, onDblClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onDoubleClick={onDblClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 90, padding: "10px 6px 8px", borderRadius: 10,
        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
        cursor: "pointer", userSelect: "none",
        background: selected ? "rgba(91,95,203,.18)" : hov ? "rgba(255,255,255,.05)" : "transparent",
        border: `1.5px solid ${selected ? "rgba(91,95,203,.4)" : "transparent"}`,
        transition: "all .12s",
      }}
    >
      <FolderBig selected={selected} hover={hov && !selected} />
      <span style={{
        fontSize: 11.5, textAlign: "center", color: "var(--text-1)",
        wordBreak: "break-word", lineHeight: 1.35, maxWidth: "100%",
        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
      }}>{item.name}</span>
    </div>
  );
}

/* ─── Breadcrumbs ─────────────────────────────────────────────── */
function buildCrumbs(dir) {
  if (!dir) return [];
  const isAbsolute = dir.startsWith("/");
  const sep = dir.includes("/") ? "/" : "\\";
  const parts = dir.split(sep).filter(Boolean);
  return parts.map((name, i) => ({
    name,
    path: (isAbsolute ? "/" : "") + parts.slice(0, i + 1).join(sep),
  }));
}

/* ─── Template helpers ────────────────────────────────────────── */
const TMPL_RE = /\{[^}]+\}/;

function hasTemplate(val) {
  return val && TMPL_RE.test(val);
}

/**
 * Retourne la partie statique d'un chemin template.
 * Ex: /videos/{animeName}/saison {season}  →  /videos
 */
function staticBase(val) {
  if (!val) return null;
  const idx = val.indexOf("{");
  if (idx === -1) return val;
  const base = val.slice(0, idx);
  const lastSep = Math.max(base.lastIndexOf("/"), base.lastIndexOf("\\"));
  return lastSep > 0 ? base.slice(0, lastSep) : (base || null);
}

/* ══════════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════════ */
export default function FolderBrowser({ value, onChange, placeholder }) {
  const [open,       setOpen]       = useState(false);
  const [currentDir, setCurrentDir] = useState(null);
  const [items,      setItems]      = useState([]);
  const [parent,     setParent]     = useState(null);
  const [roots,      setRoots]      = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [manualVal,  setManualVal]  = useState(value || "");
  const [selected,   setSelected]   = useState(null);
  const [viewMode,   setViewMode]   = useState("list");
  const [search,     setSearch]     = useState("");
  const [history,    setHistory]    = useState([]);
  const [histIdx,    setHistIdx]    = useState(-1);
  const searchRef = useRef(null);

  const isTemplate = hasTemplate(manualVal);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => { setManualVal(value || ""); }, [value]);

  /* ── Browse ──────────────────────────────────────────────── */
  async function browse(dir, pushHistory = true) {
    setLoading(true);
    setError("");
    setSearch("");
    setSelected(null);
    try {
      const url = dir
        ? `/api/system?action=browse&dir=${encodeURIComponent(dir)}`
        : `/api/system?action=browse`;
      const res  = await fetch(url);
      const data = await res.json();
      if (!res.ok) { setError(data.error || `Erreur ${res.status}`); return; }
      setCurrentDir(data.current);
      setItems(data.items || []);
      setParent(data.parent || null);
      setRoots(data.roots || []);
      if (pushHistory) {
        setHistory(h => { const n = h.slice(0, histIdx + 1); n.push(data.current); return n; });
        setHistIdx(i => i + 1);
      }
    } catch { setError("Impossible de charger les dossiers"); }
    finally  { setLoading(false); }
  }

  function goBack() {
    if (histIdx > 0) { setHistIdx(i => i - 1); browse(history[histIdx - 1], false); }
  }
  function goForward() {
    if (histIdx < history.length - 1) { setHistIdx(i => i + 1); browse(history[histIdx + 1], false); }
  }
  function goUp() { if (parent) browse(parent); }

  function handleOpen() {
    setOpen(true);
    setHistory([]);
    setHistIdx(-1);
    // Si le chemin contient des variables, naviguer sur la partie statique
    const startPath = hasTemplate(value) ? staticBase(value) : (value || null);
    browse(startPath || null, true);
  }

  function confirm(chosenPath) {
    // Si le chemin courant contient des templates, le dossier choisi remplace
    // uniquement la partie statique du début (avant les variables)
    let finalPath = chosenPath;
    if (hasTemplate(manualVal)) {
      const tmplIdx = manualVal.indexOf("{");
      const suffix  = manualVal.slice(tmplIdx); // "{animeName}/saison {season}"
      finalPath     = chosenPath.replace(/\/?$/, "/") + suffix;
    }
    onChange(finalPath);
    setManualVal(finalPath);
    setOpen(false);
  }

  function handleItemClick(item) {
    setSelected(item.path);
  }
  function handleItemDblClick(item) {
    browse(item.path);
  }

  /* ── Filtered items ─────────────────────────────────────── */
  const filtered = useMemo(() =>
    search.trim()
      ? items.filter(it => it.name.toLowerCase().includes(search.toLowerCase()))
      : items,
    [items, search]
  );

  const crumbs = buildCrumbs(currentDir);

  /* ── Keyboard ───────────────────────────────────────────── */
  function handleKeyDown(e) {
    if (e.key === "Escape") setOpen(false);
    if (e.key === "Enter" && selected) confirm(selected);
    if (e.key === "Backspace" && e.metaKey && parent) goUp();
  }

  /* ── RENDER ─────────────────────────────────────────────── */
  const inputField = (
    <div>
      <div style={{ display: "flex", gap: 8 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <input
            type="text"
            value={manualVal}
            onChange={e => { setManualVal(e.target.value); onChange(e.target.value); }}
            placeholder={placeholder || "Chemin du dossier..."}
            className="input"
            style={{
              width: "100%",
              paddingRight: isTemplate ? 110 : undefined,
              fontFamily: isTemplate ? "monospace" : undefined,
              borderColor: isTemplate ? "rgba(139,92,246,.4)" : undefined,
            }}
          />
          {isTemplate && (
            <span style={{
              position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
              fontSize: 10.5, fontWeight: 700, padding: "2px 7px", borderRadius: 99,
              background: "rgba(139,92,246,.15)", color: "#c084fc",
              border: "1px solid rgba(139,92,246,.3)", pointerEvents: "none", whiteSpace: "nowrap",
            }}>✦ Template</span>
          )}
        </div>
        <button type="button" onClick={open ? () => setOpen(false) : handleOpen}
          className="btn btn-secondary" style={{ padding: "9px 14px", flexShrink: 0 }}>
          <Ico d={P.folder} size={14} /> Parcourir
        </button>
      </div>
      {isTemplate && !open && (
        <p style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 5, display: "flex", alignItems: "center", gap: 5 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#c084fc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          Les variables <code style={{ color: "#c084fc", background: "rgba(139,92,246,.1)", padding: "0 4px", borderRadius: 3 }}>{"{nom}"}</code> seront
          remplacées à l&apos;exécution. Les dossiers manquants seront <strong style={{ color: "var(--text-2)" }}>créés automatiquement</strong>.
        </p>
      )}
    </div>
  );

  /* ── MODAL CONTENT (portail) ─────────────────────────────── */
  const modalContent = (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,.6)",
        backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
      }}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div
        className="animate-scale-in"
        style={{
          width: "min(820px, 92vw)", height: "min(560px, 88vh)",
          display: "flex", flexDirection: "column",
          background: "rgba(10,14,23,.98)",
          border: "1px solid var(--border)",
          borderRadius: 14,
          boxShadow: "0 40px 100px rgba(0,0,0,.7), 0 0 0 1px rgba(255,255,255,.04)",
          overflow: "hidden",
        }}
      >

          {/* ── TOOLBAR ─────────────────────────────────── */}
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 14px",
            background: "rgba(0,0,0,.3)",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}>
            {/* Traffic-light dots (decorative) */}
            <div style={{ display: "flex", gap: 5, marginRight: 4 }}>
              {["#f87171","#fbbf24","#34d399"].map((c, i) => (
                <div key={i} style={{ width: 11, height: 11, borderRadius: "50%", background: c, opacity: .8 }} />
              ))}
            </div>

            {/* Nav buttons */}
            <button onClick={goBack} disabled={histIdx <= 0}
              style={{ ...navBtn, opacity: histIdx <= 0 ? .25 : 1 }}>
              <Ico d={P.chevL} size={13} />
            </button>
            <button onClick={goForward} disabled={histIdx >= history.length - 1}
              style={{ ...navBtn, opacity: histIdx >= history.length - 1 ? .25 : 1 }}>
              <Ico d={P.chevR} size={13} />
            </button>
            <button onClick={goUp} disabled={!parent}
              style={{ ...navBtn, opacity: !parent ? .25 : 1 }}>
              <Ico d={P.arrowUp} size={13} />
            </button>

            {/* Breadcrumbs */}
            <div style={{
              flex: 1, display: "flex", alignItems: "center", gap: 0,
              padding: "5px 10px", borderRadius: 7,
              background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)",
              overflow: "hidden",
            }}>
              {crumbs.length === 0 ? (
                <span style={{ fontSize: 12.5, color: "var(--text-3)" }}>Chargement…</span>
              ) : crumbs.map((c, i) => (
                <span key={c.path} style={{ display: "flex", alignItems: "center", minWidth: 0 }}>
                  {i > 0 && <span style={{ color: "var(--text-3)", margin: "0 2px", fontSize: 11 }}>/</span>}
                  <button onClick={() => browse(c.path)} style={{
                    background: "none", border: "none", cursor: "pointer", padding: "0 3px",
                    fontSize: 12.5, color: i === crumbs.length - 1 ? "var(--text-1)" : "var(--text-3)",
                    fontWeight: i === crumbs.length - 1 ? 600 : 400,
                    fontFamily: "inherit", borderRadius: 4, flexShrink: i === crumbs.length - 1 ? 0 : 1,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    maxWidth: i === crumbs.length - 1 ? "none" : 80,
                    transition: "color .15s",
                  }}
                    onMouseEnter={e => e.currentTarget.style.color = "var(--text-1)"}
                    onMouseLeave={e => e.currentTarget.style.color = i === crumbs.length - 1 ? "var(--text-1)" : "var(--text-3)"}
                  >
                    {i === 0 && c.name.length <= 2 ? "/" : c.name}
                  </button>
                </span>
              ))}
            </div>

            {/* Search */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <Ico d={P.search} size={13} color="var(--text-3)"
                style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input ref={searchRef} type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Filtrer…"
                style={{
                  width: 140, padding: "5px 10px 5px 28px", borderRadius: 7,
                  background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.1)",
                  color: "var(--text-1)", fontSize: 12.5, fontFamily: "inherit", outline: "none",
                }}
              />
            </div>

            {/* View toggle */}
            <div style={{ display: "flex", borderRadius: 7, overflow: "hidden", border: "1px solid rgba(255,255,255,.1)", flexShrink: 0 }}>
              {[["list",P.list],["grid",P.grid]].map(([mode, icon]) => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  style={{
                    padding: "5px 9px", background: viewMode === mode ? "rgba(91,95,203,.3)" : "rgba(255,255,255,.04)",
                    border: "none", cursor: "pointer", color: viewMode === mode ? "var(--primary-light)" : "var(--text-3)",
                    transition: "all .15s",
                  }}>
                  <Ico d={icon} size={13} />
                </button>
              ))}
            </div>

            {/* Close */}
            <button onClick={() => setOpen(false)}
              style={{ ...navBtn, marginLeft: 2 }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(232,71,95,.2)"; e.currentTarget.style.color = "#f87171"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,.07)"; e.currentTarget.style.color = "var(--text-2)"; }}
            >
              <Ico d={P.x} size={13} />
            </button>
          </div>

          {/* ── BODY ────────────────────────────────────── */}
          <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

            {/* Sidebar */}
            <aside style={{
              width: 180, flexShrink: 0,
              background: "rgba(0,0,0,.25)",
              borderRight: "1px solid var(--border)",
              overflowY: "auto", padding: "10px 8px",
              display: "flex", flexDirection: "column", gap: 2,
            }}>
              <p style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".08em", padding: "4px 10px 8px" }}>
                Favoris
              </p>
              {roots.map(r => {
                const isCurrent = currentDir === r.path;
                return (
                  <button key={r.path} type="button" onClick={() => browse(r.path)}
                    style={{
                      display: "flex", alignItems: "center", gap: 9, width: "100%",
                      padding: "7px 10px", borderRadius: 7, textAlign: "left",
                      background: isCurrent ? "rgba(91,95,203,.15)" : "transparent",
                      border: `1px solid ${isCurrent ? "rgba(91,95,203,.25)" : "transparent"}`,
                      color: isCurrent ? "var(--primary-light)" : "var(--text-2)",
                      cursor: "pointer", fontSize: 12.5, fontFamily: "inherit", transition: "all .15s",
                    }}
                    onMouseEnter={e => { if (!isCurrent) { e.currentTarget.style.background = "rgba(255,255,255,.05)"; e.currentTarget.style.color = "var(--text-1)"; } }}
                    onMouseLeave={e => { if (!isCurrent) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-2)"; } }}
                  >
                    <Ico d={sidebarIcon(r.name, r.type)} size={14} style={{ flexShrink: 0 }} />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
                  </button>
                );
              })}
            </aside>

            {/* Main content */}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
              {loading ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, flexDirection: "column", gap: 10, color: "var(--text-3)" }}>
                  <svg className="animate-spin" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" strokeOpacity=".2"/><path d="M21 12a9 9 0 0 0-9-9"/>
                  </svg>
                  <span style={{ fontSize: 13 }}>Chargement…</span>
                </div>
              ) : error ? (
                <div style={{ padding: 32, textAlign: "center" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(232,71,95,.1)", border: "1px solid rgba(232,71,95,.25)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px", color: "#f87171" }}>
                    <Ico d={P.x} size={18} />
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#f87171", marginBottom: 5 }}>Impossible d&apos;ouvrir ce dossier</p>
                  <p style={{ fontSize: 12, color: "var(--text-3)" }}>{error}</p>
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, flexDirection: "column", gap: 8, color: "var(--text-3)" }}>
                  <Ico d={P.folder} size={28} style={{ opacity: .25 }} />
                  <p style={{ fontSize: 13 }}>{search ? "Aucun dossier ne correspond" : "Aucun sous-dossier"}</p>
                </div>
              ) : viewMode === "grid" ? (
                <div style={{ padding: "16px 14px", display: "flex", flexWrap: "wrap", gap: 4, alignContent: "flex-start" }}>
                  {filtered.map(item => (
                    <GridItem
                      key={item.path}
                      item={item}
                      selected={selected === item.path}
                      onClick={() => handleItemClick(item)}
                      onDblClick={() => handleItemDblClick(item)}
                    />
                  ))}
                </div>
              ) : (
                /* List view */
                <div style={{ padding: "6px 10px" }}>
                  {/* List header */}
                  <div style={{
                    display: "flex", alignItems: "center", padding: "4px 10px 8px",
                    borderBottom: "1px solid var(--border)", marginBottom: 4,
                  }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".06em" }}>
                      Nom ({filtered.length})
                    </span>
                  </div>
                  {filtered.map(item => {
                    const isSel = selected === item.path;
                    return (
                      <div key={item.path}
                        onClick={() => handleItemClick(item)}
                        onDoubleClick={() => handleItemDblClick(item)}
                        style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "6px 10px", borderRadius: 7, cursor: "pointer",
                          background: isSel ? "rgba(91,95,203,.14)" : "transparent",
                          border: `1px solid ${isSel ? "rgba(91,95,203,.3)" : "transparent"}`,
                          transition: "all .1s",
                        }}
                        onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = "rgba(255,255,255,.04)"; }}
                        onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = "transparent"; }}
                      >
                        <FolderMed selected={isSel} />
                        <span style={{ flex: 1, fontSize: 13, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.name}
                        </span>
                        {isSel && (
                          <Ico d={P.check} size={13} color="var(--primary-light)" style={{ flexShrink: 0 }} />
                        )}
                        <button type="button" onClick={e => { e.stopPropagation(); browse(item.path); }}
                          style={{
                            background: "none", border: "none", cursor: "pointer", padding: "2px 5px",
                            borderRadius: 5, color: "var(--text-3)", display: "flex", alignItems: "center",
                            transition: "all .15s", flexShrink: 0,
                          }}
                          title="Ouvrir"
                          onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,.07)"; e.currentTarget.style.color = "var(--text-1)"; }}
                          onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--text-3)"; }}
                        >
                          <Ico d={P.chevR} size={13} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── STATUSBAR ───────────────────────────────── */}
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "10px 16px",
            background: "rgba(0,0,0,.3)", borderTop: "1px solid var(--border)", flexShrink: 0,
          }}>
            {/* Current path / template hint */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
              <Ico d={P.folder} size={13} color="var(--text-3)" style={{ flexShrink: 0 }} />
              {isTemplate ? (
                <span style={{ fontSize: 12, color: "#c084fc", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  La base sélectionnée remplacera la partie statique du template
                </span>
              ) : (
                <span style={{
                  fontSize: 12, fontFamily: "monospace", color: selected ? "var(--primary-light)" : "var(--text-3)",
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {selected || currentDir || "—"}
                </span>
              )}
            </div>

            {/* Actions */}
            <button type="button" onClick={() => setOpen(false)}
              className="btn btn-secondary" style={{ padding: "7px 16px", fontSize: 13, flexShrink: 0 }}>
              Annuler
            </button>
            <button type="button"
              onClick={() => confirm(selected || currentDir)}
              disabled={!selected && !currentDir}
              className="btn btn-primary"
              style={{ padding: "7px 18px", fontSize: 13, flexShrink: 0, minWidth: 100 }}
            >
              <Ico d={P.check} size={13} />
              {selected ? "Sélectionner" : "Dossier actuel"}
            </button>
          </div>

        </div>
    </div>
  );

  return (
    <>
      {inputField}
      {open && mounted && createPortal(modalContent, document.body)}
    </>
  );
}

/* ─── Styles constants ──────────────────────────────────────── */
const navBtn = {
  width: 28, height: 28, borderRadius: 7, padding: 0,
  display: "flex", alignItems: "center", justifyContent: "center",
  background: "rgba(255,255,255,.07)", border: "none", cursor: "pointer",
  color: "var(--text-2)", transition: "all .15s", flexShrink: 0,
};
