"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import FolderBrowser from "@/components/FolderBrowser";

/* ─── SVG Icons ─────────────────────────────────────────────── */
const Icons = {
  Eye: ({ closed }) => closed ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  Check: ({ size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  ArrowRight: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  ArrowLeft: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
    </svg>
  ),
  Folder: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  User: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Lock: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  Database: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3"/>
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
    </svg>
  ),
  FileJson: ({ size = 18 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <path d="M10 12a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1 1 1 0 0 1 1 1v1a1 1 0 0 0 1 1"/>
      <path d="M14 18a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1 1 1 0 0 1-1-1v-1a1 1 0 0 0-1-1"/>
    </svg>
  ),
  Spinner: () => (
    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="9" strokeOpacity=".2"/><path d="M21 12a9 9 0 0 0-9-9"/>
    </svg>
  ),
  Plus: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  X: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Monitor: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/>
      <line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
    </svg>
  ),
  Refresh: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  ),
};

/* ─── Password strength ─────────────────────────────────────── */
function getStrength(pwd) {
  if (!pwd) return { n: 0, label: "", color: "" };
  let s = 0;
  if (pwd.length >= 8) s++;
  if (pwd.length >= 12) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  if (s <= 1) return { n: 1, label: "Faible", color: "filled-weak", hex: "#e8475f" };
  if (s === 2) return { n: 2, label: "Moyen",  color: "filled-fair", hex: "#d97706" };
  if (s === 3) return { n: 3, label: "Bon",    color: "filled-good", hex: "#3b82f6" };
  return { n: 4, label: "Excellent", color: "filled-strong", hex: "#0ea572" };
}
function PasswordStrength({ password }) {
  const { n, label, color, hex } = getStrength(password);
  if (!password) return null;
  return (
    <div className="mt-2">
      <div className="strength-bar">
        {[1,2,3,4].map(i => <div key={i} className={`strength-segment ${i <= n ? color : ""}`} />)}
      </div>
      <p className="text-xs mt-1" style={{ color: hex }}>{label}</p>
    </div>
  );
}

/* ─── Step progress bar ─────────────────────────────────────── */
const STEP_LABELS = ["Bienvenue", "Base de données", "Compte", "Dossiers", "Terminé"];

function StepBar({ current }) {
  const pct = ((current - 1) / (STEP_LABELS.length - 1)) * 100;
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-3)", letterSpacing: ".05em", textTransform: "uppercase" }}>
          Étape {current} sur {STEP_LABELS.length}
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--primary-light)" }}>
          {STEP_LABELS[current - 1]}
        </span>
      </div>
      <div style={{ position: "relative", height: 4, borderRadius: 99, background: "rgba(255,255,255,.06)", overflow: "hidden" }}>
        <div style={{
          position: "absolute", left: 0, top: 0, height: "100%",
          width: `${pct}%`,
          background: "linear-gradient(90deg, #5b5fcb, #818cf8)",
          borderRadius: 99,
          transition: "width .5s cubic-bezier(.4,0,.2,1)",
          boxShadow: "0 0 8px rgba(91,95,203,.5)",
        }} />
      </div>
    </div>
  );
}

/* ─── Section header inside card ───────────────────────────── */
function CardHeader({ icon, title, subtitle }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
      {icon && (
        <div style={{
          width: 42, height: 42, borderRadius: 10, flexShrink: 0,
          background: "rgba(91,95,203,.12)", border: "1px solid rgba(91,95,203,.2)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--primary-light)",
        }}>
          {icon}
        </div>
      )}
      <div>
        <h2 style={{ fontSize: 19, fontWeight: 700, color: "var(--text-1)", marginBottom: subtitle ? 3 : 0 }}>{title}</h2>
        {subtitle && <p style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.55 }}>{subtitle}</p>}
      </div>
    </div>
  );
}

/* ─── Field wrapper ─────────────────────────────────────────── */
function Field({ label, error, hint, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      {label && (
        <div style={{
          fontSize: 11.5, fontWeight: 600, textTransform: "uppercase",
          letterSpacing: ".07em", color: "var(--text-3)", marginBottom: 7,
        }}>
          {label}
        </div>
      )}
      {children}
      {error && <p style={{ fontSize: 12, marginTop: 5, color: "#f87171" }}>{error}</p>}
      {hint && !error && <p style={{ fontSize: 12, marginTop: 5, color: "var(--text-3)" }}>{hint}</p>}
    </div>
  );
}

/* ─── DB status pill ────────────────────────────────────────── */
function DbPill({ ok, pulse, label }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "4px 10px", borderRadius: 99, fontSize: 12, fontWeight: 600,
      background: ok ? "rgba(14,165,114,.1)" : "rgba(232,71,95,.1)",
      border: `1px solid ${ok ? "rgba(14,165,114,.25)" : "rgba(232,71,95,.25)"}`,
      color: ok ? "#34d399" : "#f87171",
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: ok ? "#0ea572" : "#e8475f",
        display: "inline-block",
        boxShadow: ok && pulse ? "0 0 0 0 #0ea572" : "none",
        animation: ok && pulse ? "pulseDot 2s ease-in-out infinite" : "none",
      }} />
      {label}
    </span>
  );
}

/* ─── Install console ───────────────────────────────────────── */
function Terminal({ lines }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [lines]);
  if (!lines.length) return null;
  return (
    <div ref={ref} style={{
      background: "rgba(0,0,0,.5)", border: "1px solid rgba(255,255,255,.07)",
      borderRadius: 8, padding: "12px 14px", maxHeight: 200, overflowY: "auto",
      fontFamily: '"JetBrains Mono","Cascadia Code",ui-monospace,monospace',
      fontSize: 12, lineHeight: 1.65, marginTop: 12,
    }}>
      {lines.map((l, i) => (
        <div key={i} style={{
          color: l.t === "error" ? "#f87171" : l.t === "info" ? "#818cf8" : "rgba(255,255,255,.5)",
          paddingLeft: l.t === "output" ? 14 : 0,
        }}>
          {l.t === "info" ? `› ${l.m}` : l.t === "error" ? `✗ ${l.m}` : l.m}
        </div>
      ))}
    </div>
  );
}

