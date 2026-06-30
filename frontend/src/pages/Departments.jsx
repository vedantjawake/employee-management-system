import React, { useState, useEffect } from 'react'
import { MdAdd, MdEdit, MdDelete, MdBusiness, MdPeople, MdSearch } from 'react-icons/md'
import toast from 'react-hot-toast'
import api from '../services/api'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import Spinner from '../components/Spinner'
import EmptyState from '../components/EmptyState'

const INIT = { department_name: '', description: '' }

const DEPT_GRADIENTS = [
  { grad: 'linear-gradient(135deg,#00c9b1,#0097a7)', glow: 'rgba(0,201,177,0.3)',  border: 'rgba(0,201,177,0.35)' },
  { grad: 'linear-gradient(135deg,#6366f1,#8b5cf6)', glow: 'rgba(99,102,241,0.3)',  border: 'rgba(99,102,241,0.35)' },
  { grad: 'linear-gradient(135deg,#10b981,#059669)', glow: 'rgba(16,185,129,0.3)',  border: 'rgba(16,185,129,0.35)' },
  { grad: 'linear-gradient(135deg,#f59e0b,#d97706)', glow: 'rgba(245,158,11,0.3)',  border: 'rgba(245,158,11,0.35)' },
  { grad: 'linear-gradient(135deg,#ef4444,#dc2626)', glow: 'rgba(239,68,68,0.3)',   border: 'rgba(239,68,68,0.35)' },
  { grad: 'linear-gradient(135deg,#0891b2,#06b6d4)', glow: 'rgba(6,182,212,0.3)',   border: 'rgba(6,182,212,0.35)' },
]

