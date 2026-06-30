import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  MdPeople, MdBusiness, MdAccessTime, MdAttachMoney,
  MdArrowForward, MdCheckCircle, MdCancel, MdSchedule,
  MdTrendingUp, MdArrowUpward, MdWork, MdBarChart,
  MdStars, MdGroups,
} from 'react-icons/md'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
  AreaChart, Area, LineChart, Line,
} from 'recharts'
import api from '../services/api'
import StatCard from '../components/StatCard'
import Spinner from '../components/Spinner'
import { useAuth } from '../context/AuthContext'

const TEAL_COLORS = ['#00c9b1', '#0097a7', '#0d9488', '#22d3ee', '#6366f1', '#a855f7']

const CustomBarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2 text-xs shadow-xl"
      style={{ background: '#0d1b2a', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
      <p className="font-semibold text-slate-300">{label}</p>
      <p className="mt-0.5 font-bold" style={{ color: '#00c9b1' }}>{payload[0]?.value} employees</p>
    </div>
  )
}

const CustomAreaTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl px-3 py-2 text-xs shadow-xl"
      style={{ background: '#0d1b2a', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
      <p className="font-semibold text-slate-300">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="mt-0.5" style={{ color: p.color }}>{p.name}: <b>{p.value}</b></p>
      ))}
    </div>
  )
}

// Mock monthly trend data
const monthlyData = [
  { month: 'Jan', present: 72, absent: 8, late: 4 },
  { month: 'Feb', present: 68, absent: 11, late: 5 },
  { month: 'Mar', present: 78, absent: 6, late: 3 },
  { month: 'Apr', present: 74, absent: 9, late: 6 },
  { month: 'May', present: 80, absent: 5, late: 2 },
  { month: 'Jun', present: 76, absent: 7, late: 4 },
]

