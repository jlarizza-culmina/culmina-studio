import { useState } from "react";

// ── Brand tokens ───────────────────────────────────────────────────────────────
const GOLD    = "#C9924A";
const GOLD_DIM= "rgba(201,146,74,0.15)";
const GOLD_GL = "rgba(201,146,74,0.08)";
const CREAM   = "#F5EDD6";
const CHAR    = "#5C574E";
const INK     = "#1C1A17";
const SURF    = "#242019";
const SURF2   = "#2D2820";
const BORDER  = "#3A3428";
const BORDER2 = "#48413A";
const MUTED   = "#7A7268";
const GREEN   = "#4A9C7A";
const RED     = "#C84B31";
const AMBER   = "#D4863A";
const BLUE    = "#4A7AC8";

// ── Mock data ──────────────────────────────────────────────────────────────────
const PRODUCTIONS = [
  {
    id: 1,
    title: "The Tunnels of Rasand",
    manuscript: "Tunnels of Rasand",
    status: "producing",
    stage: "Production Studio",
    episodes: { done: 48, total: 70 },
    created: "Jan 15, 2026",
    lastActivity: "2h ago",
  },
  {
    id: 2,
    title: "Crimson Tides",
    manuscript: "Crimson Tides",
    status: "scripting",
    stage: "Development",
    episodes: { done: 30, total: 85 },
    created: "Feb 1, 2026",
    lastActivity: "4h ago",
  },
  {
    id: 3,
    title: "The Scarlet Pimpernel – Series 1",
    manuscript: "The Scarlet Pimpernel",
    status: "distributed",
    stage: "Distribution",
    episodes: { done: 55, total: 55 },
    created: "Nov 20, 2025",
    lastActivity: "3d ago",
  },
  {
    id: 4,
    title: "The Hollow Crown",
    manuscript: "The Hollow Crown",
    status: "queued",
    stage: "Manuscript Import",
    episodes: { done: 0, total: 0 },
    created: "Feb 14, 2026",
    lastActivity: "1d ago",
  },
  {
    id: 5,
    title: "Midnight Protocol",
    manuscript: "Midnight Protocol v2",
    status: "post",
    stage: "Post Production",
    episodes: { done: 58, total: 60 },
    created: "Dec 5, 2025",
    lastActivity: "6h ago",
  },
];

const MANUSCRIPTS = [
  { id: 10, name: "The Tunnels of Rasand", author: "M.S. Lawson", status: "processed", genre: "Sci-Fi / Adventure", version: "v1", imported: "Jan 15, 2026" },
  { id: 11, name: "Crimson Tides", author: "Elena Vasquez", status: "processing", genre: "Romance / Thriller", version: "v1", imported: "Feb 1, 2026" },
  { id: 12, name: "The Scarlet Pimpernel", author: "Baroness Orczy", status: "processed", genre: "Historical Drama", version: "v1", imported: "Nov 20, 2025" },
  { id: 13, name: "The Hollow Crown", author: "R.J. Pemberton", status: "queued", genre: "Dark Fantasy", version: "v1", imported: "Feb 14, 2026" },
  { id: 14, name: "Midnight Protocol v2", author: "Sam Ito", status: "processed", genre: "Cyber-Thriller", version: "v2", imported: "Dec 5, 2025" },
];

