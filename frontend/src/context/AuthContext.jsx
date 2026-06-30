import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [admin, setAdmin]     = useState(null)
  const [loading, setLoading] = useState(true)

  // Restore session on mount
  useEffect(() => {
    const token   = localStorage.getItem('ems_token')
    const stored  = localStorage.getItem('ems_admin')
    if (token && stored) {
      try { setAdmin(JSON.parse(stored)) }
      catch { localStorage.clear() }
    }
    setLoading(false)
  }, [])

  /** Admin login */
  const login = useCallback(async (username, password) => {
    const res = await api.post('/auth/login', { username, password })
    const { token, admin: adminData } = res.data
    localStorage.setItem('ems_token', token)
    localStorage.setItem('ems_admin', JSON.stringify({ ...adminData, role: 'admin' }))
    setAdmin({ ...adminData, role: 'admin' })
    return adminData
  }, [])

  /** Employee login (called externally, stores session the same way) */
  const employeeLogin = useCallback((employeeData, token) => {
    const data = { ...employeeData, role: 'employee' }
    localStorage.setItem('ems_token', token)
    localStorage.setItem('ems_admin', JSON.stringify(data))
    setAdmin(data)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('ems_token')
    localStorage.removeItem('ems_admin')
    setAdmin(null)
  }, [])

  const updateAdmin = useCallback((data) => {
    const updated = { ...admin, ...data }
    localStorage.setItem('ems_admin', JSON.stringify(updated))
    setAdmin(updated)
  }, [admin])

  return (
    <AuthContext.Provider value={{ admin, loading, login, employeeLogin, logout, updateAdmin }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
