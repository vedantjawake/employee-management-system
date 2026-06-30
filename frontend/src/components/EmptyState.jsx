import React from 'react'
import { MdInbox } from 'react-icons/md'

export default function EmptyState({ message = 'No data found', icon: Icon = MdInbox, actionLabel, onAction, subtitle }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      {/* Animated gradient icon container */}
      <div className="relative">
        <div
          className="w-24 h-24 rounded-3xl flex items-center justify-center animate-float"
          style={{
            background: 'linear-gradient(135deg, rgba(0,201,177,0.12) 0%, rgba(99,102,241,0.12) 100%)',
            border: '1px solid rgba(0,201,177,0.2)',
            boxShadow: '0 8px 32px rgba(0,201,177,0.1)',
          }}
        >
          <Icon size={40} style={{ color: '#00c9b1', filter: 'drop-shadow(0 0 8px rgba(0,201,177,0.4))' }} />
        </div>
        {/* Pulse ring */}
        <div
          className="absolute inset-0 rounded-3xl"
          style={{
            border: '2px solid rgba(0,201,177,0.2)',
            animation: 'pulse-ring 2s ease-out infinite',
          }}
        />
      </div>

      <div className="text-center space-y-1.5">
        <p className="text-base font-bold text-slate-700">{message}</p>
        <p className="text-sm text-slate-400">
          {subtitle || 'Nothing to display right now. Get started by adding one!'}
        </p>
      </div>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="btn-primary mt-2 text-sm px-6 py-2.5"
          style={{ background: 'linear-gradient(135deg, #00c9b1, #0097a7)', boxShadow: '0 4px 14px rgba(0,201,177,0.35)' }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
