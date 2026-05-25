// src/components/WattpadImporter.jsx
// Wattpad → ScoringRunner integration
// Usage: drop into ManuscriptImport wizard or as a standalone import tab

import { useState, useCallback } from 'react';

// ── Config ────────────────────────────────────────────────────────────────────
const MAX_CHAPTERS = 30;      // safety cap for scoring context
const MIN_CHARS    = 5000;    // minimum text to attempt scoring

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtNum = n => n?.toLocaleString() ?? '—';
const fmtWords = chars => `~${Math.round((chars || 0) / 5).toLocaleString()} words`;

async function apiFetch(params) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`/api/wattpad?${qs}`);
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function WattpadImporter({ onManuscriptReady, onClose }) {
  const [url, setUrl]               = useState('');
  const [story, setStory]           = useState(null);
  const [selected, setSelected]     = useState(new Set());
  const [phase, setPhase]           = useState('idle'); // idle|loading|selecting|fetching|ready|error
  const [progress, setProgress]     = useState({ done: 0, total: 0, label: '' });
  const [manuscript, setManuscript] = useState(null);
  const [error, setError]           = useState(null);

  // ── Step 1: Fetch story info ──────────────────────────────────────────────
  const handleFetchInfo = useCallback(async () => {
    if (!url.trim()) return;
    setError(null);
    setPhase('loading');
    setStory(null);
    setManuscript(null);

    try {
      const { story: s } = await apiFetch({ action: 'info', url: url.trim() });
      setStory(s);
      // Default-select first MAX_CHAPTERS chapters
      const autoSelect = new Set(
        (s.parts || []).slice(0, MAX_CHAPTERS).map(p => String(p.id))
      );
      setSelected(autoSelect);
      setPhase('selecting');
    } catch (err) {
      setError(err.message);
      setPhase('error');
    }
  }, [url]);

  // ── Step 2: Fetch selected chapters ──────────────────────────────────────
  const handleFetchChapters = useCallback(async () => {
    if (!story || selected.size === 0) return;
    setError(null);
    setPhase('fetching');

    const ids = [...selected];
    setProgress({ done: 0, total: ids.length, label: 'Fetching chapters...' });

    // Batch in groups of 10 to keep requests reasonable
    const BATCH = 10;
    const allChapters = [];

    for (let i = 0; i < ids.length; i += BATCH) {
      const batch = ids.slice(i, i + BATCH);
      setProgress(p => ({ ...p, label: `Fetching chapters ${i + 1}–${Math.min(i + BATCH, ids.length)} of ${ids.length}…` }));
      try {
        const { chapters } = await apiFetch({ action: 'chapters', partId: batch.join(',') });
        allChapters.push(...chapters);
        setProgress(p => ({ ...p, done: p.done + batch.length }));
      } catch (err) {
        setError(`Batch ${Math.floor(i / BATCH) + 1} failed: ${err.message}`);
        setPhase('error');
        return;
      }
    }

    // Assemble in chapter order (story.parts order)
    const partOrder = (story.parts || []).map(p => String(p.id));
    const chapterMap = Object.fromEntries(allChapters.map(c => [c.partId, c]));

    const lines = [];
    let totalChars = 0;
    for (const id of partOrder) {
      if (!selected.has(id)) continue;
      const part = story.parts.find(p => String(p.id) === id);
      const chapter = chapterMap[id];
      if (!chapter?.text) continue;
      lines.push(`\n\n## ${part?.title || `Chapter ${id}`}\n\n${chapter.text}`);
      totalChars += chapter.text.length;
    }

    const fullText = `# ${story.title}\n\nAuthor: ${story.user?.name || 'Unknown'}\nSource: ${story.url || ''}\n\nGenre: ${story.mainCategory || 'Romance'}\n\n---\n${lines.join('')}`;

    const ms = {
      title:       story.title,
      author:      story.user?.name || 'Unknown',
      source:      story.url || url,
      genre:       story.mainCategory || '',
      description: story.description || '',
      tags:        (story.tags || []).join(', '),
      text:        fullText,
      charCount:   totalChars,
      chapterCount: selected.size,
      completed:   story.completed,
      views:       story.views,
      votes:       story.votes,
    };

    setManuscript(ms);
    setPhase('ready');
  }, [story, selected, url]);

  // ── Chapter selection helpers ──────────────────────────────────────────────
  const toggleChapter = id => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll   = () => setSelected(new Set((story?.parts || []).slice(0, MAX_CHAPTERS).map(p => String(p.id))));
  const selectNone  = () => setSelected(new Set());
  const selectFirst = n => setSelected(new Set((story?.parts || []).slice(0, n).map(p => String(p.id))));

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={styles.root}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.icon}>📖</span>
          <div>
            <div style={styles.title}>Wattpad Importer</div>
            <div style={styles.subtitle}>Fetch a story and score it with the v2.2 rubric</div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        )}
      </div>

      {/* URL input */}
      <div style={styles.section}>
        <label style={styles.label}>Wattpad Story URL</label>
        <div style={styles.row}>
          <input
            style={styles.input}
            placeholder="https://www.wattpad.com/story/123456789-story-title"
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleFetchInfo()}
            disabled={phase === 'loading' || phase === 'fetching'}
          />
          <button
            style={{ ...styles.btn, ...styles.btnPrimary }}
            onClick={handleFetchInfo}
            disabled={!url.trim() || phase === 'loading' || phase === 'fetching'}
          >
            {phase === 'loading' ? '⏳ Loading…' : 'Fetch Story'}
          </button>
        </div>
        <div style={styles.hint}>
          Paste any Wattpad story URL. Romance, drama, and serial fiction work best for scoring.
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={styles.errorBox}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Story card */}
      {story && (
        <div style={styles.storyCard}>
          <div style={styles.storyMeta}>
            {story.cover && (
              <img src={story.cover} alt="cover" style={styles.cover} />
            )}
            <div style={styles.storyInfo}>
              <div style={styles.storyTitle}>{story.title}</div>
              <div style={styles.storyAuthor}>by {story.user?.name || 'Unknown'}</div>
              <div style={styles.statsRow}>
                <span style={styles.stat}>👁 {fmtNum(story.views)}</span>
                <span style={styles.stat}>⭐ {fmtNum(story.votes)}</span>
                <span style={styles.stat}>📚 {story.numParts} parts</span>
                {story.completed && <span style={{ ...styles.stat, ...styles.statGreen }}>✓ Complete</span>}
              </div>
              <div style={styles.genreRow}>
                {story.mainCategory && <span style={styles.tag}>{story.mainCategory}</span>}
                {(story.tags || []).slice(0, 5).map(t => (
                  <span key={t} style={styles.tag}>{t}</span>
                ))}
              </div>
              {story.description && (
                <div style={styles.description}>
                  {story.description.slice(0, 300)}{story.description.length > 300 ? '…' : ''}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chapter selector */}
      {(phase === 'selecting' || phase === 'fetching' || phase === 'ready') && story?.parts && (
        <div style={styles.section}>
          <div style={styles.chapterHeader}>
            <div style={styles.label}>
              Select Chapters
              <span style={styles.chapterCount}> ({selected.size} selected)</span>
            </div>
            <div style={styles.chapterActions}>
              <button style={styles.smallBtn} onClick={selectAll}>All</button>
              <button style={styles.smallBtn} onClick={selectNone}>None</button>
              <button style={styles.smallBtn} onClick={() => selectFirst(10)}>First 10</button>
              <button style={styles.smallBtn} onClick={() => selectFirst(20)}>First 20</button>
            </div>
          </div>

          <div style={styles.chapterGrid}>
            {story.parts.map((part, idx) => {
              const id = String(part.id);
              const isSelected = selected.has(id);
              const disabled = !isSelected && selected.size >= MAX_CHAPTERS;
              return (
                <div
                  key={id}
                  style={{
                    ...styles.chapterItem,
                    ...(isSelected ? styles.chapterSelected : {}),
                    ...(disabled ? styles.chapterDisabled : {}),
                  }}
                  onClick={() => !disabled && toggleChapter(id)}
                >
                  <div style={styles.chapterNum}>{idx + 1}</div>
                  <div style={styles.chapterName}>{part.title || `Part ${idx + 1}`}</div>
                  {part.length && (
                    <div style={styles.chapterLen}>{fmtWords(part.length)}</div>
                  )}
                </div>
              );
            })}
          </div>
          {selected.size >= MAX_CHAPTERS && (
            <div style={styles.hint}>Max {MAX_CHAPTERS} chapters per scoring session.</div>
          )}
        </div>
      )}

      {/* Fetch progress */}
      {phase === 'fetching' && (
        <div style={styles.progressBox}>
          <div style={styles.progressLabel}>{progress.label}</div>
          <div style={styles.progressBar}>
            <div
              style={{
                ...styles.progressFill,
                width: progress.total ? `${(progress.done / progress.total) * 100}%` : '0%',
              }}
            />
          </div>
          <div style={styles.progressText}>{progress.done} / {progress.total}</div>
        </div>
      )}

      {/* Ready state */}
      {phase === 'ready' && manuscript && (
        <div style={styles.readyBox}>
          <div style={styles.readyTitle}>✓ Manuscript Ready</div>
          <div style={styles.readyStats}>
            <span>{manuscript.chapterCount} chapters</span>
            <span>·</span>
            <span>{fmtWords(manuscript.charCount)}</span>
            {manuscript.charCount < MIN_CHARS && (
              <span style={styles.warnText}> ⚠ Very short — scoring may be unreliable</span>
            )}
          </div>
          {onManuscriptReady ? (
            <button
              style={{ ...styles.btn, ...styles.btnGreen, marginTop: 16 }}
              onClick={() => onManuscriptReady(manuscript)}
            >
              Use This Manuscript →
            </button>
          ) : (
            <ManuscriptPreview manuscript={manuscript} />
          )}
        </div>
      )}

      {/* Fetch button */}
      {phase === 'selecting' && (
        <div style={styles.actions}>
          <button
            style={{ ...styles.btn, ...styles.btnPrimary }}
            onClick={handleFetchChapters}
            disabled={selected.size === 0}
          >
            Fetch {selected.size} Chapter{selected.size !== 1 ? 's' : ''} →
          </button>
        </div>
      )}
    </div>
  );
}

// ── Inline preview (used when no onManuscriptReady callback) ──────────────────
function ManuscriptPreview({ manuscript }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(manuscript.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ marginTop: 16 }}>
      <div style={styles.row}>
        <button style={{ ...styles.btn, ...styles.btnSecondary }} onClick={copy}>
          {copied ? '✓ Copied' : 'Copy Text'}
        </button>
      </div>
      <pre style={styles.previewBox}>
        {manuscript.text.slice(0, 2000)}
        {manuscript.text.length > 2000 ? '\n\n[…truncated for preview]' : ''}
      </pre>
    </div>
  );
}

