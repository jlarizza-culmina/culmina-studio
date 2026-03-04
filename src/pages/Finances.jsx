import { useState } from 'react'

const GOLD = '#C9924A'
const CHARCOAL = '#5C574E'
const CREAM = '#F7F2E8'
const SURFACE = '#1A1810'
const SURFACE2 = '#111009'
const BORDER = 'rgba(201,146,74,0.12)'
const MUTED = '#6A6560'
const GREEN = '#4A9C7A'
const RED = '#C84B31'

const MONTHLY_DATA = [
  { month: 'Aug', revenue: 820,  expenses: 1200 },
  { month: 'Sep', revenue: 1100, expenses: 1400 },
  { month: 'Oct', revenue: 1800, expenses: 1600 },
  { month: 'Nov', revenue: 2400, expenses: 1800 },
  { month: 'Dec', revenue: 3100, expenses: 2200 },
  { month: 'Jan', revenue: 4200, expenses: 2400 },
  { month: 'Feb', revenue: 5770, expenses: 2800 },
]

const MOCK_EXPENSES = [
  { id: 1, date: '2026-02-01', category: 'AI Generation', description: 'Veo 2 API — Feb batch', amount: 840,  payee: 'Google Cloud',  status: 'paid'    },
  { id: 2, date: '2026-02-03', category: 'Voice Acting',  description: 'ElevenLabs — Feb',      amount: 120,  payee: 'ElevenLabs',   status: 'paid'    },
  { id: 3, date: '2026-02-10', category: 'Platform Fee',  description: 'ReelShort listing fee',  amount: 299,  payee: 'ReelShort',    status: 'paid'    },
  { id: 4, date: '2026-02-15', category: 'Legal',         description: 'Author agreement review',amount: 500,  payee: 'Law Office',   status: 'pending' },
  { id: 5, date: '2026-02-20', category: 'Marketing',     description: 'TikTok ad spend',        amount: 350,  payee: 'TikTok Ads',   status: 'pending' },
  { id: 6, date: '2026-02-28', category: 'Infrastructure',description: 'Supabase + Vercel',      amount: 89,   payee: 'Supabase',     status: 'paid'    },
]

const MOCK_ROYALTIES = [
  { id: 1, author: 'M.S. Lawson', title: 'The Tunnels of Rasand', rate: '30%', earned: 1731, paid: 800,  outstanding: 931,  nextPayment: '2026-03-15', w9Valid: true  },
  { id: 2, author: 'J. Harrington', title: 'Scarlet Pimpernel',   rate: '0%',  earned: 0,    paid: 0,    outstanding: 0,    nextPayment: '—',          w9Valid: false },
]

const MOCK_REVENUE = [
  { id: 1, platform: 'ReelShort', month: 'Feb 2026', views: '284K', amount: 4820, status: 'confirmed' },
  { id: 2, platform: 'TikTok',    month: 'Feb 2026', views: '1.2M', amount: 640,  status: 'confirmed' },
  { id: 3, platform: 'YouTube',   month: 'Feb 2026', views: '92K',  amount: 310,  status: 'pending'   },
]

