import React from 'react'

export default function Spinner({ size = 'md', center = false }) {
  const dims = { sm: 20, md: 32, lg: 48 }
  const thick = { sm: 2, md: 3, lg: 4 }
  const d = dims[size] || 32
  const t = thick[size] || 3

  const el = (
    <div
      className="rounded-full animate-spin"
      style={{
        width: d,
        height: d,
        borderWidth: t,
        borderStyle: 'solid',
        borderColor: 'rgba(0,201,177,0.2)',
        borderTopColor: '#00c9b1',
      }}
    />
  )

  if (center) return (
    <div className="flex flex-col justify-center items-center py-16 gap-3">
      {el}
      <p className="text-xs text-slate-400 font-medium animate-pulse">Loading...</p>
    </div>
  )

  return el
}