// ── Styles ── Culmina theme ─────────────────────────────────────────────────────
const C = {
  bg:       'transparent',
  surface:  '#111009', // SURFACE2 — inputs / chips
  card:     '#16140E', // inner card panels
  border:   'rgba(201,146,74,0.12)',
  primary:  '#C9924A', // GOLD
  green:    '#4A9C7A',
  red:      '#C84B31',
  text:     '#F7F2E8', // CREAM
  charcoal: '#5C574E',
  muted:    '#6A6560',
};
const FONT_BODY = 'DM Sans, sans-serif';
const FONT_HEAD = 'Cormorant Garamond, serif';

const styles = {
  root: {
    background: C.bg,
    color: C.text,
    fontFamily: FONT_BODY,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '22px',
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
  icon: { fontSize: '24px', opacity: 0.85 },
  title: { fontFamily: FONT_HEAD, fontSize: '1.35rem', fontWeight: 400, color: C.text },
  subtitle: { fontSize: '0.72rem', color: C.muted },
  closeBtn: {
    background: 'transparent', border: 'none', color: C.muted,
    fontSize: '1.2rem', cursor: 'pointer', padding: '4px 8px',
  },
  section: { marginBottom: '22px' },
  label: { fontSize: '0.62rem', fontWeight: 600, color: C.primary, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.12em' },
  row: { display: 'flex', gap: '8px', alignItems: 'center' },
  input: {
    flex: 1, padding: '9px 12px', borderRadius: '2px',
    border: `1px solid ${C.border}`, background: C.surface,
    color: C.text, fontSize: '0.82rem', fontFamily: FONT_BODY, outline: 'none',
    boxSizing: 'border-box',
  },
  hint: { fontSize: '0.65rem', color: C.muted, marginTop: '6px' },
  btn: {
    padding: '9px 16px', borderRadius: '2px', border: 'none',
    fontWeight: 600, fontSize: '0.72rem', letterSpacing: '0.08em',
    textTransform: 'uppercase', fontFamily: FONT_BODY, cursor: 'pointer',
    transition: 'opacity .15s',
  },
  btnPrimary: { background: C.primary, color: '#1A1810' },
  btnSecondary: { background: C.surface, color: C.text, border: `1px solid ${C.border}` },
  btnGreen: { background: C.green, color: C.text },
  errorBox: {
    background: 'rgba(200,75,49,0.1)', border: `1px solid rgba(200,75,49,0.3)`,
    borderRadius: '2px', padding: '11px 14px', marginBottom: '16px',
    fontSize: '0.75rem', color: C.red,
  },
  storyCard: {
    background: C.card, borderRadius: '4px', border: `1px solid ${C.border}`,
    padding: '16px', marginBottom: '22px',
  },
  storyMeta: { display: 'flex', gap: '16px' },
  cover: { width: '80px', height: '112px', objectFit: 'cover', borderRadius: '3px', flexShrink: 0 },
  storyInfo: { flex: 1, minWidth: 0 },
  storyTitle: { fontFamily: FONT_HEAD, fontSize: '1.15rem', fontWeight: 400, color: C.text, marginBottom: '4px' },
  storyAuthor: { fontSize: '0.72rem', color: C.muted, marginBottom: '8px' },
  statsRow: { display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' },
  stat: { fontSize: '0.68rem', color: C.charcoal },
  statGreen: { color: C.green },
  genreRow: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' },
  tag: {
    fontSize: '0.6rem', padding: '2px 8px', borderRadius: '2px',
    background: 'rgba(201,146,74,0.15)', color: C.primary, fontWeight: 500,
    letterSpacing: '0.04em',
  },
  description: { fontSize: '0.75rem', color: C.muted, lineHeight: 1.5 },
  chapterHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' },
  chapterCount: { color: C.primary, fontWeight: 700 },
  chapterActions: { display: 'flex', gap: '6px' },
  smallBtn: {
    padding: '4px 10px', borderRadius: '2px', border: `1px solid ${C.border}`,
    background: C.surface, color: C.muted, fontSize: '0.62rem', cursor: 'pointer',
    fontFamily: FONT_BODY,
  },
  chapterGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '6px',
    maxHeight: '320px',
    overflowY: 'auto',
    padding: '4px',
  },
  chapterItem: {
    padding: '8px 12px', borderRadius: '2px', border: `1px solid ${C.border}`,
    background: C.surface, cursor: 'pointer', transition: 'all .12s',
  },
  chapterSelected: {
    border: `1px solid ${C.primary}`,
    background: 'rgba(201,146,74,0.12)',
  },
  chapterDisabled: { opacity: 0.4, cursor: 'not-allowed' },
  chapterNum: { fontSize: '0.55rem', color: C.muted, marginBottom: '2px', letterSpacing: '0.06em' },
  chapterName: { fontSize: '0.75rem', color: C.text, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  chapterLen: { fontSize: '0.6rem', color: C.muted, marginTop: '2px' },
  progressBox: {
    background: C.card, borderRadius: '4px', border: `1px solid ${C.border}`,
    padding: '16px', marginBottom: '16px',
  },
  progressLabel: { fontSize: '0.72rem', color: C.muted, marginBottom: '8px' },
  progressBar: { height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' },
  progressFill: { height: '100%', background: C.primary, transition: 'width .3s ease', borderRadius: '3px' },
  progressText: { fontSize: '0.65rem', color: C.muted, marginTop: '6px', textAlign: 'right' },
  readyBox: {
    background: 'rgba(74,156,122,0.08)', border: `1px solid rgba(74,156,122,0.3)`,
    borderRadius: '4px', padding: '16px', marginBottom: '16px',
  },
  readyTitle: { fontSize: '0.85rem', fontWeight: 700, color: C.green, marginBottom: '6px', letterSpacing: '0.04em' },
  readyStats: { display: 'flex', gap: '8px', fontSize: '0.75rem', color: C.muted, alignItems: 'center' },
  warnText: { color: C.primary },
  actions: { display: 'flex', justifyContent: 'flex-end', marginTop: '8px' },
  previewBox: {
    background: C.surface, border: `1px solid ${C.border}`, borderRadius: '2px',
    padding: '12px', fontSize: '0.7rem', color: C.muted, lineHeight: 1.6,
    overflowX: 'auto', maxHeight: '300px', overflowY: 'auto', whiteSpace: 'pre-wrap',
    wordBreak: 'break-word', marginTop: '8px',
  },
};
