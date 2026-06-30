import React, { useState } from 'react'
import {
  MdPerson, MdEmail, MdLock, MdEdit, MdSave, MdVisibility, MdVisibilityOff,
  MdBadge, MdCalendarToday, MdShield, MdCode, MdStorage, MdKey, MdClose,
} from 'react-icons/md'
import toast from 'react-hot-toast'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const TEAL = '#00c9b1'
const TEAL_DARK = '#0097a7'

function SectionHeader({ icon: Icon, title, color = TEAL }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ background: `${color}18`, border: `1px solid ${color}35` }}>
        <Icon size={17} style={{ color }} />
      </div>
      <h3 className="font-bold text-slate-800">{title}</h3>
    </div>
  )
}

function InfoField({ label, value, disabled, type = 'text', icon: Icon, onChange }) {
  return (
    <div>
      <label className="form-label">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />}
        <input
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`form-input ${Icon ? 'pl-10' : ''} transition-all duration-200 ${
            disabled ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : 'bg-white'
          }`}
        />
      </div>
    </div>
  )
}

export default function Profile() {
  const { admin, updateAdmin } = useAuth()

  const [profileForm, setProfileForm] = useState({
    full_name: admin?.full_name || '',
    email:     admin?.email     || '',
  })
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileEdit,   setProfileEdit]   = useState(false)

  const [pwForm,   setPwForm]   = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [showPw,   setShowPw]   = useState({ current: false, new: false, confirm: false })

  async function handleProfileSave(e) {
    e.preventDefault()
    if (!profileForm.full_name) { toast.error('Name is required'); return }
    setProfileSaving(true)
    try {
      await api.put('/auth/profile', profileForm)
      updateAdmin(profileForm)
      toast.success('Profile updated')
      setProfileEdit(false)
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed') }
    finally { setProfileSaving(false) }
  }

  async function handlePasswordChange(e) {
    e.preventDefault()
    if (!pwForm.current_password || !pwForm.new_password) { toast.error('All fields required'); return }
    if (pwForm.new_password.length < 6) { toast.error('Min 6 characters'); return }
    if (pwForm.new_password !== pwForm.confirm_password) { toast.error("Passwords don't match"); return }
    setPwSaving(true)
    try {
      const endpoint = admin?.role === 'employee' ? '/auth/employee/change-password' : '/auth/change-password'
      await api.post(endpoint, { current_password: pwForm.current_password, new_password: pwForm.new_password })
      toast.success('Password changed')
      setPwForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setPwSaving(false) }
  }

  function toggleShow(f) { setShowPw(p => ({ ...p, [f]: !p[f] })) }

  const isEmployee = admin?.role === 'employee'
  const initial = admin?.full_name?.charAt(0)?.toUpperCase() || 'A'

  // Password strength
  const pwScore = [
    pwForm.new_password.length >= 6,
    pwForm.new_password.length >= 10,
    /[A-Z]/.test(pwForm.new_password) || /[0-9]/.test(pwForm.new_password),
    /[^A-Za-z0-9]/.test(pwForm.new_password),
  ].filter(Boolean).length
  const pwColors = ['', '#ef4444', '#f59e0b', '#10b981', '#00c9b1']

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* ── Hero Profile Card ── */}
      <div className="rounded-2xl overflow-hidden" style={{ boxShadow: '0 4px 30px rgba(0,0,0,0.1)' }}>
        {/* Banner */}
        <div className="h-28 relative"
          style={{ background: 'linear-gradient(135deg, #0d1b2a 0%, #0f2840 50%, #0a2030 100%)' }}>
          {/* Dot grid */}
          <div className="absolute inset-0"
            style={{ backgroundImage:'radial-gradient(circle,rgba(255,255,255,0.04) 1px,transparent 1px)', backgroundSize:'20px 20px' }} />
          {/* Glow */}
          <div className="absolute top-0 left-1/4 w-40 h-40 rounded-full pointer-events-none"
            style={{ background:'radial-gradient(circle, rgba(0,201,177,0.2) 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 right-1/4 w-32 h-32 rounded-full pointer-events-none"
            style={{ background:'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }} />
        </div>

        {/* Avatar + info */}
        <div className="bg-white px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="flex items-end gap-4 -mt-10">
              {/* Avatar */}
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-black ring-4 ring-white"
                  style={{ background:'linear-gradient(135deg,#00c9b1,#0097a7)', boxShadow:'0 6px 20px rgba(0,201,177,0.4)' }}>
                  {initial}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white"
                  style={{ background:'#10b981', boxShadow:'0 0 6px rgba(16,185,129,0.6)' }} />
              </div>
              <div className="pb-1">
                <h2 className="text-xl font-black text-slate-800 leading-tight">{admin?.full_name || 'User'}</h2>
                <p className="text-sm text-slate-400">{admin?.email || ''}</p>
              </div>
            </div>
            <div className="sm:pb-2">
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold"
                style={{
                  background: isEmployee ? 'rgba(99,102,241,0.1)' : 'rgba(0,201,177,0.1)',
                  color:      isEmployee ? '#6366f1' : '#00a896',
                  border:     isEmployee ? '1px solid rgba(99,102,241,0.25)' : '1px solid rgba(0,201,177,0.25)',
                }}>
                {isEmployee ? <MdBadge size={13}/> : <MdShield size={13}/>}
                {isEmployee ? 'Employee' : 'System Administrator'}
              </span>
            </div>
          </div>

          {/* Quick stat row */}
          <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-slate-100">
            {[
              { label: 'Role',     value: isEmployee ? 'Employee' : 'Admin' },
              { label: 'Username', value: admin?.username || admin?.email?.split('@')[0] || '—' },
              { label: 'Status',   value: 'Active', color: '#10b981' },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                <p className="text-sm font-bold mt-0.5" style={{ color: s.color || '#1e293b' }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Edit Profile ── */}
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow:'0 2px 16px rgba(0,0,0,0.06)', border:'1px solid rgba(0,0,0,0.05)' }}>
        <div className="flex items-center justify-between mb-5">
          <SectionHeader icon={MdPerson} title="Profile Information" />
          {!profileEdit
            ? <button onClick={() => setProfileEdit(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all duration-200"
                style={{ background:'rgba(0,201,177,0.08)', color:'#00a896', border:'1px solid rgba(0,201,177,0.2)' }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(0,201,177,0.16)'; }}
                onMouseLeave={e => { e.currentTarget.style.background='rgba(0,201,177,0.08)'; }}>
                <MdEdit size={14}/> Edit Profile
              </button>
            : <button onClick={() => { setProfileEdit(false); setProfileForm({ full_name: admin?.full_name||'', email: admin?.email||'' }); }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
                style={{ background:'rgba(239,68,68,0.08)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.2)' }}>
                <MdClose size={14}/> Cancel
              </button>
          }
        </div>

        <form onSubmit={handleProfileSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoField label="Full Name" value={profileForm.full_name} icon={MdPerson}
              disabled={!profileEdit}
              onChange={e => setProfileForm(p => ({...p, full_name: e.target.value}))} />
            <InfoField label="Email Address" type="email" value={profileForm.email} icon={MdEmail}
              disabled={!profileEdit}
              onChange={e => setProfileForm(p => ({...p, email: e.target.value}))} />
          </div>
          {!isEmployee && (
            <div>
              <label className="form-label">Username</label>
              <div className="relative">
                <MdBadge className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                <input value={admin?.username || ''} disabled
                  className="form-input pl-10 bg-slate-50 text-slate-400 cursor-not-allowed" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                <MdShield size={10}/> Username cannot be changed
              </p>
            </div>
          )}

          {profileEdit && (
            <div className="flex justify-end pt-2">
              <button type="submit" disabled={profileSaving}
                className="btn-primary flex items-center gap-2 px-6"
                style={{ background:'linear-gradient(135deg,#00c9b1,#0097a7)', boxShadow:'0 4px 14px rgba(0,201,177,0.35)' }}>
                {profileSaving
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Saving...</>
                  : <><MdSave size={16}/>Save Changes</>}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* ── Change Password ── */}
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow:'0 2px 16px rgba(0,0,0,0.06)', border:'1px solid rgba(0,0,0,0.05)' }}>
        <SectionHeader icon={MdLock} title="Security & Password" color="#6366f1" />

        <form onSubmit={handlePasswordChange} className="space-y-4">
          {[
            { field:'current', label:'Current Password',     key:'current_password' },
            { field:'new',     label:'New Password',          key:'new_password' },
            { field:'confirm', label:'Confirm New Password',  key:'confirm_password' },
          ].map(({ field, label, key }) => (
            <div key={key}>
              <label className="form-label">{label}</label>
              <div className="relative">
                <MdLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16}/>
                <input
                  type={showPw[field] ? 'text' : 'password'}
                  value={pwForm[key]}
                  onChange={e => setPwForm(p => ({...p, [key]: e.target.value}))}
                  className="form-input pl-10 pr-11"
                  placeholder={`Enter ${label.toLowerCase()}`}
                />
                <button type="button" onClick={() => toggleShow(field)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors">
                  {showPw[field] ? <MdVisibilityOff size={17}/> : <MdVisibility size={17}/>}
                </button>
              </div>
              {/* Strength bar for new password */}
              {key === 'new_password' && pwForm.new_password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="flex-1 h-1.5 rounded-full transition-all duration-300"
                        style={{ background: pwScore >= i ? pwColors[pwScore] : '#e2e8f0' }}/>
                    ))}
                  </div>
                  <p className="text-[10px] font-bold" style={{ color: pwColors[pwScore] }}>
                    {['','Weak','Fair','Good','Strong'][pwScore]} password
                  </p>
                </div>
              )}
            </div>
          ))}

          <button type="submit" disabled={pwSaving}
            className="w-full btn-primary justify-center py-3"
            style={{ background:'linear-gradient(135deg,#6366f1,#4f46e5)', boxShadow:'0 4px 14px rgba(99,102,241,0.35)' }}>
            {pwSaving
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Updating...</>
              : <><MdKey size={16}/>Update Password</>}
          </button>
        </form>
      </div>

      {/* ── System Info ── */}
      <div className="rounded-2xl p-6" style={{ background:'linear-gradient(135deg,#0d1b2a,#0f2840)', boxShadow:'0 4px 24px rgba(0,0,0,0.2)' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background:'rgba(0,201,177,0.15)' }}>
            <MdCode size={16} style={{ color:'#00c9b1' }}/>
          </div>
          <h3 className="font-bold text-white text-sm">System Information</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { icon: MdCode,            label: 'Application', value: 'EMS v1.0.0' },
            { icon: MdCode,            label: 'Frontend',    value: 'React + Tailwind' },
            { icon: MdCode,            label: 'Backend',     value: 'Python Flask' },
            { icon: MdStorage,         label: 'Database',    value: 'MySQL 8.0' },
            { icon: MdShield,          label: 'Auth',        value: 'JWT Token' },
            { icon: MdCalendarToday,   label: 'Session',     value: '24h expiry' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-xl p-3"
              style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-1.5 mb-1">
                <Icon size={11} style={{ color:'rgba(0,201,177,0.6)' }}/>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</span>
              </div>
              <p className="text-xs font-bold text-slate-300">{value}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
