"use client";

import { useState, useEffect, useMemo } from "react";
import FolderBrowser from "./FolderBrowser";

/* ─── Constants ──────────────────────────────────────────────── */
const FILTER_TYPES = [
  { value: "filenameStartsWith", label: "Le nom commence par" },
  { value: "filenameEndsWith",   label: "Le nom se termine par" },
  { value: "filenameContains",   label: "Le nom contient" },
  { value: "filenameRegex",      label: "Expression régulière" },
  { value: "extension",          label: "Extension exacte" },
];

const PLATFORMS = [
  { value: "win32",  label: "Windows" },
  { value: "darwin", label: "macOS" },
  { value: "linux",  label: "Linux" },
];

const DEFAULT_RULE = {
  name: "", priority: 1, extensions: [], filters: [],
  destination: "", platforms: [], capturePatterns: [], renameTemplate: "",
};

/* ─── Icons ───────────────────────────────────────────────────── */
function I({ d, size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
const IC = {
  x:       "M18 6 6 18M6 6l12 12",
  plus:    "M12 5v14M5 12h14",
  trash:   "M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2",
  save:    "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8",
  folder:  "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z",
  regex:   "M10 20l4-16M4 9l3 3-3 3M20 9l-3 3 3 3",
  var:     "M4 7h16M4 12h16M4 17h10",
  eye:     "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
  check:   "M20 6 9 17 4 12",
  warn:    "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01",
};

/* ─── Template engine (browser-safe copy) ───────────────────── */
function extractVars(text, regexStr) {
  try {
    const m = text.match(new RegExp(regexStr, "i"));
    return m?.groups ? { ...m.groups } : {};
  } catch { return {}; }
}

function applyTemplate(tpl, vars) {
  return tpl.replace(/\{(\w+)(?::([^}]+))?\}/g, (match, name, mod) => {
    const raw = vars[name];
    if (raw === undefined) return match;
    let s = String(raw).trim();
    if (!mod) return s;
    if (/^\d+$/.test(mod)) return s.padStart(parseInt(mod, 10), "0");
    if (mod === "upper") return s.toUpperCase();
    if (mod === "lower") return s.toLowerCase();
    return s;
  });
}

/* ─── Section wrapper ─────────────────────────────────────────── */
function Section({ title, sub, badge, children, accent }) {
  return (
    <div style={{
      borderRadius: 10, overflow: "hidden",
      border: `1px solid ${accent ? `${accent}25` : "var(--border)"}`,
    }}>
      <div style={{
        padding: "12px 16px", display: "flex", alignItems: "center", gap: 10,
        background: accent ? `${accent}09` : "var(--bg-2)",
        borderBottom: `1px solid ${accent ? `${accent}20` : "var(--border)"}`,
      }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 12.5, fontWeight: 700, color: accent || "var(--text-2)", textTransform: "uppercase", letterSpacing: ".06em" }}>{title}</p>
          {sub && <p style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>{sub}</p>}
        </div>
        {badge}
      </div>
      <div style={{ padding: "16px" }}>
        {children}
      </div>
    </div>
  );
}

