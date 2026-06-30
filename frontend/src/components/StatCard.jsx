import React from 'react'
import { MdTrendingUp, MdTrendingDown } from 'react-icons/md'

const palette = {
  blue: {
    grad: 'linear-gradient(135deg, #0d9488, #0891b2)',
    glow: 'rgba(13,148,136,0.25)',
    light: 'rgba(13,148,136,0.07)',
    text: '#0d9488',
    border: 'rgba(13,148,136,0.18)',
    sparkColor: '#0d9488',
  },
  green: {
    grad: 'linear-gradient(135deg, #059669, #10b981)',
    glow: 'rgba(16,185,129,0.25)',
    light: 'rgba(16,185,129,0.07)',
    text: '#059669',
    border: 'rgba(16,185,129,0.18)',
    sparkColor: '#059669',
  },
  purple: {
    grad: 'linear-gradient(135deg, #7c3aed, #a855f7)',
    glow: 'rgba(168,85,247,0.25)',
    light: 'rgba(168,85,247,0.07)',
    text: '#7c3aed',
    border: 'rgba(168,85,247,0.18)',
    sparkColor: '#7c3aed',
  },
  orange: {
    grad: 'linear-gradient(135deg, #d97706, #f59e0b)',
    glow: 'rgba(245,158,11,0.25)',
    light: 'rgba(245,158,11,0.07)',
    text: '#d97706',
    border: 'rgba(245,158,11,0.18)',
    sparkColor: '#d97706',
  },
  cyan: {
    grad: 'linear-gradient(135deg, #0891b2, #22d3ee)',
    glow: 'rgba(6,182,212,0.25)',
    light: 'rgba(6,182,212,0.07)',
    text: '#0891b2',
    border: 'rgba(6,182,212,0.18)',
    sparkColor: '#0891b2',
  },
  teal: {
    grad: 'linear-gradient(135deg, #00c9b1, #0097a7)',
    glow: 'rgba(0,201,177,0.25)',
    light: 'rgba(0,201,177,0.07)',
    text: '#00a896',
    border: 'rgba(0,201,177,0.18)',
    sparkColor: '#00c9b1',
  },
}

export default function StatCard({ label, value, icon: Icon, color = 'blue', sub, trend, mini }) {
  const c = palette[color] || palette.blue

  return (
    <div
      className="bg-white rounded-2xl p-5 flex items-center gap-4 transition-all duration-300 hover:-translate-y-0.5 group cursor-default"
      style={{
        border: `1px solid ${c.border}`,
        boxShadow: `0 2px 16px rgba(0,0,0,0.05), 0 0 0 0 ${c.glow}`,
        transition: 'box-shadow 0.3s ease, transform 0.2s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 8px 28px ${c.glow}, 0 2px 8px rgba(0,0,0,0.06)` }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 2px 16px rgba(0,0,0,0.05)` }}
    >
      {/* Icon */}
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
        style={{ background: c.grad, boxShadow: `0 4px 14px ${c.glow}` }}
      >
        <Icon size={22} className="text-white" />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
        <p
          className="text-2xl font-extrabold mt-0.5 stat-number leading-none"
          style={{ color: c.text }}
        >
          {value}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {sub && <p className="text-xs text-slate-400 truncate">{sub}</p>}
          {trend != null && (
            <span
              className={`inline-flex items-center gap-0.5 text-xs font-bold flex-shrink-0 ${
                trend > 0 ? 'text-teal-600' : trend < 0 ? 'text-red-500' : 'text-slate-400'
              }`}
            >
              {trend > 0 && <MdTrendingUp size={12} />}
              {trend < 0 && <MdTrendingDown size={12} />}
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          )}
        </div>
      </div>

      {/* Right mini bar */}
      {mini && (
        <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
          {[70, 45, 85, 60, 90, 55, 80].map((h, i) => (
            <div
              key={i}
              className="w-1 rounded-full opacity-60"
              style={{
                height: `${h * 0.3}px`,
                background: c.sparkColor,
                opacity: 0.3 + (i / 7) * 0.7,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
