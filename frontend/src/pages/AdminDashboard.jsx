import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  FileText,
  Calendar,
  TrendingUp,
  ChevronRight,
  ShieldCheck,
  MousePointer2,
  HelpCircle,
  Rss,
  BookOpen,
  MoreVertical,
  Clock,
  AlertTriangle,
  Megaphone,
  Gift,
  UserPlus,
  TicketCheck,
  Building2,
  Activity,
  Zap,
  ArrowUpRight,
  Sparkles,
  BarChart3,
  Globe,
  Camera,
  Newspaper,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

// ── Relative Time Utility ────────────────────────────────────────────────────
const getRelativeTime = (dateStr) => {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  } catch {
    return '';
  }
};

// ── Ticket priority/status colors ────────────────────────────────────────────
const priorityStyles = {
  critical: 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900/40',
  high: 'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-900/40',
  medium: 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40',
  low: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40',
};

const statusStyles = {
  pending: 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/30',
  in_progress: 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/30',
  resolved: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30',
  closed: 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700',
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isSuperAdmin = user?.role === 'super_admin';

  // ── State ──────────────────────────────────────────────────────────────────
  const [stats, setStats] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [joiners, setJoiners] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tickerIndex, setTickerIndex] = useState(0);

  // Ticker timer interval
  useEffect(() => {
    if (announcements.length === 0) return;
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % announcements.length);
    }, 4550);
    return () => clearInterval(interval);
  }, [announcements.length]);

  // ── Live Clock ─────────────────────────────────────────────────────────────
  const [currentDateTime, setCurrentDateTime] = useState('');
  useEffect(() => {
    const tick = () =>
      setCurrentDateTime(
        new Date().toLocaleString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const getTimeBasedGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  // ── Data Fetch ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const subParam =
          user?.role !== 'super_admin' ? user.subsidiary_id : null;

        const [statsRes, postsRes, holidaysRes] = await Promise.all([
          axios.get('http://localhost:5000/api/analytics/stats', {
            params: { subsidiaryId: subParam },
          }),
          axios.get('http://localhost:5000/api/posts', {
            params: { subsidiary_id: user?.subsidiary_id },
          }),
          axios.get('http://localhost:5000/api/holidays'),
        ]);

        setStats(statsRes.data);
        setAnnouncements(
          postsRes.data
            .filter(
              (p) => p.type === 'news' || p.type === 'announcement'
            )
            .slice(0, 5)
        );

        const futureHolidays = holidaysRes.data
          .filter((h) => new Date(h.holiday_date) >= new Date())
          .slice(0, 4);
        setUpcomingEvents(futureHolidays);

        // Fetch support tickets
        try {
          const ticketsRes = await axios.get(
            'http://localhost:5000/api/tickets',
            {
              params: {
                subsidiary_id: user?.role !== 'super_admin' ? user.subsidiary_id : null
              }
            }
          );
          setTickets(ticketsRes.data.slice(0, 5));
        } catch (e) {
          console.error('Tickets fetch failed', e);
        }

        // Fetch new joiners
        try {
          const joinersRes = await axios.get(
            'http://localhost:5000/api/joiners',
            {
              params: {
                subsidiary_id: user?.role !== 'super_admin' ? user.subsidiary_id : null
              }
            }
          );
          setJoiners(joinersRes.data.slice(0, 4));
        } catch (e) {
          console.error('Joiners fetch failed', e);
        }

        // Fetch alerts for count
        try {
          const alertsRes = await axios.get(
            'http://localhost:5000/api/alerts',
            {
              params: {
                subsidiary_id: user?.subsidiary_id,
                role: user?.role,
              },
            }
          );
          setAlerts(alertsRes.data);
        } catch (e) {
          console.error('Alerts fetch failed', e);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // ── Chart Data ─────────────────────────────────────────────────────────────
  const distributionData =
    stats?.subsidiaryUsage?.map((s, i) => ({
      name: s.name,
      value: s.value,
      color: [
        '#C8102E', // brand red
        '#2563EB', // deep blue
        '#059669', // rich emerald
        '#D97706', // amber gold
        '#7C3AED', // modern purple
        '#0891B2', // bright cyan
        '#DB2777', // hot pink
        '#475569', // neutral slate
      ][i % 8],
    })) || [];

  const activityData = stats?.engagementTrends || [];

  const totalDistribution = distributionData.reduce(
    (sum, d) => sum + d.value,
    0
  );

  // Pending tickets count
  const pendingTickets = tickets.filter(
    (t) => t.status === 'pending' || t.status === 'in_progress'
  ).length;

  // ── Loading State ──────────────────────────────────────────────────────────
  if (loading)
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 border-4 border-slate-100 border-t-brand-red rounded-full animate-spin" />
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[4px]">
            Loading Executive Dashboard
          </p>
        </div>
      </div>
    );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 pb-12 max-w-[1600px] mx-auto px-4 md:px-6">
      {/* ── LIVE ANNOUNCEMENT TICKER ──────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#C8102E] to-[#9B1C39] rounded-2xl px-4 py-2.5 flex items-center justify-between shadow-lg shadow-red-900/20">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-2 h-2 rounded-full bg-white animate-ping opacity-80" />
            <span className="text-white text-[10px] font-black uppercase tracking-widest">
              Live
            </span>
          </div>
          <div className="w-px h-4 bg-white/30" />
          <div className="flex-1 relative h-5 overflow-hidden flex items-center min-w-0">
            <AnimatePresence mode="wait">
              {announcements.length > 0 ? (
                <motion.span
                  key={tickerIndex}
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -15, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  className="absolute text-[12px] font-semibold text-white/90 truncate w-full cursor-pointer hover:text-white"
                  onClick={() => navigate('/feed')}
                >
                  {announcements[tickerIndex]?.content}
                </motion.span>
              ) : (
                <motion.span
                  key="default"
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -15, opacity: 0 }}
                  className="absolute text-[12px] font-semibold text-white/90 truncate w-full"
                >
                  Welcome to the Executive Dashboard — All systems operational  •  Check the latest analytics and team updates
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
        <button
          onClick={() => navigate('/feed')}
          className="shrink-0 ml-4 px-4 py-1.5 bg-white/15 hover:bg-white/25 border border-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer"
        >
          View All
        </button>
      </div>

      {/* ── WELCOME BANNER ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative h-[220px] sm:h-[280px] md:h-[340px] w-full overflow-hidden rounded-[32px] shadow-2xl group"
      >
        <img
          src="/admin_dashboard_cover.png"
          alt="Welcome Banner"
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/60 to-transparent" />
        <div className="absolute inset-0 flex items-center px-6 sm:px-10 md:px-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-red/20 backdrop-blur-md border border-brand-red/30 rounded-full mb-3">
              <div className="w-1.5 h-1.5 bg-brand-red rounded-full animate-pulse" />
              <span className="text-[8px] font-black text-brand-red uppercase tracking-[3px]">
                {isSuperAdmin
                  ? 'Group Executive Operations'
                  : `${user?.subsidiary_name || 'Subsidiary'} Operations`}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-tighter leading-none mb-2">
              {getTimeBasedGreeting()},{' '}
              <span className="text-brand-red">
                {user?.full_name?.split(' ')[0] || 'Administrator'}
              </span>
            </h1>
            <p className="text-white/50 text-xs sm:text-sm font-medium leading-relaxed max-w-lg hidden sm:block">
              {isSuperAdmin
                ? 'Orchestrate corporate networks, audit global documents & policies, and manage subsidiary systems intelligence across the George Steuart enterprise.'
                : `Manage your subsidiary operations, monitor team engagement, and oversee ${user?.subsidiary_name || 'your'} department resources.`}
            </p>

            {/* Live clock */}
            <div className="flex items-center gap-2 mt-4">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shadow-lg shadow-amber-400/50" />
              <span className="text-[10px] text-slate-300 font-bold tracking-tight drop-shadow">
                {currentDateTime}
              </span>
            </div>
          </motion.div>
        </div>

        {/* Role Badge */}
        <div className="absolute top-6 right-6 hidden md:flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl">
          <ShieldCheck className="w-4 h-4 text-brand-red" />
          <span className="text-[9px] font-black text-white uppercase tracking-widest">
            {user?.role === 'super_admin'
              ? 'Super Admin'
              : user?.role === 'it_admin'
              ? 'IT Admin'
              : user?.role === 'hr_admin'
              ? 'HR Admin'
              : 'Sub Admin'}
          </span>
        </div>
      </motion.div>

      {/* ── STATS GRID (4 cards) ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          {
            label: 'Total Employees',
            value: stats?.userCount || 0,
            subtitle: isSuperAdmin ? 'Across all subsidiaries' : user?.subsidiary_name || 'Your subsidiary',
            icon: Users,
            gradient: 'from-red-500 to-rose-600',
            glow: 'shadow-red-500/10 dark:shadow-red-550/20',
            bgLight: 'bg-red-50 dark:bg-red-950/20',
            textColor: 'text-red-600 dark:text-red-400',
          },
          {
            label: 'Active Documents',
            value: stats?.docCount || 0,
            subtitle: 'Policies & files',
            icon: FileText,
            gradient: 'from-emerald-500 to-teal-600',
            glow: 'shadow-emerald-500/10 dark:shadow-emerald-550/20',
            bgLight: 'bg-emerald-50 dark:bg-emerald-950/20',
            textColor: 'text-emerald-600 dark:text-emerald-400',
          },
          {
            label: 'Open Tickets',
            value: pendingTickets,
            subtitle: `${tickets.length} total submissions`,
            icon: TicketCheck,
            gradient: 'from-amber-500 to-orange-600',
            glow: 'shadow-amber-500/10 dark:shadow-amber-550/20',
            bgLight: 'bg-amber-50 dark:bg-amber-950/20',
            textColor: 'text-amber-600 dark:text-amber-400',
          },
          {
            label: 'Total Content',
            value: stats?.postCount || 0,
            subtitle: 'Posts & announcements',
            icon: Rss,
            gradient: 'from-violet-500 to-purple-600',
            glow: 'shadow-violet-500/10 dark:shadow-violet-550/20',
            bgLight: 'bg-violet-50 dark:bg-violet-950/20',
            textColor: 'text-violet-600 dark:text-violet-400',
          },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`relative overflow-hidden p-6 bg-white dark:bg-[#131B2E] rounded-[28px] border border-slate-100 dark:border-white/5 shadow-xl glass-card transition-all group duration-300`}
          >
            {/* Decorative gradient orb */}
            <div
              className={`absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br ${stat.gradient} rounded-full opacity-10 dark:opacity-20 blur-xl group-hover:opacity-25 transition-opacity pointer-events-none`}
            />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-12 h-12 rounded-2xl ${stat.bgLight} dark:bg-white/5 flex items-center justify-center ${stat.textColor} dark:text-white group-hover:scale-110 transition-transform`}
                >
                  <stat.icon className="w-6 h-6" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-200 dark:text-white/20 group-hover:text-brand-red dark:group-hover:text-brand-red transition-colors" />
              </div>
              <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight mb-1">
                {stat.value.toLocaleString()}
              </h4>
              <p className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                {stat.label}
              </p>
              <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-1">
                {stat.subtitle}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── MAIN GRID ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Section: Charts, Widgets & Quick Access */}
        <div className="col-span-12 lg:col-span-9 space-y-6">
          {/* ── REAL-TIME WIDGETS ROW ────────────────────────────────── */}
          {/* Recent Support Tickets */}
          <div className="bg-white dark:bg-[#131B2E] rounded-[28px] border border-slate-100 dark:border-white/5 shadow-xl glass-card overflow-hidden">
            <div className="p-6 pb-4">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md animate-float">
                    <TicketCheck className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-white tracking-tight uppercase tracking-widest">
                      Support Tickets
                    </h3>
                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                      Recent submissions
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/admin/tickets')}
                  className="text-[9px] font-black text-brand-red uppercase tracking-widest hover:underline cursor-pointer"
                >
                  View All
                </button>
              </div>
            </div>
            <div className="px-4 pb-6 space-y-2.5 max-h-[300px] overflow-y-auto custom-scrollbar">
              {tickets.length > 0 ? (
                tickets.map((ticket, idx) => (
                  <motion.div
                    key={ticket.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ x: 4, scale: 1.005 }}
                    onClick={() => navigate('/admin/tickets')}
                    className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 hover:bg-white dark:hover:bg-[#1E293B] hover:border-brand-red/20 dark:hover:border-brand-red/30 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-black text-slate-800 dark:text-white truncate group-hover:text-brand-red dark:group-hover:text-brand-red transition-colors">
                        {ticket.subject}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-wider border ${
                            statusStyles[ticket.status] ||
                            statusStyles.pending
                          }`}
                        >
                          {ticket.status?.replace('_', ' ')}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase tracking-wider border ${
                            priorityStyles[ticket.priority] ||
                            priorityStyles.medium
                          }`}
                        >
                          {ticket.priority}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500">
                        {getRelativeTime(ticket.created_at)}
                      </p>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-brand-red ml-auto mt-1 transition-colors" />
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10">
                  <TicketCheck className="w-8 h-8 text-slate-200 dark:text-slate-700 mb-2" />
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">
                    No tickets found
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── CHARTS ROW ───────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Subsidiary Distribution */}
            <div className="md:col-span-5 bg-white dark:bg-[#131B2E] p-6 rounded-[28px] border border-slate-100 dark:border-white/5 shadow-xl glass-card">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-black text-slate-800 dark:text-white text-sm tracking-tight uppercase tracking-widest">
                    {isSuperAdmin
                      ? 'Subsidiary Distribution'
                      : 'Team Distribution'}
                  </h3>
                  <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-widest">
                    Employee breakdown
                  </p>
                </div>
                <MoreVertical className="w-4 h-4 text-slate-300 dark:text-slate-600" />
              </div>
              <div className="h-56 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distributionData}
                      innerRadius={65}
                      outerRadius={92}
                      paddingAngle={4}
                      dataKey="value"
                      animationBegin={0}
                      animationDuration={1200}
                    >
                      {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '16px',
                        backgroundColor: '#1E293B',
                        border: '1px solid rgba(255,255,255,0.1)',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
                        fontSize: '11px',
                        color: '#fff',
                        fontWeight: 700,
                      }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-slate-800 dark:text-white">
                    {totalDistribution || stats?.userCount || 0}
                  </span>
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                    Total
                  </span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
                {distributionData.slice(0, 6).map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 truncate max-w-[80px]">
                      {item.name}
                    </span>
                    <span className="ml-auto text-[9px] font-black text-slate-800 dark:text-slate-200">
                      {item.value}
                    </span>
                    {totalDistribution > 0 && (
                      <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500">
                        {Math.round((item.value / totalDistribution) * 100)}%
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Engagement Activity */}
            <div className="md:col-span-7 bg-white dark:bg-[#131B2E] p-6 rounded-[28px] border border-slate-100 dark:border-white/5 shadow-xl glass-card relative overflow-hidden">
              {/* Decorative glow */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-red/5 rounded-full blur-3xl pointer-events-none" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-black text-slate-800 dark:text-white text-sm tracking-tight uppercase tracking-widest">
                      Engagement Activity
                    </h3>
                    <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 uppercase tracking-widest">
                      Last 7 days · Likes & Comments
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-brand-red" />
                      <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Likes
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-slate-800 dark:bg-slate-200" />
                      <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                        Comments
                      </span>
                    </div>
                  </div>
                </div>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={activityData}>
                      <defs>
                        <linearGradient
                          id="colorLikesAdmin"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#C8102E"
                            stopOpacity={0.15}
                          />
                          <stop
                            offset="95%"
                            stopColor="#C8102E"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="colorCommentsAdmin"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#1E293B"
                            stopOpacity={0.1}
                          />
                          <stop
                            offset="95%"
                            stopColor="#1E293B"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="rgba(148, 163, 184, 0.1)"
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: 9,
                          fill: '#94a3b8',
                          fontWeight: 700,
                        }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: 9,
                          fill: '#94a3b8',
                          fontWeight: 700,
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: '16px',
                          backgroundColor: '#1E293B',
                          border: '1px solid rgba(255,255,255,0.1)',
                          boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
                          fontSize: '11px',
                          color: '#fff',
                          fontWeight: 700,
                        }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="likes"
                        stroke="#C8102E"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorLikesAdmin)"
                        dot={{
                          fill: '#C8102E',
                          strokeWidth: 2,
                          r: 4,
                          stroke: '#fff',
                        }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                        animationDuration={1500}
                      />
                      <Area
                        type="monotone"
                        dataKey="comments"
                        stroke="#1E293B"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorCommentsAdmin)"
                        dot={{
                          fill: '#1E293B',
                          strokeWidth: 2,
                          r: 3,
                          stroke: '#fff',
                        }}
                        animationDuration={1500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* ── QUICK ACCESS GRID ─────────────────────────────────────── */}
          <div className="bg-white dark:bg-[#131B2E] p-6 rounded-[28px] border border-slate-100 dark:border-white/5 shadow-xl glass-card">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 dark:from-slate-800 dark:to-slate-950 flex items-center justify-center shadow-md">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white tracking-tight uppercase tracking-widest">
                    Quick Access
                  </h3>
                  <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
                    Administration shortcuts
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
              {[
                {
                  name: 'Employee Directory',
                  icon: Users,
                  path: '/admin/directory',
                  bg: 'bg-rose-50 dark:bg-rose-950/20',
                  text: 'text-rose-600 dark:text-rose-400',
                  border: 'border-rose-100 dark:border-rose-900/30',
                  hoverGlow: 'hover:shadow-rose-500/10 dark:hover:shadow-rose-500/20',
                },
                {
                  name: 'Documents',
                  icon: FileText,
                  path: '/admin/documents',
                  bg: 'bg-emerald-50 dark:bg-emerald-950/20',
                  text: 'text-emerald-600 dark:text-emerald-400',
                  border: 'border-emerald-100 dark:border-emerald-900/30',
                  hoverGlow: 'hover:shadow-emerald-500/10 dark:hover:shadow-emerald-500/20',
                },
                {
                  name: 'Calendar',
                  icon: Calendar,
                  path: '/admin/calendar',
                  bg: 'bg-blue-50 dark:bg-blue-950/20',
                  text: 'text-blue-600 dark:text-blue-400',
                  border: 'border-blue-100 dark:border-blue-900/30',
                  hoverGlow: 'hover:shadow-blue-500/10 dark:hover:shadow-blue-500/20',
                },
                {
                  name: 'Media Manager',
                  icon: Newspaper,
                  path: '/admin/news',
                  bg: 'bg-indigo-50 dark:bg-indigo-950/20',
                  text: 'text-indigo-600 dark:text-indigo-400',
                  border: 'border-indigo-100 dark:border-indigo-900/30',
                  hoverGlow: 'hover:shadow-indigo-500/10 dark:hover:shadow-indigo-500/20',
                },
                {
                  name: 'Support Desk',
                  icon: HelpCircle,
                  path: '/admin/tickets',
                  bg: 'bg-amber-50 dark:bg-amber-950/20',
                  text: 'text-amber-600 dark:text-amber-400',
                  border: 'border-amber-100 dark:border-amber-900/30',
                  hoverGlow: 'hover:shadow-amber-500/10 dark:hover:shadow-amber-500/20',
                },
                {
                  name: 'Alerts Manager',
                  icon: Megaphone,
                  path: '/admin/alerts',
                  bg: 'bg-red-50 dark:bg-red-950/20',
                  text: 'text-red-600 dark:text-red-400',
                  border: 'border-red-100 dark:border-red-900/30',
                  hoverGlow: 'hover:shadow-red-500/10 dark:hover:shadow-red-500/20',
                },
                {
                  name: 'Offers Manager',
                  icon: Gift,
                  path: '/admin/offers',
                  bg: 'bg-violet-50 dark:bg-violet-950/20',
                  text: 'text-violet-600 dark:text-violet-400',
                  border: 'border-violet-100 dark:border-violet-900/30',
                  hoverGlow: 'hover:shadow-violet-500/10 dark:hover:shadow-violet-500/20',
                },
                {
                  name: 'Memory Wall',
                  icon: Camera,
                  path: '/admin/memories',
                  bg: 'bg-teal-50 dark:bg-teal-950/20',
                  text: 'text-teal-600 dark:text-teal-400',
                  border: 'border-teal-100 dark:border-teal-900/30',
                  hoverGlow: 'hover:shadow-teal-500/10 dark:hover:shadow-teal-500/20',
                },
              ].map((item, i) => (
                <motion.button
                  key={i}
                  whileHover={{ y: -4, scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center gap-2.5 p-4 rounded-2xl border ${item.bg} ${item.border} ${item.hoverGlow} hover:shadow-lg transition-all cursor-pointer group`}
                >
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center ${item.text} ${item.bg} group-hover:scale-110 transition-transform`}
                  >
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[8.5px] font-black uppercase tracking-wider text-center leading-tight ${item.text} opacity-80 group-hover:opacity-100`}
                  >
                    {item.name}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT SIDEBAR WIDGETS ──────────────────────────────────── */}
        <div className="col-span-12 lg:col-span-3 space-y-6">

          {/* Admin Quick Stats */}
          <div className="bg-white dark:bg-[#131B2E] p-6 rounded-[28px] border border-slate-100 dark:border-white/5 shadow-xl glass-card">
            <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[3px] mb-4">
              Admin Overview
            </h3>
            <div className="space-y-3">
              {[
                {
                  label: isSuperAdmin ? 'Subsidiaries' : 'Departments',
                  value: isSuperAdmin ? distributionData.length : (stats?.subsidiaryUsage?.length || 0),
                  icon: Building2,
                  color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30',
                },
                {
                  label: 'Active Alerts',
                  value: alerts.length,
                  icon: Megaphone,
                  color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30',
                },
                {
                  label: 'Upcoming Events',
                  value: upcomingEvents.length,
                  icon: Calendar,
                  color: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/20 border-violet-100 dark:border-violet-900/30',
                },
                {
                  label: 'New Joiners',
                  value: joiners.length,
                  icon: UserPlus,
                  color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30',
                },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  whileHover={{ x: 3 }}
                  className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 hover:bg-white dark:hover:bg-[#1E293B] hover:shadow-md transition-all cursor-pointer"
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center border ${item.color}`}
                  >
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 flex-1 uppercase tracking-wide">
                    {item.label}
                  </span>
                  <span className="text-sm font-black text-slate-800 dark:text-white">
                    {item.value}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Latest Announcements */}
          <div className="bg-white dark:bg-[#131B2E] p-6 rounded-[28px] border border-slate-100 dark:border-white/5 shadow-xl glass-card">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <MousePointer2 className="w-4 h-4 text-brand-red animate-pulse" />
                <h3 className="font-black text-slate-800 dark:text-white text-sm tracking-tight uppercase tracking-widest">
                  Announcements
                </h3>
              </div>
              <button
                onClick={() => navigate('/feed')}
                className="text-[9px] font-black text-brand-red uppercase tracking-widest hover:underline cursor-pointer"
              >
                All
              </button>
            </div>
            <div className="space-y-4">
              {announcements.length > 0 ? (
                announcements.slice(0, 3).map((news, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ x: 3 }}
                    onClick={() => navigate('/feed')}
                    className="relative pl-5 border-l-2 border-slate-100 dark:border-white/5 group cursor-pointer hover:border-brand-red/30 dark:hover:border-brand-red/30 transition-colors"
                  >
                    {i === 0 && (
                      <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-brand-red ring-4 ring-red-50 dark:ring-red-950/40" />
                    )}
                    <h4 className="text-[11px] font-black text-slate-800 dark:text-white group-hover:text-brand-red dark:group-hover:text-brand-red transition-colors line-clamp-1 leading-snug">
                      {news.content?.substring(0, 35)}...
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2">
                      {news.content}
                    </p>
                    <p className="text-[8px] font-bold text-slate-400 dark:text-slate-500 mt-1.5 uppercase tracking-widest">
                      {getRelativeTime(news.created_at)}
                    </p>
                  </motion.div>
                ))
              ) : (
                <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                  No recent announcements
                </p>
              )}
            </div>
          </div>

          {/* Upcoming Holidays */}
          <div className="bg-white dark:bg-[#131B2E] p-6 rounded-[28px] border border-slate-100 dark:border-white/5 shadow-xl glass-card">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-brand-red" />
                <h3 className="font-black text-slate-800 dark:text-white text-sm tracking-tight uppercase tracking-widest">
                  Holidays
                </h3>
              </div>
              <button
                onClick={() => navigate('/calendar')}
                className="text-[9px] font-black text-brand-red uppercase tracking-widest hover:underline cursor-pointer"
              >
                All
              </button>
            </div>
            <div className="space-y-3.5">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ x: 3 }}
                    className="flex items-center gap-3.5 group cursor-pointer"
                    onClick={() => navigate('/calendar')}
                  >
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/5 flex flex-col items-center justify-center border border-slate-100 dark:border-white/5 group-hover:bg-brand-red dark:group-hover:bg-brand-red group-hover:border-brand-red dark:group-hover:border-brand-red transition-all shrink-0">
                      <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 group-hover:text-white/70 dark:group-hover:text-white/70 tracking-widest leading-none uppercase">
                        {new Date(event.holiday_date)
                          .toLocaleString('default', { month: 'short' })
                          .toUpperCase()}
                      </span>
                      <span className="text-lg font-black text-slate-800 dark:text-white group-hover:text-white leading-none mt-0.5">
                        {new Date(event.holiday_date).getDate()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[11px] font-black text-slate-800 dark:text-white group-hover:text-brand-red dark:group-hover:text-brand-red transition-colors truncate">
                        {event.name}
                      </h4>
                      <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">
                        {event.type}
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                  No upcoming holidays
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="pt-10 mt-8 border-t border-slate-100 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
        <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          © 2026 George Steuart Group. All rights reserved.
        </p>
        <div className="flex items-center gap-8">
          {['Privacy Policy', 'Terms of Use', 'Contact Support'].map(
            (link, i) => (
              <button
                key={i}
                className="text-[10px] font-bold text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors uppercase tracking-widest cursor-pointer"
              >
                {link}
              </button>
            )
          )}
        </div>
      </footer>
    </div>
  );
};

export default AdminDashboard;
