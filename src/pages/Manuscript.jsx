import { useState, useRef, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

// ── Supabase (reads VITE_ env vars; gracefully no-ops if unconfigured) ────────
const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL  || "";
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabase     = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// ── NVPairs default fallbacks ─────────────────────────────────────────────────
const NV_DEFAULTS = {
  royalty_type:      ["Royalty-Free", "Free Proprietary", "One-Time Payment", "Residuals", "Custom", "Other"],
  author_role:       ["Author", "Co-Author", "Editor", "Illustrator", "Translator"],
  fiction_nonfiction:["Fiction", "Non-Fiction"],
};

// ── Brand tokens ──────────────────────────────────────────────────────────────
const C = {
  ink: "#1A1810", cream: "#F7F2E8", gold: "#C9924A", charcoal: "#5C574E",
  dim: "#3a3830", ghost: "#2a2820", panel: "#12110d",
  green: "#4ade80", red: "#f87171", amber: "#fb923c", teal: "#6ee7b7",
};

const CRITERIA = [
  { id: "episodic_structure",  label: "Episodic Structure",  weight: 0.18 },
  { id: "emotional_velocity",  label: "Emotional Velocity",  weight: 0.18 },
  { id: "dialogue_density",    label: "Dialogue Density",    weight: 0.12 },
  { id: "character_clarity",   label: "Character Clarity",   weight: 0.12 },
  { id: "character_economy",   label: "Character Economy",   weight: 0.10 },
  { id: "set_economy",         label: "Set Economy",         weight: 0.10 },
  { id: "scene_variety",       label: "Scene Variety",       weight: 0.08 },
  { id: "platform_fit",        label: "Platform Fit",        weight: 0.07 },
  { id: "adaptation_fidelity", label: "Adaptation Fidelity", weight: 0.05 },
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

const STEPS = [
  { id: "intake",   num: "01", label: "Intake",   desc: "Metadata & manuscript" },
  { id: "score",    num: "02", label: "IP Score", desc: "Suitability analysis" },
  { id: "episodes", num: "03", label: "Episodes", desc: "Generate episode structure", soon: true },
  { id: "script",   num: "04", label: "Script",   desc: "Write episode scripts",      soon: true },
];

const emptyAuthor = (roles) => ({ name: "", role: roles[0] || "Author" });
const emptyLang   = () => ({ key: "Primary", value: "English" });

const scoreColor = (s) => s >= 75 ? C.green : s >= 50 ? C.amber : C.red;
const tierColor  = (t) => t === "fast_track" ? C.green : t === "review" ? C.amber : C.red;
const tierLabel  = (t) => t === "fast_track" ? "FAST TRACK" : t === "review" ? "UNDER REVIEW" : "PASS";

const inp = (extra = {}) => ({
  background: C.panel, border: `1px solid ${C.ghost}`, borderRadius: 3,
  color: C.cream, fontFamily: "'DM Sans', sans-serif", fontSize: 13,
  padding: "9px 12px", outline: "none", width: "100%", boxSizing: "border-box", ...extra,
});

// ── Helpers ───────────────────────────────────────────────────────────────────
function extractBulkExcerpt(fullText) {
  const words = fullText.split(/\s+/).filter(Boolean);
  const total = words.length;
  if (total <= 6000) return fullText;
  const opening  = words.slice(0, 3000).join(" ");
  const midStart = Math.floor(total / 2) - 750;
  const midpoint = words.slice(midStart, midStart + 1500).join(" ");
  const closing  = words.slice(total - 1500).join(" ");
  return `[OPENING — words 1–3000]\n${opening}\n\n[MIDPOINT — words ${midStart}–${midStart + 1500}]\n${midpoint}\n\n[CLOSING — final 1500 words]\n${closing}`;
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = (e) => resolve(e.target.result);
    reader.onerror = ()  => reject(new Error("Failed to read file"));
    reader.readAsText(file);
  });
}

// ── Sub-components ─────────────────────────────────────────────────────────────
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

function Field({ label, required, hint, children, half }) {
  return (
    <div style={{ marginBottom: 14, ...(half ? { flex: 1 } : {}) }}>
      <div style={{ fontSize: 10, color: required ? C.gold : C.charcoal, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 5 }}>
        {label}{required ? " *" : ""}
      </div>
      {children}
      {hint && <div style={{ fontSize: 10, color: C.dim, marginTop: 4, lineHeight: 1.4 }}>{hint}</div>}
    </div>
  );
}

