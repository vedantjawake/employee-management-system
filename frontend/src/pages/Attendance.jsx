import React, { useState, useEffect, useCallback } from 'react'
import {
  MdAdd, MdCalendarToday, MdSearch, MdCheckCircle, MdBarChart,
  MdCancel, MdAccessTime, MdPeople, MdSchedule,
} from 'react-icons/md'
import toast from 'react-hot-toast'
import api from '../services/api'
import Modal from '../components/Modal'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'

const STATUS_OPTS = ['present', 'absent', 'late', 'half-day']

const TEAL_COLORS = ['#00c9b1', '#6366f1', '#f59e0b', '#10b981', '#8b5cf6']

function StatusBadge({ status }) {
  const cfg = {
    present:  { dot: '#10b981', bg: 'rgba(16,185,129,0.1)',  text: '#059669'  },
    absent:   { dot: '#ef4444', bg: 'rgba(239,68,68,0.1)',   text: '#dc2626'  },
    late:     { dot: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  text: '#d97706'  },
    'half-day': { dot: '#6366f1', bg: 'rgba(99,102,241,0.1)', text: '#4f46e5' },
  }[status] || { dot: '#94a3b8', bg: 'rgba(148,163,184,0.1)', text: '#64748b' }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
      style={{ background: cfg.bg, color: cfg.text }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      {status}
    </span>
  )
}