// ── Status config ──────────────────────────────────────────────────────────────
const STATUS_CFG = {
  producing:   { label: "Producing",    bg: GOLD_DIM,              color: GOLD,  dot: GOLD  },
  scripting:   { label: "Scripting",    bg: "rgba(74,122,200,0.15)", color: BLUE, dot: BLUE  },
  distributed: { label: "Distributed",  bg: "rgba(74,156,122,0.15)", color: GREEN, dot: GREEN },
  queued:      { label: "Queued",       bg: "rgba(92,87,78,0.25)",   color: MUTED, dot: MUTED },
  post:        { label: "Post-Prod",    bg: "rgba(212,134,58,0.15)", color: AMBER, dot: AMBER },
  processed:   { label: "Processed",    bg: "rgba(74,156,122,0.15)", color: GREEN, dot: GREEN },
  processing:  { label: "Processing",   bg: GOLD_DIM,              color: GOLD,  dot: GOLD  },
  error:       { label: "Error",        bg: "rgba(200,75,49,0.15)", color: RED,   dot: RED   },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.queued;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: cfg.bg, color: cfg.color,
      fontSize: "0.65rem", fontFamily: "'Jost', sans-serif", fontWeight: 500,
      letterSpacing: "0.06em", textTransform: "uppercase",
      padding: "2px 8px", borderRadius: 4,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

// ── Module tiles ──────────────────────────────────────────────────────────────
const MODULES = [
  {
    icon: "📖", name: "Manuscript Import", route: "/manuscript",
    desc: "Upload and AI-process source manuscripts.",
    badge: "2 processed", badgeType: "gold", locked: false,
  },
  {
    icon: "🎨", name: "Asset Creator", route: "/assets",
    desc: "Characters, sets, props — AI image generation.",
    badge: "47 assets", badgeType: "char", locked: false,
  },
  {
    icon: "✍️", name: "Development", route: "/development",
    desc: "Title → Arc → Act → Episode → Shot hierarchy.",
    badge: "In Progress", badgeType: "suc", locked: false,
  },
  {
    icon: "🎬", name: "Production Studio", route: "/production",
    desc: "Generate video takes with Veo, assemble episodes.",
    badge: "12 queued", badgeType: "char", locked: false,
  },
  {
    icon: "🎧", name: "Post Production", route: "/post",
    desc: "Voice tracks, captions, final export.",
    badge: "3 pending", badgeType: "char", locked: false,
  },
  {
    icon: "📡", name: "Distribution", route: "/distribution",
    desc: "Release to ReelShort, TikTok, YouTube.",
    badge: "2 live", badgeType: "suc", locked: false,
  },
  {
    icon: "💰", name: "Finances", route: "/finances",
    desc: "Budget, expenses, royalties, payouts.",
    badge: "$24,500 budget", badgeType: "char", locked: false,
  },
  {
    icon: "⚙️", name: "Admin", route: "/admin",
    desc: "Users, roles, entitlements, system settings.",
    badge: "SysAdmin", badgeType: "gold", locked: false,
  },
  {
    icon: "🗄️", name: "Repository", route: "/repository",
    desc: "Your pre-structured R2 file store — manuscripts, prompts, uploads, exports.",
    badge: "R2 Storage", badgeType: "char", locked: false,
  },
];

function ModuleTile({ mod, onClick }) {
  const [hovered, setHovered] = useState(false);

  const badgeStyle = {
    gold: { bg: GOLD_DIM, color: GOLD },
    suc:  { bg: "rgba(74,156,122,0.15)", color: GREEN },
    char: { bg: "rgba(92,87,78,0.25)", color: MUTED },
  }[mod.badgeType] || { bg: GOLD_DIM, color: GOLD };

  return (
    <div
      onClick={() => !mod.locked && onClick?.(mod.route)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered && !mod.locked ? SURF2 : SURF,
        border: `1px solid ${hovered && !mod.locked ? GOLD : BORDER}`,
        borderRadius: 10,
        padding: "10px 14px",
        cursor: mod.locked ? "not-allowed" : "pointer",
        opacity: mod.locked ? 0.45 : 1,
        display: "flex",
        alignItems: "center",
        gap: 12,
        transition: "border-color 0.15s, background 0.15s, box-shadow 0.15s",
        boxShadow: hovered && !mod.locked ? `0 0 0 1px ${GOLD}22, 0 4px 16px rgba(0,0,0,0.3)` : "none",
        position: "relative",
        minHeight: 60,
      }}
    >
      {/* Icon */}
      <span style={{ fontSize: "1.35rem", lineHeight: 1, flexShrink: 0, opacity: 0.85 }}>
        {mod.locked ? "🔒" : mod.icon}
      </span>

      {/* Text block */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "0.9rem", fontWeight: 600,
          color: CREAM, lineHeight: 1.15,
          marginBottom: 2,
        }}>
          {mod.name}
        </div>
        <div style={{
          fontFamily: "'Jost', sans-serif",
          fontSize: "0.65rem", color: MUTED,
          lineHeight: 1.3, whiteSpace: "nowrap",
          overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {mod.desc}
        </div>
      </div>

      {/* Badge */}
      <span style={{
        flexShrink: 0,
        background: badgeStyle.bg, color: badgeStyle.color,
        fontSize: "0.58rem", fontFamily: "'Jost', sans-serif",
        fontWeight: 500, letterSpacing: "0.05em",
        textTransform: "uppercase",
        padding: "2px 6px", borderRadius: 3,
        whiteSpace: "nowrap",
      }}>
        {mod.badge}
      </span>

      {/* Arrow on hover */}
      {hovered && !mod.locked && (
        <span style={{
          position: "absolute", right: 10, top: "50%",
          transform: "translateY(-50%)",
          color: GOLD, fontSize: "0.7rem", opacity: 0.6,
          fontFamily: "monospace",
          pointerEvents: "none",
        }}>›</span>
      )}
    </div>
  );
}

// ── Productions grid ───────────────────────────────────────────────────────────
function ProductionsGrid({ tab, onTabChange }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const rows = tab === "productions" ? PRODUCTIONS : MANUSCRIPTS;

  const filtered = rows.filter(r => {
    const text = tab === "productions"
      ? `${r.title} ${r.manuscript} ${r.stage}`
      : `${r.name} ${r.author} ${r.genre}`;
    return text.toLowerCase().includes(search.toLowerCase());
  });

  const ColHead = ({ label, w }) => (
    <th style={{
      padding: "8px 12px", textAlign: "left",
      fontFamily: "'Jost', sans-serif", fontWeight: 500,
      fontSize: "0.6rem", letterSpacing: "0.1em",
      textTransform: "uppercase", color: MUTED,
      borderBottom: `1px solid ${BORDER}`,
      width: w, whiteSpace: "nowrap",
    }}>
      {label}
    </th>
  );

  return (
    <div style={{
      background: SURF, border: `1px solid ${BORDER}`,
      borderRadius: 12, overflow: "hidden",
    }}>
      {/* Grid header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 18px", borderBottom: `1px solid ${BORDER}`,
        gap: 16, flexWrap: "wrap",
      }}>
        {/* Tab switcher */}
        <div style={{ display: "flex", gap: 2, background: INK, borderRadius: 7, padding: 3 }}>
          {[
            { key: "productions", label: "Productions" },
            { key: "manuscripts", label: "Manuscripts" },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => { onTabChange(t.key); setSearch(""); }}
              style={{
                padding: "4px 14px",
                background: tab === t.key ? SURF2 : "transparent",
                border: `1px solid ${tab === t.key ? BORDER2 : "transparent"}`,
                borderRadius: 5,
                color: tab === t.key ? CREAM : MUTED,
                fontFamily: "'Jost', sans-serif",
                fontSize: "0.72rem", fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search + actions */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginLeft: "auto" }}>
          <div style={{ position: "relative" }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search…"
              style={{
                background: INK, border: `1px solid ${BORDER}`,
                borderRadius: 6, padding: "5px 10px 5px 28px",
                color: CREAM, fontFamily: "'Jost', sans-serif",
                fontSize: "0.72rem", outline: "none", width: 180,
              }}
            />
            <span style={{
              position: "absolute", left: 9, top: "50%",
              transform: "translateY(-50%)", fontSize: "0.65rem", color: MUTED,
            }}>⌕</span>
          </div>
          {tab === "productions" && (
            <button style={{
              display: "flex", alignItems: "center", gap: 5,
              background: GOLD, color: INK,
              border: "none", borderRadius: 6,
              padding: "5px 12px",
              fontFamily: "'Jost', sans-serif", fontSize: "0.72rem", fontWeight: 600,
              cursor: "pointer", letterSpacing: "0.03em",
            }}>
              <span style={{ fontSize: "0.8rem", lineHeight: 1 }}>+</span>
              New Production
            </button>
          )}
          {tab === "manuscripts" && (
            <button style={{
              display: "flex", alignItems: "center", gap: 5,
              background: GOLD, color: INK,
              border: "none", borderRadius: 6,
              padding: "5px 12px",
              fontFamily: "'Jost', sans-serif", fontSize: "0.72rem", fontWeight: 600,
              cursor: "pointer", letterSpacing: "0.03em",
            }}>
              <span style={{ fontSize: "0.8rem", lineHeight: 1 }}>+</span>
              Import Manuscript
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: `${INK}88` }}>
              {tab === "productions" ? (
                <>
                  <ColHead label="Production Title" w="22%" />
                  <ColHead label="Manuscript" w="16%" />
                  <ColHead label="Status" w="10%" />
                  <ColHead label="Stage" w="14%" />
                  <ColHead label="Episodes" w="10%" />
                  <ColHead label="Created" w="10%" />
                  <ColHead label="Last Activity" w="10%" />
                  <ColHead label="Actions" w="8%" />
                </>
              ) : (
                <>
                  <ColHead label="Manuscript" w="22%" />
                  <ColHead label="Author" w="16%" />
                  <ColHead label="Status" w="10%" />
                  <ColHead label="Genre" w="16%" />
                  <ColHead label="Version" w="7%" />
                  <ColHead label="Imported" w="12%" />
                  <ColHead label="Actions" w="10%" />
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{
                  padding: "32px", textAlign: "center",
                  color: MUTED, fontFamily: "'Jost', sans-serif",
                  fontSize: "0.78rem",
                }}>
                  No records found
                </td>
              </tr>
            ) : tab === "productions" ? (
              filtered.map((prod, idx) => (
                <ProductionRow key={prod.id} prod={prod} last={idx === filtered.length - 1} />
              ))
            ) : (
              filtered.map((ms, idx) => (
                <ManuscriptRow key={ms.id} ms={ms} last={idx === filtered.length - 1} />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer count */}
      <div style={{
        padding: "8px 18px",
        borderTop: `1px solid ${BORDER}`,
        display: "flex", justifyContent: "space-between",
        alignItems: "center",
      }}>
        <span style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.63rem", color: MUTED }}>
          {filtered.length} {tab === "productions" ? "productions" : "manuscripts"}
          {search && ` matching "${search}"`}
        </span>
        <span style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.63rem", color: MUTED }}>
          Page 1 of 1
        </span>
      </div>
    </div>
  );
}

function ProductionRow({ prod, last }) {
  const [hov, setHov] = useState(false);
  const pct = prod.episodes.total > 0
    ? Math.round((prod.episodes.done / prod.episodes.total) * 100)
    : 0;

  return (
    <tr
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? SURF2 : "transparent",
        borderBottom: last ? "none" : `1px solid ${BORDER}`,
        transition: "background 0.1s",
        cursor: "pointer",
      }}
    >
      {/* Title */}
      <td style={{ padding: "10px 12px" }}>
        <span style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "0.88rem", color: CREAM, fontWeight: 600,
        }}>
          {prod.title}
        </span>
      </td>

      {/* Manuscript */}
      <td style={{ padding: "10px 12px" }}>
        <span style={{
          fontFamily: "'Jost', sans-serif",
          fontSize: "0.72rem", color: CHAR,
        }}>
          {prod.manuscript}
        </span>
      </td>

      {/* Status */}
      <td style={{ padding: "10px 12px" }}>
        <StatusBadge status={prod.status} />
      </td>

      {/* Stage */}
      <td style={{ padding: "10px 12px" }}>
        <span style={{
          fontFamily: "'Jost', sans-serif",
          fontSize: "0.7rem", color: MUTED,
        }}>
          {prod.stage}
        </span>
      </td>

      {/* Episodes + progress */}
      <td style={{ padding: "10px 12px" }}>
        {prod.episodes.total > 0 ? (
          <div>
            <div style={{
              fontFamily: "'Jost', sans-serif",
              fontSize: "0.68rem", color: CHAR, marginBottom: 3,
            }}>
              {prod.episodes.done}/{prod.episodes.total}
            </div>
            <div style={{
              height: 3, background: BORDER, borderRadius: 2, width: 60,
            }}>
              <div style={{
                height: "100%", background: GOLD, borderRadius: 2,
                width: `${pct}%`, transition: "width 0.3s",
              }} />
            </div>
          </div>
        ) : (
          <span style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.68rem", color: MUTED }}>—</span>
        )}
      </td>

      {/* Created */}
      <td style={{ padding: "10px 12px" }}>
        <span style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.7rem", color: MUTED }}>
          {prod.created}
        </span>
      </td>

      {/* Last Activity */}
      <td style={{ padding: "10px 12px" }}>
        <span style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.7rem", color: MUTED }}>
          {prod.lastActivity}
        </span>
      </td>

      {/* Actions */}
      <td style={{ padding: "10px 12px" }}>
        <ActionButtons type="production" />
      </td>
    </tr>
  );
}

function ManuscriptRow({ ms, last }) {
  const [hov, setHov] = useState(false);
  return (
    <tr
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? SURF2 : "transparent",
        borderBottom: last ? "none" : `1px solid ${BORDER}`,
        transition: "background 0.1s",
        cursor: "pointer",
      }}
    >
      <td style={{ padding: "10px 12px" }}>
        <span style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: "0.88rem", color: CREAM, fontWeight: 600,
        }}>
          {ms.name}
        </span>
      </td>
      <td style={{ padding: "10px 12px" }}>
        <span style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.72rem", color: CHAR }}>
          {ms.author}
        </span>
      </td>
      <td style={{ padding: "10px 12px" }}>
        <StatusBadge status={ms.status} />
      </td>
      <td style={{ padding: "10px 12px" }}>
        <span style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.7rem", color: MUTED }}>
          {ms.genre}
        </span>
      </td>
      <td style={{ padding: "10px 12px" }}>
        <span style={{
          fontFamily: "'Jost', sans-serif", fontSize: "0.65rem",
          color: MUTED, background: "rgba(92,87,78,0.2)",
          padding: "1px 6px", borderRadius: 3,
        }}>
          {ms.version}
        </span>
      </td>
      <td style={{ padding: "10px 12px" }}>
        <span style={{ fontFamily: "'Jost', sans-serif", fontSize: "0.7rem", color: MUTED }}>
          {ms.imported}
        </span>
      </td>
      <td style={{ padding: "10px 12px" }}>
        <ActionButtons type="manuscript" />
      </td>
    </tr>
  );
}

