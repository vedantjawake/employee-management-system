import React, { useEffect } from 'react'
import { MdWarningAmber, MdClose } from 'react-icons/md'

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, loading }) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-premium animate-fade-in overflow-hidden"
        style={{ border: '1px solid rgba(0,0,0,0.07)' }}>

        {/* Close btn */}
        <button onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-all">
          <MdClose size={15} />
        </button>

        <div className="p-6 flex flex-col items-center text-center gap-4">
          {/* Icon */}
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(239,68,68,0.1)' }}>
            <MdWarningAmber size={28} className="text-red-500" />
          </div>

          <div>
            <h3 className="font-bold text-slate-800 text-base">{title}</h3>
            <p className="text-sm text-slate-400 mt-1.5 leading-relaxed">{message}</p>
          </div>

          <div className="flex gap-3 w-full pt-1">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all">
              Cancel
            </button>
            <button onClick={onConfirm} disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 4px 12px rgba(239,68,68,0.3)' }}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Deleting...
                </span>
              ) : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