/* ─── Alert box ─────────────────────────────────────────────── */
function Alert({ type = "error", children }) {
  const conf = {
    error:   { bg: "rgba(232,71,95,.08)",   border: "rgba(232,71,95,.2)",   color: "#f87171" },
    warning: { bg: "rgba(217,119,6,.08)",   border: "rgba(217,119,6,.2)",   color: "#fbbf24" },
    info:    { bg: "rgba(91,95,203,.08)",   border: "rgba(91,95,203,.2)",   color: "#818cf8" },
    success: { bg: "rgba(14,165,114,.08)",  border: "rgba(14,165,114,.2)",  color: "#34d399" },
  }[type];
  return (
    <div style={{
      background: conf.bg, border: `1px solid ${conf.border}`,
      color: conf.color, borderRadius: 8, padding: "11px 14px",
      fontSize: 13, lineHeight: 1.55, marginBottom: 16,
    }}>
      {children}
    </div>
  );
}

/* ─── Nav footer (back button) ─────────────────────────────── */
function BackBtn({ onClick }) {
  return (
    <button onClick={onClick} className="btn btn-ghost" style={{ fontSize: 13 }}>
      <Icons.ArrowLeft /> Retour
    </button>
  );
}

/* ─── Modal identifiants administrateur Windows ───────────────── */
function AdminCredentialsModal({ open, onClose, onSubmit, loading, error, defaultUsername }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    if (open) {
      setUsername(defaultUsername || "");
      setPassword("");
      setShowPwd(false);
    }
  }, [open, defaultUsername]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    onSubmit({ username: username.trim(), password });
  };

  if (!open) return null;

  const modalContent = (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-modal-title"
    >
      <div
        className="animate-scale-in card-glass"
        style={{ width: "min(400px, 92vw)", padding: 28 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 id="admin-modal-title" style={{ fontSize: 17, fontWeight: 700, color: "var(--text-1)" }}>
            Identifiants administrateur
          </h2>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: 6, minWidth: "auto" }} aria-label="Fermer">
            <Icons.X />
          </button>
        </div>
        <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 20, lineHeight: 1.5 }}>
          Cette action nécessite des droits administrateur. Entrez le nom d&apos;utilisateur et le mot de passe de votre session Windows.
        </p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label className="label">Utilisateur Windows</label>
            <div className="input-wrapper">
              <span className="input-icon"><Icons.User /></span>
              <input
                type="text"
                className="input input-with-icon"
                placeholder="Ex: PC-HACK"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                disabled={loading}
              />
            </div>
          </div>
          <div style={{ marginBottom: 20 }}>
            <label className="label">Mot de passe</label>
            <div className="input-wrapper">
              <span className="input-icon"><Icons.Lock /></span>
              <input
                type={showPwd ? "text" : "password"}
                className="input input-with-icon input-with-icon-right"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className="input-icon-right"
                onClick={() => setShowPwd(!showPwd)}
                aria-label={showPwd ? "Masquer" : "Afficher"}
              >
                <Icons.Eye closed={!showPwd} />
              </button>
            </div>
          </div>
          {error && (
            <div style={{ marginBottom: 16 }}>
              <Alert type="error">{error}</Alert>
            </div>
          )}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} className="btn btn-outline" disabled={loading}>
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !username.trim() || !password}
            >
              {loading ? <><Icons.Spinner /> Exécution...</> : "Exécuter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

/* ─── Modal réinitialisation mot de passe PostgreSQL ───────────── */
function ResetPasswordModal({ open, onClose, onDone }) {
  const handleDownload = () => {
    window.open("/api/system/postgres?action=reset-password-script", "_blank");
  };

  if (!open) return null;

  const modalContent = (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-pwd-modal-title"
    >
      <div
        className="animate-scale-in card-glass"
        style={{ width: "min(440px, 92vw)", padding: 28 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 id="reset-pwd-modal-title" style={{ fontSize: 17, fontWeight: 700, color: "var(--text-1)" }}>
            Réinitialiser le mot de passe PostgreSQL
          </h2>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: 6, minWidth: "auto" }} aria-label="Fermer">
            <Icons.X />
          </button>
        </div>
        <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 16, lineHeight: 1.5 }}>
          Si vous avez oublié le mot de passe de l&apos;utilisateur <strong>postgres</strong>, téléchargez le script ci-dessous et exécutez-le en tant qu&apos;administrateur.
        </p>
        <ol style={{ fontSize: 12, color: "var(--text-2)", marginBottom: 20, paddingLeft: 20, lineHeight: 1.8 }}>
          <li>Téléchargez le script PowerShell</li>
          <li>Clic droit sur le fichier → <strong>Exécuter en tant qu&apos;administrateur</strong></li>
          <li>Entrez le nouveau mot de passe lorsque demandé</li>
          <li>Revenez ici et créez la base avec le nouveau mot de passe</li>
        </ol>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button type="button" onClick={onClose} className="btn btn-outline">
            Annuler
          </button>
          <button type="button" onClick={handleDownload} className="btn btn-primary">
            Télécharger le script
          </button>
          <button type="button" onClick={onDone} className="btn btn-outline">
            J&apos;ai réinitialisé, continuer
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

/* ─── Modal mot de passe PostgreSQL ───────────────────────────── */
function PostgresPasswordModal({ open, onClose, onSubmit, loading, error, dbStatus, onResetPassword }) {
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    if (open) {
      setPassword("");
      setShowPwd(false);
    }
  }, [open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!password) return;
    onSubmit(password);
  };

  if (!open) return null;

  const modalContent = (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pg-pwd-modal-title"
    >
      <div
        className="animate-scale-in card-glass"
        style={{ width: "min(400px, 92vw)", padding: 28 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 id="pg-pwd-modal-title" style={{ fontSize: 17, fontWeight: 700, color: "var(--text-1)" }}>
            Mot de passe PostgreSQL
          </h2>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: 6, minWidth: "auto" }} aria-label="Fermer">
            <Icons.X />
          </button>
        </div>
        <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 20, lineHeight: 1.5 }}>
          L&apos;utilisateur <strong>postgres</strong> requiert un mot de passe pour se connecter. Entrez-le ci-dessous (celui défini lors de l&apos;installation de PostgreSQL).
        </p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label className="label">Mot de passe utilisateur postgres</label>
            <div className="input-wrapper">
              <span className="input-icon"><Icons.Lock /></span>
              <input
                type={showPwd ? "text" : "password"}
                className="input input-with-icon input-with-icon-right"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
              />
              <button
                type="button"
                className="input-icon-right"
                onClick={() => setShowPwd(!showPwd)}
                aria-label={showPwd ? "Masquer" : "Afficher"}
              >
                <Icons.Eye closed={!showPwd} />
              </button>
            </div>
          </div>
          {error && (
            <div style={{ marginBottom: 16 }}>
              <Alert type="error">{error}</Alert>
            </div>
          )}
          {dbStatus?.platform === "win32" && onResetPassword && (
            <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 12 }}>
              <button
                type="button"
                onClick={onResetPassword}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary-light)", padding: 0, textDecoration: "underline" }}
              >
                Mot de passe oublié ? Réinitialiser
              </button>
            </p>
          )}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} className="btn btn-outline" disabled={loading}>
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !password}
            >
              {loading ? <><Icons.Spinner /> Création...</> : "Créer la base"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

/* ─── Modal Plus d'options PostgreSQL ───────────────────────── */
function PostgresMoreOptionsModal({ open, onClose, onInstall, loading, dbStatus, onResetPassword }) {
  const [version, setVersion] = useState("16");
  const [reinstall, setReinstall] = useState(false);

  useEffect(() => {
    if (open) {
      setVersion("16");
      setReinstall(!!dbStatus?.installed);
    }
  }, [open, dbStatus?.installed]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onInstall({ version, reinstall });
  };

  if (!open) return null;

  const canInstallBrew = dbStatus?.platform === "darwin" && dbStatus?.hasBrew;
  const isWindows = dbStatus?.platform === "win32";

  const modalContent = (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="more-options-modal-title"
    >
      <div
        className="animate-scale-in card-glass"
        style={{ width: "min(420px, 92vw)", padding: 28 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 id="more-options-modal-title" style={{ fontSize: 17, fontWeight: 700, color: "var(--text-1)" }}>
            Plus d&apos;options — PostgreSQL
          </h2>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: 6, minWidth: "auto" }} aria-label="Fermer">
            <Icons.X />
          </button>
        </div>
        <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 20, lineHeight: 1.5 }}>
          Installez ou réinstallez une version spécifique de PostgreSQL.
        </p>

        {isWindows ? (
          <div>
            <div style={{ marginBottom: 16 }}>
              <label className="label">Version PostgreSQL</label>
              <select
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="input"
                style={{ cursor: "pointer" }}
                disabled={loading}
              >
                <option value="14">PostgreSQL 14</option>
                <option value="15">PostgreSQL 15</option>
                <option value="16">PostgreSQL 16 (recommandé)</option>
                <option value="17">PostgreSQL 17</option>
                <option value="18">PostgreSQL 18</option>
              </select>
            </div>
            {dbStatus?.installed && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "var(--text-2)" }}>
                  <input type="checkbox" checked={reinstall} onChange={(e) => setReinstall(e.target.checked)} disabled={loading} />
                  Réinstaller (PostgreSQL est déjà installé)
                </label>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              <div style={{ padding: 12, borderRadius: 8, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)" }}>
                <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 8 }}>
                  <strong style={{ color: "var(--text-2)" }}>Option 1 — Télécharger l&apos;installateur</strong><br />
                  Téléchargement direct du fichier .exe (recommandé si winget bloque).
                </p>
                <a
                  href={`/api/system/postgres?action=download&version=${version}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                  style={{ width: "100%", textAlign: "center" }}
                >
                  Télécharger postgresql-{version}-windows-x64.exe
                </a>
              </div>
              <div style={{ padding: 12, borderRadius: 8, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)" }}>
                <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 8 }}>
                  <strong style={{ color: "var(--text-2)" }}>Option 2 — Installer par commande</strong><br />
                  Via winget ou Chocolatey. Peut rester bloqué sur « Démarrage du package... ».
                </p>
                <form onSubmit={handleSubmit} style={{ margin: 0 }}>
                  <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%" }}>
                    {loading ? <><Icons.Spinner /> Installation...</> : (reinstall ? "Réinstaller via winget/choco" : "Installer via winget/choco")}
                  </button>
                </form>
              </div>
              {dbStatus?.installed && (
                <div style={{ padding: 12, borderRadius: 8, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)" }}>
                  <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 8 }}>
                    <strong style={{ color: "var(--text-2)" }}>Mot de passe oublié ?</strong><br />
                    Téléchargez un script pour réinitialiser le mot de passe de l&apos;utilisateur postgres.
                  </p>
                  <button
                    type="button"
                    onClick={() => { onClose(); onResetPassword?.(); }}
                    className="btn btn-outline"
                    style={{ width: "100%", textAlign: "center" }}
                  >
                    Réinitialiser le mot de passe
                  </button>
                </div>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="button" onClick={onClose} className="btn btn-ghost">
                Fermer
              </button>
            </div>
          </div>
        ) : dbStatus?.platform === "linux" ? (
          <div>
            <Alert type="info">
              Sur Linux, utilisez le bouton principal « Installer » pour installer PostgreSQL via apt/yum.
              La version est celle fournie par votre distribution.
            </Alert>
          </div>
        ) : canInstallBrew ? (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label className="label">Version PostgreSQL</label>
              <select
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="input"
                style={{ cursor: "pointer" }}
                disabled={loading}
              >
                <option value="14">PostgreSQL 14</option>
                <option value="15">PostgreSQL 15</option>
                <option value="16">PostgreSQL 16 (recommandé)</option>
                <option value="17">PostgreSQL 17</option>
                <option value="18">PostgreSQL 18</option>
              </select>
            </div>
            {dbStatus?.installed && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "var(--text-2)" }}>
                  <input
                    type="checkbox"
                    checked={reinstall}
                    onChange={(e) => setReinstall(e.target.checked)}
                    disabled={loading}
                  />
                  Réinstaller (PostgreSQL est déjà installé)
                </label>
              </div>
            )}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" onClick={onClose} className="btn btn-outline" disabled={loading}>
                Annuler
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? <><Icons.Spinner /> Installation...</> : (reinstall ? "Réinstaller" : "Installer")}
              </button>
            </div>
          </form>
        ) : (
          <div>
            <Alert type="warning">
              Homebrew est requis pour l&apos;installation automatique sur macOS.
              <a href="https://brew.sh" target="_blank" rel="noopener noreferrer" style={{ display: "block", marginTop: 8, color: "var(--primary-light)", textDecoration: "underline" }}>
                Installer Homebrew →
              </a>
            </Alert>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */
export default function SetupPage() {
  const router = useRouter();
  const [step, setStep]       = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});
  const [shake, setShake]     = useState(false);

  const [pwaPrompt, setPwaPrompt]       = useState(null);
  const [pwaInstalled, setPwaInstalled] = useState(false);
  const [showPwd, setShowPwd]     = useState(false);
  const [showConf, setShowConf]   = useState(false);

  const [form, setFormState] = useState({
    siteName: "File Organizer",
    adminUsername: "",
    adminPassword: "",
    confirmPassword: "",
    watchFolders: [""],
    defaultDestination: "",
  });

  /* ── DB step state ─────────────────────────────────────────── */
  const [dbStatus,  setDbStatus]  = useState(null);
  const [dbChecking,setDbChecking]= useState(false);
  const [dbPhase,   setDbPhase]   = useState("idle"); // idle|offer-install|offer-start|offer-create|installing|creating|done-pg|done-json|error
  const [dbMode,    setDbMode]    = useState(null);   // "prisma"|"json"
  const [dbError,   setDbError]   = useState("");
  const [dbInfo,    setDbInfo]    = useState("");
  const [installLog,setInstallLog]= useState([]);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminModalError, setAdminModalError] = useState("");
  const [showPostgresPwdModal, setShowPostgresPwdModal] = useState(false);
  const [postgresPwdModalError, setPostgresPwdModalError] = useState("");
  const [showMoreOptionsModal, setShowMoreOptionsModal] = useState(false);
  const [showResetPwdModal, setShowResetPwdModal] = useState(false);

  /* ── PWA ─────────────────────────────────────────────────── */
  useEffect(() => {
    const h = e => { e.preventDefault(); setPwaPrompt(e); };
    window.addEventListener("beforeinstallprompt", h);
    if (window.matchMedia("(display-mode: standalone)").matches) setPwaInstalled(true);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, []);

  async function installPWA() {
    if (!pwaPrompt) return;
    pwaPrompt.prompt();
    const { outcome } = await pwaPrompt.userChoice;
    if (outcome === "accepted") { setPwaInstalled(true); setPwaPrompt(null); }
  }

  /* ── Form helpers ────────────────────────────────────────── */
  function set(k, v) {
    setFormState(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => ({ ...e, [k]: "" }));
  }
  function updateFolder(i, v) { const f = [...form.watchFolders]; f[i] = v; set("watchFolders", f); }
  function shake_() { setShake(true); setTimeout(() => setShake(false), 400); }

  /* ── DB check ────────────────────────────────────────────── */
  const checkDb = useCallback(async () => {
    setDbChecking(true); setDbError("");
    try {
      const r  = await fetch("/api/system/postgres?action=check");
      const st = await r.json();
      setDbStatus(st);
      if (st.running)           setDbPhase("offer-create");
      else if (st.installed)    setDbPhase("offer-start");
      else                      setDbPhase("offer-install");
    } catch {
      setDbError("Impossible de vérifier PostgreSQL"); setDbPhase("offer-install");
    } finally {
      setDbChecking(false);
    }
  }, []);

  useEffect(() => { if (step === 2) checkDb(); }, [step, checkDb]);

  /* ── DB actions ──────────────────────────────────────────── */
  async function handleStart(credentials = null) {
    setLoading(true); setDbError(""); setAdminModalError("");
    try {
      const body = { action: "start" };
      if (credentials?.username && credentials?.password) {
        body.username = credentials.username;
        body.password = credentials.password;
      }
      const r = await fetch("/api/system/postgres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (data.ok) {
        setShowAdminModal(false);
        await checkDb();
      } else {
        if (data.requiresAdmin && dbStatus?.platform === "win32" && !credentials) {
          setShowAdminModal(true);
          setAdminModalError("");
        } else {
          setDbError(data.error ?? "Impossible de démarrer PostgreSQL");
          if (credentials) {
            setAdminModalError(data.error ?? "Identifiants incorrects.");
          }
        }
      }
    } catch {
      setDbError("Erreur de connexion");
      if (credentials) setAdminModalError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  function handleAdminModalSubmit(creds) {
    handleStart(creds);
  }

  async function handleInstall(opts = {}) {
    const { version, reinstall } = opts;
    setDbPhase("installing"); setInstallLog([]); setDbError("");
    if (opts.version !== undefined) setShowMoreOptionsModal(false);
    try {
      const body = { action: "install" };
      if (version) body.version = version;
      if (reinstall) body.reinstall = true;
      const resp = await fetch("/api/system/postgres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const reader = resp.body.getReader();
      const dec    = new TextDecoder();
      let buf      = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const parts = buf.split("\n\n"); buf = parts.pop() ?? "";
        for (const p of parts) {
          const line = p.replace(/^data: /,"").trim(); if (!line) continue;
          try {
            const ev = JSON.parse(line);
            const push = (t, m) => setInstallLog(l => [...l, {t, m}]);
            if (ev.step === "start")    push("info",   ev.message);
            if (ev.step === "progress") push("info",   ev.message);
            if (ev.step === "output")   push("output", ev.message);
            if (ev.step === "done")     { push("info", ev.message); setDbPhase("offer-create"); await checkDb(); }
            if (ev.step === "error")    { push("error", ev.message); setDbError(ev.message); setDbPhase("offer-install"); }
            if (ev.step === "manual")   { push("error", ev.message); setDbError(ev.message); setDbPhase("offer-install"); }
          } catch {}
        }
      }
    } catch (e) { setDbError(e.message); setDbPhase("offer-install"); }
  }

  async function handleCreateDb(postgresPassword = null) {
    setDbPhase("creating"); setDbError(""); setPostgresPwdModalError("");
    try {
      const body = { action: "create-db" };
      if (postgresPassword) body.postgresPassword = postgresPassword;
      const r = await fetch("/api/system/postgres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (data.ok) {
        setShowPostgresPwdModal(false);
        setDbInfo(data.message ?? "Base de données prête");
        setDbMode("prisma"); setDbPhase("done-pg");
      } else {
        if (data.requiresPostgresPassword) {
          setShowPostgresPwdModal(true);
          setPostgresPwdModalError("");
          setDbPhase("offer-create");
        } else {
          setDbError(data.error ?? "Erreur lors de la création");
          setDbPhase("offer-create");
          if (postgresPassword) {
            setShowPostgresPwdModal(true);
            setPostgresPwdModalError(data.error ?? "Mot de passe incorrect.");
          }
        }
      }
    } catch (e) {
      setDbError(e.message);
      setDbPhase("offer-create");
      if (postgresPassword) {
        setShowPostgresPwdModal(true);
        setPostgresPwdModalError(e.message);
      }
    }
  }

  async function handleUseJson() {
    setLoading(true);
    try {
      await fetch("/api/system/postgres", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({action:"set-json"}) });
    } catch {}
    setDbMode("json"); setDbPhase("done-json"); setLoading(false);
  }

  /* ── Navigation ──────────────────────────────────────────── */
  function validateAccount() {
    const e = {};
    if (!form.adminUsername.trim())                        e.adminUsername = "Identifiant requis";
    else if (form.adminUsername.trim().length < 2)         e.adminUsername = "Minimum 2 caractères";
    else if (!/^[a-zA-Z0-9_.\-]+$/.test(form.adminUsername)) e.adminUsername = "Caractères autorisés : lettres, chiffres, _ . -";
    if (!form.adminPassword)                               e.adminPassword = "Mot de passe requis";
    else if (form.adminPassword.length < 6)                e.adminPassword = "Minimum 6 caractères";
    if (form.adminPassword !== form.confirmPassword)       e.confirmPassword = "Les mots de passe ne correspondent pas";
    setErrors(e);
    return !Object.keys(e).length;
  }
  function validateFolders() {
    const e = {};
    if (!form.watchFolders.filter(Boolean).length) e.watchFolders = "Au moins un dossier requis";
    if (!form.defaultDestination)                  e.defaultDestination = "Destination par défaut requise";
    setErrors(e);
    return !Object.keys(e).length;
  }

  function goNext(target) {
    if (target === 3 && !dbMode) { setErrors({ db: "Choisissez un mode de stockage pour continuer" }); shake_(); return; }
    if (target === 4 && !validateAccount()) { shake_(); return; }
    setErrors({}); setStep(target);
  }

  async function handleFinish() {
    if (!validateFolders()) { shake_(); return; }
    setLoading(true);
    try {
      const res  = await fetch("/api/config", {
        method: "POST", headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          siteName: form.siteName,
          adminUsername: form.adminUsername.trim(),
          adminPassword: form.adminPassword,
          watchFolders: form.watchFolders.filter(Boolean),
          defaultDestination: form.defaultDestination,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErrors({ global: data.error }); shake_(); return; }
      setStep(5);
    } catch { setErrors({ global: "Erreur de connexion" }); }
    finally { setLoading(false); }
  }

  async function goToDashboard() {
    const r = await fetch("/api/auth/login", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ username: form.adminUsername.trim(), password: form.adminPassword }),
    });
    if (r.ok) router.push("/dashboard");
  }

  /* ─────────────────────────────────────────────────────────────
     RENDER
  ───────────────────────────────────────────────────────────── */
  return (
    <>
      <div className="mesh-bg" />

      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center",
        justifyContent: "center", padding: "24px 16px",
      }}>
        <div style={{ width: "100%", maxWidth: 520 }} className="animate-fade-up">

          {/* ── Logo & title ───────────────────────────────────── */}
          <div style={{ textAlign: "center", marginBottom: 36 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 52, height: 52, borderRadius: 14, marginBottom: 14,
              background: "linear-gradient(135deg, #5b5fcb, #7c3aed)",
              boxShadow: "0 8px 28px rgba(91,95,203,.4)",
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                <line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/>
              </svg>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text-1)", marginBottom: 4 }}>
              File Organizer
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-3)" }}>Installation & configuration</p>
          </div>

          {/* ── Card ──────────────────────────────────────────── */}
          <div className={`card-glass ${shake ? "animate-shake" : ""}`}>
            <StepBar current={step} />

            {/* ════════════════════════════════════════════
                ÉTAPE 1 — Bienvenue
            ════════════════════════════════════════════ */}
            {step === 1 && (
              <div className="animate-fade-up">
                <CardHeader
                  title="Bienvenue !"
                  subtitle="Quelques étapes suffisent pour configurer votre organisateur de fichiers automatique."
                />

                {/* PWA install */}
                {pwaInstalled ? (
                  <div style={{
                    border: "1px solid rgba(14,165,114,.2)", borderRadius: 10,
                    padding: "12px 16px", marginBottom: 22,
                    background: "rgba(14,165,114,.06)",
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <span style={{ color: "#0ea572" }}><Icons.Check /></span>
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#34d399" }}>Application déjà installée</span>
                  </div>
                ) : pwaPrompt ? (
                  <div style={{ marginBottom: 22 }}>
                    <button onClick={installPWA} className="btn btn-secondary" style={{ width: "100%", padding: "11px 18px" }}>
                      <Icons.Monitor /> Installer comme application de bureau
                    </button>
                  </div>
                ) : null}

                <Field label="Nom de l'application">
                  <input
                    type="text" value={form.siteName}
                    onChange={e => set("siteName", e.target.value)}
                    className="input" placeholder="File Organizer" maxLength={40}
                  />
                </Field>

                <button onClick={() => goNext(2)} className="btn btn-primary"
                  style={{ width: "100%", padding: "12px 20px", marginTop: 4 }}>
                  Commencer <Icons.ArrowRight />
                </button>
              </div>
            )}

            {/* ════════════════════════════════════════════
                ÉTAPE 2 — Base de données
            ════════════════════════════════════════════ */}
            {step === 2 && (
              <div className="animate-fade-up">
                <CardHeader
                  icon={<Icons.Database />}
                  title="Base de données"
                  subtitle="Choisissez comment vos données seront stockées."
                />

                {errors.db && <Alert type="error">{errors.db}</Alert>}

                {/* Loading */}
                {dbChecking && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 0", color: "var(--text-2)", fontSize: 13 }}>
                    <Icons.Spinner /> Vérification de PostgreSQL...
                  </div>
                )}

                {/* Erreur non-critique (exclure offer-create qui a son propre affichage) */}
                {!dbChecking && dbError && dbPhase !== "installing" && dbPhase !== "creating" && dbPhase !== "offer-create" && (
                  <Alert type="error">{dbError}</Alert>
                )}

                {/* ─ Statut PostgreSQL affiché en haut des phases actives ─ */}
                {!dbChecking && dbStatus && !["done-pg","done-json","idle","creating","installing"].includes(dbPhase) && (
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 14px", borderRadius: 8, marginBottom: 20,
                    background: "var(--bg-2)", border: "1px solid var(--border)",
                  }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-1)", marginBottom: 2 }}>PostgreSQL</p>
                      {dbStatus.version && <p style={{ fontSize: 11, color: "var(--text-3)", fontFamily: "monospace" }}>{dbStatus.version}</p>}
                    </div>
                    <DbPill
                      ok={dbStatus.running}
                      pulse={dbStatus.running}
                      label={dbStatus.running ? "Actif" : dbStatus.installed ? "Arrêté" : "Non installé"}
                    />
                  </div>
                )}

                {/* ─ PHASE : offer-install ─ */}
                {!dbChecking && dbPhase === "offer-install" && (
                  <div>
                    <p style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 16, lineHeight: 1.6 }}>
                      PostgreSQL n'est pas détecté. Choisissez une option :
                    </p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                      {/* PostgreSQL card */}
                      <div style={{
                        border: "1.5px solid rgba(91,95,203,.3)", borderRadius: 10,
                        padding: "18px 16px", background: "rgba(91,95,203,.05)",
                      }}>
                        <div style={{ color: "var(--primary-light)", marginBottom: 10 }}><Icons.Database size={22} /></div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", marginBottom: 4 }}>PostgreSQL</p>
                        <p style={{ fontSize: 11.5, color: "var(--text-2)", lineHeight: 1.55, marginBottom: 12 }}>
                          Recommandé — performant, robuste, prêt pour des milliers de fichiers.
                        </p>
                        <button
                          onClick={() => handleInstall(dbStatus?.platform === "win32" ? { version: "16" } : undefined)}
                          className="btn btn-primary"
                          style={{ width: "100%", padding: "9px 14px", fontSize: 12 }}
                          disabled={dbStatus?.platform === "darwin" && !dbStatus?.hasBrew}
                        >
                          {dbStatus?.platform === "darwin"
                            ? dbStatus?.hasBrew ? "Installer via Homebrew" : "Homebrew requis"
                            : dbStatus?.platform === "win32" ? "Installer (winget/Chocolatey)" : "Installer"}
                        </button>
                        {dbStatus?.platform === "darwin" && !dbStatus?.hasBrew && (
                          <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 7, textAlign: "center" }}>
                            Installez{" "}
                            <a href="https://brew.sh" target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary-light)", textDecoration: "underline" }}>Homebrew</a>
                            {" "}puis &nbsp;<button onClick={checkDb} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--primary-light)",fontSize:11,padding:0,textDecoration:"underline" }}>revérifier</button>
                          </p>
                        )}
                        {dbStatus?.platform === "win32" && (
                          <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 7, textAlign: "center" }}>
                            Ou{" "}
                            <button onClick={() => setShowMoreOptionsModal(true)} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--primary-light)",fontSize:11,padding:0,textDecoration:"underline" }}>
                              choisir une version spécifique
                            </button>
                            {" · "}
                            <a href="https://www.postgresql.org/download/windows/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary-light)", textDecoration: "underline" }}>Télécharger manuellement</a>
                          </p>
                        )}
                      </div>

                      {/* JSON card */}
                      <div style={{
                        border: "1.5px solid var(--border)", borderRadius: 10,
                        padding: "18px 16px", background: "rgba(255,255,255,.02)",
                      }}>
                        <div style={{ color: "var(--text-2)", marginBottom: 10 }}><Icons.FileJson size={22} /></div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)", marginBottom: 4 }}>JSON local</p>
                        <p style={{ fontSize: 11.5, color: "var(--text-2)", lineHeight: 1.55, marginBottom: 12 }}>
                          Sans installation — données stockées en fichiers locaux.
                        </p>
                        <button
                          onClick={handleUseJson}
                          disabled={loading}
                          className="btn btn-outline"
                          style={{ width: "100%", padding: "9px 14px", fontSize: 12 }}
                        >
                          {loading ? <Icons.Spinner /> : "Continuer en JSON"}
                        </button>
                      </div>
                    </div>
                    <button onClick={checkDb} className="btn btn-ghost" style={{ width: "100%", fontSize: 12, gap: 5 }}>
                      <Icons.Refresh /> Revérifier
                    </button>
                  </div>
                )}

                {/* ─ PHASE : offer-start ─ */}
                {!dbChecking && dbPhase === "offer-start" && (
                  <div>
                    <Alert type="warning">
                      PostgreSQL est installé mais le service n'est pas démarré.
                    </Alert>
                    {dbError && dbError.includes("net start") && (
                      <div style={{
                        marginTop: 12, padding: "12px 14px", borderRadius: 8,
                        background: "var(--bg-2)", border: "1px solid var(--border)",
                        fontFamily: "monospace", fontSize: 12, color: "var(--text-2)",
                      }}>
                        <p style={{ marginBottom: 6, fontSize: 11, color: "var(--text-3)" }}>Commande à exécuter en tant qu'administrateur :</p>
                        <code style={{ wordBreak: "break-all" }}>{dbError.match(/net start \S+/)?.[0] || "net start postgresql-x64-16"}</code>
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
                      <button onClick={() => handleStart()} disabled={loading} className="btn btn-primary" style={{ flex: 1 }}>
                        {loading ? <><Icons.Spinner /> Démarrage...</> : "Démarrer PostgreSQL (UAC)"}
                      </button>
                      <button onClick={handleUseJson} disabled={loading} className="btn btn-outline">
                        Utiliser JSON
                      </button>
                    </div>
                    {dbStatus?.platform === "win32" && (
                      <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 10 }}>
                        Un clic sur « Démarrer » ouvrira une fenêtre UAC — validez pour lancer le service.
                        {" "}
                        <button
                          type="button"
                          onClick={() => setShowAdminModal(true)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary-light)", fontSize: 11, padding: 0, textDecoration: "underline" }}
                        >
                          Ou entrer des identifiants administrateur
                        </button>
                      </p>
                    )}
                  </div>
                )}

                {/* ─ PHASE : offer-create ─ */}
                {!dbChecking && dbPhase === "offer-create" && (
                  <div>
                    <Alert type="success">
                      PostgreSQL est actif et prêt. La base <strong>structureFolderDB</strong> va être créée et initialisée automatiquement.
                    </Alert>
                    {dbError && (
                      <div style={{ marginBottom: 12 }}>
                        <Alert type="error">
                          {dbError}
                          {dbError.includes("connecter") && (
                            <span style={{ display: "block", marginTop: 8 }}>
                              <button
                                type="button"
                                onClick={() => { setShowPostgresPwdModal(true); setDbError(""); }}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary-light)", fontSize: 12, padding: 0, textDecoration: "underline" }}
                              >
                                Entrer le mot de passe PostgreSQL
                              </button>
                            </span>
                          )}
                        </Alert>
                      </div>
                    )}
                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={() => handleCreateDb()} className="btn btn-primary" style={{ flex: 1, padding: "11px 18px" }}>
                        <Icons.Database size={15} /> Créer la base de données
                      </button>
                      <button onClick={handleUseJson} className="btn btn-outline">
                        Utiliser JSON
                      </button>
                    </div>
                    {dbStatus?.platform === "win32" && (
                      <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 10 }}>
                        <button
                          type="button"
                          onClick={() => setShowPostgresPwdModal(true)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--primary-light)", fontSize: 11, padding: 0, textDecoration: "underline" }}
                        >
                          L&apos;utilisateur postgres a un mot de passe ?
                        </button>
                      </p>
                    )}
                  </div>
                )}

                {/* ─ PHASE : installing ─ */}
                {dbPhase === "installing" && (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, color: "var(--primary-light)", fontSize: 13, fontWeight: 600 }}>
                      <Icons.Spinner /> Installation en cours...
                    </div>
                    <p style={{ fontSize: 12, color: "var(--text-3)", marginBottom: 2 }}>Cela peut prendre quelques minutes. Ne fermez pas la fenêtre.</p>
                    <Terminal lines={installLog} />
                  </div>
                )}

                {/* ─ PHASE : creating ─ */}
                {dbPhase === "creating" && (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 0", gap: 12 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: "50%",
                      border: "2px solid rgba(91,95,203,.3)", borderTopColor: "var(--primary)",
                      animation: "spin .8s linear infinite",
                    }} />
                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-1)" }}>Création de la base de données...</p>
                    <p style={{ fontSize: 12, color: "var(--text-3)" }}>Initialisation du schéma Prisma</p>
                  </div>
                )}

                {/* ─ PHASE : done-pg ─ */}
                {dbPhase === "done-pg" && (
                  <div className="animate-scale-in">
                    <div style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "16px 18px", borderRadius: 10, marginBottom: 20,
                      background: "rgba(14,165,114,.08)", border: "1px solid rgba(14,165,114,.2)",
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: "rgba(14,165,114,.15)", border: "1.5px solid rgba(14,165,114,.4)",
                        display: "flex", alignItems: "center", justifyContent: "center", color: "#0ea572", flexShrink: 0,
                      }}>
                        <Icons.Check size={16} />
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#34d399" }}>Base de données prête</p>
                        <p style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2 }}>{dbInfo}</p>
                      </div>
                    </div>
                    <button onClick={() => goNext(3)} className="btn btn-primary" style={{ width: "100%", padding: "12px 20px" }}>
                      Continuer <Icons.ArrowRight />
                    </button>
                  </div>
                )}

                {/* ─ PHASE : done-json ─ */}
                {dbPhase === "done-json" && (
                  <div className="animate-scale-in">
                    <div style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "16px 18px", borderRadius: 10, marginBottom: 12,
                      background: "rgba(14,165,114,.06)", border: "1px solid rgba(14,165,114,.15)",
                    }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: "50%",
                        background: "rgba(14,165,114,.12)", border: "1.5px solid rgba(14,165,114,.3)",
                        display: "flex", alignItems: "center", justifyContent: "center", color: "#0ea572", flexShrink: 0,
                      }}>
                        <Icons.Check size={16} />
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#34d399" }}>Mode JSON activé</p>
                        <p style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2 }}>Données stockées dans data/config.json</p>
                      </div>
                    </div>
                    <Alert type="warning">Vous pourrez migrer vers PostgreSQL depuis les paramètres.</Alert>
                    <button onClick={() => goNext(3)} className="btn btn-primary" style={{ width: "100%", padding: "12px 20px" }}>
                      Continuer <Icons.ArrowRight />
                    </button>
                  </div>
                )}

                {/* Footer retour + Plus d'options */}
                {!dbChecking && !["done-pg","done-json","installing","creating"].includes(dbPhase) && (
                  <div style={{ marginTop: 20, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,.05)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                    <BackBtn onClick={() => setStep(1)} />
                    <button
                      type="button"
                      onClick={() => setShowMoreOptionsModal(true)}
                      className="btn btn-ghost"
                      style={{ fontSize: 12, gap: 5 }}
                    >
                      <Icons.Plus /> Plus d&apos;options
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ════════════════════════════════════════════
                ÉTAPE 3 — Compte admin
            ════════════════════════════════════════════ */}
            {step === 3 && (
              <div className="animate-fade-up">
                <CardHeader
                  icon={<Icons.User />}
                  title="Créer votre compte"
                  subtitle="Identifiants pour accéder au tableau de bord. Choisissez un mot de passe solide."
                />

                {/* Badge mode */}
                <div style={{ marginBottom: 22 }}>
                  {dbMode === "prisma" ? (
                    <span className="badge badge-blue">
                      <Icons.Database size={11} /> Compte PostgreSQL — structureFolderDB
                    </span>
                  ) : (
                    <span className="badge badge-green">
                      <Icons.FileJson size={11} /> Compte JSON local
                    </span>
                  )}
                </div>

                {errors.global && <Alert type="error">{errors.global}</Alert>}

                <Field label="Identifiant" error={errors.adminUsername} hint="Lettres, chiffres, _ . - uniquement">
                  <div className="input-wrapper">
                    <span className="input-icon"><Icons.User /></span>
                    <input
                      type="text" value={form.adminUsername}
                      onChange={e => set("adminUsername", e.target.value)}
                      className={`input input-with-icon ${errors.adminUsername ? "error" : ""}`}
                      placeholder="admin" autoComplete="username" autoFocus
                    />
                  </div>
                </Field>

                <Field label="Mot de passe" error={errors.adminPassword}>
                  <div className="input-wrapper">
                    <span className="input-icon"><Icons.Lock /></span>
                    <input
                      type={showPwd ? "text" : "password"}
                      value={form.adminPassword}
                      onChange={e => set("adminPassword", e.target.value)}
                      className={`input input-with-icon input-with-icon-right ${errors.adminPassword ? "error" : ""}`}
                      placeholder="Minimum 6 caractères" autoComplete="new-password"
                    />
                    <button className="input-icon-right" onClick={() => setShowPwd(!showPwd)}>
                      <Icons.Eye closed={showPwd} />
                    </button>
                  </div>
                  <PasswordStrength password={form.adminPassword} />
                </Field>

                <Field label="Confirmer le mot de passe" error={errors.confirmPassword}>
                  <div className="input-wrapper">
                    <span className="input-icon"><Icons.Lock /></span>
                    <input
                      type={showConf ? "text" : "password"}
                      value={form.confirmPassword}
                      onChange={e => set("confirmPassword", e.target.value)}
                      className={`input input-with-icon input-with-icon-right ${errors.confirmPassword ? "error" : ""}`}
                      placeholder="Répétez le mot de passe" autoComplete="new-password"
                    />
                    <button className="input-icon-right" onClick={() => setShowConf(!showConf)}>
                      <Icons.Eye closed={showConf} />
                    </button>
                  </div>
                  {form.confirmPassword && !errors.confirmPassword && form.adminPassword === form.confirmPassword && (
                    <p style={{ fontSize: 12, marginTop: 5, color: "#34d399", display: "flex", alignItems: "center", gap: 5 }}>
                      <Icons.Check size={12} /> Mots de passe identiques
                    </p>
                  )}
                </Field>

                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <BackBtn onClick={() => setStep(2)} />
                  <button onClick={() => goNext(4)} className="btn btn-primary" style={{ flex: 1, padding: "11px 18px" }}>
                    Continuer <Icons.ArrowRight />
                  </button>
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════
                ÉTAPE 4 — Dossiers
            ════════════════════════════════════════════ */}
            {step === 4 && (
              <div className="animate-fade-up">
                <CardHeader
                  icon={<Icons.Folder />}
                  title="Dossiers à surveiller"
                  subtitle="Indiquez quels dossiers surveiller et où déplacer les fichiers non reconnus."
                />

                {errors.global && <Alert type="error">{errors.global}</Alert>}

                <Field label="Dossiers surveillés" error={errors.watchFolders}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {form.watchFolders.map((f, i) => (
                      <div key={i} style={{ display: "flex", gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <FolderBrowser value={f} onChange={v => updateFolder(i, v)} placeholder="/chemin/dossier" />
                        </div>
                        {form.watchFolders.length > 1 && (
                          <button className="btn btn-danger" style={{ padding: "0 12px", minWidth: "auto" }}
                            onClick={() => set("watchFolders", form.watchFolders.filter((_,j) => j !== i))}>
                            <Icons.X />
                          </button>
                        )}
                      </div>
                    ))}
                    <button className="btn btn-ghost"
                      style={{ border: "1px dashed var(--border)", fontSize: 13, justifyContent: "center" }}
                      onClick={() => set("watchFolders", [...form.watchFolders, ""])}>
                      <Icons.Plus /> Ajouter un dossier
                    </button>
                  </div>
                </Field>

                <Field
                  label="Destination par défaut"
                  error={errors.defaultDestination}
                  hint="Les fichiers ne correspondant à aucune règle seront déplacés ici"
                >
                  <FolderBrowser value={form.defaultDestination} onChange={v => set("defaultDestination", v)} placeholder="/chemin/destination" />
                </Field>

                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <BackBtn onClick={() => setStep(3)} />
                  <button onClick={handleFinish} disabled={loading} className="btn btn-primary" style={{ flex: 1, padding: "11px 18px" }}>
                    {loading
                      ? <><Icons.Spinner /> Enregistrement...</>
                      : <><Icons.Check size={15} /> Terminer la configuration</>
                    }
                  </button>
                </div>
              </div>
            )}

            {/* ════════════════════════════════════════════
                ÉTAPE 5 — Terminé
            ════════════════════════════════════════════ */}
            {step === 5 && (
              <div className="animate-scale-in" style={{ textAlign: "center" }}>
                <div style={{
                  width: 60, height: 60, borderRadius: "50%", margin: "0 auto 20px",
                  background: "rgba(14,165,114,.1)", border: "2px solid rgba(14,165,114,.4)",
                  display: "flex", alignItems: "center", justifyContent: "center", color: "#0ea572",
                }}>
                  <Icons.Check size={26} />
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "var(--text-1)" }}>
                  Configuration terminée
                </h2>
                <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 28 }}>
                  Votre compte <span style={{ color: "var(--primary-light)", fontWeight: 600 }}>@{form.adminUsername}</span> est prêt.
                  Accédez au tableau de bord pour créer vos règles et démarrer la surveillance.
                </p>

                {/* Récap */}
                <div style={{
                  textAlign: "left", border: "1px solid var(--border)",
                  borderRadius: 10, padding: "14px 18px", marginBottom: 24,
                  background: "var(--bg-2)",
                }}>
                  {[
                    {
                      label: "Stockage",
                      value: dbMode === "prisma" ? "PostgreSQL — structureFolderDB" : "JSON local",
                      color: dbMode === "prisma" ? "var(--primary-light)" : "#34d399",
                    },
                    { label: "Compte", value: `@${form.adminUsername}` },
                    { label: "Dossiers surveillés", value: `${form.watchFolders.filter(Boolean).length} dossier(s)` },
                    { label: "Destination par défaut", value: form.defaultDestination || "—" },
                  ].map(item => (
                    <div key={item.label} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,.04)",
                    }}>
                      <span style={{ fontSize: 12.5, color: "var(--text-3)" }}>{item.label}</span>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: item.color ?? "var(--text-1)", maxWidth: "60%", textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>

                <button onClick={goToDashboard} className="btn btn-primary" style={{ width: "100%", padding: "13px 20px" }}>
                  Accéder au tableau de bord <Icons.ArrowRight />
                </button>
              </div>
            )}

          </div>
          {/* end card */}

        </div>
      </div>

      {/* Modal identifiants admin Windows (démarrage PostgreSQL) */}
      <AdminCredentialsModal
        open={showAdminModal}
        onClose={() => { setShowAdminModal(false); setAdminModalError(""); }}
        onSubmit={handleAdminModalSubmit}
        loading={loading}
        error={adminModalError}
        defaultUsername={dbStatus?.currentUser}
      />

      {/* Modal mot de passe PostgreSQL (création base) */}
      <PostgresPasswordModal
        open={showPostgresPwdModal}
        onClose={() => { setShowPostgresPwdModal(false); setPostgresPwdModalError(""); }}
        onSubmit={(pwd) => handleCreateDb(pwd)}
        loading={dbPhase === "creating"}
        error={postgresPwdModalError}
        dbStatus={dbStatus}
        onResetPassword={() => { setShowPostgresPwdModal(false); setShowResetPwdModal(true); }}
      />

      {/* Modal réinitialisation mot de passe PostgreSQL */}
      <ResetPasswordModal
        open={showResetPwdModal}
        onClose={() => setShowResetPwdModal(false)}
        onDone={() => { setShowResetPwdModal(false); setShowPostgresPwdModal(true); }}
      />

      {/* Modal Plus d'options PostgreSQL */}
      <PostgresMoreOptionsModal
        open={showMoreOptionsModal}
        onClose={() => setShowMoreOptionsModal(false)}
        onInstall={handleInstall}
        loading={dbPhase === "installing"}
        dbStatus={dbStatus}
        onResetPassword={() => { setShowMoreOptionsModal(false); setShowResetPwdModal(true); }}
      />
    </>
  );
}