function ActionButtons({ type }) {
  const btns = type === "production"
    ? [
        { label: "Open",    color: GOLD, bg: GOLD_DIM },
        { label: "Archive", color: MUTED, bg: "transparent" },
      ]
    : [
        { label: "View",    color: GOLD, bg: GOLD_DIM },
        { label: "Process", color: BLUE, bg: "rgba(74,122,200,0.12)" },
      ];

  return (
    <div style={{ display: "flex", gap: 4 }}>
      {btns.map(b => (
        <button
          key={b.label}
          onClick={e => e.stopPropagation()}
          style={{
            background: b.bg, color: b.color,
            border: `1px solid ${b.color}33`,
            borderRadius: 4, padding: "3px 8px",
            fontFamily: "'Jost', sans-serif",
            fontSize: "0.62rem", fontWeight: 500,
            cursor: "pointer", letterSpacing: "0.04em",
            transition: "all 0.12s",
          }}
        >
          {b.label}
        </button>
      ))}
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard({ user = { nickname: "Joe", activeProductions: 5 } }) {
  const [gridTab, setGridTab] = useState("productions");

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });

  return (
    <div style={{
      background: INK, minHeight: "100vh",
      fontFamily: "'Jost', sans-serif",
      padding: "28px 32px 48px",
    }}>

      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "flex-start",
        justifyContent: "space-between", marginBottom: 24,
        flexWrap: "wrap", gap: 12,
      }}>
        <div>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: "1.75rem", fontWeight: 600,
            color: GOLD, margin: 0, lineHeight: 1.1,
          }}>
            Welcome back, {user.nickname}
          </h1>
          <div style={{
            fontFamily: "'Jost', sans-serif",
            fontSize: "0.72rem", color: MUTED,
            marginTop: 4,
          }}>
            {dateStr} &nbsp;·&nbsp;
            <span style={{ color: GOLD, cursor: "pointer", textDecoration: "none" }}>
              {user.activeProductions} active productions
            </span>
          </div>
        </div>

        {/* Title selector + New Production */}
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select style={{
            background: SURF, border: `1px solid ${BORDER}`,
            color: CREAM, borderRadius: 7,
            padding: "6px 12px", fontFamily: "'Jost', sans-serif",
            fontSize: "0.75rem", cursor: "pointer", outline: "none",
          }}>
            <option>All Titles</option>
            <option>The Tunnels of Rasand</option>
            <option>Crimson Tides</option>
            <option>The Scarlet Pimpernel</option>
          </select>

          <button style={{
            display: "flex", alignItems: "center", gap: 6,
            background: GOLD, color: INK,
            border: "none", borderRadius: 7,
            padding: "7px 16px",
            fontFamily: "'Jost', sans-serif",
            fontSize: "0.75rem", fontWeight: 700,
            cursor: "pointer", letterSpacing: "0.03em",
          }}>
            <span style={{ fontSize: "1rem", lineHeight: 1 }}>+</span>
            New Production
          </button>
        </div>
      </div>

      {/* ── Module Tiles: 3-col grid ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 8,
        marginBottom: 28,
      }}>
        {MODULES.map(mod => (
          <ModuleTile
            key={mod.name}
            mod={mod}
            onClick={route => console.log("navigate →", route)}
          />
        ))}
      </div>

      {/* ── Productions / Manuscripts Grid ── */}
      <ProductionsGrid tab={gridTab} onTabChange={setGridTab} />
    </div>
  );
}