/* ─── Variable pill ───────────────────────────────────────────── */
function VarPill({ name, value, builtin }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 8px 3px 6px", borderRadius: 6,
      background: builtin ? "rgba(99,102,241,.1)" : "rgba(14,165,114,.1)",
      border: `1px solid ${builtin ? "rgba(99,102,241,.25)" : "rgba(14,165,114,.25)"}`,
      fontSize: 12,
    }}>
      <span style={{ color: builtin ? "var(--primary-light)" : "#34d399", fontWeight: 700, fontFamily: "monospace" }}>{`{${name}}`}</span>
      <span style={{ color: "var(--text-3)" }}>=</span>
      <span style={{ color: "var(--text-1)", fontFamily: "monospace", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        &ldquo;{value}&rdquo;
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN
═══════════════════════════════════════════════════════════════ */
export default function RuleModal({ open, onClose, onSave, rule = null, totalRules = 0 }) {
  const [form, setForm]           = useState(DEFAULT_RULE);
  const [extInput, setExtInput]   = useState("");
  const [testFile, setTestFile]   = useState("voiranime - toto episode 1 saison 1 VOSTFR.mp4");
  const [regexErrors, setRegexErrors] = useState({});

  useEffect(() => {
    if (open) {
      const base = rule ? { ...DEFAULT_RULE, ...rule } : { ...DEFAULT_RULE, priority: totalRules + 1 };
      // Normaliser les champs JSON
      base.capturePatterns = Array.isArray(base.capturePatterns)
        ? base.capturePatterns
        : (() => { try { return JSON.parse(base.capturePatterns || "[]"); } catch { return []; } })();
      base.renameTemplate = base.renameTemplate || "";
      setForm(base);
      setExtInput("");
      setRegexErrors({});
    }
  }, [open, rule, totalRules]);

  /* ── Extension handlers ───────────────────────────────────── */
  function addExtension() {
    const raw = extInput.trim().toLowerCase();
    if (!raw) return;
    const n = raw === "*" ? ".*" : raw.startsWith(".") ? raw : `.${raw}`;
    if (!form.extensions.includes(n)) setForm(f => ({ ...f, extensions: [...f.extensions, n] }));
    setExtInput("");
  }

  /* ── Filter handlers ──────────────────────────────────────── */
  function addFilter()                    { setForm(f => ({ ...f, filters: [...f.filters, { type: "filenameStartsWith", value: "" }] })); }
  function updateFilter(i, k, v)          { setForm(f => ({ ...f, filters: f.filters.map((x, j) => j === i ? { ...x, [k]: v } : x) })); }
  function removeFilter(i)                { setForm(f => ({ ...f, filters: f.filters.filter((_, j) => j !== i) })); }

  /* ── Capture pattern handlers ─────────────────────────────── */
  function addPattern() {
    const id = `cp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setForm(f => ({ ...f, capturePatterns: [...f.capturePatterns, { id, source: "filename", regex: "" }] }));
  }

  function updatePattern(id, key, val) {
    setForm(f => ({ ...f, capturePatterns: f.capturePatterns.map(p => p.id === id ? { ...p, [key]: val } : p) }));
    if (key === "regex") {
      try { new RegExp(val); setRegexErrors(e => { const c = { ...e }; delete c[id]; return c; }); }
      catch (err) { setRegexErrors(e => ({ ...e, [id]: err.message })); }
    }
  }

  function removePattern(id) { setForm(f => ({ ...f, capturePatterns: f.capturePatterns.filter(p => p.id !== id) })); }

  function addDefault(patternId) {
    setForm(f => ({
      ...f,
      capturePatterns: f.capturePatterns.map(p =>
        p.id === patternId ? { ...p, defaults: { ...(p.defaults || {}), "": "" } } : p
      ),
    }));
  }

  function updateDefault(patternId, oldKey, field, value) {
    setForm(f => ({
      ...f,
      capturePatterns: f.capturePatterns.map(p => {
        if (p.id !== patternId) return p;
        const entries = Object.entries(p.defaults || {});
        const idx = entries.findIndex(([k]) => k === oldKey);
        if (idx === -1) return p;
        if (field === "key") entries[idx] = [value, entries[idx][1]];
        else entries[idx] = [entries[idx][0], value];
        return { ...p, defaults: Object.fromEntries(entries) };
      }),
    }));
  }

  function removeDefault(patternId, key) {
    setForm(f => ({
      ...f,
      capturePatterns: f.capturePatterns.map(p => {
        if (p.id !== patternId) return p;
        const d = { ...(p.defaults || {}) };
        delete d[key];
        return { ...p, defaults: d };
      }),
    }));
  }

  /* ── Live preview computation ─────────────────────────────── */
  const preview = useMemo(() => {
    const basename = testFile;
    const dotIdx   = basename.lastIndexOf(".");
    const ext      = dotIdx >= 0 ? basename.slice(dotIdx + 1) : "";
    const stem     = dotIdx >= 0 ? basename.slice(0, dotIdx) : basename;
    const builtins = { ext, filename: stem, basename };

    const captureVars = form.capturePatterns.reduce((acc, p) => {
      if (!p.regex) return acc;
      const src = p.source === "path" ? `/some/path/${basename}` : basename;
      const extracted = extractVars(src, p.regex);
      // Appliquer les valeurs par défaut
      const defaults = p.defaults || {};
      const withDefaults = { ...defaults };
      for (const [k, v] of Object.entries(extracted)) {
        if (v !== undefined && String(v).trim() !== "") withDefaults[k] = v;
      }
      return { ...acc, ...withDefaults };
    }, {});

    const allVars       = { ...builtins, ...captureVars };
    const resolvedDest  = form.destination ? applyTemplate(form.destination, allVars) : "";
    const resolvedName  = form.renameTemplate ? applyTemplate(form.renameTemplate, allVars) : basename;
    const hasUnresolved = form.destination && resolvedDest.includes("{") && resolvedDest.includes("}");

    return { builtins, captureVars, allVars, resolvedDest, resolvedName, hasUnresolved };
  }, [testFile, form.capturePatterns, form.destination, form.renameTemplate]);

  /* ── Save ─────────────────────────────────────────────────── */
  function handleSave() {
    if (!form.destination) return;
    onSave({
      ...form,
      renameTemplate: form.renameTemplate || null,
      capturePatterns: form.capturePatterns,
    });
    onClose();
  }

  if (!open) return null;

  const hasCaptures = form.capturePatterns.length > 0;

  return (
    <div className="modal-overlay" style={{ alignItems: "flex-start", padding: "24px", overflowY: "auto" }}>
      <div
        className="w-full animate-scale-in"
        style={{
          maxWidth: 700, margin: "auto",
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 16, padding: "28px",
          boxShadow: "0 32px 80px rgba(0,0,0,.6)",
        }}
      >
        {/* ── Header ────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700 }}>{rule ? "Modifier la règle" : "Nouvelle règle"}</h2>
            <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 3 }}>
              La première règle qui correspond à un fichier est appliquée
            </p>
          </div>
          <button onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--surface-2)", color: "var(--text-3)", border: "none", cursor: "pointer" }}
            onMouseEnter={e => { e.currentTarget.style.background = "var(--border)"; e.currentTarget.style.color = "var(--text)"; }}
            onMouseLeave={e => { e.currentTarget.style.background = "var(--surface-2)"; e.currentTarget.style.color = "var(--text-3)"; }}
          >
            <I d={IC.x} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* ── Nom + Priorité ───────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 160px", gap: 12 }}>
            <div>
              <label className="label">Nom de la règle</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="input" placeholder="Ex: Séries animées" />
            </div>
            <div>
              <label className="label">Priorité</label>
              <input type="number" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: parseInt(e.target.value) || 1 }))}
                className="input" min="1" />
              <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 4 }}>1 = plus haute</p>
            </div>
          </div>

          {/* ── Extensions ───────────────────────────────────── */}
          <Section title="Extensions" sub="Laissez vide ou utilisez * pour tous les fichiers">
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input type="text" value={extInput}
                onChange={e => setExtInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addExtension())}
                className="input" style={{ flex: 1 }} placeholder=".mp4  .mkv  *" />
              <button type="button" onClick={addExtension} className="btn btn-secondary" style={{ padding: "8px 14px" }}>
                <I d={IC.plus} /> Ajouter
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, minHeight: 28 }}>
              {form.extensions.map(ext => (
                <span key={ext} className="badge badge-blue" style={{ cursor: "pointer" }}
                  onClick={() => setForm(f => ({ ...f, extensions: f.extensions.filter(e => e !== ext) }))}
                  title="Cliquer pour supprimer">
                  {ext}
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </span>
              ))}
              {form.extensions.length === 0 && <span className="badge badge-gray">Tous les fichiers</span>}
            </div>
          </Section>

          {/* ── Filtres ───────────────────────────────────────── */}
          <Section title="Filtres de correspondance" sub="Tous les filtres actifs doivent correspondre (ET)"
            badge={
              <button type="button" onClick={addFilter} className="btn btn-secondary" style={{ padding: "4px 10px", fontSize: 12 }}>
                <I d={IC.plus} size={12} /> Ajouter
              </button>
            }
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {form.filters.map((filter, i) => (
                <div key={i} style={{ display: "flex", gap: 8 }}>
                  <select value={filter.type} onChange={e => updateFilter(i, "type", e.target.value)}
                    className="input" style={{ maxWidth: 200, cursor: "pointer" }}>
                    {FILTER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                  <input type="text" value={filter.value} onChange={e => updateFilter(i, "value", e.target.value)}
                    className="input" style={{ flex: 1 }} placeholder="Valeur..." />
                  <button type="button" onClick={() => removeFilter(i)} className="btn btn-danger" style={{ padding: "8px 10px" }}>
                    <I d={IC.x} />
                  </button>
                </div>
              ))}
              {form.filters.length === 0 && (
                <p style={{ fontSize: 12.5, color: "var(--text-3)" }}>
                  Aucun filtre — s'applique à toutes les extensions correspondantes
                </p>
              )}
            </div>
          </Section>

          {/* ── Variables dynamiques (NOUVEAU) ───────────────── */}
          <Section title="Variables dynamiques" sub="Extraire des données du fichier via regex (groupes nommés)"
            accent="#8b5cf6"
            badge={
              <button type="button" onClick={addPattern} className="btn btn-secondary" style={{ padding: "4px 10px", fontSize: 12 }}>
                <I d={IC.plus} size={12} /> Ajouter
              </button>
            }
          >
            {form.capturePatterns.length === 0 ? (
              <div style={{ textAlign: "center", padding: "12px 0" }}>
                <p style={{ fontSize: 12.5, color: "var(--text-3)", marginBottom: 8 }}>
                  Aucun pattern — la destination et le renommage seront statiques.
                </p>
                <p style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.6 }}>
                  Exemple : <code style={{ color: "#c084fc", background: "rgba(139,92,246,.1)", padding: "1px 5px", borderRadius: 4 }}>
                    voiranime - (?&lt;animeName&gt;[^e]+?) episode (?&lt;episode&gt;\d+) saison (?&lt;season&gt;\d+)(?: (?&lt;lang&gt;VOSTFR|VF))?
                  </code>
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {form.capturePatterns.map((p, idx) => (
                  <div key={p.id} style={{
                    borderRadius: 8, border: `1px solid ${regexErrors[p.id] ? "rgba(244,63,94,.4)" : "rgba(139,92,246,.2)"}`,
                    background: regexErrors[p.id] ? "rgba(244,63,94,.04)" : "rgba(139,92,246,.05)",
                    padding: "12px 14px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#c084fc", background: "rgba(139,92,246,.15)", padding: "2px 7px", borderRadius: 99 }}>
                        Pattern {idx + 1}
                      </span>
                      <select value={p.source} onChange={e => updatePattern(p.id, "source", e.target.value)}
                        className="input" style={{ padding: "4px 8px", fontSize: 12, flex: "none", width: "auto", cursor: "pointer" }}>
                        <option value="filename">Nom du fichier</option>
                        <option value="path">Chemin complet</option>
                      </select>
                      <div style={{ flex: 1 }} />
                      <button type="button" onClick={() => removePattern(p.id)} className="btn btn-danger" style={{ padding: "4px 8px" }}>
                        <I d={IC.trash} size={12} />
                      </button>
                    </div>
                    <input type="text" value={p.regex} onChange={e => updatePattern(p.id, "regex", e.target.value)}
                      className="input" placeholder="(?<animeName>[^-]+?) - (?<saison>\d+)x(?<episode>\d+)"
                      style={{ fontFamily: "monospace", fontSize: 12.5, background: "rgba(0,0,0,.2)" }} />
                    {regexErrors[p.id] && (
                      <p style={{ fontSize: 11.5, color: "#f87171", marginTop: 5, display: "flex", alignItems: "center", gap: 4 }}>
                        <I d={IC.warn} size={12} color="#f87171" /> Regex invalide : {regexErrors[p.id]}
                      </p>
                    )}

                    {/* Valeurs par défaut */}
                    <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(139,92,246,.15)" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
                        <p style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-3)" }}>
                          Valeurs par défaut <span style={{ fontWeight: 400 }}>(si la variable n&apos;est pas capturée)</span>
                        </p>
                        <button type="button" onClick={() => addDefault(p.id)}
                          style={{ fontSize: 11, padding: "2px 8px", borderRadius: 6, background: "rgba(139,92,246,.15)", color: "#c084fc", border: "1px solid rgba(139,92,246,.25)", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}>
                          <I d={IC.plus} size={10} /> Ajouter
                        </button>
                      </div>
                      {Object.entries(p.defaults || {}).length === 0 ? (
                        <p style={{ fontSize: 11.5, color: "var(--text-3)", fontStyle: "italic" }}>Aucune valeur par défaut</p>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                          {Object.entries(p.defaults || {}).map(([k, v]) => (
                            <div key={k} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ fontSize: 11, color: "#c084fc", fontFamily: "monospace", background: "rgba(139,92,246,.1)", padding: "2px 6px", borderRadius: 4 }}>{`{`}</span>
                              <input
                                type="text"
                                value={k}
                                onChange={e => updateDefault(p.id, k, "key", e.target.value)}
                                className="input"
                                style={{ width: 100, padding: "4px 8px", fontSize: 12, fontFamily: "monospace" }}
                                placeholder="varName"
                              />
                              <span style={{ fontSize: 11, color: "#c084fc", fontFamily: "monospace", background: "rgba(139,92,246,.1)", padding: "2px 6px", borderRadius: 4 }}>{`}`}</span>
                              <span style={{ fontSize: 12, color: "var(--text-3)" }}>→</span>
                              <input
                                type="text"
                                value={v}
                                onChange={e => updateDefault(p.id, k, "value", e.target.value)}
                                className="input"
                                style={{ flex: 1, padding: "4px 8px", fontSize: 12 }}
                                placeholder="valeur par défaut"
                              />
                              <button type="button" onClick={() => removeDefault(p.id, k)}
                                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-3)", padding: 3, borderRadius: 4, display: "flex", flexShrink: 0 }}
                                onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
                                onMouseLeave={e => e.currentTarget.style.color = "var(--text-3)"}
                              >
                                <I d={IC.x} size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Built-in variables hint */}
            <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 8, background: "rgba(91,95,203,.06)", border: "1px solid rgba(91,95,203,.15)" }}>
              <p style={{ fontSize: 11.5, fontWeight: 600, color: "var(--primary-light)", marginBottom: 6 }}>Variables toujours disponibles :</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {[["ext","mp4"],["filename","nom sans extension"],["basename","nom complet"]].map(([n,v]) => (
                  <VarPill key={n} name={n} value={v} builtin />
                ))}
              </div>
              <p style={{ fontSize: 11, color: "var(--text-3)", marginTop: 8 }}>
                Modificateurs : <code style={{ color: "var(--text-2)" }}>{`{season:02}`}</code> (zéro-pad) ·{" "}
                <code style={{ color: "var(--text-2)" }}>{`{name:upper}`}</code> / <code style={{ color: "var(--text-2)" }}>{`{name:lower}`}</code>
              </p>
            </div>
          </Section>

          {/* ── Destination ───────────────────────────────────── */}
          <Section title="Destination" sub={hasCaptures ? "Vous pouvez utiliser des variables {nom}" : "Dossier cible"} accent="#d97706">
            <FolderBrowser value={form.destination} onChange={v => setForm(f => ({ ...f, destination: v }))}
              placeholder={hasCaptures ? "/videos/{animeName}/{lang}/saison {season:02}" : "/chemin/destination"} />
            {!form.destination && (
              <p style={{ fontSize: 12, color: "var(--rose)", marginTop: 6, display: "flex", alignItems: "center", gap: 4 }}>
                <I d={IC.warn} size={12} color="var(--rose)" /> La destination est obligatoire
              </p>
            )}
            {hasCaptures && form.destination && (
              <p style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 5 }}>
                Tapez directement le chemin avec des <code style={{ color: "#fbbf24" }}>{"{variables}"}</code> — le bouton Parcourir peut vous aider à trouver la base.
              </p>
            )}
          </Section>

          {/* ── Renommer le fichier (NOUVEAU) ─────────────────── */}
          <Section title="Renommer le fichier" sub="Optionnel — laissez vide pour garder le nom original" accent="#0ea572">
            <input type="text" value={form.renameTemplate || ""}
              onChange={e => setForm(f => ({ ...f, renameTemplate: e.target.value }))}
              className="input" style={{ fontFamily: "monospace", fontSize: 13 }}
              placeholder="S{season:02}E{episode:02}.{animeName}.{ext}" />
            {form.renameTemplate && (
              <p style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 6 }}>
                Utilisez les variables de vos patterns + les built-ins. L&#39;extension <code style={{ color: "#34d399" }}>{"{ext}"}</code> est automatique.
              </p>
            )}
          </Section>

          {/* ── Aperçu live (NOUVEAU) ─────────────────────────── */}
          {hasCaptures && (
            <Section title="Aperçu live" sub="Testez vos patterns en temps réel" accent="#5b5fcb">
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", display: "block", marginBottom: 5 }}>
                  Nom de fichier de test
                </label>
                <input type="text" value={testFile} onChange={e => setTestFile(e.target.value)}
                  className="input" style={{ fontFamily: "monospace", fontSize: 12.5 }}
                  placeholder="monFichier.mp4" />
              </div>

              {/* Variables extraites */}
              <div style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-2)", marginBottom: 8 }}>Variables extraites :</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {Object.entries(preview.builtins).map(([k, v]) => (
                    <VarPill key={k} name={k} value={v} builtin />
                  ))}
                  {Object.keys(preview.captureVars).length === 0 ? (
                    <span style={{ fontSize: 12, color: "var(--text-3)", fontStyle: "italic" }}>
                      Aucune variable — vérifiez vos patterns regex
                    </span>
                  ) : (
                    Object.entries(preview.captureVars).map(([k, v]) => (
                      <VarPill key={k} name={k} value={v} />
                    ))
                  )}
                </div>
              </div>

              {/* Résultats */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {form.destination && (
                  <div style={{
                    padding: "10px 14px", borderRadius: 8,
                    background: preview.hasUnresolved ? "rgba(245,158,11,.07)" : "rgba(14,165,114,.07)",
                    border: `1px solid ${preview.hasUnresolved ? "rgba(245,158,11,.25)" : "rgba(14,165,114,.25)"}`,
                  }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: preview.hasUnresolved ? "#fbbf24" : "#34d399", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".06em" }}>
                      {preview.hasUnresolved ? "⚠ Destination (variables non résolues)" : "✓ Destination résolue"}
                    </p>
                    <p style={{ fontSize: 12.5, fontFamily: "monospace", color: "var(--text-1)", wordBreak: "break-all" }}>
                      {preview.resolvedDest || "—"}
                    </p>
                  </div>
                )}
                {form.renameTemplate && (
                  <div style={{
                    padding: "10px 14px", borderRadius: 8,
                    background: "rgba(91,95,203,.07)", border: "1px solid rgba(91,95,203,.25)",
                  }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "var(--primary-light)", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".06em" }}>
                      ✓ Nom de fichier résolu
                    </p>
                    <p style={{ fontSize: 12.5, fontFamily: "monospace", color: "var(--text-1)" }}>
                      {preview.resolvedName || "—"}
                    </p>
                  </div>
                )}
                {form.destination && form.renameTemplate && (
                  <div style={{
                    padding: "10px 14px", borderRadius: 8,
                    background: "rgba(139,92,246,.07)", border: "1px solid rgba(139,92,246,.25)",
                  }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: "#c084fc", marginBottom: 4, textTransform: "uppercase", letterSpacing: ".06em" }}>
                      Chemin final
                    </p>
                    <p style={{ fontSize: 12.5, fontFamily: "monospace", color: "var(--text-1)", wordBreak: "break-all" }}>
                      {preview.resolvedDest ? `${preview.resolvedDest}/${preview.resolvedName}` : "—"}
                    </p>
                  </div>
                )}
              </div>
            </Section>
          )}

          {/* ── Plateformes ───────────────────────────────────── */}
          <Section title="Restreindre à certains OS" sub="Vide = tous les systèmes">
            <div style={{ display: "flex", gap: 20 }}>
              {PLATFORMS.map(p => (
                <label key={p.value} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13 }}>
                  <input type="checkbox" checked={form.platforms.includes(p.value)} onChange={() => {
                    setForm(f => ({
                      ...f,
                      platforms: f.platforms.includes(p.value) ? f.platforms.filter(x => x !== p.value) : [...f.platforms, p.value],
                    }));
                  }} style={{ accentColor: "var(--primary)", cursor: "pointer", width: 15, height: 15 }} />
                  <span style={{ color: form.platforms.includes(p.value) ? "var(--text)" : "var(--text-2)" }}>{p.label}</span>
                </label>
              ))}
            </div>
          </Section>

        </div>

        {/* ── Footer ────────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 10, marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--border)" }}>
          <button onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>Annuler</button>
          <button onClick={handleSave} className="btn btn-primary" disabled={!form.destination} style={{ flex: 1, padding: 11 }}>
            <I d={IC.save} /> {rule ? "Mettre à jour" : "Créer la règle"}
          </button>
        </div>
      </div>
    </div>
  );
}