export default function Departments() {
  const [departments, setDepts] = useState([])
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [modalOpen, setModal]   = useState(false)
  const [editDept, setEdit]     = useState(null)
  const [form, setForm]         = useState(INIT)
  const [saving, setSaving]     = useState(false)
  const [deleteTarget, setDel]  = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchDepts = async () => {
    setLoading(true)
    try {
      const r = await api.get('/departments/')
      setDepts(r.data.data)
    } catch { toast.error('Failed to load departments') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchDepts() }, [])

  function openAdd()   { setEdit(null); setForm(INIT); setModal(true) }
  function openEdit(d) { setEdit(d); setForm({ department_name: d.department_name, description: d.description || '' }); setModal(true) }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.department_name) { toast.error('Department name required'); return }
    setSaving(true)
    try {
      if (editDept) {
        await api.put(`/departments/${editDept.id}`, form)
        toast.success('Department updated')
      } else {
        await api.post('/departments/', form)
        toast.success('Department created')
      }
      setModal(false)
      fetchDepts()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed')
    } finally { setSaving(false) }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await api.delete(`/departments/${deleteTarget.id}`)
      toast.success('Department deleted')
      setDel(null)
      fetchDepts()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed')
    } finally { setDeleting(false) }
  }

  const filtered = departments.filter(d =>
    !search || d.department_name.toLowerCase().includes(search.toLowerCase()) ||
    (d.description || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5">

      {/* ── Premium Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div>
              <h2
                className="text-2xl font-black"
                style={{ background: 'linear-gradient(90deg,#fff,#00c9b1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
              >
                Departments
              </h2>
              <div className="h-0.5 w-12 rounded-full mt-0.5" style={{ background: 'linear-gradient(90deg,#00c9b1,transparent)' }} />
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: 'rgba(0,201,177,0.12)', border: '1px solid rgba(0,201,177,0.25)', color: '#00c9b1' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              {departments.length} teams
            </div>
          </div>
          <p className="text-slate-400 text-sm mt-1">Organise your workforce into departments</p>
        </div>
        <button
          onClick={openAdd}
          className="btn-primary flex items-center gap-2 transition-all duration-200"
          style={{ background: 'linear-gradient(135deg,#00c9b1,#0097a7)', boxShadow: '0 4px 14px rgba(0,201,177,0.35)' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 22px rgba(0,201,177,0.55)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,201,177,0.35)'; }}
        >
          <MdAdd size={18} /> Add Department
        </button>
      </div>

      {/* ── Search/Filter bar ── */}
      <div className="rounded-2xl p-4"
        style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
        <div className="relative">
          <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2" size={18} style={{ color: '#00c9b1' }} />
          <input
            type="text" placeholder="Search departments..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input pl-10 w-full"
            style={{ border: '1px solid rgba(0,201,177,0.2)' }}
          />
        </div>
      </div>

      {/* ── Cards Grid ── */}
      {loading ? <Spinner center /> : filtered.length === 0 ? (
        <div className="rounded-2xl bg-white" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
          <EmptyState message="No departments found" icon={MdBusiness}
            subtitle={search ? 'Try a different search term' : 'Create your first department to get started'}
            actionLabel={!search ? 'Add Department' : undefined}
            onAction={!search ? openAdd : undefined} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((d, i) => {
            const palette = DEPT_GRADIENTS[i % DEPT_GRADIENTS.length]
            return (
              <div key={d.id}
                className="relative rounded-2xl p-5 bg-white transition-all duration-200 group"
                style={{ border: '1px solid rgba(255,255,255,0.8)', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)'
                  e.currentTarget.style.boxShadow = `0 12px 40px ${palette.glow}, 0 2px 16px rgba(0,0,0,0.06)`
                  e.currentTarget.style.border = `1px solid ${palette.border}`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = ''
                  e.currentTarget.style.boxShadow = '0 2px 16px rgba(0,0,0,0.06)'
                  e.currentTarget.style.border = '1px solid rgba(255,255,255,0.8)'
                }}
              >
                {/* Header: icon + actions */}
                <div className="flex items-start justify-between mb-4">
                  {/* Large gradient icon */}
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: palette.grad, boxShadow: `0 6px 20px ${palette.glow}` }}
                  >
                    <MdBusiness size={26} className="text-white" />
                  </div>

                  {/* Edit/Delete — always visible */}
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => openEdit(d)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
                      style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1' }}
                      title="Edit"
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.18)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.transform = ''; }}
                    >
                      <MdEdit size={15} />
                    </button>
                    <button
                      onClick={() => setDel(d)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
                      style={{ background: 'rgba(239,68,68,0.08)', color: '#ef4444' }}
                      title="Delete"
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.18)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.transform = ''; }}
                    >
                      <MdDelete size={15} />
                    </button>
                  </div>
                </div>

                {/* Dept name + description */}
                <div className="space-y-1.5">
                  <h3 className="font-bold text-slate-800 text-base leading-tight">{d.department_name}</h3>
                  <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">{d.description || 'No description provided'}</p>
                </div>

                {/* Footer: employee count badge */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MdPeople size={15} className="text-slate-400" />
                    <span className="text-sm text-slate-600 font-medium">{d.employee_count || 0} employees</span>
                  </div>
                  <span
                    className="px-2.5 py-1 rounded-full text-xs font-bold"
                    style={{ background: 'rgba(0,201,177,0.1)', color: '#00a896' }}
                  >
                    {d.employee_count || 0} members
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modal ── */}
      <Modal open={modalOpen} onClose={() => setModal(false)} title={editDept ? 'Edit Department' : 'Add Department'} size="sm">
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="form-label">Department Name *</label>
            <div className="relative">
              <MdBusiness className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
              <input value={form.department_name} onChange={e => setForm(p => ({ ...p, department_name: e.target.value }))}
                className="form-input pl-10" placeholder="e.g. Engineering" required />
            </div>
          </div>
          <div>
            <label className="form-label">Description</label>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="form-input" rows={3} placeholder="Brief description of this department..." />
          </div>
          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
              ) : editDept ? 'Update' : 'Create Department'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget} onClose={() => setDel(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Delete Department"
        message={`Delete "${deleteTarget?.department_name}"? Employees will be unassigned.`}
      />
    </div>
  )
}
