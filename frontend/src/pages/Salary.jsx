import React, { useState, useEffect, useCallback } from 'react'
import {
  MdAdd, MdEdit, MdDelete, MdAttachMoney, MdBarChart,
  MdPeople, MdCalendarToday, MdTrendingUp,
} from 'react-icons/md'
import toast from 'react-hot-toast'
import api from '../services/api'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const INIT = { employee_id:'', month: new Date().getMonth()+1, year: new Date().getFullYear(), basic_salary:'', bonus:'0', deductions:'0', payment_date:'', status:'pending' }

function StatusBadge({ status }) {
  const cfg = {
    paid:    { dot: '#10b981', bg: 'rgba(16,185,129,0.1)',  text: '#059669', label: 'Paid'    },
    pending: { dot: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  text: '#d97706', label: 'Pending' },
  }[status] || { dot: '#94a3b8', bg: 'rgba(148,163,184,0.1)', text: '#64748b', label: status }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
      style={{ background: cfg.bg, color: cfg.text }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  )
}

export default function Salary() {
  const [records, setRecords]    = useState([])
  const [employees, setEmps]     = useState([])
  const [report, setReport]      = useState(null)
  const [loading, setLoading]    = useState(true)
  const [tab, setTab]            = useState('records')
  const [modalOpen, setModal]    = useState(false)
  const [editRec, setEdit]       = useState(null)
  const [form, setForm]          = useState(INIT)
  const [saving, setSaving]      = useState(false)
  const [delTarget, setDel]      = useState(null)
  const [deleting, setDeleting]  = useState(false)
  const [filterMonth, setFMonth] = useState('')
  const [filterYear, setFYear]   = useState(new Date().getFullYear())
  const [repMonth, setRepMonth]  = useState(new Date().getMonth()+1)
  const [repYear, setRepYear]    = useState(new Date().getFullYear())

  useEffect(() => {
    api.get('/employees/', { params: { per_page: 200 } })
      .then(r => setEmps(r.data.data)).catch(() => {})
  }, [])

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filterMonth) params.month = filterMonth
      if (filterYear)  params.year  = filterYear
      const r = await api.get('/salaries/', { params })
      setRecords(r.data.data)
    } catch { toast.error('Failed to load salaries') }
    finally { setLoading(false) }
  }, [filterMonth, filterYear])

  useEffect(() => { if (tab === 'records') fetchRecords() }, [tab, fetchRecords])

  async function fetchReport() {
    setLoading(true)
    try {
      const r = await api.get('/salaries/report', { params: { month: repMonth, year: repYear } })
      setReport(r.data.data)
    } catch { toast.error('Failed to load report') }
    finally { setLoading(false) }
  }
  useEffect(() => { if (tab === 'report') fetchReport() }, [tab, repMonth, repYear])

  function openAdd()   { setEdit(null); setForm(INIT); setModal(true) }
  function openEdit(r) {
    setEdit(r)
    setForm({ employee_id: r.employee_id, month: r.month, year: r.year, basic_salary: r.basic_salary, bonus: r.bonus, deductions: r.deductions, payment_date: r.payment_date || '', status: r.status })
    setModal(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.employee_id || !form.basic_salary) { toast.error('Employee and basic salary required'); return }
    setSaving(true)
    try {
      if (editRec) { await api.put(`/salaries/${editRec.id}`, form); toast.success('Salary updated') }
      else { await api.post('/salaries/', form); toast.success('Salary record added') }
      setModal(false)
      fetchRecords()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await api.delete(`/salaries/${delTarget.id}`)
      toast.success('Record deleted')
      setDel(null)
      fetchRecords()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    } finally { setDeleting(false) }
  }

  function inp(f, v) { setForm(p => ({ ...p, [f]: v })) }
  const netNum = Number(form.basic_salary||0) + Number(form.bonus||0) - Number(form.deductions||0)
  const net = netNum.toLocaleString()

  // Monthly total from records
  const monthlyTotal = records.reduce((s, r) => s + Number(r.net_salary || 0), 0)

  const tabs = [
    { id: 'records', label: 'Records', icon: MdAttachMoney },
    { id: 'report',  label: 'Report',  icon: MdBarChart },
  ]

  return (
    <div className="space-y-5">

      {/* ── Premium Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <h2
                className="text-2xl font-black"
                style={{ background: 'linear-gradient(90deg,#fff,#00c9b1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
              >
                Salary Management
              </h2>
              <div className="h-0.5 w-12 rounded-full mt-0.5" style={{ background: 'linear-gradient(90deg,#00c9b1,transparent)' }} />
            </div>
            {/* Monthly total display */}
            {tab === 'records' && records.length > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ background: 'rgba(0,201,177,0.12)', border: '1px solid rgba(0,201,177,0.25)', color: '#00c9b1' }}>
                <MdAttachMoney size={13} />
                ${monthlyTotal.toLocaleString()} this period
              </div>
            )}
          </div>
          <p className="text-slate-400 text-sm mt-1">Manage employee compensation and payroll</p>
        </div>
        <button
          onClick={openAdd}
          className="btn-primary flex items-center gap-2 transition-all duration-200"
          style={{ background: 'linear-gradient(135deg,#00c9b1,#0097a7)', boxShadow: '0 4px 14px rgba(0,201,177,0.35)' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 22px rgba(0,201,177,0.55)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,201,177,0.35)'; }}
        >
          <MdAdd size={18} /> Add Salary
        </button>
      </div>

      {/* ── Pill Tabs ── */}
      <div className="flex gap-1 p-1 rounded-2xl w-fit"
        style={{ background: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
            style={tab === t.id
              ? { background: 'linear-gradient(135deg,#00c9b1,#0097a7)', color: '#fff', boxShadow: '0 3px 10px rgba(0,201,177,0.4)' }
              : { color: '#64748b' }}
            onMouseEnter={e => { if (tab !== t.id) { e.currentTarget.style.background = 'rgba(0,201,177,0.08)'; e.currentTarget.style.color = '#00c9b1'; }}}
            onMouseLeave={e => { if (tab !== t.id) { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#64748b'; }}}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {/* ══ RECORDS TAB ══ */}
      {tab === 'records' && (
        <>
          {/* Filter bar */}
          <div className="rounded-2xl p-4 flex flex-col sm:flex-row gap-3"
            style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
            <div className="relative flex-1">
              <MdCalendarToday className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={15} />
              <select value={filterMonth} onChange={e => setFMonth(e.target.value)} className="form-input pl-10 flex-1">
                <option value="">All Months</option>
                {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div className="relative">
              <MdCalendarToday className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={15} />
              <input type="number" value={filterYear} onChange={e => setFYear(e.target.value)} className="form-input pl-10 w-32" placeholder="Year" />
            </div>
            <button onClick={fetchRecords}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{ background: 'rgba(0,201,177,0.08)', color: '#00a896', border: '1px solid rgba(0,201,177,0.2)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,201,177,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,201,177,0.08)'; }}>
              Filter
            </button>
          </div>

          {/* Table */}
          <div className="rounded-2xl overflow-hidden" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid rgba(255,255,255,0.8)' }}>
            {loading ? <div className="bg-white"><Spinner center /></div> : records.length === 0 ? (
              <div className="bg-white"><EmptyState message="No salary records" icon={MdAttachMoney} actionLabel="Add Record" onAction={openAdd} /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: '#0d1b2a' }}>
                      <th className="text-left text-[10px] font-black uppercase tracking-widest py-4 px-4 text-slate-400">Employee</th>
                      <th className="text-left text-[10px] font-black uppercase tracking-widest py-4 px-4 text-slate-400">Period</th>
                      <th className="text-left text-[10px] font-black uppercase tracking-widest py-4 px-4 text-slate-400 hidden sm:table-cell">Basic</th>
                      <th className="text-left text-[10px] font-black uppercase tracking-widest py-4 px-4 text-slate-400 hidden md:table-cell">Bonus</th>
                      <th className="text-left text-[10px] font-black uppercase tracking-widest py-4 px-4 text-slate-400 hidden md:table-cell">Deductions</th>
                      <th className="text-left text-[10px] font-black uppercase tracking-widest py-4 px-4 text-slate-400">Net Salary</th>
                      <th className="text-left text-[10px] font-black uppercase tracking-widest py-4 px-4 text-slate-400">Status</th>
                      <th className="text-right text-[10px] font-black uppercase tracking-widest py-4 px-4 text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r, i) => (
                      <tr key={r.id}
                        className="group border-b transition-colors duration-150"
                        style={{ background: i % 2 === 0 ? '#fff' : 'rgba(248,250,252,0.8)', borderColor: '#f1f5f9' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,201,177,0.04)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = i % 2 === 0 ? '#fff' : 'rgba(248,250,252,0.8)'; }}>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-slate-800 text-sm">{r.full_name}</p>
                          <p className="text-xs text-slate-400">{r.department_name}</p>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 text-sm">{MONTHS[r.month-1]?.slice(0,3)} {r.year}</td>
                        <td className="py-3.5 px-4 hidden sm:table-cell text-slate-600 text-sm">${Number(r.basic_salary||0).toLocaleString()}</td>
                        {/* Bonus in green */}
                        <td className="py-3.5 px-4 hidden md:table-cell">
                          <span className="text-sm font-semibold" style={{ color: '#10b981' }}>+${Number(r.bonus||0).toLocaleString()}</span>
                        </td>
                        {/* Deductions in red */}
                        <td className="py-3.5 px-4 hidden md:table-cell">
                          <span className="text-sm font-semibold" style={{ color: '#ef4444' }}>-${Number(r.deductions||0).toLocaleString()}</span>
                        </td>
                        {/* Net salary: large teal bold */}
                        <td className="py-3.5 px-4">
                          <span className="text-lg font-black stat-number" style={{ color: '#00c9b1' }}>
                            ${Number(r.net_salary||0).toLocaleString()}
                          </span>
                        </td>
                        <td className="py-3.5 px-4"><StatusBadge status={r.status} /></td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button onClick={() => openEdit(r)}
                              className="p-2 rounded-lg transition-all duration-200" style={{ color: '#94a3b8' }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; e.currentTarget.style.color = '#6366f1'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#94a3b8'; }}>
                              <MdEdit size={15} />
                            </button>
                            <button onClick={() => setDel(r)}
                              className="p-2 rounded-lg transition-all duration-200" style={{ color: '#94a3b8' }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#94a3b8'; }}>
                              <MdDelete size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ══ REPORT TAB ══ */}
      {tab === 'report' && (
        <>
          {/* Period selectors */}
          <div className="rounded-2xl p-4 flex gap-3"
            style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
            <div className="relative">
              <MdCalendarToday className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={15} />
              <select value={repMonth} onChange={e => setRepMonth(e.target.value)} className="form-input pl-10 w-44">
                {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
            </div>
            <input type="number" value={repYear} onChange={e => setRepYear(e.target.value)} className="form-input w-28" />
          </div>

          {loading ? <Spinner center /> : report && (
            <>
              {/* 3 gradient stat cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Total Payroll', val: `$${Number(report.summary?.total||0).toLocaleString()}`,   icon: MdAttachMoney, grad: 'linear-gradient(135deg,#00c9b1,#0097a7)', glow: 'rgba(0,201,177,0.3)',  bg: 'rgba(0,201,177,0.06)',  border: 'rgba(0,201,177,0.2)'  },
                  { label: 'Paid',          val: `$${Number(report.summary?.paid||0).toLocaleString()}`,    icon: MdTrendingUp,  grad: 'linear-gradient(135deg,#10b981,#059669)', glow: 'rgba(16,185,129,0.3)', bg: 'rgba(16,185,129,0.06)', border: 'rgba(16,185,129,0.2)' },
                  { label: 'Pending',       val: `$${Number(report.summary?.pending||0).toLocaleString()}`, icon: MdBarChart,    grad: 'linear-gradient(135deg,#f59e0b,#d97706)', glow: 'rgba(245,158,11,0.3)', bg: 'rgba(245,158,11,0.06)', border: 'rgba(245,158,11,0.2)' },
                ].map(c => (
                  <div key={c.label}
                    className="rounded-2xl p-5 flex items-center gap-4 transition-all duration-200"
                    style={{ background: c.bg, border: `1px solid ${c.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 28px ${c.glow}`; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'; }}
                  >
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ background: c.grad, boxShadow: `0 4px 12px ${c.glow}` }}>
                      <c.icon size={22} className="text-white" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{c.label}</p>
                      <p className="text-2xl font-black stat-number mt-0.5" style={{ background: c.grad, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{c.val}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Department breakdown table */}
              <div className="rounded-2xl overflow-hidden" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
                <div className="px-5 py-4 bg-white border-b border-slate-100">
                  <h3 className="font-bold text-slate-800">Department-wise Breakdown</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: '#0d1b2a' }}>
                        <th className="text-left text-[10px] font-black uppercase tracking-widest py-4 px-4 text-slate-400">Department</th>
                        <th className="text-left text-[10px] font-black uppercase tracking-widest py-4 px-4 text-slate-400">Employees</th>
                        <th className="text-left text-[10px] font-black uppercase tracking-widest py-4 px-4 text-slate-400">Total Salary</th>
                        <th className="text-left text-[10px] font-black uppercase tracking-widest py-4 px-4 text-slate-400 hidden sm:table-cell">Avg Salary</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.department_report?.map((d, i) => (
                        <tr key={i}
                          className="border-b transition-colors duration-150"
                          style={{ background: i % 2 === 0 ? '#fff' : 'rgba(248,250,252,0.8)', borderColor: '#f1f5f9' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,201,177,0.04)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = i % 2 === 0 ? '#fff' : 'rgba(248,250,252,0.8)'; }}>
                          <td className="py-3.5 px-4 font-semibold text-slate-800 text-sm">{d.department_name}</td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <MdPeople size={14} className="text-slate-400" />
                              <span className="text-sm text-slate-600">{d.employee_count}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-base font-bold stat-number" style={{ color: '#00c9b1' }}>${Number(d.total_salary||0).toLocaleString()}</span>
                          </td>
                          <td className="py-3.5 px-4 hidden sm:table-cell text-slate-500 text-sm">${Number(d.avg_salary||0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ── Add/Edit Modal ── */}
      <Modal open={modalOpen} onClose={() => setModal(false)} title={editRec ? 'Edit Salary Record' : 'Add Salary Record'} size="md">
        <form onSubmit={handleSave} className="space-y-4">
          {!editRec && (
            <div>
              <label className="form-label">Employee *</label>
              <div className="relative">
                <MdPeople className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                <select value={form.employee_id} onChange={e => inp('employee_id', e.target.value)} className="form-input pl-10" required>
                  <option value="">Select Employee</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
                </select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Month</label>
              <div className="relative">
                <MdCalendarToday className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                <select value={form.month} onChange={e => inp('month', e.target.value)} className="form-input pl-10">
                  {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="form-label">Year</label>
              <input type="number" value={form.year} onChange={e => inp('year', e.target.value)} className="form-input" />
            </div>
          </div>

          <div>
            <label className="form-label">Basic Salary ($) *</label>
            <div className="relative">
              <MdAttachMoney className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input type="number" value={form.basic_salary} onChange={e => inp('basic_salary', e.target.value)} className="form-input pl-10" placeholder="50000" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Bonus ($)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: '#10b981' }}>+</span>
                <input type="number" value={form.bonus} onChange={e => inp('bonus', e.target.value)} className="form-input pl-8" placeholder="0" />
              </div>
            </div>
            <div>
              <label className="form-label">Deductions ($)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold" style={{ color: '#ef4444' }}>-</span>
                <input type="number" value={form.deductions} onChange={e => inp('deductions', e.target.value)} className="form-input pl-8" placeholder="0" />
              </div>
            </div>
          </div>

          {/* Live net salary preview */}
          <div className="rounded-2xl p-4 flex items-center justify-between transition-all duration-200"
            style={{ background: 'linear-gradient(135deg, rgba(0,201,177,0.06), rgba(0,151,167,0.06))', border: '1px solid rgba(0,201,177,0.2)' }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#00c9b1,#0097a7)' }}>
                <MdAttachMoney size={16} className="text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Net Salary</p>
                <p className="text-xs text-slate-400">basic + bonus – deductions</p>
              </div>
            </div>
            <span className="text-2xl font-black stat-number" style={{ color: '#00c9b1' }}>${net}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Payment Date</label>
              <div className="relative">
                <MdCalendarToday className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                <input type="date" value={form.payment_date} onChange={e => inp('payment_date', e.target.value)} className="form-input pl-10" />
              </div>
            </div>
            <div>
              <label className="form-label">Status</label>
              <select value={form.status} onChange={e => inp('status', e.target.value)} className="form-input">
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
              ) : editRec ? 'Update' : 'Add Record'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!delTarget} onClose={() => setDel(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Delete Salary Record"
        message="Delete this salary record? This cannot be undone."
      />
    </div>
  )
}
