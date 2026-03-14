import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

// ─── Design Tokens ────────────────────────────────────────────────────────────
const GOLD    = '#C9924A'
const CHARCOAL= '#5C574E'
const CREAM   = '#F7F2E8'
const SURFACE = '#1A1810'
const SURFACE2= '#111009'
const BORDER  = 'rgba(201,146,74,0.12)'
const MUTED   = '#6A6560'
const GREEN   = '#4A9C7A'
const RED     = '#C84B31'
const BLUE    = '#7A9EC8'

const STATUS_COLORS = {
  Draft:          { color: BLUE,  bg: 'rgba(122,158,200,0.12)', border: 'rgba(122,158,200,0.25)' },
  Final:          { color: GREEN, bg: 'rgba(74,156,122,0.12)',  border: 'rgba(74,156,122,0.25)' },
  Decommissioned: { color: RED,   bg: 'rgba(200,75,49,0.12)',   border: 'rgba(200,75,49,0.25)' },
}

const PILLAR_COLORS = { A: GOLD, B: BLUE, C: GREEN }
const PILLAR_DEFAULTS = { A: 'Narrative Strength', B: 'Audience & Market Fit', C: 'Production Complexity' }

const lbl = { display: 'block', fontSize: '0.65rem', color: CHARCOAL, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }
const inp = { width: '100%', background: SURFACE2, border: `1px solid ${BORDER}`, color: CREAM, padding: '9px 12px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box', borderRadius: '2px' }
const txtArea = { ...inp, minHeight: '72px', resize: 'vertical' }
const sel = { ...inp, cursor: 'pointer' }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getVerdict(score) {
  if (score >= 80) return { label: 'Greenlight',  color: GREEN }
  if (score >= 60) return { label: 'Develop',     color: GOLD }
  if (score >= 40) return { label: 'Conditional', color: BLUE }
  return                   { label: 'Reject',      color: RED }
}

// ─── Model List ───────────────────────────────────────────────────────────────
function ModelCard({ model, onClick }) {
  const [hover, setHover] = useState(false)
  const sc = STATUS_COLORS[model.modelstatus] || STATUS_COLORS.Draft
  const dimCount = model.dimension_count || 0
  const totalMax = model.total_max || 0

  return (
    <div onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? 'rgba(201,146,74,0.04)' : 'rgba(255,255,255,0.015)',
        border: `1px solid ${hover ? 'rgba(201,146,74,0.3)' : BORDER}`,
        borderRadius: '6px', padding: '18px 20px', cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.15rem', fontWeight: 600, color: CREAM, marginBottom: '3px' }}>
            {model.modelname}
          </div>
          <div style={{ fontSize: '0.72rem', color: MUTED, maxWidth: '400px', lineHeight: 1.4 }}>
            {model.modelpurpose ? (model.modelpurpose.length > 120 ? model.modelpurpose.slice(0, 120) + '…' : model.modelpurpose) : 'No description'}
          </div>
        </div>
        <span style={{
          padding: '3px 10px', borderRadius: '20px', fontSize: '0.62rem', fontWeight: 500,
          background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
          letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0,
        }}>
          {model.modelstatus}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', borderTop: `1px solid rgba(255,255,255,0.04)`, paddingTop: '10px' }}>
        <span style={{ fontSize: '0.72rem', color: MUTED }}>{dimCount} dimensions</span>
        <span style={{ fontSize: '0.72rem', color: totalMax === 100 ? GREEN : RED, fontWeight: totalMax === 100 ? 400 : 600 }}>
          {totalMax}/100 points
        </span>
        {model.startdate && (
          <span style={{ fontSize: '0.68rem', color: CHARCOAL }}>
            Since {new Date(model.startdate).toLocaleDateString()}
          </span>
        )}
        <span style={{ marginLeft: 'auto', color: hover ? GOLD : 'rgba(255,255,255,0.1)', fontSize: '1rem', transition: 'color 0.2s' }}>→</span>
      </div>
    </div>
  )
}

