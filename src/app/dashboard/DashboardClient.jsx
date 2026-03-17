"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import RuleModal from "@/components/RuleModal";
import FolderBrowser from "@/components/FolderBrowser";

/* ─── Icons ───────────────────────────────────────────────────── */
const Icons = {
  play:    "M5 3l14 9-14 9V3z",
  stop:    "M6 6h12v12H6z",
  refresh: "M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15",
  zap:     "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
  folder:  "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z",
  rules:   "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2",
  log:     "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8",
  settings:"M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z",
  plus:    "M12 5v14M5 12h14",
  trash:   "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2",
  edit:    "M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z",
  check:   "M20 6 9 17 4 12",
  x:       "M18 6 6 18M6 6l12 12",
  warn:    "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01",
  info:    "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8h.01M11 12h1v4h1",
  arrowUp: "M18 15l-6-6-6 6",
  arrowDn: "M6 9l6 6 6-6",
  logout:  "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9",
  power:   "M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10",
  chevron: "M6 9l6 6 6-6",
};

function I({ n, size = 15, color, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color || "currentColor"} strokeWidth="1.8"
      strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d={Icons[n]} />
    </svg>
  );
}
function Spin({ size = 15 }) {
  return (
    <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="9" strokeOpacity=".2"/><path d="M21 12a9 9 0 0 0-9-9"/>
    </svg>
  );
}

/* ─── Config ──────────────────────────────────────────────────── */
const TABS = [
  { id: "surveillance", label: "Surveillance", icon: "power"    },
  { id: "règles",       label: "Règles",       icon: "rules"    },
  { id: "dossiers",     label: "Dossiers",     icon: "folder"   },
  { id: "logs",         label: "Logs",         icon: "log"      },
  { id: "paramètres",   label: "Paramètres",   icon: "settings" },
];

const LC = {
  success: { bar: "#0ea572", bg: "rgba(14,165,114,.07)",  text: "#34d399", icon: "check" },
  error:   { bar: "#e8475f", bg: "rgba(232,71,95,.07)",   text: "#f87171", icon: "x"     },
  warning: { bar: "#d97706", bg: "rgba(217,119,6,.07)",   text: "#fbbf24", icon: "warn"  },
  info:    { bar: "#5b5fcb", bg: "rgba(91,95,203,.07)",   text: "#818cf8", icon: "info"  },
};

/* ─── Sub-components ──────────────────────────────────────────── */
function Toggle({ value, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      style={{
        width: 42, height: 24, borderRadius: 99, padding: 0, position: "relative",
        cursor: "pointer", flexShrink: 0, transition: "background .2s, border-color .2s",
        background: value ? "var(--primary)" : "var(--surface-2)",
        border: `2px solid ${value ? "var(--primary)" : "var(--border)"}`,
        outline: "none",
      }}
    >
      <span style={{
        position: "absolute", top: 2,
        left: value ? "calc(100% - 18px)" : 2,
        width: 16, height: 16, borderRadius: "50%",
        background: "#fff", transition: "left .2s",
        boxShadow: "0 1px 3px rgba(0,0,0,.35)",
      }} />
    </button>
  );
}

function Panel({ children, style }) {
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 12, padding: "24px 26px", ...style,
    }}>
      {children}
    </div>
  );
}