function MiniChart() {
  const maxVal = Math.max(...MONTHLY_DATA.map(d => Math.max(d.revenue, d.expenses)))
  const h = 120
  const barW = 28
  const gap = 8
  const groupW = barW * 2 + gap
  const totalW = MONTHLY_DATA.length * (groupW + 12)

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={totalW} height={h + 32} style={{ display: 'block' }}>
        {MONTHLY_DATA.map((d, i) => {
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

function OverviewTab() {
  const [period, setPeriod] = useState('MTD')
  const totalRevenue = 5770
  const totalExpenses = 2198
  const totalBudget = 24500
  const netMargin = totalRevenue - totalExpenses

  const cards = [
    { label: 'Total Budget',   value: '$24,500', sub: `$${totalExpenses.toLocaleString()} spent`, color: GOLD },
    { label: 'Total Expenses', value: `$${totalExpenses.toLocaleString()}`, sub: `${Math.round(totalExpenses/totalBudget*100)}% of budget`, color: RED },
    { label: 'Total Revenue',  value: `$${totalRevenue.toLocaleString()}`, sub: '+8% vs last month', color: GREEN },
    { label: 'Net Margin',     value: `$${netMargin.toLocaleString()}`, sub: `${Math.round(netMargin/totalRevenue*100)}% margin`, color: GOLD },
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px', gap: '2px' }}>
        {['MTD','QTD','YTD','Custom'].map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            style={{ background: period === p ? 'rgba(201,146,74,0.12)' : 'none', border: `1px solid ${period === p ? 'rgba(201,146,74,0.3)' : BORDER}`, color: period === p ? GOLD : CHARCOAL, padding: '5px 14px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.72rem', letterSpacing: '0.08em', transition: 'all 0.15s' }}>
            {p}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1px', background: BORDER, marginBottom: '28px' }}>
        {cards.map(({ label, value, sub, color }) => (
          <div key={label} style={{ background: SURFACE, padding: '20px 24px' }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', color, fontWeight: 300, lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: '0.68rem', color: CHARCOAL, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '6px' }}>{label}</div>
            <div style={{ fontSize: '0.72rem', color: MUTED, marginTop: '4px' }}>{sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={{ background: SURFACE2, border: `1px solid ${BORDER}`, padding: '24px' }}>
          <div style={{ fontSize: '0.7rem', color: CHARCOAL, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '20px' }}>Revenue vs Expenses</div>
          <MiniChart />
        </div>

        <div style={{ background: SURFACE2, border: `1px solid ${BORDER}`, padding: '24px' }}>
          <div style={{ fontSize: '0.7rem', color: CHARCOAL, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '16px' }}>Royalty Summary</div>
          {MOCK_ROYALTIES.map((r, i) => (
            <div key={r.id} style={{ paddingBottom: '14px', marginBottom: '14px', borderBottom: i < MOCK_ROYALTIES.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.83rem', color: CREAM }}>{r.author}</span>
                {!r.w9Valid && <span style={{ fontSize: '0.65rem', color: RED, background: 'rgba(200,75,49,0.1)', padding: '2px 6px', borderRadius: '2px' }}>W9 Expired</span>}
              </div>
              <div style={{ fontSize: '0.72rem', color: CHARCOAL, marginBottom: '8px' }}>{r.title} · {r.rate} royalty</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
                {[['Earned', `$${r.earned}`], ['Paid', `$${r.paid}`], ['Outstanding', `$${r.outstanding}`]].map(([lbl, val]) => (
                  <div key={lbl}>
                    <div style={{ fontSize: '0.63rem', color: CHARCOAL, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{lbl}</div>
                    <div style={{ fontSize: '0.85rem', color: r.outstanding > 0 && lbl === 'Outstanding' ? GOLD : CREAM }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function ExpensesTab() {
  const [expenses, setExpenses] = useState(MOCK_EXPENSES)
  const [showForm, setShowForm] = useState(false)
  const [newExp, setNewExp] = useState({ date: '', category: '', description: '', amount: '', payee: '', status: 'pending' })

  function addExpense() {
    if (!newExp.description || !newExp.amount) return
    setExpenses(e => [...e, { ...newExp, id: Date.now(), amount: parseFloat(newExp.amount) }])
    setShowForm(false)
    setNewExp({ date: '', category: '', description: '', amount: '', payee: '', status: 'pending' })
  }

  const inp = { width: '100%', background: SURFACE2, border: `1px solid ${BORDER}`, color: CREAM, padding: '8px 12px', fontFamily: 'DM Sans, sans-serif', fontSize: '0.82rem', outline: 'none' }
  const lbl = { display: 'block', fontSize: '0.65rem', color: CHARCOAL, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '5px' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '0.7rem', color: CHARCOAL, letterSpacing: '0.15em', textTransform: 'uppercase' }}>
          Total: <span style={{ color: RED }}>${expenses.reduce((s, e) => s + e.amount, 0).toLocaleString()}</span>
        </div>
        <button onClick={() => setShowForm(s => !s)}
          style={{ background: GOLD, border: 'none', color: '#1A1810', padding: '8px 20px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>
          + Log Expense
        </button>
      </div>

      {showForm && (
        <div style={{ background: SURFACE2, border: `1px solid ${BORDER}`, padding: '20px', marginBottom: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '12px' }}>
            {[['Date','date','date'],['Category','category','text'],['Payee','payee','text']].map(([label, key, type]) => (
              <div key={key}>
                <label style={lbl}>{label}</label>
                <input type={type} value={newExp[key]} onChange={e => setNewExp(f => ({...f, [key]: e.target.value}))} style={inp} />
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={lbl}>Description</label>
              <input value={newExp.description} onChange={e => setNewExp(f => ({...f, description: e.target.value}))} style={inp} />
            </div>
            <div>
              <label style={lbl}>Amount ($)</label>
              <input type="number" value={newExp.amount} onChange={e => setNewExp(f => ({...f, amount: e.target.value}))} style={inp} />
            </div>
            <div>
              <label style={lbl}>Status</label>
              <select value={newExp.status} onChange={e => setNewExp(f => ({...f, status: e.target.value}))} style={{...inp, cursor: 'pointer'}}>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={addExpense} style={{ background: GOLD, border: 'none', color: '#1A1810', padding: '8px 24px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 500 }}>Add</button>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: `1px solid ${BORDER}`, color: CHARCOAL, padding: '8px 18px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem' }}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{ border: `1px solid ${BORDER}` }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'DM Sans, sans-serif' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}`, background: SURFACE2 }}>
              {['Date','Category','Description','Amount','Payee','Status',''].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '0.68rem', color: CHARCOAL, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 400 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {expenses.map((e, i) => (
              <tr key={e.id} style={{ borderBottom: i < expenses.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                <td style={{ padding: '12px 16px', color: CHARCOAL, fontSize: '0.78rem' }}>{e.date}</td>
                <td style={{ padding: '12px 16px', color: CHARCOAL, fontSize: '0.78rem' }}>{e.category}</td>
                <td style={{ padding: '12px 16px', color: CREAM, fontSize: '0.83rem' }}>{e.description}</td>
                <td style={{ padding: '12px 16px', color: RED, fontSize: '0.83rem' }}>${e.amount.toLocaleString()}</td>
                <td style={{ padding: '12px 16px', color: CHARCOAL, fontSize: '0.78rem' }}>{e.payee}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{ background: e.status === 'paid' ? 'rgba(74,156,122,0.12)' : 'rgba(201,146,74,0.12)', color: e.status === 'paid' ? GREEN : GOLD, padding: '2px 8px', fontSize: '0.68rem', letterSpacing: '0.06em', textTransform: 'uppercase', borderRadius: '2px' }}>{e.status}</span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <button style={{ background: 'none', border: 'none', color: GOLD, fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RevenueTab() {
  return (
    <div>
      <div style={{ border: `1px solid ${BORDER}` }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'DM Sans, sans-serif' }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}`, background: SURFACE2 }}>
              {['Platform','Period','Views','Amount','Status',''].map(h => (
                <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: '0.68rem', color: CHARCOAL, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 400 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_REVENUE.map((r, i) => (
              <tr key={r.id} style={{ borderBottom: i < MOCK_REVENUE.length - 1 ? `1px solid ${BORDER}` : 'none' }}>
                <td style={{ padding: '13px 16px', color: CREAM, fontSize: '0.83rem' }}>{r.platform}</td>
                <td style={{ padding: '13px 16px', color: CHARCOAL, fontSize: '0.78rem' }}>{r.month}</td>
                <td style={{ padding: '13px 16px', color: CHARCOAL, fontSize: '0.78rem' }}>{r.views}</td>
                <td style={{ padding: '13px 16px', color: GREEN, fontSize: '0.85rem', fontWeight: 500 }}>${r.amount.toLocaleString()}</td>
                <td style={{ padding: '13px 16px' }}>
                  <span style={{ background: r.status === 'confirmed' ? 'rgba(74,156,122,0.12)' : 'rgba(201,146,74,0.12)', color: r.status === 'confirmed' ? GREEN : GOLD, padding: '2px 8px', fontSize: '0.68rem', letterSpacing: '0.06em', textTransform: 'uppercase', borderRadius: '2px' }}>{r.status}</span>
                </td>
                <td style={{ padding: '13px 16px' }}>
                  <button style={{ background: 'none', border: 'none', color: GOLD, fontSize: '0.72rem', cursor: 'pointer', padding: 0 }}>Details</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: '20px', padding: '16px', background: SURFACE2, border: `1px solid ${BORDER}`, display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.68rem', color: CHARCOAL, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>Total Revenue</div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.8rem', color: GREEN, fontWeight: 300 }}>${MOCK_REVENUE.reduce((s,r) => s+r.amount, 0).toLocaleString()}</div>
        </div>
      </div>
    </div>
  )
}

export default function Finances() {
  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { id: 'overview',  label: 'Overview'  },
    { id: 'expenses',  label: 'Expenses'  },
    { id: 'revenue',   label: 'Revenue'   },
    { id: 'payments',  label: 'Payments'  },
  ]

  return (
    <div style={{ fontFamily: 'DM Sans, sans-serif', color: CREAM }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 300, color: CREAM, margin: 0 }}>Finances</h1>
      </div>

      <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}`, marginBottom: '28px' }}>
        {tabs.map(({ id, label }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            style={{ background: 'none', border: 'none', borderBottom: activeTab === id ? `2px solid ${GOLD}` : '2px solid transparent', color: activeTab === id ? GOLD : CHARCOAL, padding: '10px 24px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: '0.8rem', letterSpacing: '0.08em', textTransform: 'uppercase', transition: 'all 0.2s', marginBottom: '-1px' }}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'expenses' && <ExpensesTab />}
      {activeTab === 'revenue'  && <RevenueTab />}
      {activeTab === 'payments' && (
        <div>
          <div style={{ marginBottom: '20px', fontSize: '0.7rem', color: CHARCOAL, letterSpacing: '0.15em', textTransform: 'uppercase' }}>Payees</div>
          {MOCK_ROYALTIES.map((r, i) => (
            <div key={r.id} style={{ background: SURFACE2, border: `1px solid ${r.w9Valid ? BORDER : 'rgba(200,75,49,0.2)'}`, padding: '20px 24px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '0.9rem', color: CREAM }}>{r.author}</span>
                  {!r.w9Valid && <span style={{ fontSize: '0.65rem', color: RED, background: 'rgba(200,75,49,0.1)', padding: '2px 8px', borderRadius: '2px' }}>⚠ W9 Expired</span>}
                </div>
                <div style={{ fontSize: '0.75rem', color: CHARCOAL }}>{r.title} · Next payment: {r.nextPayment}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.68rem', color: CHARCOAL, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Outstanding</div>
                  <div style={{ fontSize: '1.1rem', color: r.outstanding > 0 ? GOLD : CHARCOAL, fontFamily: 'Cormorant Garamond, serif' }}>${r.outstanding}</div>
                </div>
                <button disabled={!r.w9Valid || r.outstanding === 0}
                  style={{ background: r.w9Valid && r.outstanding > 0 ? GOLD : 'rgba(255,255,255,0.05)', border: 'none', color: r.w9Valid && r.outstanding > 0 ? '#1A1810' : CHARCOAL, padding: '9px 20px', cursor: r.w9Valid && r.outstanding > 0 ? 'pointer' : 'not-allowed', fontFamily: 'DM Sans, sans-serif', fontSize: '0.75rem', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500 }}>
                  Generate Payout
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
