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
   Globe,
   PhoneCall,
   Video,
   X,
   Database,
   CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const ManualDirectory = () => {
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

  const fetchManualData = async () => {
    try {
      setError(null);
      console.log('Fetching Manual directory...');
      const res = await axios.get('http://localhost:5000/api/users/manual');
      setEmployees(res.data);
    } catch (err) {
      console.error('Failed to fetch Manual directory data:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch Manual directory data');
    }
  };

  useEffect(() => {
    const loadInitData = async () => {
      setLoading(true);
      await fetchManualData();
      setLoading(false);
    };
    loadInitData();
  }, []);

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
    identityType: 'Local DB',
    status: 'Live'
  }), [employees, companies]);

  if (loading) return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-6 bg-slate-50 dark:bg-slate-900 transition-colors">
      <div className="w-20 h-20 border-4 border-slate-100 border-t-brand-red rounded-full animate-spin shadow-2xl"></div>
      <div className="space-y-2 text-center">
        <p className="text-[10px] font-black uppercase tracking-[6px] text-slate-400 animate-pulse">Loading Manual Directory</p>
        <div className="h-1 w-48 bg-slate-100 rounded-full mx-auto overflow-hidden">
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            className="h-full w-full bg-brand-red"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative selection:bg-brand-red/10 pb-32 px-4 sm:px-6 lg:px-8">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-red/[0.03] rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-slate-500/[0.02] rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="flex justify-between items-center mb-6 pt-4">
        <div className="flex items-center gap-2"></div>
        <div className="flex items-center gap-3"></div>
      </div>

      {/* HERO DIRECTORY BANNER */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full rounded-2xl overflow-hidden shadow-lg mb-8 bg-gradient-to-r from-brand-red via-brand-red-dark to-slate-900 p-6 md:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-5"
      >
        <div className="space-y-4 max-w-xl text-center md:text-left">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-white/20 text-white border border-white/25">
            <Database className="w-3.5 h-3.5" />
            Internal Directory
          </span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-none">
            Manual Employee Directory
          </h1>
          <p className="text-white/80 text-xs md:text-sm font-medium leading-relaxed">
            Access employee profiles added manually via the administrative panel, showing local records and assignments.
          </p>
        </div>
        <div className="w-32 h-32 md:w-48 md:h-48 shrink-0 flex items-center justify-center bg-white/10 rounded-full border border-white/15 backdrop-blur-md shadow-inner relative overflow-hidden group">
          <Users className="w-16 h-16 md:w-24 md:h-24 text-white/90 group-hover:scale-110 transition-transform duration-500" />
        </div>
      </motion.div>

      {error ? (
        <div className="max-w-md mx-auto text-center p-8 bg-red-50 border border-red-200 rounded-3xl space-y-4">
          <p className="text-sm font-bold text-red-600">Error loading local directory</p>
          <p className="text-xs text-red-500">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 bg-brand-red hover:bg-brand-red-dark text-white rounded-xl text-xs font-black uppercase tracking-wider"
          >
            Retry Connection
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {/* STATS ROW */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { label: 'Total Manual Users', value: stats.total, icon: Users, color: '#C41230', bg: '#FDECEF' },
              { label: 'Active Organizations', value: stats.companiesCount, icon: Building2, color: '#6366f1', bg: '#eef2ff' },
              { label: 'Database Identity', value: stats.identityType, icon: Database, color: '#f59e0b', bg: '#fffbeb' },
              { label: 'Directory Status', value: stats.status, icon: CheckCircle, color: '#10b981', bg: '#ecfdf5', pulse: true },
            ].map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="relative bg-white/70 backdrop-blur-xl border border-white rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.07)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.12)] transition-all duration-300 overflow-hidden group">
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
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[3px] mb-3">Search Directory</p>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                  <input type="text" placeholder="Name, role, department..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-700 placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red/30 transition-all font-medium" />
                </div>
              </div>

              {/* Organization Filter */}
              <div className="bg-white/70 backdrop-blur-xl border border-white rounded-3xl p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[3px] mb-3">Filter by Company</p>
                <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                  {[{ id: 'all', name: 'All' }, ...companies.map(c => ({ id: c, name: c }))].map((comp, idx) => {
                    const palette = ['#C41230','#6366f1','#f59e0b','#10b981','#ec4899','#f97316','#8b5cf6'];
                    const color = comp.name === 'All' ? '#C41230' : palette[idx % palette.length];
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
                  <h3 className="text-xl font-black text-slate-800 tracking-tight">Manual Personnel Matrix</h3>
                  <p className="text-[10px] font-bold text-slate-400 mt-0.5">{filteredEmployees.length} active database records</p>
                </div>
                <div className="flex bg-white border border-slate-100 p-1 rounded-xl shadow-sm">
                  <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-brand-red text-white shadow-sm' : 'text-slate-300 hover:text-slate-500'}`}><LayoutGrid className="w-4 h-4" /></button>
                  <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-brand-red text-white shadow-sm' : 'text-slate-300 hover:text-slate-500'}`}><List className="w-4 h-4" /></button>
                </div>
              </div>

              <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-3'}>
                {paginatedEmployees.map((emp, i) => {
                  const dc = { IT:'#6366f1', Finance:'#f59e0b', HR:'#ec4899', Healthcare:'#10b981', Operations:'#f97316', Marketing:'#8b5cf6' };
                  const color = dc[emp.department] || '#64748b';
                  const lightBg = { IT:'#eef2ff', Finance:'#fffbeb', HR:'#fdf2f8', Healthcare:'#ecfdf5', Operations:'#fff7ed', Marketing:'#f5f3ff' }[emp.department] || '#f8fafc';

                  return (
                    <motion.div 
                      key={emp.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setSelectedUser(emp)}
                      className={viewMode === 'grid' 
                        ? "bg-white/80 dark:bg-[#131B2E] border border-slate-100 dark:border-white/5 rounded-[28px] p-6 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col items-center text-center relative overflow-hidden group"
                        : "bg-white/80 dark:bg-[#131B2E] border border-slate-100 dark:border-white/5 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex items-center justify-between gap-4 relative overflow-hidden group"
                      }
                    >
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: `radial-gradient(circle at center, ${color}04, transparent 70%)` }} />
                      
                      {viewMode === 'grid' ? (
                        <>
                          <div className="relative mb-4">
                            <div className="w-20 h-20 rounded-[24px] overflow-hidden bg-slate-50 flex items-center justify-center font-black text-xl text-slate-400 shadow-md relative group-hover:scale-105 transition-transform duration-300">
                              {emp.profile_pic ? (
                                <img src={emp.profile_pic} alt={emp.full_name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="uppercase">{emp.full_name?.charAt(0)}</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-1 w-full px-2">
                            <h4 className="font-black text-sm text-slate-800 dark:text-white truncate">{emp.full_name}</h4>
                            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate flex items-center justify-center gap-1">
                              <Briefcase className="w-3 h-3 text-slate-300" />
                              {emp.job_title}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 truncate">{emp.email}</p>
                          </div>

                          <div className="mt-5 pt-4 border-t border-slate-50 dark:border-white/5 w-full flex flex-wrap justify-center gap-2">
                            <span className="px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-500">
                              {emp.subsidiary_name || 'Group'}
                            </span>
                            <span className="px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider" style={{ background: lightBg, color: color }}>
                              {emp.department || 'N/A'}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center font-black text-lg text-slate-400 shadow-sm shrink-0">
                              {emp.profile_pic ? (
                                <img src={emp.profile_pic} alt={emp.full_name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="uppercase">{emp.full_name?.charAt(0)}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-black text-sm text-slate-800 dark:text-white truncate">{emp.full_name}</h4>
                              <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate flex items-center gap-1 mt-0.5">
                                <Briefcase className="w-3 h-3 text-slate-300" />
                                {emp.job_title}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6 shrink-0">
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 hidden md:block">{emp.email}</p>
                            <div className="flex gap-2">
                              <span className="px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-500">
                                {emp.subsidiary_name || 'Group'}
                              </span>
                              <span className="px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-wider" style={{ background: lightBg, color: color }}>
                                {emp.department || 'N/A'}
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* PAGINATION */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-12">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="p-2.5 bg-white border border-slate-100 text-slate-500 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-all cursor-pointer shadow-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] font-black text-slate-450 uppercase tracking-widest">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button 
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="p-2.5 bg-white border border-slate-100 text-slate-500 rounded-xl hover:bg-slate-50 disabled:opacity-50 transition-all cursor-pointer shadow-sm"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL DRAWER */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-end p-4 sm:p-6 select-none">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md" onClick={() => setSelectedUser(null)} />
            
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-white dark:bg-[#131B2E] border-l border-slate-100 dark:border-white/5 h-full rounded-[32px] sm:rounded-r-none sm:rounded-l-[40px] shadow-2xl p-8 overflow-y-auto custom-scrollbar flex flex-col justify-between"
            >
              <div className="space-y-8">
                <div className="flex justify-between items-center">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[4px]">Profile Card</p>
                  <button onClick={() => setSelectedUser(null)} className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 flex items-center justify-center transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-[32px] overflow-hidden bg-slate-50 flex items-center justify-center font-black text-3xl text-slate-400 shadow-md mb-4 border border-slate-100">
                    {selectedUser.profile_pic ? (
                      <img src={selectedUser.profile_pic} alt={selectedUser.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="uppercase">{selectedUser.full_name?.charAt(0)}</span>
                    )}
                  </div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">{selectedUser.full_name}</h3>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#C41230] mt-1">
                    {selectedUser.role === 'superadmin' || selectedUser.role === 'super_admin' ? 'Super Admin' : selectedUser.role === 'groupadmin' || selectedUser.role === 'group_admin' ? 'Group Admin' : selectedUser.role === 'subadmin' || selectedUser.role === 'sub_admin' ? 'Sub Admin' : 'Employee'}
                  </p>
                </div>

                <div className="border-t border-slate-100 dark:border-white/5 pt-6 space-y-4">
                  {[
                    { label: 'Job Title', val: selectedUser.job_title, icon: Briefcase },
                    { label: 'Department', val: selectedUser.department, icon: Users },
                    { label: 'Subsidiary', val: selectedUser.subsidiary_name, icon: Building2 },
                    { label: 'Phone', val: selectedUser.phone || 'Not Provided', icon: PhoneCall },
                    { label: 'Email Address', val: selectedUser.email, icon: Mail },
                  ].map((field, idx) => (
                    <div key={idx} className="flex gap-4 items-start py-1.5">
                      <div className="w-8 h-8 bg-slate-50 dark:bg-white/5 text-slate-400 rounded-lg flex items-center justify-center shrink-0">
                        <field.icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">{field.label}</p>
                        <p className="text-xs font-bold text-slate-700 dark:text-white truncate">{field.val}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-50 dark:border-white/5">
                <a href={`mailto:${selectedUser.email}`} className="w-full py-4 bg-brand-red hover:bg-brand-red-dark text-white rounded-xl text-center text-xs font-black uppercase tracking-widest shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer">
                  <Mail className="w-4 h-4" />
                  Email Contact
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManualDirectory;