export default function Dashboard() {
  const { admin } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/employees/dashboard')
      .then(r => setStats(r.data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner center />

  const deptChartData = stats?.department_stats?.map(d => ({
    name: d.department_name.length > 8 ? d.department_name.split(' ')[0] : d.department_name,
    employees: d.count,
  })) || []

  const pieData = stats?.department_stats?.map(d => ({
    name: d.department_name,
    value: d.count,
  })).filter(d => d.value > 0) || []

  const presentToday  = stats?.present_today  || 0
  const absentToday   = stats?.absent_today   || 0
  const lateToday     = stats?.late_today     || 0
  const totalEmps     = stats?.total_employees || 0
  const attendanceRate = totalEmps > 0 ? Math.round((presentToday / totalEmps) * 100) : 0
  const monthlyPayroll = stats?.monthly_salary || 0

  return (
    <div className="space-y-6">

      {/* ── Hero Banner ── */}
      <div className="hero-card relative overflow-hidden p-6 md:p-8">
        {/* Background accents */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(0,201,177,0.12) 0%, transparent 70%)' }} />
          <div className="absolute bottom-0 right-1/4 w-48 h-48 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)' }} />
          {/* Decorative grid */}
          <svg className="absolute top-0 right-0 h-full opacity-5" viewBox="0 0 200 200" fill="none">
            {[0,40,80,120,160,200].map(x => (
              <line key={x} x1={x} y1="0" x2={x} y2="200" stroke="white" strokeWidth="1"/>
            ))}
            {[0,40,80,120,160,200].map(y => (
              <line key={y} x1="0" y1={y} x2="200" y2={y} stroke="white" strokeWidth="1"/>
            ))}
          </svg>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
          {/* Left: greeting + payroll */}
          <div className="flex-1 space-y-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(0,201,177,0.7)' }}>
                Welcome back
              </p>
              <h1 className="text-2xl md:text-3xl font-black text-white mt-1 leading-tight">
                {admin?.full_name?.split(' ')[0] || 'Admin'} 👋
              </h1>
              <p className="text-slate-400 text-sm mt-1 max-w-sm">
                Here's what's happening with your team today. Track attendance, payroll, and more.
              </p>
            </div>

            {/* Big payroll number */}
            <div>
              <p className="text-xs text-slate-500 font-medium">Monthly Payroll</p>
              <p className="text-4xl md:text-5xl font-black text-white stat-number mt-1">
                ${monthlyPayroll.toLocaleString()}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(0,201,177,0.15)', color: '#00c9b1' }}>
                  <MdArrowUpward size={12} /> On track
                </span>
                <span className="text-xs text-slate-500">for this month</span>
              </div>
            </div>

            {/* Hero mini stats */}
            <div className="grid grid-cols-3 gap-3 max-w-xs">
              {[
                { val: totalEmps, label: 'Total Staff' },
                { val: stats?.total_departments || 0, label: 'Departments' },
                { val: `${attendanceRate}%`, label: 'Attendance' },
              ].map(s => (
                <div key={s.label} className="hero-stat">
                  <p className="text-base font-black text-white stat-number">{s.val}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: decorative chart */}
          <div className="hidden md:block w-64 h-48 flex-shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00c9b1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00c9b1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="present" stroke="#00c9b1" strokeWidth={2.5}
                  fill="url(#heroGrad)" dot={false} />
                <Tooltip content={<CustomAreaTooltip />} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Stat Cards Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Employees"
          value={totalEmps}
          icon={MdPeople}
          color="teal"
          sub="Active members"
          trend={5}
          mini
        />
        <StatCard
          label="Departments"
          value={stats?.total_departments || 0}
          icon={MdBusiness}
          color="purple"
          sub="Teams active"
          mini
        />
        <StatCard
          label="Present Today"
          value={presentToday}
          icon={MdCheckCircle}
          color="green"
          sub="Clocked in"
          trend={attendanceRate > 0 ? attendanceRate : undefined}
          mini
        />
        <StatCard
          label="Monthly Payroll"
          value={`$${(monthlyPayroll / 1000).toFixed(1)}k`}
          icon={MdAttachMoney}
          color="orange"
          sub="Paid this month"
          mini
        />
      </div>

      {/* ── Attendance Quick Stats ── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: MdCheckCircle, color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', label: 'Present', val: presentToday, pct: totalEmps > 0 ? Math.round((presentToday/totalEmps)*100) : 0 },
          { icon: MdCancel,      color: '#ef4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.2)',  label: 'Absent',  val: absentToday,  pct: totalEmps > 0 ? Math.round((absentToday/totalEmps)*100) : 0 },
          { icon: MdSchedule,    color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', label: 'Late',    val: lateToday,    pct: totalEmps > 0 ? Math.round((lateToday/totalEmps)*100) : 0 },
        ].map(({ icon: I, color, bg, border, label, val, pct }) => (
          <div key={label} className="bg-white rounded-2xl p-4"
            style={{ border: `1px solid ${border}`, background: bg, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${color}20` }}>
                <I size={20} style={{ color }} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold">{label}</p>
                <p className="text-2xl font-black stat-number leading-none mt-0.5" style={{ color }}>{val}</p>
              </div>
            </div>
            <div className="mt-3">
              <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                <span>Rate</span><span className="font-bold" style={{ color }}>{pct}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(0,0,0,0.08)' }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Bar chart — Employees by Dept */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Employees by Department</h2>
              <p className="text-xs text-slate-400 mt-0.5">Headcount distribution</p>
            </div>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(0,201,177,0.1)' }}>
              <MdBarChart size={16} style={{ color: '#00c9b1' }} />
            </div>
          </div>
          {deptChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptChartData} barSize={32} barGap={8}>
                <defs>
                  {TEAL_COLORS.map((c, i) => (
                    <linearGradient key={i} id={`barGrad${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={c} stopOpacity={1} />
                      <stop offset="100%" stopColor={c} stopOpacity={0.65} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false} tickLine={false}
                  width={30}
                />
                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'rgba(0,201,177,0.05)', radius: 8 }} />
                <Bar dataKey="employees" radius={[8, 8, 0, 0]}>
                  {deptChartData.map((_, i) => (
                    <Cell key={i} fill={`url(#barGrad${i % TEAL_COLORS.length})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-52 text-slate-300 text-sm">No department data</div>
          )}
        </div>

        {/* Pie chart — Distribution */}
        <div className="card p-5">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-800">Team Distribution</h2>
            <p className="text-xs text-slate-400 mt-0.5">By department</p>
          </div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="45%"
                  innerRadius={52} outerRadius={78}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={TEAL_COLORS[i % TEAL_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)',
                    background: '#0d1b2a', color: '#fff', fontSize: 12,
                  }}
                />
                <Legend
                  iconType="circle"
                  iconSize={7}
                  wrapperStyle={{ fontSize: 11, color: '#64748b' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-52 text-slate-300 text-sm">No data</div>
          )}
        </div>
      </div>

      {/* ── Monthly Attendance Trend + Recent Employees ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Monthly area chart */}
        <div className="card p-5 lg:col-span-3">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Attendance Trend</h2>
              <p className="text-xs text-slate-400 mt-0.5">Last 6 months overview</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full"
              style={{ background: 'rgba(0,201,177,0.1)', color: '#00c9b1' }}>
              {monthlyData.length} months
            </span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00c9b1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#00c9b1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="absentGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0d1b2a" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0d1b2a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={28} />
              <Tooltip content={<CustomAreaTooltip />} />
              <Area type="monotone" dataKey="present" name="Present" stroke="#00c9b1" strokeWidth={2.5}
                fill="url(#presentGrad)" dot={{ r: 3, fill: '#00c9b1' }} />
              <Area type="monotone" dataKey="absent" name="Absent" stroke="#0d1b2a" strokeWidth={2}
                fill="url(#absentGrad)" dot={{ r: 3, fill: '#0d1b2a' }} />
              <Legend iconType="circle" iconSize={7} wrapperStyle={{ fontSize: 11, color: '#64748b' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top performers sidebar */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Recent Employees</h2>
              <p className="text-xs text-slate-400 mt-0.5">Latest additions</p>
            </div>
            <Link to="/employees" className="flex items-center gap-1 text-xs font-bold"
              style={{ color: '#00c9b1' }}>
              View all <MdArrowForward size={13} />
            </Link>
          </div>
          <div className="space-y-3">
            {stats?.recent_employees?.slice(0, 5).map((emp, i) => (
              <div key={i}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => window.location.href = `/employees/${emp.id}`}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${TEAL_COLORS[i % TEAL_COLORS.length]}, ${TEAL_COLORS[(i+1) % TEAL_COLORS.length]})` }}
                >
                  {emp.full_name?.charAt(0)?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{emp.full_name}</p>
                  <p className="text-xs text-slate-400 truncate">{emp.position || emp.department_name || 'Employee'}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: 'rgba(0,201,177,0.1)', color: '#00a896' }}>
                  {emp.status || 'active'}
                </span>
              </div>
            ))}
            {(!stats?.recent_employees || stats.recent_employees.length === 0) && (
              <div className="text-center py-8 text-slate-300 text-sm">No employees yet</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Quick Info Footer ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Quick links card */}
        <div className="card-navy p-5 md:col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(0,201,177,0.15)' }}>
              <MdStars size={16} style={{ color: '#00c9b1' }} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Quick Actions</p>
              <p className="text-[10px] text-slate-500">Shortcuts</p>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Add Employee', to: '/employees', icon: MdPeople },
              { label: 'Mark Attendance', to: '/attendance', icon: MdAccessTime },
              { label: 'Process Salary', to: '/salary', icon: MdAttachMoney },
              { label: 'Departments', to: '/departments', icon: MdBusiness },
            ].map(({ label, to, icon: I }) => (
              <Link key={to} to={to}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group"
                style={{ color: '#8892a4' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'white' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8892a4' }}
              >
                <I size={16} className="flex-shrink-0" />
                <span>{label}</span>
                <MdArrowForward size={13} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#00c9b1' }} />
              </Link>
            ))}
          </div>
        </div>

        {/* Attendance summary */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Today's Summary</h2>
              <p className="text-xs text-slate-400 mt-0.5">Attendance breakdown</p>
            </div>
            <span className="text-lg font-black stat-number" style={{ color: '#00c9b1' }}>{attendanceRate}%</span>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Present', val: presentToday, total: totalEmps, color: '#10b981' },
              { label: 'Late',    val: lateToday,    total: totalEmps, color: '#f59e0b' },
              { label: 'Absent',  val: absentToday,  total: totalEmps, color: '#ef4444' },
            ].map(({ label, val, total, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-600 font-medium">{label}</span>
                  <span className="font-bold text-slate-700">{val}<span className="text-slate-300">/{total}</span></span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: total > 0 ? `${(val/total)*100}%` : '0%', background: color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3" style={{ borderTop: '1px solid #f1f5f9' }}>
            <p className="text-xs text-slate-400">Total workforce: <span className="font-bold text-slate-600">{totalEmps}</span></p>
          </div>
        </div>

        {/* Team stat */}
        <div className="card p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #00c9b1, #0097a7)', boxShadow: '0 4px 12px rgba(0,201,177,0.3)' }}>
              <MdGroups size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">Team Overview</p>
              <p className="text-xs text-slate-400">By department size</p>
            </div>
          </div>
          <div className="space-y-2.5">
            {(stats?.department_stats || []).slice(0, 4).map((d, i) => {
              const pct = totalEmps > 0 ? Math.round((d.count / totalEmps) * 100) : 0
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 font-medium truncate mr-2">{d.department_name}</span>
                    <span className="font-bold text-slate-700 flex-shrink-0">{d.count} <span className="text-slate-300 font-normal">({pct}%)</span></span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: TEAL_COLORS[i % TEAL_COLORS.length] }}
                    />
                  </div>
                </div>
              )
            })}
            {(!stats?.department_stats || stats.department_stats.length === 0) && (
              <p className="text-slate-300 text-sm text-center py-4">No departments</p>
            )}
          </div>
          <div className="mt-4 pt-3" style={{ borderTop: '1px solid #f1f5f9' }}>
            <Link to="/departments" className="flex items-center gap-1 text-xs font-bold" style={{ color: '#00c9b1' }}>
              Manage departments <MdArrowForward size={13} />
            </Link>
          </div>
        </div>
      </div>

    </div>
  )
}
