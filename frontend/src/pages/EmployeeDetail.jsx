import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  MdArrowBack, MdEdit, MdDelete, MdEmail, MdPhone, MdLocationOn,
  MdCalendarToday, MdAttachMoney, MdBusiness, MdWork, MdPerson,
  MdAccessTime, MdCheckCircle, MdCancel, MdSchedule, MdTrendingUp,
} from 'react-icons/md'
import toast from 'react-hot-toast'
import api from '../services/api'
import Spinner from '../components/Spinner'
import ConfirmDialog from '../components/ConfirmDialog'
import Modal from '../components/Modal'

const INIT = { full_name:'', email:'', phone:'', department_id:'', position:'', joining_date:'', salary:'', address:'', status:'active' }
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const TEAL_COLORS = ['#00c9b1','#6366f1','#f59e0b','#10b981','#8b5cf6','#0891b2']

const BADGE_CFG = {
  present:    { bg:'rgba(16,185,129,0.1)',  color:'#059669',  dot:'#10b981' },
  absent:     { bg:'rgba(239,68,68,0.1)',   color:'#dc2626',  dot:'#ef4444' },
  late:       { bg:'rgba(245,158,11,0.1)',  color:'#d97706',  dot:'#f59e0b' },
  'half-day': { bg:'rgba(99,102,241,0.1)',  color:'#4f46e5',  dot:'#6366f1' },
  paid:       { bg:'rgba(16,185,129,0.1)',  color:'#059669',  dot:'#10b981' },
  pending:    { bg:'rgba(245,158,11,0.1)',  color:'#d97706',  dot:'#f59e0b' },
  active:     { bg:'rgba(0,201,177,0.1)',   color:'#00a896',  dot:'#00c9b1' },
  inactive:   { bg:'rgba(148,163,184,0.1)', color:'#64748b',  dot:'#94a3b8' },
}
function Badge({ status }) {
  const c = BADGE_CFG[status] || BADGE_CFG.inactive
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
      style={{ background:c.bg, color:c.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background:c.dot }}/>
      {status}
    </span>
  )
}

