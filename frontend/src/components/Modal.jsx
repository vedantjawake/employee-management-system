import React, { useEffect } from 'react'
import { MdClose } from 'react-icons/md'

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(10,20,35,0.65)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`relative w-full ${sizes[size]} bg-white rounded-2xl animate-fade-in max-h-[92vh] flex flex-col overflow-hidden`}
        style={{ border: '1px solid rgba(0,0,0,0.07)', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid #f1f5f9', background: '#fafbfc' }}
        >
          <h2 className="text-sm font-bold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
          >
            <MdClose size={17} />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 flex-1">{children}</div>
      </div>
    </div>
  )
}
