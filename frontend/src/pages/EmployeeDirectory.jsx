import { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  ChevronRight, 
  ChevronLeft,
  UserPlus, 
  LayoutGrid, 
  List,
  MapPin,
  Building2,
  Users,
  Briefcase,
  Star,
  CheckCircle2,
  MessageSquare,
  Network,
  ArrowRight,
  TrendingUp,
  Zap,
  Globe,
  MoreHorizontal,
  ExternalLink,
  PhoneCall,
  Video,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const EmployeeDirectory = () => {
  const { user: currentUser } = useAuth();
  const isSubAdmin = currentUser?.role === 'sub_admin' || currentUser?.role === 'it_admin' || currentUser?.role === 'hr_admin';
  const navigate = useNavigate();

  const [employees, setEmployees] = useState([]);
  const [subsidiaries, setSubsidiaries] = useState([]);
  const [directors, setDirectors] = useState([]);
  const [expandedSubs, setExpandedSubs] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [activeTab, setActiveTab] = useState('Employees');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const toggleSubExpand = (subId) => {
    setExpandedSubs(prev => ({
      ...prev,
      [subId]: !prev[subId]
    }));
  };

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const handleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error enabling fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersUrl = isSubAdmin
          ? `http://localhost:5000/api/users?subsidiaryId=${currentUser?.subsidiary_id}`
          : 'http://localhost:5000/api/users';
        const [usersRes, subsRes, dirsRes] = await Promise.all([
          axios.get(usersUrl),
          axios.get('http://localhost:5000/api/subsidiaries'),
          axios.get('http://localhost:5000/api/subsidiaries/directors/all')
        ]);
        setEmployees(usersRes.data);
        setSubsidiaries(subsRes.data);
        setDirectors(dirsRes.data);
      } catch (err) {
        console.error('Failed to fetch directory data', err);
      } finally {
        setLoading(false);
      }
    };
    if (currentUser) {
      fetchData();
    }
  }, [currentUser, isSubAdmin]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = 
        emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.role?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.subsidiary_name?.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (activeTab === 'My Subsidiary Members') {
        const matchesSub = Number(emp.subsidiary_id) === Number(currentUser?.subsidiary_id);
        return matchesSearch && matchesSub;
      }
      
      const matchesFilter = isSubAdmin || activeFilter === 'All' || emp.subsidiary_name === activeFilter;
      
      return matchesSearch && matchesFilter;
    });
  }, [employees, searchTerm, activeFilter, isSubAdmin, activeTab, currentUser]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredEmployees.length / itemsPerPage);
  }, [filteredEmployees.length]);

  const paginatedEmployees = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredEmployees.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredEmployees, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeFilter, activeTab, viewMode]);

  const stats = useMemo(() => ({
    total: employees.length,
    subCount: subsidiaries.length,
    depts: [...new Set(employees.map(e => e.department))].length,
    online: Math.floor(employees.length * 0.25), // Mock online count
    ownSubEmployees: currentUser?.subsidiary_id 
      ? employees.filter(e => Number(e.subsidiary_id) === Number(currentUser.subsidiary_id)).length
      : 0
  }), [employees, subsidiaries, currentUser]);

  if (loading) return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center space-y-6">
      <div className="w-20 h-20 border-4 border-slate-100 border-t-brand-red rounded-full animate-spin shadow-2xl"></div>
      <div className="space-y-2 text-center">
        <p className="text-[10px] font-black uppercase tracking-[6px] text-slate-400 animate-pulse">Initializing API Family Intelligence</p>
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
    <div className="relative selection:bg-brand-red/10 pb-32">
      <style>{`
        @media print {
          /* Hide sidebar, header, navigation, and tabs */
          header, footer, nav, aside, .no-print, 
          button, .pt-6.relative.z-10, .flex.justify-center.mb-10,
          .absolute.top-8.left-8.right-8.flex,
          .fixed.inset-0.pointer-events-none {
            display: none !important;
          }
          /* Reset backgrounds and padding for print */
          body, .min-h-screen, #root {
            background: white !important;
            color: black !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          /* Ensure cards and text are fully visible without truncation */
          .bg-white {
            border: 1px solid #e2e8f0 !important;
            box-shadow: none !important;
            page-break-inside: avoid;
          }
          .shadow-2xl, .shadow-xl, .shadow-[0_8px_32px_rgba(0,0,0,0.07)] {
            box-shadow: none !important;
          }
        }
      `}</style>
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-red/[0.03] rounded-full blur-[150px] -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/[0.02] rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* SECTION 1 — HERO DIRECTORY BANNER */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full rounded-[32px] overflow-hidden shadow-2xl mb-12"
      >
        <img 
          src="/image.png" 
          alt="Employee Directory Cover" 
          className="w-full h-auto block"
        />
      </motion.div>

      {/* SECTION 5 — DIRECTORY TABS */}
      <div className="flex justify-center mb-10">
        <div className="bg-slate-100/50 p-1.5 rounded-[24px] flex flex-wrap items-center gap-1">
           {['Employees', 'My Subsidiary Members', 'Organization Structure'].map((tab) => (
             <button
               key={tab}
               onClick={() => setActiveTab(tab)}
               className={`px-8 py-3.5 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-white' : 'text-slate-400 hover:text-slate-600'}`}
             >
               {activeTab === tab && (
                 <motion.div 
                   layoutId="activeTab"
                   className="absolute inset-0 bg-slate-900 rounded-[20px] shadow-xl"
                 />
               )}
               <span className="relative z-10">{tab}</span>
             </button>
           ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'Employees' || activeTab === 'My Subsidiary Members' ? (
          <motion.div key="employees-view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-10">

            {/* STATS ROW */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              {[
                { label: 'Total Employees', value: stats.total, icon: Users, color: '#C8102E', bg: '#fff1f2' },
                { label: 'Total Subsidiaries', value: stats.subCount, icon: Building2, color: '#6366f1', bg: '#eef2ff' },
                currentUser?.subsidiary_id 
                  ? { label: 'Subsidiary Employees', value: stats.ownSubEmployees, icon: Briefcase, color: '#f59e0b', bg: '#fffbeb' }
                  : null,
                { label: 'Online Now', value: stats.online, icon: Globe, color: '#10b981', bg: '#ecfdf5', pulse: true },
              ].filter(Boolean).map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                  className="relative bg-white/70 backdrop-blur-xl border border-white rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.07)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.12)] transition-all duration-300 overflow-hidden group">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(circle at top right, ${s.color}08, transparent 70%)` }} />
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm" style={{ background: s.bg }}>
                      <s.icon className="w-5 h-5" style={{ color: s.color }} />
                    </div>
                    {s.pulse && <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /><span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Live</span></div>}
                  </div>
                  <p className="text-3xl font-black text-slate-800 tracking-tight">{s.value}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[2px] mt-1">{s.label}</p>
                </motion.div>
              ))}
            </div>

            {/* TWO-COLUMN LAYOUT */}
            <div className="flex gap-8 items-start">

              {/* LEFT SIDEBAR */}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                className="hidden lg:flex flex-col gap-6 w-72 shrink-0">

                {/* Search */}
                <div className="bg-white/70 backdrop-blur-xl border border-white rounded-3xl p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[3px] mb-3">Search</p>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input type="text" placeholder="Name, role, department..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm text-slate-700 placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red/30 transition-all font-medium" />
                  </div>
                </div>

                {/* Subsidiary Filter */}
                <div className="bg-white/70 backdrop-blur-xl border border-white rounded-3xl p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[3px] mb-3">Subsidiary</p>
                  {isSubAdmin ? (
                    <div className="flex items-center gap-3 px-4 py-3 bg-brand-red text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg">
                      <Building2 className="w-4 h-4 shrink-0 text-white animate-pulse" />
                      <span className="truncate flex-1">{currentUser?.subsidiary_name || 'My Subsidiary'}</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto no-scrollbar">
                      {[{ id: 'all', name: 'All' }, ...subsidiaries].map((sub, idx) => {
                        const palette = ['#C8102E','#6366f1','#f59e0b','#10b981','#ec4899','#f97316','#8b5cf6','#06b6d4','#84cc16','#a855f7','#14b8a6','#fb923c'];
                        const color = sub.name === 'All' ? '#C8102E' : palette[idx % palette.length];
                        const active = activeFilter === sub.name;
                        const count = sub.name === 'All' ? employees.length : employees.filter(e => e.subsidiary_name === sub.name).length;
                        return (
                          <button key={sub.id} onClick={() => setActiveFilter(sub.name)}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-left ${active ? 'text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50'}`}
                            style={active ? { background: color } : {}}>
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: color, opacity: active ? 1 : 0.5 }} />
                            <span className="truncate flex-1">{sub.name}</span>
                            <span className="ml-auto text-[8px] opacity-70 shrink-0">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>


                {/* Subsidiary Distribution Chart */}
                <div className="bg-white/70 backdrop-blur-xl border border-white rounded-3xl p-5 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[3px] mb-4">Distribution</p>
                  {(() => {
                    const subMap = {};
                    employees.forEach(e => { subMap[e.subsidiary_name] = (subMap[e.subsidiary_name] || 0) + 1; });
                    const subs = Object.entries(subMap).sort((a,b) => b[1]-a[1]);
                    const total = employees.length || 1;
                    const palette = ['#C8102E','#6366f1','#f59e0b','#10b981','#ec4899','#f97316','#8b5cf6'];
                    const stops = subs.reduce((acc, [,v], i) => {
                      const pct = (v / total) * 100;
                      const prev = acc.cum;
                      acc.cum += pct;
                      acc.parts.push(`${palette[i % palette.length]} ${prev.toFixed(1)}% ${acc.cum.toFixed(1)}%`);
                      return acc;
                    }, { cum: 0, parts: [] }).parts.join(', ');
                    return (
                      <div className="space-y-4">
                        <div className="relative flex justify-center">
                          <div className="w-28 h-28 rounded-full" style={{ background: stops ? `conic-gradient(${stops})` : '#f1f5f9' }} />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-16 h-16 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                              <p className="text-lg font-black text-slate-800">{employees.length}</p>
                              <p className="text-[7px] font-bold text-slate-400 uppercase">Total</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {subs.slice(0, 5).map(([subName, count], i) => (
                            <div key={subName} className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: palette[i % palette.length] }} />
                              <span className="text-[9px] font-bold text-slate-500 flex-1 truncate">{subName}</span>
                              <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${(count/total*100).toFixed(0)}%` }}
                                  transition={{ delay: i * 0.1, duration: 0.6 }} className="h-full rounded-full"
                                  style={{ background: palette[i % palette.length] }} />
                              </div>
                              <span className="text-[9px] font-black text-slate-400 w-4 text-right">{count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </motion.div>

              {/* RIGHT MAIN GRID */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight">Personnel Matrix</h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">{filteredEmployees.length} records found</p>
                  </div>
                  <div className="flex bg-white border border-slate-100 p-1 rounded-xl shadow-sm">
                    <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-300 hover:text-slate-500'}`}><LayoutGrid className="w-4 h-4" /></button>
                    <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-300 hover:text-slate-500'}`}><List className="w-4 h-4" /></button>
                  </div>
                </div>

                <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6' : 'space-y-3'}>
                  {paginatedEmployees.map((emp, i) => {
                    const dc = { IT:'#6366f1', Finance:'#f59e0b', HR:'#ec4899', Healthcare:'#10b981', Operations:'#f97316', Marketing:'#8b5cf6' };
                    const color = dc[emp.department] || '#64748b';
                    const lightBg = { IT:'#eef2ff', Finance:'#fffbeb', HR:'#fdf2f8', Healthcare:'#ecfdf5', Operations:'#fff7ed', Marketing:'#f5f3ff' }[emp.department] || '#f8fafc';
                    
                    const subInfo = subsidiaries.find(s => Number(s.id) === Number(emp.subsidiary_id));
                    const subHeadcount = subInfo ? subInfo.employees : 0;

                    if (viewMode === 'list') return (
                      <motion.div key={emp.id} layout initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                        onClick={() => setSelectedUser(emp)}
                        className="group cursor-pointer bg-white/80 backdrop-blur-sm border border-slate-100 rounded-2xl p-4 flex items-center gap-4 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:border-slate-200 transition-all duration-300">
                        <div className="relative shrink-0">
                          <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow-md" style={{ outline: `2px solid ${color}22` }}>
                            <img src={emp.profile_pic || `https://ui-avatars.com/api/?name=${emp.full_name}&background=C8102E&color=fff&bold=true`} className="w-full h-full object-cover" />
                          </div>
                          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-black text-slate-805 truncate group-hover:text-brand-red transition-colors">{emp.full_name}</h4>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{emp.role}</p>
                        </div>
                        <span className="hidden md:block text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest" style={{ background: lightBg, color }}>{emp.department}</span>
                        <span className="hidden lg:block text-[10px] font-bold text-slate-400 truncate max-w-[160px]">
                          {emp.subsidiary_name}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button onClick={e => e.stopPropagation()} className="p-2 rounded-xl bg-slate-50 hover:bg-brand-red hover:text-white text-slate-450 transition-all"><Mail className="w-3.5 h-3.5" /></button>
                          <button onClick={e => e.stopPropagation()} className="p-2 rounded-xl bg-slate-50 hover:bg-brand-red hover:text-white text-slate-450 transition-all"><PhoneCall className="w-3.5 h-3.5" /></button>
                          <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-brand-red transition-colors" />
                        </div>
                      </motion.div>
                    );
                    return (
                      <motion.div key={emp.id} layout initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ delay: i * 0.04, type: 'spring', stiffness: 220, damping: 22 }}
                        whileHover={{ y: -6 }} onClick={() => setSelectedUser(emp)}
                        className="group cursor-pointer bg-white/80 backdrop-blur-sm rounded-[28px] border border-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.13)] transition-all duration-400 overflow-hidden">
                        <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${color}, ${color}66)` }} />
                        <div className="p-6">
                          <div className="flex items-start justify-between mb-5">
                            <div className="relative">
                              <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-[0_4px_14px_rgba(0,0,0,0.1)] group-hover:scale-105 transition-transform duration-300"
                                style={{ outline: `2px solid ${color}33` }}>
                                <img src={emp.profile_pic || `https://ui-avatars.com/api/?name=${emp.full_name}&background=C8102E&color=fff&bold=true`} className="w-full h-full object-cover" />
                              </div>
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center shadow-sm">
                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                              </div>
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-xl" style={{ background: lightBg, color }}>{emp.department}</span>
                          </div>
                          <h4 className="text-base font-black text-slate-805 leading-tight group-hover:text-brand-red transition-colors duration-200 truncate">{emp.full_name}</h4>
                          <p className="text-[10px] font-bold text-slate-450 uppercase tracking-widest mt-1 mb-4 truncate">{emp.role}</p>
                          <div className="space-y-2 mb-5">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ background: lightBg }}>
                                <Building2 className="w-3 h-3" style={{ color }} />
                              </div>
                              <span className="text-[10px] font-bold text-slate-500 truncate">{emp.subsidiary_name}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center shrink-0">
                                  <MapPin className="w-3 h-3 text-slate-400" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-500">Colombo 01 • Ext: {emp.phone?.slice(-4) || '2042'}</span>
                              </div>
                            </div>
                            <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                              <div className="flex gap-1.5">
                                {[Mail, PhoneCall, Video].map((Icon, idx) => (
                                  <button key={idx} onClick={e => e.stopPropagation()}
                                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 text-slate-405 hover:text-white transition-all duration-200"
                                    style={{}} onMouseEnter={e => e.currentTarget.style.background = color} onMouseLeave={e => e.currentTarget.style.background = ''}>
                                    <Icon className="w-3.5 h-3.5" />
                                  </button>
                                ))}
                              </div>
                              <button className="flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-slate-300 group-hover:text-brand-red transition-colors duration-200">
                                Profile <ChevronRight className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="absolute inset-0 rounded-[28px] border-2 border-transparent group-hover:border-brand-red/10 transition-all pointer-events-none" />
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* ── PAGINATION CONTROLS ── */}
                  {totalPages > 1 && (
                    <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/40 backdrop-blur-xl border border-white/60 rounded-[28px] p-5 shadow-[0_12px_40px_rgba(0,0,0,0.03)] transition-all duration-300">
                      <div className="flex items-center gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse" />
                        <span className="text-xs font-semibold text-slate-550 tracking-wide">
                          Showing <span className="font-bold text-slate-800">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredEmployees.length)}</span> to <span className="font-bold text-slate-800">{Math.min(currentPage * itemsPerPage, filteredEmployees.length)}</span> of <span className="font-bold text-slate-800">{filteredEmployees.length}</span> employees
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all duration-300 ${
                            currentPage === 1 
                              ? 'border-slate-100 text-slate-300 bg-slate-50/20 cursor-not-allowed' 
                              : 'border-slate-200/85 text-slate-605 bg-white hover:bg-slate-900 hover:text-white hover:border-slate-900 hover:shadow-[0_8px_20px_rgba(15,23,42,0.15)] active:scale-95'
                          }`}
                        >
                          <ChevronLeft className="w-4.5 h-4.5" />
                        </button>

                        <div className="w-10 h-10 rounded-2xl text-xs font-bold flex items-center justify-center bg-gradient-to-r from-[#C8102E] to-[#A00D25] text-white shadow-[0_6px_20px_rgba(200,16,46,0.25)] select-none">
                          {currentPage}
                        </div>

                        <button
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-all duration-355 ${
                            currentPage === totalPages 
                              ? 'border-slate-100 text-slate-300 bg-slate-50/20 cursor-not-allowed' 
                              : 'border-slate-200/85 text-slate-605 bg-white hover:bg-slate-900 hover:text-white hover:border-slate-900 hover:shadow-[0_8px_20px_rgba(15,23,42,0.15)] active:scale-95'
                          }`}
                        >
                          <ChevronRight className="w-4.5 h-4.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
        ) : (
          <motion.div
            key="org-view"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="relative bg-gradient-to-br from-slate-50 via-white to-slate-50 rounded-[40px] border border-slate-100 shadow-[0_8px_48px_rgba(0,0,0,0.06)] overflow-hidden p-12 space-y-0"
          >
            {/* Subtle background accents */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-red/[0.03] rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/[0.03] rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

            {/* ── LEVEL 1: CHAIRMAN ── */}
            <div className="flex flex-col items-center relative z-10">
              <motion.div
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                whileHover={{ y: -5, boxShadow: '0 32px 64px rgba(200,16,46,0.12)' }}
                className="relative flex items-center gap-6 bg-white border border-slate-100 rounded-[28px] px-8 py-6 shadow-[0_8px_40px_rgba(0,0,0,0.08)] w-[480px] transition-all duration-300"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-red via-brand-red/60 to-transparent rounded-t-[28px]" />
                <div className="w-20 h-28 rounded-2xl overflow-hidden border-2 border-brand-red/20 shadow-lg shrink-0">
                  <img src="https://georgesteuart.lk/img/Sarva-Ameresekere.jpg" className="w-full h-full object-cover object-top" onError={e => e.target.src='https://ui-avatars.com/api/?name=Sarva+Ameresekere&background=C8102E&color=fff'} />
                </div>
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-red/8 border border-brand-red/15 rounded-full mb-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse" />
                    <span className="text-xs font-black text-brand-red uppercase tracking-widest">Group Chairman / CEO</span>
                  </div>
                  <p className="text-2xl font-black text-slate-900 tracking-tight leading-tight">Sarva Ameresekere</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Presiding Officer</span>
                  </div>
                </div>
              </motion.div>
              <div className="w-px h-8 bg-gradient-to-b from-brand-red/30 to-slate-200" />
              <div className="w-[75%] h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            </div>

            {/* ── LEVEL 2: GROUP DIRECTORS ── */}
            <div className="relative z-10">
              <div className="grid grid-cols-5 gap-4">
                {[
                  { name: 'Varuni Fernando', img: 'https://georgesteuart.lk/img/Varuni-Fernando.jpg' },
                  { name: 'Dai Pathmananthan', img: 'https://georgesteuart.lk/img/Dai-Pathmananthan.jpg' },
                  { name: 'Manoj Pilimatalawwe', img: 'https://georgesteuart.lk/img/Manoj-Pilimatalawwe.jpg' },
                  { name: 'Eran Ranasinghe', img: 'https://georgesteuart.lk/img/Eran-Ranasinghe.jpg' },
                  { name: 'Channe Wijemanne', img: 'https://georgesteuart.lk/img/Channe-Wijemanne.jpg' },
                ].map((d, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.07 }}
                    whileHover={{ y: -6 }}
                    className="flex flex-col items-center group cursor-default">
                    <div className="w-px h-8 bg-slate-200" />
                    <div className="bg-white border border-slate-100 rounded-[22px] p-5 flex flex-col items-center gap-3 w-full shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(99,102,241,0.12)] hover:border-indigo-100 transition-all duration-300">
                      <div className="w-16 h-20 rounded-xl overflow-hidden border border-slate-100 group-hover:border-indigo-200 transition-colors shadow-sm">
                        <img src={d.img} className="w-full h-full object-cover object-top" onError={e => e.target.src=`https://ui-avatars.com/api/?name=${d.name}&background=6366f1&color=fff`} />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-black text-slate-800 leading-tight">{d.name}</p>
                        <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider mt-1">Group Director</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* ── DIVIDER: INDEPENDENT DIRECTORS ── */}
            <div className="flex items-center gap-4 py-7 relative z-10">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="px-4 py-1.5 bg-amber-50 border border-amber-100 rounded-full text-xs font-black text-amber-600 uppercase tracking-widest">Independent Directors</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            {/* ── INDEPENDENT DIRECTORS ── */}
            <div className="grid grid-cols-4 gap-4 relative z-10">
              {[
                { name: 'Samantha Ranatunga', img: 'https://georgesteuart.lk/img/Samantha-Ranatunga.jpg' },
                { name: 'Dinesh Palipana', img: 'https://georgesteuart.lk/img/Dinesh-Palipana.jpg' },
                { name: 'Devaka Cooray', img: 'https://georgesteuart.lk/img/Devaka-Cooray.jpg' },
                { name: 'Dimantha Seneviratne', img: 'https://georgesteuart.lk/img/Dimantha-Seneviratne.jpg' },
              ].map((d, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.06 }}
                  whileHover={{ y: -4 }}
                  className="group flex items-center gap-4 bg-white border border-slate-100 rounded-[20px] p-4 shadow-[0_4px_16px_rgba(0,0,0,0.05)] hover:shadow-[0_8px_32px_rgba(245,158,11,0.12)] hover:border-amber-100 transition-all duration-300">
                  <div className="w-12 h-16 rounded-xl overflow-hidden border border-slate-100 group-hover:border-amber-200 transition-colors shrink-0 shadow-sm">
                    <img src={d.img} className="w-full h-full object-cover object-top" onError={e => e.target.src=`https://ui-avatars.com/api/?name=${d.name}&background=f59e0b&color=fff`} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-800 leading-tight">{d.name}</p>
                    <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider mt-1">Independent Director</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* ── DIVIDER: SUBSIDIARY ORG CHART & DIRECTORIES ── */}
            <div className="flex items-center gap-4 py-7 relative z-10">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="px-4 py-1.5 bg-brand-red/5 border border-brand-red/15 rounded-full text-xs font-black text-brand-red uppercase tracking-widest">
                Subsidiary Corporate Networks
              </span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            {/* ── DYNAMIC SUBSIDIARY CARDS DECK ── */}
            <div className="space-y-12 relative z-10">
              {subsidiaries.map((sub, sIdx) => {
                const palette = ['#10b981', '#6366f1', '#f59e0b', '#ec4899', '#f97316', '#8b5cf6', '#06b6d4', '#84cc16'];
                const subColor = palette[sIdx % palette.length];
                const lightBg = ['bg-emerald-50/50', 'bg-indigo-50/50', 'bg-amber-50/50', 'bg-pink-50/50', 'bg-orange-50/50', 'bg-purple-50/50', 'bg-cyan-50/50', 'bg-lime-50/50'][sIdx % palette.length];

                // Filter directors & employees for this specific subsidiary
                const subDirs = directors.filter(d => Number(d.subsidiary_id) === Number(sub.id));
                const subEmps = employees.filter(emp => Number(emp.subsidiary_id) === Number(sub.id));
                const isExpanded = !!expandedSubs[sub.id];

                return (
                  <motion.div
                    key={sub.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: sIdx * 0.05 }}
                    className="bg-white border border-slate-100 rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.06)] overflow-hidden transition-all duration-300"
                    style={{ borderTop: `6px solid ${subColor}` }}
                  >
                    {/* Subsidiary Card Header */}
                    <div 
                      onClick={() => toggleSubExpand(sub.id)}
                      className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-50 bg-slate-50/20 cursor-pointer hover:bg-slate-50/40 select-none transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm" style={{ backgroundColor: `${subColor}12` }}>
                          <Building2 className="w-6 h-6" style={{ color: subColor }} />
                        </div>
                        <div>
                          <h3 className="text-xl font-black text-slate-800 tracking-tight">{sub.name}</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{sub.location || 'George Steuart Group'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 self-end md:self-auto" onClick={e => e.stopPropagation()}>

                        <div className="px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-2">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span className="text-xs font-black text-slate-600">{subEmps.length + subDirs.length} Portal Members</span>
                        </div>
                        
                        {(subEmps.length > 0 || subDirs.length > 0) && (
                          <button
                            onClick={() => toggleSubExpand(sub.id)}
                            className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all shadow-md active:scale-95 animate-fade-in"
                          >
                            {isExpanded ? (
                              <>
                                <span>Collapse Details</span>
                                <ChevronUp className="w-4 h-4" />
                              </>
                            ) : (
                              <>
                                <span>Expand Details</span>
                                <ChevronDown className="w-4 h-4" />
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-slate-50 overflow-hidden"
                        >
                          <div className="p-8 space-y-8">
                            {/* SUB-SECTION 1: BOARD OF DIRECTORS */}
                            <div className="space-y-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-1 h-4 bg-brand-red rounded-full" />
                                <h4 className="text-[10px] font-black uppercase tracking-[3px] text-slate-450">
                                  Board of Directors
                                </h4>
                              </div>

                              {subDirs.length === 0 ? (
                                <p className="text-xs font-semibold text-slate-350 italic pl-1">No directors assigned to this subsidiary board.</p>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                                  {subDirs.map((dir) => (
                                    <motion.div
                                      key={dir.id}
                                      whileHover={{ y: -4 }}
                                      className="group flex items-center gap-4 bg-slate-50/50 border border-slate-100 rounded-[20px] p-4 hover:bg-white hover:border-slate-200 hover:shadow-md transition-all duration-300"
                                    >
                                      <div className="w-12 h-16 rounded-xl overflow-hidden border border-slate-100 group-hover:border-indigo-100 transition-colors shrink-0 shadow-sm">
                                        {dir.image_url ? (
                                          <img src={dir.image_url} alt={dir.name} className="w-full h-full object-cover object-top" />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center font-black text-sm uppercase" style={{ backgroundColor: `${subColor}12`, color: subColor }}>
                                            {dir.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                          </div>
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-sm font-black text-slate-800 leading-tight group-hover:text-brand-red transition-colors truncate">{dir.name}</p>
                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1 truncate" style={{ color: subColor }}>
                                          {dir.title || 'Director'}
                                        </p>
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* SUB-SECTION 2: COLLAPSIBLE EMPLOYEE DIRECTORY */}
                            {subEmps.length > 0 && (
                              <div className="pt-6 border-t border-slate-50 space-y-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-1 h-4" style={{ backgroundColor: subColor }} />
                                  <h4 className="text-[10px] font-black uppercase tracking-[3px] text-slate-450">
                                    Key Personnel & Team
                                  </h4>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                  {subEmps.map((emp) => (
                                    <motion.div
                                      key={emp.id}
                                      whileHover={{ y: -4 }}
                                      onClick={() => setSelectedUser(emp)}
                                      className="group cursor-pointer bg-white border border-slate-100 rounded-2xl p-5 hover:shadow-md hover:border-slate-200 transition-all flex flex-col justify-between"
                                    >
                                      <div className="flex items-start justify-between gap-3 mb-4">
                                        <div className="flex items-center gap-3">
                                          <div className="relative shrink-0">
                                            <div className="w-11 h-11 rounded-xl overflow-hidden border-2 border-white shadow-sm" style={{ outline: `2px solid ${subColor}22` }}>
                                              <img src={emp.profile_pic || `https://ui-avatars.com/api/?name=${emp.full_name}&background=${subColor.slice(1)}&color=fff&bold=true`} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border border-white rounded-full" />
                                          </div>
                                          <div className="min-w-0">
                                            <h5 className="text-sm font-black text-slate-805 truncate group-hover:text-brand-red transition-colors">{emp.full_name}</h5>
                                            <p className="text-[9px] font-bold text-slate-450 uppercase tracking-widest mt-0.5 truncate">{emp.role || 'Member'}</p>
                                          </div>
                                        </div>
                                        <span className="text-[8px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider shrink-0" style={{ backgroundColor: `${subColor}12`, color: subColor }}>
                                          {emp.department || 'Operations'}
                                        </span>
                                      </div>

                                      <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                                        <p className="text-[10px] text-slate-400 font-semibold truncate max-w-[140px]">{emp.email}</p>
                                        <div className="flex gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                                          <a
                                            href={`mailto:${emp.email}`}
                                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 text-slate-405 hover:text-white transition-all"
                                            onMouseEnter={e => e.currentTarget.style.background = subColor}
                                            onMouseLeave={e => e.currentTarget.style.background = ''}
                                          >
                                            <Mail className="w-3.5 h-3.5" />
                                          </a>
                                          <button
                                            onClick={() => {
                                              sessionStorage.setItem('quick_chat_partner', JSON.stringify({
                                                id: emp.id,
                                                full_name: emp.full_name,
                                                profile_pic: emp.profile_pic || null,
                                                subsidiary_name: emp.subsidiary_name || '',
                                                job_title: emp.role || 'Member'
                                              }));
                                              navigate('/messages');
                                            }}
                                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-50 text-slate-405 hover:text-white transition-all"
                                            onMouseEnter={e => e.currentTarget.style.background = subColor}
                                            onMouseLeave={e => e.currentTarget.style.background = ''}
                                          >
                                            <MessageSquare className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {/* ── FOOTER CTA ── */}
            <div className="pt-6 relative z-10">
              <div className="flex items-center justify-between bg-slate-900 rounded-[20px] px-8 py-5 shadow-xl overflow-hidden relative">
                <div className="absolute inset-0 bg-gradient-to-r from-brand-red/10 to-transparent pointer-events-none" />
                <div className="relative z-10">
                  <p className="text-base font-black text-white">Interactive Entity Navigator</p>
                  <p className="text-xs text-white/50 font-medium mt-0.5">Synchronized with George Steuart Group HR database</p>
                </div>
                <div className="relative z-10 flex gap-3">
                  <button onClick={handleFullScreen} className="px-6 py-2.5 bg-white/10 text-white/70 text-xs font-black uppercase tracking-widest rounded-xl border border-white/10 hover:bg-white/15 transition-all">
                    {isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
                  </button>
                </div>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* EMPLOYEE PROFILE SLIDE PANEL */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[100] flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="absolute inset-0 bg-slate-900/70 backdrop-blur-md"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="relative w-full max-w-[520px] bg-[#F8FAFC] h-full shadow-[−40px_0_120px_rgba(0,0,0,0.3)] overflow-y-auto no-scrollbar flex flex-col"
            >

              {/* ── HERO HEADER ── */}
              <div className="relative overflow-hidden" style={{ minHeight: 280 }}>
                {/* Mesh gradient bg */}
                <div className="absolute inset-0"
                  style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 70%, #1e3a5f 100%)' }} />
                {/* Decorative blobs */}
                <div className="absolute -top-10 -right-10 w-56 h-56 rounded-full opacity-20 blur-3xl"
                  style={{ background: 'radial-gradient(circle, #C8102E, transparent)' }} />
                <div className="absolute bottom-0 left-0 w-40 h-40 rounded-full opacity-15 blur-2xl"
                  style={{ background: 'radial-gradient(circle, #6366f1, transparent)' }} />
                {/* Grid texture */}
                <div className="absolute inset-0 opacity-[0.04]"
                  style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='32' height='32' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 0h32v1H0zM0 0v32h1V0z' fill='%23ffffff'/%3E%3C/svg%3E")` }} />

                {/* Top bar */}
                <div className="absolute top-5 left-5 right-5 flex justify-between items-center z-20">
                  <div className="flex items-center gap-2 px-3.5 py-1.5 bg-white/10 backdrop-blur-md border border-white/15 rounded-full">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[9px] font-black text-white/90 uppercase tracking-widest">Online</span>
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="w-9 h-9 rounded-full bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-white/70 hover:bg-white hover:text-slate-900 transition-all duration-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Profile photo + info */}
                <div className="relative z-10 flex items-end gap-6 px-8 pb-8 pt-20">
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-24 h-24 rounded-[22px] overflow-hidden border-[3px] border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                      <img
                        src={selectedUser.profile_pic || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.full_name)}&background=C8102E&color=fff&bold=true&size=200`}
                        className="w-full h-full object-cover"
                        alt={selectedUser.full_name}
                      />
                    </div>
                    <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-emerald-500 border-2 border-white rounded-full flex items-center justify-center shadow-md">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                    </div>
                  </div>

                  {/* Name block */}
                  <div className="flex-1 min-w-0 pb-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2.5 py-1 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full text-[8px] font-black text-white/70 uppercase tracking-widest">
                        GS-{selectedUser.id}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest"
                        style={{ background: 'rgba(99,102,241,0.25)', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.3)' }}>
                        {selectedUser.department || 'Operations'}
                      </span>
                    </div>
                    <h2 className="text-2xl font-black text-white leading-tight tracking-tight truncate">
                      {selectedUser.full_name}
                    </h2>
                    <p className="text-white/50 text-xs font-semibold mt-1 truncate">
                      {selectedUser.role || 'Employee'} · {selectedUser.subsidiary_name || 'GS Group'}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── BODY ── */}
              <div className="flex-1 flex flex-col gap-4 p-5 pb-36">

                {/* Quick contact chips */}
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-2.5 px-4 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                      <Mail className="w-3.5 h-3.5 text-indigo-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Email</p>
                      <p className="text-[11px] font-black text-slate-800 truncate">{selectedUser.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5 px-4 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                      <Phone className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Phone</p>
                      <p className="text-[11px] font-black text-slate-800">{selectedUser.phone || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Organization info card */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-slate-50 flex items-center gap-2">
                    <div className="w-1 h-4 rounded-full bg-[#C8102E]" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[3px]">Organization</span>
                  </div>
                  <div className="grid grid-cols-2 divide-x divide-slate-50">
                    {[
                      { label: 'Subsidiary', value: selectedUser.subsidiary_name || 'GS Group' },
                      { label: 'Department', value: selectedUser.department || 'Operations' },
                      { label: 'Role', value: selectedUser.role || 'Employee' },
                      { label: 'Location', value: 'Colombo 01' },
                    ].map((item, i) => (
                      <div key={i} className={`px-5 py-4 ${i >= 2 ? 'border-t border-slate-50' : ''}`}>
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.label}</p>
                        <p className="text-[12px] font-black text-slate-800 leading-tight truncate">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hierarchy timeline */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-slate-50 flex items-center gap-2">
                    <div className="w-1 h-4 rounded-full bg-indigo-500" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[3px]">Hierarchy</span>
                  </div>
                  <div className="px-5 py-4 space-y-2">
                    {[
                      { label: 'Group Chairman', sub: 'Sarva Ameresekere', active: false },
                      { label: 'Managing Director', sub: 'Executive Office', active: false },
                      { label: selectedUser.role || 'Employee', sub: selectedUser.full_name, active: true },
                      { label: 'Support Staff', sub: 'Associate Level', active: false },
                    ].map((node, i, arr) => (
                      <div key={i} className="flex items-center gap-3 relative">
                        {i < arr.length - 1 && (
                          <div className="absolute left-[11px] top-7 w-[1.5px] h-4 bg-slate-100" />
                        )}
                        <div className={`w-[22px] h-[22px] rounded-full shrink-0 flex items-center justify-center border-2 z-10
                          ${node.active ? 'bg-[#C8102E] border-[#C8102E]/30 shadow-[0_0_0_4px_rgba(200,16,46,0.1)]' : 'bg-slate-100 border-white'}`}>
                          {node.active && <div className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <div className={`flex-1 px-3.5 py-2.5 rounded-xl text-left ${node.active
                          ? 'bg-[#C8102E]/5 border border-[#C8102E]/10'
                          : 'bg-slate-50/50 border border-slate-100'}`}>
                          <p className={`text-[10px] font-black uppercase tracking-wider ${node.active ? 'text-[#C8102E]' : 'text-slate-400'}`}>{node.label}</p>
                          <p className="text-[9px] text-slate-400 font-semibold mt-0.5 truncate">{node.sub}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills / responsibilities */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-slate-50 flex items-center gap-2">
                    <div className="w-1 h-4 rounded-full bg-amber-400" />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[3px]">Responsibilities</span>
                  </div>
                  <div className="px-5 py-4 flex flex-wrap gap-2">
                    {['Operational Strategy', 'Resource Management', 'Cross-Entity Liaison', 'Treasury Support'].map((tag, i) => (
                      <span key={i} className="px-3 py-1.5 bg-slate-50 border border-slate-100 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-amber-400" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Same subsidiary colleagues */}
                {employees.filter(e => e.subsidiary_name === selectedUser.subsidiary_name && e.id !== selectedUser.id).length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-slate-50 flex items-center gap-2">
                      <div className="w-1 h-4 rounded-full bg-emerald-400" />
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-[3px]">Colleagues</span>
                    </div>
                    <div className="px-5 py-4 flex gap-3 overflow-x-auto no-scrollbar">
                      {employees.filter(e => e.subsidiary_name === selectedUser.subsidiary_name && e.id !== selectedUser.id).slice(0, 6).map((e, i) => (
                        <motion.div
                          key={i}
                          whileHover={{ y: -4 }}
                          onClick={() => setSelectedUser(e)}
                          className="min-w-[68px] text-center cursor-pointer group"
                        >
                          <div className="w-12 h-12 mx-auto rounded-xl overflow-hidden border-2 border-white shadow-sm group-hover:border-indigo-200 group-hover:shadow-md transition-all duration-200">
                            <img src={e.profile_pic || `https://ui-avatars.com/api/?name=${encodeURIComponent(e.full_name)}&background=C8102E&color=fff&bold=true`} className="w-full h-full object-cover" alt={e.full_name} />
                          </div>
                          <p className="text-[8px] font-black text-slate-500 uppercase mt-1.5 leading-tight truncate group-hover:text-indigo-600 transition-colors">{e.full_name.split(' ')[0]}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* ── STICKY ACTION BAR ── */}
              <div className="sticky bottom-0 bg-white/95 backdrop-blur-xl border-t border-slate-100 p-5 flex flex-col gap-3 shadow-[0_-8px_32px_rgba(0,0,0,0.06)]">
                <div className="grid grid-cols-2 gap-3">
                  <button className="flex items-center justify-center gap-2 bg-[#C8102E] hover:bg-[#A00D25] text-white py-3.5 rounded-2xl font-black uppercase tracking-wider text-[10px] transition-all duration-200 shadow-lg shadow-red-900/15 active:scale-95">
                    <Phone className="w-4 h-4" /> Call Employee
                  </button>
                  <button
                    onClick={() => {
                      sessionStorage.setItem('quick_chat_partner', JSON.stringify({
                        id: selectedUser.id,
                        full_name: selectedUser.full_name,
                        job_title: selectedUser.job_title,
                        subsidiary_name: selectedUser.subsidiary_name,
                        profile_pic: selectedUser.profile_pic
                      }));
                      navigate('/messages');
                    }}
                    className="flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white py-3.5 rounded-2xl font-black uppercase tracking-wider text-[10px] transition-all duration-200 shadow-lg shadow-slate-900/10 active:scale-95"
                  >
                    <MessageSquare className="w-4 h-4" /> Message
                  </button>
                </div>
                <button className="flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-500 border border-slate-150 py-3 rounded-2xl font-black uppercase tracking-wider text-[9px] transition-all duration-200 active:scale-95">
                  <Globe className="w-3.5 h-3.5" /> View Subsidiary Portal
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}} />
    </div>
  );
};

export default EmployeeDirectory;
