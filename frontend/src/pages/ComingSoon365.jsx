import { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Mail, 
  ChevronRight, 
  ChevronLeft,
  LayoutGrid, 
  List,
  Building2,
  Users,
  Briefcase,
  Star,
  Globe,
  PhoneCall,
  Video,
  X,
  Sparkles,
  Cloud,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const ComingSoon365 = () => {
  const { user: currentUser } = useAuth();

  const [employees, setEmployees] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const [syncing, setSyncing] = useState(false);
  const [unmatchedUsers, setUnmatchedUsers] = useState([]);
  const [showUnmatchedModal, setShowUnmatchedModal] = useState(false);

  const fetchO365Data = async () => {
    try {
      setError(null);
      console.log('Fetching Office 365 directory...');
      const res = await axios.get('http://localhost:5000/api/users/office365');
      setEmployees(res.data);
      
      const unmatchedRes = await axios.get('http://localhost:5000/api/users/office365/unmatched');
      setUnmatchedUsers(unmatchedRes.data);
    } catch (err) {
      console.error('Failed to fetch Office 365 directory data:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch Office 365 directory data');
    }
  };

  useEffect(() => {
    const loadInitData = async () => {
      setLoading(true);
      await fetchO365Data();
      setLoading(false);
    };
    loadInitData();
  }, []);

  const handleSync = async () => {
    try {
      setSyncing(true);
      const res = await axios.post('http://localhost:5000/api/users/office365/sync');
      alert(res.data.message || 'Synchronization complete.');
      await fetchO365Data();
    } catch (err) {
      console.error('Sync failed:', err);
      alert(err.response?.data?.message || err.message || 'Synchronization failed');
    } finally {
      setSyncing(false);
    }
  };

  const handleActivateUser = async (userId) => {
    try {
      const res = await axios.patch(`http://localhost:5000/api/users/office365/activate/${userId}`);
      alert(res.data.message || 'User activated successfully.');
      await fetchO365Data();
    } catch (err) {
      console.error('Activation failed:', err);
      alert('Failed to activate user profile.');
    }
  };

  const handleHardDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently delete this user from the database? This action is irreversible.')) return;
    try {
      const res = await axios.delete(`http://localhost:5000/api/users/office365/hard-delete/${userId}`);
      alert(res.data.message || 'User deleted successfully.');
      await fetchO365Data();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete user profile.');
    }
  };

  const companies = useMemo(() => {
    const distinct = [...new Set(employees.map(e => e.subsidiary_name))].filter(Boolean);
    return distinct.sort();
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = 
        emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.subsidiary_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesFilter = activeFilter === 'All' || emp.subsidiary_name?.trim() === activeFilter?.trim();
      
      return matchesSearch && matchesFilter;
    });
  }, [employees, searchTerm, activeFilter]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredEmployees.length / itemsPerPage);
  }, [filteredEmployees.length]);

  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEmployees.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEmployees, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeFilter, viewMode]);

  const stats = useMemo(() => ({
    total: employees.length,
    companiesCount: companies.length,
    unmatchedCount: unmatchedUsers.length,
    online: Math.floor(employees.length * 0.45) // Mock ActiveSync status
  }), [employees, companies, unmatchedUsers]);

  if (loading) return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-6 bg-slate-50 dark:bg-slate-900 transition-colors">
      <div className="w-20 h-20 border-4 border-slate-100 border-t-[#0078d4] rounded-full animate-spin shadow-2xl"></div>
      <div className="space-y-2 text-center">
        <p className="text-[10px] font-black uppercase tracking-[6px] text-slate-400 animate-pulse">Syncing Microsoft Graph Directory</p>
        <div className="h-1 w-48 bg-slate-100 rounded-full mx-auto overflow-hidden">
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            className="h-full w-full bg-[#0078d4]"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative selection:bg-blue-500/10 pb-32 px-4 sm:px-6 lg:px-8">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-500/[0.03] rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/[0.02] rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* TOP BAR WITH SYNC BUTTON */}
      <div className="flex justify-between items-center mb-6 pt-4">
        <div className="flex items-center gap-2">
          {/* Breadcrumbs or alignment placeholder */}
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2.5 px-6 py-3 bg-[#0078d4] hover:bg-[#005a9e] disabled:bg-slate-300 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-md hover:shadow-lg disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0 active:scale-98 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync with 365'}
          </button>
        </div>
      </div>

      {/* SECTION 1 — HERO DIRECTORY BANNER */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full rounded-2xl overflow-hidden shadow-lg mb-8 bg-gradient-to-r from-[#0078d4] via-[#0086f0] to-[#50b0ff] p-6 md:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-5"
      >
        <div className="space-y-4 max-w-xl text-center md:text-left">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/25">
            <Cloud className="w-3.5 h-3.5" />
            Live Cloud Directory
          </span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-none">
            365 Employee Directory
          </h1>
          <p className="text-white/80 text-xs md:text-sm font-medium leading-relaxed">
            Access real-time employee directory information synchronized directly from Microsoft 365, Azure AD, and George Steuart cloud tenants.
          </p>
        </div>
        <div className="w-32 h-32 md:w-48 md:h-48 shrink-0 flex items-center justify-center bg-white/10 rounded-full border border-white/15 backdrop-blur-md shadow-inner relative overflow-hidden group">
          <Users className="w-16 h-16 md:w-24 md:h-24 text-white/90 group-hover:scale-110 transition-transform duration-500" />
        </div>
      </motion.div>

      {error ? (
        <div className="max-w-md mx-auto text-center p-8 bg-red-50 border border-red-200 rounded-3xl space-y-4">
          <p className="text-sm font-bold text-red-600">Error connecting to Microsoft Graph API</p>
          <p className="text-xs text-red-500">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-wider"
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {/* STATS ROW */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { label: 'Total 365 Users', value: stats.total, icon: Users, color: '#0078d4', bg: '#e0f0ff' },
              { label: 'O365 Organizations', value: stats.companiesCount, icon: Building2, color: '#6366f1', bg: '#eef2ff' },
              { label: 'Not Matching Emails', value: stats.unmatchedCount, icon: Mail, color: '#f59e0b', bg: '#fffbeb', clickable: true },
              { label: 'ActiveSync Connected', value: stats.online, icon: Globe, color: '#10b981', bg: '#ecfdf5', pulse: true },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                onClick={() => s.clickable && unmatchedUsers.length > 0 && setShowUnmatchedModal(true)}
                className={`relative bg-white/70 backdrop-blur-xl border border-white rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.07)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.12)] transition-all duration-300 overflow-hidden group ${s.clickable && unmatchedUsers.length > 0 ? 'cursor-pointer hover:border-amber-500/40' : ''}`}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(circle at top right, ${s.color}08, transparent 70%)` }} />
                <div className="flex items-start justify-between mb-4">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm" style={{ background: s.bg }}>
                    <s.icon className="w-5 h-5" style={{ color: s.color }} />
                  </div>
                  {s.pulse && <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /><span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Active</span></div>}
                </div>
                <p className="text-3xl font-black text-slate-800 tracking-tight">{s.value}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[2px] mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>

          {/* TWO-COLUMN LAYOUT */}
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* LEFT SIDEBAR */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
              className="flex flex-col gap-6 w-full lg:w-72 shrink-0">

              {/* Search */}
              <div className="bg-white/70 backdrop-blur-xl border border-white rounded-3xl p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[3px] mb-3">Search Cloud</p>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input type="text" placeholder="Name, role, department..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-700 placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/30 transition-all font-medium" />
                </div>
              </div>

              {/* Organization Filter */}
              <div className="bg-white/70 backdrop-blur-xl border border-white rounded-3xl p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[3px] mb-3">Filter by Tenant/Company</p>
                <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                  {[{ id: 'all', name: 'All' }, ...companies.map(c => ({ id: c, name: c }))].map((comp, idx) => {
                    const palette = ['#0078d4','#6366f1','#f59e0b','#10b981','#ec4899','#f97316','#8b5cf6'];
                    const color = comp.name === 'All' ? '#0078d4' : palette[idx % palette.length];
                    const active = activeFilter === comp.name;
                    const count = comp.name === 'All' ? employees.length : employees.filter(e => e.subsidiary_name === comp.name).length;
                    return (
                      <button key={comp.id} onClick={() => { setActiveFilter(comp.name); setCurrentPage(1); }}
                        className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-left ${active ? 'text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                        style={active ? { background: color } : {}}>
                        <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color, opacity: active ? 1 : 0.5 }} />
                        <span className="truncate flex-1">{comp.name}</span>
                        <span className="ml-auto text-[8px] opacity-70 shrink-0">{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* RIGHT MAIN GRID */}
            <div className="flex-1 min-w-0 w-full">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Cloud Personnel Matrix</h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5">{filteredEmployees.length} active directory contacts</p>
                </div>
                <div className="flex bg-white border border-slate-100 p-1 rounded-xl shadow-sm">
                  <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-[#0078d4] text-white shadow-sm' : 'text-slate-300 hover:text-slate-500'}`}><LayoutGrid className="w-4 h-4" /></button>
                  <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-[#0078d4] text-white shadow-sm' : 'text-slate-300 hover:text-slate-500'}`}><List className="w-4 h-4" /></button>
                </div>
              </div>

              <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-3'}>
                {paginatedEmployees.map((emp, i) => {
                  const dc = { IT:'#6366f1', Finance:'#f59e0b', HR:'#ec4899', Healthcare:'#10b981', Operations:'#f97316', Marketing:'#8b5cf6', 'Office 365': '#0078d4' };
                  const color = dc[emp.department] || '#64748b';
                  const lightBg = { IT:'#eef2ff', Finance:'#fffbeb', HR:'#fdf2f8', Healthcare:'#ecfdf5', Operations:'#fff7ed', Marketing:'#f5f3ff', 'Office 365': '#e0f0ff' }[emp.department] || '#f8fafc';

                  if (viewMode === 'list') return (
                    <motion.div key={emp.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                      onClick={() => setSelectedUser(emp)}
                      className="group cursor-pointer bg-white/80 backdrop-blur-sm border border-slate-100 rounded-2xl p-4 flex items-center gap-4 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:border-slate-200 transition-all duration-300">
                      <div className="relative shrink-0">
                        <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow-md" style={{ outline: `2px solid ${color}22` }}>
                          <img src={`https://ui-avatars.com/api/?name=${emp.full_name}&background=0078d4&color=fff&bold=true`} className="w-full h-full object-cover" />
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-black text-slate-800 truncate group-hover:text-[#0078d4] transition-colors">{emp.full_name}</h4>
                        <p className="text-[9px] font-bold text-slate-450 uppercase tracking-wider mt-0.5">{emp.role}</p>
                      </div>
                      <span className="hidden md:block text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest" style={{ background: lightBg, color }}>{emp.department}</span>
                      <span className="hidden lg:block text-[10px] font-bold text-slate-400 truncate max-w-[160px]">
                        {emp.subsidiary_name}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <a href={`mailto:${emp.email}`} onClick={e => e.stopPropagation()} className="p-2 rounded-xl bg-slate-50 hover:bg-[#0078d4] hover:text-white text-slate-400 transition-all"><Mail className="w-3.5 h-3.5" /></a>
                        <a href={`tel:${emp.phone}`} onClick={e => e.stopPropagation()} className="p-2 rounded-xl bg-slate-50 hover:bg-[#0078d4] hover:text-white text-slate-400 transition-all"><PhoneCall className="w-3.5 h-3.5" /></a>
                        <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-[#0078d4] transition-colors" />
                      </div>
                    </motion.div>
                  );

                  return (
                    <motion.div key={emp.id} layout initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: i * 0.04, type: 'spring', stiffness: 220, damping: 22 }}
                      whileHover={{ y: -6 }} onClick={() => setSelectedUser(emp)}
                      className="group cursor-pointer bg-white/80 backdrop-blur-sm rounded-[28px] border border-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.13)] transition-all duration-400 overflow-hidden relative">
                      <div className="h-1.5 w-full bg-[#0078d4]" />
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-5">
                          <div className="relative">
                            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-[0_4px_14px_rgba(0,0,0,0.1)] group-hover:scale-105 transition-transform duration-300"
                              style={{ outline: `2px solid ${color}33` }}>
                              <img src={`https://ui-avatars.com/api/?name=${emp.full_name}&background=0078d4&color=fff&bold=true`} className="w-full h-full object-cover" />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center shadow-sm">
                              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                            </div>
                          </div>
                          <span className="text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-xl" style={{ background: lightBg, color }}>{emp.department}</span>
                        </div>
                        <h4 className="text-base font-black text-slate-800 leading-tight group-hover:text-[#0078d4] transition-colors duration-200 truncate">{emp.full_name}</h4>
                        <p className="text-[10px] font-bold text-slate-450 uppercase tracking-widest mt-1 mb-4 truncate">{emp.role}</p>
                        <div className="space-y-2 mb-5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: lightBg }}>
                              <Building2 className="w-3 h-3" style={{ color }} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 truncate">{emp.subsidiary_name}</span>
                          </div>
                        </div>
                        <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                          <div className="flex gap-1.5">
                            <a href={`mailto:${emp.email}`} onClick={e => e.stopPropagation()}
                              className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-white transition-all duration-200"
                              onMouseEnter={e => e.currentTarget.style.background = '#0078d4'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                              <Mail className="w-3.5 h-3.5" />
                            </a>
                            <a href={`tel:${emp.phone}`} onClick={e => e.stopPropagation()}
                              className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:text-white transition-all duration-200"
                              onMouseEnter={e => e.currentTarget.style.background = '#0078d4'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                              <PhoneCall className="w-3.5 h-3.5" />
                            </a>
                          </div>
                          <button className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-300 group-hover:text-[#0078d4] transition-colors duration-200">
                            Details <ChevronRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* ── PAGINATION CONTROLS ── */}
              {totalPages > 1 && (
                <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/40 backdrop-blur-xl border border-white/60 rounded-[28px] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.03)] transition-all duration-300">
                  <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-xs font-semibold text-slate-550 tracking-wide">
                      Showing <span className="font-bold text-slate-800">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredEmployees.length)}</span> to <span className="font-bold text-slate-800">{Math.min(currentPage * itemsPerPage, filteredEmployees.length)}</span> of <span className="font-bold text-slate-800">{filteredEmployees.length}</span> cloud profiles
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all duration-300 ${
                        currentPage === 1 
                          ? 'border-slate-100 text-slate-300 bg-slate-50/20 cursor-not-allowed' 
                          : 'border-slate-200/85 text-slate-600 bg-white hover:bg-slate-900 hover:text-white hover:border-slate-900 hover:shadow-[0_8px_20px_rgba(15,23,42,0.15)] active:scale-95'
                      }`}
                    >
                      <ChevronLeft className="w-4.5 h-4.5" />
                    </button>

                    <div className="w-10 h-10 rounded-2xl text-xs font-bold flex items-center justify-center bg-gradient-to-r from-[#0078d4] to-[#005a9e] text-white shadow-[0_6px_20px_rgba(0,120,212,0.25)] select-none">
                      {currentPage}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all duration-355 ${
                        currentPage === totalPages 
                          ? 'border-slate-100 text-slate-300 bg-slate-50/20 cursor-not-allowed' 
                          : 'border-slate-200/85 text-slate-600 bg-white hover:bg-slate-900 hover:text-white hover:border-slate-900 hover:shadow-[0_8px_20px_rgba(15,23,42,0.15)] active:scale-95'
                      }`}
                    >
                      <ChevronRight className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* USER DETAIL POPUP MODAL */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setSelectedUser(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-slate-800 rounded-[36px] max-w-lg w-full overflow-hidden shadow-2xl z-10 border border-slate-100 dark:border-slate-700"
            >
              {/* Header Gradient */}
              <div className="h-32 bg-gradient-to-r from-[#0078d4] to-[#005a9e] p-6 relative flex items-end">
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="absolute right-6 top-6 w-8 h-8 rounded-full bg-black/15 text-white flex items-center justify-center hover:bg-black/35 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Profile Avatar Overlapping */}
              <div className="px-8 pb-8 relative">
                <div className="absolute top-[-48px] left-8 w-24 h-24 rounded-3xl overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl bg-white">
                  <img src={`https://ui-avatars.com/api/?name=${selectedUser.full_name}&background=0078d4&color=fff&bold=true`} className="w-full h-full object-cover" />
                </div>
                
                <div className="pt-20">
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white leading-tight">{selectedUser.full_name}</h3>
                  <p className="text-xs font-black text-[#0078d4] dark:text-blue-400 uppercase tracking-widest mt-1.5">{selectedUser.role}</p>
                  
                  <div className="grid grid-cols-1 gap-4 mt-8 pt-6 border-t border-slate-50 dark:border-slate-700/50">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Tenant / Company</p>
                        <p className="text-sm font-black text-slate-705 dark:text-slate-200 mt-0.5">{selectedUser.subsidiary_name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center shrink-0">
                        <Briefcase className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Department</p>
                        <p className="text-sm font-black text-slate-705 dark:text-slate-200 mt-0.5">{selectedUser.department}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center shrink-0">
                        <Mail className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Email Address</p>
                        <a href={`mailto:${selectedUser.email}`} className="text-sm font-black text-[#0078d4] hover:underline mt-0.5 block break-all">{selectedUser.email}</a>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center shrink-0">
                        <PhoneCall className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Phone number</p>
                        <a href={`tel:${selectedUser.phone}`} className="text-sm font-black text-slate-705 dark:text-slate-200 hover:underline mt-0.5">{selectedUser.phone}</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* UNMATCHED EMAILS POPUP MODAL */}
      <AnimatePresence>
        {showUnmatchedModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowUnmatchedModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" 
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white dark:bg-slate-800 rounded-[36px] max-w-xl w-full overflow-hidden shadow-2xl z-10 border border-slate-100 dark:border-slate-700 flex flex-col max-h-[80vh]"
            >
              {/* Header */}
              <div className="p-6 bg-gradient-to-r from-amber-500 to-orange-600 text-white flex items-center justify-between shrink-0">
                <div className="space-y-1">
                  <h3 className="text-xl font-black tracking-tight text-white">Unmatched Email Accounts</h3>
                  <p className="text-[10px] text-white/90 font-semibold">Synced profiles in the database that are missing from Microsoft 365 Graph.</p>
                </div>
                <button 
                  onClick={() => setShowUnmatchedModal(false)}
                  className="w-8 h-8 rounded-full bg-black/15 text-white flex items-center justify-center hover:bg-black/35 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* List Container */}
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-4">
                {unmatchedUsers.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 font-semibold text-xs">
                    No unmatched email accounts found.
                  </div>
                ) : (
                  unmatchedUsers.map(emp => (
                    <div key={emp.id} className="bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700/50 rounded-2xl p-4 flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-black text-slate-800 dark:text-white truncate">{emp.full_name}</h4>
                        <p className="text-[10px] font-bold text-[#0078d4] dark:text-blue-400 truncate mt-0.5">{emp.email}</p>
                        <p className="text-[8px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider mt-1">{emp.subsidiary_name || 'Office 365'}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button 
                          onClick={() => handleActivateUser(emp.id)}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1 cursor-pointer"
                          title="Activate user & ignore future sync deactivations"
                        >
                          Activate
                        </button>
                        <button 
                          onClick={() => handleHardDeleteUser(emp.id)}
                          className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-[9px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1 cursor-pointer"
                          title="Permanently delete user from database"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ComingSoon365;
