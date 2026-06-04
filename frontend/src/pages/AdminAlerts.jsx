import { useState, useEffect } from 'react';
import { 
  Megaphone, Search, Plus, Trash2, X, Check, AlertCircle, 
  AlertTriangle, Shield, Info, Building2, Calendar, RefreshCw 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:5000/api';

const alertTypeLabels = {
  warning: 'Warning / Notice',
  info: 'Information / HR Update',
  success: 'Success / Security Policy'
};

const alertTypeColors = {
  warning: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40',
  info: 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/40',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40'
};

const alertColorMap = {
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    border: 'border-amber-200 dark:border-amber-800/40',
    iconBg: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500'
  },
  blue: {
    bg: 'bg-sky-50 dark:bg-sky-950/20',
    border: 'border-sky-200 dark:border-sky-800/40',
    iconBg: 'bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400',
    dot: 'bg-sky-500'
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    border: 'border-emerald-200 dark:border-emerald-800/40',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500'
  }
};

const alertIconMap = {
  warning: AlertTriangle,
  info: Info,
  success: Shield
};

export default function AdminAlerts() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const isSubAdmin = user?.role !== 'super_admin';

  const [alerts, setAlerts] = useState([]);
  const [subsidiaries, setSubsidiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  // Modals
  const [addModal, setAddModal] = useState(false);
  const [deleteAlert, setDeleteAlert] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form
  const getInitialForm = () => ({
    title: '',
    message: '',
    type: 'info',
    color: 'blue',
    subsidiary_id: isSubAdmin ? user?.subsidiary_id : ''
  });

  const [form, setForm] = useState(getInitialForm());

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Sync color selection with alert type by default
  const handleTypeChange = (typeVal) => {
    let colorVal = 'blue';
    if (typeVal === 'warning') colorVal = 'amber';
    if (typeVal === 'success') colorVal = 'emerald';
    
    setForm(prev => ({
      ...prev,
      type: typeVal,
      color: colorVal
    }));
  };

  async function loadData() {
    setLoading(true);
    try {
      const params = {
        role: user.role,
        subsidiary_id: user.subsidiary_id
      };
      const [alertsRes, subsRes] = await Promise.all([
        axios.get(`${API}/alerts`, { params }),
        axios.get(`${API}/subsidiaries`)
      ]);
      let fetchedAlerts = alertsRes.data;
      if (user.role !== 'super_admin') {
        fetchedAlerts = fetchedAlerts.filter(a => Number(a.subsidiary_id) === Number(user.subsidiary_id));
      }
      setAlerts(fetchedAlerts);
      setSubsidiaries(subsRes.data);
    } catch (err) {
      console.error('Error fetching alerts dashboard data:', err);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      return showToast('Title and message are required', 'error');
    }
    
    setSubmitting(true);
    try {
      await axios.post(`${API}/alerts`, form);
      showToast('New system alert published successfully ✓');
      setAddModal(false);
      setForm(getInitialForm());
      loadData();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to add alert', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteAlert) return;
    try {
      await axios.delete(`${API}/alerts/${deleteAlert.id}`);
      showToast('Alert deleted and retracted successfully ✓');
      setDeleteAlert(null);
      loadData();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete alert', 'error');
    }
  }

  const filtered = alerts.filter(a => {
    const matchSearch = a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.message?.toLowerCase().includes(search.toLowerCase()) ||
      a.subsidiary_name?.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const inputCls = "w-full px-5 py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl font-bold text-slate-800 dark:text-white focus:ring-4 focus:ring-brand-red/5 outline-none transition-all";

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] pb-20 transition-colors duration-350">
      
      {/* TOAST */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -24 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -24 }}
            className={`fixed top-8 right-8 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-white font-bold text-sm ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}
          >
            {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <Check className="w-5 h-5" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO BANNER */}
      <div className="px-4 sm:px-8 pt-4 sm:pt-8">
        <div className="relative h-[220px] sm:h-[300px] md:h-[350px] w-full overflow-hidden rounded-[24px] sm:rounded-[36px] shadow-xl group">
          <img 
            src="/admin_premium_cover.png" 
            alt="Alert Management" 
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/40 to-transparent"/>
          <div className="absolute inset-0 flex items-center px-6 sm:px-10 md:px-16">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-brand-red/20 backdrop-blur-md border border-brand-red/30 rounded-full mb-2.5 sm:mb-3.5">
                <div className="w-1.5 h-1.5 bg-brand-red rounded-full animate-pulse"/>
                <span className="text-[8px] font-black text-brand-red uppercase tracking-[3px]">Crisis & notice board</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-tighter leading-none mb-2">
                System Alerts &amp; <span className="text-brand-red">Notices</span>
              </h1>
              <p className="text-white/60 text-xs sm:text-sm font-medium leading-relaxed max-w-lg hidden sm:block">
                Create real-time notices, HR instructions, emergency alerts, or security updates targeting global conglomerate segments or unique corporate entities.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-8 md:px-10 -mt-10 sm:-mt-16 relative z-10">
        
        {/* STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8">
          {(isSuperAdmin ? [
            { label: 'Active Alerts', value: alerts.length, icon: Megaphone, color: 'text-brand-red', gradient: 'from-red-500 to-rose-600' },
            { label: 'Global Board', value: alerts.filter(a => !a.subsidiary_id).length, icon: Shield, color: 'text-blue-600', gradient: 'from-blue-500 to-indigo-600' },
            { label: 'Entity Scope', value: alerts.filter(a => a.subsidiary_id).length, icon: Building2, color: 'text-purple-600', gradient: 'from-purple-500 to-indigo-600' },
            { label: 'Total Subsidiaries', value: subsidiaries.length, icon: Calendar, color: 'text-emerald-600', gradient: 'from-emerald-500 to-teal-600' },
          ] : [
            { label: 'Active Alerts', value: alerts.length, icon: Megaphone, color: 'text-brand-red', gradient: 'from-red-500 to-rose-600' },
            { label: 'Warning Notices', value: alerts.filter(a => a.type === 'warning').length, icon: AlertTriangle, color: 'text-amber-500', gradient: 'from-amber-500 to-yellow-600' },
            { label: 'HR Updates', value: alerts.filter(a => a.type === 'info').length, icon: Info, color: 'text-blue-500', gradient: 'from-blue-500 to-indigo-600' },
            { label: 'Security & Policy', value: alerts.filter(a => a.type === 'success').length, icon: Shield, color: 'text-emerald-500', gradient: 'from-emerald-500 to-teal-600' },
          ]).map((s, idx) => (
            <motion.div 
              key={s.label}
              whileHover={{ y: -4, scale: 1.02 }}
              className="bg-white dark:bg-[#131B2E] rounded-2xl sm:rounded-[28px] border border-slate-100 dark:border-white/5 shadow-sm p-4 sm:p-6 flex items-center gap-4 relative overflow-hidden group"
            >
              <div className={`absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br ${s.gradient} rounded-full opacity-10 dark:opacity-20 blur-xl group-hover:opacity-25 transition-opacity pointer-events-none`}/>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center border bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5 shrink-0 relative z-10">
                <s.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${s.color}`}/>
              </div>
              <div className="relative z-10">
                <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-none mb-1">{s.value}</p>
                <p className="text-[8px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ALERTS DIRECTORY */}
        <div className="bg-white dark:bg-[#131B2E] rounded-3xl sm:rounded-[40px] border border-slate-100 dark:border-white/5 shadow-[0_8px_48px_rgba(0,0,0,0.04)] overflow-hidden">
          {/* Header */}
          <div className="px-5 sm:px-8 py-5 sm:py-6 border-b border-slate-50 dark:border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center justify-between lg:justify-start gap-3 w-full lg:w-auto">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">Enterprise Notice Board</h2>
              <span className="px-3 py-1 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-full text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                {filtered.length} active
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  placeholder="Search alert title/scope..."
                  className="pl-11 pr-5 py-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-sm font-bold text-slate-700 dark:text-white outline-none focus:ring-4 focus:ring-brand-red/5 w-full"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button onClick={loadData} className="p-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-slate-400 hover:text-brand-red dark:text-slate-500 dark:hover:text-white transition-all flex-1 sm:flex-none flex justify-center items-center">
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}/>
                </button>
                <button 
                  onClick={() => setAddModal(true)}
                  className="flex items-center justify-center gap-2 bg-brand-red text-white px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-brand-red/90 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand-red/20 flex-[3] sm:flex-none"
                >
                  <Plus className="w-4 h-4"/> Post New Alert
                </button>
              </div>
            </div>
          </div>

          {/* ACTIVE ALERTS RENDERING */}
          <div className="p-5 sm:p-8 space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-slate-100 border-t-brand-red rounded-full animate-spin"></div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 bg-slate-50/50 dark:bg-slate-800/10 rounded-3xl border border-dashed border-slate-150 dark:border-slate-800">
                <Megaphone className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-700 dark:text-slate-350 font-black text-sm uppercase tracking-wider">No Alerts Active</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">There are no operational or organizational alerts posted. Create one to notify the team.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filtered.map((alert, i) => {
                  const c = alertColorMap[alert.color] || alertColorMap.blue;
                  const Icon = alertIconMap[alert.type] || Info;
                  return (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -2, scale: 1.01 }}
                      transition={{ delay: i * 0.05 }}
                      className={`flex flex-col justify-between p-5 rounded-2xl border dark:border-white/5 transition-all relative overflow-hidden group shadow-sm bg-white dark:bg-[#131B2E] ${c.bg} ${c.border}`}
                    >
                      <div>
                        {/* Header metadata */}
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <span className={`px-2.5 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest border ${alertTypeColors[alert.type]}`}>
                            {alertTypeLabels[alert.type]}
                          </span>
                          
                          {/* Subsidiary scope badge */}
                          <span className="flex items-center gap-1 bg-white/60 dark:bg-slate-900/40 px-2.5 py-1 rounded-lg text-[9px] font-bold text-slate-500 border border-slate-100 dark:border-slate-800">
                            <Building2 className="w-3 h-3 shrink-0" />
                            {alert.subsidiary_name || 'Global Broadcast'}
                          </span>
                        </div>

                        {/* Title & Body */}
                        <div className="flex items-start gap-3.5 mt-2">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${c.iconBg}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 leading-snug">{alert.title}</h3>
                            <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed mt-1">{alert.message}</p>
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/40 mt-4 pt-3 text-[10px] font-bold text-slate-400">
                        <span className="uppercase tracking-widest">
                          Posted {new Date(alert.created_at).toLocaleDateString()}
                        </span>
                        
                        <button
                          onClick={() => setDeleteAlert(alert)}
                          className="flex items-center gap-1 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-950/10 dark:hover:bg-red-950/30 px-3 py-1.5 rounded-lg border border-red-100/50 dark:border-red-900/30 transition-all font-black uppercase tracking-widest"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Retract / Delete
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── CREATE SYSTEM ALERT MODAL ── */}
      <AnimatePresence>
        {addModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setAddModal(false)} 
              className="absolute inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.92, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="relative w-full max-w-xl bg-white dark:bg-[#131B2E] rounded-[40px] shadow-2xl overflow-hidden border border-slate-100 dark:border-white/5 z-10"
            >
              <div className="p-8 border-b border-slate-50 dark:border-white/5 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Publish System Alert</h3>
                  <p className="text-slate-400 dark:text-slate-500 text-sm font-medium mt-1">Broadcast high-importance announcements immediately.</p>
                </div>
                <button onClick={() => setAddModal(false)} className="p-3 bg-slate-50 dark:bg-white/5 rounded-2xl text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAdd} className="p-8 space-y-5 max-h-[65vh] overflow-y-auto">
                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Alert Title</label>
                  <input 
                    required 
                    type="text" 
                    value={form.title} 
                    placeholder="e.g. IT Maintenance Window"
                    onChange={e => setForm({ ...form, title: e.target.value })} 
                    className={inputCls}
                  />
                </div>

                {/* Message */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Message Description</label>
                  <textarea 
                    required 
                    rows="3"
                    value={form.message} 
                    placeholder="Provide clear details or instructions for employees..."
                    onChange={e => setForm({ ...form, message: e.target.value })} 
                    className={inputCls}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Alert Type */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Alert Type</label>
                    <select 
                      value={form.type} 
                      onChange={e => handleTypeChange(e.target.value)} 
                      className={inputCls + ' appearance-none cursor-pointer'}
                    >
                      <option value="info">Info / General Notice</option>
                      <option value="warning">Warning / Critical Action</option>
                      <option value="success">Success / Security Notice</option>
                    </select>
                  </div>

                  {/* Target Scope */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Target Audience</label>
                    {isSubAdmin ? (
                      <div className="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl font-bold text-emerald-600 flex items-center gap-2.5 text-sm">
                        <Building2 className="w-4 h-4 text-emerald-500" />
                        <span>{user?.subsidiary_name || 'My Subsidiary Entity'}</span>
                      </div>
                    ) : (
                      <select 
                        required 
                        value={form.subsidiary_id} 
                        onChange={e => setForm({ ...form, subsidiary_id: e.target.value })} 
                        className={inputCls + ' appearance-none cursor-pointer'}
                      >
                        <option value="">Global (All Entities)</option>
                        {subsidiaries.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    )}
                  </div>
                </div>

                {/* Theme Color Indicator */}
                <div className="space-y-2 pt-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Theme Visual Tone</label>
                  <div className="flex gap-4">
                    {[
                      { key: 'blue', name: 'HR / Corporate Blue', color: 'bg-blue-500' },
                      { key: 'amber', name: 'Maintenance Amber', color: 'bg-amber-500' },
                      { key: 'emerald', name: 'Security Emerald', color: 'bg-emerald-500' }
                    ].map(theme => (
                      <button
                        key={theme.key}
                        type="button"
                        onClick={() => setForm({ ...form, color: theme.key })}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                          form.color === theme.key 
                            ? 'bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900 shadow-md' 
                            : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-200 dark:bg-slate-800 dark:border-slate-700'
                        }`}
                      >
                        <span className={`w-2.5 h-2.5 rounded-full ${theme.color}`} />
                        {theme.key}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex gap-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                  <button 
                    type="button" 
                    onClick={() => setAddModal(false)} 
                    className="flex-1 py-4 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting} 
                    className="flex-[2] py-4 bg-brand-red text-white rounded-2xl font-black uppercase tracking-widest hover:bg-brand-red/90 transition-all shadow-xl shadow-brand-red/20 disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <><Megaphone className="w-4 h-4"/> Publish Live Alert</>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── CONFIRM ALERT RETRACTION ── */}
      <AnimatePresence>
        {deleteAlert && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setDeleteAlert(null)} 
              className="absolute inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.9 }} 
              className="relative bg-white dark:bg-[#131B2E] border border-slate-100 dark:border-white/5 shadow-2xl p-10 max-w-sm w-full text-center z-10"
            >
              <div className="w-16 h-16 bg-red-50 dark:bg-red-950/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-100 dark:border-red-900/30">
                <Trash2 className="w-7 h-7 text-brand-red"/>
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 mb-2">Retract System Alert?</h3>
              <p className="text-slate-400 dark:text-slate-500 text-sm font-medium mb-8">
                This notice will be permanently deleted and immediately removed from all employee dashboards.
              </p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setDeleteAlert(null)} 
                  className="flex-1 py-4 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDelete} 
                  className="flex-1 py-4 bg-brand-red text-white rounded-2xl font-black uppercase tracking-widest hover:bg-brand-red/90 transition-all shadow-xl shadow-brand-red/20"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
