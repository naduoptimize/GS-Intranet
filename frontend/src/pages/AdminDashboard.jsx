import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, ArrowRight, ArrowUpRight, Building2, CalendarDays, ChevronRight,
  Clock3, FileText, LayoutGrid, Megaphone, Plus, Radio, Rss, ShieldCheck,
  Sparkles, TrendingUp, UserPlus, Users, Zap,
} from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AnimatePresence, motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:5000/api';
const BRAND_COLORS = ['#C41230', '#C7A35A', '#9E0E27', '#8A7460', '#DFCDA9', '#5E5355', '#B8894B', '#7D2638'];

const relativeTime = (value) => {
  const time = new Date(value).getTime();
  if (!value || Number.isNaN(time)) return 'Recently';
  const minutes = Math.max(0, Math.floor((Date.now() - time) / 60000));
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  return `${Math.floor(minutes / 1440)}d ago`;
};

const Card = ({ children, className = '' }) => (
  <section className={`rounded-[24px] border border-[#E8E0D7] bg-white shadow-[0_18px_48px_-34px_rgba(94,45,51,.32)] dark:border-white/[0.07] dark:bg-[#111827] ${className}`}>
    {children}
  </section>
);

const Heading = ({ icon: Icon, eyebrow, title, action, onAction }) => (
  <div className="flex items-start justify-between gap-4">
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-red-light text-brand-red dark:bg-brand-red/15">
        <Icon className="h-4.5 w-4.5" />
      </div>
      <div>
        <p className="text-[8px] font-black uppercase tracking-[.22em] text-brand-gold">{eyebrow}</p>
        <h2 className="mt-0.5 text-[15px] font-black tracking-tight text-text-main dark:text-white">{title}</h2>
      </div>
    </div>
    {action && (
      <button onClick={onAction} className="group flex items-center gap-1 text-[8px] font-black uppercase tracking-[.14em] text-text-secondary transition-colors hover:text-brand-red">
        {action}<ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </button>
    )}
  </div>
);

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const groupAccess = ['superadmin', 'super_admin', 'groupadmin', 'group_admin'].includes(user?.role);
  const [stats, setStats] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [joiners, setJoiners] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ticker, setTicker] = useState(0);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!announcements.length) return undefined;
    const timer = setInterval(() => setTicker((current) => (current + 1) % announcements.length), 5000);
    return () => clearInterval(timer);
  }, [announcements.length]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const subsidiaryId = groupAccess ? null : user?.subsidiary_id;
      setLoading(true);
      const results = await Promise.allSettled([
        axios.get(`${API_URL}/analytics/stats`, { params: { subsidiaryId } }),
        axios.get(`${API_URL}/posts`, { params: { subsidiary_id: subsidiaryId, role: user?.role, user_id: user?.id } }),
        axios.get(`${API_URL}/holidays`),
        axios.get(`${API_URL}/joiners`, { params: { subsidiary_id: subsidiaryId } }),
        axios.get(`${API_URL}/alerts`, { params: { subsidiary_id: user?.subsidiary_id, role: user?.role } }),
      ]);
      if (!mounted) return;
      const [statsResult, postsResult, holidaysResult, joinersResult, alertsResult] = results;
      if (statsResult.status === 'fulfilled') setStats(statsResult.value.data);
      if (postsResult.status === 'fulfilled') setAnnouncements(postsResult.value.data.filter((post) => ['news', 'announcement'].includes(post.type)).slice(0, 5));
      if (holidaysResult.status === 'fulfilled') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        setHolidays(holidaysResult.value.data.filter((item) => new Date(item.holiday_date) >= today).slice(0, 4));
      }
      if (joinersResult.status === 'fulfilled') setJoiners(joinersResult.value.data.slice(0, 4));
      if (alertsResult.status === 'fulfilled') setAlerts(alertsResult.value.data);
      setLoading(false);
    };
    if (user) load();
    return () => { mounted = false; };
  }, [user, groupAccess]);

  const distribution = useMemo(() => (stats?.subsidiaryUsage || []).map((item, index) => ({
    name: item.name,
    value: Number(item.value) || 0,
    color: BRAND_COLORS[index % BRAND_COLORS.length],
  })), [stats]);
  const distributionTotal = distribution.reduce((sum, item) => sum + item.value, 0);
  const activity = stats?.engagementTrends || [];
  const firstName = user?.full_name?.split(' ')[0] || 'Administrator';
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  const metrics = [
    { label: 'Total employees', value: stats?.userCount || 0, note: 'Group workforce', icon: Users, path: '/admin/directory' },
    { label: 'Active documents', value: stats?.docCount || 0, note: 'Policies & resources', icon: FileText, path: '/admin/documents' },
    { label: 'Live notices', value: alerts.length, note: 'Active broadcasts', icon: Megaphone, path: '/admin/communications' },
    { label: 'Published content', value: stats?.postCount || 0, note: 'Posts & updates', icon: Rss, path: '/feed' },
  ];

  const actions = [
    { label: 'Add employee', detail: 'Create a staff profile', icon: UserPlus, path: '/admin/directory' },
    { label: 'Publish notice', detail: 'Send a group update', icon: Megaphone, path: '/admin/communications' },
    { label: 'Upload document', detail: 'Share a new resource', icon: FileText, path: '/admin/documents' },
    { label: 'Create event', detail: 'Update the calendar', icon: CalendarDays, path: '/admin/calendar' },
  ];

  if (loading) return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="text-center">
        <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-red text-white shadow-xl shadow-brand-red/20">
          <div className="absolute inset-[-6px] animate-ping rounded-[20px] border border-brand-red/20" />
          <LayoutGrid className="h-5 w-5 animate-pulse" />
        </div>
        <p className="mt-5 text-[9px] font-black uppercase tracking-[.24em] text-text-secondary">Preparing dashboard</p>
      </div>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-5 pb-8">
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-[24px] border border-[#E8E0D7] bg-white shadow-[0_20px_55px_-38px_rgba(94,45,51,.35)] dark:border-white/[0.07] dark:bg-[#111827]">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-red via-brand-red to-brand-gold" />
        <div className="flex flex-col gap-5 px-5 pb-5 pt-6 sm:px-7 sm:pb-6 sm:pt-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-red text-white shadow-lg shadow-brand-red/15 sm:flex">
              <LayoutGrid className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[7px] font-black uppercase tracking-[.15em] text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Operational</span>
                <span className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[.18em] text-brand-gold"><ShieldCheck className="h-3 w-3" />Executive overview</span>
              </div>
              <h1 className="mt-2 text-2xl font-black tracking-[-.035em] text-text-main dark:text-white sm:text-[30px]">{greeting}, {firstName}.</h1>
              <p className="mt-1.5 max-w-2xl text-[11px] font-medium leading-5 text-text-secondary sm:text-[12px]">Your group administration overview, activity and key updates in one place.</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-[#EEE8E0] bg-brand-ivory/80 px-4 py-3 dark:border-white/[0.06] dark:bg-white/[0.035]">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-brand-red shadow-sm dark:bg-white/[0.07]"><Clock3 className="h-4 w-4" /></div>
            <div><p className="text-[7px] font-black uppercase tracking-[.12em] text-text-secondary">{now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p><p className="mt-0.5 text-sm font-black text-text-main dark:text-white">{now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p></div>
          </div>
        </div>
        <div className="mx-5 mb-5 flex items-center gap-3 rounded-2xl border border-brand-red/10 bg-brand-red-light/60 px-3.5 py-3 dark:border-brand-red/20 dark:bg-brand-red/10 sm:mx-7 sm:mb-6">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-brand-red shadow-sm dark:bg-white/10"><Radio className="h-3.5 w-3.5" /></span>
          <span className="hidden shrink-0 text-[7px] font-black uppercase tracking-[.16em] text-brand-red sm:block">Latest update</span>
          <span className="hidden h-4 w-px bg-brand-red/15 sm:block" />
          <div className="relative h-4 min-w-0 flex-1 overflow-hidden"><AnimatePresence mode="wait"><motion.button key={ticker} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }} onClick={() => navigate('/feed')} className="absolute max-w-full truncate text-left text-[9px] font-bold text-text-main hover:text-brand-red dark:text-slate-200">{announcements[ticker]?.content || 'Your group workspace is up to date.'}</motion.button></AnimatePresence></div>
          <button onClick={() => navigate('/feed')} className="flex shrink-0 items-center gap-1 text-[7px] font-black uppercase tracking-wider text-brand-red hover:text-brand-red-dark">View feed<ChevronRight className="h-3 w-3" /></button>
        </div>
      </motion.section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metrics.map((item, index) => (
          <motion.button key={item.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .04 }} whileHover={{ y: -2 }} onClick={() => navigate(item.path)} className="group rounded-[22px] border border-[#E8E0D7] bg-white p-4 text-left shadow-[0_15px_45px_-36px_rgba(94,45,51,.45)] transition-all hover:border-brand-gold/40 hover:shadow-[0_22px_50px_-34px_rgba(158,14,39,.3)] dark:border-white/[0.07] dark:bg-[#111827] sm:p-5">
            <div className="flex items-start justify-between"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-red-light text-brand-red dark:bg-brand-red/15"><item.icon className="h-4.5 w-4.5" /></span><ArrowUpRight className="h-4 w-4 text-slate-300 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-red" /></div>
            <p className="mt-4 text-2xl font-black tracking-[-.04em] text-text-main dark:text-white sm:text-3xl">{Number(item.value).toLocaleString()}</p>
            <p className="mt-1 text-[9px] font-black uppercase tracking-[.12em] text-text-main dark:text-slate-200">{item.label}</p>
            <p className="mt-1 hidden text-[9px] font-medium text-text-secondary sm:block">{item.note}</p>
          </motion.button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-5">
        <Card className="col-span-12 p-5 lg:col-span-8 lg:p-6">
          <Heading icon={TrendingUp} eyebrow="Performance" title="Engagement activity" action="Open feed" onAction={() => navigate('/feed')} />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 pl-[52px]"><p className="text-[9px] text-text-secondary">Likes and comments during the last seven days</p><div className="flex gap-4 text-[8px] font-black uppercase tracking-wider text-text-secondary"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-brand-red" />Likes</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-brand-gold" />Comments</span></div></div>
          <div className="mt-4 h-[270px]"><ResponsiveContainer width="100%" height="100%"><AreaChart data={activity} margin={{ top: 12, right: 8, left: -22, bottom: 0 }}><defs><linearGradient id="redArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#C41230" stopOpacity=".22" /><stop offset="1" stopColor="#C41230" stopOpacity="0" /></linearGradient><linearGradient id="goldArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#C7A35A" stopOpacity=".18" /><stop offset="1" stopColor="#C7A35A" stopOpacity="0" /></linearGradient></defs><CartesianGrid vertical={false} strokeDasharray="4 5" stroke="rgba(116,104,106,.13)" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94898A', fontSize: 9, fontWeight: 700 }} dy={10} /><YAxis axisLine={false} tickLine={false} allowDecimals={false} tick={{ fill: '#94898A', fontSize: 9, fontWeight: 700 }} /><Tooltip contentStyle={{ borderRadius: 14, border: '1px solid #E8E0D7', background: '#fff', color: '#261F20', fontSize: 10, boxShadow: '0 16px 40px rgba(94,45,51,.14)' }} /><Area type="monotone" dataKey="likes" stroke="#C41230" strokeWidth={3} fill="url(#redArea)" /><Area type="monotone" dataKey="comments" stroke="#C7A35A" strokeWidth={2.5} fill="url(#goldArea)" /></AreaChart></ResponsiveContainer></div>
        </Card>

        <Card className="col-span-12 p-5 lg:col-span-4 lg:p-6">
          <Heading icon={Building2} eyebrow="Workforce" title="Group distribution" action="Manage" onAction={() => navigate('/admin/subsidiaries')} />
          <div className="relative mx-auto mt-3 h-[180px] max-w-[260px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={distribution} dataKey="value" innerRadius={58} outerRadius={79} paddingAngle={4} cornerRadius={6}>{distribution.map((item) => <Cell key={item.name} fill={item.color} stroke="transparent" />)}</Pie><Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #E8E0D7', fontSize: 10 }} /></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-2xl font-black text-text-main dark:text-white">{distributionTotal || stats?.userCount || 0}</span><span className="text-[7px] font-black uppercase tracking-[.18em] text-text-secondary">People</span></div></div>
          <div className="space-y-2">{distribution.slice(0, 5).map((item) => <div key={item.name} className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} /><span className="min-w-0 flex-1 truncate text-[9px] font-bold text-text-secondary">{item.name}</span><span className="text-[9px] font-black text-text-main dark:text-white">{item.value}</span><span className="w-7 text-right text-[8px] font-bold text-text-secondary">{distributionTotal ? Math.round(item.value / distributionTotal * 100) : 0}%</span></div>)}</div>
        </Card>

        <Card className="col-span-12 p-5 lg:col-span-7 lg:p-6">
          <Heading icon={Megaphone} eyebrow="Attention" title="Live notices" action="Manage broadcasts" onAction={() => navigate('/admin/communications')} />
          <div className="mt-5 space-y-2.5">{alerts.slice(0, 4).map((alert, index) => <button key={alert.id || index} onClick={() => navigate('/admin/communications?tab=alerts')} className="group flex w-full items-center gap-3 rounded-2xl border border-[#EEE8E0] bg-brand-ivory/70 p-3 text-left transition-all hover:border-brand-red/20 hover:bg-white dark:border-white/[0.05] dark:bg-white/[0.035]"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-gold-light/70 text-brand-red dark:bg-brand-gold/10"><Radio className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-black text-text-main group-hover:text-brand-red dark:text-white">{alert.title}</span><span className="mt-0.5 block truncate text-[9px] text-text-secondary">{alert.message}</span></span><span className="hidden rounded-lg bg-white px-2 py-1 text-[7px] font-black uppercase tracking-wider text-brand-red shadow-sm dark:bg-white/5 sm:block">{alert.type || 'Notice'}</span><ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-brand-red" /></button>)}{!alerts.length && <div className="py-9 text-center"><ShieldCheck className="mx-auto h-7 w-7 text-emerald-500" /><p className="mt-2 text-[10px] font-black text-text-main dark:text-white">No active notices</p><p className="mt-1 text-[9px] text-text-secondary">Everything is clear across the group.</p></div>}</div>
        </Card>

        <Card className="col-span-12 overflow-hidden bg-[#261F20] p-5 text-white dark:bg-[#0C111D] lg:col-span-5 lg:p-6">
          <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gold/15 text-brand-gold-light"><Zap className="h-4.5 w-4.5" /></span><div><p className="text-[8px] font-black uppercase tracking-[.22em] text-brand-gold">Shortcuts</p><h2 className="mt-0.5 text-[15px] font-black">Quick actions</h2></div></div>
          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">{actions.map((action) => <button key={action.label} onClick={() => navigate(action.path)} className="group flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.05] p-3 text-left hover:border-brand-gold/25 hover:bg-white/[0.08]"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-red text-white"><action.icon className="h-4 w-4" /></span><span className="min-w-0 flex-1"><span className="block text-[9px] font-black">{action.label}</span><span className="mt-0.5 block truncate text-[8px] text-white/40">{action.detail}</span></span><Plus className="h-3 w-3 text-white/25 group-hover:text-brand-gold" /></button>)}</div>
          <button onClick={() => navigate('/admin/news')} className="mt-4 flex w-full items-center justify-between rounded-2xl bg-brand-red px-4 py-3 text-left transition-colors hover:bg-brand-red-dark"><span><span className="block text-[7px] font-black uppercase tracking-[.2em] text-white/55">Content studio</span><span className="mt-0.5 block text-[10px] font-black">Open media manager</span></span><ArrowRight className="h-4 w-4" /></button>
        </Card>

        <Card className="col-span-12 p-5 md:col-span-6 lg:p-6">
          <Heading icon={Sparkles} eyebrow="Company feed" title="Latest announcements" action="View all" onAction={() => navigate('/feed')} />
          <div className="mt-5 divide-y divide-[#EEE8E0] dark:divide-white/[0.06]">{announcements.slice(0, 4).map((item, index) => <button key={item.id || index} onClick={() => navigate('/feed')} className="group flex w-full items-start gap-3 py-3 text-left first:pt-0 last:pb-0"><span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${index === 0 ? 'bg-brand-red shadow-[0_0_0_4px_rgba(196,18,48,.1)]' : 'bg-brand-gold'}`} /><span className="min-w-0 flex-1"><span className="line-clamp-2 text-[10px] font-bold leading-4 text-text-main group-hover:text-brand-red dark:text-slate-200">{item.content}</span><span className="mt-1 block text-[7px] font-black uppercase tracking-wider text-text-secondary">{relativeTime(item.created_at)}</span></span><ArrowUpRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-brand-red" /></button>)}</div>
        </Card>

        <Card className="col-span-12 p-5 md:col-span-6 lg:p-6">
          <Heading icon={CalendarDays} eyebrow="Schedule" title="Upcoming holidays" action="Open calendar" onAction={() => navigate('/calendar')} />
          <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">{holidays.map((event, index) => { const date = new Date(event.holiday_date); return <button key={event.id || index} onClick={() => navigate('/calendar')} className="group flex items-center gap-3 rounded-2xl border border-[#EEE8E0] bg-brand-ivory/70 p-3 text-left hover:border-brand-red/20 hover:bg-white dark:border-white/[0.05] dark:bg-white/[0.035]"><span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-white shadow-sm dark:bg-white/[0.07]"><span className="text-[7px] font-black uppercase text-brand-red">{date.toLocaleString('en', { month: 'short' })}</span><span className="text-base font-black leading-none text-text-main dark:text-white">{date.getDate()}</span></span><span className="min-w-0"><span className="block truncate text-[9px] font-black text-text-main group-hover:text-brand-red dark:text-white">{event.name}</span><span className="mt-1 block text-[7px] font-bold uppercase tracking-wider text-text-secondary">{event.type || date.toLocaleString('en', { weekday: 'long' })}</span></span></button>; })}</div>
          <div className="mt-3 flex items-center justify-between rounded-2xl border border-dashed border-[#E8E0D7] px-4 py-3 dark:border-white/10"><span className="flex items-center gap-2 text-[9px] font-bold text-text-secondary"><UserPlus className="h-3.5 w-3.5 text-brand-red" />New joiners this period</span><strong className="text-sm text-text-main dark:text-white">{joiners.length}</strong></div>
        </Card>
      </div>

      <footer className="flex flex-col items-center justify-between gap-2 border-t border-[#E8E0D7] pt-5 text-[7px] font-black uppercase tracking-[.18em] text-text-secondary dark:border-white/[0.06] sm:flex-row"><span>George Steuart Group · Administration Console</span><span className="flex items-center gap-2"><Activity className="h-3 w-3 text-emerald-500" />Live data connected</span></footer>
    </div>
  );
};

export default AdminDashboard;