function InfoCard({ icon: Icon, label, value, color = '#00c9b1' }) {
  return (
    <div className="flex items-center gap-3 p-3.5 rounded-xl transition-all duration-200 group"
      style={{ background:'rgba(248,250,252,0.8)', border:'1px solid #f1f5f9' }}
      onMouseEnter={e => { e.currentTarget.style.background=`${color}08`; e.currentTarget.style.borderColor=`${color}30`; }}
      onMouseLeave={e => { e.currentTarget.style.background='rgba(248,250,252,0.8)'; e.currentTarget.style.borderColor='#f1f5f9'; }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
        style={{ background:`${color}15` }}>
        <Icon size={15} style={{ color }}/>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-slate-700 truncate mt-0.5">{value || '—'}</p>
      </div>
    </div>
  )
}

export default function EmployeeDetail() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const [emp,      setEmp]       = useState(null)
  const [loading,  setLoading]   = useState(true)
  const [deleteOpen,setDeleteOpen] = useState(false)
  const [deleting, setDeleting]  = useState(false)
  const [attendance, setAttendance] = useState([])
  const [salaries,   setSalaries]   = useState([])
  const [departments,setDepts]      = useState([])
  const [editOpen,  setEditOpen]   = useState(false)
  const [form,      setForm]       = useState(INIT)
  const [saving,    setSaving]     = useState(false)

  function loadEmployee() {
    return Promise.all([
      api.get(`/employees/${id}`),
      api.get('/attendance/', { params: { employee_id: id } }),
      api.get('/salaries/',   { params: { employee_id: id } }),
    ]).then(([empRes, attRes, salRes]) => {
      setEmp(empRes.data.data)
      setAttendance(attRes.data.data?.slice(0,6) || [])
      setSalaries(salRes.data.data?.slice(0,5)   || [])
    })
  }

  useEffect(() => {
    Promise.all([
      loadEmployee(),
      api.get('/departments/').then(r => setDepts(r.data.data)).catch(() => {}),
    ])
    .catch(() => toast.error('Failed to load employee'))
    .finally(() => setLoading(false))
  }, [id])

  function openEdit() {
    if (!emp) return
    setForm({
      full_name: emp.full_name||'', email: emp.email||'', phone: emp.phone||'',
      department_id: emp.department_id||'', position: emp.position||'',
      joining_date: emp.joining_date||'', salary: emp.salary||'',
      address: emp.address||'', status: emp.status||'active',
    })
    setEditOpen(true)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.full_name || !form.email) { toast.error('Name and email required'); return }
    setSaving(true)
    try {
      await api.put(`/employees/${id}`, form)
      toast.success('Employee updated')
      setEditOpen(false)
      setLoading(true)
      await loadEmployee()
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed') }
    finally { setSaving(false); setLoading(false) }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await api.delete(`/employees/${id}`)
      toast.success('Employee deleted')
      navigate('/employees')
    } catch (err) { toast.error(err.response?.data?.message || 'Delete failed') }
    finally { setDeleting(false) }
  }

  function inp(field, val) { setForm(p => ({...p, [field]: val})) }

  if (loading) return <Spinner center />
  if (!emp)    return <div className="card text-center py-12 text-slate-400">Employee not found</div>

  // Attendance stats
  const attStats = attendance.reduce((a, r) => { a[r.status] = (a[r.status]||0)+1; return a }, {})

  return (
    <div className="space-y-5">

      {/* ── Top Nav ── */}
      <div className="flex items-center gap-3">
        <Link to="/employees"
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:border-teal-300 hover:text-teal-600 transition-all duration-200"
          style={{ boxShadow:'0 1px 4px rgba(0,0,0,0.06)' }}>
          <MdArrowBack size={16}/> Back
        </Link>
        <div>
          <h2 className="text-lg font-black text-slate-800">Employee Details</h2>
          <p className="text-xs text-slate-400">Full profile &amp; history</p>
        </div>
      </div>

      {/* ── Hero Profile Card ── */}
      <div className="rounded-2xl overflow-hidden" style={{ boxShadow:'0 6px 32px rgba(0,0,0,0.12)' }}>
        {/* Dark banner */}
        <div className="h-32 relative"
          style={{ background:'linear-gradient(135deg,#0d1b2a 0%,#0f2840 50%,#0a2030 100%)' }}>
          <div className="absolute inset-0" style={{
            backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.035) 1px,transparent 1px)',
            backgroundSize:'22px 22px',
          }}/>
          <div className="absolute top-0 left-1/3 w-48 h-48 rounded-full pointer-events-none"
            style={{ background:'radial-gradient(circle,rgba(0,201,177,0.2) 0%,transparent 70%)' }}/>
          <div className="absolute top-0 right-1/4 w-32 h-32 rounded-full pointer-events-none"
            style={{ background:'radial-gradient(circle,rgba(99,102,241,0.12) 0%,transparent 70%)' }}/>
        </div>

        <div className="bg-white px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            {/* Avatar */}
            <div className="flex items-end gap-4 -mt-12">
              <div className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-4xl font-black ring-4 ring-white flex-shrink-0"
                style={{ background:'linear-gradient(135deg,#00c9b1,#0097a7)', boxShadow:'0 8px 24px rgba(0,201,177,0.5)' }}>
                {emp.full_name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="pb-1">
                <h2 className="text-xl font-black text-slate-800 leading-tight">{emp.full_name}</h2>
                <p className="text-sm font-semibold" style={{ color:'#00c9b1' }}>{emp.position || 'No Position'}</p>
                <p className="text-xs text-slate-400">{emp.department_name || 'No Department'}</p>
              </div>
            </div>
            {/* Action buttons */}
            <div className="sm:pb-2 flex gap-2">
              <button onClick={openEdit}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200"
                style={{ background:'rgba(99,102,241,0.1)', color:'#6366f1', border:'1px solid rgba(99,102,241,0.25)' }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(99,102,241,0.18)'; e.currentTarget.style.transform='translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background='rgba(99,102,241,0.1)'; e.currentTarget.style.transform=''; }}>
                <MdEdit size={15}/> Edit
              </button>
              <button onClick={() => setDeleteOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200"
                style={{ background:'rgba(239,68,68,0.08)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.2)' }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(239,68,68,0.16)'; e.currentTarget.style.transform='translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background='rgba(239,68,68,0.08)'; e.currentTarget.style.transform=''; }}>
                <MdDelete size={15}/> Delete
              </button>
            </div>
          </div>

          {/* Status + salary quick row */}
          <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-slate-100">
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</p>
              <div className="mt-1"><Badge status={emp.status}/></div>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Salary</p>
              <p className="text-base font-black mt-1 stat-number" style={{ color:'#00c9b1' }}>
                {emp.salary ? `$${Number(emp.salary).toLocaleString()}` : '—'}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Joined</p>
              <p className="text-sm font-bold text-slate-700 mt-1">{emp.joining_date || '—'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Info Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Contact & work info */}
        <div className="bg-white rounded-2xl p-5" style={{ boxShadow:'0 2px 16px rgba(0,0,0,0.06)', border:'1px solid rgba(0,0,0,0.05)' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background:'rgba(0,201,177,0.12)' }}>
              <MdPerson size={16} style={{ color:'#00c9b1' }}/>
            </div>
            <h3 className="font-bold text-slate-800">Employee Information</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <InfoCard icon={MdEmail}         label="Email"         value={emp.email}                           color="#6366f1" />
            <InfoCard icon={MdPhone}         label="Phone"         value={emp.phone}                           color="#10b981" />
            <InfoCard icon={MdBusiness}      label="Department"    value={emp.department_name}                 color="#00c9b1" />
            <InfoCard icon={MdWork}          label="Position"      value={emp.position}                        color="#f59e0b" />
            <InfoCard icon={MdCalendarToday} label="Joining Date"  value={emp.joining_date}                    color="#8b5cf6" />
            <InfoCard icon={MdAttachMoney}   label="Monthly Salary" value={emp.salary ? `$${Number(emp.salary).toLocaleString()}` : null} color="#00c9b1" />
          </div>
          {emp.address && (
            <div className="mt-2">
              <InfoCard icon={MdLocationOn} label="Address" value={emp.address} color="#ef4444" />
            </div>
          )}
        </div>

        {/* Attendance summary */}
        <div className="bg-white rounded-2xl p-5" style={{ boxShadow:'0 2px 16px rgba(0,0,0,0.06)', border:'1px solid rgba(0,0,0,0.05)' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background:'rgba(16,185,129,0.12)' }}>
              <MdAccessTime size={16} style={{ color:'#10b981' }}/>
            </div>
            <h3 className="font-bold text-slate-800">Recent Attendance</h3>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { icon:MdCheckCircle, label:'Present', key:'present',  color:'#10b981', bg:'rgba(16,185,129,0.08)'  },
              { icon:MdCancel,      label:'Absent',  key:'absent',   color:'#ef4444', bg:'rgba(239,68,68,0.08)'   },
              { icon:MdSchedule,    label:'Late',    key:'late',     color:'#f59e0b', bg:'rgba(245,158,11,0.08)'  },
            ].map(c => (
              <div key={c.key} className="rounded-xl p-2.5 text-center" style={{ background:c.bg }}>
                <c.icon size={16} style={{ color:c.color, margin:'0 auto 4px' }}/>
                <p className="text-lg font-black stat-number" style={{ color:c.color }}>{attStats[c.key]||0}</p>
                <p className="text-[9px] font-bold uppercase tracking-wide" style={{ color:c.color }}>{c.label}</p>
              </div>
            ))}
          </div>

          {attendance.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {attendance.map(a => (
                <div key={a.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl transition-all duration-150 group"
                  style={{ background:'rgba(248,250,252,0.8)' }}
                  onMouseEnter={e => { e.currentTarget.style.background='rgba(0,201,177,0.04)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background='rgba(248,250,252,0.8)'; }}>
                  <span className="text-sm text-slate-600 font-medium">{a.date}</span>
                  <div className="flex items-center gap-2">
                    {a.check_in && <span className="text-xs text-slate-400">{a.check_in}</span>}
                    <Badge status={a.status}/>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MdCalendarToday size={32} className="mx-auto text-slate-200 mb-2"/>
              <p className="text-sm text-slate-400">No attendance records yet</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Salary History ── */}
      <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow:'0 2px 16px rgba(0,0,0,0.06)', border:'1px solid rgba(0,0,0,0.05)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background:'rgba(0,201,177,0.12)' }}>
              <MdAttachMoney size={16} style={{ color:'#00c9b1' }}/>
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Salary History</h3>
              <p className="text-xs text-slate-400">Recent payroll records</p>
            </div>
          </div>
          {salaries.length > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background:'rgba(0,201,177,0.1)', color:'#00a896' }}>
              <MdTrendingUp size={12}/>
              ${salaries.reduce((s,r) => s+Number(r.net_salary||0),0).toLocaleString()} total
            </div>
          )}
        </div>

        {salaries.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background:'#0d1b2a' }}>
                  {['Period','Basic','Bonus','Deductions','Net Salary','Status'].map(h => (
                    <th key={h} className={`text-left text-[10px] font-black uppercase tracking-widest py-3.5 px-4 text-slate-400 ${h==='Bonus'||h==='Deductions'?'hidden sm:table-cell':''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {salaries.map((s, i) => (
                  <tr key={s.id}
                    className="border-b transition-colors duration-150"
                    style={{ background:i%2===0?'#fff':'rgba(248,250,252,0.8)', borderColor:'#f1f5f9' }}
                    onMouseEnter={e => { e.currentTarget.style.background='rgba(0,201,177,0.04)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background=i%2===0?'#fff':'rgba(248,250,252,0.8)'; }}>
                    <td className="py-3.5 px-4 font-semibold text-slate-700 text-sm">{MONTHS[s.month-1]} {s.year}</td>
                    <td className="py-3.5 px-4 text-slate-600 text-sm">${Number(s.basic_salary||0).toLocaleString()}</td>
                    <td className="py-3.5 px-4 hidden sm:table-cell text-sm font-semibold" style={{ color:'#10b981' }}>+${Number(s.bonus||0).toLocaleString()}</td>
                    <td className="py-3.5 px-4 hidden sm:table-cell text-sm font-semibold" style={{ color:'#ef4444' }}>-${Number(s.deductions||0).toLocaleString()}</td>
                    <td className="py-3.5 px-4">
                      <span className="text-base font-black stat-number" style={{ color:'#00c9b1' }}>${Number(s.net_salary||0).toLocaleString()}</span>
                    </td>
                    <td className="py-3.5 px-4"><Badge status={s.status}/></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <MdAttachMoney size={40} className="mx-auto text-slate-200 mb-2"/>
            <p className="text-sm text-slate-400">No salary records yet</p>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteOpen} onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete} loading={deleting}
        title="Delete Employee"
        message={`Delete "${emp.full_name}"? This action cannot be undone.`}
      />

      {/* Edit Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Employee" size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Full Name *</label>
              <input value={form.full_name} onChange={e => inp('full_name',e.target.value)} className="form-input" placeholder="John Smith" required />
            </div>
            <div>
              <label className="form-label">Email *</label>
              <input type="email" value={form.email} onChange={e => inp('email',e.target.value)} className="form-input" placeholder="john@example.com" required />
            </div>
            <div>
              <label className="form-label">Phone</label>
              <input value={form.phone} onChange={e => inp('phone',e.target.value)} className="form-input" placeholder="555-0101" />
            </div>
            <div>
              <label className="form-label">Department</label>
              <select value={form.department_id} onChange={e => inp('department_id',e.target.value)} className="form-input">
                <option value="">Select Department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.department_name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Position</label>
              <input value={form.position} onChange={e => inp('position',e.target.value)} className="form-input" placeholder="Senior Developer" />
            </div>
            <div>
              <label className="form-label">Joining Date</label>
              <input type="date" value={form.joining_date} onChange={e => inp('joining_date',e.target.value)} className="form-input" />
            </div>
            <div>
              <label className="form-label">Salary ($)</label>
              <input type="number" value={form.salary} onChange={e => inp('salary',e.target.value)} className="form-input" placeholder="50000" />
            </div>
            <div>
              <label className="form-label">Status</label>
              <select value={form.status} onChange={e => inp('status',e.target.value)} className="form-input">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Address</label>
              <textarea value={form.address} onChange={e => inp('address',e.target.value)} className="form-input" rows={2} placeholder="123 Main St, City, State" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setEditOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Saving...</> : 'Update Employee'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
