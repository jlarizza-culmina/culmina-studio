import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const GOLD = '#C9924A'
const CHARCOAL = '#5C574E'
const CREAM = '#F7F2E8'
const SURFACE = '#1A1810'
const SURFACE2 = '#111009'
const BORDER = 'rgba(201,146,74,0.12)'
const MUTED = '#6A6560'
const GREEN = '#4A9C7A'
const RED = '#C84B31'

const cellInp = { background: 'transparent', border: 'none', borderBottom: `1px solid ${BORDER}`, color: CREAM, padding: '4px 6px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', outline: 'none', width: '100%' }
const cellSel = { background: SURFACE, border: 'none', borderBottom: `1px solid ${BORDER}`, color: CREAM, padding: '4px 4px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.78rem', outline: 'none', cursor: 'pointer', width: '100%' }

function useNVPair(group) {
  const [options, setOptions] = useState([])
  useEffect(() => {
    supabase.from('nvpair').select('nvname,nvvalue').eq('nvgroup', group).eq('active', true).eq('hidden', false).order('nvname')
      .then(({ data }) => { if (data) setOptions(data) })
  }, [group])
  return options
}

function MiniChart({ data }) {
  if (!data.length) return <div style={{ color: MUTED, fontSize: '0.82rem' }}>No chart data yet</div>
  const maxVal = Math.max(...data.map(d => Math.max(d.revenue, d.expenses)), 1)
  const h = 120, barW = 28, gap = 8, groupW = barW * 2 + gap
  const totalW = data.length * (groupW + 12)
  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={totalW} height={h + 32} style={{ display: 'block' }}>
        {data.map((d, i) => {
          const x = i * (groupW + 12) + 6
          const rH = (d.revenue / maxVal) * h
          const eH = (d.expenses / maxVal) * h
          return (
            <g key={d.month}>
              <rect x={x} y={h - rH} width={barW} height={rH} fill={GREEN} opacity={0.7} rx={2} />
              <rect x={x + barW + gap} y={h - eH} width={barW} height={eH} fill={RED} opacity={0.6} rx={2} />
              <text x={x + barW} y={h + 18} textAnchor="middle" fill={CHARCOAL} fontSize={10} fontFamily="DM Sans, sans-serif">{d.month}</text>
            </g>
          )
        })}
      </svg>
      <div style={{ display: 'flex', gap: '20px', marginTop: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '10px', height: '10px', background: GREEN, opacity: 0.7, borderRadius: '2px' }} />
          <span style={{ fontSize: '0.72rem', color: CHARCOAL }}>Revenue</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '10px', height: '10px', background: RED, opacity: 0.6, borderRadius: '2px' }} />
          <span style={{ fontSize: '0.72rem', color: CHARCOAL }}>Expenses</span>
        </div>
      </div>
    </div>
  )
}

function TitleSelector({ titles, selectedTitle, setSelectedTitle }) {
  return (
    <select value={selectedTitle} onChange={e => setSelectedTitle(e.target.value)}
      style={{ background: SURFACE2, border: `1px solid ${BORDER}`, color: CREAM, padding: '7px 12px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', outline: 'none', cursor: 'pointer' }}>
      {titles.map(t => <option key={t.productionid} value={t.productionid}>{t.productiontitle} {t.basecurrency ? `(${t.basecurrency})` : ''}</option>)}
    </select>
  )
}

function StatusBadge({ status }) {
  const paid = status === 'paid'
  return <span style={{ background: paid ? 'rgba(74,156,122,0.12)' : 'rgba(201,146,74,0.12)', color: paid ? GREEN : GOLD, padding: '2px 8px', fontSize: '0.68rem', letterSpacing: '0.06em', textTransform: 'uppercase', borderRadius: '2px' }}>{status || 'pending'}</span>
}