export default function Attendance() {
  const [records, setRecords]       = useState([])
  const [employees, setEmps]        = useState([])
  const [loading, setLoading]       = useState(true)
  const [report, setReport]         = useState([])
  const [tab, setTab]               = useState('records')
  const [filterDate, setFilterDate] = useState('')
  const [filterEmp, setFilterEmp]   = useState('')
  const [modalOpen, setModal]       = useState(false)
  const [form, setForm]             = useState({
    employee_id: '', date: new Date().toISOString().split('T')[0],
    status: 'present', check_in: '09:00', check_out: '18:00', notes: '',
  })
  const [saving, setSaving]         = useState(false)
  const [reportMonth, setRepMonth]  = useState(new Date().getMonth() + 1)
  const [reportYear, setRepYear]    = useState(new Date().getFullYear())
  const [bulkDate, setBulkDate]     = useState(new Date().toISOString().split('T')[0])
  const [bulkStatuses, setBulkSts]  = useState({})

  useEffect(() => {
    api.get('/employees/', { params: { per_page: 100 } })
      .then(r => {
        setEmps(r.data.data)
        const init = {}
        r.data.data.forEach(e => { init[e.id] = 'present' })
        setBulkSts(init)
      }).catch(() => {})
  }, [])

  const fetchRecords = useCallback(async () => {
    setLoading(true)
    try {
      const params = {}
      if (filterDate) params.date = filterDate
      if (filterEmp)  params.employee_id = filterEmp
      const r = await api.get('/attendance/', { params })
      setRecords(r.data.data)
    } catch { toast.error('Failed to load attendance') }
    finally { setLoading(false) }
  }, [filterDate, filterEmp])

  useEffect(() => { if (tab === 'records') fetchRecords() }, [tab, fetchRecords])

  async function fetchReport() {
    setLoading(true)
    try {
      const r = await api.get('/attendance/monthly-report', { params: { month: reportMonth, year: reportYear } })
      setReport(r.data.data)
    } catch { toast.error('Failed to load report') }
    finally { setLoading(false) }
  }
  useEffect(() => { if (tab === 'report') fetchReport() }, [tab, reportMonth, reportYear])

  async function handleSave(e) {
    e.preventDefault()
    if (!form.employee_id) { toast.error('Select employee'); return }
    setSaving(true)
    try {
      await api.post('/attendance/', form)
      toast.success('Attendance marked')
      setModal(false)
      fetchRecords()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally { setSaving(false) }
  }

  async function handleBulk() {
    setSaving(true)
    try {
      const recs = employees.map(e => ({ employee_id: e.id, status: bulkStatuses[e.id] || 'present' }))
      await api.post('/attendance/bulk', { records: recs, date: bulkDate })
      toast.success('Bulk attendance saved')
      setTab('records')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    } finally { setSaving(false) }
  }

  function markAllBulk(status) {
    const next = {}
    employees.forEach(e => { next[e.id] = status })
    setBulkSts(next)
  }

  const bulkCounts = employees.reduce((acc, e) => {
    const s = bulkStatuses[e.id] || 'present'
    acc[s] = (acc[s] || 0) + 1
    return acc
  }, {})

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const tabs = [
    { id: 'records', label: 'Records',        icon: MdCalendarToday },
    { id: 'report',  label: 'Monthly Report', icon: MdBarChart },
    { id: 'bulk',    label: 'Bulk Mark',      icon: MdCheckCircle },
  ]

  return (
    <div className="space-y-5">

      {/* ── Premium Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div>
              <h2
                className="text-2xl font-black"
                style={{ background: 'linear-gradient(90deg,#fff,#00c9b1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
              >
                Attendance
              </h2>
              <div className="h-0.5 w-12 rounded-full mt-0.5" style={{ background: 'linear-gradient(90deg,#00c9b1,transparent)' }} />
            </div>
            {/* Today's date badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: 'rgba(0,201,177,0.12)', border: '1px solid rgba(0,201,177,0.25)', color: '#00c9b1' }}>
              <MdCalendarToday size={12} />
              {today}
            </div>
          </div>
          <p className="text-slate-400 text-sm mt-1">Track and manage employee attendance records</p>
        </div>
        <button
          onClick={() => setModal(true)}
          className="btn-primary flex items-center gap-2 transition-all duration-200"
          style={{ background: 'linear-gradient(135deg,#00c9b1,#0097a7)', boxShadow: '0 4px 14px rgba(0,201,177,0.35)' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 22px rgba(0,201,177,0.55)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,201,177,0.35)'; }}
        >
          <MdAdd size={18} /> Mark Attendance
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
            <t.icon size={15} />
            {t.label}
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
              <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="form-input pl-10 flex-1" />
            </div>
            <div className="relative flex-1">
              <MdPeople className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <select value={filterEmp} onChange={e => setFilterEmp(e.target.value)} className="form-input pl-10 flex-1">
                <option value="">All Employees</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
              </select>
            </div>
            <button onClick={fetchRecords}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 transition-all duration-200"
              style={{ background: 'rgba(0,201,177,0.08)', color: '#00a896', border: '1px solid rgba(0,201,177,0.2)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,201,177,0.15)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,201,177,0.08)'; }}>
              <MdSearch size={16} /> Filter
            </button>
          </div>

          <div className="rounded-2xl overflow-hidden" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid rgba(255,255,255,0.8)' }}>
            {loading ? <div className="bg-white"><Spinner center /></div> : records.length === 0 ? (
              <div className="bg-white"><EmptyState message="No attendance records" icon={MdCalendarToday} subtitle="Use 'Mark Attendance' to add records" /></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: '#0d1b2a' }}>
                      <th className="text-left text-[10px] font-black uppercase tracking-widest py-4 px-4 text-slate-400">Employee</th>
                      <th className="text-left text-[10px] font-black uppercase tracking-widest py-4 px-4 text-slate-400">Date</th>
                      <th className="text-left text-[10px] font-black uppercase tracking-widest py-4 px-4 text-slate-400">Status</th>
                      <th className="text-left text-[10px] font-black uppercase tracking-widest py-4 px-4 text-slate-400 hidden sm:table-cell">Check In</th>
                      <th className="text-left text-[10px] font-black uppercase tracking-widest py-4 px-4 text-slate-400 hidden sm:table-cell">Check Out</th>
                      <th className="text-left text-[10px] font-black uppercase tracking-widest py-4 px-4 text-slate-400 hidden md:table-cell">Department</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r, i) => (
                      <tr key={r.id}
                        className="border-b transition-colors duration-150"
                        style={{ background: i % 2 === 0 ? '#fff' : 'rgba(248,250,252,0.8)', borderColor: '#f1f5f9' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,201,177,0.04)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = i % 2 === 0 ? '#fff' : 'rgba(248,250,252,0.8)'; }}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                              style={{ background: `linear-gradient(135deg, ${TEAL_COLORS[i % TEAL_COLORS.length]}, ${TEAL_COLORS[(i+2) % TEAL_COLORS.length]})` }}>
                              {r.full_name?.charAt(0)?.toUpperCase()}
                            </div>
                            <p className="font-semibold text-slate-800 text-sm">{r.full_name}</p>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-sm">{r.date}</td>
                        <td className="py-3.5 px-4"><StatusBadge status={r.status} /></td>
                        <td className="py-3.5 px-4 hidden sm:table-cell text-slate-500 text-sm">{r.check_in || '—'}</td>
                        <td className="py-3.5 px-4 hidden sm:table-cell text-slate-500 text-sm">{r.check_out || '—'}</td>
                        <td className="py-3.5 px-4 hidden md:table-cell">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                            style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1' }}>
                            {r.department_name || '—'}
                          </span>
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

      {/* ══ MONTHLY REPORT TAB ══ */}
      {tab === 'report' && (
        <>
          <div className="rounded-2xl p-4 flex gap-3"
            style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
            <select value={reportMonth} onChange={e => setRepMonth(e.target.value)} className="form-input w-40">
              {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <input type="number" value={reportYear} onChange={e => setRepYear(e.target.value)} className="form-input w-28" min="2020" max="2030" />
          </div>

          {loading ? <Spinner center /> : report.length === 0 ? (
            <div className="bg-white rounded-2xl"><EmptyState message="No report data" icon={MdBarChart} subtitle="No attendance records found for this period" /></div>
          ) : (
            <>
              {/* Colored stat cards */}
              {(() => {
                const totals = report.reduce((a, r) => ({
                  present: a.present + (r.present_days || 0),
                  absent:  a.absent  + (r.absent_days  || 0),
                  late:    a.late    + (r.late_days    || 0),
                }), { present: 0, absent: 0, late: 0 })
                return (
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { label: 'Total Present', val: totals.present, icon: MdCheckCircle, color: '#00c9b1', bg: 'rgba(0,201,177,0.08)', border: 'rgba(0,201,177,0.2)' },
                      { label: 'Total Absent',  val: totals.absent,  icon: MdCancel,      color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
                      { label: 'Total Late',    val: totals.late,    icon: MdSchedule,    color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)' },
                    ].map(c => (
                      <div key={c.label} className="rounded-2xl p-4 flex items-center gap-3"
                        style={{ background: c.bg, border: `1px solid ${c.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: `${c.color}20` }}>
                          <c.icon size={20} style={{ color: c.color }} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{c.label}</p>
                          <p className="text-2xl font-black stat-number leading-none" style={{ color: c.color }}>{c.val}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              })()}

              <div className="rounded-2xl overflow-hidden" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: '#0d1b2a' }}>
                        <th className="text-left text-[10px] font-black uppercase tracking-widest py-4 px-4 text-slate-400">Employee</th>
                        <th className="text-left text-[10px] font-black uppercase tracking-widest py-4 px-4 text-slate-400 hidden sm:table-cell">Department</th>
                        <th className="text-left text-[10px] font-black uppercase tracking-widest py-4 px-4 text-slate-400">Present</th>
                        <th className="text-left text-[10px] font-black uppercase tracking-widest py-4 px-4 text-slate-400">Absent</th>
                        <th className="text-left text-[10px] font-black uppercase tracking-widest py-4 px-4 text-slate-400 hidden md:table-cell">Late</th>
                        <th className="text-left text-[10px] font-black uppercase tracking-widest py-4 px-4 text-slate-400 hidden md:table-cell">Half-day</th>
                        <th className="text-left text-[10px] font-black uppercase tracking-widest py-4 px-4 text-slate-400">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.map((r, i) => (
                        <tr key={r.id}
                          className="border-b transition-colors duration-150"
                          style={{ background: i % 2 === 0 ? '#fff' : 'rgba(248,250,252,0.8)', borderColor: '#f1f5f9' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,201,177,0.04)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = i % 2 === 0 ? '#fff' : 'rgba(248,250,252,0.8)'; }}>
                          <td className="py-3.5 px-4 font-semibold text-slate-800 text-sm">{r.full_name}</td>
                          <td className="py-3.5 px-4 hidden sm:table-cell text-slate-500 text-sm">{r.department_name || '—'}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold"
                              style={{ background: 'rgba(16,185,129,0.1)', color: '#059669' }}>{r.present_days}</span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold"
                              style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626' }}>{r.absent_days}</span>
                          </td>
                          <td className="py-3.5 px-4 hidden md:table-cell text-center">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold"
                              style={{ background: 'rgba(245,158,11,0.1)', color: '#d97706' }}>{r.late_days}</span>
                          </td>
                          <td className="py-3.5 px-4 hidden md:table-cell text-center">
                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold"
                              style={{ background: 'rgba(99,102,241,0.1)', color: '#4f46e5' }}>{r.half_days}</span>
                          </td>
                          <td className="py-3.5 px-4 text-center text-sm font-semibold text-slate-600">{r.total_days}</td>
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

      {/* ══ BULK MARK TAB ══ */}
      {tab === 'bulk' && (
        <div className="space-y-4">
          {/* Summary counts as colored mini cards */}
          {employees.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { key: 'present',  label: 'Present',  icon: MdCheckCircle, color: '#10b981', bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.2)' },
                { key: 'absent',   label: 'Absent',   icon: MdCancel,      color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.2)' },
                { key: 'late',     label: 'Late',     icon: MdSchedule,    color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)' },
                { key: 'half-day', label: 'Half-day', icon: MdAccessTime,  color: '#6366f1', bg: 'rgba(99,102,241,0.08)',  border: 'rgba(99,102,241,0.2)' },
              ].map(c => (
                <div key={c.key} className="rounded-xl p-3 flex items-center gap-2.5"
                  style={{ background: c.bg, border: `1px solid ${c.border}` }}>
                  <c.icon size={18} style={{ color: c.color, flexShrink: 0 }} />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide" style={{ color: c.color }}>{c.label}</p>
                    <p className="text-xl font-black stat-number leading-none" style={{ color: c.color }}>{bulkCounts[c.key] || 0}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Date + quick-action */}
          <div className="rounded-2xl p-4"
            style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
            <div className="flex flex-col sm:flex-row sm:items-end gap-4">
              <div>
                <label className="form-label">Attendance Date</label>
                <div className="relative">
                  <MdCalendarToday className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={15} />
                  <input type="date" value={bulkDate} onChange={e => setBulkDate(e.target.value)} className="form-input pl-10 w-44" />
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button type="button" onClick={() => markAllBulk('present')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200"
                  style={{ background: 'rgba(16,185,129,0.1)', color: '#059669', border: '1px solid rgba(16,185,129,0.2)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(16,185,129,0.1)'; }}>
                  <MdCheckCircle size={14} /> Mark All Present
                </button>
                <button type="button" onClick={() => markAllBulk('absent')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200"
                  style={{ background: 'rgba(239,68,68,0.1)', color: '#dc2626', border: '1px solid rgba(239,68,68,0.2)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}>
                  <MdCancel size={14} /> Mark All Absent
                </button>
              </div>
            </div>
          </div>

          {/* Employee rows */}
          <div className="rounded-2xl overflow-hidden" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: '#0d1b2a' }}>
                    <th className="text-left text-[10px] font-black uppercase tracking-widest py-4 px-4 text-slate-400">Employee</th>
                    <th className="text-left text-[10px] font-black uppercase tracking-widest py-4 px-4 text-slate-400 hidden sm:table-cell">Department</th>
                    <th className="text-left text-[10px] font-black uppercase tracking-widest py-4 px-4 text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp, i) => (
                    <tr key={emp.id}
                      className="border-b transition-colors duration-150"
                      style={{ background: i % 2 === 0 ? '#fff' : 'rgba(248,250,252,0.8)', borderColor: '#f1f5f9' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,201,177,0.03)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = i % 2 === 0 ? '#fff' : 'rgba(248,250,252,0.8)'; }}>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                            style={{ background: `linear-gradient(135deg, ${TEAL_COLORS[i % TEAL_COLORS.length]}, ${TEAL_COLORS[(i+2) % TEAL_COLORS.length]})` }}>
                            {emp.full_name?.charAt(0)?.toUpperCase()}
                          </div>
                          <span className="font-semibold text-slate-800 text-sm">{emp.full_name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 hidden sm:table-cell text-slate-500 text-sm">{emp.department_name || '—'}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex gap-1.5 flex-wrap">
                          {STATUS_OPTS.map(s => {
                            const cfg = {
                              present:    { active: 'linear-gradient(135deg,#10b981,#059669)', glow: 'rgba(16,185,129,0.4)',  border: '#10b981' },
                              absent:     { active: 'linear-gradient(135deg,#ef4444,#dc2626)', glow: 'rgba(239,68,68,0.4)',   border: '#ef4444' },
                              late:       { active: 'linear-gradient(135deg,#f59e0b,#d97706)', glow: 'rgba(245,158,11,0.4)',  border: '#f59e0b' },
                              'half-day': { active: 'linear-gradient(135deg,#6366f1,#4f46e5)', glow: 'rgba(99,102,241,0.4)',  border: '#6366f1' },
                            }[s]
                            const isActive = bulkStatuses[emp.id] === s
                            return (
                              <button key={s}
                                onClick={() => setBulkSts(p => ({ ...p, [emp.id]: s }))}
                                className="px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 border"
                                style={isActive
                                  ? { background: cfg.active, color: '#fff', border: `1px solid ${cfg.border}`, boxShadow: `0 2px 8px ${cfg.glow}`, transform: 'scale(1.05)' }
                                  : { background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}
                                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderColor = cfg.border; e.currentTarget.style.color = cfg.border; }}}
                                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.color = '#64748b'; }}}
                              >{s}</button>
                            )
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={handleBulk} disabled={saving || employees.length === 0} className="btn-primary">
              {saving ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
              ) : 'Save Bulk Attendance'}
            </button>
          </div>
        </div>
      )}

      {/* ── Mark Individual Modal ── */}
      <Modal open={modalOpen} onClose={() => setModal(false)} title="Mark Attendance" size="sm">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="form-label">Employee *</label>
            <div className="relative">
              <MdPeople className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <select value={form.employee_id} onChange={e => setForm(p => ({ ...p, employee_id: e.target.value }))} className="form-input pl-10" required>
                <option value="">Select Employee</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.full_name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="form-label">Date *</label>
            <div className="relative">
              <MdCalendarToday className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={15} />
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="form-input pl-10" required />
            </div>
          </div>

          {/* Visual status cards */}
          <div>
            <label className="form-label">Status</label>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTS.map(s => {
                const cfg = {
                  present:    { grad: 'linear-gradient(135deg,#10b981,#059669)', glow: 'rgba(16,185,129,0.25)', icon: MdCheckCircle, label: 'Present'  },
                  absent:     { grad: 'linear-gradient(135deg,#ef4444,#dc2626)', glow: 'rgba(239,68,68,0.25)',  icon: MdCancel,      label: 'Absent'   },
                  late:       { grad: 'linear-gradient(135deg,#f59e0b,#d97706)', glow: 'rgba(245,158,11,0.25)', icon: MdSchedule,    label: 'Late'     },
                  'half-day': { grad: 'linear-gradient(135deg,#6366f1,#4f46e5)', glow: 'rgba(99,102,241,0.25)', icon: MdAccessTime,  label: 'Half-day' },
                }[s]
                const active = form.status === s
                return (
                  <button key={s} type="button"
                    onClick={() => setForm(p => ({ ...p, status: s }))}
                    className="flex items-center gap-2 p-3 rounded-xl text-sm font-semibold transition-all duration-200 border-2"
                    style={active
                      ? { background: cfg.grad, color: '#fff', border: '2px solid transparent', boxShadow: `0 4px 14px ${cfg.glow}`, transform: 'scale(1.02)' }
                      : { background: '#f8fafc', color: '#64748b', border: '2px solid #e2e8f0' }}>
                    <cfg.icon size={16} />
                    {cfg.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Check In</label>
              <div className="relative">
                <MdAccessTime className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={15} />
                <input type="time" value={form.check_in} onChange={e => setForm(p => ({ ...p, check_in: e.target.value }))} className="form-input pl-10" />
              </div>
            </div>
            <div>
              <label className="form-label">Check Out</label>
              <div className="relative">
                <MdAccessTime className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={15} />
                <input type="time" value={form.check_out} onChange={e => setForm(p => ({ ...p, check_out: e.target.value }))} className="form-input pl-10" />
              </div>
            </div>
          </div>
          <div>
            <label className="form-label">Notes</label>
            <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="form-input" placeholder="Optional note..." />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
              ) : 'Mark Attendance'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
