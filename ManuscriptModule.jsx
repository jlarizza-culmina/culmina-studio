import { useState } from "react";

// ── Brand tokens ──────────────────────────────────────────────
const C = { ink: "#1A1810", cream: "#F7F2E8", gold: "#C9924A", charcoal: "#5C574E", dim: "#3a3830", ghost: "#2a2820", panel: "#12110d", green: "#4ade80", red: "#f87171" };

// ── Scoring criteria ──────────────────────────────────────────
const CRITERIA = [
  { id: "episodic_structure",  label: "Episodic Structure",  weight: 0.18, description: "Natural break points, cliffhangers, 3–5 min chunk cadence" },
  { id: "emotional_velocity",  label: "Emotional Velocity",  weight: 0.18, description: "Tension escalation speed, hook density, retention" },
  { id: "dialogue_density",    label: "Dialogue Density",    weight: 0.12, description: "Dialogue vs internal monologue ratio" },
  { id: "character_clarity",   label: "Character Clarity",   weight: 0.12, description: "Protagonist/antagonist legibility" },
  { id: "character_economy",   label: "Character Economy",   weight: 0.10, description: "Lead/supporting count vs optimal range (2–3 leads, 4–8 supporting)" },
  { id: "set_economy",         label: "Set Economy",         weight: 0.10, description: "Distinct locations vs production feasibility (3–8 ideal)" },
  { id: "scene_variety",       label: "Scene Variety",       weight: 0.08, description: "Visual diversity, location interest" },
  { id: "platform_fit",        label: "Platform Fit",        weight: 0.07, description: "ReelShort/TikTok compatibility, content flags" },
  { id: "adaptation_fidelity", label: "Adaptation Fidelity", weight: 0.05, description: "Voice preservation, IP integrity" },
];

const SCORE_PROMPT = `You are Culmina AI Drama Studio's IP Suitability Classifier. Evaluate manuscript excerpts for micro-drama potential on ReelShort and TikTok.

PART 1 — INVENTORY: Identify all named characters (leads vs supporting) and distinct sets/locations.
PART 2 — SCORING: Score each criterion 0–100.

CHARACTER ECONOMY: Optimal = 2–3 leads, 4–8 supporting (80–100). Slightly off = 60–79. Too sparse/complex = 0–59.
SET ECONOMY: Optimal = 3–8 distinct sets (80–100). Slightly off = 60–79. Too few/many = 0–59.

Return ONLY valid JSON, no markdown:
{
  "character_inventory": { "leads": [{"name":"","role":""}], "supporting": [{"name":"","role":""}] },
  "set_inventory": [{"name":"","description":""}],
  "scores": { "episodic_structure":0,"emotional_velocity":0,"dialogue_density":0,"character_clarity":0,"character_economy":0,"set_economy":0,"scene_variety":0,"platform_fit":0,"adaptation_fidelity":0 },
  "rationale": { "episodic_structure":"","emotional_velocity":"","dialogue_density":"","character_clarity":"","character_economy":"","set_economy":"","scene_variety":"","platform_fit":"","adaptation_fidelity":"" },
  "tier":"fast_track|review|pass",
  "tier_rationale":"",
  "recommended_series_length":"",
  "top_strength":"",
  "top_risk":""
}
Tier: fast_track >= 75, review 50-74, pass < 50.`;

// ── Pipeline steps ─────────────────────────────────────────────
const STEPS = [
  { id: "intake",   num: "01", label: "Intake",   desc: "Metadata & manuscript" },
  { id: "score",    num: "02", label: "IP Score", desc: "Suitability analysis" },
  { id: "episodes", num: "03", label: "Episodes", desc: "Generate episode structure", soon: true },
  { id: "script",   num: "04", label: "Script",   desc: "Write episode scripts",      soon: true },
];

const ROYALTY_OPTS  = ["Royalty-Free", "70/30 Buyout", "50/50 Revenue Share", "Custom"];
const FICTION_OPTS  = ["Fiction", "Non-Fiction"];
const AUTHOR_ROLES  = ["Author", "Co-Author", "Editor", "Illustrator", "Translator"];

const emptyAuthor = () => ({ name: "", role: "Author" });
const emptyLang   = () => ({ key: "Primary", value: "English" });

// ── Helpers ────────────────────────────────────────────────────
const scoreColor = (s) => s >= 75 ? C.green : s >= 50 ? C.gold : C.red;
const tierColor  = (t) => t === "fast_track" ? C.green : t === "review" ? C.gold : C.red;
const tierLabel  = (t) => t === "fast_track" ? "FAST TRACK" : t === "review" ? "UNDER REVIEW" : "PASS";

