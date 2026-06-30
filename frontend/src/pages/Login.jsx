import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import api from '../services/api'
import {
  MdPerson, MdLock, MdEmail, MdVisibility, MdVisibilityOff,
  MdArrowForward, MdArrowBack, MdPhone, MdBusiness,
  MdAdminPanelSettings, MdBadge, MdCheckCircle,
  MdShield, MdGroups, MdInsights, MdAccountBalance,
} from 'react-icons/md'

/* ── Animated floating particle ── */
function Particle({ style }) {
  return <div className="absolute rounded-full pointer-events-none" style={style} />
}

/* ── Feature row item ── */
function Feature({ icon: Icon, title, desc }) {
  return (
    <div className="flex items-start gap-3 group">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
        style={{ background: 'rgba(0,201,177,0.15)', border: '1px solid rgba(0,201,177,0.3)' }}>
        <Icon size={16} style={{ color: '#00c9b1' }} />
      </div>
      <div>
        <p className="text-sm font-bold text-white leading-tight">{title}</p>
        <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

/* ── Metric pill ── */
function Metric({ val, label }) {
  return (
    <div className="text-center px-5 py-3 rounded-2xl flex-1"
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)' }}>
      <p className="text-2xl font-black text-white" style={{ fontVariantNumeric: 'tabular-nums' }}>{val}</p>
      <p className="text-[10px] text-slate-400 mt-0.5 font-semibold uppercase tracking-wider">{label}</p>
    </div>
  )
}

/* ── Password strength bar ── */
function StrengthBar({ password }) {
  if (!password) return null
  const score = [
    password.length >= 6,
    password.length >= 10,
    /[A-Z]/.test(password) || /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length
  const cfg = [
    { color: '#ef4444', label: 'Weak' },
    { color: '#f59e0b', label: 'Fair' },
    { color: '#10b981', label: 'Good' },
    { color: '#00c9b1', label: 'Strong' },
  ]
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1,2,3,4].map(i => (
          <div key={i} className="flex-1 h-1 rounded-full transition-all duration-400"
            style={{ background: score >= i ? cfg[score-1]?.color : '#e2e8f0' }} />
        ))}
      </div>
      {score > 0 && (
        <p className="text-[10px] font-bold" style={{ color: cfg[score-1]?.color }}>{cfg[score-1]?.label} password</p>
      )}
    </div>
  )
}

/* ── Floating label input ── */
function FloatInput({ label, icon: Icon, rightEl, type = 'text', value, onChange, placeholder, required, autoComplete }) {
  const [focused, setFocused] = useState(false)
  const active = focused || value?.length > 0
  return (
    <div className="relative">
      <div className={`relative rounded-xl overflow-hidden transition-all duration-200 ${
        focused ? 'ring-2' : 'ring-1'
      }`}
        style={{
          ringColor: focused ? '#00c9b1' : '#e2e8f0',
          boxShadow: focused ? '0 0 0 2px rgba(0,201,177,0.2)' : 'none',
          border: focused ? '1px solid #00c9b1' : '1px solid #e2e8f0',
          background: 'white',
        }}>
        <label
          className="absolute left-10 transition-all duration-200 pointer-events-none font-medium"
          style={{
            top: active ? '6px' : '50%',
            transform: active ? 'none' : 'translateY(-50%)',
            fontSize: active ? '9px' : '13px',
            color: focused ? '#00c9b1' : '#94a3b8',
            letterSpacing: active ? '0.05em' : 'normal',
            textTransform: active ? 'uppercase' : 'none',
          }}>
          {label}
        </label>
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
          <Icon size={16} style={{ color: focused ? '#00c9b1' : '#cbd5e1' }} />
        </div>
        <input
          type={type} value={value} onChange={onChange}
          placeholder={focused ? placeholder : ''}
          required={required}
          autoComplete={autoComplete}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className="w-full bg-transparent outline-none text-slate-800 text-sm"
          style={{
            padding: active ? '20px 40px 6px 40px' : '13px 40px 13px 40px',
            paddingRight: rightEl ? '44px' : '40px',
          }}
        />
        {rightEl && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightEl}</div>
        )}
      </div>
    </div>
  )
}