// ─── Dimension Editor Row ─────────────────────────────────────────────────────
function DimensionRow({ dim, locked, onChange, onDelete }) {
  const pillarColor = PILLAR_COLORS[dim.pillar] || GOLD

  return (
    <div style={{
      padding: '14px 16px', borderBottom: `1px solid ${BORDER}`,
      background: 'rgba(255,255,255,0.01)',
    }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '10px' }}>
        {/* Sort handle + Pillar badge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', paddingTop: '4px' }}>
          <span style={{
            width: '24px', height: '24px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `${pillarColor}18`, border: `1px solid ${pillarColor}44`, color: pillarColor,
            fontSize: '0.65rem', fontWeight: 700,
          }}>
            {dim.pillar}
          </span>
        </div>

        {/* Name + Pillar + Max */}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
            <div style={{ flex: 2 }}>
              <div style={lbl}>Dimension Name</div>
              <input value={dim.dimensionname || ''} disabled={locked}
                onChange={e => onChange('dimensionname', e.target.value)}
                style={{ ...inp, opacity: locked ? 0.6 : 1 }} placeholder="e.g. Cliffhanger Density" />
            </div>
            <div style={{ width: '140px' }}>
              <div style={lbl}>Pillar</div>
              <select value={dim.pillar || 'A'} disabled={locked}
                onChange={e => onChange('pillar', e.target.value)}
                style={{ ...sel, opacity: locked ? 0.6 : 1 }}>
                <option value="A">A — Narrative</option>
                <option value="B">B — Market</option>
                <option value="C">C — Production</option>
              </select>
            </div>
            <div style={{ width: '80px' }}>
              <div style={lbl}>Max Value</div>
              <input type="number" min="1" max="100" value={dim.maxvalue || ''} disabled={locked}
                onChange={e => onChange('maxvalue', parseInt(e.target.value) || 0)}
                style={{ ...inp, textAlign: 'center', opacity: locked ? 0.6 : 1 }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
            <div style={{ flex: 1 }}>
              <div style={lbl}>Pillar Name</div>
              <input value={dim.pillarname || ''} disabled={locked}
                onChange={e => onChange('pillarname', e.target.value)}
                style={{ ...inp, opacity: locked ? 0.6 : 1 }} placeholder={PILLAR_DEFAULTS[dim.pillar] || ''} />
            </div>
            <div style={{ width: '80px' }}>
              <div style={lbl}>Order</div>
              <input type="number" min="0" value={dim.sortorder || 0} disabled={locked}
                onChange={e => onChange('sortorder', parseInt(e.target.value) || 0)}
                style={{ ...inp, textAlign: 'center', opacity: locked ? 0.6 : 1 }} />
            </div>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <div style={lbl}>What it Measures</div>
            <textarea value={dim.whatitmeasures || ''} disabled={locked}
              onChange={e => onChange('whatitmeasures', e.target.value)}
              style={{ ...txtArea, minHeight: '48px', opacity: locked ? 0.6 : 1 }}
              placeholder="Describe what this dimension evaluates..." />
          </div>

          <div>
            <div style={lbl}>Scoring Guide</div>
            <textarea value={dim.scoringguide || ''} disabled={locked}
              onChange={e => onChange('scoringguide', e.target.value)}
              style={{ ...txtArea, minHeight: '48px', opacity: locked ? 0.6 : 1 }}
              placeholder="How should this dimension be scored..." />
          </div>
        </div>

        {/* Delete button */}
        {!locked && (
          <button onClick={onDelete}
            style={{ background: 'none', border: 'none', color: RED, cursor: 'pointer', fontSize: '0.85rem', padding: '4px 8px', opacity: 0.6, marginTop: '4px' }}
            title="Remove dimension">
            ✕
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Model Detail / Editor ────────────────────────────────────────────────────
function ModelDetail({ modelId, onBack }) {
  const { endUser } = useAuth()
  const [model, setModel] = useState(null)
  const [dimensions, setDimensions] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const isNew = !modelId

  const locked = model?.modelstatus === 'Final' || model?.modelstatus === 'Decommissioned'

  useEffect(() => {
    if (isNew) {
      setModel({
        modelname: '', modelpurpose: '', modelstatus: 'Draft',
        startdate: null, decommissiondate: null,
      })
      setDimensions([])
      setLoading(false)
    } else {
      loadModel()
    }
  }, [modelId])

  async function loadModel() {
    setLoading(true)
    const [{ data: m }, { data: dims }] = await Promise.all([
      supabase.from('scoring_models').select('*').eq('modelid', modelId).single(),
      supabase.from('scoring_dimensions').select('*').eq('modelid', modelId).eq('activestatus', 'A').order('pillar').order('sortorder'),
    ])
    if (m) setModel(m)
    if (dims) setDimensions(dims)
    setLoading(false)
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3500) }

  function updateModel(key, value) {
    setModel(m => ({ ...m, [key]: value }))
  }

  function updateDimension(index, key, value) {
    setDimensions(dims => dims.map((d, i) => i === index ? { ...d, [key]: value } : d))
  }

  function addDimension() {
    setDimensions(dims => [...dims, {
      _isNew: true,
      dimensionname: '',
      pillar: 'A',
      pillarname: PILLAR_DEFAULTS['A'],
      maxvalue: 5,
      whatitmeasures: '',
      scoringguide: '',
      sortorder: dims.length + 1,
      activestatus: 'A',
    }])
  }

  function removeDimension(index) {
    const dim = dimensions[index]
    if (dim.dimensionid) {
      // Mark existing as hidden
      setDimensions(dims => dims.map((d, i) => i === index ? { ...d, activestatus: 'H' } : d))
    } else {
      // Remove unsaved
      setDimensions(dims => dims.filter((_, i) => i !== index))
    }
  }

  // Calculate totals
  const activeDimensions = dimensions.filter(d => d.activestatus !== 'H')
  const totalMax = activeDimensions.reduce((sum, d) => sum + (d.maxvalue || 0), 0)
  const pillarTotals = activeDimensions.reduce((acc, d) => {
    acc[d.pillar] = (acc[d.pillar] || 0) + (d.maxvalue || 0)
    return acc
  }, {})

  async function handleSave() {
    if (!model.modelname?.trim()) { showToast('Model name is required'); return }
    if (totalMax !== 100 && model.modelstatus !== 'Draft') {
      showToast(`Dimension max values must sum to 100 (currently ${totalMax})`)
      return
    }

    // Warn if trying to save a Final model
    if (locked) {
      showToast('Cannot modify a Final or Decommissioned model. Clone it to create a new version.')
      return
    }

    // Warn if marking as Final
    if (model.modelstatus === 'Final' && !model.startdate) {
      model.startdate = new Date().toISOString().split('T')[0]
    }

    setSaving(true)
    try {
      let mid = modelId

      if (isNew) {
        const { data, error } = await supabase.from('scoring_models').insert({
          modelname: model.modelname,
          modelpurpose: model.modelpurpose || null,
          modelstatus: model.modelstatus || 'Draft',
          startdate: model.startdate || null,
          decommissiondate: model.decommissiondate || null,
          activestatus: 'A',
          createdby: endUser?.enduserid,
          createdate: new Date().toISOString(),
          updatedate: new Date().toISOString(),
        }).select().single()
        if (error) throw error
        mid = data.modelid
      } else {
        const { error } = await supabase.from('scoring_models').update({
          modelname: model.modelname,
          modelpurpose: model.modelpurpose || null,
          modelstatus: model.modelstatus,
          startdate: model.startdate || null,
          decommissiondate: model.decommissiondate || null,
          updatedby: endUser?.enduserid,
          updatedate: new Date().toISOString(),
        }).eq('modelid', mid)
        if (error) throw error
      }

      // Save dimensions
      for (const dim of dimensions) {
        const payload = {
          modelid: mid,
          dimensionname: dim.dimensionname,
          pillar: dim.pillar,
          pillarname: dim.pillarname || PILLAR_DEFAULTS[dim.pillar],
          maxvalue: dim.maxvalue,
          whatitmeasures: dim.whatitmeasures || null,
          scoringguide: dim.scoringguide || null,
          sortorder: dim.sortorder || 0,
          activestatus: dim.activestatus || 'A',
          updatedate: new Date().toISOString(),
        }

        if (dim.dimensionid) {
          await supabase.from('scoring_dimensions').update(payload).eq('dimensionid', dim.dimensionid)
        } else if (dim.activestatus !== 'H') {
          await supabase.from('scoring_dimensions').insert({ ...payload, createdate: new Date().toISOString() })
        }
      }

      showToast('Model saved ✓')
      if (isNew) {
        // Reload to get IDs
        onBack()
      } else {
        await loadModel()
      }
    } catch (e) {
      showToast(`Error: ${e.message}`)
    }
    setSaving(false)
  }

  async function handleStatusChange(newStatus) {
    if (newStatus === 'Final' && totalMax !== 100) {
      showToast(`Cannot mark Final: dimensions must sum to 100 (currently ${totalMax})`)
      return
    }
    if (newStatus === 'Final') {
      if (!confirm('Once a model is marked Final, its dimensions cannot be modified. Continue?')) return
    }
    updateModel('modelstatus', newStatus)
    if (newStatus === 'Final' && !model.startdate) {
      updateModel('startdate', new Date().toISOString().split('T')[0])
    }
    if (newStatus === 'Decommissioned' && !model.decommissiondate) {
      updateModel('decommissiondate', new Date().toISOString().split('T')[0])
    }
  }

  if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: MUTED }}>Loading model...</div>

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '16px', right: '24px', zIndex: 999,
          background: toast.includes('Error') || toast.includes('Cannot') ? 'rgba(200,75,49,0.9)' : 'rgba(74,156,122,0.9)',
          color: '#fff', padding: '10px 20px', fontSize: '0.8rem', borderRadius: '4px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={onBack}
            style={{ background: 'none', border: `1px solid ${BORDER}`, color: CHARCOAL, padding: '6px 14px', cursor: 'pointer', fontSize: '0.75rem', borderRadius: '2px' }}>
            ← Back
          </button>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.5rem', fontWeight: 300, color: CREAM, margin: 0 }}>
            {isNew ? 'New Scoring Model' : model.modelname}
          </h2>
          {locked && (
            <span style={{ background: 'rgba(200,75,49,0.12)', color: RED, padding: '3px 10px', fontSize: '0.62rem', letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: '2px' }}>
              🔒 {model.modelstatus}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {!locked && (
            <button onClick={handleSave} disabled={saving}
              style={{ background: GOLD, border: 'none', color: '#1A1810', padding: '8px 20px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 600, borderRadius: '2px', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving...' : 'Save Model'}
            </button>
          )}
        </div>
      </div>

      {/* Model Meta */}
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: '6px', padding: '20px', marginBottom: '24px', background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
          <div style={{ flex: 2 }}>
            <div style={lbl}>Model Name *</div>
            <input value={model.modelname || ''} disabled={locked}
              onChange={e => updateModel('modelname', e.target.value)}
              style={{ ...inp, opacity: locked ? 0.6 : 1 }} placeholder="e.g. Culmina v3.0" />
          </div>
          <div style={{ width: '160px' }}>
            <div style={lbl}>Status</div>
            <select value={model.modelstatus || 'Draft'} disabled={locked && model.modelstatus !== 'Final'}
              onChange={e => handleStatusChange(e.target.value)}
              style={{ ...sel, opacity: locked && model.modelstatus === 'Decommissioned' ? 0.6 : 1 }}>
              <option value="Draft">Draft</option>
              <option value="Final">Final</option>
              <option value="Decommissioned">Decommissioned</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <div style={lbl}>Model Purpose</div>
          <textarea value={model.modelpurpose || ''} disabled={locked}
            onChange={e => updateModel('modelpurpose', e.target.value)}
            style={{ ...txtArea, opacity: locked ? 0.6 : 1 }}
            placeholder="Describe what this model evaluates and how it should be used..." />
        </div>

        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <div style={lbl}>Start Date (Production)</div>
            <input type="date" value={model.startdate || ''} disabled={locked}
              onChange={e => updateModel('startdate', e.target.value)}
              style={{ ...inp, opacity: locked ? 0.6 : 1 }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={lbl}>Decommission Date</div>
            <input type="date" value={model.decommissiondate || ''} disabled={model.modelstatus !== 'Decommissioned'}
              onChange={e => updateModel('decommissiondate', e.target.value)}
              style={{ ...inp, opacity: model.modelstatus !== 'Decommissioned' ? 0.4 : 1 }} />
          </div>
        </div>
      </div>

      {/* Points Summary */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <div style={{
          flex: 1, padding: '14px 18px', borderRadius: '6px',
          background: totalMax === 100 ? 'rgba(74,156,122,0.08)' : 'rgba(200,75,49,0.08)',
          border: `1px solid ${totalMax === 100 ? 'rgba(74,156,122,0.2)' : 'rgba(200,75,49,0.2)'}`,
        }}>
          <div style={{ fontSize: '0.62rem', color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>Total Points</div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', fontWeight: 700, color: totalMax === 100 ? GREEN : RED }}>
            {totalMax}<span style={{ color: MUTED, fontSize: '1rem' }}>/100</span>
          </div>
          {totalMax !== 100 && (
            <div style={{ fontSize: '0.68rem', color: RED, marginTop: '2px' }}>
              {totalMax < 100 ? `${100 - totalMax} points remaining` : `${totalMax - 100} points over`}
            </div>
          )}
        </div>
        {['A', 'B', 'C'].map(p => (
          <div key={p} style={{
            flex: 1, padding: '14px 18px', borderRadius: '6px',
            background: `${PILLAR_COLORS[p]}08`, border: `1px solid ${PILLAR_COLORS[p]}20`,
          }}>
            <div style={{ fontSize: '0.62rem', color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>
              Pillar {p}
            </div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem', fontWeight: 700, color: PILLAR_COLORS[p] }}>
              {pillarTotals[p] || 0}
            </div>
            <div style={{ fontSize: '0.65rem', color: CHARCOAL }}>
              {activeDimensions.filter(d => d.pillar === p).length} dimensions
            </div>
          </div>
        ))}
      </div>

      {/* Dimensions */}
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: '6px', overflow: 'hidden', marginBottom: '20px' }}>
        <div style={{
          padding: '12px 16px', borderBottom: `1px solid ${BORDER}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(201,146,74,0.03)',
        }}>
          <span style={{ fontSize: '0.68rem', color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 500 }}>
            Dimensions ({activeDimensions.length})
          </span>
          {!locked && (
            <button onClick={addDimension}
              style={{ background: 'rgba(201,146,74,0.1)', border: `1px solid rgba(201,146,74,0.25)`, color: GOLD, padding: '5px 14px', cursor: 'pointer', fontSize: '0.68rem', letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: '2px' }}>
              + Add Dimension
            </button>
          )}
        </div>

        {/* Group by pillar */}
        {['A', 'B', 'C'].map(pillar => {
          const pillarDims = dimensions
            .map((d, i) => ({ ...d, _index: i }))
            .filter(d => d.pillar === pillar && d.activestatus !== 'H')
            .sort((a, b) => (a.sortorder || 0) - (b.sortorder || 0))

          if (pillarDims.length === 0) return null

          return (
            <div key={pillar}>
              <div style={{
                padding: '8px 16px', background: `${PILLAR_COLORS[pillar]}06`,
                borderBottom: `1px solid ${BORDER}`,
                display: 'flex', alignItems: 'center', gap: '8px',
              }}>
                <span style={{
                  width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: `${PILLAR_COLORS[pillar]}18`, color: PILLAR_COLORS[pillar],
                  fontSize: '0.6rem', fontWeight: 700,
                }}>
                  {pillar}
                </span>
                <span style={{ fontSize: '0.7rem', color: PILLAR_COLORS[pillar], letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {pillarDims[0]?.pillarname || PILLAR_DEFAULTS[pillar]}
                </span>
                <span style={{ fontSize: '0.68rem', color: MUTED, marginLeft: 'auto' }}>
                  {pillarTotals[pillar] || 0} pts
                </span>
              </div>
              {pillarDims.map(dim => (
                <DimensionRow
                  key={dim.dimensionid || dim._index}
                  dim={dim}
                  locked={locked}
                  onChange={(key, val) => updateDimension(dim._index, key, val)}
                  onDelete={() => removeDimension(dim._index)}
                />
              ))}
            </div>
          )
        })}

        {activeDimensions.length === 0 && (
          <div style={{ padding: '32px', textAlign: 'center', color: MUTED, fontSize: '0.82rem' }}>
            No dimensions defined. Click "+ Add Dimension" to start building the scoring framework.
          </div>
        )}
      </div>

      {/* Verdict Thresholds (read-only info) */}
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: '6px', padding: '16px 20px', background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ fontSize: '0.65rem', color: MUTED, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>Score Thresholds (based on 100-point scale)</div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {[
            { range: '80–100', label: 'Greenlight', color: GREEN, desc: 'Immediate pipeline' },
            { range: '60–79',  label: 'Develop',    color: GOLD,  desc: 'Trope injection / restructure' },
            { range: '40–59',  label: 'Conditional', color: BLUE,  desc: 'Evaluate cost vs. narrative' },
            { range: '<40',    label: 'Reject',      color: RED,   desc: 'Not suited for micro-drama' },
          ].map(t => (
            <div key={t.range} style={{
              flex: 1, minWidth: '140px', padding: '10px 14px',
              background: `${t.color}08`, border: `1px solid ${t.color}20`, borderRadius: '4px',
            }}>
              <div style={{ color: t.color, fontSize: '0.85rem', fontWeight: 600 }}>{t.range}</div>
              <div style={{ color: t.color, fontSize: '0.68rem', letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: '2px' }}>{t.label}</div>
              <div style={{ color: CHARCOAL, fontSize: '0.65rem', marginTop: '4px' }}>{t.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main Export: Scoring Models Tab ──────────────────────────────────────────
export default function ScoringModelsTab() {
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedModelId, setSelectedModelId] = useState(null)
  const [showNew, setShowNew] = useState(false)

  useEffect(() => { loadModels() }, [])

  async function loadModels() {
    setLoading(true)
    const { data } = await supabase
      .from('scoring_models')
      .select('*')
      .eq('activestatus', 'A')
      .order('modelstatus')
      .order('modelname')

    if (data) {
      // Get dimension counts and totals for each model
      const enriched = await Promise.all(data.map(async (m) => {
        const { data: dims } = await supabase
          .from('scoring_dimensions')
          .select('maxvalue')
          .eq('modelid', m.modelid)
          .eq('activestatus', 'A')
        return {
          ...m,
          dimension_count: dims?.length || 0,
          total_max: dims?.reduce((sum, d) => sum + d.maxvalue, 0) || 0,
        }
      }))
      setModels(enriched)
    }
    setLoading(false)
  }

  if (selectedModelId !== null || showNew) {
    return (
      <ModelDetail
        modelId={showNew ? null : selectedModelId}
        onBack={() => { setSelectedModelId(null); setShowNew(false); loadModels() }}
      />
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '0.7rem', color: CHARCOAL, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          {models.length} Models · {models.filter(m => m.modelstatus === 'Final').length} Final
        </div>
        <button onClick={() => setShowNew(true)}
          style={{ background: GOLD, border: 'none', color: '#1A1810', padding: '8px 20px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>
          + New Model
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: MUTED, fontSize: '0.82rem' }}>Loading models...</div>
      ) : models.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: MUTED }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', marginBottom: '8px', color: CREAM }}>No scoring models yet</div>
          <div style={{ fontSize: '0.82rem' }}>Click "+ New Model" to create your first scoring framework.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {models.map(model => (
            <ModelCard key={model.modelid} model={model} onClick={() => setSelectedModelId(model.modelid)} />
          ))}
        </div>
      )}
    </div>
  )
}
