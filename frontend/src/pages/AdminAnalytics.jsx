import { useState, useEffect } from 'react';
import { 
  Users, 
  BarChart3, 
  Zap, 
  ShieldCheck, 
  Activity, 
  ChevronRight,
  Filter,
  ArrowUpRight,
  ClipboardList,
  Clock,
  AlertTriangle,
  Heart,
  TrendingUp,
  UserPlus
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const AdminAnalytics = () => {
  const { user } = useAuth();
  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  
  // Tab: 'system' or 'tickets'
  const [activeSubTab, setActiveSubTab] = useState('system');

  // System Stats State
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Tickets Stats State
  const [ticketSummary, setTicketSummary] = useState(null);
  const [loadingTickets, setLoadingTickets] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const params = user?.role !== 'super_admin' ? { subsidiaryId: user.subsidiary_id } : {};
        const response = await axios.get(`${backendUrl}/api/analytics/stats`, { params });
        setStats(response.data);
      } catch (err) {
        console.error('Failed to fetch stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [user]);

  // Fetch ticket analytics
  const fetchTicketAnalytics = async () => {
    setLoadingTickets(true);
    try {
      const res = await axios.get(`${backendUrl}/api/tickets/analytics/summary`, {
        params: { department: 'all' }
      });
      setTicketSummary(res.data);
    } catch (err) {
      console.error('Failed to fetch ticket analytics:', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'tickets') {
      fetchTicketAnalytics();
    }
  }, [activeSubTab]);

  const subsidiaries = [
    { name: 'Optimize-IT', value: 400 },
    { name: 'GS Health', value: 300 },
    { name: 'GS Teas', value: 300 },
    { name: 'GS Travels', value: 200 },
    { name: 'Others', value: 150 },
  ];

  const COLORS = ['#3b82f6', '#f59e0b', '#be123c', '#10b981', '#6366f1', '#64748b'];

  if (loading) return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-brand-red rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] pb-20 transition-colors duration-350">

      {/* HERO BANNER */}
      <div className="px-4 sm:px-8 pt-4 sm:pt-8">
        <div className="relative h-[220px] sm:h-[300px] md:h-[320px] w-full overflow-hidden rounded-[24px] sm:rounded-[36px] shadow-2xl group">
          <img 
            src="/admin_analytics_cover.png" 
            alt="Analytics" 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1000'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/60 to-transparent"/>
          <div className="absolute inset-0 flex items-center px-6 sm:px-10 md:px-16">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-indigo-500/20 backdrop-blur-md border border-indigo-500/30 rounded-full mb-2.5 sm:mb-3.5">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse"/>
                <span className="text-[8px] font-black text-indigo-400 uppercase tracking-[3px]">System Intelligence</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-tighter leading-none mb-2">
                Analytics &amp; <span className="text-brand-red">Network Insights</span>
              </h1>
              <p className="text-white/60 text-xs sm:text-sm font-medium leading-relaxed max-w-lg hidden sm:block">
                Monitor platform interaction, check network health logs, and gather corporate engagement telemetry in real-time.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-8 md:px-10 -mt-10 sm:-mt-16 relative z-10 space-y-6">

        {/* Title Tab Selector Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-[#131B2E] p-6 sm:p-8 rounded-3xl sm:rounded-[36px] border border-slate-100 dark:border-white/5 shadow-xl glass-card flex flex-col gap-6"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-slate-100 dark:border-white/5 pb-4">
            <div className="flex items-center gap-4 sm:gap-6 text-center sm:text-left flex-col sm:flex-row">
              <div className="w-14 h-14 bg-brand-red/5 dark:bg-white/5 rounded-2xl flex items-center justify-center text-brand-red dark:text-white shrink-0">
                <BarChart3 className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tracking-tight uppercase">System Analytics</h2>
                <p className="text-slate-400 dark:text-slate-500 text-xs font-medium mt-1">Real-time data synchronization & platform statistics.</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setActiveSubTab('system')}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                activeSubTab === 'system' 
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md' 
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              System Intelligence
            </button>
            <button 
              onClick={() => setActiveSubTab('tickets')}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${
                activeSubTab === 'tickets' 
                  ? 'bg-brand-red text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              Ticketing Analytics
            </button>
          </div>
        </motion.div>

        {/* Tab Contents */}
        <AnimatePresence mode="wait">
          {activeSubTab === 'system' ? (
            <motion.div
              key="system-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* METRIC CARDS */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                {[
                  { label: 'Network Uptime', value: '99.9%', icon: Zap, color: 'text-brand-red dark:text-brand-red', trend: '+0.01%', status: 'Stable', gradient: 'from-red-500 to-rose-600', bgLight: 'bg-red-50 dark:bg-red-950/20' },
                  { label: 'Active Sessions', value: stats?.userCount || '1,248', icon: Users, color: 'text-indigo-600 dark:text-indigo-400', trend: '+12%', status: 'Growing', gradient: 'from-blue-500 to-indigo-600', bgLight: 'bg-blue-50 dark:bg-blue-950/20' },
                  { label: 'Security Score', value: '100%', icon: ShieldCheck, color: 'text-emerald-600 dark:text-emerald-400', trend: 'Optimal', status: 'Secure', gradient: 'from-emerald-500 to-teal-600', bgLight: 'bg-emerald-50 dark:bg-emerald-950/20' },
                  { label: 'Response Time', value: '42ms', icon: Activity, color: 'text-amber-500 dark:text-amber-400', trend: '-5ms', status: 'Fast', gradient: 'from-amber-500 to-orange-600', bgLight: 'bg-amber-50 dark:bg-amber-950/20' }
                ].map((metric, i) => (
                  <div key={i} className="bg-white dark:bg-[#131B2E] p-5 sm:p-6 rounded-2xl sm:rounded-[28px] border border-slate-100 dark:border-white/5 shadow-md relative overflow-hidden group">
                    <div className={`absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-br ${metric.gradient} rounded-full opacity-10 dark:opacity-20 blur-xl`} />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 ${metric.bgLight} rounded-xl flex items-center justify-center ${metric.color}`}>
                          <metric.icon className="w-5.5 h-5.5" />
                        </div>
                        <span className="text-[8px] sm:text-[10px] font-black text-emerald-600 dark:text-emerald-450 uppercase tracking-widest">{metric.trend}</span>
                      </div>
                      <p className="text-[8px] sm:text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 truncate">{metric.label}</p>
                      <h4 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">{metric.value}</h4>
                      <div className="mt-4 pt-3 border-t border-slate-50 dark:border-white/5 flex items-center justify-between">
                        <span className="text-[8px] sm:text-[9px] font-bold text-slate-300 dark:text-slate-500 uppercase tracking-widest">{metric.status}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-slate-200 dark:text-slate-600" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* CHARTS CONTAINER */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
                <div className="lg:col-span-2">
                  <div className="bg-white dark:bg-[#131B2E] rounded-3xl sm:rounded-[40px] border border-slate-100 dark:border-white/5 p-6 sm:p-10 shadow-xl glass-card relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 sm:mb-12">
                      <div>
                        <h3 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white uppercase tracking-wider">Engagement Velocity</h3>
                        <p className="text-slate-400 dark:text-slate-455 text-xs font-medium mt-1">Interactions recorded across all subsidiary nodes.</p>
                      </div>
                    </div>
                    <div className="h-64 sm:h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats?.engagementTrends || []}>
                          <defs>
                            <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#C8102E" stopOpacity={0.15}/>
                              <stop offset="95%" stopColor="#C8102E" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#cbd5e1', fontWeight: 800 }} dy={10} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#cbd5e1', fontWeight: 800 }} />
                          <Tooltip contentStyle={{ borderRadius: '16px', backgroundColor: '#1E293B', border: '1px solid rgba(255,255,255,0.1)', fontSize: '11px', color: '#fff', fontWeight: 700 }} />
                          <Area type="monotone" dataKey="likes" stroke="#C8102E" strokeWidth={3} fillOpacity={1} fill="url(#colorLikes)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 sm:space-y-8">
                  <div className="bg-white dark:bg-[#131B2E] rounded-3xl border border-slate-100 dark:border-white/5 p-6 sm:p-8 shadow-xl glass-card">
                    <h3 className="font-black text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4 sm:mb-6 px-2">Subsidiary Matrix</h3>
                    <div className="space-y-1.5">
                      {subsidiaries.map((sub, i) => (
                        <button key={i} className="w-full flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100/50 dark:border-white/5 hover:bg-white dark:hover:bg-[#1E293B] group transition-all text-left">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-350 group-hover:text-brand-red dark:group-hover:text-brand-red transition-colors">{sub.name}</span>
                          <ChevronRight className="w-4 h-4 text-slate-200 dark:text-slate-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl border border-white/5">
                    <div className="relative z-10">
                      <ShieldCheck className="w-8 h-8 text-brand-red mb-6" />
                      <h4 className="font-black text-lg mb-2">Security Hub</h4>
                      <p className="text-white/40 text-xs leading-relaxed mb-6 sm:mb-8">All network communications are encrypted with enterprise-grade SSL.</p>
                      <button className="w-full py-4 bg-brand-red text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-red-dark transition-colors border border-transparent">
                        Security Audit
                      </button>
                    </div>
                    <div className="absolute top-0 right-0 w-36 h-36 bg-brand-red/10 rounded-bl-full translate-x-10 -translate-y-10"></div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="tickets-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6 animate-fade-in"
            >
              {loadingTickets ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
                  <Loader2 className="w-9 h-9 animate-spin text-brand-red" />
                  <p className="text-xs font-bold">Assembling ticketing charts...</p>
                </div>
              ) : ticketSummary ? (
                <>
                  {/* Summary row */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                    {[
                      { label: 'Total Logs', value: ticketSummary.summary.total, icon: ClipboardList, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/20' },
                      { label: 'Open Inquiries', value: ticketSummary.summary.open, icon: Clock, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/20' },
                      { label: 'SLA Compliance (%)', value: `${ticketSummary.summary.slaCompliance}%`, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
                      { label: 'Avg Resolution Time', value: `${ticketSummary.summary.avgResolutionTimeHours} Hrs`, icon: Activity, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/20' }
                    ].map((card, i) => (
                      <div key={i} className="bg-white dark:bg-[#131B2E] p-5 sm:p-6 rounded-2xl sm:rounded-[28px] border border-slate-100 dark:border-white/5 shadow-md flex items-center justify-between">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{card.label}</p>
                          <h3 className={`text-2xl font-black ${card.color} mt-1`}>{card.value}</h3>
                        </div>
                        <div className={`w-11 h-11 rounded-xl ${card.bg} flex items-center justify-center ${card.color}`}>
                          <card.icon className="w-5.5 h-5.5" />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Charts row 1: Department Breakdown & Priority Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Department Breakdown */}
                    <div className="bg-white dark:bg-[#131B2E] p-6 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm">
                      <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest mb-4">Tickets by Department</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={ticketSummary.departments}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.1)" />
                            <XAxis dataKey="department" tick={{ fontSize: 9, fontWeight: 'bold', fill: '#cbd5e1' }} tickFormatter={(v) => v.toUpperCase()} />
                            <YAxis tick={{ fontSize: 9, fontWeight: 'bold', fill: '#cbd5e1' }} />
                            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} />
                            <Bar dataKey="count" name="Tickets" fill="#C8102E" radius={[8, 8, 0, 0]}>
                              {ticketSummary.departments.map((entry, idx) => (
                                <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Priority Breakdown */}
                    <div className="bg-white dark:bg-[#131B2E] p-6 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm">
                      <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest mb-4">Tickets by Priority</h3>
                      <div className="h-64 flex items-center justify-center">
                        <div className="w-[60%] h-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={ticketSummary.priorities}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="count"
                                nameKey="priority"
                              >
                                {ticketSummary.priorities.map((entry, idx) => (
                                  <Cell key={`cell-${idx}`} fill={COLORS[(idx + 2) % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="w-[40%] text-[10px] space-y-1.5 font-bold text-slate-500">
                          {ticketSummary.priorities.map((entry, idx) => (
                            <div key={idx} className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[(idx + 2) % COLORS.length] }} />
                              <span className="capitalize">{entry.priority}: {entry.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Charts row 2: Monthly Trends & Status breakdowns */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Monthly Trends */}
                    <div className="lg:col-span-2 bg-white dark:bg-[#131B2E] p-6 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm">
                      <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest mb-4">Monthly Trends</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={ticketSummary.trends}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148,163,184,0.1)" />
                            <XAxis dataKey="month" tick={{ fontSize: 9, fontWeight: 'bold', fill: '#cbd5e1' }} />
                            <YAxis tick={{ fontSize: 9, fontWeight: 'bold', fill: '#cbd5e1' }} />
                            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} />
                            <Line type="monotone" dataKey="count" name="Tickets Logged" stroke="#C8102E" strokeWidth={3} activeDot={{ r: 6 }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Status Breakdown */}
                    <div className="bg-white dark:bg-[#131B2E] p-6 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm">
                      <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest mb-4">Tickets by Status</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={ticketSummary.statuses} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(148,163,184,0.1)" />
                            <XAxis type="number" tick={{ fontSize: 8, fill: '#cbd5e1' }} />
                            <YAxis dataKey="status" type="category" tick={{ fontSize: 8, fill: '#cbd5e1', fontWeight: 'bold' }} width={70} />
                            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} />
                            <Bar dataKey="count" name="Count" fill="#3b82f6" radius={[0, 5, 5, 0]}>
                              {ticketSummary.statuses.map((entry, idx) => (
                                <Cell key={`cell-${idx}`} fill={COLORS[(idx + 3) % COLORS.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Workload breakdown */}
                  <div className="bg-white dark:bg-[#131B2E] p-6 rounded-3xl border border-slate-100 dark:border-white/5 shadow-sm">
                    <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest mb-4">Support Team Performance & worklog</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-white/5 text-slate-400 dark:text-slate-500">
                            <th className="pb-3 font-black uppercase tracking-wider">Specialist</th>
                            <th className="pb-3 font-black uppercase tracking-wider">Department</th>
                            <th className="pb-3 font-black uppercase tracking-wider">Role</th>
                            <th className="pb-3 font-black uppercase tracking-wider text-center">Active Worklog</th>
                            <th className="pb-3 font-black uppercase tracking-wider text-center">Resolved Tickets</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ticketSummary.teamWorkload && ticketSummary.teamWorkload.length > 0 ? (
                            ticketSummary.teamWorkload.map(staff => (
                              <tr key={staff.id} className="border-b border-slate-50 dark:border-white/5 last:border-none">
                                <td className="py-3 font-black text-slate-800 dark:text-white">{staff.full_name}</td>
                                <td className="py-3 text-slate-500 dark:text-slate-400 capitalize">{staff.department || 'N/A'}</td>
                                <td className="py-3 text-slate-500 dark:text-slate-400 capitalize">{staff.role?.replace('_', ' ')}</td>
                                <td className="py-3 font-black text-center text-blue-600">{staff.active_tickets}</td>
                                <td className="py-3 font-black text-center text-emerald-600">{staff.resolved_tickets}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="5" className="py-6 text-center text-slate-400 italic">No specialist records found</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}

export default AdminAnalytics;
