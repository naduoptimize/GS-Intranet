import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, Plus, Edit2, Trash2, Key, X, Check,
  ChevronDown, Building2, Shield, UserCheck, AlertTriangle, RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:5000/api';

const ROLES = ['employee', 'sub_admin', 'it_admin', 'hr_admin', 'it_staff', 'hr_staff', 'super_admin'];
const ROLE_LABELS = { 
  employee: 'Employee', 
  sub_admin: 'Sub Admin', 
  it_admin: 'IT Admin', 
  hr_admin: 'HR Admin', 
  it_staff: 'IT Staff',
  hr_staff: 'HR Staff',
  super_admin: 'Super Admin' 
};
const ROLE_COLORS = { 
  employee: '#6366f1', 
  sub_admin: '#f59e0b', 
  it_admin: '#3b82f6', 
  hr_admin: '#ec4899', 
  it_staff: '#06b6d4',
  hr_staff: '#f43f5e',
  super_admin: '#C8102E' 
};

// ── MODAL WRAPPER ─────────────────────────────────────────
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md" onClick={onClose} />
    <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 10 }}
      className="relative bg-white dark:bg-[#131B2E] border border-slate-100 dark:border-white/5 rounded-[28px] shadow-2xl w-full max-w-lg p-8 z-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{title}</h2>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
      {children}
    </motion.div>
  </div>
);

// ── FORM FIELD ────────────────────────────────────────────
const Field = ({ label, children }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest">{label}</label>
    {children}
  </div>
);

const Input = (props) => (
  <input {...props} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-800 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red/40 transition-all" />
);

const Select = ({ children, ...props }) => (
  <select {...props} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-800 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red/40 transition-all cursor-pointer">
    {children}
  </select>
);

