import { useState, useEffect, useMemo } from 'react';
import AdminPageHeader from '../components/AdminPageHeader';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Search, Plus, Edit2, Trash2, Key, X, Check,
  ChevronDown, Building2, Shield, UserCheck, AlertTriangle, RefreshCw,
  ChevronLeft, ChevronRight, Cloud, CloudRain, Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const API = 'http://localhost:5000/api';

const ROLES = ['superadmin', 'groupadmin', 'subadmin', 'employee'];
const ROLE_LABELS = { 
  superadmin: 'Super Admin', 
  groupadmin: 'Group Admin', 
  subadmin: 'Sub Admin', 
  employee: 'Employee',
  super_admin: 'Super Admin',
  group_admin: 'Group Admin',
  sub_admin: 'Sub Admin'
};
const ROLE_COLORS = { 
  superadmin: '#C41230', 
  groupadmin: '#9E0E27', 
  subadmin: '#f59e0b', 
  employee: '#6366f1',
  super_admin: '#C41230',
  group_admin: '#9E0E27',
  sub_admin: '#f59e0b'
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
  const isSuperAdmin = currentUser?.role === 'superadmin' || currentUser?.role === 'super_admin';
  const isGroupAdmin = currentUser?.role === 'groupadmin' || currentUser?.role === 'group_admin';
  const isSuperOrGroupAdmin = isSuperAdmin || isGroupAdmin;
  const isSubAdmin = currentUser?.role === 'subadmin' || currentUser?.role === 'sub_admin';

  const [employees, setEmployees] = useState([]);
  const [subsidiaries, setSubsidiaries] = useState([]);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [filterSub, setFilterSub] = useState('All');
  const [loading, setLoading] = useState(true);
  const [syncingAzure, setSyncingAzure] = useState(false);

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
    setTimeout(() => setToast(null), 3500);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const usersUrl = isSubAdmin 
        ? `${API}/users?subsidiaryId=${currentUser.subsidiary_id}&role=${currentUser.role}&user_subsidiary_id=${currentUser.subsidiary_id}` 
        : `${API}/users`;
      const [empRes, subRes] = await Promise.all([
        fetch(usersUrl),
        fetch(`${API}/subsidiaries`)
      ]);
      setEmployees(await empRes.json());
      setSubsidiaries(await subRes.json());
    } catch { 
      showToast('Failed to load data', 'error'); 
    }
    setLoading(false);
  };

  useEffect(() => {
    if (currentUser) {
      fetchData();
      setForm(getInitialForm());
    }
  }, [currentUser]);

  // ── AZURE AD SYNC HANDLER ──────────────────────────────
  const handleAzureSync = async () => {
    setSyncingAzure(true);
    try {
      const payload = isSubAdmin ? {
        subsidiary_id: currentUser?.subsidiary_id,
        role: currentUser?.role
      } : {
        role: currentUser?.role
      };

      const res = await axios.post(`${API}/users/office365/sync`, payload);
      showToast(res.data.message || 'Azure synchronization complete!');
      fetchData();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to sync with Azure Active Directory', 'error');
    } finally {
      setSyncingAzure(false);
    }
  };

  // ── FILTERED LIST ──────────────────────────────────────
  const filtered = employees.filter(e => {
    const matchSearch = e.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      e.email?.toLowerCase().includes(search.toLowerCase()) ||
      e.department?.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'All'
      ? true
      : e.role?.replace('_', '') === filterRole.replace('_', '');
    const matchSub = filterSub === 'All' || e.subsidiary_name === filterSub;
    return matchSearch && matchRole && matchSub;
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterRole, filterSub]);

  const totalPages = useMemo(() => {
    return Math.ceil(filtered.length / itemsPerPage);
  }, [filtered.length]);

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);

  const subNames = [...new Set(employees.map(e => e.subsidiary_name).filter(Boolean))];

  // ── HANDLERS ──────────────────────────────────────────
  const handleAdd = async () => {
    if (!form.full_name || !form.email || !form.password) return showToast('Name, email and password are required', 'error');
    setSaving(true);
    try {
      const payload = {
        ...form,
        creator_role: currentUser?.role,
        creator_subsidiary_id: currentUser?.subsidiary_id
      };
      const res = await fetch(`${API}/users`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast('Employee added successfully');
      setShowAdd(false);
      setForm(getInitialForm());
      fetchData();
    } catch (err) { 
      showToast(err.message || 'Failed to add employee', 'error'); 
    }
    setSaving(false);
  };

  const handleEdit = async () => {
    setSaving(true);
    try {
      const payload = {
        ...form,
        creator_role: currentUser?.role,
        creator_subsidiary_id: currentUser?.subsidiary_id
      };
      const res = await fetch(`${API}/users/${editUser.id}`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update');
      showToast('Employee updated successfully');
      setEditUser(null);
      fetchData();
    } catch (err) { 
      showToast(err.message, 'error'); 
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`${API}/users/${deleteUser.id}?creator_role=${currentUser?.role}&creator_subsidiary_id=${currentUser?.subsidiary_id}`, { 
        method: 'DELETE' 
      });
      if (!res.ok) throw new Error('Failed to deactivate');
      showToast('Employee deactivated');
      setDeleteUser(null);
      fetchData();
    } catch (e) { 
      showToast(e.message || 'Failed to deactivate', 'error'); 
    }
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/users/${resetUser.id}/reset-password`, { 
        method: 'PATCH', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ 
          newPassword: 'GS@2026',
          creator_role: currentUser?.role,
          creator_subsidiary_id: currentUser?.subsidiary_id
        }) 
      });
      if (!res.ok) throw new Error('Failed to reset password');
      showToast('Password reset to GS@2026');
      setResetUser(null);
    } catch (err) { 
      showToast(err.message || 'Failed to reset password', 'error'); 
    }
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
    { label: isSubAdmin ? `${currentUser?.subsidiary_name || 'Subsidiary'} Staff` : 'Total Employees', value: employees.length, color: '#6366f1', gradient: 'from-indigo-500 to-blue-600' },
    { label: 'Azure 365 Synced', value: employees.filter(e => e.is_synced === 1 || e.is_synced === true).length, color: '#0078d4', gradient: 'from-blue-500 to-sky-600' },
    { label: 'Manual Accounts', value: employees.filter(e => !e.is_synced).length, color: '#f59e0b', gradient: 'from-amber-500 to-yellow-650' },
    { label: isSubAdmin ? 'Sub Admins' : 'Administrators', value: employees.filter(e => e.role === 'superadmin' || e.role === 'super_admin' || e.role === 'groupadmin' || e.role === 'group_admin' || e.role === 'subadmin' || e.role === 'sub_admin').length, color: '#C41230', gradient: 'from-red-500 to-rose-600' }
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

      <AdminPageHeader
        icon={Users}
        title={isSubAdmin ? `${currentUser?.subsidiary_name || 'Subsidiary'} Employee Manager` : 'Employee Manager'}
        description={
          isSubAdmin
            ? `Manage employee profiles, credentials, and Azure Active Directory sync for ${currentUser?.subsidiary_name || 'your subsidiary'}.`
            : 'Manage corporate employees, department assignments and access roles across group entities.'
        }
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleAzureSync}
              disabled={syncingAzure}
              className="bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-white px-3.5 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
              title="Sync employees from Microsoft Azure Active Directory"
            >
              <Cloud className={`w-4 h-4 text-blue-500 ${syncingAzure ? 'animate-bounce' : ''}`} />
              <span>{syncingAzure ? 'Syncing...' : isSubAdmin ? 'Sync Azure Staff' : 'Sync All Azure'}</span>
            </button>

            <button 
              onClick={() => { setForm(getInitialForm()); setShowAdd(true); }}
              className="bg-brand-red hover:bg-[#a50f28] text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" /> Add Employee
            </button>
          </div>
        }
      />

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
              {ROLES.filter(r => !isSubAdmin || r === 'employee' || r === 'subadmin').map(r => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
            {isSuperOrGroupAdmin && (
              <select value={filterSub} onChange={e => setFilterSub(e.target.value)}
                className="flex-1 lg:flex-none px-4 py-2.5 bg-slate-50 dark:bg-[#131B2E] border border-slate-100 dark:border-white/10 rounded-xl text-sm font-bold text-slate-700 dark:text-white outline-none focus:ring-4 focus:ring-brand-red/5 cursor-pointer">
                <option value="All">All Subsidiaries</option>
                {subNames.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
            <button onClick={fetchData} className="p-2.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all text-slate-400 hover:text-slate-700 dark:hover:text-white shrink-0 cursor-pointer" title="Refresh list">
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
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-16 text-slate-400 dark:text-slate-500 font-bold text-sm">
                      No employee profiles found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((emp) => {
                    const normalizedRole = emp.role ? emp.role.replace('_', '') : 'employee';
                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/60 dark:hover:bg-white/5 transition-colors group">
                        {/* Employee Name & Email */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center font-black text-slate-600 dark:text-white uppercase text-xs shrink-0 overflow-hidden shadow-sm">
                              {emp.profile_pic ? (
                                <img src={emp.profile_pic} alt="" className="w-full h-full object-cover" />
                              ) : (
                                emp.full_name?.charAt(0) || 'U'
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-black text-slate-800 dark:text-white truncate group-hover:text-brand-red transition-colors">
                                {emp.full_name}
                              </p>
                              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 truncate">
                                {emp.email}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-6 py-4">
                          <span 
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm"
                            style={{ 
                              backgroundColor: `${ROLE_COLORS[emp.role] || '#6366f1'}15`,
                              color: ROLE_COLORS[emp.role] || '#6366f1',
                              border: `1px solid ${ROLE_COLORS[emp.role] || '#6366f1'}30`
                            }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ROLE_COLORS[emp.role] || '#6366f1' }} />
                            {ROLE_LABELS[emp.role] || emp.role}
                          </span>
                        </td>

                        {/* Subsidiary */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[180px]">{emp.subsidiary_name || 'Group Wide'}</span>
                          </div>
                        </td>

                        {/* Department & Title */}
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">{emp.department || '—'}</p>
                          <p className="text-[10px] font-medium text-slate-400 truncate">{emp.job_title || 'Employee'}</p>
                        </td>

                        {/* Contact */}
                        <td className="px-6 py-4">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{emp.phone || '—'}</p>
                          {emp.is_synced ? (
                            <span className="text-[9px] font-black text-blue-500 uppercase tracking-wider flex items-center gap-1 mt-0.5">
                              <Cloud className="w-3 h-3" /> Azure AD
                            </span>
                          ) : (
                            <span className="text-[9px] font-black text-amber-500 uppercase tracking-wider flex items-center gap-1 mt-0.5">
                              <UserCheck className="w-3 h-3" /> Manual
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEdit(emp)}
                              className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                              title="Edit Employee"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setResetUser(emp)}
                              className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-slate-500 hover:text-amber-600 transition-colors cursor-pointer"
                              title="Reset Password"
                            >
                              <Key className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeleteUser(emp)}
                              className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Deactivate Profile"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* MOBILE VIEW CARDS */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-white/5">
            {paginated.map((emp) => (
              <div key={emp.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/10 flex items-center justify-center font-black text-slate-600 dark:text-white uppercase text-xs shrink-0">
                      {emp.full_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-800 dark:text-white">{emp.full_name}</p>
                      <p className="text-xs text-slate-400">{emp.email}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider"
                    style={{ backgroundColor: `${ROLE_COLORS[emp.role] || '#6366f1'}15`, color: ROLE_COLORS[emp.role] || '#6366f1' }}>
                    {ROLE_LABELS[emp.role] || emp.role}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span>{emp.subsidiary_name || 'Group'}</span>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(emp)} className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setResetUser(emp)} className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300"><Key className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setDeleteUser(emp)} className="p-1.5 rounded-lg bg-slate-100 dark:bg-white/5 text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Page {currentPage} of {totalPages}</span>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}

        </div>

      {/* ── ADD MODAL ── */}
      <AnimatePresence>
        {showAdd && (
          <Modal title={isSubAdmin ? `Add Employee — ${currentUser?.subsidiary_name || 'My Subsidiary'}` : "Add New Employee"} onClose={() => setShowAdd(false)}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Full Name"><Input placeholder="Full name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></Field>
                <Field label="Email"><Input type="email" placeholder="Email address" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Password"><Input type="password" placeholder="Temp password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></Field>
                <Field label="Role">
                  {isSubAdmin ? (
                    <div className="w-full px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-700 dark:text-white font-semibold flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Employee (Standard Access)</span>
                    </div>
                  ) : (
                    <Select 
                      value={form.role} 
                      onChange={e => setForm({ ...form, role: e.target.value })}
                    >
                      {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </Select>
                  )}
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Subsidiary">
                  {isSubAdmin ? (
                    <div className="w-full px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 text-xs">
                      <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{currentUser.subsidiary_name || 'My Subsidiary'}</span>
                    </div>
                  ) : (
                    <Select value={form.subsidiary_id} onChange={e => setForm({ ...form, subsidiary_id: e.target.value })}>
                      <option value="">— None (Group) —</option>
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
                <button onClick={() => setShowAdd(false)} className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-white/10 text-sm font-black text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer">Cancel</button>
                <button onClick={handleAdd} disabled={saving} className="flex-1 py-3 rounded-2xl bg-brand-red text-white text-sm font-black shadow-lg hover:bg-brand-red/90 transition-all disabled:opacity-60 cursor-pointer">
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
          <Modal title={`Edit Profile — ${editUser.full_name}`} onClose={() => setEditUser(null)}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Full Name"><Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></Field>
                <Field label="Email"><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Role">
                  {isSubAdmin ? (
                    <div className="w-full px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-700 dark:text-white font-semibold">
                      <span>{ROLE_LABELS[form.role] || form.role}</span>
                    </div>
                  ) : (
                    <Select 
                      value={form.role} 
                      onChange={e => setForm({ ...form, role: e.target.value })}
                    >
                      {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </Select>
                  )}
                </Field>
                <Field label="Subsidiary">
                  {isSubAdmin ? (
                    <div className="w-full px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 text-xs">
                      <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{currentUser.subsidiary_name || 'My Subsidiary'}</span>
                    </div>
                  ) : (
                    <Select value={form.subsidiary_id} onChange={e => setForm({ ...form, subsidiary_id: e.target.value })}>
                      <option value="">— None (Group) —</option>
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
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditUser(null)} className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-white/10 text-sm font-black text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer">Cancel</button>
                <button onClick={handleEdit} disabled={saving} className="flex-1 py-3 rounded-2xl bg-indigo-600 text-white text-sm font-black shadow-lg hover:bg-indigo-700 transition-all disabled:opacity-60 cursor-pointer">
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
                <button onClick={() => setDeleteUser(null)} className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-white/10 text-sm font-black text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer">Cancel</button>
                <button onClick={handleDelete} className="flex-1 py-3 rounded-2xl bg-red-500 text-white text-sm font-black shadow-lg hover:bg-red-600 transition-all cursor-pointer">
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
                <button onClick={() => setResetUser(null)} className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-white/10 text-sm font-black text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-all cursor-pointer">Cancel</button>
                <button onClick={handleReset} disabled={saving} className="flex-1 py-3 rounded-2xl bg-amber-500 text-white text-sm font-black shadow-lg hover:bg-amber-655 transition-all disabled:opacity-60 cursor-pointer">
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
