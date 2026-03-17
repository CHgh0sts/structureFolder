"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

function IconUser() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

function IconLock() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

function IconEye({ off }) {
  return off ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ) : (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const usernameRef = useRef(null);

  useEffect(() => { usernameRef.current?.focus(); }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Veuillez remplir tous les champs");
      triggerShake();
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Identifiant ou mot de passe incorrect");
        triggerShake();
        setPassword("");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Erreur de connexion au serveur");
      triggerShake();
    } finally {
      setLoading(false);
    }
  }

  function triggerShake() {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  }

  return (
    <>
      <div className="mesh-bg" />
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm animate-fade-up">

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4"
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                boxShadow: "0 8px 24px rgba(99,102,241,0.35)",
              }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white">File Organizer</h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-3)" }}>Connectez-vous pour continuer</p>
          </div>

          {/* Card */}
          <div className={`card-glass ${shake ? "animate-shake" : ""}`}>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 rounded-lg p-3 mb-5 text-sm animate-fade-in"
                style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.2)", color: "#fb7185" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>

              {/* Username */}
              <div className="mb-4">
                <label className="label"><IconUser />Identifiant</label>
                <div className="input-wrapper">
                  <span className="input-icon"><IconUser /></span>
                  <input
                    ref={usernameRef}
                    type="text"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setError(""); }}
                    className={`input input-with-icon ${error ? "error" : ""}`}
                    placeholder="Votre identifiant"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="mb-6">
                <label className="label"><IconLock />Mot de passe</label>
                <div className="input-wrapper">
                  <span className="input-icon"><IconLock /></span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(""); }}
                    className={`input input-with-icon input-with-icon-right ${error ? "error" : ""}`}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="input-icon-right"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    <IconEye off={showPassword} />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-full"
                style={{ padding: "12px", fontSize: "14px" }}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="9" strokeOpacity="0.25"/>
                      <path d="M21 12a9 9 0 0 0-9-9"/>
                    </svg>
                    Connexion en cours...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Se connecter
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </span>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-xs mt-6" style={{ color: "var(--text-3)" }}>
            Application locale — accès sécurisé par mot de passe
          </p>
        </div>
      </div>
    </>
  );
}