// ── MAIN COMPONENT ────────────────────────────────────────
export default function AdminDirectory() {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isSubAdmin = currentUser?.role !== 'super_admin';

  const [employees, setEmployees] = useState([]);
  const [subsidiaries, setSubsidiaries] = useState([]);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [filterSub, setFilterSub] = useState('All');
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showAdd, setShowAdd] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [deleteUser, setDeleteUser] = useState(null);
  const [resetUser, setResetUser] = useState(null);
  const [toast, setToast] = useState(null);

  // Form helper function
  const getInitialForm = () => ({
    full_name: '',
    email: '',
    password: '',
    role: 'employee',
    subsidiary_id: isSubAdmin ? currentUser?.subsidiary_id : '',
    department: '',
    job_title: '',
    phone: '',
    date_of_birth: '',
    nic_number: '',
    employee_no: ''
  });

  const [form, setForm] = useState(getInitialForm());
  const [saving, setSaving] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const usersUrl = isSubAdmin ? `${API}/users?subsidiaryId=${currentUser.subsidiary_id}` : `${API}/users`;
      const [empRes, subRes] = await Promise.all([
        fetch(usersUrl),
        fetch(`${API}/subsidiaries`)
      ]);
      setEmployees(await empRes.json());
      setSubsidiaries(await subRes.json());
    } catch { showToast('Failed to load data', 'error'); }
    setLoading(false);
  };

  useEffect(() => {
    if (currentUser) {
      fetchData();
      setForm(getInitialForm());
    }
  }, [currentUser]);

  // ── FILTERED LIST ──────────────────────────────────────
  const filtered = employees.filter(e => {
    const matchSearch = e.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      e.email?.toLowerCase().includes(search.toLowerCase()) ||
      e.department?.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'All'
      ? true
      : e.role === filterRole;
    const matchSub = filterSub === 'All' || e.subsidiary_name === filterSub;
    return matchSearch && matchRole && matchSub;
  });

  const subNames = [...new Set(employees.map(e => e.subsidiary_name).filter(Boolean))];

  // ── HANDLERS ──────────────────────────────────────────
  const handleAdd = async () => {
    if (!form.full_name || !form.email || !form.password) return showToast('Name, email and password are required', 'error');
    setSaving(true);
    try {
      const res = await fetch(`${API}/users`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast('Employee added successfully');
      setShowAdd(false);
      setForm(getInitialForm());
      fetchData();
    } catch (err) { showToast(err.message || 'Failed to add employee', 'error'); }
    setSaving(false);
  };

  const handleEdit = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/users/${editUser.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error('Failed to update');
      showToast('Employee updated successfully');
      setEditUser(null);
      fetchData();
    } catch (err) { showToast(err.message, 'error'); }
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      await fetch(`${API}/users/${deleteUser.id}`, { method: 'DELETE' });
      showToast('Employee deactivated');
      setDeleteUser(null);
      fetchData();
    } catch { showToast('Failed to deactivate', 'error'); }
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      await fetch(`${API}/users/${resetUser.id}/reset-password`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newPassword: 'GS@2026' }) });
      showToast('Password reset to GS@2026');
      setResetUser(null);
    } catch { showToast('Failed to reset password', 'error'); }
    setSaving(false);
  };

  const openEdit = (emp) => {
    setForm({ 
      full_name: emp.full_name, 
      email: emp.email, 
      password: '', 
      role: emp.role, 
      subsidiary_id: emp.subsidiary_id || '', 
      department: emp.department || '', 
      job_title: emp.job_title || '', 
      phone: emp.phone || '', 
      date_of_birth: emp.date_of_birth ? emp.date_of_birth.substring(0, 10) : '',
      nic_number: emp.nic_number || '',
      employee_no: emp.employee_no || ''
    });
    setEditUser(emp);
  };

  const stats = [
    { label: 'Total Employees', value: employees.length, color: '#6366f1', gradient: 'from-indigo-500 to-blue-600' },
    isSubAdmin 
      ? { label: 'Standard Employees', value: employees.filter(e => e.role === 'employee').length, color: '#3b82f6', gradient: 'from-blue-500 to-sky-600' }
      : { label: 'Super Admins', value: employees.filter(e => e.role === 'super_admin').length, color: '#C8102E', gradient: 'from-red-500 to-rose-600' },
    { label: 'Sub Admins', value: employees.filter(e => e.role === 'sub_admin').length, color: '#f59e0b', gradient: 'from-amber-500 to-yellow-600' },
    isSubAdmin
      ? { label: 'My Subsidiary', value: currentUser?.subsidiary_name || 'Assigned', color: '#10b981', gradient: 'from-emerald-500 to-teal-600' }
      : { label: 'Subsidiaries', value: subNames.length, color: '#10b981', gradient: 'from-emerald-500 to-teal-600' }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] pb-20 transition-colors duration-350">

      {/* ── TOAST ── */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-[300] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-white font-bold text-sm ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}>
            {toast.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO BANNER */}
      <div className="px-4 sm:px-8 pt-4 sm:pt-8">
        <div className="relative h-[220px] sm:h-[300px] md:h-[350px] w-full overflow-hidden rounded-[24px] sm:rounded-[36px] shadow-xl group">
          <img 
            src="/admin_premium_cover.png" 
            alt="Directory" 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/50 to-transparent"/>
          <div className="absolute inset-0 flex items-center px-6 sm:px-10 md:px-16">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-brand-red/20 backdrop-blur-md border border-brand-red/30 rounded-full mb-2.5 sm:mb-3.5">
                <div className="w-1.5 h-1.5 bg-brand-red rounded-full animate-pulse"/>
                <span className="text-[8px] font-black text-brand-red uppercase tracking-[3px]">Identity Hub</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-tighter leading-none mb-2">
                Employee &amp; <span className="text-brand-red">Access Manager</span>
              </h1>
              <p className="text-white/60 text-xs sm:text-sm font-medium leading-relaxed max-w-lg hidden sm:block">
                Manage all George Steuart employee directories, configure security roles, reset credentials, and handle entity subsidiary mappings.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-8 md:px-10 -mt-10 sm:-mt-16 relative z-10">

        {/* Title Action Bar */}
        <div className="bg-white dark:bg-[#131B2E] p-5 sm:p-7 rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Active Profiles</h2>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">Control administrative staff credentials & role privileges.</p>
          </div>
          <button onClick={() => { setForm(getInitialForm()); setShowAdd(true); }}
            className="w-full sm:w-auto bg-brand-red text-white px-7 py-3.5 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2.5 shadow-lg shadow-brand-red/20 hover:scale-105 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Employee
          </button>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((s, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 12 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.07 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-white dark:bg-[#131B2E] rounded-2xl border border-slate-100 dark:border-white/5 p-5 shadow-sm hover:shadow-md transition-all flex items-center gap-4 relative overflow-hidden group"
            >
              {/* Premium HSL Gradient Orb Overlay */}
              <div className={`absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br ${s.gradient} rounded-full opacity-10 dark:opacity-20 blur-xl group-hover:opacity-25 transition-opacity pointer-events-none`}/>
              
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5 relative z-10" style={{ color: s.color }}>
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0 relative z-10">
                <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{s.label}</p>
                <p className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white mt-0.5 leading-none">{s.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* FILTERS */}
        <div className="bg-white dark:bg-[#131B2E] rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm p-4 sm:p-5 flex items-center gap-4 flex-wrap mb-8">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-455 dark:text-slate-500" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, email, department…"
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-sm font-bold text-slate-700 dark:text-white outline-none focus:ring-4 focus:ring-brand-red/5 transition-all" />
          </div>
          <div className="flex items-center gap-2 w-full lg:w-auto">
            <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
              className="flex-1 lg:flex-none px-4 py-2.5 bg-slate-50 dark:bg-[#131B2E] border border-slate-100 dark:border-white/10 rounded-xl text-sm font-bold text-slate-700 dark:text-white outline-none focus:ring-4 focus:ring-brand-red/5 cursor-pointer">
              <option value="All">All Roles</option>
              {ROLES.filter(r => !isSubAdmin || r !== 'super_admin').map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
            {!isSubAdmin && (
              <select value={filterSub} onChange={e => setFilterSub(e.target.value)}
                className="flex-1 lg:flex-none px-4 py-2.5 bg-slate-50 dark:bg-[#131B2E] border border-slate-100 dark:border-white/10 rounded-xl text-sm font-bold text-slate-700 dark:text-white outline-none focus:ring-4 focus:ring-brand-red/5 cursor-pointer">
                <option value="All">All Subsidiaries</option>
                {subNames.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
            <button onClick={fetchData} className="p-2.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all text-slate-400 hover:text-slate-700 dark:hover:text-white shrink-0">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 ml-auto uppercase tracking-wider hidden sm:inline">{filtered.length} records</span>
        </div>

        {/* CONTAINER TABLE/CARDS */}
        <div className="bg-white dark:bg-[#131B2E] rounded-3xl sm:rounded-[36px] border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
          
          {/* DESKTOP TABLE */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                  <th className="text-left px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-555 uppercase tracking-widest">Employee</th>
                  <th className="text-left px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-555 uppercase tracking-widest">Role</th>
                  <th className="text-left px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-555 uppercase tracking-widest">Subsidiary</th>
                  <th className="text-left px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-555 uppercase tracking-widest">Department</th>
                  <th className="text-left px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-555 uppercase tracking-widest">Contact</th>
                  <th className="text-right px-6 py-5 text-[10px] font-black text-slate-400 dark:text-slate-555 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-16 text-slate-400 dark:text-slate-500 text-sm font-medium animate-pulse">Loading employees…</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-16 text-slate-400 dark:text-slate-500 text-sm font-medium">No employees found</td></tr>
                ) : filtered.map((emp, i) => (
                  <motion.tr key={emp.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                    className="hover:bg-slate-50/60 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl overflow-hidden shrink-0 shadow-sm border border-slate-100 dark:border-white/10">
                          <img src={emp.profile_pic || `https://ui-avatars.com/api/?name=${emp.full_name}&background=C8102E&color=fff&bold=true`}
                            className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-800 dark:text-white">{emp.full_name}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider border border-transparent dark:border-white/5"
                        style={{ 
                          background: `${ROLE_COLORS[emp.role] || '#6366f1'}15`, 
                          color: ROLE_COLORS[emp.role] || '#6366f1'
                        }}>
                        <Shield className="w-3 h-3" />
                        {ROLE_LABELS[emp.role] || emp.role}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-350 font-bold">
                        <Building2 className="w-3.5 h-3.5 text-slate-350 dark:text-slate-500" />
                        {emp.subsidiary_name || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm text-slate-700 dark:text-slate-300 font-bold">{emp.department || '—'}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-0.5">{emp.job_title || ''}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">{emp.phone || '—'}</p>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEdit(emp)} title="Edit"
                          className="w-8 h-8 flex items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-550 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {emp.id !== currentUser.id && (
                          <button onClick={() => setResetUser(emp)} title="Reset Password"
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-550 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors">
                            <Key className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {(isSuperAdmin || (isSubAdmin && Number(emp.subsidiary_id) === Number(currentUser.subsidiary_id))) && emp.id !== currentUser.id && (
                          <button onClick={() => setDeleteUser(emp)} title="Deactivate"
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 dark:bg-red-950/30 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARDS */}
          <div className="block md:hidden p-4 space-y-4 bg-slate-50/10 dark:bg-slate-900/10">
            {loading ? (
              <div className="text-center py-16 text-slate-400 dark:text-slate-500 text-sm font-medium animate-pulse">Loading employees…</div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-slate-400 dark:text-slate-500 text-sm font-medium">No employees found</div>
            ) : (
              filtered.map((emp) => (
                <div key={emp.id} className="bg-white dark:bg-[#131B2E] border border-slate-100 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden shrink-0 shadow-sm border border-slate-100 dark:border-white/10">
                      <img src={emp.profile_pic || `https://ui-avatars.com/api/?name=${emp.full_name}&background=C8102E&color=fff&bold=true`}
                        className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-800 dark:text-white leading-tight">{emp.full_name}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">{emp.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 border border-transparent dark:border-white/5"
                      style={{ 
                        background: `${
                          emp.role === 'sub_admin' && emp.department?.toLowerCase() === 'it' 
                            ? '#3b82f6' 
                            : emp.role === 'sub_admin' && emp.department?.toLowerCase() === 'hr' 
                            ? '#ec4899' 
                            : ROLE_COLORS[emp.role]
                        }15`, 
                        color: emp.role === 'sub_admin' && emp.department?.toLowerCase() === 'it' 
                          ? '#3b82f6' 
                          : emp.role === 'sub_admin' && emp.department?.toLowerCase() === 'hr' 
                          ? '#ec4899' 
                          : ROLE_COLORS[emp.role] 
                      }}>
                      <Shield className="w-2.5 h-2.5" /> 
                      {emp.role === 'sub_admin' && emp.department?.toLowerCase() === 'it' 
                        ? 'IT Admin' 
                        : emp.role === 'sub_admin' && emp.department?.toLowerCase() === 'hr' 
                        ? 'HR Admin' 
                        : ROLE_LABELS[emp.role]}
                    </span>
                    <span className="px-2.5 py-1 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-lg text-[9px] font-black text-slate-655 dark:text-slate-350 uppercase tracking-widest flex items-center gap-1"><Building2 className="w-3 h-3 text-slate-400 dark:text-slate-500"/> {emp.subsidiary_name || 'Global'}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-slate-50 dark:border-white/5">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-slate-700 dark:text-slate-300">{emp.department || '—'}</p>
                      <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">{emp.job_title || ''}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openEdit(emp)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10"><Edit2 className="w-3.5 h-3.5"/></button>
                      {emp.id !== currentUser.id && (
                        <button onClick={() => setResetUser(emp)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 text-amber-550 hover:bg-slate-100 dark:hover:bg-white/10"><Key className="w-3.5 h-3.5"/></button>
                      )}
                      {(isSuperAdmin || (isSubAdmin && Number(emp.subsidiary_id) === Number(currentUser.subsidiary_id))) && emp.id !== currentUser.id && (
                        <button onClick={() => setDeleteUser(emp)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 text-red-500 hover:bg-slate-100 dark:hover:bg-white/10"><Trash2 className="w-3.5 h-3.5"/></button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>

      {/* ── ADD MODAL ── */}
      <AnimatePresence>
        {showAdd && (
          <Modal title="Add New Employee" onClose={() => setShowAdd(false)}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Full Name"><Input placeholder="Full name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></Field>
                <Field label="Email"><Input type="email" placeholder="Email address" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Password"><Input type="password" placeholder="Temp password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></Field>
                <Field label="Role">
                  <Select 
                    value={form.role} 
                    onChange={e => {
                      const val = e.target.value;
                      if (val === 'it_admin' || val === 'it_staff') {
                        setForm({ ...form, role: val, department: 'IT' });
                      } else if (val === 'hr_admin' || val === 'hr_staff') {
                        setForm({ ...form, role: val, department: 'HR' });
                      } else {
                        setForm({ ...form, role: val });
                      }
                    }}
                  >
                    {ROLES.filter(r => !isSubAdmin || r !== 'super_admin').map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </Select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Subsidiary">
                  {isSubAdmin ? (
                    <div className="w-full px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 text-xs">
                      <Building2 className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                      <span>{currentUser.subsidiary_name || 'My Entity'}</span>
                    </div>
                  ) : (
                    <Select value={form.subsidiary_id} onChange={e => setForm({ ...form, subsidiary_id: e.target.value })}>
                      <option value="">— None —</option>
                      {subsidiaries.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Select>
                  )}
                </Field>
                <Field label="Department"><Input placeholder="Department" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Job Title"><Input placeholder="Job title" value={form.job_title} onChange={e => setForm({ ...form, job_title: e.target.value })} /></Field>
                <Field label="Phone"><Input placeholder="Phone number" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Employee ID"><Input placeholder="e.g. GS-001" value={form.employee_no} onChange={e => setForm({ ...form, employee_no: e.target.value })} /></Field>
                <Field label="NIC Number"><Input placeholder="e.g. 199012345678" value={form.nic_number} onChange={e => setForm({ ...form, nic_number: e.target.value })} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Date of Birth"><Input type="date" value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} /></Field>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowAdd(false)} className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-white/10 text-sm font-black text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">Cancel</button>
                <button onClick={handleAdd} disabled={saving} className="flex-1 py-3 rounded-2xl bg-brand-red text-white text-sm font-black shadow-lg hover:bg-brand-red/90 transition-all disabled:opacity-60">
                  {saving ? 'Adding…' : 'Add Employee'}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ── EDIT MODAL ── */}
      <AnimatePresence>
        {editUser && (
          <Modal title={`Edit — ${editUser.full_name}`} onClose={() => setEditUser(null)}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Full Name"><Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></Field>
                <Field label="Email"><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Role">
                  <Select 
                    value={form.role} 
                    onChange={e => {
                      const val = e.target.value;
                      if (val === 'it_admin' || val === 'it_staff') {
                        setForm({ ...form, role: val, department: 'IT' });
                      } else if (val === 'hr_admin' || val === 'hr_staff') {
                        setForm({ ...form, role: val, department: 'HR' });
                      } else {
                        setForm({ ...form, role: val });
                      }
                    }}
                    disabled={(!isSuperAdmin && !isSubAdmin) || form.role === 'super_admin'}
                  >
                    {ROLES.filter(r => !isSubAdmin || r !== 'super_admin').map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </Select>
                </Field>
                <Field label="Subsidiary">
                  {isSubAdmin ? (
                    <div className="w-full px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 text-xs">
                      <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{currentUser.subsidiary_name || 'My Entity'}</span>
                    </div>
                  ) : (
                    <Select value={form.subsidiary_id} onChange={e => setForm({ ...form, subsidiary_id: e.target.value })}>
                      <option value="">— None —</option>
                      {subsidiaries.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </Select>
                  )}
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Department"><Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /></Field>
                <Field label="Job Title"><Input value={form.job_title} onChange={e => setForm({ ...form, job_title: e.target.value })} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Phone"><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></Field>
                <Field label="Date of Birth"><Input type="date" value={form.date_of_birth} onChange={e => setForm({ ...form, date_of_birth: e.target.value })} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Employee ID"><Input placeholder="e.g. GS-001" value={form.employee_no || ''} onChange={e => setForm({ ...form, employee_no: e.target.value })} /></Field>
                <Field label="NIC Number"><Input placeholder="e.g. 199012345678" value={form.nic_number || ''} onChange={e => setForm({ ...form, nic_number: e.target.value })} /></Field>
              </div>
              {!isSuperAdmin && !isSubAdmin && (
                <p className="text-xs text-amber-500 font-medium flex items-center gap-1.5"><Shield className="w-3 h-3" /> Role changes require Admin access</p>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditUser(null)} className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-white/10 text-sm font-black text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">Cancel</button>
                <button onClick={handleEdit} disabled={saving} className="flex-1 py-3 rounded-2xl bg-indigo-600 text-white text-sm font-black shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-60">
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ── DELETE CONFIRM ── */}
      <AnimatePresence>
        {deleteUser && (
          <Modal title="Deactivate Employee" onClose={() => setDeleteUser(null)}>
            <div className="space-y-5">
              <div className="flex items-center gap-4 p-4 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-900/30">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800 dark:text-white">Are you sure you want to deactivate</p>
                  <p className="text-sm font-black text-red-655 dark:text-red-400">{deleteUser.full_name}?</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">This will revoke their access immediately.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setDeleteUser(null)} className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-white/10 text-sm font-black text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">Cancel</button>
                <button onClick={handleDelete} className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-sm font-black shadow-lg hover:bg-red-600 transition-all">
                  Deactivate
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* ── RESET PASSWORD CONFIRM ── */}
      <AnimatePresence>
        {resetUser && (
          <Modal title="Reset Password" onClose={() => setResetUser(null)}>
            <div className="space-y-5">
              <div className="flex items-center gap-4 p-4 bg-amber-50 dark:bg-amber-950/20 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                  <Key className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-800 dark:text-white">Reset password for</p>
                  <p className="text-sm font-black text-amber-600 dark:text-amber-400">{resetUser.full_name}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Temporary password will be set to <span className="font-black text-slate-600 dark:text-slate-300">GS@2026</span>. They will be prompted to change it on next login.</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setResetUser(null)} className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-white/10 text-sm font-black text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">Cancel</button>
                <button onClick={handleReset} disabled={saving} className="flex-1 py-3 rounded-2xl bg-amber-500 text-white text-sm font-black shadow-lg hover:bg-amber-655 transition-all disabled:opacity-60">
                  {saving ? 'Resetting…' : 'Reset Password'}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>

    </div>
  );
}
