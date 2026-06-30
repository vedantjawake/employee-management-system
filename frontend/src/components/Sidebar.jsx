import React, { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import {
  MdDashboard, MdPeople, MdBusiness, MdAccessTime,
  MdAttachMoney, MdPerson, MdLogout, MdClose,
  MdChevronLeft, MdChevronRight,
} from 'react-icons/md'

const nav = [
  { to: '/',            icon: MdDashboard,   label: 'Dashboard',   exact: true },
  { to: '/employees',   icon: MdPeople,      label: 'Employees' },
  { to: '/departments', icon: MdBusiness,    label: 'Departments' },
  { to: '/attendance',  icon: MdAccessTime,  label: 'Attendance' },
  { to: '/salary',      icon: MdAttachMoney, label: 'Salary' },
]
const bottom = [
  { to: '/profile', icon: MdPerson, label: 'Profile' },
]

export default function Sidebar({ onClose, collapsed, onToggleCollapse }) {
  const { admin, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()

  function handleLogout() {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  function isActive(item) {
    if (item.exact) return pathname === item.to
    return pathname === item.to || pathname.startsWith(item.to + '/')
  }

  const w = collapsed ? 'w-16' : 'w-64'

  return (
    <div
      className={`flex flex-col h-full transition-all duration-300 ${w} relative`}
      style={{ background: 'linear-gradient(180deg, #0d1b2a 0%, #0b1520 100%)', borderRight: '1px solid rgba(255,255,255,0.05)' }}
    >
      {/* Logo area */}
      <div
        className="flex items-center px-4 py-5 relative"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      >
        {!collapsed && (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-base flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #00c9b1, #0097a7)', boxShadow: '0 4px 12px rgba(0,201,177,0.4)' }}
            >
              E
            </div>
            <div className="min-w-0">
              <p className="font-extrabold text-white text-sm tracking-tight">EMS Portal</p>
              <p className="text-[10px] font-medium" style={{ color: 'rgba(0,201,177,0.6)' }}>Management System</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-base mx-auto"
            style={{ background: 'linear-gradient(135deg, #00c9b1, #0097a7)', boxShadow: '0 4px 12px rgba(0,201,177,0.4)' }}
          >
            E
          </div>
        )}

        {/* Close button (mobile) */}
        <button onClick={onClose} className="lg:hidden text-slate-500 hover:text-white transition-colors ml-2">
          <MdClose size={18} />
        </button>
      </div>

      {/* Admin card */}
      {!collapsed && (
        <div
          className="mx-3 mt-4 p-3 rounded-xl flex items-center gap-3"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #00c9b1, #0097a7)' }}
          >
            {admin?.full_name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate leading-tight">{admin?.full_name || 'Admin'}</p>
            <p className="text-[10px] truncate mt-0.5" style={{ color: 'rgba(0,201,177,0.7)' }}>
              {admin?.role === 'employee' ? 'Employee' : 'Administrator'}
            </p>
          </div>
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#00c9b1', boxShadow: '0 0 6px rgba(0,201,177,0.7)' }} />
        </div>
      )}
      {collapsed && (
        <div className="flex justify-center mt-4">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ background: 'linear-gradient(135deg, #00c9b1, #0097a7)' }}
          >
            {admin?.full_name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
        </div>
      )}

      {/* Section label */}
      {!collapsed && (
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-5 mt-5 mb-2">Navigation</p>
      )}

      {/* Main nav */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto mt-3">
        {nav.map(item => {
          const active = isActive(item)
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              onClick={onClose}
              title={collapsed ? item.label : undefined}
              className={() =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  active
                    ? 'text-white'
                    : 'text-slate-500 hover:text-white hover:bg-white/5'
                } ${collapsed ? 'justify-center' : ''}`
              }
              style={active ? { background: 'linear-gradient(135deg, #00c9b1, #0097a7)', boxShadow: '0 4px 14px rgba(0,201,177,0.35)' } : {}}
            >
              <item.icon
                size={18}
                className={active ? 'text-white flex-shrink-0' : 'text-slate-500 group-hover:text-white flex-shrink-0 transition-colors'}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60 flex-shrink-0" />
              )}
            </NavLink>
          )
        })}

        {/* Account section */}
        {!collapsed && (
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-3 mt-5 mb-2">Account</p>
        )}
        {collapsed && <div className="my-3 border-t border-white/5" />}

        {bottom.map(item => {
          const active = isActive(item)
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              title={collapsed ? item.label : undefined}
              className={() =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  active ? 'text-white' : 'text-slate-500 hover:text-white hover:bg-white/5'
                } ${collapsed ? 'justify-center' : ''}`
              }
              style={active ? { background: 'linear-gradient(135deg, #00c9b1, #0097a7)', boxShadow: '0 4px 14px rgba(0,201,177,0.35)' } : {}}
            >
              <item.icon size={18} className={active ? 'text-white' : 'text-slate-500 group-hover:text-white transition-colors'} />
              {!collapsed && <span>{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>

      {/* Collapse toggle (desktop) */}
      <div className="hidden lg:flex justify-end px-3 py-2">
        <button
          onClick={onToggleCollapse}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/10 transition-all"
        >
          {collapsed ? <MdChevronRight size={16} /> : <MdChevronLeft size={16} />}
        </button>
      </div>

      {/* Logout */}
      <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
          className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all ${collapsed ? 'justify-center' : ''}`}
        >
          <MdLogout size={18} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  )
}