function UploadZone({ label, accept, file, onFile, hint }) {
  const ref = useRef();
  const [dragging, setDragging] = useState(false);
  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0]; if (f) onFile(f);
  };
  return (
    <div>
      <div style={{ fontSize: 10, color: C.charcoal, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
      <div onClick={() => ref.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        style={{ border: `1px dashed ${dragging ? C.gold : file ? C.green : C.ghost}`, borderRadius: 4, padding: "13px 14px", cursor: "pointer", background: dragging ? `${C.gold}08` : file ? `${C.green}08` : "transparent", display: "flex", alignItems: "center", gap: 10, transition: "all 0.15s" }}>
        <div style={{ fontSize: 20, opacity: 0.4, lineHeight: 1, flexShrink: 0 }}>{file ? "✓" : "↑"}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: file ? C.green : C.cream, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {file ? file.name : "Click or drag file here"}
          </div>
          <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>{hint}</div>
        </div>
        {file && <button onClick={(e) => { e.stopPropagation(); onFile(null); }} style={{ background: "none", border: "none", color: C.dim, cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 2px", flexShrink: 0 }}>×</button>}
      </div>
      <input ref={ref} type="file" accept={accept} style={{ display: "none" }} onChange={(e) => { onFile(e.target.files[0] || null); e.target.value = ""; }} />
    </div>
  );
}

// ── URL Fetch input ────────────────────────────────────────────────────────────
function UrlFetchInput({ onFetched, isManuscript }) {
  const [url,     setUrl]     = useState("");
  const [status,  setStatus]  = useState(null); // null | "loading" | "ok" | "error"
  const [errMsg,  setErrMsg]  = useState("");
  const [fetched, setFetched] = useState(null);

  const doFetch = async () => {
    if (!url.trim()) return;
    setStatus("loading"); setErrMsg("");
    try {
      const res  = await fetch(url.trim());
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      // Strip HTML tags if HTML response
      const clean = text.replace(/<[^>]+>/g, " ").replace(/\s{2,}/g, " ").trim();
      if (clean.length < 200) throw new Error("Retrieved text is too short — try a plain text URL");
      setFetched({ url: url.trim(), text: clean, words: clean.split(/\s+/).filter(Boolean).length });
      setStatus("ok");
      onFetched(isManuscript ? extractBulkExcerpt(clean) : clean, url.trim());
    } catch (err) {
      setStatus("error");
      setErrMsg(err.message.includes("Failed to fetch")
        ? "CORS blocked — try a direct .txt URL (e.g. gutenberg.org/files/…/…-0.txt)"
        : err.message);
    }
  };

  const clear = () => { setUrl(""); setStatus(null); setFetched(null); setErrMsg(""); onFetched(null, null); };

  return (
    <div>
      <div style={{ fontSize: 10, color: C.charcoal, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>
        {isManuscript ? "Fetch Full Manuscript by URL" : "Fetch Excerpt by URL"}
      </div>
      {fetched ? (
        <div style={{ border: `1px solid ${C.green}55`, borderRadius: 4, padding: "10px 14px", background: `${C.green}08`, display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 20, opacity: 0.6, flexShrink: 0 }}>✓</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: C.green, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{fetched.url}</div>
            <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>{fetched.words.toLocaleString()} words fetched{isManuscript ? " → bulk extract applied" : ""}</div>
          </div>
          <button onClick={clear} style={{ background: "none", border: "none", color: C.dim, cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 2px", flexShrink: 0 }}>×</button>
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8 }}>
          <input value={url} onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === "Enter" && doFetch()}
            placeholder={isManuscript ? "https://gutenberg.org/files/1342/1342-0.txt" : "https://example.com/excerpt.txt"}
            style={inp({ flex: 1 })} />
          <button onClick={doFetch} disabled={!url.trim() || status === "loading"} style={{
            background: url.trim() ? `${C.gold}18` : C.ghost, border: `1px solid ${url.trim() ? C.gold + "55" : C.ghost}`,
            color: url.trim() ? C.gold : C.dim, borderRadius: 3, padding: "8px 14px",
            cursor: url.trim() ? "pointer" : "not-allowed", fontSize: 11, fontWeight: 600,
            fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap",
          }}>{status === "loading" ? "Fetching…" : "Fetch"}</button>
        </div>
      )}
      {status === "error" && <div style={{ fontSize: 10, color: C.red, marginTop: 5, lineHeight: 1.4 }}>✗ {errMsg}</div>}
    </div>
  );
}

// ── Discovery JSON import ─────────────────────────────────────────────────────
function DiscoveryImport({ onImport, authorRoles }) {
  const [open,    setOpen]    = useState(false);
  const [json,    setJson]    = useState("");
  const [error,   setError]   = useState("");
  const [preview, setPreview] = useState(null);
  const fileRef = useRef();

  const parse = (raw) => {
    try {
      const data = JSON.parse(raw);
      // Map culmina-ip-discovery-v5 fields → intake form fields
      const mapped = {};
      if (data.title)             mapped.title = data.title;
      if (data.royalty_type)      mapped.royalty_type = data.royalty_type;
      if (data.rights_type)       mapped.royalty_type = data.rights_type;
      if (data.publisher)         mapped.publisher = data.publisher;
      if (data.publisher_city)    mapped.publisher_city = data.publisher_city;
      if (data.copyright_year)    mapped.copyright_year = String(data.copyright_year || "");
      if (data.lccn_print)        mapped.lccn_print = data.lccn_print;
      if (data.lccn_ebook)        mapped.lccn_ebook = data.lccn_ebook;
      if (data.bisac)             mapped.bisac = data.bisac;
      if (data.genre)             mapped.genre = data.genre;
      if (data.fiction_nonfiction) mapped.fiction_nonfiction = data.fiction_nonfiction;
      if (data.summary)           mapped.summary = data.summary;
      if (data.excerpt)           mapped.excerpt = data.excerpt;
      if (data.languages)         mapped.languages = data.languages;

      // Authors — handle array or single object
      if (data.authors && Array.isArray(data.authors)) {
        mapped.authors = data.authors.map(a => ({
          name: a.name || a.author_name || "",
          role: a.role || authorRoles[0] || "Author",
        }));
      } else if (data.author_name || data.author) {
        mapped.authors = [{ name: data.author_name || data.author, role: authorRoles[0] || "Author" }];
      }

      if (Object.keys(mapped).length === 0) throw new Error("No recognizable fields found in this JSON");
      setPreview(mapped);
      setError("");
    } catch (err) {
      setError(err.message); setPreview(null);
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const text = await readFileAsText(file);
    setJson(text); parse(text);
    e.target.value = "";
  };

  const handlePaste = (e) => { const v = e.target.value; setJson(v); if (v.trim()) parse(v); };

  const apply = () => { onImport(preview); setOpen(false); setJson(""); setPreview(null); };

  return (
    <>
      {/* Trigger button */}
      <button onClick={() => setOpen(true)} style={{
        background: "none", border: `1px solid ${C.ghost}`, color: C.charcoal, borderRadius: 3,
        padding: "8px 16px", cursor: "pointer", fontSize: 11, fontFamily: "'DM Sans', sans-serif",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{ fontSize: 14, opacity: 0.6 }}>⬇</span>
        Import from IP Discovery Tool
      </button>

      {/* Modal */}
      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#1a1810", border: `1px solid ${C.ghost}`, borderRadius: 6, padding: 28, maxWidth: 560, width: "100%", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, marginBottom: 4 }}>Import from IP Discovery Tool</div>
            <div style={{ fontSize: 11, color: C.charcoal, marginBottom: 20, lineHeight: 1.6 }}>
              Load a JSON export from <strong style={{ color: C.cream }}>culmina-ip-discovery-v5</strong> to pre-populate the intake form. You can upload the file or paste the JSON directly.
            </div>

            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <button onClick={() => fileRef.current.click()} style={{ background: `${C.gold}15`, border: `1px solid ${C.gold}44`, color: C.gold, borderRadius: 3, padding: "7px 14px", cursor: "pointer", fontSize: 11, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>
                Upload JSON File
              </button>
              <input ref={fileRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleFile} />
              <span style={{ fontSize: 11, color: C.dim, alignSelf: "center" }}>or paste below</span>
            </div>

            <textarea value={json} onChange={handlePaste} placeholder='{ "title": "…", "authors": […], … }'
              rows={6} style={{ ...inp({ resize: "none", marginBottom: 12, fontSize: 11, flex: "none" }) }} />

            {error   && <div style={{ fontSize: 11, color: C.red,   marginBottom: 12, lineHeight: 1.4 }}>✗ {error}</div>}

            {preview && (
              <div style={{ background: C.panel, borderRadius: 3, padding: "12px 14px", marginBottom: 16, overflowY: "auto", flex: 1 }}>
                <div style={{ fontSize: 10, color: C.teal, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>Fields to import</div>
                {Object.entries(preview).map(([k, v]) => (
                  <div key={k} style={{ display: "flex", gap: 10, marginBottom: 6, alignItems: "flex-start" }}>
                    <div style={{ fontSize: 10, color: C.charcoal, textTransform: "uppercase", letterSpacing: "0.08em", width: 130, flexShrink: 0, paddingTop: 1 }}>{k.replace(/_/g, " ")}</div>
                    <div style={{ fontSize: 11, color: C.cream, lineHeight: 1.4, wordBreak: "break-word" }}>
                      {Array.isArray(v) ? v.map(a => a.name || JSON.stringify(a)).join(", ") : String(v).slice(0, 80)}{String(v).length > 80 ? "…" : ""}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexShrink: 0 }}>
              <button onClick={() => { setOpen(false); setJson(""); setPreview(null); setError(""); }}
                style={{ background: "none", border: `1px solid ${C.ghost}`, color: C.charcoal, borderRadius: 3, padding: "8px 18px", cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>
                Cancel
              </button>
              <button onClick={apply} disabled={!preview} style={{
                background: preview ? C.gold : C.dim, color: C.ink, border: "none", borderRadius: 3,
                padding: "8px 22px", cursor: preview ? "pointer" : "not-allowed",
                fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif",
              }}>Apply to Form</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Conflict resolution modal ─────────────────────────────────────────────────
function ConflictModal({ onChoice, onCancel }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#1e1c16", border: `1px solid ${C.ghost}`, borderRadius: 6, padding: 32, maxWidth: 460, width: "92%" }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, marginBottom: 8 }}>Multiple sources provided</div>
        <div style={{ fontSize: 13, color: C.charcoal, lineHeight: 1.6, marginBottom: 24 }}>
          You have both a typed/uploaded excerpt and a full manuscript. Which should Opus use for scoring?
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={() => onChoice("full")} style={{ background: `${C.gold}15`, border: `1px solid ${C.gold}55`, color: C.gold, borderRadius: 4, padding: "14px 18px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, textAlign: "left" }}>
            <div style={{ marginBottom: 3 }}>Full Manuscript <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.7 }}>— recommended</span></div>
            <div style={{ fontSize: 11, color: C.charcoal, fontWeight: 400 }}>Extract opening, midpoint &amp; closing — broadest signal</div>
          </button>
          <button onClick={() => onChoice("excerpt")} style={{ background: C.panel, border: `1px solid ${C.ghost}`, color: C.charcoal, borderRadius: 4, padding: "14px 18px", cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 13, textAlign: "left" }}>
            <div style={{ marginBottom: 3 }}>Excerpt / Typed Text</div>
            <div style={{ fontSize: 11, color: C.dim, fontWeight: 400 }}>Use the excerpt source as-is</div>
          </button>
          <button onClick={onCancel} style={{ background: "none", border: "none", color: C.dim, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", fontSize: 11, paddingTop: 6, textAlign: "center" }}>
            Cancel — go back and edit
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Soft gate ─────────────────────────────────────────────────────────────────
function SoftGate({ score, onProceed, onOverride }) {
  const [revealed, setRevealed] = useState(false);
  if (score >= 75) {
    return (
      <button onClick={onProceed} style={{ background: C.green, color: C.ink, border: "none", borderRadius: 3, padding: "12px 28px", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}>
        Proceed to Episodes →
      </button>
    );
  }
  if (score >= 50) {
    return (
      <div style={{ background: `${C.amber}0e`, border: `1px solid ${C.amber}44`, borderRadius: 4, padding: "16px 20px" }}>
        <div style={{ fontSize: 11, color: C.amber, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>⚠ Below Recommended Threshold</div>
        <div style={{ fontSize: 12, color: C.charcoal, lineHeight: 1.6, marginBottom: 14 }}>Score of {score}/100 — Fast Track requires 75+. You may override and proceed, but production outcomes may be suboptimal.</div>
        <button onClick={onOverride} style={{ background: `${C.amber}22`, border: `1px solid ${C.amber}55`, color: C.amber, borderRadius: 3, padding: "9px 20px", fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          Override &amp; Proceed Anyway
        </button>
      </div>
    );
  }
  return (
    <div style={{ background: `${C.red}0e`, border: `1px solid ${C.red}44`, borderRadius: 4, padding: "16px 20px" }}>
      <div style={{ fontSize: 11, color: C.red, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>✗ Not Recommended for Production</div>
      <div style={{ fontSize: 12, color: C.charcoal, lineHeight: 1.6, marginBottom: 14 }}>Score of {score}/100 — Opus recommends against adapting this title without significant rework.</div>
      {!revealed
        ? <button onClick={() => setRevealed(true)} style={{ background: "none", border: `1px solid ${C.red}44`, color: C.red, borderRadius: 3, padding: "8px 16px", fontFamily: "'DM Sans', sans-serif", fontSize: 11, cursor: "pointer", opacity: 0.7 }}>I understand — show override option</button>
        : <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={onOverride} style={{ background: `${C.red}18`, border: `1px solid ${C.red}55`, color: C.red, borderRadius: 3, padding: "9px 20px", fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Override &amp; Proceed Anyway</button>
            <span style={{ fontSize: 10, color: C.dim }}>Override will be logged</span>
          </div>
      }
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function Manuscript() {
  // ── NVPairs ──────────────────────────────────────────────────────────────────
  const [nvPairs, setNvPairs] = useState(NV_DEFAULTS);
  const [nvStatus, setNvStatus] = useState("idle"); // idle | loading | ok | error

  useEffect(() => {
    if (!supabase) return;
    setNvStatus("loading");
    supabase
      .from("nvpairs")
      .select("category, label, value, sort_order")
      .in("category", ["royalty_type", "author_role", "fiction_nonfiction"])
      .order("sort_order", { ascending: true })
      .then(({ data, error }) => {
        if (error || !data?.length) { setNvStatus("error"); return; }
        const grouped = data.reduce((acc, row) => {
          if (!acc[row.category]) acc[row.category] = [];
          acc[row.category].push(row.label || row.value);
          return acc;
        }, {});
        setNvPairs(prev => ({ ...prev, ...grouped }));
        setNvStatus("ok");
      });
  }, []);

  const royaltyOpts  = nvPairs.royalty_type       || NV_DEFAULTS.royalty_type;
  const authorRoles  = nvPairs.author_role         || NV_DEFAULTS.author_role;
  const fictionOpts  = nvPairs.fiction_nonfiction  || NV_DEFAULTS.fiction_nonfiction;

  // ── Step / form state ────────────────────────────────────────────────────────
  const [step, setStep]             = useState("intake");
  const [intakeDone, setIntakeDone] = useState(false);

  const [form, setForm] = useState({
    title: "", royalty_type: "",
    authors: [emptyAuthor(authorRoles)],
    publisher: "", publisher_city: "", copyright_year: "",
    lccn_print: "", lccn_ebook: "",
    bisac: "", genre: "", fiction_nonfiction: "Fiction",
    languages: [emptyLang()],
    summary: "", excerpt: "",
  });
  const [errors, setErrors]         = useState({});
  const [lccnStatus, setLccnStatus] = useState(null);

  // ── Source state ─────────────────────────────────────────────────────────────
  const [excerptFile,    setExcerptFile]    = useState(null);
  const [excerptUrl,     setExcerptUrl]     = useState(null);   // { url, text }
  const [manuscriptFile, setManuscriptFile] = useState(null);
  const [manuscriptUrl,  setManuscriptUrl]  = useState(null);   // { url, text }
  const [showConflict,   setShowConflict]   = useState(false);
  const [fileStatus,     setFileStatus]     = useState(null);

  // ── Score state ──────────────────────────────────────────────────────────────
  const [scoreResult,    setScoreResult]    = useState(null);
  const [scoring,        setScoring]        = useState(false);
  const [scoreError,     setScoreError]     = useState(null);
  const [scoreTab,       setScoreTab]       = useState("scores");
  const [evalWordCount,  setEvalWordCount]  = useState(0);

  const [apiKey,  setApiKey]  = useState(localStorage.getItem("culmina_api_key") || "");
  const [showKey, setShowKey] = useState(false);
  const saveApiKey = (val) => { setApiKey(val); localStorage.setItem("culmina_api_key", val); };

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const setAuthor    = (i, k, v) => setForm(f => { const a = [...f.authors]; a[i] = { ...a[i], [k]: v }; return { ...f, authors: a }; });
  const addAuthor    = () => setForm(f => ({ ...f, authors: [...f.authors, emptyAuthor(authorRoles)] }));
  const removeAuthor = (i) => setForm(f => ({ ...f, authors: f.authors.filter((_, x) => x !== i) }));

  const setLang      = (i, k, v) => setForm(f => { const l = [...f.languages]; l[i] = { ...l[i], [k]: v }; return { ...f, languages: l }; });
  const addLang      = () => setForm(f => ({ ...f, languages: [...f.languages, emptyLang()] }));
  const removeLang   = (i) => setForm(f => ({ ...f, languages: f.languages.filter((_, x) => x !== i) }));

  const lookupLCCN = async () => {
    const lccn = form.lccn_print.trim(); if (!lccn) return;
    setLccnStatus("loading");
    try {
      const res  = await fetch(`https://openlibrary.org/api/books?bibkeys=LCCN:${lccn}&format=json&jscmd=data`);
      const data = await res.json();
      const key  = `LCCN:${lccn}`;
      if (!data[key]) { setLccnStatus("fail"); return; }
      const b = data[key]; const u = {};
      if (b.title)                                        u.title          = b.title;
      if (b.authors?.length)                              u.authors        = b.authors.map(a => ({ name: a.name, role: authorRoles[0] || "Author" }));
      if (b.publishers?.length)                           u.publisher      = b.publishers[0].name;
      if (b.publish_places?.length)                       u.publisher_city = b.publish_places[0].name;
      if (b.publish_date)                                 u.copyright_year = b.publish_date.replace(/\D/g, "").slice(0, 4);
      if (b.description)                                  u.summary        = typeof b.description === "string" ? b.description : (b.description.value || "");
      if (b.subjects?.length)                             u.genre          = b.subjects.slice(0, 3).map(s => typeof s === "string" ? s : s.name).join("; ");
      if (b.classifications?.lc_classifications?.length) u.bisac           = b.classifications.lc_classifications[0];
      setForm(f => ({ ...f, ...u }));
      setLccnStatus("ok");
    } catch { setLccnStatus("fail"); }
  };

  // ── Discovery import handler ──────────────────────────────────────────────────
  const handleDiscoveryImport = (mapped) => {
    setForm(f => ({
      ...f,
      ...mapped,
      authors:   mapped.authors   || f.authors,
      languages: mapped.languages || f.languages,
    }));
  };

  // ── Source resolution ─────────────────────────────────────────────────────────
  const typedWords     = form.excerpt.trim().split(/\s+/).filter(Boolean).length;
  const hasTyped       = typedWords >= 100;
  const hasExcerptFile = !!excerptFile;
  const hasExcerptUrl  = !!excerptUrl;
  const hasManuscript  = !!(manuscriptFile || manuscriptUrl);

  const hasExcerptAny  = hasTyped || hasExcerptFile || hasExcerptUrl;

  const sourceLabel = () => {
    const parts = [];
    if (manuscriptFile)  parts.push(`Manuscript file: ${manuscriptFile.name}`);
    if (manuscriptUrl)   parts.push(`Manuscript URL: ${manuscriptUrl.url}`);
    if (hasExcerptFile)  parts.push(`Excerpt file: ${excerptFile.name}`);
    if (hasExcerptUrl)   parts.push(`Excerpt URL: ${excerptUrl.url}`);
    if (hasTyped)        parts.push(`Typed excerpt: ${typedWords} words`);
    if (parts.length === 0) return null;
    if (parts.length === 1) return parts[0];
    return `${parts.length} sources — will prompt on score`;
  };

  // ── Run score ─────────────────────────────────────────────────────────────────
  const runScore = async (textToEval) => {
    if (!apiKey) { setScoreError("Enter your Anthropic API key in the bar above."); return; }
    setScoring(true); setScoreError(null); setScoreResult(null); setScoreTab("scores");
    setEvalWordCount(textToEval.split(/\s+/).filter(Boolean).length);
    try {
      const res = await fetch("/anthropic/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({
          model: "claude-opus-4-5", max_tokens: 4000, system: SCORE_PROMPT,
          messages: [{ role: "user", content: `Title: "${form.title}"\n\nExcerpt:\n\n${textToEval}` }],
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const text = data.content?.find(b => b.type === "text")?.text || "";
      setScoreResult(JSON.parse(text.replace(/```json|```/g, "").trim()));
    } catch (err) { setScoreError("Analysis failed: " + err.message); }
    finally { setScoring(false); }
  };

  const resolveAndScore = async () => {
    setScoreError(null);
    if (hasExcerptAny && hasManuscript) { setShowConflict(true); return; }
    setFileStatus("reading");
    try {
      if (manuscriptUrl) {
        setFileStatus("done"); await runScore(extractBulkExcerpt(manuscriptUrl.text));
      } else if (manuscriptFile) {
        const t = await readFileAsText(manuscriptFile); setFileStatus("done"); await runScore(extractBulkExcerpt(t));
      } else if (excerptUrl) {
        setFileStatus("done"); await runScore(excerptUrl.text);
      } else if (hasExcerptFile) {
        const t = await readFileAsText(excerptFile); setFileStatus("done"); await runScore(t);
      } else if (hasTyped) {
        setFileStatus("done"); await runScore(form.excerpt);
      } else {
        setFileStatus(null); setScoreError("Provide a typed excerpt (100+ words), upload a file, or fetch by URL.");
      }
    } catch { setFileStatus("error"); setScoreError("Could not read file — try a plain .txt version."); }
  };

  const handleConflictChoice = async (choice) => {
    setShowConflict(false); setFileStatus("reading");
    try {
      if (choice === "full") {
        if (manuscriptUrl)  { setFileStatus("done"); await runScore(extractBulkExcerpt(manuscriptUrl.text)); }
        else                { const t = await readFileAsText(manuscriptFile); setFileStatus("done"); await runScore(extractBulkExcerpt(t)); }
      } else {
        if (excerptUrl)     { setFileStatus("done"); await runScore(excerptUrl.text); }
        else if (hasExcerptFile) { const t = await readFileAsText(excerptFile); setFileStatus("done"); await runScore(t); }
        else                { setFileStatus("done"); await runScore(form.excerpt); }
      }
    } catch { setFileStatus("error"); setScoreError("Could not read file."); }
  };

  const validateIntake = () => {
    const e = {};
    if (!form.title.trim())                                  e.title        = "Title is required";
    if (!form.royalty_type)                                  e.royalty_type = "Royalty type is required";
    if (!form.authors.some(a => a.name.trim()))              e.authors      = "At least one author name is required";
    if (!hasTyped && !hasManuscript && !hasExcerptAny)       e.excerpt      = "Provide a typed excerpt (100+ words), upload a file, or fetch by URL";
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleIntakeSubmit = () => { if (validateIntake()) { setIntakeDone(true); setStep("score"); } };

  const weightedScore = scoreResult ? Math.round(CRITERIA.reduce((s, c) => s + (scoreResult.scores[c.id] || 0) * c.weight, 0)) : null;
  const leads      = scoreResult?.character_inventory?.leads      || [];
  const supporting = scoreResult?.character_inventory?.supporting || [];
  const sets       = scoreResult?.set_inventory                   || [];

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: C.ink, minHeight: "100vh", color: C.cream, display: "flex", flexDirection: "column" }}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
      <style>{`
        input::placeholder, textarea::placeholder { color: #3a3830; }
        select option { background: #1A1810; color: #F7F2E8; }
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#12110d}::-webkit-scrollbar-thumb{background:#2a2820;border-radius:2px}
        @keyframes spin   { to { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
        input,textarea,select { color-scheme: dark; }
      `}</style>

      {showConflict && <ConflictModal onChoice={handleConflictChoice} onCancel={() => setShowConflict(false)} />}

      {/* ── API Key bar ── */}
      <div style={{ borderBottom: `1px solid ${C.ghost}`, padding: "7px 28px", display: "flex", alignItems: "center", gap: 10, background: "#0f0e0b", flexShrink: 0 }}>
        <span style={{ fontSize: 10, color: C.dim, letterSpacing: "0.12em", textTransform: "uppercase", whiteSpace: "nowrap" }}>Anthropic API Key</span>
        <input type={showKey ? "text" : "password"} value={apiKey} onChange={e => saveApiKey(e.target.value)}
          placeholder="sk-ant-…" style={{ ...inp({ flex: 1, maxWidth: 340, padding: "5px 10px", fontSize: 12 }) }} />
        <button onClick={() => setShowKey(v => !v)} style={{ background: "none", border: `1px solid ${C.ghost}`, color: C.dim, borderRadius: 3, padding: "4px 10px", cursor: "pointer", fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}>
          {showKey ? "Hide" : "Show"}
        </button>
        <span style={{ fontSize: 10, color: apiKey ? (apiKey.startsWith("sk-ant-") ? C.green : C.amber) : C.dim }}>
          {apiKey ? (apiKey.startsWith("sk-ant-") ? "✓ Key set" : "⚠ Check format") : "Required for scoring"}
        </span>
        {nvStatus === "ok"      && <span style={{ marginLeft: "auto", fontSize: 9, color: C.teal  }}>NV ✓ Supabase</span>}
        {nvStatus === "error"   && <span style={{ marginLeft: "auto", fontSize: 9, color: C.amber }}>NV ⚠ using defaults</span>}
        {nvStatus === "loading" && <span style={{ marginLeft: "auto", fontSize: 9, color: C.dim   }}>NV loading…</span>}
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* ── Sidebar ── */}
        <div style={{ width: 200, borderRight: `1px solid ${C.ghost}`, padding: "24px 0", flexShrink: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          {STEPS.map(s => {
            const isActive   = step === s.id;
            const isComplete = s.id === "intake" ? intakeDone : s.id === "score" ? !!scoreResult : false;
            const isLocked   = s.soon || (s.id === "score" && !intakeDone);
            const canClick   = !isLocked && (s.id === "intake" || intakeDone);
            return (
              <div key={s.id} onClick={() => canClick && setStep(s.id)} style={{ padding: "14px 20px", cursor: canClick ? "pointer" : "default", background: isActive ? `${C.gold}18` : "transparent", borderLeft: `3px solid ${isActive ? C.gold : "transparent"}`, opacity: isLocked ? 0.3 : 1, transition: "all 0.15s" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <span style={{ fontSize: 10, color: isActive ? C.gold : C.dim, fontWeight: 700, letterSpacing: "0.1em" }}>{s.num}</span>
                  {isComplete && <span style={{ fontSize: 9, color: C.green }}>✓</span>}
                  {s.soon     && <span style={{ fontSize: 8, color: C.dim, letterSpacing: "0.1em", textTransform: "uppercase" }}>soon</span>}
                </div>
                <div style={{ fontSize: 13, color: isActive ? C.cream : C.charcoal, fontWeight: isActive ? 600 : 400 }}>{s.label}</div>
                <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>{s.desc}</div>
              </div>
            );
          })}
          <div style={{ marginTop: "auto", padding: "16px 20px", borderTop: `1px solid ${C.ghost}` }}>
            <div style={{ fontSize: 9, color: C.dim, lineHeight: 1.7 }}>PIPELINE v1.0</div>
          </div>
        </div>

        {/* ── Main panel ── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "28px 36px" }}>

          {/* ════ INTAKE ════ */}
          {step === "intake" && (
            <div style={{ maxWidth: 820, animation: "fadeIn 0.2s ease" }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
                <div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, marginBottom: 4 }}>Manuscript Intake</div>
                  <div style={{ fontSize: 12, color: C.charcoal }}>Complete required fields before IP scoring.</div>
                </div>
                <DiscoveryImport onImport={handleDiscoveryImport} authorRoles={authorRoles} />
              </div>

              {/* 1 — Required */}
              <Section title="Required" accent={C.gold}>
                <Field label="Manuscript Title" required>
                  <input value={form.title} onChange={e => set("title", e.target.value)} placeholder="Enter manuscript title" style={inp()} />
                  {errors.title && <div style={{ fontSize: 10, color: C.red, marginTop: 4 }}>{errors.title}</div>}
                </Field>

                <Field label="Royalty / Rights Type" required hint="Determines author compensation structure">
                  <select value={form.royalty_type} onChange={e => set("royalty_type", e.target.value)} style={inp()}>
                    <option value="">Select type…</option>
                    {royaltyOpts.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                  {errors.royalty_type && <div style={{ fontSize: 10, color: C.red, marginTop: 4 }}>{errors.royalty_type}</div>}
                </Field>

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, color: C.gold, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Authors *</div>
                  {form.authors.map((a, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                      <input value={a.name} onChange={e => setAuthor(i, "name", e.target.value)} placeholder={`Author ${i + 1} full name`} style={inp({ flex: 2 })} />
                      <select value={a.role} onChange={e => setAuthor(i, "role", e.target.value)} style={inp({ flex: 1, minWidth: 130 })}>
                        {authorRoles.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      {form.authors.length > 1 && (
                        <button onClick={() => removeAuthor(i)} style={{ background: "none", border: `1px solid ${C.ghost}`, color: C.dim, borderRadius: 3, padding: "6px 10px", cursor: "pointer", fontSize: 14, lineHeight: 1, fontFamily: "'DM Sans', sans-serif" }}>×</button>
                      )}
                    </div>
                  ))}
                  <button onClick={addAuthor} style={{ background: "none", border: `1px dashed ${C.dim}`, color: C.charcoal, borderRadius: 3, padding: "6px 14px", cursor: "pointer", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>+ Add Author</button>
                  {errors.authors && <div style={{ fontSize: 10, color: C.red, marginTop: 6 }}>{errors.authors}</div>}
                </div>
              </Section>

              {/* 2 — Manuscript & Excerpt */}
              <Section title="Manuscript &amp; Excerpt" accent={C.gold}>
                <div style={{ background: C.panel, border: `1px solid ${C.ghost}`, borderRadius: 4, padding: 18, marginBottom: 14 }}>
                  <div style={{ fontSize: 10, color: C.gold, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>Source Material for IP Scoring</div>
                  <div style={{ fontSize: 11, color: C.dim, lineHeight: 1.6, marginBottom: 18 }}>
                    Upload a file, fetch by URL, or paste text below. If both an excerpt and full manuscript are provided, Culmina will ask which to use — defaulting to the full manuscript.
                  </div>

                  {/* Upload row */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                    <UploadZone label="Upload Excerpt File" accept=".txt,.pdf,.doc,.docx,.epub"
                      file={excerptFile} onFile={setExcerptFile}
                      hint="TXT · PDF · DOC — excerpt content only" />
                    <UploadZone label="Upload Full Manuscript" accept=".txt,.pdf,.doc,.docx,.epub"
                      file={manuscriptFile} onFile={setManuscriptFile}
                      hint="TXT · PDF · DOC — Culmina extracts opening, midpoint &amp; closing" />
                  </div>

                  {/* URL row */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 18, paddingTop: 14, borderTop: `1px solid ${C.ghost}` }}>
                    <UrlFetchInput isManuscript={false}
                      onFetched={(text, url) => setExcerptUrl(text ? { url, text } : null)} />
                    <UrlFetchInput isManuscript={true}
                      onFetched={(text, url) => setManuscriptUrl(text ? { url, text } : null)} />
                  </div>

                  {/* Paste row */}
                  <div style={{ paddingTop: 14, borderTop: `1px solid ${C.ghost}` }}>
                    <div style={{ fontSize: 10, color: C.charcoal, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>Or type / paste excerpt directly</div>
                    <textarea value={form.excerpt} onChange={e => set("excerpt", e.target.value)}
                      placeholder="Paste manuscript excerpt here (500–3000 words recommended)…"
                      rows={8} style={inp({ resize: "vertical" })} />
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                      {errors.excerpt ? <div style={{ fontSize: 10, color: C.red }}>{errors.excerpt}</div> : <div />}
                      <div style={{ fontSize: 10, color: typedWords >= 500 ? C.green : typedWords >= 100 ? C.amber : C.dim }}>
                        {typedWords} words {typedWords >= 100 && typedWords < 500 ? "— more recommended" : typedWords >= 500 ? "✓" : ""}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Source indicator */}
                {sourceLabel() && (
                  <div style={{ fontSize: 11, color: C.charcoal, background: `${C.gold}08`, border: `1px solid ${C.gold}1e`, borderRadius: 3, padding: "8px 12px", marginBottom: 16 }}>
                    <span style={{ color: C.gold, marginRight: 8 }}>◈</span>{sourceLabel()}
                  </div>
                )}

                <Field label="Summary" hint="Plot summary or back-cover description">
                  <textarea value={form.summary} onChange={e => set("summary", e.target.value)}
                    placeholder="Enter summary or paste from publisher materials…"
                    rows={3} style={inp({ resize: "vertical" })} />
                </Field>
              </Section>

              {/* 3 — Publication */}
              <Section title="Publication Details" accent={C.charcoal}>
                <div style={{ display: "flex", gap: 12 }}>
                  <Field label="Publisher" half>
                    <input value={form.publisher} onChange={e => set("publisher", e.target.value)} placeholder="Publisher name" style={inp()} />
                  </Field>
                  <Field label="Publisher City" half>
                    <input value={form.publisher_city} onChange={e => set("publisher_city", e.target.value)} placeholder="City" style={inp()} />
                  </Field>
                  <Field label="Copyright Year" half>
                    <input value={form.copyright_year} onChange={e => set("copyright_year", e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="YYYY" maxLength={4} style={inp()} />
                  </Field>
                </div>
              </Section>

              {/* 4 — Library of Congress */}
              <Section title="Library of Congress" accent={C.teal}>
                <div style={{ background: C.panel, borderRadius: 4, padding: "14px 16px", marginBottom: 16, border: `1px solid ${C.ghost}` }}>
                  <div style={{ fontSize: 10, color: C.teal, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 6 }}>LCCN Auto-Populate</div>
                  <div style={{ fontSize: 11, color: C.charcoal, marginBottom: 10, lineHeight: 1.5 }}>
                    Enter a print LCCN to auto-populate fields from Open Library. Example: <span style={{ color: C.cream, fontFamily: "monospace" }}>2018046290</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input value={form.lccn_print} onChange={e => { set("lccn_print", e.target.value); setLccnStatus(null); }} placeholder="e.g. 2018046290" style={inp({ flex: 1 })} />
                    <button onClick={lookupLCCN} disabled={!form.lccn_print.trim() || lccnStatus === "loading"} style={{
                      background: form.lccn_print.trim() ? `${C.teal}18` : C.ghost, border: `1px solid ${form.lccn_print.trim() ? C.teal + "55" : C.ghost}`,
                      color: form.lccn_print.trim() ? C.teal : C.dim, borderRadius: 3, padding: "8px 16px",
                      cursor: form.lccn_print.trim() ? "pointer" : "not-allowed", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", whiteSpace: "nowrap", fontFamily: "'DM Sans', sans-serif",
                    }}>{lccnStatus === "loading" ? "Looking up…" : "Lookup LOC"}</button>
                    {form.lccn_print && <a href={`https://lccn.loc.gov/${form.lccn_print}`} target="_blank" rel="noreferrer" style={{ fontSize: 10, color: C.charcoal, textDecoration: "none" }}>↗ LOC</a>}
                  </div>
                  {lccnStatus === "ok"   && <div style={{ fontSize: 11, color: C.green, marginTop: 8 }}>✓ Fields populated from Open Library</div>}
                  {lccnStatus === "fail" && <div style={{ fontSize: 11, color: C.gold,  marginTop: 8 }}>Record not found — enter fields manually</div>}
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <Field label="LCCN (Print)"  hint="Library of Congress Control Number — print" half>
                    <input value={form.lccn_print}  onChange={e => set("lccn_print",  e.target.value)} placeholder="e.g. 2018046290" style={inp()} />
                  </Field>
                  <Field label="LCCN (eBook)"  hint="Library of Congress Control Number — ebook" half>
                    <input value={form.lccn_ebook}  onChange={e => set("lccn_ebook",  e.target.value)} placeholder="e.g. 2018046291" style={inp()} />
                  </Field>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <Field label="BISAC Code"    hint="Book Industry Standards subject code"       half>
                    <input value={form.bisac}  onChange={e => set("bisac",  e.target.value)} placeholder="e.g. FIC027110" style={inp()} />
                  </Field>
                  <Field label="Genre"         hint="Primary genre as classified by LOC"         half>
                    <input value={form.genre}  onChange={e => set("genre",  e.target.value)} placeholder="e.g. Romance — Historical" style={inp()} />
                  </Field>
                </div>
                <Field label="Fiction / Non-Fiction">
                  <div style={{ display: "flex", gap: 8, maxWidth: 280 }}>
                    {fictionOpts.map(o => (
                      <button key={o} onClick={() => set("fiction_nonfiction", o)} style={{
                        flex: 1, background: form.fiction_nonfiction === o ? `${C.gold}22` : C.panel,
                        border: `1px solid ${form.fiction_nonfiction === o ? C.gold : C.ghost}`,
                        color: form.fiction_nonfiction === o ? C.gold : C.charcoal,
                        borderRadius: 3, padding: "8px 0", cursor: "pointer", fontSize: 12, fontFamily: "'DM Sans', sans-serif",
                      }}>{o}</button>
                    ))}
                  </div>
                </Field>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 10, color: C.charcoal, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Language</div>
                  {form.languages.map((l, i) => (
                    <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center" }}>
                      <input value={l.key}   onChange={e => setLang(i, "key",   e.target.value)} placeholder="Key (e.g. Primary)"  style={inp({ flex: 1 })} />
                      <input value={l.value} onChange={e => setLang(i, "value", e.target.value)} placeholder="Value (e.g. English)" style={inp({ flex: 1 })} />
                      {form.languages.length > 1 && (
                        <button onClick={() => removeLang(i)} style={{ background: "none", border: `1px solid ${C.ghost}`, color: C.dim, borderRadius: 3, padding: "6px 10px", cursor: "pointer", fontSize: 14, lineHeight: 1, fontFamily: "'DM Sans', sans-serif" }}>×</button>
                      )}
                    </div>
                  ))}
                  <button onClick={addLang} style={{ background: "none", border: `1px dashed ${C.dim}`, color: C.charcoal, borderRadius: 3, padding: "6px 14px", cursor: "pointer", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>+ Add Language</button>
                </div>
              </Section>

              {/* Submit */}
              <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 12, borderTop: `1px solid ${C.ghost}` }}>
                <button onClick={handleIntakeSubmit} style={{ background: C.gold, color: C.ink, border: "none", borderRadius: 3, padding: "12px 36px", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" }}>
                  Save &amp; Continue →
                </button>
              </div>
            </div>
          )}

          {/* ════ IP SCORE ════ */}
          {step === "score" && (
            <div style={{ animation: "fadeIn 0.2s ease" }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, marginBottom: 6 }}>IP Suitability Score</div>
                <div style={{ fontSize: 12, color: C.charcoal }}>Opus evaluates your excerpt across 9 weighted criteria.</div>
              </div>
              <div style={{ background: C.panel, border: `1px solid ${C.ghost}`, borderRadius: 4, padding: "12px 16px", marginBottom: 20, display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
                {[
                  { label: "Title",     value: form.title },
                  { label: "Rights",    value: form.royalty_type },
                  { label: "Author(s)", value: form.authors.filter(a => a.name).map(a => a.name).join(", ") },
                  { label: "Genre",     value: form.fiction_nonfiction + (form.genre ? ` · ${form.genre}` : "") },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ fontSize: 9, color: C.dim, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 2 }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: C.cream }}>{item.value || "—"}</div>
                  </div>
                ))}
                <button onClick={() => setStep("intake")} style={{ marginLeft: "auto", background: "none", border: `1px solid ${C.ghost}`, color: C.charcoal, borderRadius: 3, padding: "5px 12px", cursor: "pointer", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>← Edit Intake</button>
              </div>

              {!scoreResult && !scoring && (
                <div style={{ textAlign: "center", padding: "52px 0" }}>
                  <div style={{ fontSize: 52, marginBottom: 14, opacity: 0.12 }}>◈</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: C.dim, marginBottom: 6 }}>Ready to analyze</div>
                  <div style={{ fontSize: 12, color: C.dim, marginBottom: 28 }}>Source: <span style={{ color: C.charcoal }}>{sourceLabel() || "no source set"}</span></div>
                  {fileStatus === "error" && <div style={{ fontSize: 12, color: C.red, marginBottom: 16 }}>Error reading file — try a plain .txt version</div>}
                  <button onClick={resolveAndScore} style={{ background: C.gold, color: C.ink, border: "none", borderRadius: 3, padding: "13px 40px", fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", cursor: "pointer" }}>
                    Run IP Score
                  </button>
                  {scoreError && <div style={{ fontSize: 12, color: C.red, marginTop: 14, maxWidth: 440, margin: "14px auto 0", lineHeight: 1.5 }}>{scoreError}</div>}
                </div>
              )}

              {scoring && (
                <div style={{ textAlign: "center", padding: "64px 0" }}>
                  <div style={{ width: 44, height: 44, border: `2px solid ${C.ghost}`, borderTopColor: C.gold, borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 18px" }} />
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: C.charcoal }}>Opus is reading…</div>
                  <div style={{ fontSize: 11, color: C.dim, marginTop: 6 }}>{evalWordCount.toLocaleString()} words · 9 criteria</div>
                </div>
              )}

              {scoreResult && (
                <div>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
                    <div>
                      <div style={{ fontSize: 10, color: C.charcoal, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 6 }}>Weighted Score</div>
                      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 80, fontWeight: 600, lineHeight: 1, color: scoreColor(weightedScore) }}>{weightedScore}</div>
                      <div style={{ fontSize: 11, color: C.dim, marginTop: 2 }}>/ 100</div>
                    </div>
                    <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                      <div style={{ padding: "6px 14px", border: `1px solid ${tierColor(scoreResult.tier)}`, borderRadius: 2, color: tierColor(scoreResult.tier), fontSize: 11, fontWeight: 700, letterSpacing: "0.15em" }}>{tierLabel(scoreResult.tier)}</div>
                      {scoreResult.recommended_series_length && <div style={{ fontSize: 11, color: C.charcoal }}>{scoreResult.recommended_series_length}</div>}
                      <button onClick={resolveAndScore} style={{ background: "none", border: `1px solid ${C.ghost}`, color: C.dim, borderRadius: 3, padding: "5px 12px", cursor: "pointer", fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}>Re-run</button>
                    </div>
                  </div>

                  <div style={{ display: "flex", borderBottom: `1px solid ${C.ghost}`, marginBottom: 20 }}>
                    {[
                      { id: "scores",     label: "Scores" },
                      { id: "inventory",  label: `Inventory (${leads.length}L · ${supporting.length}S · ${sets.length} Sets)` },
                      { id: "assessment", label: "Assessment" },
                    ].map(t => (
                      <button key={t.id} onClick={() => setScoreTab(t.id)} style={{ background: "none", border: "none", borderBottom: `2px solid ${scoreTab === t.id ? C.gold : "transparent"}`, color: scoreTab === t.id ? C.gold : C.charcoal, fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", padding: "8px 16px", cursor: "pointer", marginBottom: -1 }}>{t.label}</button>
                    ))}
                  </div>

                  {scoreTab === "scores" && (
                    <div style={{ columns: 2, columnGap: 24 }}>
                      {CRITERIA.map(c => {
                        const score = scoreResult.scores[c.id] || 0;
                        const isNew = c.id === "character_economy" || c.id === "set_economy";
                        return (
                          <div key={c.id} style={{ breakInside: "avoid", marginBottom: 18, paddingLeft: isNew ? 10 : 0, borderLeft: `2px solid ${isNew ? C.gold + "44" : "transparent"}` }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                              <span style={{ fontSize: 12, color: C.cream, fontWeight: 500 }}>{c.label}{isNew ? " ✦" : ""}</span>
                              <span style={{ fontSize: 14, fontWeight: 700, color: scoreColor(score) }}>{score}</span>
                            </div>
                            <div style={{ background: C.ghost, height: 3, borderRadius: 2, marginBottom: 5 }}>
                              <div style={{ background: scoreColor(score), width: `${score}%`, height: "100%", borderRadius: 2, opacity: 0.85 }} />
                            </div>
                            <div style={{ fontSize: 10, color: C.dim, lineHeight: 1.5 }}>{scoreResult.rationale?.[c.id]}</div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {scoreTab === "inventory" && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
                      {[
                        { title: "Lead Characters", items: leads,      count: leads.length,      ideal: "2–3",  ok: leads.length >= 2 && leads.length <= 3,           accent: C.gold,      nameColor: C.cream,   isSet: false },
                        { title: "Supporting",       items: supporting, count: supporting.length, ideal: "4–8",  ok: supporting.length >= 4 && supporting.length <= 8, accent: C.charcoal,  nameColor: "#8a8578", isSet: false },
                        { title: "Sets / Locations", items: sets,       count: sets.length,       ideal: "3–8",  ok: sets.length >= 3 && sets.length <= 8,             accent: "#6ee7b788", nameColor: "#6ee7a0", isSet: true  },
                      ].map(col => (
                        <div key={col.title} style={{ background: C.panel, borderRadius: 4, padding: 16, borderTop: `2px solid ${col.accent}` }}>
                          <div style={{ fontSize: 10, color: col.accent, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span>{col.title}</span><span style={{ background: col.accent + "22", padding: "1px 8px", borderRadius: 10 }}>{col.count}</span>
                          </div>
                          {col.items.length === 0 ? <div style={{ fontSize: 11, color: C.dim }}>None identified</div>
                            : col.items.map((item, i) => (
                              <div key={i} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: i < col.items.length - 1 ? `1px solid ${C.ghost}` : "none" }}>
                                <div style={{ fontSize: 12, color: col.nameColor, fontWeight: 500 }}>{item.name}</div>
                                <div style={{ fontSize: 10, color: C.dim, marginTop: 2 }}>{col.isSet ? item.description : item.role}</div>
                              </div>
                            ))}
                          <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px solid ${C.ghost}` }}>
                            <div style={{ fontSize: 10, color: col.ok ? C.green : C.amber }}>{col.ok ? "✓ Optimal" : "⚠ Outside ideal range"}</div>
                            <div style={{ fontSize: 9, color: C.dim, marginTop: 2 }}>Ideal: {col.ideal}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {scoreTab === "assessment" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                        <div style={{ background: C.panel, padding: 14, borderRadius: 3, borderLeft: `2px solid ${C.green}` }}>
                          <div style={{ fontSize: 9, color: C.green, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>Top Strength</div>
                          <div style={{ fontSize: 12, color: "#8a8578", lineHeight: 1.6 }}>{scoreResult.top_strength}</div>
                        </div>
                        <div style={{ background: C.panel, padding: 14, borderRadius: 3, borderLeft: `2px solid ${C.red}` }}>
                          <div style={{ fontSize: 9, color: C.red, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 6 }}>Top Risk</div>
                          <div style={{ fontSize: 12, color: "#8a8578", lineHeight: 1.6 }}>{scoreResult.top_risk}</div>
                        </div>
                      </div>
                      <div style={{ background: C.panel, padding: 16, borderRadius: 3 }}>
                        <div style={{ fontSize: 9, color: C.charcoal, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 8 }}>Overall Assessment</div>
                        <div style={{ fontSize: 13, color: "#8a8578", lineHeight: 1.7 }}>{scoreResult.tier_rationale}</div>
                      </div>
                      <div style={{ background: C.panel, padding: 16, borderRadius: 3 }}>
                        <div style={{ fontSize: 9, color: C.charcoal, letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 14 }}>Production Snapshot</div>
                        <div style={{ display: "flex", gap: 32 }}>
                          {[
                            { label: "Leads",      value: leads.length,                     ideal: "2–3",  ok: leads.length >= 2 && leads.length <= 3 },
                            { label: "Supporting", value: supporting.length,                ideal: "4–8",  ok: supporting.length >= 4 && supporting.length <= 8 },
                            { label: "Total Cast", value: leads.length+supporting.length,   ideal: "6–11", ok: (leads.length+supporting.length) >= 6 && (leads.length+supporting.length) <= 11 },
                            { label: "Sets",       value: sets.length,                      ideal: "3–8",  ok: sets.length >= 3 && sets.length <= 8 },
                          ].map(item => (
                            <div key={item.label} style={{ textAlign: "center" }}>
                              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 600, color: item.ok ? C.green : C.amber, lineHeight: 1 }}>{item.value}</div>
                              <div style={{ fontSize: 10, color: C.charcoal, marginTop: 4 }}>{item.label}</div>
                              <div style={{ fontSize: 9, color: C.dim, marginTop: 2 }}>ideal {item.ideal}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div style={{ paddingTop: 8 }}>
                        <SoftGate score={weightedScore} onProceed={() => setStep("episodes")} onOverride={() => setStep("episodes")} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ════ COMING SOON ════ */}
          {(step === "episodes" || step === "script") && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", animation: "fadeIn 0.2s ease" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 52, opacity: 0.10, marginBottom: 18 }}>⬡</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, color: C.dim, marginBottom: 10 }}>
                  {step === "episodes" ? "Episode Generator" : "Script Writer"}
                </div>
                <div style={{ fontSize: 12, color: C.dim, maxWidth: 300, lineHeight: 1.8, margin: "0 auto 24px" }}>
                  This module is in development. It will use your IP Score output to generate a full episode structure and Veo-ready scene prompts.
                </div>
                <button onClick={() => setStep("score")} style={{ background: "none", border: `1px solid ${C.ghost}`, color: C.charcoal, borderRadius: 3, padding: "8px 20px", cursor: "pointer", fontSize: 11, fontFamily: "'DM Sans', sans-serif" }}>← Back to Score</button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
