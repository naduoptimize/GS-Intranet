import { useState, useEffect } from 'react';
import AdminPageHeader from '../components/AdminPageHeader';
import { 
  Users, Search, UserPlus, Trash2, Edit2, X, Save, Check, AlertCircle, 
  RefreshCw, KeyRound, Shield, Building2, MessageSquare, Calendar, Phone, 
  Mail, Fingerprint, ChevronRight, Briefcase, Lock, UserX, Grid, List, Sparkles, Building
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:5000/api';
const EMPTY_FORM = { 
  full_name: '', 
  email: '', 
  password: '', 
  role: 'employee', 
  subsidiary_id: '', 
  department: '', 
  job_title: '', 
  nic_number: '', 
  employee_no: '',
  date_of_birth: ''
};

const getInitialForm = (isSub, userSubId) => ({ 
  ...EMPTY_FORM, 
  subsidiary_id: isSub ? userSubId : '' 
});

const formatRoleLabel = (r) => {
  if (r === 'superadmin' || r === 'super_admin') return 'Super Admin';
  if (r === 'groupadmin' || r === 'group_admin') return 'Group Admin';
  if (r === 'subadmin' || r === 'sub_admin') return 'Sub Admin';
  return 'Employee';
};

const roleStyle = (r) => {
  if (r === 'superadmin' || r === 'super_admin') return 'bg-red-50 dark:bg-red-950/30 text-brand-red dark:text-red-400 border-red-100 dark:border-red-900/30';
  if (r === 'groupadmin' || r === 'group_admin') return 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-100 dark:border-purple-900/30';
  if (r === 'subadmin' || r === 'sub_admin') return 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/30';
  return 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800';
};

export default function AdminManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isSuperOrGroupAdmin = user?.role === 'superadmin' || user?.role === 'super_admin' || user?.role === 'groupadmin' || user?.role === 'group_admin';
  const isSub = !isSuperOrGroupAdmin;

  const [employees, setEmployees] = useState([]);
  const [subsidiaries, setSubsidiaries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [subFilter, setSubFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [toast, setToast] = useState(null);
  
  // Views
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  // Modals
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [resetId, setResetId] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState({});

  useEffect(() => { 
    if (user) {
      setForm(getInitialForm(isSub, user.subsidiary_id));
    }
    load(); 
  }, [user]);

  async function load() {
    setLoading(true);
    try {
      const params = isSub ? { subsidiaryId: user.subsidiary_id } : {};
      const [u, s, sub] = await Promise.all([
        axios.get(`${API}/users`, { params }),
        axios.get(`${API}/analytics/stats`, { params }),
        axios.get(`${API}/subsidiaries`)
      ]);
      setEmployees(u.data);
      setStats(s.data);
      setSubsidiaries(sub.data);
      if (isSub) setForm(f => ({ ...f, subsidiary_id: user.subsidiary_id }));
    } catch { 
      showToast('Failed to load employee directory data', 'error'); 
    } finally { 
      setLoading(false); 
    }
  }

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  const highlightText = (text, searchWord) => {
    if (!searchWord) return <span>{text || '—'}</span>;
    const textStr = String(text || '');
    const parts = textStr.split(new RegExp(`(${searchWord.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === searchWord.toLowerCase()
            ? <mark key={i} className="bg-brand-red/25 dark:bg-brand-red/45 text-brand-red dark:text-red-400 font-extrabold rounded px-0.5">{part}</mark>
            : part
        )}
      </span>
    );
  };

  async function handleAdd(e) {
    e.preventDefault(); 
    setSubmitting(true);
    try {
      await axios.post(`${API}/users`, {
        ...form,
        creator_role: user?.role,
        creator_subsidiary_id: user?.subsidiary_id
      });
      showToast('Employee registered successfully ✓');
      setAddModal(false); 
      setForm(getInitialForm(isSub, user?.subsidiary_id)); 
      load();
    } catch(err) { 
      showToast(err.response?.data?.message || 'Failed to register', 'error'); 
    } finally { 
      setSubmitting(false); 
    }
  }

  function openEdit(emp) {
    setEditTarget(emp);
    setEditForm({ 
      full_name: emp.full_name || '', 
      email: emp.email || '', 
      role: emp.role || 'employee', 
      subsidiary_id: emp.subsidiary_id || '', 
      department: emp.department || '', 
      job_title: emp.job_title || '', 
      phone: emp.phone || '',
      nic_number: emp.nic_number || '',
      employee_no: emp.employee_no || '',
      date_of_birth: emp.date_of_birth ? emp.date_of_birth.substring(0, 10) : ''
    });
    setEditModal(true);
  }

  async function handleEdit(e) {
    e.preventDefault(); 
    setSubmitting(true);
    try {
      await axios.put(`${API}/users/${editTarget.id}`, {
        ...editForm,
        modifier_role: user?.role,
        modifier_subsidiary_id: user?.subsidiary_id
      });
      showToast('Employee details updated ✓');
      
      // Keep Drawer detail card in sync with updated form state
      if (selectedEmployee?.id === editTarget.id) {
        // Find updated subsidiary name
        const subObj = subsidiaries.find(s => String(s.id) === String(editForm.subsidiary_id));
        setSelectedEmployee(prev => ({
          ...prev,
          ...editForm,
          subsidiary_name: subObj ? subObj.name : prev.subsidiary_name
        }));
      }

      setEditModal(false); 
      load();
    } catch { 
      showToast('Update failed', 'error'); 
    } finally { 
      setSubmitting(false); 
    }
  }

  async function handleDelete() {
    try {
      await axios.delete(`${API}/users/${deleteId}`, {
        params: {
          role: user?.role,
          subsidiary_id: user?.subsidiary_id
        }
      });
      showToast('Employee deactivated successfully');
      if (selectedEmployee?.id === deleteId) {
        setSelectedEmployee(null);
      }
      setDeleteId(null); 
      load();
    } catch { 
      showToast('Deactivation failed', 'error'); 
    }
  }

  async function handleReset() {
    try {
      await axios.patch(`${API}/users/${resetId}/reset-password`, { newPassword: 'GS@2026' });
      showToast('Password reset to GS@2026 ✓');
      setResetId(null);
    } catch { 
      showToast('Reset failed', 'error'); 
    }
  }

  // Extract unique departments for department quick tags filter
  const departmentsList = Array.from(
    new Set(employees.map(e => e.department).filter(Boolean))
  ).sort();

  const filtered = employees.filter(e => {
    const matchSearch = e.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      e.email?.toLowerCase().includes(search.toLowerCase()) ||
      e.subsidiary_name?.toLowerCase().includes(search.toLowerCase()) ||
      e.employee_no?.toLowerCase().includes(search.toLowerCase()) ||
      e.job_title?.toLowerCase().includes(search.toLowerCase());
      
    const matchRole = roleFilter === 'all' ? true : 
      (roleFilter === 'subadmin' ? (e.role === 'subadmin' || e.role === 'sub_admin') :
       roleFilter === 'groupadmin' ? (e.role === 'groupadmin' || e.role === 'group_admin') :
       roleFilter === 'superadmin' ? (e.role === 'superadmin' || e.role === 'super_admin') :
       roleFilter === 'employee' ? (e.role === 'employee' || !e.role) : e.role === roleFilter);
    const matchSub  = !subFilter || String(e.subsidiary_id) === subFilter || e.subsidiary_name === subFilter;
    const matchDept = deptFilter === 'all' ? true : e.department === deptFilter;
    
    return matchSearch && matchRole && matchSub && matchDept;
  });

  const inputCls = "w-full px-5 py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl font-bold text-slate-800 dark:text-white focus:ring-4 focus:ring-brand-red/5 outline-none transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-650";

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] pb-24 transition-colors duration-350 relative overflow-x-hidden">

      {/* TOAST NOTIFICATION */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -24, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: -24, scale: 0.95 }}
            className={`fixed top-8 right-8 z-[250] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-white font-bold text-sm border backdrop-blur-md ${
              toast.type === 'error' 
                ? 'bg-red-500/90 border-red-400/20' 
                : 'bg-emerald-500/90 border-emerald-400/20'
            }`}
          >
            {toast.type === 'error' ? <AlertCircle className="w-5 h-5"/> : <Check className="w-5 h-5"/>}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-6">
        <AdminPageHeader
          icon={Shield}
          title="Employee Control Center"
          description="Orchestrate administrative controls, directory attributes, credentials, subsidiaries, and organizational departments."
        />
      </div>

      {/* MAIN CONTAINER */}
      <div className="mt-6">

        {/* STATS WIDGETS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
          {[
            { label: 'Total Registry', value: stats?.userCount ?? employees.length, icon: Users, color: 'text-brand-red', bg: 'bg-red-500/10', gradient: 'from-brand-red to-rose-600', description: 'Total active database users' },
            { label: isSub ? 'Current Entity' : 'Subsidiaries', value: isSub ? (user?.subsidiary_name || 'Assigned') : subsidiaries.length, icon: Building2, color: 'text-blue-500', bg: 'bg-blue-500/10', gradient: 'from-blue-500 to-indigo-600', description: 'Assigned corporate entities' },
            { label: 'System Admins', value: employees.filter(e => e.role?.includes('admin')).length, icon: Shield, color: 'text-purple-500', bg: 'bg-purple-500/10', gradient: 'from-purple-500 to-indigo-600', description: 'Administrators with elevated scopes' },
            { label: 'Department Sectors', value: departmentsList.length, icon: Sparkles, color: 'text-emerald-500', bg: 'bg-emerald-500/10', gradient: 'from-emerald-500 to-teal-600', description: 'Active workspace departments' },
          ].map((s, idx) => (
            <motion.div 
              key={s.label}
              whileHover={{ y: -4, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="bg-white dark:bg-[#131B2E] rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl p-5 sm:p-6 flex items-center gap-4 relative overflow-hidden group transition-all duration-300"
            >
              {/* Blur Orb Overlay */}
              <div className={`absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br ${s.gradient} rounded-full opacity-10 dark:opacity-20 blur-xl group-hover:opacity-30 transition-opacity duration-300 pointer-events-none`}/>
              
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${s.bg} ${s.color} border border-slate-100 dark:border-white/5 relative z-10`}>
                <s.icon className="w-5.5 h-5.5"/>
              </div>
              <div className="relative z-10 min-w-0">
                <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-none mb-1.5 truncate">{s.value ?? '—'}</p>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1 truncate">{s.label}</p>
                <p className="text-[9px] text-slate-350 dark:text-slate-500 font-medium truncate leading-none">{s.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* PRIMARY CONTROL PLATFORM */}
        <div className="bg-white dark:bg-[#131B2E] rounded-[36px] sm:rounded-[44px] border border-slate-100 dark:border-white/5 shadow-2xl overflow-hidden transition-all duration-300">
          
          {/* Header Bar */}
          <div className="px-6 sm:px-8 py-6 border-b border-slate-50 dark:border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-5 bg-gradient-to-b from-white to-slate-50/20 dark:from-[#131B2E] dark:to-[#111827]/50">
            <div className="flex items-center justify-between lg:justify-start gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase tracking-widest flex items-center gap-2">
                  <span>Employee Registry</span>
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-bold mt-0.5">Control operational users, reset keys, and detail scopes.</p>
              </div>
              <span className="px-3.5 py-1 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-full text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest self-start lg:self-auto">
                {filtered.length} matching
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              
              {/* Main Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-350 dark:text-slate-600"/>
                <input 
                  value={search} 
                  onChange={e=>setSearch(e.target.value)} 
                  placeholder="Search by ID, name, email..."
                  className="pl-11 pr-5 py-3.5 bg-slate-50/80 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl text-sm font-bold text-slate-750 dark:text-white outline-none focus:ring-4 focus:ring-brand-red/5 w-full transition-all duration-200"
                />
              </div>

              {/* View Mode & Actions Grid */}
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                
                {/* View Toggler */}
                <div className="bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 p-1 rounded-2xl flex items-center">
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-xl transition-all cursor-pointer ${
                      viewMode === 'list' 
                        ? 'bg-white dark:bg-white/10 text-brand-red shadow-md' 
                        : 'text-slate-450 hover:text-slate-800 dark:hover:text-white'
                    }`}
                    title="List View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-xl transition-all cursor-pointer ${
                      viewMode === 'grid' 
                        ? 'bg-white dark:bg-white/10 text-brand-red shadow-md' 
                        : 'text-slate-450 hover:text-slate-800 dark:hover:text-white'
                    }`}
                    title="Grid View"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                </div>

                {/* Refresh Trigger */}
                <button 
                  onClick={load} 
                  className="p-3.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl text-slate-400 hover:text-brand-red dark:hover:text-red-400 transition-all flex justify-center items-center cursor-pointer shadow-sm"
                  title="Reload Registry"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}/>
                </button>

                {/* Add Employee Trigger */}
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setAddModal(true)}
                  className="flex items-center justify-center gap-2 bg-brand-red text-white px-5 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-red/90 transition-all shadow-lg shadow-brand-red/20 cursor-pointer border border-transparent flex-1 sm:flex-none"
                >
                  <UserPlus className="w-4.5 h-4.5"/>
                  <span>Add Employee</span>
                </motion.button>

              </div>
            </div>
          </div>

          {/* ADVANCED MULTI-FILTER PANEL */}
          <div className="px-6 sm:px-8 py-5 border-b border-slate-50 dark:border-white/5 flex flex-col gap-4 bg-slate-50/30 dark:bg-[#131B2E]">
            
            {/* Roles pills bar */}
            <div className="flex flex-col gap-2">
              <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[2px] ml-1">Filter by Scope</span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar -mx-6 sm:mx-0 px-6 sm:px-0">
                {[
                  {val:'all',label:'All Scopes'},
                  {val:'employee',label:'Employee'},
                  {val:'subadmin',label:'Sub Admin'},
                  ...(!isSub ? [
                    {val:'groupadmin',label:'Group Admin'},
                    {val:'superadmin',label:'Super Admin'}
                  ] : [])
                ].map(r => (
                  <button 
                    key={r.val} 
                    onClick={() => setRoleFilter(r.val)}
                    className={`px-4 py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest border transition-all duration-200 whitespace-nowrap cursor-pointer ${
                      roleFilter === r.val 
                        ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900 shadow-lg font-bold' 
                        : 'bg-white dark:bg-white/5 border-slate-100 dark:border-white/5 text-slate-500 dark:text-slate-450 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Entity and Department Selectors */}
            <div className="flex flex-wrap items-center gap-3">
              
              {/* Entity selector dropdown (super_admin only) */}
              {!isSub && (
                <div className="relative w-full sm:w-auto min-w-[200px]">
                  <select
                    value={subFilter}
                    onChange={e=>setSubFilter(e.target.value)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl text-[10px] font-black text-slate-600 dark:text-slate-400 outline-none focus:ring-4 focus:ring-brand-red/5 transition-all appearance-none pr-8 cursor-pointer uppercase tracking-wider"
                  >
                    <option value="" className="dark:bg-[#131B2E] dark:text-white">All Corporate Entities</option>
                    {subsidiaries.map(s => (
                      <option key={s.id} value={String(s.id)} className="dark:bg-[#131B2E] dark:text-white">
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                    <svg className="fill-current h-4.5 w-4.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                    </svg>
                  </div>
                </div>
              )}

              {/* Department sector Selector Dropdown */}
              <div className="relative w-full sm:w-auto min-w-[200px]">
                <select
                  value={deptFilter}
                  onChange={e=>setDeptFilter(e.target.value)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl text-[10px] font-black text-slate-600 dark:text-slate-400 outline-none focus:ring-4 focus:ring-brand-red/5 transition-all appearance-none pr-8 cursor-pointer uppercase tracking-wider"
                >
                  <option value="all" className="dark:bg-[#131B2E] dark:text-white">All Departments</option>
                  {departmentsList.map(dept => (
                    <option key={dept} value={dept} className="dark:bg-[#131B2E] dark:text-white">
                      {dept}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                  <svg className="fill-current h-4.5 w-4.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                  </svg>
                </div>
              </div>

              {/* Clear filters button */}
              {(roleFilter !== 'all' || subFilter || deptFilter !== 'all' || search) && (
                <button 
                  onClick={() => { setRoleFilter('all'); setSubFilter(''); setDeptFilter('all'); setSearch(''); }}
                  className="px-4 py-2 text-[10px] font-black text-brand-red uppercase tracking-widest hover:underline transition-all cursor-pointer ml-auto sm:ml-0"
                >
                  Reset Active Filters
                </button>
              )}

              <span className="ml-auto text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden lg:block">
                Query returned {filtered.length} of {employees.length} entries
              </span>
            </div>

          </div>

          {/* VIEW: HIGH END LIST VIEW TABLE */}
          {viewMode === 'list' && (
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-white/2 border-b border-slate-50 dark:border-white/5">
                    {['Employee Info','Corporate Subsidiary','Department Sector','Credential Status','Actions'].map(h => (
                      <th 
                        key={h} 
                        className={`px-8 py-5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[1.5px] ${
                          h === 'Actions' ? 'text-right' : ''
                        }`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3.5">
                            <div className="w-11 h-11 bg-slate-100 dark:bg-white/5 rounded-2xl"/>
                            <div className="space-y-2">
                              <div className="h-3.5 bg-slate-100 dark:bg-white/5 rounded w-36"/>
                              <div className="h-2.5 bg-slate-100 dark:bg-white/5 rounded w-28"/>
                            </div>
                          </div>
                        </td>
                        {[1, 2, 3].map(j => (
                          <td key={j} className="px-8 py-6">
                            <div className="h-3.5 bg-slate-100 dark:bg-white/5 rounded w-24"/>
                          </td>
                        ))}
                        <td className="px-8 py-6">
                          <div className="flex justify-end gap-2">
                            <div className="w-9 h-9 bg-slate-100 dark:bg-white/5 rounded-xl"/>
                            <div className="w-9 h-9 bg-slate-100 dark:bg-white/5 rounded-xl"/>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-8 py-16 text-center">
                        <Users className="w-12 h-12 text-slate-300 dark:text-slate-650 mx-auto mb-3.5" />
                        <p className="text-slate-400 dark:text-slate-500 font-bold text-sm">No employees match the active filters or search terms.</p>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((emp, idx) => (
                      <motion.tr 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(idx * 0.02, 0.4) }}
                        key={emp.id} 
                        onClick={() => setSelectedEmployee(emp)}
                        className={`hover:bg-slate-50/50 dark:hover:bg-white/5/60 transition-colors group cursor-pointer ${
                          selectedEmployee?.id === emp.id ? 'bg-red-500/5 dark:bg-brand-red/5' : ''
                        }`}
                      >
                        {/* Profile Block */}
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-3.5">
                            <img 
                              src={emp.profile_pic || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.full_name)}&background=f1f5f9&color=64748b&bold=true`}
                              alt={emp.full_name} 
                              className="w-11 h-11 rounded-[14px] object-cover border border-slate-100 dark:border-white/5 shadow-sm shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-black text-slate-800 dark:text-white group-hover:text-brand-red dark:group-hover:text-brand-red transition-colors truncate">
                                {highlightText(emp.full_name, search)}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5 min-w-0">
                                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono tracking-wider shrink-0 bg-slate-50 dark:bg-white/5 px-1.5 py-0.5 rounded border border-slate-100 dark:border-white/5">
                                  {emp.employee_no || 'NO ID'}
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">
                                  {highlightText(emp.email, search)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Corporate Subsidiary */}
                        <td className="px-8 py-5">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 truncate max-w-[180px]">
                              {highlightText(emp.subsidiary_name, search)}
                            </span>
                            {emp.job_title && (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-[180px]">
                                {emp.job_title}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Department Sector */}
                        <td className="px-8 py-5">
                          <span className="text-xs font-black text-slate-500 dark:text-slate-450 uppercase tracking-wider">
                            {emp.department || 'Unassigned'}
                          </span>
                        </td>

                        {/* Credential Scope */}
                        <td className="px-8 py-5">
                          <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border shrink-0 ${roleStyle(emp.role)}`}>
                            {formatRoleLabel(emp.role)}
                          </span>
                        </td>

                        {/* Inline Registry Actions */}
                        <td className="px-8 py-5" onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1.5 opacity-40 group-hover:opacity-100 transition-opacity duration-200">
                            <button 
                              onClick={() => openEdit(emp)} 
                              title="Edit Profile" 
                              className="p-2 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:border-indigo-100 dark:hover:border-indigo-900/40 transition-all cursor-pointer"
                            >
                              <Edit2 className="w-4 h-4"/>
                            </button>
                            {emp.id !== user.id && (
                              <>
                                <button 
                                  onClick={() => setResetId(emp.id)} 
                                  title="Reset Password Key" 
                                  className="p-2 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-450 hover:bg-amber-50 dark:hover:bg-amber-950/20 hover:border-amber-100 dark:hover:border-amber-900/40 transition-all cursor-pointer"
                                >
                                  <KeyRound className="w-4 h-4"/>
                                </button>
                                <button 
                                  onClick={() => setDeleteId(emp.id)} 
                                  title="Deactivate Account" 
                                  className="p-2 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl text-slate-400 dark:text-slate-500 hover:text-brand-red dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-100 dark:hover:border-red-900/40 transition-all cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4"/>
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* VIEW: HIGH END GRID VIEW */}
          {viewMode === 'grid' && (
            <div className="p-6 bg-slate-50/10 dark:bg-white/1">
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="animate-pulse bg-white dark:bg-[#131B2E] border border-slate-100 dark:border-white/5 rounded-3xl p-6 h-52 space-y-4 shadow-sm"/>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-16 text-center">
                  <Users className="w-12 h-12 text-slate-300 dark:text-slate-650 mx-auto mb-3.5" />
                  <p className="text-slate-400 dark:text-slate-500 font-bold text-sm">No employees match the active filters or search terms.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filtered.map((emp, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: Math.min(idx * 0.02, 0.4) }}
                      key={emp.id}
                      onClick={() => setSelectedEmployee(emp)}
                      className={`bg-white dark:bg-[#131B2E] border rounded-[28px] p-5 shadow-sm hover:shadow-xl hover:border-slate-200 dark:hover:border-white/10 transition-all duration-300 cursor-pointer relative overflow-hidden group flex flex-col justify-between ${
                        selectedEmployee?.id === emp.id ? 'border-brand-red ring-2 ring-brand-red/10' : 'border-slate-100 dark:border-white/5'
                      }`}
                    >
                      {/* Grid Item Header */}
                      <div className="flex items-start gap-3.5">
                        <img 
                          src={emp.profile_pic || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.full_name)}&background=f1f5f9&color=64748b&bold=true`}
                          alt={emp.full_name} 
                          className="w-12 h-12 rounded-2xl object-cover border border-slate-100 dark:border-white/5 shadow-sm shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-800 dark:text-white group-hover:text-brand-red dark:group-hover:text-brand-red transition-colors truncate">
                            {highlightText(emp.full_name, search)}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold truncate mt-0.5">
                            {emp.job_title || 'Employee'}
                          </p>
                        </div>
                      </div>

                      {/* Info lines */}
                      <div className="space-y-2 mt-4 pt-3.5 border-t border-slate-50 dark:border-white/5 text-[11px]">
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Entity</span>
                          <span className="font-bold text-slate-600 dark:text-slate-450 truncate max-w-[150px]">
                            {highlightText(emp.subsidiary_name, search)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Sector</span>
                          <span className="font-bold text-slate-600 dark:text-slate-450 uppercase tracking-widest text-[10px]">
                            {emp.department || 'Unassigned'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Scope</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border shrink-0 ${roleStyle(emp.role)}`}>
                            {formatRoleLabel(emp.role)}</span>
                        </div>
                      </div>

                      {/* Actions Footer */}
                      <div 
                        className="flex items-center justify-between mt-4 pt-3.5 border-t border-slate-50 dark:border-white/5"
                        onClick={e => e.stopPropagation()}
                      >
                        <span className="text-[9px] font-mono font-bold text-slate-400 dark:text-slate-500">
                          {emp.employee_no || 'NO ID'}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => openEdit(emp)} 
                            title="Edit Profile"
                            className="p-2 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl text-slate-400 hover:text-indigo-650 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 transition-all cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {emp.id !== user.id && (
                            <>
                              <button 
                                onClick={() => setResetId(emp.id)} 
                                title="Reset Password"
                                className="p-2 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl text-slate-400 hover:text-amber-600 dark:hover:text-amber-450 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all cursor-pointer"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => setDeleteId(emp.id)} 
                                title="Deactivate"
                                className="p-2 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl text-slate-400 hover:text-brand-red dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TABLE/GRID MOBILE CONTAINER VIEW (Only shown on small screens) */}
          <div className="block md:hidden grid grid-cols-1 gap-4 p-5 bg-slate-50/10 dark:bg-white/2">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse bg-white dark:bg-[#131B2E] border border-slate-100 dark:border-white/5 rounded-3xl p-5 h-44"/>
              ))
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-[#131B2E] rounded-3xl border border-slate-100 dark:border-white/5 p-6">
                <p className="text-slate-400 dark:text-slate-500 font-bold text-sm">No employees match requirements</p>
              </div>
            ) : (
              filtered.map(emp => (
                <div 
                  key={emp.id} 
                  onClick={() => setSelectedEmployee(emp)}
                  className={`bg-white dark:bg-[#131B2E] border hover:border-slate-200 dark:hover:border-white/10 rounded-3xl p-5 shadow-sm space-y-4 transition-all cursor-pointer relative overflow-hidden group ${
                    selectedEmployee?.id === emp.id ? 'border-brand-red' : 'border-slate-100 dark:border-white/5'
                  }`}
                >
                  {/* Top Block */}
                  <div className="flex items-center gap-3">
                    <img 
                      src={emp.profile_pic || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.full_name)}&background=f1f5f9&color=64748b&bold=true`}
                      alt={emp.full_name} 
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-100 dark:border-white/5"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-800 dark:text-white truncate">{highlightText(emp.full_name, search)}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate">{highlightText(emp.email, search)}</p>
                    </div>
                  </div>

                  {/* Details strip */}
                  <div className="grid grid-cols-2 gap-3 pt-3.5 border-t border-slate-50 dark:border-white/5">
                    <div>
                      <p className="text-[8px] font-black text-slate-400 dark:text-slate-550 uppercase tracking-widest">Subsidiary</p>
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-0.5 truncate max-w-[120px]">{highlightText(emp.subsidiary_name, search)}</p>
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-slate-400 dark:text-slate-555 uppercase tracking-widest">Department</p>
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-0.5 truncate max-w-[120px]">{emp.department || '—'}</p>
                    </div>
                  </div>

                  {/* Actions Bar mobile */}
                  <div 
                    className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-white/5"
                    onClick={e => e.stopPropagation()}
                  >
                    <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${roleStyle(emp.role)}`}>
                      {formatRoleLabel(emp.role)}</span>
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => openEdit(emp)} 
                        title="Edit Details"
                        className="p-2.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl text-slate-400 hover:text-indigo-650 transition-all cursor-pointer"
                      >
                        <Edit2 className="w-4 h-4"/>
                      </button>
                      {emp.id !== user.id && (
                        <>
                          <button 
                            onClick={() => setResetId(emp.id)} 
                            title="Reset Key"
                            className="p-2.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl text-slate-400 hover:text-amber-650 transition-all cursor-pointer"
                          >
                            <KeyRound className="w-4 h-4"/>
                          </button>
                          <button 
                            onClick={() => setDeleteId(emp.id)} 
                            title="Deactivate"
                            className="p-2.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-xl text-slate-405 hover:text-brand-red transition-all cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4"/>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer bar */}
          <div className="px-6 sm:px-8 py-5 bg-slate-50/50 dark:bg-[#131B2E] border-t border-slate-50 dark:border-white/5 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-400 dark:text-slate-500">
              Showing <span className="text-slate-750 dark:text-white font-extrabold">{filtered.length}</span> of <span className="text-slate-750 dark:text-white font-extrabold">{employees.length}</span> employees in George Steuart Group.
            </p>
          </div>

        </div>
      </div>

      {/* ── PROFILE DETAIL DRAWER (RIGHT SLIDING DIALOGUE) ── */}
      <AnimatePresence>
        {selectedEmployee && (
          <>
            {/* Dark blur overlay */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSelectedEmployee(null)} 
              className="fixed inset-0 z-[150] bg-slate-950/40 dark:bg-black/60 backdrop-blur-sm"
            />
            {/* Right slider block */}
            <motion.div 
              initial={{ x: '100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '100%' }} 
              transition={{ type: 'spring', damping: 26, stiffness: 210 }}
              className="fixed top-0 right-0 z-[160] w-full max-w-md h-full bg-white dark:bg-[#0F172A] border-l border-slate-100 dark:border-white/5 shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Cover Gradient Graphic */}
              <div className="relative h-44 bg-gradient-to-br from-brand-red to-rose-700 shrink-0">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white/15 via-transparent to-transparent" />
                <button 
                  onClick={() => setSelectedEmployee(null)} 
                  className="absolute top-6 left-6 p-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white backdrop-blur-md transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Profile Card Container overlay */}
              <div className="px-6 -mt-20 shrink-0 text-center relative z-10">
                <div className="inline-block relative">
                  <img 
                    src={selectedEmployee.profile_pic || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedEmployee.full_name)}&background=f1f5f9&color=64748b&bold=true`}
                    alt={selectedEmployee.full_name} 
                    className="w-28 h-28 rounded-[28px] object-cover border-4 border-white dark:border-[#0F172A] shadow-xl mx-auto"
                  />
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-emerald-500 border-4 border-white dark:border-[#0F172A] flex items-center justify-center" title="Intranet User Active">
                    <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                  </div>
                </div>
                
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-4 tracking-tight leading-tight">
                  {selectedEmployee.full_name}
                </h3>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                  {selectedEmployee.job_title || 'George Steuart Partner'}
                </p>
                
                <div className="mt-3.5 flex items-center justify-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shrink-0 ${roleStyle(selectedEmployee.role)}`}>
                    {formatRoleLabel(selectedEmployee.role)}</span>
                  {selectedEmployee.department && (
                    <span className="px-3 py-1 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-full text-[9px] font-black text-slate-550 dark:text-slate-400 uppercase tracking-widest shrink-0">
                      {selectedEmployee.department}
                    </span>
                  )}
                </div>
              </div>

              {/* Scrollable details wrapper */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 mt-4 pb-12">
                
                {/* Entity Assignment details */}
                <div className="bg-slate-50/60 dark:bg-white/2 border border-slate-100 dark:border-white/5 rounded-[24px] p-5 space-y-3.5">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-brand-red shrink-0" />
                    <div>
                      <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Corporate Subsidiary</p>
                      <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5">
                        {selectedEmployee.subsidiary_name || 'George Steuart Group'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-5 h-5 text-brand-red shrink-0" />
                    <div>
                      <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Sector & Designation</p>
                      <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-0.5">
                        {selectedEmployee.department || 'Unassigned'} · {selectedEmployee.job_title || '—'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Registry IDs & Personal Details */}
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Verification Credentials</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50/40 dark:bg-white/2 border border-slate-100 dark:border-white/5 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Fingerprint className="w-4 h-4 text-slate-400" />
                        <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Employee ID</span>
                      </div>
                      <p className="text-xs font-black text-slate-800 dark:text-white font-mono tracking-wider">
                        {selectedEmployee.employee_no || '—'}
                      </p>
                    </div>
                    <div className="bg-slate-50/40 dark:bg-white/2 border border-slate-100 dark:border-white/5 rounded-2xl p-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Shield className="w-4 h-4 text-slate-400" />
                        <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">NIC Number</span>
                      </div>
                      <p className="text-xs font-black text-slate-800 dark:text-white font-mono tracking-wider">
                        {selectedEmployee.nic_number || '—'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3.5 bg-slate-50/20 dark:bg-white/1 border border-slate-100 dark:border-white/5 rounded-2xl p-3.5">
                      <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[8px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest">Email Address</p>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate select-all">{selectedEmployee.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3.5 bg-slate-50/20 dark:bg-white/1 border border-slate-100 dark:border-white/5 rounded-2xl p-3.5">
                      <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[8px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest">Contact Phone</p>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 select-all">{selectedEmployee.phone || '—'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3.5 bg-slate-50/20 dark:bg-white/1 border border-slate-100 dark:border-white/5 rounded-2xl p-3.5">
                      <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[8px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest">Date of Birth</p>
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                          {selectedEmployee.date_of_birth ? new Date(selectedEmployee.date_of_birth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Operations & Security */}
                <div className="space-y-3.5 pt-4">
                  <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Operational Actions</h4>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => openEdit(selectedEmployee)}
                      className="flex items-center justify-between px-4 py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider hover:bg-indigo-50 hover:border-indigo-100 dark:hover:bg-indigo-950/20 dark:hover:border-indigo-900/30 hover:text-indigo-650 dark:hover:text-indigo-400 transition-all cursor-pointer text-left"
                    >
                      <span>Edit Details</span>
                      <Edit2 className="w-4 h-4" />
                    </button>
                    
                    <button 
                      onClick={() => setResetId(selectedEmployee.id)}
                      className="flex items-center justify-between px-4 py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider hover:bg-amber-50 hover:border-amber-100 dark:hover:bg-amber-950/20 dark:hover:border-amber-900/30 hover:text-amber-600 dark:hover:text-amber-450 transition-all cursor-pointer text-left"
                    >
                      <span>Reset Key</span>
                      <KeyRound className="w-4 h-4" />
                    </button>
                  </div>

                  {selectedEmployee.id !== user.id && (
                    <button 
                      onClick={() => setDeleteId(selectedEmployee.id)}
                      className="w-full flex items-center justify-between px-4 py-3.5 bg-red-50/50 dark:bg-red-950/10 border border-red-100/50 dark:border-red-950/30 rounded-2xl text-xs font-black text-brand-red dark:text-red-400 uppercase tracking-wider hover:bg-brand-red hover:text-white dark:hover:bg-brand-red dark:hover:text-white transition-all cursor-pointer"
                    >
                      <span>Deactivate User</span>
                      <UserX className="w-4 h-4" />
                    </button>
                  )}

                  {/* Dynamic Messaging action */}
                  <button 
                    onClick={() => {
                      navigate('/messages', { state: { directChatUserId: selectedEmployee.id } });
                    }}
                    className="w-full flex items-center justify-center gap-2 px-5 py-4 bg-brand-red text-white rounded-[20px] text-xs font-black uppercase tracking-widest hover:bg-brand-red/90 transition-all shadow-xl shadow-brand-red/20 cursor-pointer border border-transparent"
                  >
                    <MessageSquare className="w-4.5 h-4.5" />
                    <span>Quick Chat Session</span>
                  </button>
                </div>

              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── ADD EMPLOYEE MODAL (SLIDE & GLOW) ── */}
      <AnimatePresence>
        {addModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setAddModal(false)} 
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.93, y: 15 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.93, y: 15 }}
              className="relative w-full max-w-2xl bg-white dark:bg-[#131B2E] rounded-[36px] shadow-2xl overflow-hidden border border-slate-100 dark:border-white/5"
            >
              <div className="p-6 sm:p-8 border-b border-slate-50 dark:border-white/5 flex items-center justify-between bg-slate-50/20 dark:bg-white/1">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase tracking-wider">Add Registry Entry</h3>
                  <p className="text-slate-400 dark:text-slate-500 text-xs font-bold mt-1">Register a new employee member to the George Steuart intranet directory.</p>
                </div>
                <button 
                  onClick={() => setAddModal(false)} 
                  className="p-3 bg-slate-50 dark:bg-white/5 rounded-2xl text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-5 h-5"/>
                </button>
              </div>
              <form onSubmit={handleAdd} className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-4.5 max-h-[60vh] overflow-y-auto">
                {[
                  { label: 'Full Name', key: 'full_name', type: 'text', ph: 'e.g. Dilshan Rodrigo' },
                  { label: 'Email Address', key: 'email', type: 'email', ph: 'e.g. dilshan@gs.com' },
                  { label: 'Registry Password', key: 'password', type: 'password', ph: '••••••••' },
                  { label: 'Employee ID', key: 'employee_no', type: 'text', ph: 'e.g. GS-001' },
                  { label: 'NIC Number', key: 'nic_number', type: 'text', ph: 'e.g. 199012345678' },
                  { label: 'Department Sector', key: 'department', type: 'text', ph: 'e.g. Finance, Marketing, IT' },
                  { label: 'Designation Job Title', key: 'job_title', type: 'text', ph: 'e.g. Software Engineer' },
                  { label: 'Date of Birth', key: 'date_of_birth', type: 'date', ph: '' },
                ].map(f => (
                  <div key={f.key} className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{f.label}</label>
                    <input 
                      required={f.key !== 'date_of_birth'} 
                      type={f.type} 
                      value={form[f.key]} 
                      placeholder={f.ph}
                      onChange={e => setForm({ ...form, [f.key]: e.target.value })} 
                      className={inputCls}
                    />
                  </div>
                ))}
                
                {/* Role dropdown */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">System Scope Role</label>
                  <div className="relative">
                    <select 
                      value={form.role} 
                      onChange={e => setForm({ ...form, role: e.target.value })} 
                      className={inputCls + ' appearance-none cursor-pointer'}
                      disabled={isSub}
                    >
                      <option value="employee" className="dark:bg-[#131B2E] dark:text-white">Employee</option>
                      {!isSub && <option value="subadmin" className="dark:bg-[#131B2E] dark:text-white">Sub Admin</option>}
                      {!isSub && <option value="groupadmin" className="dark:bg-[#131B2E] dark:text-white">Group Admin</option>}
                      {!isSub && <option value="superadmin" className="dark:bg-[#131B2E] dark:text-white">Super Admin</option>}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                </div>

                {/* Subsidiary entity selection */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Corporate Entity</label>
                  {isSub ? (
                    <div className="w-full px-5 py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl font-bold text-emerald-600 dark:text-emerald-450 flex items-center gap-2.5 text-sm">
                      <Building className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{user?.subsidiary_name || 'My Corporate Entity'}</span>
                    </div>
                  ) : (
                    <div className="relative">
                      <select 
                        required 
                        value={form.subsidiary_id} 
                        onChange={e => setForm({ ...form, subsidiary_id: e.target.value })} 
                        className={inputCls + ' appearance-none cursor-pointer'}
                      >
                        <option value="" className="dark:bg-[#131B2E] dark:text-white">Select Subsidiary</option>
                        {subsidiaries.map(s => <option key={s.id} value={s.id} className="dark:bg-[#131B2E] dark:text-white">{s.name}</option>)}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                      </div>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2 flex gap-4 pt-3">
                  <button 
                    type="button" 
                    onClick={() => setAddModal(false)} 
                    className="flex-1 py-4 bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-slate-800 dark:hover:text-white border border-transparent dark:border-white/5 rounded-2xl font-black uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting} 
                    className="flex-[2] py-4 bg-brand-red text-white rounded-2xl font-black uppercase tracking-widest hover:bg-brand-red/90 transition-all shadow-xl shadow-brand-red/20 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <><Save className="w-4.5 h-4.5"/> Register Employee</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── EDIT EMPLOYEE MODAL ── */}
      <AnimatePresence>
        {editModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setEditModal(false)} 
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.93, y: 15 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.93, y: 15 }}
              className="relative w-full max-w-2xl bg-white dark:bg-[#131B2E] rounded-[36px] shadow-2xl overflow-hidden border border-slate-100 dark:border-white/5"
            >
              <div className="p-6 sm:p-8 border-b border-slate-50 dark:border-white/5 flex items-center justify-between bg-slate-50/20 dark:bg-white/1">
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase tracking-wider">Edit Registry Profile</h3>
                  <p className="text-slate-400 dark:text-slate-500 text-xs font-bold mt-1">
                    Update directory records for <span className="text-brand-red dark:text-red-400 font-extrabold">{editTarget?.full_name}</span>
                  </p>
                </div>
                <button 
                  onClick={() => setEditModal(false)} 
                  className="p-3 bg-slate-50 dark:bg-white/5 rounded-2xl text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-5 h-5"/>
                </button>
              </div>
              <form onSubmit={handleEdit} className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-4.5 max-h-[60vh] overflow-y-auto">
                {[
                  { label: 'Full Name', key: 'full_name', type: 'text' },
                  { label: 'Email Address', key: 'email', type: 'email' },
                  { label: 'Employee ID Code', key: 'employee_no', type: 'text' },
                  { label: 'NIC Number', key: 'nic_number', type: 'text' },
                  { label: 'Department Sector', key: 'department', type: 'text' },
                  { label: 'Designation / Job Title', key: 'job_title', type: 'text' },
                  { label: 'Contact Phone', key: 'phone', type: 'text' },
                  { label: 'Date of Birth', key: 'date_of_birth', type: 'date' },
                ].map(f => (
                  <div key={f.key} className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{f.label}</label>
                    <input 
                      type={f.type} 
                      value={editForm[f.key] || ''} 
                      onChange={e => setEditForm({ ...editForm, [f.key]: e.target.value })} 
                      className={inputCls}
                    />
                  </div>
                ))}
                
                {/* System Scope Selection */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Administrative Scope</label>
                  <div className="relative">
                    <select 
                      value={editForm.role || 'employee'} 
                      onChange={e => setEditForm({ ...editForm, role: e.target.value })} 
                      className={inputCls + ' appearance-none cursor-pointer'}
                      disabled={isSub}
                    >
                      <option value="employee" className="dark:bg-[#131B2E] dark:text-white">Employee</option>
                      {!isSub && <option value="subadmin" className="dark:bg-[#131B2E] dark:text-white">Sub Admin</option>}
                      {!isSub && <option value="groupadmin" className="dark:bg-[#131B2E] dark:text-white">Group Admin</option>}
                      {!isSub && <option value="superadmin" className="dark:bg-[#131B2E] dark:text-white">Super Admin</option>}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                    </div>
                  </div>
                </div>

                {/* Entity Assignment */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Entity Assignment</label>
                  {isSub ? (
                    <div className="w-full px-5 py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl font-bold text-emerald-600 dark:text-emerald-450 flex items-center gap-2.5 text-sm">
                      <Building className="w-4 h-4 text-emerald-500" />
                      <span>{user?.subsidiary_name || 'My Corporate Entity'}</span>
                    </div>
                  ) : (
                    <div className="relative">
                      <select 
                        value={editForm.subsidiary_id || ''} 
                        onChange={e => setEditForm({ ...editForm, subsidiary_id: e.target.value })} 
                        className={inputCls + ' appearance-none cursor-pointer'}
                      >
                        <option value="" className="dark:bg-[#131B2E] dark:text-white">None</option>
                        {subsidiaries.map(s => <option key={s.id} value={s.id} className="dark:bg-[#131B2E] dark:text-white">{s.name}</option>)}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                      </div>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2 flex gap-4 pt-3">
                  <button 
                    type="button" 
                    onClick={() => setEditModal(false)} 
                    className="flex-1 py-4 bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-slate-800 dark:hover:text-white border border-transparent dark:border-white/5 rounded-2xl font-black uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting} 
                    className="flex-[2] py-4 bg-brand-red text-white rounded-2xl font-black uppercase tracking-widest hover:bg-brand-red/90 transition-all shadow-xl shadow-brand-red/20 disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <><Save className="w-4.5 h-4.5"/> Save Profile Changes</>}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── SOFT DEACTIVATE CONFIRMATION ── */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setDeleteId(null)} 
              className="absolute inset-0 bg-slate-955/70 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.9 }} 
              className="relative bg-white dark:bg-[#131B2E] border border-slate-100 dark:border-white/5 rounded-[32px] shadow-2xl p-8 sm:p-10 max-w-sm w-full text-center"
            >
              <div className="w-16 h-16 bg-red-50 dark:bg-red-950/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-100 dark:border-red-900/30">
                <Trash2 className="w-7 h-7 text-brand-red"/>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Deactivate Account?</h3>
              <p className="text-slate-400 dark:text-slate-500 text-xs font-bold leading-relaxed mb-6">
                This employee will instantly lose all credentials and session access to the George Steuart intranet. You can reactivate this profile later.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setDeleteId(null)} 
                  className="flex-1 py-3.5 bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-slate-800 dark:hover:text-white border border-transparent dark:border-white/5 rounded-2xl font-black uppercase tracking-widest transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete} 
                  className="flex-1 py-3.5 bg-brand-red text-white rounded-2xl font-black uppercase tracking-widest hover:bg-brand-red/90 transition-all shadow-xl shadow-brand-red/20 cursor-pointer"
                >
                  Deactivate
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── RESET PASSKEY CONFIRMATION ── */}
      <AnimatePresence>
        {resetId && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setResetId(null)} 
              className="absolute inset-0 bg-slate-955/70 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.9 }} 
              className="relative bg-white dark:bg-[#131B2E] border border-slate-100 dark:border-white/5 rounded-[32px] shadow-2xl p-8 sm:p-10 max-w-sm w-full text-center"
            >
              <div className="w-16 h-16 bg-amber-50 dark:bg-amber-950/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-amber-100 dark:border-amber-900/30">
                <KeyRound className="w-7 h-7 text-amber-500"/>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Reset Password?</h3>
              <p className="text-slate-400 dark:text-slate-500 text-xs font-bold mb-3 leading-relaxed">
                The user account's credentials will be force-reset. Their temporary sign-in password key will be:
              </p>
              <p className="text-slate-900 dark:text-amber-400 font-mono font-black text-lg mb-6 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl py-3 select-all">
                GS@2026
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setResetId(null)} 
                  className="flex-1 py-3.5 bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-slate-800 dark:hover:text-white border border-transparent dark:border-white/5 rounded-2xl font-black uppercase tracking-widest transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleReset} 
                  className="flex-1 py-3.5 bg-amber-550 dark:bg-amber-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-amber-600 dark:hover:bg-amber-700 transition-all shadow-xl shadow-amber-200 cursor-pointer"
                >
                  Reset Key
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
    </div>
  );
}