function SectionHead({ title, sub, action }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-1)", marginBottom: sub ? 3 : 0 }}>{title}</h2>
        {sub && <p style={{ fontSize: 12.5, color: "var(--text-3)" }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function LogRow({ log, full }) {
  const c = LC[log.type] || LC.info;
  const ts = log.createdAt || log.timestamp;
  return (
    <div style={{
      display: "flex", gap: 12, padding: "10px 14px", borderRadius: 8,
      background: c.bg, borderLeft: `3px solid ${c.bar}`, marginBottom: 6,
    }}>
      <I n={c.icon} size={13} color={c.text} style={{ flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          <span style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "monospace" }}>
            {full ? new Date(ts).toLocaleString("fr-FR") : new Date(ts).toLocaleTimeString("fr-FR")}
          </span>
          {full && (
            <span style={{
              fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 99,
              background: `${c.bar}20`, color: c.text, border: `1px solid ${c.bar}30`,
            }}>{log.type}</span>
          )}
        </div>
        <p style={{ fontSize: 12.5, color: "var(--text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: full ? "normal" : "nowrap" }}>{log.message}</p>
        {full && log.file && (
          <p style={{ fontSize: 11.5, marginTop: 2, color: "var(--text-3)", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{log.file}</p>
        )}
        {full && log.destination && (
          <p style={{ fontSize: 11.5, marginTop: 1, color: "var(--primary-light)", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>→ {log.destination}</p>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function DashboardClient({ initialConfig }) {
  const router = useRouter();
  const [config,         setConfig]         = useState(initialConfig);
  const [activeTab,      setActiveTab]      = useState("surveillance");
  const [watcherStatus,  setWatcherStatus]  = useState({ running: false, watchedFolders: [] });
  const [logs,           setLogs]           = useState([]);
  const [rules,          setRules]          = useState(initialConfig.rules || []);
  const [processedCount, setProcessedCount] = useState(initialConfig.processedFilesCount || 0);
  const [ruleModalOpen,  setRuleModalOpen]  = useState(false);
  const [editingRule,    setEditingRule]    = useState(null);
  const [loading,        setLoading]        = useState({});
  const [systemInfo,     setSystemInfo]     = useState(null);
  const [toast,          setToast]          = useState(null);
  const [logFilter,      setLogFilter]      = useState("all");
  const [menuOpen,       setMenuOpen]       = useState(false);

  const [settingsForm, setSettingsForm] = useState({
    defaultDestination: initialConfig.defaultDestination || "",
    watchFolders: initialConfig.watchFolders || [],
    recursive: initialConfig.recursive ?? false,
    excludedFolders: initialConfig.excludedFolders ?? [],
  });

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3200);
  }

  const fetchWatcherStatus = useCallback(async () => {
    const r = await fetch("/api/watcher");
    if (r.ok) setWatcherStatus(await r.json());
  }, []);

  const fetchLogs = useCallback(async () => {
    const r = await fetch("/api/logs");
    if (r.ok) { const d = await r.json(); setLogs(d.logs || []); }
  }, []);

  useEffect(() => {
    fetchWatcherStatus();
    fetchLogs();
    fetch("/api/system?action=info").then(r => r.json()).then(setSystemInfo).catch(() => {});
    const iv = setInterval(() => {
      fetchWatcherStatus();
      if (activeTab === "logs") fetchLogs();
    }, 5000);
    return () => clearInterval(iv);
  }, [fetchWatcherStatus, fetchLogs, activeTab]);

  async function toggleWatcher() {
    const action = watcherStatus.running ? "stop" : "start";
    setLoading(l => ({ ...l, watcher: true }));
    const r = await fetch("/api/watcher", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
    if (r.ok) { await fetchWatcherStatus(); await fetchLogs(); showToast(watcherStatus.running ? "Surveillance arrêtée" : "Surveillance démarrée"); }
    setLoading(l => ({ ...l, watcher: false }));
  }

  async function processExisting() {
    setLoading(l => ({ ...l, process: true }));
    const r = await fetch("/api/watcher", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "process-existing" }) });
    if (r.ok) {
      const d = await r.json();
      await fetchLogs();
      setProcessedCount(c => c + (d.processed || 0));
      showToast(`${d.processed} fichier(s) traité(s)`);
    }
    setLoading(l => ({ ...l, process: false }));
  }

  async function saveRule(ruleData) {
    if (editingRule) {
      const updated = rules.map(r => r.id === editingRule.id ? { ...r, ...ruleData } : r);
      const r = await fetch("/api/rules", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rules: updated }) });
      if (r.ok) { const d = await r.json(); setRules(d.rules || updated); showToast("Règle mise à jour"); }
    } else {
      const r = await fetch("/api/rules", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(ruleData) });
      if (r.ok) { const d = await r.json(); setRules(prev => [...prev, d.rule]); showToast("Règle créée"); }
    }
    setEditingRule(null);
  }

  async function deleteRule(id) {
    if (!confirm("Supprimer cette règle définitivement ?")) return;
    await fetch(`/api/rules?id=${id}`, { method: "DELETE" });
    setRules(r => r.filter(x => x.id !== id));
    showToast("Règle supprimée", "info");
  }

  async function moveRule(id, direction) {
    const idx = rules.findIndex(r => r.id === id);
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === rules.length - 1) return;
    const n = [...rules];
    const si = direction === "up" ? idx - 1 : idx + 1;
    [n[idx], n[si]] = [n[si], n[idx]];
    const updated = n.map((r, i) => ({ ...r, priority: i + 1 }));
    await fetch("/api/rules", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rules: updated }) });
    setRules(updated);
  }

  async function saveSettings() {
    const validFolders = settingsForm.watchFolders.filter(Boolean);
    const r = await fetch("/api/config", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        watchFolders: validFolders,
        defaultDestination: settingsForm.defaultDestination,
        recursive: settingsForm.recursive,
        excludedFolders: settingsForm.excludedFolders.filter(Boolean),
      }),
    });
    if (r.ok) {
      const d = await r.json();
      setConfig(d.config);
      setSettingsForm(f => ({
        ...f,
        recursive: d.config.recursive ?? false,
        excludedFolders: d.config.excludedFolders ?? [],
      }));
      if (watcherStatus.running) { await fetch("/api/watcher", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "restart" }) }); await fetchWatcherStatus(); }
      showToast("Paramètres sauvegardés");
    }
  }

  async function clearLogs() {
    await fetch("/api/logs", { method: "DELETE" });
    setLogs([]);
    showToast("Logs effacés", "info");
  }

  async function triggerStartup(action) {
    setLoading(l => ({ ...l, startup: true }));
    const r = await fetch(`/api/startup?action=${action}`);
    const d = await r.json();
    if (r.ok) showToast(d.output?.split("\n")[1] || "Succès");
    else showToast(d.error || "Erreur", "error");
    setLoading(l => ({ ...l, startup: false }));
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const sortedRules    = [...rules].sort((a, b) => (a.priority || 99) - (b.priority || 99));
  const osPlatform     = systemInfo?.platform === "win32" ? "Windows" : systemInfo?.platform === "darwin" ? "macOS" : systemInfo?.platform === "linux" ? "Linux" : "—";
  const filteredLogs   = logFilter === "all" ? logs : logs.filter(l => l.type === logFilter);

  /* ─── Sidebar nav button ──────────────────────────────────────── */
  function NavBtn({ tab }) {
    const active = activeTab === tab.id;
    return (
      <button
        onClick={() => { setActiveTab(tab.id); if (tab.id === "logs") fetchLogs(); }}
        style={{
          display: "flex", alignItems: "center", gap: 10, width: "100%",
          padding: "9px 13px", borderRadius: 8, marginBottom: 3,
          background: active ? "rgba(91,95,203,.14)" : "transparent",
          border: `1px solid ${active ? "rgba(91,95,203,.25)" : "transparent"}`,
          color: active ? "var(--primary-light)" : "var(--text-2)",
          cursor: "pointer", fontSize: 13.5, fontWeight: active ? 600 : 400,
          fontFamily: "inherit", textAlign: "left", transition: "all .15s",
        }}
        onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "var(--surface-2)"; e.currentTarget.style.color = "var(--text-1)"; } }}
        onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-2)"; } }}
      >
        <I n={tab.icon} size={15} style={{ flexShrink: 0 }} />
        {tab.label}
        {tab.id === "surveillance" && (
          <span style={{
            marginLeft: "auto", width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
            background: watcherStatus.running ? "#0ea572" : "#e8475f",
            boxShadow: watcherStatus.running ? "0 0 5px #0ea572" : "none",
          }} />
        )}
        {tab.id === "règles" && rules.length > 0 && (
          <span style={{
            marginLeft: "auto", fontSize: 10, fontWeight: 700, padding: "1px 6px",
            borderRadius: 99, background: "rgba(91,95,203,.2)", color: "var(--primary-light)",
          }}>{rules.length}</span>
        )}
        {tab.id === "logs" && logs.length > 0 && (
          <span style={{
            marginLeft: "auto", fontSize: 10, fontWeight: 700, padding: "1px 6px",
            borderRadius: 99, background: "rgba(255,255,255,.07)", color: "var(--text-3)",
          }}>{logs.length}</span>
        )}
      </button>
    );
  }

  /* ─── RENDER ──────────────────────────────────────────────────── */
  return (
    <div style={{ display: "flex", height: "100dvh", overflow: "hidden", position: "relative" }}>
      <div className="mesh-bg" />

      {/* ══ SIDEBAR ═══════════════════════════════════════════════ */}
      <aside style={{
        width: 224, flexShrink: 0,
        background: "rgba(10,14,23,.98)",
        borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column",
        zIndex: 20,
      }}>

        {/* App logo */}
        <div style={{ padding: "20px 16px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: "linear-gradient(135deg, #5b5fcb, #7c3aed)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 4px 14px rgba(91,95,203,.4)",
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                <line x1="12" y1="11" x2="12" y2="17"/>
                <line x1="9" y1="14" x2="15" y2="14"/>
              </svg>
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)", lineHeight: 1.2 }}>
                {config.siteName || "File Organizer"}
              </p>
              <p style={{ fontSize: 11, color: "var(--text-3)" }}>Tableau de bord</p>
            </div>
          </div>
        </div>

        {/* Watcher status */}
        <div style={{ padding: "0 12px 14px" }}>
          <button
            onClick={() => setActiveTab("surveillance")}
            style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%",
              padding: "9px 12px", borderRadius: 8, cursor: "pointer",
              background: watcherStatus.running ? "rgba(14,165,114,.08)" : "rgba(232,71,95,.07)",
              border: `1px solid ${watcherStatus.running ? "rgba(14,165,114,.18)" : "rgba(232,71,95,.15)"}`,
              fontFamily: "inherit", transition: "opacity .2s",
            }}
          >
            <span style={{
              width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
              background: watcherStatus.running ? "#0ea572" : "#e8475f",
              animation: watcherStatus.running ? "pulseDot 2s ease-in-out infinite" : "none",
            }} />
            <p style={{ fontSize: 12, fontWeight: 600, color: watcherStatus.running ? "#34d399" : "#f87171", flex: 1, textAlign: "left" }}>
              {watcherStatus.running ? "Surveillance active" : "Surveillance arrêtée"}
            </p>
          </button>
        </div>

        <div style={{ height: 1, background: "var(--border)", margin: "0 12px 10px" }} />

        {/* Navigation */}
        <nav style={{ padding: "4px 10px", flex: 1, overflowY: "auto" }}>
          {TABS.map(t => <NavBtn key={t.id} tab={t} />)}
        </nav>

        <div style={{ height: 1, background: "var(--border)", margin: "6px 12px" }} />

        {/* User */}
        <div style={{ padding: "10px 12px 18px", position: "relative" }}>
          {menuOpen && (
            <div className="animate-scale-in" style={{
              position: "absolute", bottom: "calc(100% - 4px)", left: 12, right: 12,
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: 10, overflow: "hidden",
              boxShadow: "0 -8px 32px rgba(0,0,0,.4)", zIndex: 100,
            }}>
              <div style={{ padding: "10px 14px 8px", borderBottom: "1px solid var(--border)" }}>
                <p style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-1)" }}>{config.adminUsername || "Admin"}</p>
                <p style={{ fontSize: 11, color: "var(--text-3)" }}>Administrateur</p>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  display: "flex", alignItems: "center", gap: 8, width: "100%",
                  padding: "10px 14px", fontSize: 13, cursor: "pointer",
                  color: "var(--rose)", background: "transparent", border: "none",
                  fontFamily: "inherit", transition: "background .15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(232,71,95,.08)"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <I n="logout" size={14} /> Déconnexion
              </button>
            </div>
          )}
          <button
            onClick={() => setMenuOpen(o => !o)}
            style={{
              display: "flex", alignItems: "center", gap: 9, width: "100%",
              padding: "9px 12px", borderRadius: 8, cursor: "pointer",
              background: menuOpen ? "var(--surface-2)" : "transparent",
              border: "1px solid transparent", transition: "all .15s", fontFamily: "inherit",
            }}
            onMouseEnter={e => { if (!menuOpen) e.currentTarget.style.background = "var(--surface-2)"; }}
            onMouseLeave={e => { if (!menuOpen) e.currentTarget.style.background = "transparent"; }}
          >
            <div style={{
              width: 29, height: 29, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg, #5b5fcb, #7c3aed)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 700, color: "#fff",
            }}>
              {(config.adminUsername || "A").slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
              <p style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {config.adminUsername || "Admin"}
              </p>
              <p style={{ fontSize: 11, color: "var(--text-3)" }}>Admin</p>
            </div>
            <I n="chevron" size={11} color="var(--text-3)" style={{ transform: menuOpen ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0 }} />
          </button>
        </div>
      </aside>

      {/* ══ MAIN CONTENT ══════════════════════════════════════════ */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
        <main style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 32px 56px" }}>

          {/* ── SURVEILLANCE ──────────────────────────────────────── */}
          {activeTab === "surveillance" && (
            <div className="animate-fade-up">

              {/* Stat strip */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
                {[
                  { label: "Surveillance", value: watcherStatus.running ? "Active" : "Arrêtée", color: watcherStatus.running ? "#0ea572" : "#e8475f" },
                  { label: "Dossiers",     value: config.watchFolders?.length || 0,             color: "#5b5fcb" },
                  { label: "Règles",       value: rules.length,                                  color: "#8b5cf6" },
                  { label: "Fichiers traités", value: processedCount,                             color: "#d97706" },
                ].map(s => (
                  <div key={s.label} style={{
                    background: "var(--surface)", border: "1px solid var(--border)",
                    borderRadius: 10, padding: "16px 20px",
                    borderTop: `3px solid ${s.color}`,
                  }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "var(--text-1)", lineHeight: 1.1, marginBottom: 5 }}>{s.value}</div>
                    <div style={{ fontSize: 12, color: "var(--text-3)", fontWeight: 500 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Watcher control */}
              <Panel style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: watcherStatus.watchedFolders?.length ? 20 : 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: 46, height: 46, borderRadius: 13, flexShrink: 0,
                      background: watcherStatus.running ? "rgba(14,165,114,.12)" : "rgba(232,71,95,.1)",
                      border: `1.5px solid ${watcherStatus.running ? "rgba(14,165,114,.3)" : "rgba(232,71,95,.2)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: watcherStatus.running ? "#0ea572" : "#e8475f",
                    }}>
                      <I n="power" size={20} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--text-1)", marginBottom: 3 }}>
                        Watcher de fichiers
                      </h2>
                      <p style={{ fontSize: 13, color: "var(--text-3)" }}>
                        {watcherStatus.running
                          ? `Actif — ${watcherStatus.watchedFolders?.length || 0} dossier(s) surveillé(s)`
                          : "Arrêté — les fichiers ne sont pas traités"}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                    <button onClick={processExisting} disabled={loading.process} className="btn btn-secondary" style={{ fontSize: 13 }}>
                      {loading.process ? <Spin /> : <I n="zap" size={14} />}
                      Traiter existants
                    </button>
                    <button
                      onClick={toggleWatcher}
                      disabled={loading.watcher}
                      className={`btn ${watcherStatus.running ? "btn-danger" : "btn-primary"}`}
                      style={{ fontSize: 13, minWidth: 112 }}
                    >
                      {loading.watcher ? <Spin /> : <I n={watcherStatus.running ? "stop" : "play"} size={14} />}
                      {loading.watcher ? "..." : watcherStatus.running ? "Arrêter" : "Démarrer"}
                    </button>
                  </div>
                </div>

                {watcherStatus.watchedFolders?.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {watcherStatus.watchedFolders.map(f => (
                      <div key={f} style={{
                        display: "flex", alignItems: "center", gap: 9,
                        padding: "8px 12px", borderRadius: 8,
                        background: "rgba(91,95,203,.06)", border: "1px solid rgba(91,95,203,.12)",
                      }}>
                        <I n="folder" size={13} color="var(--primary-light)" style={{ flexShrink: 0 }} />
                        <span style={{ fontSize: 12.5, fontFamily: "monospace", color: "var(--primary-light)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99,
                          background: "rgba(14,165,114,.12)", color: "#34d399", border: "1px solid rgba(14,165,114,.2)",
                        }}>actif</span>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>

              {/* System info + recent logs */}
              <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16 }}>
                {systemInfo && (
                  <Panel>
                    <h3 style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 16 }}>Système</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      {[
                        { label: "Plateforme", value: osPlatform },
                        { label: "Home", value: systemInfo.homeDir },
                        { label: "Séparateur", value: systemInfo.sep },
                      ].map(item => (
                        <div key={item.label}>
                          <p style={{ fontSize: 11, color: "var(--text-3)", marginBottom: 3 }}>{item.label}</p>
                          <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </Panel>
                )}
                <Panel>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <h3 style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: ".07em" }}>Activité récente</h3>
                    <button onClick={fetchLogs} className="btn btn-ghost" style={{ padding: "4px 10px", fontSize: 12 }}>
                      <I n="refresh" size={12} /> Actualiser
                    </button>
                  </div>
                  <div style={{ maxHeight: 260, overflowY: "auto" }}>
                    {logs.length === 0
                      ? <p style={{ textAlign: "center", padding: "24px 0", fontSize: 13, color: "var(--text-3)" }}>Aucune activité</p>
                      : logs.slice(0, 10).map(l => <LogRow key={l.id} log={l} />)}
                  </div>
                </Panel>
              </div>
            </div>
          )}

          {/* ── RÈGLES ────────────────────────────────────────────── */}
          {activeTab === "règles" && (
            <div className="animate-fade-up">
              <SectionHead
                title="Règles de tri"
                sub="Priorité 1 = première évaluée — la première correspondance gagne"
                action={
                  <button onClick={() => { setEditingRule(null); setRuleModalOpen(true); }} className="btn btn-primary" style={{ fontSize: 13 }}>
                    <I n="plus" size={14} /> Nouvelle règle
                  </button>
                }
              />

              {sortedRules.length === 0 ? (
                <Panel style={{ textAlign: "center", padding: "60px 24px" }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14, margin: "0 auto 16px",
                    background: "rgba(91,95,203,.1)", border: "1px solid rgba(91,95,203,.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <I n="rules" size={22} color="var(--primary-light)" />
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: "var(--text-1)" }}>Aucune règle</p>
                  <p style={{ fontSize: 13, color: "var(--text-3)", marginBottom: 20 }}>
                    Créez votre première règle pour trier automatiquement vos fichiers
                  </p>
                  <button onClick={() => setRuleModalOpen(true)} className="btn btn-primary">
                    <I n="plus" size={14} /> Créer une règle
                  </button>
                </Panel>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {sortedRules.map((rule, idx) => (
                    <div key={rule.id} style={{
                      display: "flex", alignItems: "stretch",
                      background: "var(--surface)", border: "1px solid var(--border)",
                      borderRadius: 12, overflow: "hidden",
                      transition: "border-color .2s, box-shadow .2s",
                    }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-hover)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,.18)"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
                    >
                      {/* Priority controls */}
                      <div style={{
                        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        gap: 6, padding: "16px 14px",
                        background: "var(--bg-2)", borderRight: "1px solid var(--border)", minWidth: 48,
                      }}>
                        <button onClick={() => moveRule(rule.id, "up")} disabled={idx === 0}
                          style={{ background: "none", border: "none", cursor: idx === 0 ? "not-allowed" : "pointer", color: "var(--text-3)", padding: 3, borderRadius: 4, opacity: idx === 0 ? .2 : 1, transition: "color .15s" }}
                          onMouseEnter={e => { if (idx !== 0) e.currentTarget.style.color = "var(--text-1)"; }}
                          onMouseLeave={e => e.currentTarget.style.color = "var(--text-3)"}
                        >
                          <I n="arrowUp" size={12} />
                        </button>
                        <span style={{ fontSize: 12, fontWeight: 800, color: "var(--primary-light)" }}>#{rule.priority || idx + 1}</span>
                        <button onClick={() => moveRule(rule.id, "down")} disabled={idx === sortedRules.length - 1}
                          style={{ background: "none", border: "none", cursor: idx === sortedRules.length - 1 ? "not-allowed" : "pointer", color: "var(--text-3)", padding: 3, borderRadius: 4, opacity: idx === sortedRules.length - 1 ? .2 : 1, transition: "color .15s" }}
                          onMouseEnter={e => { if (idx !== sortedRules.length - 1) e.currentTarget.style.color = "var(--text-1)"; }}
                          onMouseLeave={e => e.currentTarget.style.color = "var(--text-3)"}
                        >
                          <I n="arrowDn" size={12} />
                        </button>
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, padding: "16px 20px", minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-1)" }}>{rule.name || `Règle ${idx + 1}`}</span>
                          {rule.platforms?.length > 0 && (
                            <span className="badge badge-yellow">{rule.platforms.join(" / ")}</span>
                          )}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: rule.filters?.length ? 8 : 10 }}>
                          {rule.extensions?.length > 0
                            ? rule.extensions.map(e => <span key={e} className="badge badge-blue">{e}</span>)
                            : <span className="badge badge-gray">Tous les fichiers</span>}
                        </div>
                        {rule.filters?.length > 0 && (
                          <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 8 }}>
                            {rule.filters.map((f, i) => (
                              <span key={i}>
                                {i > 0 && <span> · </span>}
                                <span style={{ color: "var(--text-2)" }}>
                                  {f.type === "filenameStartsWith" && `commence par "${f.value}"`}
                                  {f.type === "filenameEndsWith"   && `finit par "${f.value}"`}
                                  {f.type === "filenameContains"   && `contient "${f.value}"`}
                                  {f.type === "filenameRegex"      && `regex: ${f.value}`}
                                  {f.type === "extension"          && `ext: ${f.value}`}
                                </span>
                              </span>
                            ))}
                          </p>
                        )}
                        {/* Destination */}
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: rule.renameTemplate ? 5 : 0 }}>
                          <I n="folder" size={12} color="var(--text-3)" style={{ flexShrink: 0 }} />
                          <span style={{ fontSize: 12, fontFamily: "monospace", color: "var(--text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rule.destination}</span>
                        </div>

                        {/* Rename template */}
                        {rule.renameTemplate && (
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            <span style={{ fontSize: 11.5, fontFamily: "monospace", color: "#34d399", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{rule.renameTemplate}</span>
                          </div>
                        )}

                        {/* Capture patterns count */}
                        {(() => {
                          const patterns = Array.isArray(rule.capturePatterns) ? rule.capturePatterns
                            : (() => { try { return JSON.parse(rule.capturePatterns || "[]"); } catch { return []; } })();
                          return patterns.length > 0 ? (
                            <span style={{
                              display: "inline-flex", alignItems: "center", gap: 4,
                              fontSize: 10.5, fontWeight: 600, padding: "2px 7px", borderRadius: 99,
                              background: "rgba(139,92,246,.12)", color: "#c084fc", border: "1px solid rgba(139,92,246,.25)",
                            }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 20l4-16M4 9l3 3-3 3M20 9l-3 3 3 3"/></svg>
                              {patterns.length} variable{patterns.length > 1 ? "s" : ""} dynamique{patterns.length > 1 ? "s" : ""}
                            </span>
                          ) : null;
                        })()}
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "14px", justifyContent: "center", flexShrink: 0 }}>
                        <button onClick={() => { setEditingRule(rule); setRuleModalOpen(true); }} className="btn btn-secondary" style={{ padding: "7px 14px", fontSize: 12 }}>
                          <I n="edit" size={12} /> Modifier
                        </button>
                        <button onClick={() => deleteRule(rule.id)} className="btn btn-danger" style={{ padding: "7px 10px", justifyContent: "center" }}>
                          <I n="trash" size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Default destination */}
              <div style={{
                display: "flex", alignItems: "center", gap: 14, marginTop: 16,
                padding: "14px 18px", borderRadius: 10,
                background: "rgba(217,119,6,.07)", border: "1px solid rgba(217,119,6,.2)",
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                  background: "rgba(217,119,6,.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--amber)",
                }}>
                  <I n="folder" size={16} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: "var(--amber)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 3 }}>Destination par défaut</p>
                  <p style={{ fontSize: 13, fontFamily: "monospace", color: "var(--text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {config.defaultDestination || "Non configuré"}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}>Appliquée si aucune règle ne correspond</p>
                </div>
              </div>
            </div>
          )}

          {/* ── DOSSIERS ──────────────────────────────────────────── */}
          {activeTab === "dossiers" && (
            <div className="animate-fade-up">
              <SectionHead title="Dossiers surveillés" sub="État de chaque dossier en temps réel" />
              <Panel>
                {(config.watchFolders || []).length === 0 ? (
                  <p style={{ textAlign: "center", padding: "24px 0", fontSize: 13, color: "var(--text-3)" }}>
                    Aucun dossier configuré — rendez-vous dans Paramètres.
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {(config.watchFolders || []).map((folder, i) => {
                      const isActive = watcherStatus.watchedFolders?.includes(folder);
                      return (
                        <div key={i} style={{
                          display: "flex", alignItems: "center", gap: 14, padding: "13px 16px", borderRadius: 10,
                          background: "var(--bg-2)", border: "1px solid var(--border)",
                        }}>
                          <div style={{
                            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                            background: "rgba(91,95,203,.1)", display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <I n="folder" size={17} color="var(--primary-light)" />
                          </div>
                          <span style={{ flex: 1, fontSize: 13.5, fontFamily: "monospace", color: "var(--text-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {folder}
                          </span>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 11px", borderRadius: 99,
                            fontSize: 11, fontWeight: 600, flexShrink: 0,
                            background: isActive ? "rgba(14,165,114,.1)" : "rgba(255,255,255,.05)",
                            border: `1px solid ${isActive ? "rgba(14,165,114,.25)" : "var(--border)"}`,
                            color: isActive ? "#34d399" : "var(--text-3)",
                          }}>
                            <span style={{
                              width: 6, height: 6, borderRadius: "50%",
                              background: isActive ? "#0ea572" : "var(--text-3)",
                              animation: isActive ? "pulseDot 2s ease-in-out infinite" : "none",
                            }} />
                            {isActive ? "Actif" : "Inactif"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
                <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                  Pour modifier les dossiers, rendez-vous dans <strong style={{ color: "var(--text-2)" }}>Paramètres</strong>.
                </p>
              </Panel>
            </div>
          )}

          {/* ── LOGS ──────────────────────────────────────────────── */}
          {activeTab === "logs" && (
            <div className="animate-fade-up">
              <SectionHead
                title="Journal d'activité"
                sub={`${logs.length} entrée(s) au total`}
                action={
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={fetchLogs} className="btn btn-secondary" style={{ fontSize: 12, padding: "7px 14px" }}>
                      <I n="refresh" size={12} /> Actualiser
                    </button>
                    <button onClick={clearLogs} className="btn btn-danger" style={{ fontSize: 12, padding: "7px 14px" }}>
                      <I n="trash" size={12} /> Vider
                    </button>
                  </div>
                }
              />

              {/* Type filters */}
              <div style={{ display: "flex", gap: 7, marginBottom: 16, flexWrap: "wrap" }}>
                {["all", "success", "error", "warning", "info"].map(f => {
                  const isActive = logFilter === f;
                  const color = f === "all" ? "#5b5fcb" : LC[f]?.bar || "#5b5fcb";
                  const textColor = f === "all" ? "var(--primary-light)" : LC[f]?.text || "var(--primary-light)";
                  const count = f === "all" ? logs.length : logs.filter(l => l.type === f).length;
                  return (
                    <button key={f} onClick={() => setLogFilter(f)} style={{
                      padding: "5px 13px", borderRadius: 99, fontSize: 12, fontWeight: 600,
                      cursor: "pointer", fontFamily: "inherit", transition: "all .15s",
                      background: isActive ? `${color}20` : "var(--surface)",
                      border: `1px solid ${isActive ? `${color}40` : "var(--border)"}`,
                      color: isActive ? textColor : "var(--text-3)",
                    }}>
                      {f === "all" ? "Tous" : f.charAt(0).toUpperCase() + f.slice(1)}
                      <span style={{ marginLeft: 5, opacity: .65 }}>({count})</span>
                    </button>
                  );
                })}
              </div>

              <Panel style={{ padding: "16px 20px" }}>
                <div style={{ maxHeight: "calc(100vh - 290px)", overflowY: "auto", paddingRight: 2 }}>
                  {filteredLogs.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "48px 0" }}>
                      <I n="log" size={32} color="var(--text-3)" style={{ margin: "0 auto 12px", opacity: .25 }} />
                      <p style={{ fontSize: 13, color: "var(--text-3)" }}>
                        {logFilter === "all" ? "Aucun log disponible" : `Aucun log de type "${logFilter}"`}
                      </p>
                    </div>
                  ) : filteredLogs.map(l => <LogRow key={l.id} log={l} full />)}
                </div>
              </Panel>
            </div>
          )}

          {/* ── PARAMÈTRES ────────────────────────────────────────── */}
          {activeTab === "paramètres" && (
            <div className="animate-fade-up">
              <SectionHead title="Paramètres" sub="Configuration générale de File Organizer" />
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                <Panel>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 5, color: "var(--text-1)" }}>Dossiers à surveiller</h3>
                  <p style={{ fontSize: 12.5, color: "var(--text-3)", marginBottom: 18, lineHeight: 1.55 }}>
                    Les nouveaux fichiers détectés dans ces dossiers seront automatiquement triés selon vos règles.
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 10 }}>
                    {settingsForm.watchFolders.map((folder, i) => (
                      <div key={i} style={{ display: "flex", gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <FolderBrowser value={folder} onChange={v => {
                            const f = [...settingsForm.watchFolders]; f[i] = v;
                            setSettingsForm({ ...settingsForm, watchFolders: f });
                          }} placeholder="/chemin/du/dossier" />
                        </div>
                        {settingsForm.watchFolders.length > 1 && (
                          <button onClick={() => setSettingsForm({ ...settingsForm, watchFolders: settingsForm.watchFolders.filter((_, j) => j !== i) })}
                            className="btn btn-danger" style={{ padding: "0 12px" }}>
                            <I n="x" size={13} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setSettingsForm({ ...settingsForm, watchFolders: [...settingsForm.watchFolders, ""] })}
                    className="btn btn-ghost" style={{ border: "1px dashed var(--border)", width: "100%", fontSize: 13 }}>
                    <I n="plus" size={13} /> Ajouter un dossier
                  </button>
                </Panel>

                <Panel>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 5, color: "var(--text-1)" }}>Destination par défaut</h3>
                  <p style={{ fontSize: 12.5, color: "var(--text-3)", marginBottom: 18, lineHeight: 1.55 }}>
                    Les fichiers ne correspondant à aucune règle seront déplacés dans ce dossier.
                  </p>
                  <FolderBrowser value={settingsForm.defaultDestination}
                    onChange={v => setSettingsForm({ ...settingsForm, defaultDestination: v })}
                    placeholder="/chemin/destination" />
                </Panel>

                {/* Scan récursif */}
                <Panel>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 5, color: "var(--text-1)" }}>Scan récursif des sous-dossiers</h3>
                      <p style={{ fontSize: 12.5, color: "var(--text-3)", lineHeight: 1.55 }}>
                        Quand activé, les fichiers dans les sous-dossiers sont aussi traités.
                        Si un sous-dossier contient d'autres dossiers, ils sont explorés également (récursion complète).
                      </p>
                    </div>
                    <Toggle
                      value={settingsForm.recursive}
                      onChange={v => setSettingsForm(f => ({ ...f, recursive: v }))}
                    />
                  </div>

                  {settingsForm.recursive && (
                    <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)", marginBottom: 2 }}>
                            Dossiers exclus du scan
                          </p>
                          <p style={{ fontSize: 12, color: "var(--text-3)" }}>
                            Ces dossiers (et leur contenu) seront ignorés lors du scan récursif.
                          </p>
                        </div>
                        <span style={{
                          fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 99,
                          background: "rgba(217,119,6,.12)", color: "var(--amber)", border: "1px solid rgba(217,119,6,.25)",
                        }}>
                          {settingsForm.excludedFolders.filter(Boolean).length} exclusion(s)
                        </span>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 8 }}>
                        {settingsForm.excludedFolders.length === 0 && (
                          <p style={{ fontSize: 12.5, color: "var(--text-3)", fontStyle: "italic", padding: "8px 0" }}>
                            Aucun dossier exclu — tous les sous-dossiers seront traités.
                          </p>
                        )}
                        {settingsForm.excludedFolders.map((folder, i) => (
                          <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <div style={{ flex: 1 }}>
                              <FolderBrowser
                                value={folder}
                                onChange={v => {
                                  const f = [...settingsForm.excludedFolders];
                                  f[i] = v;
                                  setSettingsForm(s => ({ ...s, excludedFolders: f }));
                                }}
                                placeholder="/chemin/dossier/à/exclure"
                              />
                            </div>
                            <button
                              onClick={() => setSettingsForm(s => ({ ...s, excludedFolders: s.excludedFolders.filter((_, j) => j !== i) }))}
                              className="btn btn-danger"
                              style={{ padding: "0 12px", flexShrink: 0 }}
                            >
                              <I n="trash" size={13} />
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        onClick={() => setSettingsForm(s => ({ ...s, excludedFolders: [...s.excludedFolders, ""] }))}
                        className="btn btn-ghost"
                        style={{ border: "1px dashed var(--border)", width: "100%", fontSize: 13 }}
                      >
                        <I n="plus" size={13} /> Ajouter un dossier exclu
                      </button>
                    </div>
                  )}
                </Panel>

                <Panel>
                  <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 5, color: "var(--text-1)" }}>Démarrage automatique</h3>
                  <p style={{ fontSize: 12.5, color: "var(--text-3)", marginBottom: 18, lineHeight: 1.55 }}>
                    Lance File Organizer au démarrage du PC sans console visible.
                    Une notification système s'affichera si le port 8080 est occupé.
                  </p>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
                    <button onClick={() => triggerStartup("enable")} disabled={loading.startup} className="btn btn-primary" style={{ fontSize: 13 }}>
                      {loading.startup ? <Spin /> : <I n="play" size={13} />} Activer
                    </button>
                    <button onClick={() => triggerStartup("disable")} disabled={loading.startup} className="btn btn-danger" style={{ fontSize: 13 }}>
                      <I n="stop" size={13} /> Désactiver
                    </button>
                  </div>
                  <div style={{ padding: "8px 12px", borderRadius: 7, fontSize: 12, fontFamily: "monospace", background: "var(--bg-2)", border: "1px solid var(--border)", color: "var(--text-3)" }}>
                    npm run enable-startup &nbsp;/&nbsp; npm run disable-startup
                  </div>
                </Panel>

                <button onClick={saveSettings} className="btn btn-primary" style={{ padding: "12px 28px", alignSelf: "flex-start", fontSize: 13 }}>
                  <I n="check" size={14} /> Sauvegarder les paramètres
                </button>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ══ TOAST ═════════════════════════════════════════════════ */}
      {toast && (
        <div className="animate-slide-down" style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 100,
          display: "flex", alignItems: "center", gap: 10, padding: "12px 18px",
          borderRadius: 10, fontSize: 13, fontWeight: 600,
          background: "var(--surface)",
          border: `1px solid ${toast.type === "error" ? "rgba(232,71,95,.3)" : toast.type === "info" ? "var(--border)" : "rgba(14,165,114,.3)"}`,
          color: toast.type === "error" ? "#f87171" : toast.type === "info" ? "var(--text-2)" : "#34d399",
          boxShadow: "0 8px 32px rgba(0,0,0,.45)",
        }}>
          <I n={toast.type === "error" ? "x" : toast.type === "info" ? "info" : "check"} size={14} />
          {toast.msg}
        </div>
      )}

      <RuleModal
        open={ruleModalOpen}
        onClose={() => { setRuleModalOpen(false); setEditingRule(null); }}
        onSave={saveRule}
        rule={editingRule}
        totalRules={rules.length}
      />
    </div>
  );
}