function OverviewTab({ titles, selectedTitle, setSelectedTitle }) {
  const [period, setPeriod]         = useState('MTD')
  const [budget, setBudget]         = useState(null)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [totalExpenses, setTotalExpenses] = useState(0)
  const [royalties, setRoyalties]   = useState([])
  const [chartData, setChartData]   = useState([])
  const [loading, setLoading]       = useState(true)
  const currencies = useNVPair('Currency')

  useEffect(() => {
    if (!selectedTitle) return
    async function load() {
      setLoading(true)
      const [{ data: bud }, { data: rev }, { data: exp }, { data: roy }] = await Promise.all([
        supabase.from('budgets').select('*').eq('activestatus','A').eq('titleproductionid', selectedTitle).order('createdate', { ascending: false }).limit(1),
        supabase.from('releases').select('revenue,publishedat,currency').eq('activestatus','A').eq('titleproductionid', selectedTitle),
        supabase.from('transactions').select('amount,transactiondate,transactiontype,currency').eq('activestatus','A').eq('titleproductionid', selectedTitle),
        supabase.from('royalties').select('*, contacts(firstname,lastname), productions!titleproductionid(productiontitle)').eq('activestatus','A').eq('titleproductionid', selectedTitle),
      ])
      if (bud?.[0]) setBudget(bud[0])
      setTotalRevenue((rev||[]).reduce((s,r) => s + parseFloat(r.revenue||0), 0))
      setTotalExpenses((exp||[]).filter(t => t.transactiontype==='expense').reduce((s,t) => s + parseFloat(t.amount||0), 0))
      if (roy) setRoyalties(roy)
      const months = {}
      ;(exp||[]).forEach(t => {
        const m = t.transactiondate ? new Date(t.transactiondate).toLocaleString('default',{month:'short'}) : '?'
        if (!months[m]) months[m] = { month: m, revenue: 0, expenses: 0 }
        if (t.transactiontype==='expense') months[m].expenses += parseFloat(t.amount||0)
        if (t.transactiontype==='revenue') months[m].revenue  += parseFloat(t.amount||0)
      })
      ;(rev||[]).forEach(r => {
        const m = r.publishedat ? new Date(r.publishedat).toLocaleString('default',{month:'short'}) : '?'
        if (!months[m]) months[m] = { month: m, revenue: 0, expenses: 0 }
        months[m].revenue += parseFloat(r.revenue||0)
      })
      setChartData(Object.values(months).slice(-7))
      setLoading(false)
    }
    load()
  }, [selectedTitle])

  const baseCurrency = titles.find(t => String(t.productionid) === String(selectedTitle))?.basecurrency || 'USD'
  const totalBudget = budget?.totalbudget || 0
  const netMargin   = totalRevenue - totalExpenses
  const cards = [
    { label: 'Total Budget',   value: totalBudget ? `${baseCurrency} ${Number(totalBudget).toLocaleString()}` : '--', sub: budget?.budgetname || '', color: GOLD },
    { label: 'Total Expenses', value: `${baseCurrency} ${totalExpenses.toLocaleString()}`, sub: totalBudget ? `${Math.round(totalExpenses/totalBudget*100)}% of budget` : '', color: RED },
    { label: 'Total Revenue',  value: `${baseCurrency} ${totalRevenue.toLocaleString()}`, sub: '', color: GREEN },
    { label: 'Net Margin',     value: `${baseCurrency} ${netMargin.toLocaleString()}`, sub: totalRevenue ? `${Math.round(netMargin/totalRevenue*100)}% margin` : '', color: GOLD },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <TitleSelector titles={titles} selectedTitle={selectedTitle} setSelectedTitle={setSelectedTitle} />
        <div style={{ display: 'flex', gap: '2px' }}>
          {['MTD','QTD','YTD'].map(p => (
            <button key={p} onClick={() => setPeriod(p)}
              style={{ background: period===p ? 'rgba(201,146,74,0.12)' : 'none', border: `1px solid ${period===p ? 'rgba(201,146,74,0.3)' : BORDER}`, color: period===p ? GOLD : CHARCOAL, padding: '5px 14px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', letterSpacing: '0.08em' }}>{p}</button>
          ))}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1px', background: BORDER, marginBottom: '28px' }}>
        {cards.map(({ label, value, sub, color }) => (
          <div key={label} style={{ background: SURFACE, padding: '20px 24px' }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', color, fontWeight: 300, lineHeight: 1 }}>{loading ? '...' : value}</div>
            <div style={{ fontSize: '0.68rem', color: CHARCOAL, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '6px' }}>{label}</div>
            <div style={{ fontSize: '0.72rem', color: MUTED, marginTop: '4px' }}>{sub}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={{ background: SURFACE2, border: `1px solid ${BORDER}`, padding: '24px' }}>
          <div style={{ fontSize: '0.7rem', color: CHARCOAL, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '20px' }}>Revenue vs Expenses</div>
          {loading ? <div style={{ color: MUTED, fontSize: '0.82rem' }}>Loading...</div> : <MiniChart data={chartData} />}
        </div>
        <div style={{ background: SURFACE2, border: `1px solid ${BORDER}`, padding: '24px' }}>
          <div style={{ fontSize: '0.7rem', color: CHARCOAL, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px' }}>Royalty Summary</div>
          {loading ? <div style={{ color: MUTED, fontSize: '0.82rem' }}>Loading...</div>
          : royalties.length === 0 ? <div style={{ color: MUTED, fontSize: '0.82rem' }}>No royalties recorded</div>
          : royalties.map((r, i) => {
            const name = r.contacts ? [r.contacts.firstname, r.contacts.lastname].filter(Boolean).join(' ') : '--'
            return (
              <div key={r.royaltyid} style={{ paddingBottom: '14px', marginBottom: '14px', borderBottom: i < royalties.length-1 ? `1px solid ${BORDER}` : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.83rem', color: CREAM }}>{name}</span>
                  <span style={{ fontSize: '0.72rem', color: CHARCOAL }}>{r.royaltyrate}%</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: CHARCOAL, marginBottom: '8px' }}>{r.productions?.productiontitle || '--'}</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
                  {[['Gross',`${baseCurrency} ${Number(r.grossrevenue||0).toLocaleString()}`],['Royalty',`${baseCurrency} ${Number(r.royaltyamount||0).toLocaleString()}`],['Status',r.paymentstatus||'--']].map(([l,v]) => (
                    <div key={l}>
                      <div style={{ fontSize: '0.63rem', color: CHARCOAL, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{l}</div>
                      <div style={{ fontSize: '0.85rem', color: CREAM }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ExpensesTab({ titles, selectedTitle, setSelectedTitle }) {
  const [expenses, setExpenses]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [newRows, setNewRows]     = useState([])
  const [editRow, setEditRow]     = useState(null)
  const categories = useNVPair('FinanceCategory')
  const currencies = useNVPair('Currency')

  const baseCurrency = titles.find(t => String(t.productionid) === String(selectedTitle))?.basecurrency || 'USD'
  const emptyRow = () => ({ _id: Date.now()+Math.random(), transactiondate:'', category:'', description:'', amount:'', currency: baseCurrency, paymentstatus:'pending' })

  useEffect(() => { if (selectedTitle) loadExpenses() }, [selectedTitle])

  async function loadExpenses() {
    setLoading(true)
    const { data } = await supabase.from('transactions').select('*')
      .eq('activestatus','A').eq('transactiontype','expense')
      .eq('titleproductionid', selectedTitle).order('transactiondate',{ascending:false})
    if (data) setExpenses(data)
    setLoading(false)
  }

  function setNewRow(id, key, val) { setNewRows(rows => rows.map(r => r._id===id ? {...r,[key]:val} : r)) }

  async function saveNewRows() {
    const valid = newRows.filter(r => r.description && r.amount)
    if (!valid.length) return
    setSaving(true)
    const { data } = await supabase.from('transactions').insert(
      valid.map(r => ({ transactiontype:'expense', activestatus:'A', titleproductionid:parseInt(selectedTitle),
        transactiondate: r.transactiondate||null, category:r.category||null, description:r.description,
        amount:parseFloat(r.amount), currency:r.currency||baseCurrency, paymentstatus:r.paymentstatus,
        createdate:new Date().toISOString(), updatedate:new Date().toISOString() }))
    ).select()
    if (data) setExpenses(e => [...data, ...e])
    setNewRows([])
    setSaving(false)
  }

  async function saveEdit() {
    if (!editRow) return
    setSaving(true)
    const { data } = await supabase.from('transactions').update({
      transactiondate: editRow.transactiondate||null, category:editRow.category||null,
      description:editRow.description, amount:parseFloat(editRow.amount),
      currency:editRow.currency||baseCurrency, paymentstatus:editRow.paymentstatus,
      updatedate:new Date().toISOString()
    }).eq('transactionid', editRow.transactionid).select().single()
    if (data) setExpenses(e => e.map(x => x.transactionid===data.transactionid ? data : x))
    setEditRow(null)
    setSaving(false)
  }

  async function deleteRow(id) {
    if (!confirm('Delete this expense?')) return
    await supabase.from('transactions').update({ activestatus:'H', updatedate:new Date().toISOString() }).eq('transactionid', id)
    setExpenses(e => e.filter(x => x.transactionid !== id))
  }

  const total = [...expenses, ...newRows].reduce((s,e) => s+parseFloat(e.amount||0), 0)

  const CatSelect = ({ value, onChange }) => (
    <select value={value} onChange={onChange} style={cellSel}>
      <option value="">Select...</option>
      {categories.map(c => <option key={c.nvvalue} value={c.nvname}>{c.nvname}</option>)}
    </select>
  )
  const CurSelect = ({ value, onChange }) => (
    <select value={value} onChange={onChange} style={cellSel}>
      {currencies.map(c => <option key={c.nvvalue} value={c.nvvalue}>{c.nvvalue}</option>)}
    </select>
  )
  const StatusSelect = ({ value, onChange }) => (
    <select value={value} onChange={onChange} style={cellSel}>
      <option value="pending">Pending</option>
      <option value="paid">Paid</option>
    </select>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <TitleSelector titles={titles} selectedTitle={selectedTitle} setSelectedTitle={setSelectedTitle} />
          <div style={{ fontSize: '0.7rem', color: CHARCOAL, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Total: <span style={{ color: RED }}>{baseCurrency} {total.toLocaleString()}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {newRows.length > 0 && <>
            <button onClick={() => setNewRows([])} style={{ background:'none', border:`1px solid ${BORDER}`, color:CHARCOAL, padding:'7px 16px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.75rem', letterSpacing:'0.08em', textTransform:'uppercase' }}>Discard</button>
            <button onClick={saveNewRows} disabled={saving} style={{ background:GOLD, border:'none', color:'#1A1810', padding:'7px 20px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.75rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:500 }}>
              {saving ? 'Saving...' : `Save ${newRows.length} Row${newRows.length>1?'s':''}`}
            </button>
          </>}
          {editRow && <button onClick={saveEdit} disabled={saving} style={{ background:GOLD, border:'none', color:'#1A1810', padding:'7px 20px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.75rem', letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:500 }}>{saving?'Saving...':'Save Edit'}</button>}
          <button onClick={() => setNewRows(r => [...r, emptyRow()])}
            style={{ background:'rgba(201,146,74,0.08)', border:`1px solid ${BORDER}`, color:GOLD, padding:'7px 18px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.75rem', letterSpacing:'0.08em', textTransform:'uppercase' }}>
            + Add Row
          </button>
        </div>
      </div>

      <div style={{ border:`1px solid ${BORDER}` }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${BORDER}`, background:SURFACE2 }}>
              {['Date','Category','Description','Amount','Currency','Status',''].map(h => (
                <th key={h} style={{ padding:'10px 14px', textAlign:'left', fontSize:'0.68rem', color:CHARCOAL, letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:400 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {newRows.map(r => (
              <tr key={r._id} style={{ background:'rgba(201,146,74,0.04)', borderBottom:`1px solid ${BORDER}` }}>
                <td style={{ padding:'6px 8px' }}><input type="date" value={r.transactiondate} onChange={e=>setNewRow(r._id,'transactiondate',e.target.value)} style={cellInp} /></td>
                <td style={{ padding:'6px 8px' }}><CatSelect value={r.category} onChange={e=>setNewRow(r._id,'category',e.target.value)} /></td>
                <td style={{ padding:'6px 8px' }}><input value={r.description} onChange={e=>setNewRow(r._id,'description',e.target.value)} placeholder="Description *" style={cellInp} /></td>
                <td style={{ padding:'6px 8px' }}><input type="number" value={r.amount} onChange={e=>setNewRow(r._id,'amount',e.target.value)} placeholder="0.00" style={{...cellInp,color:RED}} /></td>
                <td style={{ padding:'6px 8px' }}><CurSelect value={r.currency} onChange={e=>setNewRow(r._id,'currency',e.target.value)} /></td>
                <td style={{ padding:'6px 8px' }}><StatusSelect value={r.paymentstatus} onChange={e=>setNewRow(r._id,'paymentstatus',e.target.value)} /></td>
                <td style={{ padding:'6px 8px' }}><button onClick={()=>setNewRows(rows=>rows.filter(x=>x._id!==r._id))} style={{ background:'none',border:'none',color:CHARCOAL,cursor:'pointer',fontSize:'1rem',padding:0 }}>×</button></td>
              </tr>
            ))}
            {loading ? (
              <tr><td colSpan={7} style={{ padding:'32px', textAlign:'center', color:MUTED, fontSize:'0.82rem' }}>Loading...</td></tr>
            ) : expenses.length===0 && newRows.length===0 ? (
              <tr><td colSpan={7} style={{ padding:'32px', textAlign:'center', color:MUTED, fontSize:'0.82rem' }}>No expenses yet — click + Add Row to begin.</td></tr>
            ) : expenses.map((e, i) => editRow?.transactionid===e.transactionid ? (
              <tr key={e.transactionid} style={{ background:'rgba(201,146,74,0.04)', borderBottom:`1px solid ${BORDER}` }}>
                <td style={{ padding:'6px 8px' }}><input type="date" value={editRow.transactiondate||''} onChange={ev=>setEditRow(r=>({...r,transactiondate:ev.target.value}))} style={cellInp} /></td>
                <td style={{ padding:'6px 8px' }}><CatSelect value={editRow.category||''} onChange={ev=>setEditRow(r=>({...r,category:ev.target.value}))} /></td>
                <td style={{ padding:'6px 8px' }}><input value={editRow.description||''} onChange={ev=>setEditRow(r=>({...r,description:ev.target.value}))} style={cellInp} /></td>
                <td style={{ padding:'6px 8px' }}><input type="number" value={editRow.amount||''} onChange={ev=>setEditRow(r=>({...r,amount:ev.target.value}))} style={{...cellInp,color:RED}} /></td>
                <td style={{ padding:'6px 8px' }}><CurSelect value={editRow.currency||baseCurrency} onChange={ev=>setEditRow(r=>({...r,currency:ev.target.value}))} /></td>
                <td style={{ padding:'6px 8px' }}><StatusSelect value={editRow.paymentstatus||'pending'} onChange={ev=>setEditRow(r=>({...r,paymentstatus:ev.target.value}))} /></td>
                <td style={{ padding:'6px 8px' }}><button onClick={()=>setEditRow(null)} style={{ background:'none',border:'none',color:CHARCOAL,cursor:'pointer',fontSize:'0.72rem',padding:0 }}>Cancel</button></td>
              </tr>
            ) : (
              <tr key={e.transactionid} style={{ borderBottom: i<expenses.length-1?`1px solid ${BORDER}`:'none' }}
                onMouseEnter={ev=>ev.currentTarget.style.background='rgba(201,146,74,0.02)'}
                onMouseLeave={ev=>ev.currentTarget.style.background='transparent'}>
                <td style={{ padding:'11px 14px', color:CHARCOAL, fontSize:'0.78rem' }}>{e.transactiondate||'--'}</td>
                <td style={{ padding:'11px 14px', color:CHARCOAL, fontSize:'0.78rem' }}>{e.category||'--'}</td>
                <td style={{ padding:'11px 14px', color:CREAM, fontSize:'0.83rem' }}>{e.description}</td>
                <td style={{ padding:'11px 14px', color:RED, fontSize:'0.83rem' }}>{Number(e.amount).toLocaleString()}</td>
                <td style={{ padding:'11px 14px', color:CHARCOAL, fontSize:'0.78rem' }}>{e.currency||baseCurrency}</td>
                <td style={{ padding:'11px 14px' }}><StatusBadge status={e.paymentstatus} /></td>
                <td style={{ padding:'11px 14px' }}>
                  <div style={{ display:'flex', gap:'10px' }}>
                    <button onClick={()=>setEditRow({...e})} style={{ background:'none',border:'none',color:GOLD,fontSize:'0.72rem',cursor:'pointer',padding:0 }}>Edit</button>
                    <button onClick={()=>deleteRow(e.transactionid)} style={{ background:'none',border:'none',color:RED,fontSize:'0.72rem',cursor:'pointer',padding:0 }}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RevenueTab({ titles, selectedTitle, setSelectedTitle }) {
  const [releases, setReleases] = useState([])
  const [loading, setLoading]   = useState(true)
  const currencies = useNVPair('Currency')
  const baseCurrency = titles.find(t => String(t.productionid) === String(selectedTitle))?.basecurrency || 'USD'

  useEffect(() => {
    if (!selectedTitle) return
    setLoading(true)
    supabase.from('releases')
      .select('*, productions!titleproductionid(productiontitle), platforms(platformname)')
      .eq('activestatus','A').eq('titleproductionid', selectedTitle)
      .order('publishedat',{ascending:false})
      .then(({ data }) => { if (data) setReleases(data); setLoading(false) })
  }, [selectedTitle])

  const total = releases.reduce((s,r) => s+parseFloat(r.revenue||0), 0)

  return (
    <div>
      <div style={{ marginBottom:'16px' }}>
        <TitleSelector titles={titles} selectedTitle={selectedTitle} setSelectedTitle={setSelectedTitle} />
      </div>
      <div style={{ border:`1px solid ${BORDER}` }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ borderBottom:`1px solid ${BORDER}`, background:SURFACE2 }}>
              {['Title','Platform','Published','Views','Amount','Currency','Status',''].map(h => (
                <th key={h} style={{ padding:'11px 14px', textAlign:'left', fontSize:'0.68rem', color:CHARCOAL, letterSpacing:'0.1em', textTransform:'uppercase', fontWeight:400 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding:'32px', textAlign:'center', color:MUTED, fontSize:'0.82rem' }}>Loading...</td></tr>
            ) : releases.length===0 ? (
              <tr><td colSpan={8} style={{ padding:'32px', textAlign:'center', color:MUTED, fontSize:'0.82rem' }}>No releases yet.</td></tr>
            ) : releases.map((r,i) => (
              <tr key={r.releaseid} style={{ borderBottom:i<releases.length-1?`1px solid ${BORDER}`:'none' }}>
                <td style={{ padding:'13px 14px', color:CREAM, fontSize:'0.83rem' }}>{r.productions?.productiontitle||'--'}</td>
                <td style={{ padding:'13px 14px', color:CHARCOAL, fontSize:'0.78rem' }}>{r.platforms?.platformname||'--'}</td>
                <td style={{ padding:'13px 14px', color:CHARCOAL, fontSize:'0.78rem' }}>{r.publishedat ? new Date(r.publishedat).toLocaleDateString() : '--'}</td>
                <td style={{ padding:'13px 14px', color:CHARCOAL, fontSize:'0.78rem' }}>{r.viewcount ? Number(r.viewcount).toLocaleString() : '--'}</td>
                <td style={{ padding:'13px 14px', color:GREEN, fontSize:'0.85rem' }}>{Number(r.revenue||0).toLocaleString()}</td>
                <td style={{ padding:'13px 14px', color:CHARCOAL, fontSize:'0.78rem' }}>{r.currency||baseCurrency}</td>
                <td style={{ padding:'13px 14px' }}><StatusBadge status={r.releasestatus} /></td>
                <td style={{ padding:'13px 14px' }}><button style={{ background:'none',border:'none',color:GOLD,fontSize:'0.72rem',cursor:'pointer',padding:0 }}>Details</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!loading && (
        <div style={{ marginTop:'16px', padding:'16px', background:SURFACE2, border:`1px solid ${BORDER}`, display:'flex', justifyContent:'flex-end' }}>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:'0.68rem', color:CHARCOAL, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:'4px' }}>Total Revenue</div>
            <div style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'1.8rem', color:GREEN, fontWeight:300 }}>{baseCurrency} {total.toLocaleString()}</div>
          </div>
        </div>
      )}
    </div>
  )
}

function PaymentsTab({ titles, selectedTitle, setSelectedTitle }) {
  const [royalties, setRoyalties] = useState([])
  const [loading, setLoading]     = useState(true)
  const baseCurrency = titles.find(t => String(t.productionid) === String(selectedTitle))?.basecurrency || 'USD'

  useEffect(() => {
    if (!selectedTitle) return
    setLoading(true)
    supabase.from('royalties')
      .select('*, contacts(firstname,lastname,activew9expdate), productions!titleproductionid(productiontitle)')
      .eq('activestatus','A').eq('titleproductionid', selectedTitle)
      .order('createdate',{ascending:false})
      .then(({ data }) => { if (data) setRoyalties(data); setLoading(false) })
  }, [selectedTitle])

  async function handlePayout(r) {
    await supabase.from('royalties').update({ paymentstatus:'paid', paidat:new Date().toISOString(), updatedate:new Date().toISOString() }).eq('royaltyid', r.royaltyid)
    setRoyalties(rs => rs.map(x => x.royaltyid===r.royaltyid ? {...x, paymentstatus:'paid'} : x))
  }

  return (
    <div>
      <div style={{ marginBottom:'20px' }}>
        <TitleSelector titles={titles} selectedTitle={selectedTitle} setSelectedTitle={setSelectedTitle} />
      </div>
      {loading ? <div style={{ color:MUTED, fontSize:'0.82rem' }}>Loading...</div>
      : royalties.length===0 ? <div style={{ color:MUTED, fontSize:'0.82rem' }}>No royalties recorded.</div>
      : royalties.map(r => {
        const name = r.contacts ? [r.contacts.firstname, r.contacts.lastname].filter(Boolean).join(' ') : '--'
        const w9Expired = r.contacts?.activew9expdate && new Date(r.contacts.activew9expdate) < new Date()
        const outstanding = r.paymentstatus!=='paid' ? parseFloat(r.royaltyamount||0) : 0
        return (
          <div key={r.royaltyid} style={{ background:SURFACE2, border:`1px solid ${w9Expired?'rgba(200,75,49,0.2)':BORDER}`, padding:'20px 24px', marginBottom:'8px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'12px' }}>
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'4px' }}>
                <span style={{ fontSize:'0.9rem', color:CREAM }}>{name}</span>
                {w9Expired && <span style={{ fontSize:'0.65rem', color:RED, background:'rgba(200,75,49,0.1)', padding:'2px 8px', borderRadius:'2px' }}>W9 Expired</span>}
              </div>
              <div style={{ fontSize:'0.75rem', color:CHARCOAL }}>{r.productions?.productiontitle||'--'} · {r.royaltyrate}% · {r.periodstart} to {r.periodend}</div>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'20px' }}>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:'0.68rem', color:CHARCOAL, textTransform:'uppercase', letterSpacing:'0.08em' }}>Outstanding</div>
                <div style={{ fontSize:'1.1rem', color:outstanding>0?GOLD:CHARCOAL, fontFamily:'Cormorant Garamond, serif' }}>{baseCurrency} {outstanding.toLocaleString()}</div>
              </div>
              <button onClick={()=>handlePayout(r)} disabled={w9Expired||outstanding===0||r.paymentstatus==='paid'}
                style={{ background:(!w9Expired&&outstanding>0)?GOLD:'rgba(255,255,255,0.05)', border:'none', color:(!w9Expired&&outstanding>0)?'#1A1810':CHARCOAL, padding:'9px 20px', cursor:(!w9Expired&&outstanding>0)?'pointer':'not-allowed', fontFamily:'DM Sans, sans-serif', fontSize:'0.75rem', letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:500 }}>
                {r.paymentstatus==='paid' ? 'Paid' : 'Generate Payout'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function Finances() {
  const [activeTab, setActiveTab]   = useState('overview')
  const [titles, setTitles]         = useState([])
  const [selectedTitle, setSelectedTitle] = useState('')

  useEffect(() => {
    supabase.from('productions').select('productionid, productiontitle, basecurrency')
      .eq('productiongroup','TITLE').eq('activestatus','A')
      .then(({ data }) => { if (data) { setTitles(data); if (data[0]) setSelectedTitle(String(data[0].productionid)) } })
  }, [])

  const tabs = [
    { id:'overview', label:'Overview'  },
    { id:'expenses', label:'Expenses'  },
    { id:'revenue',  label:'Revenue'   },
    { id:'payments', label:'Payments'  },
  ]
  const sharedProps = { titles, selectedTitle, setSelectedTitle }

  return (
    <div style={{ fontFamily:'DM Sans, sans-serif', color:CREAM }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'32px' }}>
        <h1 style={{ fontFamily:'Cormorant Garamond, serif', fontSize:'2rem', fontWeight:300, color:CREAM, margin:0 }}>Finances</h1>
      </div>
      <div style={{ display:'flex', borderBottom:`1px solid ${BORDER}`, marginBottom:'28px' }}>
        {tabs.map(({ id, label }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            style={{ background:'none', border:'none', borderBottom:activeTab===id?`2px solid ${GOLD}`:'2px solid transparent', color:activeTab===id?GOLD:CHARCOAL, padding:'10px 24px', cursor:'pointer', fontFamily:'DM Sans, sans-serif', fontSize:'0.8rem', letterSpacing:'0.08em', textTransform:'uppercase', transition:'all 0.2s', marginBottom:'-1px' }}>
            {label}
          </button>
        ))}
      </div>
      {activeTab==='overview' && <OverviewTab {...sharedProps} />}
      {activeTab==='expenses' && <ExpensesTab {...sharedProps} />}
      {activeTab==='revenue'  && <RevenueTab  {...sharedProps} />}
      {activeTab==='payments' && <PaymentsTab {...sharedProps} />}
    </div>
  )
}
