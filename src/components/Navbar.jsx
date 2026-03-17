"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

function IconLogout() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}

function IconFolder() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

function Avatar({ username }) {
  const initials = username
    ? username.slice(0, 2).toUpperCase()
    : "??";
  return (
    <div className="avatar">
      {initials}
    </div>
  );
}

export default function Navbar({ siteName = "File Organizer", username = "" }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <nav className="navbar">
      <div style={{ maxWidth: 1440, margin: "0 auto", padding: "0 28px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>

        {/* Left — Logo */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            <IconFolder />
          </div>
          <span className="font-semibold text-white text-sm">{siteName}</span>
        </div>

        {/* Right — User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 transition-all"
            style={{
              background: menuOpen ? "var(--surface-2)" : "transparent",
              border: "1px solid transparent",
            }}
            onMouseEnter={(e) => {
              if (!menuOpen) e.currentTarget.style.background = "var(--surface-2)";
            }}
            onMouseLeave={(e) => {
              if (!menuOpen) e.currentTarget.style.background = "transparent";
            }}
          >
            <Avatar username={username} />
            {username && (
              <span className="text-sm font-medium hidden sm:block" style={{ color: "var(--text-2)" }}>
                {username}
              </span>
            )}
            <svg
              width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{
                color: "var(--text-3)",
                transform: menuOpen ? "rotate(180deg)" : "none",
                transition: "transform 0.2s",
              }}
            >
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div
              className="absolute right-0 top-full mt-2 w-48 rounded-xl py-1 animate-scale-in"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                boxShadow: "0 16px 48px rgba(0,0,0,0.4)",
                zIndex: 100,
              }}
            >
              {/* User info */}
              <div className="px-3 py-2.5 border-b" style={{ borderColor: "var(--border)" }}>
                <p className="text-xs font-medium" style={{ color: "var(--text-2)" }}>{username || "Admin"}</p>
                <p className="text-xs" style={{ color: "var(--text-3)" }}>Administrateur</p>
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors"
                style={{ color: "var(--rose)", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(244,63,94,0.08)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
              >
                <IconLogout />
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
