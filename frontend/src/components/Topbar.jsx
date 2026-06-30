import React, { useState, useEffect, useRef } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import {
  MdMenu, MdSearch, MdNotifications, MdClose,
  MdDashboard, MdPeople, MdBusiness, MdAccessTime, MdAttachMoney, MdPerson,
  MdLogout, MdSettings,
} from 'react-icons/md'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const pages = {
  '/':            { title: 'Dashboard',    sub: 'Overview & analytics' },
  '/employees':   { title: 'Employees',    sub: 'Manage team members' },
  '/departments': { title: 'Departments',  sub: 'Organisational units' },
  '/attendance':  { title: 'Attendance',   sub: 'Track daily presence' },
  '/salary':      { title: 'Salary',       sub: 'Payroll & compensation' },
  '/profile':     { title: 'My Profile',   sub: 'Account & settings' },
}

export default function Topbar({ onMenuClick }) {
  const { pathname } = useLocation()
  const { admin, logout } = useAuth()
  const navigate = useNavigate()
  const [time, setTime] = useState(new Date())
  const [dropOpen, setDropOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const dropRef = useRef(null)

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e) {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setDropOpen(false)
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  let page = pages[pathname]
  if (!page) {
    if (/^\/employees\/\d+/.test(pathname)) page = { title: 'Employee Details', sub: 'Full profile view' }
    else page = { title: 'EMS', sub: '' }
  }

  const dateStr = time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  function handleLogout() {
    logout()
    toast.success('Logged out')
    navigate('/login')
  }

  return (
    <header
      className="bg-white/95 backdrop-blur-md px-4 md:px-6 py-3 flex items-center justify-between sticky top-0 z-10"
      style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 12px rgba(0,0,0,0.06)' }}
    >
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <MdMenu size={20} />
        </button>
        <div>
          <h1 className="text-base font-extrabold text-slate-800 leading-tight">{page.title}</h1>
          <p className="text-[11px] text-slate-400 hidden sm:block font-medium">{page.sub}</p>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2" ref={dropRef}>

        {/* Search */}
        <div className="hidden md:flex items-center gap-2 rounded-xl px-3 py-2 cursor-pointer hover:bg-slate-100 transition-colors"
          style={{ background: '#f4f6fb', border: '1px solid #e2e8f0' }}>
          <MdSearch size={15} className="text-slate-400" />
          <span className="text-xs text-slate-400 font-medium w-24">Search...</span>
        </div>

        {/* Date/time */}
        <div className="hidden lg:flex items-center gap-1.5 rounded-xl px-3 py-1.5"
          style={{ background: '#f4f6fb', border: '1px solid #e2e8f0' }}>
          <span className="text-xs text-slate-500">{dateStr}</span>
          <span className="text-slate-300">·</span>
          <span className="text-xs font-bold" style={{ color: '#00c9b1' }}>{timeStr}</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setNotifOpen(p => !p); setDropOpen(false) }}
            className="relative w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-teal-600 transition-colors"
            style={{ background: '#f4f6fb', border: '1px solid #e2e8f0' }}
          >
            <MdNotifications size={18} />
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
              style={{ background: '#00c9b1', boxShadow: '0 0 6px rgba(0,201,177,0.7)' }}
            />
          </button>
          {notifOpen && (
            <div
              className="absolute right-0 top-12 w-72 rounded-2xl z-50 overflow-hidden animate-fade-in"
              style={{ background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 8px 40px rgba(0,0,0,0.14)' }}
            >
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
                <p className="text-sm font-bold text-slate-800">Notifications</p>
                <button onClick={() => setNotifOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <MdClose size={16} />
                </button>
              </div>
              {[
                { title: 'New employee added', sub: '2 min ago', dot: '#00c9b1' },
                { title: 'Attendance report ready', sub: '1 hr ago', dot: '#f59e0b' },
                { title: 'Payroll processed', sub: 'Yesterday', dot: '#6366f1' },
              ].map((n, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer">
                  <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: n.dot }} />
                  <div>
                    <p className="text-xs font-semibold text-slate-700">{n.title}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{n.sub}</p>
                  </div>
                </div>
              ))}
              <div className="px-4 py-2.5" style={{ borderTop: '1px solid #f1f5f9' }}>
                <button className="text-xs font-bold w-full text-center" style={{ color: '#00c9b1' }}>
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Avatar + dropdown */}
        <div className="relative">
          <button
            onClick={() => { setDropOpen(p => !p); setNotifOpen(false) }}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors"
            style={{ border: '1px solid transparent' }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #00c9b1, #0097a7)', boxShadow: '0 2px 8px rgba(0,201,177,0.4)' }}
            >
              {admin?.full_name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-bold text-slate-700 leading-tight">{admin?.full_name || 'Admin'}</p>
              <p className="text-[10px] text-slate-400">{admin?.role === 'employee' ? 'Employee' : 'Administrator'}</p>
            </div>
          </button>

          {dropOpen && (
            <div
              className="absolute right-0 top-12 w-52 rounded-2xl z-50 overflow-hidden animate-fade-in"
              style={{ background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 8px 40px rgba(0,0,0,0.14)' }}
            >
              <div className="px-4 py-3" style={{ borderBottom: '1px solid #f1f5f9' }}>
                <p className="text-xs font-bold text-slate-800">{admin?.full_name}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{admin?.email || (admin?.role === 'employee' ? 'Employee' : 'Administrator')}</p>
              </div>
              <Link to="/profile" onClick={() => setDropOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors">
                <MdPerson size={16} className="text-slate-400" />
                <span className="text-sm text-slate-700 font-medium">My Profile</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-2.5 w-full text-left hover:bg-red-50 transition-colors"
                style={{ borderTop: '1px solid #f1f5f9' }}
              >
                <MdLogout size={16} className="text-red-400" />
                <span className="text-sm font-medium text-red-500">Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