export default function Login() {
  const { login, employeeLogin } = useAuth()
  const navigate = useNavigate()

  const [screen, setScreen] = useState('signin')   // signin | register | forgot
  const [role, setRole]     = useState('admin')     // admin | employee
  const [loading, setLoading]     = useState(false)
  const [showPw, setShowPw]       = useState(false)
  const [showRegPw, setShowRegPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)

  const [signIn, setSignIn] = useState({ username: '', email: '', password: '' })
  const [reg, setReg]       = useState({ full_name: '', email: '', phone: '', position: '', password: '', confirm_password: '' })
  const [regLoading, setRegLoading] = useState(false)

  const [forgotEmail, setForgotEmail]   = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSent, setForgotSent]     = useState(false)
  const [resetToken, setResetToken]     = useState('')
  const [newPassword, setNewPassword]   = useState('')
  const [resetLoading, setResetLoading] = useState(false)

  // Particle positions (static, not animated to avoid hydration issues)
  const particles = [
    { width:180, height:180, top:'-5%', left:'-5%',  background:'radial-gradient(circle, rgba(0,201,177,0.18) 0%, transparent 70%)' },
    { width:220, height:220, top:'60%', right:'-8%',  background:'radial-gradient(circle, rgba(6,182,212,0.14) 0%, transparent 70%)' },
    { width:140, height:140, top:'30%', left:'20%',   background:'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)' },
    { width: 80, height: 80, top:'75%', left:'10%',   background:'radial-gradient(circle, rgba(0,201,177,0.2) 0%, transparent 70%)' },
    { width: 50, height: 50, top:'15%', right:'15%',  background:'rgba(0,201,177,0.12)', borderRadius:'50%', filter:'blur(2px)' },
    { width: 30, height: 30, top:'45%', right:'8%',   background:'rgba(99,102,241,0.15)', borderRadius:'50%', filter:'blur(1px)' },
  ]

  async function handleSignIn(e) {
    e.preventDefault()
    setLoading(true)
    try {
      if (role === 'admin') {
        if (!signIn.username || !signIn.password) { toast.error('Enter username and password'); return }
        await login(signIn.username, signIn.password)
        toast.success('Welcome back!')
        navigate('/')
      } else {
        if (!signIn.email || !signIn.password) { toast.error('Enter email and password'); return }
        const res = await api.post('/auth/employee/login', { email: signIn.email, password: signIn.password })
        const { token, employee } = res.data
        employeeLogin(employee, token)
        toast.success('Welcome back!')
        navigate('/')
      }
    } catch (err) {
      if (!err.response) toast.error('Cannot reach server — start the backend on port 5000')
      else toast.error(err.response?.data?.message || 'Invalid credentials')
    } finally { setLoading(false) }
  }

  async function handleRegister(e) {
    e.preventDefault()
    if (regLoading) return   // prevent double-submit
    if (!reg.full_name || !reg.email || !reg.password) { toast.error('Name, email and password required'); return }
    if (reg.password.length < 6) { toast.error('Password must be at least 6 characters'); return }
    if (reg.password !== reg.confirm_password) { toast.error('Passwords do not match'); return }
    setRegLoading(true)
    try {
      // Use the public registration endpoint — no admin token needed, password is saved
      await api.post('/employees/register', {
        full_name: reg.full_name,
        email:     reg.email,
        password:  reg.password,
        phone:     reg.phone,
        position:  reg.position,
      })
      toast.success('Account created! You can now sign in.')
      setScreen('signin')
      setRole('employee')
      setSignIn(p => ({ ...p, email: reg.email, password: '' }))
      setReg({ full_name: '', email: '', phone: '', position: '', password: '', confirm_password: '' })
    } catch (err) {
      const msg = err.response?.data?.message || ''
      if (!err.response) {
        toast.error('Cannot reach server — make sure backend is running')
      } else if (err.response?.status === 409) {
        toast.error('An account with this email already exists. Please sign in.')
      } else {
        toast.error(msg || 'Registration failed')
      }
    } finally { setRegLoading(false) }
  }

  async function handleForgot(e) {
    e.preventDefault()
    if (!forgotEmail) { toast.error('Enter your email'); return }
    setForgotLoading(true)
    try {
      const res = await api.post('/auth/forgot-password', { email: forgotEmail })
      if (res.data.reset_token) setResetToken(res.data.reset_token)
      setForgotSent(true)
      toast.success('Reset token generated')
    } catch { setForgotSent(true) }
    finally { setForgotLoading(false) }
  }

  async function handleReset(e) {
    e.preventDefault()
    if (!resetToken || !newPassword) { toast.error('Token and new password required'); return }
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return }
    setResetLoading(true)
    try {
      await api.post('/auth/reset-password', { token: resetToken, new_password: newPassword })
      toast.success('Password reset! Please sign in.')
      setScreen('signin'); setForgotSent(false); setResetToken(''); setNewPassword(''); setForgotEmail('')
    } catch (err) { toast.error(err.response?.data?.message || 'Reset failed. Token may be expired.') }
    finally { setResetLoading(false) }
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#eef2f7' }}>

      {/* ════════ LEFT PANEL ════════ */}
      <div className="hidden lg:flex flex-col w-[45%] xl:w-[42%] relative overflow-hidden"
        style={{ background: 'linear-gradient(155deg, #050d1a 0%, #091829 35%, #0b2030 65%, #081a1a 100%)' }}>

        {/* Particles */}
        {particles.map((p, i) => <Particle key={i} style={{ ...p, position: 'absolute', zIndex: 0 }} />)}

        {/* Dot grid overlay */}
        <div className="absolute inset-0 z-0" style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.035) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
        }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">

          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-black text-white text-xl relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #00c9b1, #0097a7)', boxShadow: '0 6px 24px rgba(0,201,177,0.5)' }}>
              E
              <div className="absolute inset-0 opacity-30"
                style={{ background: 'linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.3))' }} />
            </div>
            <div>
              <p className="font-extrabold text-white text-base tracking-tight leading-tight">EMS Portal</p>
              <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(0,201,177,0.6)' }}>
                Management System
              </p>
            </div>
          </div>

          {/* Main headline */}
          <div className="flex-1 flex flex-col justify-center space-y-8 my-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold"
                style={{ background: 'rgba(0,201,177,0.12)', border: '1px solid rgba(0,201,177,0.3)', color: '#00c9b1' }}>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                HR Management Platform v2.0
              </div>

              <div>
                {screen === 'signin' && (
                  <h1 className="text-4xl xl:text-5xl font-black text-white leading-[1.1] tracking-tight">
                    Manage your<br />
                    team{' '}
                    <span style={{
                      background: 'linear-gradient(90deg, #00c9b1, #22d3ee, #00c9b1)',
                      backgroundSize: '200% auto',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      animation: 'gradientShift 3s ease infinite',
                    }}>
                      smarter
                    </span>
                  </h1>
                )}
                {screen === 'register' && (
                  <h1 className="text-4xl xl:text-5xl font-black text-white leading-[1.1]">
                    Join your<br />
                    <span style={{ background: 'linear-gradient(90deg,#00c9b1,#22d3ee)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                      team today
                    </span>
                  </h1>
                )}
                {screen === 'forgot' && (
                  <h1 className="text-4xl xl:text-5xl font-black text-white leading-[1.1]">
                    Recover your<br />
                    <span style={{ background: 'linear-gradient(90deg,#00c9b1,#22d3ee)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
                      access fast
                    </span>
                  </h1>
                )}
              </div>
              <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                {screen === 'signin'   && 'All your HR operations in one place — attendance, payroll, departments, and analytics.'}
                {screen === 'register' && 'Create your employee account to access your personal dashboard and records.'}
                {screen === 'forgot'   && 'Reset your password securely and get back to managing your team.'}
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <Feature icon={MdGroups}       title="Employee Management"   desc="Profiles, departments & positions" />
              <Feature icon={MdInsights}     title="Analytics Dashboard"   desc="Real-time charts & workforce insights" />
              <Feature icon={MdAccountBalance} title="Payroll Processing"  desc="Salary, bonuses & deductions" />
              <Feature icon={MdShield}       title="Secure & Role-Based"   desc="JWT auth with admin & employee roles" />
            </div>
          </div>

          {/* Metrics */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Platform stats</p>
            <div className="flex gap-3">
              <Metric val="500+" label="Companies" />
              <Metric val="10k+" label="Employees" />
              <Metric val="99.9%" label="Uptime" />
            </div>
          </div>
        </div>
      </div>

      {/* ════════ RIGHT PANEL ════════ */}
      <div className="flex-1 flex items-center justify-center p-5 sm:p-8 overflow-y-auto">
        <div className="w-full max-w-[420px]">

          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-lg"
              style={{ background: 'linear-gradient(135deg,#00c9b1,#0097a7)', boxShadow: '0 4px 16px rgba(0,201,177,0.4)' }}>E</div>
            <div>
              <p className="font-extrabold text-slate-800">EMS Portal</p>
              <p className="text-xs text-slate-400">Employee Management System</p>
            </div>
          </div>

          {/* ════ SIGN IN ════ */}
          {screen === 'signin' && (
            <div className="animate-fade-in space-y-6">

              {/* Header */}
              <div>
                <h2 className="text-[28px] font-black text-slate-900 leading-tight">Welcome back</h2>
                <p className="text-slate-400 text-sm mt-1">Sign in to your dashboard</p>
              </div>

              {/* Role toggle */}
              <div className="flex p-1 rounded-2xl gap-1" style={{ background: '#dde4ee' }}>
                {[
                  { id: 'admin',    label: 'Admin',    icon: MdAdminPanelSettings },
                  { id: 'employee', label: 'Employee', icon: MdBadge },
                ].map(r => (
                  <button key={r.id} onClick={() => setRole(r.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-200"
                    style={role === r.id
                      ? { background: 'white', color: '#0d9488', boxShadow: '0 2px 12px rgba(0,0,0,0.1)' }
                      : { color: '#64748b' }}>
                    <r.icon size={16} /> {r.label}
                  </button>
                ))}
              </div>

              {/* Form card */}
              <div className="rounded-2xl p-7 bg-white" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.1)', border: '1px solid rgba(0,0,0,0.05)' }}>
                <form onSubmit={handleSignIn} className="space-y-5">
                  {role === 'admin' ? (
                    <FloatInput label="Username" icon={MdPerson} type="text"
                      value={signIn.username} onChange={e => setSignIn(p => ({...p, username: e.target.value}))}
                      placeholder="e.g. admin" required autoComplete="username" />
                  ) : (
                    <FloatInput label="Email Address" icon={MdEmail} type="email"
                      value={signIn.email} onChange={e => setSignIn(p => ({...p, email: e.target.value}))}
                      placeholder="john@company.com" required />
                  )}

                  <FloatInput label="Password" icon={MdLock}
                    type={showPw ? 'text' : 'password'}
                    value={signIn.password} onChange={e => setSignIn(p => ({...p, password: e.target.value}))}
                    placeholder="••••••••" required autoComplete="current-password"
                    rightEl={
                      <button type="button" onClick={() => setShowPw(p=>!p)}
                        className="text-slate-300 hover:text-slate-600 transition-colors">
                        {showPw ? <MdVisibilityOff size={17}/> : <MdVisibility size={17}/>}
                      </button>
                    }
                  />

                  <div className="flex justify-end -mt-2">
                    <button type="button" onClick={() => setScreen('forgot')}
                      className="text-xs font-bold transition-colors"
                      style={{ color: '#00c9b1' }}
                      onMouseEnter={e => e.target.style.color='#0097a7'}
                      onMouseLeave={e => e.target.style.color='#00c9b1'}>
                      Forgot password?
                    </button>
                  </div>

                  <button type="submit" disabled={loading}
                    className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-black text-white transition-all duration-200 relative overflow-hidden"
                    style={{
                      background: loading ? '#5eead4' : 'linear-gradient(135deg, #00c9b1, #0097a7)',
                      boxShadow: loading ? 'none' : '0 6px 22px rgba(0,201,177,0.45)',
                    }}
                    onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 10px 28px rgba(0,201,177,0.55)'; }}}
                    onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='0 6px 22px rgba(0,201,177,0.45)'; }}>
                    <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-200"
                      style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.1), transparent)' }} />
                    {loading
                      ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Signing in...</>
                      : <>Sign In <MdArrowForward size={17}/></>}
                  </button>
                </form>
              </div>

              {role === 'employee' && (
                <p className="text-center text-sm text-slate-500">
                  New here?{' '}
                  <button onClick={() => setScreen('register')}
                    className="font-bold transition-colors" style={{ color: '#00c9b1' }}
                    onMouseEnter={e => e.target.style.color='#0097a7'}
                    onMouseLeave={e => e.target.style.color='#00c9b1'}>
                    Create an account
                  </button>
                </p>
              )}
            </div>
          )}

          {/* ════ REGISTER ════ */}
          {screen === 'register' && (
            <div className="animate-fade-in space-y-6">
              <div className="flex items-center gap-3">
                <button onClick={() => setScreen('signin')}
                  className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-teal-600 transition-all hover:border-teal-300"
                  style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <MdArrowBack size={16}/>
                </button>
                <div>
                  <h2 className="text-[28px] font-black text-slate-900 leading-tight">Create Account</h2>
                  <p className="text-slate-400 text-sm">Register as an employee</p>
                </div>
              </div>

              <div className="rounded-2xl p-7 bg-white" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.1)', border: '1px solid rgba(0,0,0,0.05)' }}>
                <form onSubmit={handleRegister} className="space-y-4">
                  <FloatInput label="Full Name *" icon={MdPerson}
                    value={reg.full_name} onChange={e => setReg(p=>({...p,full_name:e.target.value}))}
                    placeholder="John Smith" required />
                  <FloatInput label="Email Address *" icon={MdEmail} type="email"
                    value={reg.email} onChange={e => setReg(p=>({...p,email:e.target.value}))}
                    placeholder="john@company.com" required />
                  <div className="grid grid-cols-2 gap-3">
                    <FloatInput label="Phone" icon={MdPhone}
                      value={reg.phone} onChange={e => setReg(p=>({...p,phone:e.target.value}))}
                      placeholder="555-0101" />
                    <FloatInput label="Position" icon={MdBusiness}
                      value={reg.position} onChange={e => setReg(p=>({...p,position:e.target.value}))}
                      placeholder="Developer" />
                  </div>
                  <div>
                    <FloatInput label="Password *" icon={MdLock}
                      type={showRegPw ? 'text' : 'password'}
                      value={reg.password} onChange={e => setReg(p=>({...p,password:e.target.value}))}
                      placeholder="Min 6 characters" required
                      rightEl={
                        <button type="button" onClick={() => setShowRegPw(p=>!p)}
                          className="text-slate-300 hover:text-slate-600 transition-colors">
                          {showRegPw ? <MdVisibilityOff size={16}/> : <MdVisibility size={16}/>}
                        </button>
                      }
                    />
                    <StrengthBar password={reg.password} />
                  </div>
                  <div>
                    <FloatInput label="Confirm Password *" icon={MdLock} type="password"
                      value={reg.confirm_password} onChange={e => setReg(p=>({...p,confirm_password:e.target.value}))}
                      placeholder="Repeat password" required />
                    {reg.confirm_password && (
                      <p className={`text-[10px] mt-1 font-bold flex items-center gap-1 ${reg.password === reg.confirm_password ? 'text-teal-500' : 'text-red-500'}`}>
                        {reg.password === reg.confirm_password
                          ? <><MdCheckCircle size={11}/>Passwords match</>
                          : "Passwords don't match"}
                      </p>
                    )}
                  </div>

                  <button type="submit" disabled={regLoading}
                    className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-black text-white transition-all duration-200"
                    style={{
                      background: regLoading ? '#5eead4' : 'linear-gradient(135deg,#00c9b1,#0097a7)',
                      boxShadow: regLoading ? 'none' : '0 6px 22px rgba(0,201,177,0.45)',
                      pointerEvents: regLoading ? 'none' : 'auto',
                      cursor: regLoading ? 'not-allowed' : 'pointer',
                    }}
                    onMouseEnter={e => { if (!regLoading) { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.boxShadow='0 10px 28px rgba(0,201,177,0.55)'; }}}
                    onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow= regLoading ? 'none' : '0 6px 22px rgba(0,201,177,0.45)'; }}>
                    {regLoading
                      ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Creating account...</>
                      : <>Create Account <MdArrowForward size={17}/></>}
                  </button>
                </form>
              </div>

              <p className="text-center text-sm text-slate-500">
                Already have an account?{' '}
                <button onClick={() => setScreen('signin')} className="font-bold" style={{ color: '#00c9b1' }}>Sign in</button>
              </p>
            </div>
          )}

          {/* ════ FORGOT PASSWORD ════ */}
          {screen === 'forgot' && (
            <div className="animate-fade-in space-y-6">
              <div className="flex items-center gap-3">
                <button onClick={() => { setScreen('signin'); setForgotSent(false); setForgotEmail(''); setResetToken(''); }}
                  className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-teal-600 transition-all"
                  style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <MdArrowBack size={16}/>
                </button>
                <div>
                  <h2 className="text-[28px] font-black text-slate-900 leading-tight">Reset Password</h2>
                  <p className="text-slate-400 text-sm">We'll generate a secure reset token</p>
                </div>
              </div>

              <div className="rounded-2xl p-7 bg-white" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.1)', border: '1px solid rgba(0,0,0,0.05)' }}>
                {!forgotSent ? (
                  <form onSubmit={handleForgot} className="space-y-5">
                    <div className="text-center mb-2">
                      <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-3"
                        style={{ background: 'linear-gradient(135deg, rgba(0,201,177,0.12), rgba(0,151,167,0.12))', border: '1px solid rgba(0,201,177,0.2)' }}>
                        <MdEmail size={30} style={{ color: '#00c9b1' }} />
                      </div>
                      <p className="text-sm text-slate-500">Enter your registered email to receive reset instructions.</p>
                    </div>
                    <FloatInput label="Registered Email" icon={MdEmail} type="email"
                      value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                      placeholder="your@email.com" required />
                    <button type="submit" disabled={forgotLoading}
                      className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-black text-white transition-all duration-200"
                      style={{ background: 'linear-gradient(135deg,#00c9b1,#0097a7)', boxShadow: '0 6px 22px rgba(0,201,177,0.45)' }}>
                      {forgotLoading
                        ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Sending...</>
                        : <>Send Reset Link <MdArrowForward size={17}/></>}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleReset} className="space-y-4">
                    <div className="flex items-start gap-3 p-3.5 rounded-xl"
                      style={{ background: 'rgba(0,201,177,0.07)', border: '1px solid rgba(0,201,177,0.2)' }}>
                      <MdCheckCircle size={18} style={{ color: '#00c9b1', flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <p className="text-xs font-bold text-slate-700">Token generated!</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Paste the token below to set a new password for <b>{forgotEmail}</b></p>
                      </div>
                    </div>
                    <FloatInput label="Reset Token" icon={MdLock}
                      value={resetToken} onChange={e => setResetToken(e.target.value)}
                      placeholder="Paste token here" required />
                    <div>
                      <FloatInput label="New Password" icon={MdLock}
                        type={showNewPw ? 'text' : 'password'}
                        value={newPassword} onChange={e => setNewPassword(e.target.value)}
                        placeholder="Min 6 characters" required
                        rightEl={
                          <button type="button" onClick={() => setShowNewPw(p=>!p)}
                            className="text-slate-300 hover:text-slate-600 transition-colors">
                            {showNewPw ? <MdVisibilityOff size={16}/> : <MdVisibility size={16}/>}
                          </button>
                        }
                      />
                      <StrengthBar password={newPassword} />
                    </div>
                    <button type="submit" disabled={resetLoading}
                      className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl text-sm font-black text-white transition-all duration-200"
                      style={{ background: 'linear-gradient(135deg,#00c9b1,#0097a7)', boxShadow: '0 6px 22px rgba(0,201,177,0.45)' }}>
                      {resetLoading
                        ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Resetting...</>
                        : <>Reset Password <MdArrowForward size={17}/></>}
                    </button>
                    <button type="button" onClick={() => { setForgotSent(false); setResetToken(''); }}
                      className="w-full text-xs text-slate-400 hover:text-slate-600 transition-colors py-1">
                      ← Use a different email
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