const inp = (extra = {}) => ({
  background: C.panel, border: `1px solid ${C.ghost}`, borderRadius: 3,
  color: C.cream, fontFamily: "'DM Sans', sans-serif", fontSize: 13,
  padding: "9px 12px", outline: "none", width: "100%", boxSizing: "border-box", ...extra,
});

// ── Section wrapper ────────────────────────────────────────────
function Section({ title, children, accent }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        <div style={{ width: 3, height: 16, background: accent || C.gold, borderRadius: 2 }} />
        <span style={{ fontSize: 11, color: C.charcoal, letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 600 }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

// ── Field wrapper ──────────────────────────────────────────────
function Field({ label, required, hint, children, half }) {
  return (
    <div style={{ marginBottom: 14, ...(half ? { flex: 1 } : {}) }}>
      <div style={{ display: "block", fontSize: 10, color: required ? C.gold : C.charcoal, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>
        {label}{required ? " *" : ""}
      </div>
      {children}
      {hint && <div style={{ fontSize: 10, color: C.dim, marginTop: 4, lineHeight: 1.4 }}>{hint}</div>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
export default function ManuscriptModule() {
  const [step, setStep]             = useState("intake");
  const [intakeDone, setIntakeDone] = useState(false);

  // Intake form state
  const [form, setForm] = useState({
    title: "", royalty_type: "",
    authors: [emptyAuthor()],
    publisher: "", publisher_city: "", copyright_year: "",
    lccn_print: "", lccn_ebook: "",
    bisac: "", genre: "", fiction_nonfiction: "Fiction",
    languages: [emptyLang()],
    summary: "", excerpt: "",
  });
  const [errors, setErrors]         = useState({});
  const [lccnStatus, setLccnStatus] = useState(null);

  // Scoring state
  const [scoreResult, setScoreResult] = useState(null);
  const [scoring, setScoring]         = useState(false);
  const [scoreError, setScoreError]   = useState(null);
  const [scoreTab, setScoreTab]       = useState("scores");

  // API key state
  const [apiKey, setApiKey]   = useState(localStorage.getItem("culmina_api_key") || "");
  const [showKey, setShowKey] = useState(false);

  const saveApiKey = (val) => {
    setApiKey(val);
    localStorage.setItem("culmina_api_key", val);
  };

  // ── Form helpers ──────────────────────────────────────────────
  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const setAuthor = (i, key, val) => setForm(f => {
    const a = [...f.authors]; a[i] = { ...a[i], [key]: val }; return { ...f, authors: a };
  });
  const addAuthor    = () => setForm(f => ({ ...f, authors: [...f.authors, emptyAuthor()] }));
  const removeAuthor = (i) => setForm(f => ({ ...f, authors: f.authors.filter((_, x) => x !== i) }));

  const setLang = (i, key, val) => setForm(f => {
    const l = [...f.languages]; l[i] = { ...l[i], [key]: val }; return { ...f, languages: l };
  });
  const addLang    = () => setForm(f => ({ ...f, languages: [...f.languages, emptyLang()] }));
  const removeLang = (i) => setForm(f => ({ ...f, languages: f.languages.filter((_, x) => x !== i) }));

  // ── LCCN Lookup via Open Library ─────────────────────────────
  const lookupLCCN = async () => {
    const lccn = form.lccn_print.trim();
    if (!lccn) return;
    setLccnStatus("loading");
    try {
      const url = `https://openlibrary.org/api/books?bibkeys=LCCN:${lccn}&format=json&jscmd=data`;
      const res  = await fetch(url);
      const data = await res.json();
      const key  = `LCCN:${lccn}`;
      if (!data[key]) { setLccnStatus("fail"); return; }
      const b = data[key];
      const updates = {};
      if (b.title)                                           updates.title = b.title;
      if (b.authors && b.authors.length)                     updates.authors = b.authors.map(a => ({ name: a.name, role: "Author" }));
      if (b.publishers && b.publishers.length)               updates.publisher = b.publishers[0].name;
      if (b.publish_places && b.publish_places.length)       updates.publisher_city = b.publish_places[0].name;
      if (b.publish_date)                                    updates.copyright_year = b.publish_date.replace(/\D/g, "").slice(0, 4);
      if (b.description)                                     updates.summary = typeof b.description === "string" ? b.description : (b.description.value || "");
      if (b.subjects && b.subjects.length)                   updates.genre = b.subjects.slice(0, 3).map(s => typeof s === "string" ? s : s.name).join("; ");
      if (b.classifications && b.classifications.lc_classifications && b.classifications.lc_classifications.length)
                                                             updates.bisac = b.classifications.lc_classifications[0];
      setForm(f => ({ ...f, ...updates }));
      setLccnStatus("ok");
    } catch {
      setLccnStatus("fail");
    }
  };

  // ── Intake validation ─────────────────────────────────────────
  const validateIntake = () => {
    const e = {};
    if (!form.title.trim())                                               e.title = "Title is required";
    if (!form.royalty_type)                                               e.royalty_type = "Royalty type is required";
    if (!form.authors.some(a => a.name.trim()))                           e.authors = "At least one author name is required";
    if (!form.excerpt.trim() || form.excerpt.split(/\s+/).filter(Boolean).length < 100)
                                                                          e.excerpt = "Excerpt must be at least 100 words";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleIntakeSubmit = () => {
    if (validateIntake()) { setIntakeDone(true); setStep("score"); }
  };

  // ── Scoring ───────────────────────────────────────────────────
  const runScore = async () => {
    if (!apiKey) { setScoreError("Please enter your Anthropic API key in the settings bar above."); return; }
    setScoring(true); setScoreError(null); setScoreResult(null); setScoreTab("scores");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-iab": "true",
        },
        body: JSON.stringify({
          model: "claude-opus-4-5",
          max_tokens: 1000,
          system: SCORE_PROMPT,
          messages: [{ role: "user", content: `Title: "${form.title}"\n\nExcerpt:\n\n${form.excerpt}` }],
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const text = data.content?.find(b => b.type === "text")?.text || "";
      setScoreResult(JSON.parse(text.replace(/```json|```/g, "").trim()));
    } catch (err) {
      setScoreError("Analysis failed: " + err.message);
    } finally {
      setScoring(false);
    }
  };

  const weightedScore = scoreResult
    ? Math.round(CRITERIA.reduce((s, c) => s + (scoreResult.scores[c.id] || 0) * c.weight, 0))
    : null;

  const leads      = scoreResult?.character_inventory?.leads      || [];
  const supporting = scoreResult?.character_inventory?.supporting || [];
  const sets       = scoreResult?.set_inventory || [];

  const wordCount = form.excerpt.split(/\s+/).filter(Boolean).length;

  // ══════════════════════════════════════════════════════════════
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: C.ink, minHeight: "100vh", color: C.cream, display: "flex", flexDirection: "column" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      <style>{`
        input::placeholder, textarea::placeholder { color: #3a3830; }
        select option { background: #1A1810; color: #F7F2E8; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #12110d; }
        ::-webkit-scrollbar-thumb { background: #2a2820; border-radius: 2px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        input, textarea, select { color-scheme: dark; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ borderBottom: `1px solid ${C.ghost}`, padding: "16px 28px", display: "flex", alignItems: "center", gap: 14, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 26, height: 26, background: `linear-gradient(135deg, ${C.gold}, #a87238)`, clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)" }} />
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 19, fontWeight: 600, letterSpacing: "0.06em" }}>CULMINA</span>
        </div>
        <div style={{ width: 1, height: 18, background: C.ghost }} />
        <span style={{ fontSize: 11, color: C.charcoal, letterSpacing: "0.15em", textTransform: "uppercase" }}>Manuscript Module</span>
        {form.title && (
          <span style={{ marginLeft: "auto", fontSize: 12, color: C.charcoal, fontStyle: "italic", fontFamily: "'Cormorant Garamond', serif" }}>
            &ldquo;{form.title}&rdquo;
          </span>
        )}
      </div>

      {/* ── API Key bar ── */}
      <div style={{ borderBottom: `1px solid ${C.ghost}`, padding: "8px 28px", display: "flex", alignItems: "center", gap: 10, background: "#0f0e0b" }}>
        <span style={{ fontSize: 10, color: C.dim, letterSpacing: "0.12em", textTransform: "uppercase", whiteSpace: "nowrap" }}>Anthropic API Key</span>
        <input
          type={showKey ? "text" : "password"}
          value={apiKey}
          onChange={e => saveApiKey(e.target.value)}
          placeholder="sk-ant-..."
          style={{ ...inp({ flex: 1, maxWidth: 340, padding: "5px 10px", fontSize: 12 }) }}
        />
        <button onClick={() => setShowKey(v => !v)} style={{ background: "none", border: `1px solid ${C.ghost}`, color: C.dim, borderRadius: 3, padding: "4px 10px", cursor: "pointer", fontSize: 10 }}>
          {showKey ? "Hide" : "Show"}
        </button>
        <span style={{ fontSize: 10, color: C.dim }}>
          {apiKey ? (apiKey.startsWith("sk-ant-") ? "✓ Key set" : "⚠ Check key format") : "Required for IP scoring"}
        </span>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── Pipeline Sidebar ── */}
        <div style={{ width: 200, borderRight: `1px solid ${C.ghost}`, padding: "24px 0", flexShrink: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          {STEPS.map(s => {
            const isActive   = step === s.id;
            const isComplete = s.id === "intake" ? intakeDone : s.id === "score" ? !!scoreResult : false;
            const isLocked   = s.soon || (s.id === "score" && !intakeDone);
            const canClick   = !isLocked && (s.id === "intake" || intakeDone);
            return (
              <div key={s.id} onClick={() => canClick && setStep(s.id)} style={{
                padding: "14px 20px",
                cursor: canClick ? "pointer" : "default",
                background: isActive ? `${C.gold}18` : "transparent",
                borderLeft: `3px solid ${isActive ? C.gold : "transparent"}`,
                opacity: isLocked ? 0.3 : 1,
                transition: "all 0.15s",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 10, color: isActive ? C.gold : C.dim, fontWeight: 700, letterSpacing: "0.1em" }}>{s.num}</span>
                  {isComplete && <span style={{ fontSize: 9, color: C.green }}>✓</span>}
                  {s.soon && <span style={{ fontSize: 8, color: C.dim, letterSpacing: "0.1em", textTransform: "uppercase" }}>soon</span>}
                </div>
                <div style={{ fontSize: 13, color: isActive ? C.cream : C.charcoal, fontWeight: isActive ? 600 : 400 }}>{s.label}</div>
                <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>{s.desc}</div>
              </div>
            );
          })}

          <div style={{ marginTop: "auto", padding: "16px 20px", borderTop: `1px solid ${C.ghost}` }}>
            <div style={{ fontSize: 9, color: C.dim, lineHeight: 1.7, letterSpacing: "0.05em" }}>
              PIPELINE v1.0<br />
              <span style={{ color: "#2a2820" }}>Episodes + Script<br />modules coming</span>
            </div>
          </div>
        </div>

        {/* ── Main Content ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 36px" }}>

          {/* ══ STEP 1: INTAKE ══ */}
          {step === "intake" && (
            <div style={{ maxWidth: 800, animation: "fadeIn 0.2s ease" }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, marginBottom: 6 }}>Manuscript Intake</div>
                <div style={{ fontSize: 12, color: C.charcoal }}>Complete all required fields before IP scoring. LCCN auto-populate available for registered titles.</div>
              </div>

              {/* REQUIRED */}
              <Section title="Required" accent={C.gold}>
                <Field label="Manuscript Title" required hint="Full title as it appears on the cover">
                  <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Enter manuscript title" style={inp()} />
                  {errors.title && <div style={{ fontSize: 10, color: C.red, marginTop: 4 }}>{errors.title}</div>}
                </Field>

                <Field label="Royalty / Rights Type" required hint="Determines author compensation structure">
                  <select value={form.royalty_type} onChange={e => set("royalty_type", e.target.value)} style={inp()}>
                    <option value="">Select type…</option>
                    {ROYALTY_OPTS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  {errors.royalty_type && <div style={{ fontSize: 10, color: C.red, marginTop: 4 }}>{errors.royalty_type}</div>}
                </Field>

                {/* Authors */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, color: C.gold, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
                    Authors * <span style={{ color: C.dim, fontSize: 9 }}>(people table)</span>
                  </div>
                  {form.authors.map((a, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                      <input value={a.name} onChange={e => setAuthor(i, "name", e.target.value)}
                        placeholder={`Author ${i + 1} full name`} style={inp({ flex: 2 })} />
                      <select value={a.role} onChange={e => setAuthor(i, "role", e.target.value)} style={inp({ flex: 1, minWidth: 130 })}>
                        {AUTHOR_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      {form.authors.length > 1 && (
                        <button onClick={() => removeAuthor(i)} style={{ background: "none", border: `1px solid ${C.ghost}`, color: C.dim, borderRadius: 3, padding: "6px 10px", cursor: "pointer", fontSize: 14, lineHeight: 1 }}>×</button>
                      )}
                    </div>
                  ))}
                  <button onClick={addAuthor} style={{ background: "none", border: `1px dashed ${C.dim}`, color: C.charcoal, borderRadius: 3, padding: "6px 14px", cursor: "pointer", fontSize: 11, letterSpacing: "0.08em" }}>
                    + Add Author
                  </button>
                  {errors.authors && <div style={{ fontSize: 10, color: C.red, marginTop: 6 }}>{errors.authors}</div>}
                </div>
              </Section>

              {/* PUBLICATION */}
              <Section title="Publication Details" accent={C.charcoal}>
                <div style={{ display: "flex", gap: 12 }}>
                  <Field label="Publisher" hint="Publishing company name" half>
                    <input value={form.publisher} onChange={e => set("publisher", e.target.value)} placeholder="Publisher name" style={inp()} />
                  </Field>
                  <Field label="Publisher City" half>
                    <input value={form.publisher_city} onChange={e => set("publisher_city", e.target.value)} placeholder="City" style={inp()} />
                  </Field>
                  <Field label="Copyright Year" half>
                    <input value={form.copyright_year} onChange={e => set("copyright_year", e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="YYYY" style={inp()} maxLength={4} />
                  </Field>
                </div>
              </Section>

              {/* LIBRARY OF CONGRESS */}
              <Section title="Library of Congress" accent="#6ee7b7">
                <div style={{ background: C.panel, borderRadius: 4, padding: "14px 16px", marginBottom: 16, border: `1px solid ${C.ghost}` }}>
                  <div style={{ fontSize: 10, color: "#6ee7b7", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>LCCN Auto-Populate</div>
                  <div style={{ fontSize: 11, color: C.charcoal, marginBottom: 10, lineHeight: 1.5 }}>
                    Enter a print LCCN to auto-populate fields from Open Library.<br />
                    Example format: <span style={{ color: C.cream, fontFamily: "monospace" }}>2018046290</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      value={form.lccn_print}
                      onChange={e => { set("lccn_print", e.target.value); setLccnStatus(null); }}
                      placeholder="e.g. 2018046290"
                      style={inp({ flex: 1 })}
                    />
                    <button
                      onClick={lookupLCCN}
                      disabled={!form.lccn_print.trim() || lccnStatus === "loading"}
                      style={{
                        background: form.lccn_print.trim() ? "#6ee7b718" : C.ghost,
                        border: `1px solid ${form.lccn_print.trim() ? "#6ee7b755" : C.ghost}`,
                        color: form.lccn_print.trim() ? "#6ee7b7" : C.dim,
                        borderRadius: 3, padding: "8px 16px", cursor: form.lccn_print.trim() ? "pointer" : "not-allowed",
                        fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", whiteSpace: "nowrap",
                      }}>
                      {lccnStatus === "loading" ? "Looking up…" : "Lookup LOC"}
                    </button>
                    {form.lccn_print && (
                      <a href={`https://lccn.loc.gov/${form.lccn_print}`} target="_blank" rel="noreferrer"
                        style={{ fontSize: 10, color: C.charcoal, textDecoration: "none", whiteSpace: "nowrap" }}>↗ LOC</a>
                    )}
                  </div>
                  {lccnStatus === "ok"   && <div style={{ fontSize: 11, color: C.green,  marginTop: 8 }}>✓ Fields populated from Open Library</div>}
                  {lccnStatus === "fail" && <div style={{ fontSize: 11, color: C.gold, marginTop: 8 }}>Record not found — enter fields manually or visit lccn.loc.gov/{form.lccn_print}</div>}
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <Field label="LCCN (Print)" hint="Library of Congress Control Number — print edition" half>
                    <input value={form.lccn_print} onChange={e => set("lccn_print", e.target.value)} placeholder="e.g. 2018046290" style={inp()} />
                  </Field>
                  <Field label="LCCN (eBook)" hint="Library of Congress Control Number — ebook edition" half>
                    <input value={form.lccn_ebook} onChange={e => set("lccn_ebook", e.target.value)} placeholder="e.g. 2018046291" style={inp()} />
                  </Field>
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <Field label="BISAC Code" hint="Book Industry Standards subject code — from LOC record" half>
                    <input value={form.bisac} onChange={e => set("bisac", e.target.value)} placeholder="e.g. FIC027110" style={inp()} />
                  </Field>
                  <Field label="Genre" hint="Primary genre as classified by LOC" half>
                    <input value={form.genre} onChange={e => set("genre", e.target.value)} placeholder="e.g. Romance — Historical" style={inp()} />
                  </Field>
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <Field label="Fiction / Non-Fiction" half>
                    <div style={{ display: "flex", gap: 8 }}>
                      {FICTION_OPTS.map(o => (
                        <button key={o} onClick={() => set("fiction_nonfiction", o)} style={{
                          flex: 1,
                          background: form.fiction_nonfiction === o ? `${C.gold}22` : C.panel,
                          border: `1px solid ${form.fiction_nonfiction === o ? C.gold : C.ghost}`,
                          color: form.fiction_nonfiction === o ? C.gold : C.charcoal,
                          borderRadius: 3, padding: "8px 0", cursor: "pointer", fontSize: 12,
                          fontFamily: "'DM Sans', sans-serif",
                        }}>{o}</button>
                      ))}
                    </div>
                  </Field>
                </div>

                {/* Language NV pairs */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, color: C.charcoal, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>
                    Language <span style={{ color: C.dim, fontSize: 9 }}>(key / value pairs)</span>
                  </div>
                  {form.languages.map((l, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                      <input value={l.key}   onChange={e => setLang(i, "key",   e.target.value)} placeholder="Key (e.g. Primary)"  style={inp({ flex: 1 })} />
                      <input value={l.value} onChange={e => setLang(i, "value", e.target.value)} placeholder="Value (e.g. English)" style={inp({ flex: 1 })} />
                      {form.languages.length > 1 && (
                        <button onClick={() => removeLang(i)} style={{ background: "none", border: `1px solid ${C.ghost}`, color: C.dim, borderRadius: 3, padding: "6px 10px", cursor: "pointer", fontSize: 14, lineHeight: 1 }}>×</button>
                      )}
                    </div>
                  ))}
                  <button onClick={addLang} style={{ background: "none", border: `1px dashed ${C.dim}`, color: C.charcoal, borderRadius: 3, padding: "6px 14px", cursor: "pointer", fontSize: 11 }}>
                    + Add Language
                  </button>
                </div>
              </Section>

              {/* CONTENT */}
              <Section title="Content" accent={C.gold}>
                <Field label="Summary" hint="Plot summary or back-cover description">
                  <textarea value={form.summary} onChange={e => set("summary", e.target.value)}
                    placeholder="Enter summary or paste from publisher materials…"
                    rows={4} style={inp({ resize: "vertical" })} />
                </Field>

                <Field label="Manuscript Excerpt" required hint="500–3000 words recommended. Opening chapters + a mid-point sample give best scoring accuracy.">
                  <textarea value={form.excerpt} onChange={e => set("excerpt", e.target.value)}
                    placeholder="Paste manuscript excerpt here (500–3000 words)…"
                    rows={10} style={inp({ resize: "vertical" })} />
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    {errors.excerpt
                      ? <div style={{ fontSize: 10, color: C.red }}>{errors.excerpt}</div>
                      : <div />
                    }
                    <div style={{ fontSize: 10, color: wordCount >= 500 ? C.green : C.dim }}>
                      {wordCount} words {wordCount >= 500 ? "✓" : `(need ${500 - wordCount} more)`}
                    </div>
                  </div>
                </Field>
              </Section>

              {/* Submit */}
              <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 12, borderTop: `1px solid ${C.ghost}`, marginTop: 4 }}>
                <button onClick={handleIntakeSubmit} style={{
                  background: C.gold, color: C.ink, border: "none", borderRadius: 3,
                  padding: "12px 36px", fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                  fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer",
                }}>
                  Save &amp; Continue to Scoring →
                </button>
              </div>
            </div>
          )}

          {/* ══ STEP 2: IP SCORE ══ */}
          {step === "score" && (
            <div style={{ animation: "fadeIn 0.2s ease" }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, marginBottom: 6 }}>IP Suitability Score</div>
                <div style={{ fontSize: 12, color: C.charcoal }}>Opus evaluates your excerpt across 9 weighted criteria.</div>
              </div>

              {/* Summary bar */}
              <div style={{ background: C.panel, border: `1px solid ${C.ghost}`, borderRadius: 4, padding: "12px 16px", marginBottom: 20, display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
                {[
                  { label: "Title",    value: form.title },
                  { label: "Rights",   value: form.royalty_type },
                  { label: "Author(s)", value: form.authors.filter(a => a.name).map(a => a.name).join(", ") },
                  { label: "Genre",    value: form.fiction_nonfiction + (form.genre ? ` · ${form.genre}` : "") },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ fontSize: 9, color: C.dim, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 2 }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: C.cream }}>{item.value || "—"}</div>
                  </div>
                ))}
                <button onClick={() => setStep("intake")} style={{ marginLeft: "auto", background: "none", border: `1px solid ${C.ghost}`, color: C.charcoal, borderRadius: 3, padding: "5px 12px", cursor: "pointer", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>
                  ← Edit Intake
                </button>
              </div>

              {/* Pre-run state */}
              {!scoreResult && !scoring && (
                <div style={{ textAlign: "center", padding: "48px 0" }}>
                  <div style={{ fontSize: 48, marginBottom: 12, opacity: 0.15 }}>◈</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: C.dim, marginBottom: 8 }}>Ready to analyze</div>
                  <div style={{ fontSize: 12, color: C.dim, marginBottom: 28 }}>
                    Opus will evaluate {wordCount} words across 9 criteria
                  </div>
                  <button onClick={runScore} style={{
                    background: C.gold, color: C.ink, border: "none", borderRadius: 3,
                    padding: "13px 40px", fontFamily: "'DM Sans', sans-serif", fontSize: 13,
                    fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer",
                  }}>
                    Run IP Score
                  </button>
                  {scoreError && <div style={{ fontSize: 12, color: C.red, marginTop: 14, maxWidth: 400, margin: "14px auto 0" }}>{scoreError}</div>}
                </div>
              )}

              {/* Loading */}
              {scoring && (
                <div style={{ textAlign: "center", padding: "60px 0" }}>
                  <div style={{ width: 44, height: 44, border: `2px solid ${C.ghost}`, borderTopColor: C.gold, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: C.charcoal }}>Opus is reading…</div>
                </div>
              )}

              {/* Results */}
              {scoreResult && (
                <div>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
                    <div>
                      <div style={{ fontSize: 10, color: C.charcoal, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 }}>Weighted Score</div>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 80, fontWeight: 600, lineHeight: 1, color: scoreColor(weightedScore) }}>{weightedScore}</div>
                      <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>/ 100</div>
                    </div>
                    <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                      <div style={{ padding: "6px 14px", border: `1px solid ${tierColor(scoreResult.tier)}`, borderRadius: 2, color: tierColor(scoreResult.tier), fontSize: 11, fontWeight: 700, letterSpacing: "0.15em" }}>
                        {tierLabel(scoreResult.tier)}
                      </div>
                      {scoreResult.recommended_series_length && (
                        <div style={{ fontSize: 11, color: C.charcoal }}>{scoreResult.recommended_series_length}</div>
                      )}
                      <button onClick={runScore} style={{ background: "none", border: `1px solid ${C.ghost}`, color: C.dim, borderRadius: 3, padding: "5px 12px", cursor: "pointer", fontSize: 10, fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.08em" }}>
                        Re-run
                      </button>
                    </div>
                  </div>

                  {/* Result tabs */}
                  <div style={{ display: "flex", borderBottom: `1px solid ${C.ghost}`, marginBottom: 20 }}>
                    {[
                      { id: "scores",     label: "Scores" },
                      { id: "inventory",  label: `Inventory (${leads.length}L · ${supporting.length}S · ${sets.length} Sets)` },
                      { id: "assessment", label: "Assessment" },
                    ].map(t => (
                      <button key={t.id} onClick={() => setScoreTab(t.id)} style={{
                        background: "none", border: "none",
                        borderBottom: `2px solid ${scoreTab === t.id ? C.gold : "transparent"}`,
                        color: scoreTab === t.id ? C.gold : C.charcoal,
                        fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600,
                        letterSpacing: "0.1em", textTransform: "uppercase",
                        padding: "8px 16px", cursor: "pointer", marginBottom: -1,
                      }}>{t.label}</button>
                    ))}
                  </div>

                  {/* Scores tab */}
                  {scoreTab === "scores" && (
                    <div style={{ columns: 2, columnGap: 24 }}>
                      {CRITERIA.map(c => {
                        const score = scoreResult.scores[c.id] || 0;
                        const isNew = c.id === "character_economy" || c.id === "set_economy";
                        return (
                          <div key={c.id} style={{ breakInside: "avoid", marginBottom: 16, paddingLeft: isNew ? 8 : 0, borderLeft: `2px solid ${isNew ? C.gold + "44" : "transparent"}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                              <span style={{ fontSize: 12, color: C.cream, fontWeight: 500 }}>{c.label}{isNew ? " ✦" : ""}</span>
                              <span style={{ fontSize: 14, fontWeight: 700, color: scoreColor(score) }}>{score}</span>
                            </div>
                            <div style={{ background: C.panel, height: 3, borderRadius: 2, marginBottom: 4 }}>
                              <div style={{ background: scoreColor(score), width: `${score}%`, height: "100%", borderRadius: 2, opacity: 0.85 }} />
                            </div>
                            <div style={{ fontSize: 10, color: C.dim, lineHeight: 1.5 }}>{scoreResult.rationale?.[c.id]}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Inventory tab */}
                  {scoreTab === "inventory" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                      {[
                        { title: "Lead Characters", items: leads,      count: leads.length,      ideal: "2–3", ok: leads.length >= 2 && leads.length <= 3,           accent: C.gold,       nameColor: C.cream,     isSet: false },
                        { title: "Supporting",       items: supporting, count: supporting.length, ideal: "4–8", ok: supporting.length >= 4 && supporting.length <= 8, accent: C.charcoal,   nameColor: "#8a8578",   isSet: false },
                        { title: "Sets / Locations", items: sets,       count: sets.length,       ideal: "3–8", ok: sets.length >= 3 && sets.length <= 8,             accent: C.green+"88", nameColor: "#6ee7a0",   isSet: true  },
                      ].map(col => (
                        <div key={col.title} style={{ background: C.panel, borderRadius: 4, padding: 16, borderTop: `2px solid ${col.accent}` }}>
                          <div style={{ fontSize: 10, color: col.accent, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12, display: "flex", justifyContent: "space-between" }}>
                            {col.title}
                            <span style={{ background: col.accent + "22", padding: "1px 7px", borderRadius: 10 }}>{col.count}</span>
                          </div>
                          {col.items.length === 0
                            ? <div style={{ fontSize: 11, color: C.dim }}>None identified</div>
                            : col.items.map((item, i) => (
                              <div key={i} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: i < col.items.length - 1 ? `1px solid ${C.ghost}` : "none" }}>
                                <div style={{ fontSize: 12, color: col.nameColor, fontWeight: 500 }}>{item.name}</div>
                                <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>{col.isSet ? item.description : item.role}</div>
                              </div>
                            ))
                          }
                          <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px solid ${C.ghost}` }}>
                            <div style={{ fontSize: 10, color: col.ok ? C.green : C.gold }}>{col.ok ? "✓ Optimal" : "⚠ Outside ideal"}</div>
                            <div style={{ fontSize: 9, color: C.dim, marginTop: 1 }}>Ideal: {col.ideal}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Assessment tab */}
                  {scoreTab === "assessment" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div style={{ background: C.panel, padding: 14, borderRadius: 3, borderLeft: `2px solid ${C.green}` }}>
                          <div style={{ fontSize: 9, color: C.green, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>Top Strength</div>
                          <div style={{ fontSize: 12, color: "#8a8578", lineHeight: 1.5 }}>{scoreResult.top_strength}</div>
                        </div>
                        <div style={{ background: C.panel, padding: 14, borderRadius: 3, borderLeft: `2px solid ${C.red}` }}>
                          <div style={{ fontSize: 9, color: C.red, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>Top Risk</div>
                          <div style={{ fontSize: 12, color: "#8a8578", lineHeight: 1.5 }}>{scoreResult.top_risk}</div>
                        </div>
                      </div>
                      <div style={{ background: C.panel, padding: 16, borderRadius: 3 }}>
                        <div style={{ fontSize: 9, color: C.charcoal, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 8 }}>Overall Assessment</div>
                        <div style={{ fontSize: 13, color: "#8a8578", lineHeight: 1.7 }}>{scoreResult.tier_rationale}</div>
                      </div>
                      <div style={{ background: C.panel, padding: 16, borderRadius: 3 }}>
                        <div style={{ fontSize: 9, color: C.charcoal, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12 }}>Production Snapshot</div>
                        <div style={{ display: "flex", gap: 28 }}>
                          {[
                            { label: "Leads",      value: leads.length,                           ideal: "2–3", ok: leads.length >= 2 && leads.length <= 3 },
                            { label: "Supporting", value: supporting.length,                       ideal: "4–8", ok: supporting.length >= 4 && supporting.length <= 8 },
                            { label: "Total Cast", value: leads.length + supporting.length,        ideal: "6–11", ok: (leads.length + supporting.length) >= 6 && (leads.length + supporting.length) <= 11 },
                            { label: "Sets",       value: sets.length,                            ideal: "3–8", ok: sets.length >= 3 && sets.length <= 8 },
                          ].map(item => (
                            <div key={item.label} style={{ textAlign: "center" }}>
                              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 600, color: item.ok ? C.green : C.gold, lineHeight: 1 }}>{item.value}</div>
                              <div style={{ fontSize: 10, color: C.charcoal, marginTop: 3 }}>{item.label}</div>
                              <div style={{ fontSize: 9, color: C.dim, marginTop: 1 }}>ideal {item.ideal}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ══ FUTURE STEPS ══ */}
          {(step === "episodes" || step === "script") && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", animation: "fadeIn 0.2s ease" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, opacity: 0.12, marginBottom: 16 }}>⬡</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: C.dim, marginBottom: 8 }}>
                  {step === "episodes" ? "Episode Generator" : "Script Writer"}
                </div>
                <div style={{ fontSize: 12, color: C.dim, maxWidth: 300, lineHeight: 1.7, margin: "0 auto" }}>
                  This module is in development. It will use the IP Score output to generate a full episode structure and Veo-ready scene prompts.
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
