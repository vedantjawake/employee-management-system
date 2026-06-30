import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  MdAdd, MdSearch, MdEdit, MdDelete, MdVisibility,
  MdFilterList, MdPeople, MdPhone, MdEmail, MdBusiness,
  MdCalendarToday, MdAttachMoney, MdLocationOn, MdWork,
  MdPerson,
} from "react-icons/md";
import toast from "react-hot-toast";
import api from "../services/api";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import Spinner from "../components/Spinner";
import EmptyState from "../components/EmptyState";

const TEAL_COLORS = ['#00c9b1', '#6366f1', '#f59e0b', '#10b981', '#8b5cf6'];

const INIT = {
  full_name: "", email: "", phone: "", department_id: "",
  position: "", joining_date: "", salary: "", address: "", status: "active",
};

function StatusBadge({ status }) {
  const cfg = {
    active:   { dot: '#10b981', bg: 'rgba(16,185,129,0.1)',  text: '#059669',  label: 'Active' },
    inactive: { dot: '#94a3b8', bg: 'rgba(148,163,184,0.1)', text: '#64748b',  label: 'Inactive' },
  }[status] || { dot: '#94a3b8', bg: 'rgba(148,163,184,0.1)', text: '#64748b', label: status };
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
      style={{ background: cfg.bg, color: cfg.text }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [statusFilter, setStatus] = useState("");
  const [pagination, setPagination] = useState({ total: 0, page: 1, per_page: 10, total_pages: 1 });
  const [modalOpen, setModalOpen] = useState(false);
  const [editEmp, setEditEmp] = useState(null);
  const [form, setForm] = useState(INIT);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchEmployees = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, per_page: 10 };
      if (search) params.search = search;
      if (deptFilter) params.department_id = deptFilter;
      if (statusFilter) params.status = statusFilter;
      const r = await api.get("/employees/", { params });
      setEmployees(r.data.data);
      setPagination(r.data.pagination);
    } catch {
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  }, [search, deptFilter, statusFilter]);

  useEffect(() => { fetchEmployees(1); }, [fetchEmployees]);
  useEffect(() => { api.get("/departments/").then(r => setDepts(r.data.data)).catch(() => {}); }, []);

  function openAdd() { setEditEmp(null); setForm(INIT); setModalOpen(true); }
  function openEdit(emp) {
    setEditEmp(emp);
    setForm({
      full_name: emp.full_name || "", email: emp.email || "", phone: emp.phone || "",
      department_id: emp.department_id || "", position: emp.position || "",
      joining_date: emp.joining_date || "", salary: emp.salary || "",
      address: emp.address || "", status: emp.status || "active",
    });
    setModalOpen(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.full_name || !form.email) { toast.error("Name and email are required"); return; }
    setSaving(true);
    try {
      if (editEmp) { await api.put(`/employees/${editEmp.id}`, form); toast.success("Employee updated"); }
      else { await api.post("/employees/", form); toast.success("Employee added"); }
      setModalOpen(false);
      fetchEmployees(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally { setSaving(false); }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.delete(`/employees/${deleteTarget.id}`);
      toast.success("Employee deleted");
      setDeleteTarget(null);
      fetchEmployees(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    } finally { setDeleting(false); }
  }

  function inp(field, val) { setForm(p => ({ ...p, [field]: val })); }

  const totalPages = pagination.total_pages;
  const currentPage = pagination.page;

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
                Our Team
              </h2>
              {/* Teal underline accent */}
              <div className="h-0.5 w-12 rounded-full mt-0.5" style={{ background: 'linear-gradient(90deg,#00c9b1,transparent)' }} />
            </div>
            {/* Animated counter badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: 'rgba(0,201,177,0.12)', border: '1px solid rgba(0,201,177,0.25)', color: '#00c9b1' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
              {pagination.total} employees
            </div>
          </div>
          <p className="text-slate-400 text-sm mt-1">Manage and track your entire workforce</p>
        </div>
        <button
          onClick={openAdd}
          className="btn-primary flex items-center gap-2 transition-all duration-200"
          style={{ background: 'linear-gradient(135deg,#00c9b1,#0097a7)', boxShadow: '0 4px 14px rgba(0,201,177,0.35)' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 22px rgba(0,201,177,0.55)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,201,177,0.35)'; }}
        >
          <MdAdd size={18} /> Add Employee
        </button>
      </div>

      {/* ── Glass Filter Bar ── */}
      <div className="rounded-2xl p-4 flex flex-col sm:flex-row gap-3"
        style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '0 4px 20px rgba(0,0,0,0.07)' }}>
        {/* Search */}
        <div className="relative flex-1">
          <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors duration-200" size={18}
            style={{ color: '#00c9b1' }} />
          <input
            type="text" placeholder="Search employees..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input pl-10 w-full"
            style={{ border: '1px solid rgba(0,201,177,0.2)' }}
          />
        </div>
        {/* Department filter */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold flex-shrink-0"
            style={{ background: 'rgba(0,201,177,0.1)', color: '#00c9b1' }}>
            <MdFilterList size={15} /> Filter
          </div>
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="form-input">
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.department_name}</option>)}
          </select>
        </div>
        {/* Status filter */}
        <select value={statusFilter} onChange={e => setStatus(e.target.value)} className="form-input sm:w-36">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* ── Premium Table ── */}
      <div className="rounded-2xl overflow-hidden" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid rgba(255,255,255,0.8)' }}>
        {loading ? <div className="bg-white"><Spinner center /></div> :
         employees.length === 0 ? (
           <div className="bg-white">
             <EmptyState message="No employees found" icon={MdPeople} actionLabel="Add Employee" onAction={openAdd} subtitle="Add your first employee to get started" />
           </div>
         ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: '#0d1b2a' }}>
                    <th className="text-left text-[10px] font-black uppercase tracking-widest py-4 px-4 text-slate-400">Employee</th>
                    <th className="text-left text-[10px] font-black uppercase tracking-widest py-4 px-4 text-slate-400 hidden sm:table-cell">Department</th>
                    <th className="text-left text-[10px] font-black uppercase tracking-widest py-4 px-4 text-slate-400 hidden md:table-cell">Position</th>
                    <th className="text-left text-[10px] font-black uppercase tracking-widest py-4 px-4 text-slate-400 hidden lg:table-cell">Salary</th>
                    <th className="text-left text-[10px] font-black uppercase tracking-widest py-4 px-4 text-slate-400 hidden lg:table-cell">Joined</th>
                    <th className="text-left text-[10px] font-black uppercase tracking-widest py-4 px-4 text-slate-400">Status</th>
                    <th className="text-right text-[10px] font-black uppercase tracking-widest py-4 px-4 text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp, i) => (
                    <tr key={emp.id}
                      className="group border-b transition-all duration-200 cursor-pointer"
                      style={{
                        background: i % 2 === 0 ? 'rgba(255,255,255,1)' : 'rgba(248,250,252,0.8)',
                        borderColor: 'rgba(241,245,249,1)',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,201,177,0.04)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = i % 2 === 0 ? 'rgba(255,255,255,1)' : 'rgba(248,250,252,0.8)'; }}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {/* Gradient avatar cycling through TEAL_COLORS */}
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                            style={{ background: `linear-gradient(135deg, ${TEAL_COLORS[i % TEAL_COLORS.length]}, ${TEAL_COLORS[(i + 2) % TEAL_COLORS.length]})`, boxShadow: `0 2px 8px ${TEAL_COLORS[i % TEAL_COLORS.length]}40` }}
                          >
                            {emp.full_name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 text-sm leading-tight">{emp.full_name}</p>
                            <p className="text-xs text-slate-400">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 hidden sm:table-cell">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                          style={{ background: 'rgba(99,102,241,0.08)', color: '#6366f1' }}>
                          <MdBusiness size={11} />
                          {emp.department_name || '—'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 hidden md:table-cell text-slate-600 text-sm">{emp.position || '—'}</td>
                      <td className="py-3.5 px-4 hidden lg:table-cell font-semibold text-slate-700 text-sm">
                        {emp.salary ? `$${Number(emp.salary).toLocaleString()}` : '—'}
                      </td>
                      <td className="py-3.5 px-4 hidden lg:table-cell text-slate-400 text-xs">{emp.joining_date || '—'}</td>
                      <td className="py-3.5 px-4">
                        <StatusBadge status={emp.status} />
                      </td>
                      <td className="py-3.5 px-4">
                        {/* Actions: visible on hover */}
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Link to={`/employees/${emp.id}`}
                            className="p-2 rounded-lg transition-all duration-200"
                            style={{ color: '#94a3b8' }}
                            title="View"
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,201,177,0.1)'; e.currentTarget.style.color = '#00c9b1'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#94a3b8'; }}
                          >
                            <MdVisibility size={16} />
                          </Link>
                          <button onClick={() => openEdit(emp)}
                            className="p-2 rounded-lg transition-all duration-200"
                            style={{ color: '#94a3b8' }}
                            title="Edit"
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)'; e.currentTarget.style.color = '#6366f1'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#94a3b8'; }}
                          >
                            <MdEdit size={16} />
                          </button>
                          <button onClick={() => setDeleteTarget(emp)}
                            className="p-2 rounded-lg transition-all duration-200"
                            style={{ color: '#94a3b8' }}
                            title="Delete"
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = ''; e.currentTarget.style.color = '#94a3b8'; }}
                          >
                            <MdDelete size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Premium Pagination ── */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-4 bg-white border-t border-slate-100">
                <p className="text-sm text-slate-500">
                  Page <span className="font-bold text-slate-700">{currentPage}</span> of <span className="font-bold text-slate-700">{totalPages}</span>
                  <span className="text-slate-400"> ({pagination.total} total)</span>
                </p>
                <div className="flex items-center gap-1.5">
                  <button disabled={currentPage <= 1} onClick={() => fetchEmployees(currentPage - 1)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition-all duration-200">
                    Previous
                  </button>
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button key={page} onClick={() => fetchEmployees(page)}
                        className="w-8 h-8 rounded-lg text-xs font-bold transition-all duration-200"
                        style={currentPage === page
                          ? { background: 'linear-gradient(135deg,#00c9b1,#0097a7)', color: '#fff', boxShadow: '0 2px 8px rgba(0,201,177,0.4)' }
                          : { background: '#f1f5f9', color: '#64748b' }}>
                        {page}
                      </button>
                    );
                  })}
                  <button disabled={currentPage >= totalPages} onClick={() => fetchEmployees(currentPage + 1)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 transition-all duration-200">
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Add / Edit Modal ── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editEmp ? "Edit Employee" : "Add Employee"} size="lg">
        <form onSubmit={handleSave} className="space-y-5">

          {/* Section: Personal Info */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-md flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#00c9b1,#0097a7)' }}>
                <MdPerson size={12} className="text-white" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#00c9b1' }}>Personal Information</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Full Name *</label>
                <div className="relative">
                  <MdPerson className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input value={form.full_name} onChange={e => inp("full_name", e.target.value)} className="form-input pl-10" placeholder="John Smith" required />
                </div>
              </div>
              <div>
                <label className="form-label">Email *</label>
                <div className="relative">
                  <MdEmail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input type="email" value={form.email} onChange={e => inp("email", e.target.value)} className="form-input pl-10" placeholder="john@example.com" required />
                </div>
              </div>
              <div>
                <label className="form-label">Phone</label>
                <div className="relative">
                  <MdPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input value={form.phone} onChange={e => inp("phone", e.target.value)} className="form-input pl-10" placeholder="555-0101" />
                </div>
              </div>
              <div>
                <label className="form-label">Status</label>
                <select value={form.status} onChange={e => inp("status", e.target.value)} className="form-input">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-100" />

          {/* Section: Work Details */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 rounded-md flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                <MdWork size={12} className="text-white" />
              </div>
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#6366f1' }}>Work Details</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Department</label>
                <div className="relative">
                  <MdBusiness className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <select value={form.department_id} onChange={e => inp("department_id", e.target.value)} className="form-input pl-10">
                    <option value="">Select Department</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.department_name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">Position</label>
                <div className="relative">
                  <MdWork className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input value={form.position} onChange={e => inp("position", e.target.value)} className="form-input pl-10" placeholder="Senior Developer" />
                </div>
              </div>
              <div>
                <label className="form-label">Joining Date</label>
                <div className="relative">
                  <MdCalendarToday className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={15} />
                  <input type="date" value={form.joining_date} onChange={e => inp("joining_date", e.target.value)} className="form-input pl-10" />
                </div>
              </div>
              <div>
                <label className="form-label">Salary ($)</label>
                <div className="relative">
                  <MdAttachMoney className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                  <input type="number" value={form.salary} onChange={e => inp("salary", e.target.value)} className="form-input pl-10" placeholder="50000" />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="form-label">Address</label>
                <div className="relative">
                  <MdLocationOn className="absolute left-3.5 top-3.5 text-slate-300" size={16} />
                  <textarea value={form.address} onChange={e => inp("address", e.target.value)} className="form-input pl-10" rows={2} placeholder="123 Main St, City, State" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
              ) : editEmp ? "Update Employee" : "Add Employee"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete} loading={deleting}
        title="Delete Employee"
        message={`Are you sure you want to delete "${deleteTarget?.full_name}"? This cannot be undone.`}
      />
    </div>
  );
}
