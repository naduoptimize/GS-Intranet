import React from 'react';
import {
  CloudSun,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  ArrowRight,
  Plus,
  MessageSquare,
  Rss,
  FileText,
  Clock,
  CheckCircle2,
  StickyNote,
  Trash2,
  Users,
  AlertTriangle,
  Bell,
  Megaphone,
  Shield,
  Info,
  Gift,
  Search,
  X,
  Sun,
  CloudRain,
  CloudLightning,
  ChevronRight,
  RefreshCw,
  DollarSign,
  Droplets,
  Wind,
  Wind as WindIcon,
  Thermometer,
  Building2,
  BarChart3,
  Globe,
  Scale,
  Award
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import WelcomePopup from '../components/WelcomePopup';
import WeatherCard from '../components/WeatherCard';
import skylineSunrise from '../assets/skyline_sunrise.png';
import premiumCardBg from '../assets/premium_card_bg.png';

// ── Relative Time Utility ────────────────────────────────────────────────────
const getRelativeTime = (pubDateStr) => {
  try {
    const pubDate = new Date(pubDateStr);
    const now = new Date();
    const diffMs = now - pubDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  } catch (e) {
    return '';
  }
};

// ── Alert Icon Map ───────────────────────────────────────────────────────────
const alertIconMap = {
  warning: AlertTriangle,
  info: Info,
  success: Shield,
  danger: AlertTriangle,
  error: AlertTriangle,
};

const PremiumDashboard = ({
  user, alerts, offers, exchangeRates, fxUpdatedAt,
  fxRefreshing, onRefreshRates, weatherData, weatherUpdatedAt,
  weatherRefreshing, onRefreshWeather, navigate, onOpenNotes, noteCount
}) => {
  const safeAlerts = alerts?.length ? alerts : [
    { id: 'maintenance', title: 'IT Maintenance Window', message: 'Scheduled server maintenance this Sunday from 10 PM to 2 AM.', type: 'warning', time: '4h ago' },
    { id: 'leave', title: 'Leave Submission Deadline', message: 'Please submit pending leave requests before the monthly cut-off.', type: 'info', time: '1d ago' },
    { id: 'security', title: 'Information Security Reminder', message: 'Never share passwords or verification codes with another person.', type: 'success', time: '2d ago' },
  ];
  const safeOffers = offers?.length ? offers.slice(0, 3) : [];
  const [alertIndex, setAlertIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setAlertIndex(index => (index + 1) % safeAlerts.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [safeAlerts.length]);

  const activeAlert = safeAlerts[alertIndex] || safeAlerts[0];
  const quickLinks = [
    { label: 'Company Feed', sub: 'Latest company updates', icon: Rss, path: '/feed', tone: 'bg-rose-50 text-rose-600' },
    { label: 'Employee Directory', sub: 'Find a colleague', icon: Users, path: '/directory', tone: 'bg-blue-50 text-blue-600' },
    { label: 'Document Center', sub: 'Policies and forms', icon: FileText, path: '/documents', tone: 'bg-amber-50 text-amber-600' },
    { label: 'Help & Support', sub: 'Create a support request', icon: MessageSquare, path: '/help', tone: 'bg-emerald-50 text-emerald-600' },
  ];
  const banks = [
    { key: 'commercial', label: 'Commercial Bank', icon: BarChart3, tone: 'from-emerald-600 to-emerald-800', chip: 'bg-emerald-50 text-emerald-700' },
    { key: 'seylan', label: 'Seylan Bank', icon: DollarSign, tone: 'from-violet-600 to-violet-800', chip: 'bg-violet-50 text-violet-700' },
    { key: 'cbsl', label: 'CBSL', icon: Building2, tone: 'from-blue-600 to-blue-900', chip: 'bg-blue-50 text-blue-700' },
  ];

  return (
    <div className="relative space-y-5 pb-14">
      <div className="pointer-events-none absolute -left-24 top-32 h-72 w-72 rounded-full bg-brand-red/5 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-[420px] h-72 w-72 rounded-full bg-brand-gold/10 blur-3xl" />

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="group relative h-[220px] sm:h-[260px] lg:h-[295px] overflow-hidden rounded-[26px] border border-white/80 shadow-[0_24px_70px_-28px_rgba(15,23,42,0.48)]"
      >
        <motion.img
          src="/dashboard-team-collaboration-v3.png"
          alt="George Steuart colleagues collaborating in the group workspace"
          className="absolute inset-0 h-full w-full object-cover object-[58%_center] sm:object-center"
          loading="eager"
          fetchPriority="high"
          initial={{ scale: 1.045 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/88 via-slate-900/34 to-transparent" />
        <motion.div
          aria-hidden="true"
          className="absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/12 to-transparent"
          animate={{ x: ['0%', '430%'] }}
          transition={{ duration: 2.2, delay: 0.8, ease: 'easeInOut' }}
        />
        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-brand-gold via-brand-red to-brand-gold" />
        <div className="relative h-full flex items-center px-7 lg:px-10">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.65, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-xl text-white"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-xl mb-3 shadow-lg shadow-black/5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-[2px]">API Family Workspace</span>
            </div>
            <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/65">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-[-0.035em] leading-none mt-2">{`Welcome, ${user?.full_name?.split(' ')[0] || 'Colleague'}`}</h1>
            <p className="text-sm text-white/72 mt-3 max-w-lg">One team. Many ventures. A shared tomorrow.</p>
            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={() => navigate('/feed')} className="inline-flex items-center gap-2 rounded-xl bg-brand-red px-4 py-2.5 text-[9px] font-black uppercase tracking-wider text-white shadow-lg shadow-brand-red/25 transition-colors hover:bg-brand-red-dark">
                Explore updates <ArrowRight className="h-3.5 w-3.5" />
              </motion.button>
              <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }} onClick={onOpenNotes} className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-[9px] font-black uppercase tracking-wider text-white backdrop-blur-xl transition-colors hover:bg-white/[0.18]">
                <StickyNote className="h-3.5 w-3.5" /> My notes {noteCount > 0 && <span className="rounded-full bg-white/18 px-1.5 py-0.5">{noteCount}</span>}
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.18 }}
        transition={{ duration: 0.55, delay: 0.08 }}
        className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch"
      >
        <motion.div whileHover={{ y: -3 }} transition={{ type: 'spring', stiffness: 280, damping: 22 }} className="lg:col-span-5 min-w-0">
          <WeatherCard
            weatherData={weatherData}
            weatherUpdatedAt={weatherUpdatedAt}
            weatherRefreshing={weatherRefreshing}
            onRefresh={onRefreshWeather}
            compact
          />
        </motion.div>

        <motion.section whileHover={{ y: -3 }} transition={{ type: 'spring', stiffness: 280, damping: 22 }} id="exchange-rates" className="lg:col-span-7 bg-white/90 backdrop-blur-xl border border-white rounded-2xl p-4 shadow-[0_16px_42px_-28px_rgba(15,23,42,0.5)] scroll-mt-24 h-full">
        <div className="flex items-center justify-between mb-3">
          <div><div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.1)]" /><h2 className="text-sm font-black text-slate-900">USD / LKR Exchange Rates</h2></div><p className="text-[10px] text-slate-400 font-semibold mt-1 ml-3.5">Commercial, Seylan and CBSL reference rates</p></div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={onRefreshRates} disabled={fxRefreshing} className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-100 bg-slate-50/80 text-slate-500 text-[9px] font-black uppercase tracking-wider hover:border-brand-red/10 hover:bg-brand-red/5 hover:text-brand-red transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${fxRefreshing ? 'animate-spin' : ''}`} /> {fxUpdatedAt ? `Updated ${fxUpdatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Refresh'}
          </motion.button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {banks.map(bank => {
            const rate = exchangeRates?.[bank.key] || {};
            return <motion.div key={bank.key} whileHover={{ y: -4, scale: 1.012 }} transition={{ type: 'spring', stiffness: 320, damping: 22 }} className="group relative overflow-hidden rounded-xl border border-slate-100 bg-gradient-to-br from-white to-slate-50/80 p-3 shadow-sm hover:border-brand-red/10 hover:shadow-lg hover:shadow-slate-200/50">
              <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${bank.tone}`} />
              <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-brand-gold/5 transition-transform duration-500 group-hover:scale-150" />
              <div className="relative flex items-center justify-between"><div className="flex items-center gap-2"><div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bank.chip}`}><bank.icon className="w-4 h-4" /></div><div><p className="text-xs font-black text-slate-800">{bank.label}</p><p className="text-[8px] uppercase tracking-wider font-bold text-slate-400">USD / LKR</p></div></div><span className={`text-[9px] font-black ${rate.up ? 'text-emerald-600' : 'text-rose-600'}`}>{rate.change || '—'}</span></div>
              <div className="mt-3"><p className="text-[8px] uppercase tracking-widest font-black text-slate-400">Spot rate</p><p className="text-xl font-black text-slate-900">{rate.rate || '—'}</p><div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200/70"><div><p className="text-[7px] text-slate-400 font-bold uppercase">Buy</p><p className="text-[10px] font-black text-slate-700">{rate.buy || '—'}</p></div><div><p className="text-[7px] text-slate-400 font-bold uppercase">Sell</p><p className="text-[10px] font-black text-slate-700">{rate.sell || '—'}</p></div></div></div>
            </motion.div>;
          })}
        </div>
        </motion.section>
      </motion.section>

      <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative z-10 flex items-end justify-between pt-1">
        <div><p className="text-[9px] font-black uppercase tracking-[0.24em] text-brand-red">Stay connected</p><h2 className="mt-1 text-lg font-black tracking-tight text-slate-900">Your workspace highlights</h2></div>
        <p className="hidden text-[10px] font-bold text-slate-400 sm:block">Live, relevant and personalized for you</p>
      </motion.div>

      <motion.section
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.12 }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
        className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-4"
      >
        <motion.article variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} whileHover={{ y: -4 }} transition={{ duration: 0.4 }} className="lg:col-span-5 bg-white/90 backdrop-blur-xl border border-white rounded-2xl shadow-[0_16px_40px_-28px_rgba(15,23,42,0.55)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100"><div><div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-brand-red animate-pulse" /><h2 className="text-sm font-black text-slate-900">Company Alerts</h2></div><p className="text-[10px] text-slate-400 font-semibold mt-0.5 ml-4">Updates rotate automatically</p></div><button onClick={() => navigate('/alerts')} className="text-[9px] font-black uppercase tracking-wider text-brand-red hover:text-brand-red-dark transition-colors">View all</button></div>
          <div className="p-5">
            <AnimatePresence mode="wait">
              <motion.div key={activeAlert.id || alertIndex} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.35 }} whileHover={{ scale: 1.01 }} className="group relative rounded-2xl bg-gradient-to-br from-[#C41230] via-[#B9102D] to-[#8F1026] p-5 text-white min-h-[150px] flex flex-col justify-between cursor-pointer overflow-hidden shadow-lg shadow-brand-red/15" onClick={() => navigate('/alerts')}>
                <div className="absolute -right-10 -top-12 h-36 w-36 rounded-full border border-white/10 transition-transform duration-700 group-hover:scale-125" /><div className="absolute -right-2 top-2 h-20 w-20 rounded-full bg-white/5 blur-xl" />
                <div className="relative flex items-start justify-between"><div className="w-10 h-10 rounded-xl bg-white/15 border border-white/10 backdrop-blur-md flex items-center justify-center"><Megaphone className="w-5 h-5" /></div><span className="rounded-full bg-white/10 px-2.5 py-1 text-[8px] font-black uppercase tracking-wider text-white/70">{activeAlert.time || 'Now'}</span></div>
                <div className="relative"><h3 className="text-lg font-black tracking-tight">{activeAlert.title}</h3><p className="text-xs text-white/75 mt-1 line-clamp-2">{activeAlert.message}</p><div className="mt-3 flex items-center gap-1 text-[8px] font-black uppercase tracking-wider text-white/55">Open notice <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" /></div></div>
              </motion.div>
            </AnimatePresence>
            <div className="flex gap-1.5 mt-3">{safeAlerts.map((_, i) => <button key={i} onClick={() => setAlertIndex(i)} className={`h-1.5 rounded-full transition-all ${i === alertIndex ? 'w-7 bg-brand-red' : 'w-1.5 bg-slate-200'}`} />)}</div>
          </div>
        </motion.article>

        <motion.article variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} whileHover={{ y: -4 }} transition={{ duration: 0.4 }} className="lg:col-span-4 bg-white/90 backdrop-blur-xl border border-white rounded-2xl shadow-[0_16px_40px_-28px_rgba(15,23,42,0.55)] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100"><div><h2 className="text-sm font-black text-slate-900">Special Offers</h2><p className="text-[10px] text-slate-400 font-semibold mt-0.5">Exclusive employee benefits</p></div><button onClick={() => navigate('/offers')} className="text-[9px] font-black uppercase tracking-wider text-brand-red hover:text-brand-red-dark transition-colors">View all</button></div>
          <div className="divide-y divide-slate-100">
            {(safeOffers.length ? safeOffers : [{ title: 'Explore employee benefits', description: 'View current offers available for staff.', image_url: '/citrus_hero.png' }]).map((offer, i) => <motion.button whileHover={{ x: 4 }} key={offer.id || i} onClick={() => navigate('/offers')} className="group w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-brand-red/[0.025] transition-colors"><div className="relative overflow-hidden rounded-xl"><img src={offer.image_url || '/citrus_hero.png'} alt="" className="w-14 h-11 object-cover transition-transform duration-500 group-hover:scale-110" /><div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-xl" /></div><div className="min-w-0 flex-1"><p className="text-xs font-black text-slate-800 truncate group-hover:text-brand-red transition-colors">{offer.title}</p><p className="text-[9px] text-slate-400 font-semibold truncate mt-1">{offer.description}</p></div><ChevronRight className="w-4 h-4 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-brand-red" /></motion.button>)}
          </div>
        </motion.article>

        <motion.article variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} whileHover={{ y: -4 }} transition={{ duration: 0.4 }} className="lg:col-span-3 bg-white/90 backdrop-blur-xl border border-white rounded-2xl shadow-[0_16px_40px_-28px_rgba(15,23,42,0.55)] overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100"><h2 className="text-sm font-black text-slate-900">Quick Links</h2><p className="text-[10px] text-slate-400 font-semibold mt-0.5">Frequently used services</p></div>
          <div className="grid grid-cols-2 gap-2 p-3">{quickLinks.map(link => <motion.button whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }} key={link.label} onClick={() => navigate(link.path)} className="group min-h-[88px] rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-left transition-all hover:border-brand-red/10 hover:bg-white hover:shadow-md"><div className={`w-8 h-8 rounded-lg flex items-center justify-center ${link.tone} transition-transform group-hover:scale-110`}><link.icon className="w-4 h-4" /></div><p className="mt-2 text-[9px] font-black leading-tight text-slate-800 group-hover:text-brand-red transition-colors">{link.label}</p></motion.button>)}</div>
        </motion.article>
      </motion.section>

    </div>
  );
};

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = React.useState([]);
  const [stats, setStats] = React.useState({ userCount: 1248, docCount: 0 });
  const [holidays, setHolidays] = React.useState([]);
  const [rssNews, setRssNews] = React.useState([]);
  const [rssLoading, setRssLoading] = React.useState(false);
  const [alerts, setAlerts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [offers, setOffers] = React.useState([]);
  const [corporateNews, setCorporateNews] = React.useState([]);

  const [dashboardNotifications, setDashboardNotifications] = React.useState([]);

  // Fetch live notifications periodically
  React.useEffect(() => {
    if (!user?.id) return;
    const fetchNotifications = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/notifications/${user.id}`);
        setDashboardNotifications(res.data);
      } catch (err) {
        console.error('Failed to fetch dashboard notifications', err);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 4000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Live announcements ticker state (combining all dynamic alert/announcement feeds)
  const [tickerItems, setTickerItems] = React.useState([
    { text: '🔔 Welcome to the GS Intranet Workspace Portal!', link: '/feed' },
    { text: '🎂 Warmest birthday wishes to our colleague Kavindu (GS Teas)! 🎉', link: '/feed' },
    { text: '⚠️ Please acknowledge all active safety notices and alerts promptly.', link: '/alerts' },
  ]);

  React.useEffect(() => {
    const items = [];

    // 1. User's actual unread or recent notifications
    if (dashboardNotifications.length > 0) {
      dashboardNotifications.slice(0, 5).forEach(notif => {
        let prefix = '🔔';
        if (notif.type === 'alert') prefix = '⚠️';
        if (notif.type === 'document') prefix = '📄';
        if (notif.type === 'news') prefix = '📰';
        if (notif.type === 'offer') prefix = '🎁';
        if (notif.type === 'memory') prefix = '📸';
        if (notif.type === 'post') prefix = '📢';

        items.push({ text: `${prefix} ${notif.message}`, link: notif.link || '/feed' });
      });
    }

    // 2. Group & Subsidiary Announcements
    if (announcements.length > 0) {
      announcements.forEach(a => {
        const isOwnSubsidiary = a.subsidiary_id && a.subsidiary_id === user?.subsidiary_id;
        const prefix = isOwnSubsidiary
          ? `🏢 [${user?.subsidiary_name || 'Subsidiary'} Announcement]`
          : '📢 [GS Group Announcement]';
        items.push({ text: `${prefix} ${a.title} — ${a.content}`, link: '/feed' });
      });
    }

    // 3. Internal News
    if (corporateNews.length > 0) {
      corporateNews.slice(0, 2).forEach(n => {
        items.push({ text: `📰 [Internal News] ${n.title}`, link: '/news' });
      });
    }

    // 4. Active Staff Offers
    if (offers.length > 0) {
      offers.slice(0, 2).forEach(o => {
        items.push({ text: `🎁 [Exclusive Offer] ${o.title} — ${o.description || 'Special benefit cover available for staff'}`, link: '/offers' });
      });
    }

    // 5. Alerts
    if (alerts.length > 0) {
      alerts.slice(0, 2).forEach(al => {
        items.push({ text: `⚠️ [Notice Alert] ${al.title}: ${al.message}`, link: '/alerts' });
      });
    }

    // fallback items to ensure the bar is never empty and has good length
    items.push({ text: '🎂 Warmest birthday wishes to our colleague Kavindu (GS Teas)! 🎉', link: '/feed' });
    items.push({ text: '🛠️ IT Core Server Maintenance on Sunday 10PM–2AM. Portals might be temporarily offline.', link: '/feed' });
    items.push({ text: '🔔 New HR Policy Updated — Please review details in the Documents section.', link: '/documents' });

    setTickerItems(items);
  }, [dashboardNotifications, announcements, corporateNews, offers, alerts, user]);

  const [tickerIndex, setTickerIndex] = React.useState(0);
  React.useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex((prev) => {
        if (tickerItems.length === 0) return 0;
        return (prev + 1) % tickerItems.length;
      });
    }, 4500);
    return () => clearInterval(timer);
  }, [tickerItems.length]);
  // Last refresh timestamps
  const [weatherUpdatedAt, setWeatherUpdatedAt] = React.useState(null);
  const [fxUpdatedAt, setFxUpdatedAt] = React.useState(null);
  const [fxRefreshing, setFxRefreshing] = React.useState(false);
  const [weatherRefreshing, setWeatherRefreshing] = React.useState(false);

  // Dynamic Acknowledged Alerts
  const [acknowledgedAlerts, setAcknowledgedAlerts] = React.useState(() => {
    const saved = localStorage.getItem('gs_acknowledged_alerts');
    return saved ? JSON.parse(saved) : [];
  });
  const activeAlerts = alerts.filter(a => !acknowledgedAlerts.includes(a.id));

  // Floating Notes Panel
  const [showNotesPanel, setShowNotesPanel] = React.useState(false);
  const [notes, setNotes] = React.useState(() => {
    const savedNotes = localStorage.getItem('gs_dashboard_notes');
    if (savedNotes) {
      try { return JSON.parse(savedNotes); } catch (e) { }
    }
    const defaults = [{
      id: 'default-1',
      text: 'Welcome to your Workspace Notes! 📝\n\n• Capture ideas, reminders, or phone extensions here.\n• Click "+ Add Note" to create multiple sticky notes.\n• Switch individual note colors from the bottom dots.\n• Search notes instantly using the input bar below!',
      color: 'amber',
      updatedAt: new Date().toISOString(),
    }];
    localStorage.setItem('gs_dashboard_notes', JSON.stringify(defaults));
    return defaults;
  });
  const [searchQuery, setSearchQuery] = React.useState('');

  const addNote = (color = 'amber') => {
    const n = { id: `note-${Date.now()}`, text: '', color, updatedAt: new Date().toISOString() };
    const u = [n, ...notes];
    setNotes(u);
    localStorage.setItem('gs_dashboard_notes', JSON.stringify(u));
  };
  const updateNoteText = (id, text) => {
    const u = notes.map(n => n.id === id ? { ...n, text, updatedAt: new Date().toISOString() } : n);
    setNotes(u); localStorage.setItem('gs_dashboard_notes', JSON.stringify(u));
  };
  const updateNoteColor = (id, color) => {
    const u = notes.map(n => n.id === id ? { ...n, color, updatedAt: new Date().toISOString() } : n);
    setNotes(u); localStorage.setItem('gs_dashboard_notes', JSON.stringify(u));
  };
  const deleteNote = (id) => {
    const u = notes.filter(n => n.id !== id);
    setNotes(u); localStorage.setItem('gs_dashboard_notes', JSON.stringify(u));
  };

  // ── Weather State ────────────────────────────────────────────────────────
  const [weatherData, setWeatherData] = React.useState({
    temp: 30, humidity: 74, windspeed: 12, feelsLike: 32,
    description: 'Partly Cloudy', code: 2,
    todayHourly: [
      { label: 'Morning',   emoji: '🌅', temp: 29, code: 2 },
      { label: 'Afternoon', emoji: '☀️',  temp: 32, code: 0 },
      { label: 'Evening',   emoji: '🌆', temp: 30, code: 2 },
      { label: 'Night',     emoji: '🌙', temp: 28, code: 2 },
    ],
    forecast: [
      { day: 'Today', tempMax: 32, tempMin: 26, description: 'Partly Cloudy', code: 2 },
      { day: 'Tue', tempMax: 31, tempMin: 25, description: 'Light Rain', code: 80 },
      { day: 'Wed', tempMax: 33, tempMin: 27, description: 'Clear Sky', code: 0 },
    ]
  });

  // ── Exchange Rates State (3 banks) ───────────────────────────────────────
  const [exchangeRates, setExchangeRates] = React.useState({
    cbsl: { name: 'CBSL', fullName: 'Central Bank of Sri Lanka', rate: '305.45', buy: '304.75', sell: '315.80', change: '+0.35', pct: '+0.11%', up: true },
    commercial: { name: 'Commercial', fullName: 'Commercial Bank PLC', rate: '304.95', buy: '303.85', sell: '316.50', change: '+0.33', pct: '+0.11%', up: true },
    seylan: { name: 'Seylan', fullName: 'Seylan Bank PLC', rate: '304.70', buy: '303.60', sell: '316.75', change: '+0.28', pct: '+0.09%', up: true },
  });

  // ── Live Clock ───────────────────────────────────────────────────────────
  const [currentDateTime, setCurrentDateTime] = React.useState('');
  React.useEffect(() => {
    const tick = () => setCurrentDateTime(new Date().toLocaleString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
    }));
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

  const getWeatherIcon = (code, size = 'lg') => {
    const cls = size === 'sm' ? 'w-5 h-5' : 'w-14 h-14';
    if ([0, 1].includes(code)) return <Sun className={`${cls} text-yellow-300 drop-shadow-lg`} />;
    if ([51, 53, 55, 61, 63, 65, 80, 81, 82].includes(code)) return <CloudRain className={`${cls} text-sky-200`} />;
    if ([95, 96, 99].includes(code)) return <CloudLightning className={`${cls} text-yellow-200`} />;
    return <CloudSun className={`${cls} text-white/90`} />;
  };

  const getWeatherDesc = (c) => {
    if (c === 0) return 'Clear Sky';
    if (c === 1) return 'Mainly Clear';
    if (c === 2) return 'Partly Cloudy';
    if (c === 3) return 'Overcast';
    if ([45, 48].includes(c)) return 'Foggy';
    if ([51, 53, 55, 80, 81, 82].includes(c)) return 'Light Rain';
    if ([61, 63, 65].includes(c)) return 'Rainy';
    if ([95, 96, 99].includes(c)) return 'Thunderstorms';
    return 'Partly Cloudy';
  };

  // Map OpenWeatherMap condition IDs to WMO-compatible codes used by UI
  const mapOwmToWmo = (owmId) => {
    if (owmId >= 200 && owmId < 300) return 95;   // Thunderstorm
    if (owmId >= 300 && owmId < 400) return 51;   // Drizzle → Light Rain
    if (owmId >= 500 && owmId < 502) return 61;   // Light/Moderate Rain
    if (owmId >= 502 && owmId < 600) return 65;   // Heavy Rain
    if (owmId >= 600 && owmId < 700) return 71;   // Snow
    if (owmId >= 700 && owmId < 800) return 45;   // Atmosphere (fog/haze)
    if (owmId === 800) return 0;                  // Clear
    if (owmId === 801) return 1;                  // Few clouds
    if (owmId === 802) return 2;                  // Scattered clouds
    if (owmId === 803 || owmId === 804) return 3; // Broken/Overcast
    return 2; // Default partly cloudy
  };

  const OWM_API_KEY = '44089a3f87f0e73a9de2b09c3c1184ea';

  // ── Fetch Weather (with auto-refresh every 5 min) ────────────────────────
  const fetchWeather = React.useCallback(async (showRefresh = false) => {
    if (showRefresh) setWeatherRefreshing(true);
    try {
      // cnt=40 → 40 × 3-hour slots = 5 full days, ensures Today always has all 8 slots
      const [curRes, fcastRes] = await Promise.all([
        axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=6.9271&lon=79.8612&appid=${OWM_API_KEY}&units=metric`),
        axios.get(`https://api.openweathermap.org/data/2.5/forecast?lat=6.9271&lon=79.8612&appid=${OWM_API_KEY}&units=metric&cnt=40`)
      ]);

      const cur = curRes.data;
      const owmId = cur.weather[0]?.id || 800;
      const wmoCode = mapOwmToWmo(owmId);

      // ── Build accurate 3-day forecast ────────────────────────────────────
      // Parse each slot in IST (UTC+5:30) so day boundaries are correct for Colombo
      const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
      const wkd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const dayMap = {};

      (fcastRes.data.list || []).forEach(slot => {
        // Convert UTC epoch → IST date parts
        const istDate = new Date(slot.dt * 1000 + IST_OFFSET_MS);
        const key = `${istDate.getUTCFullYear()}-${istDate.getUTCMonth()}-${istDate.getUTCDate()}`;
        const istHour = istDate.getUTCHours(); // hour in IST

        if (!dayMap[key]) {
          dayMap[key] = { istDate, temps: [], slots: [] };
        }
        dayMap[key].temps.push(slot.main.temp_max, slot.main.temp_min);
        // Tag each slot with its IST hour for noon-picking below
        dayMap[key].slots.push({ istHour, id: slot.weather[0]?.id || 800 });
      });

      const forecastDays = [];
      Object.values(dayMap).slice(0, 3).forEach((dayData, i) => {
        // Pick the slot closest to noon (12:00 IST) as the day's representative condition
        const noonSlot = dayData.slots.reduce((best, s) =>
          Math.abs(s.istHour - 12) < Math.abs(best.istHour - 12) ? s : best
        );
        const repCode = mapOwmToWmo(noonSlot.id);
        forecastDays.push({
          day: i === 0 ? 'Today' : wkd[dayData.istDate.getUTCDay()],
          tempMax: Math.round(Math.max(...dayData.temps)),
          tempMin: Math.round(Math.min(...dayData.temps)),
          code: repCode,
          description: getWeatherDesc(repCode),
        });
      });

      // ── Build Today's period-by-period breakdown (IST slots) ─────────────
      // Periods: Morning 6-12, Afternoon 12-18, Evening 18-21, Night 21-6
      const todayKey = Object.keys(dayMap)[0];
      const todaySlots = dayMap[todayKey]?.slots || [];
      const pickPeriod = (from, to) => {
        const matches = todaySlots.filter(s => s.istHour >= from && s.istHour < to);
        if (matches.length === 0) return null;
        // pick middle slot of that period as representative
        const mid = matches[Math.floor(matches.length / 2)];
        return { temp: mid.temp, code: mapOwmToWmo(mid.id) };
      };
      // Each slot also needs temp — re-collect with temp included
      const todaySlotsWithTemp = (fcastRes.data.list || []).filter(slot => {
        const istDate = new Date(slot.dt * 1000 + IST_OFFSET_MS);
        const key = `${istDate.getUTCFullYear()}-${istDate.getUTCMonth()}-${istDate.getUTCDate()}`;
        return key === todayKey;
      }).map(slot => {
        const istDate = new Date(slot.dt * 1000 + IST_OFFSET_MS);
        return { istHour: istDate.getUTCHours(), temp: Math.round(slot.main.temp), id: slot.weather[0]?.id || 800 };
      });
      const pickPeriodFull = (from, to) => {
        const matches = todaySlotsWithTemp.filter(s => s.istHour >= from && s.istHour < to);
        if (matches.length === 0) return null;
        const mid = matches[Math.floor(matches.length / 2)];
        return { temp: mid.temp, code: mapOwmToWmo(mid.id) };
      };
      const todayHourly = [
        { label: 'Morning',   emoji: '🌅', ...(pickPeriodFull(6, 12)  || { temp: Math.round(cur.main.temp) - 2, code: wmoCode }) },
        { label: 'Afternoon', emoji: '☀️',  ...(pickPeriodFull(12, 18) || { temp: Math.round(cur.main.temp),     code: wmoCode }) },
        { label: 'Evening',   emoji: '🌆', ...(pickPeriodFull(18, 21) || { temp: Math.round(cur.main.temp) - 1, code: wmoCode }) },
        { label: 'Night',     emoji: '🌙', ...(pickPeriodFull(21, 27) || { temp: Math.round(cur.main.temp) - 3, code: wmoCode }) },
      ];

      setWeatherData(prev => ({
        temp: Math.round(cur.main.temp),
        humidity: cur.main.humidity,
        windspeed: Math.round((cur.wind?.speed || 0) * 3.6), // m/s → km/h
        feelsLike: Math.round(cur.main.feels_like),
        description: cur.weather[0]?.description
          ? cur.weather[0].description.charAt(0).toUpperCase() + cur.weather[0].description.slice(1)
          : 'Partly Cloudy',
        code: wmoCode,
        todayHourly,
        forecast: forecastDays.length > 0 ? forecastDays : prev.forecast,
      }));
      setWeatherUpdatedAt(new Date());
    } catch (err) {
      console.error('OpenWeatherMap fetch failed:', err?.response?.data || err.message);
    } finally {
      if (showRefresh) setWeatherRefreshing(false);
    }
  }, []);

  // ── Fetch Exchange Rates (with auto-refresh every 15 min) ────────────────
  const fetchExchangeRates = React.useCallback(async (showRefresh = false) => {
    if (showRefresh) setFxRefreshing(true);
    try {
      const res = await axios.get('http://localhost:5000/api/analytics/exchange-rates');
      if (res.data?.cbsl) {
        const mapRate = (r) => ({
          ...r,
          up: parseFloat(r.change) >= 0,
        });
        setExchangeRates({
          cbsl: mapRate(res.data.cbsl),
          commercial: mapRate(res.data.commercial),
          seylan: mapRate(res.data.seylan),
        });
      }
      setFxUpdatedAt(new Date());
    } catch (e) {
      console.error('FX fetch failed', e);
      setFxUpdatedAt(new Date()); // still mark updated so timer doesn't loop fast
    } finally {
      if (showRefresh) setFxRefreshing(false);
    }
  }, []);

  const fetchRssNews = React.useCallback(async () => {
    try {
      setRssLoading(true);
      const res = await axios.get('http://localhost:5000/api/news/external-feed');
      setRssNews(res.data);
    } catch (e) {
      console.error('Failed to fetch RSS news', e);
    } finally {
      setRssLoading(false);
    }
  }, []);

  // ── Main Data Fetch ──────────────────────────────────────────────────────
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const postsRes = await axios.get(`http://localhost:5000/api/posts?subsidiary_id=${user?.subsidiary_id}`);
        setAnnouncements(postsRes.data.filter(p => p.type === 'announcement').slice(0, 3));

        const statsRes = await axios.get(`http://localhost:5000/api/analytics/stats?subsidiaryId=${user?.subsidiary_id}`);
        setStats(statsRes.data);

        const holidayRes = await axios.get('http://localhost:5000/api/holidays');
        setHolidays(holidayRes.data.filter(h => new Date(h.holiday_date) >= new Date()).slice(0, 3));

        try {
          const alertsRes = await axios.get('http://localhost:5000/api/alerts', {
            params: { subsidiary_id: user?.subsidiary_id, role: user?.role }
          });
          setAlerts(alertsRes.data.map(a => ({ ...a, time: getRelativeTime(a.created_at) })));
        } catch (e) { console.error('Alerts fetch failed', e); }

        try {
          const offersRes = await axios.get('http://localhost:5000/api/offers', {
            params: { subsidiary_id: user?.subsidiary_id, role: user?.role }
          });
          setOffers(offersRes.data);
        } catch (e) { console.error('Offers fetch failed', e); }

        try {
          const newsRes = await axios.get('http://localhost:5000/api/news');
          setCorporateNews(newsRes.data);
        } catch (e) { console.error('Corporate news fetch failed', e); }

        await fetchWeather();
        await fetchExchangeRates();
        await fetchRssNews();
      } catch (e) {
        console.error('Dashboard data fetch failed', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  // ── Auto-refresh: Weather every 5 min, FX every 15 min ──────────────────
  React.useEffect(() => {
    const weatherId = setInterval(() => fetchWeather(), 5 * 60 * 1000);
    const fxId = setInterval(() => fetchExchangeRates(), 15 * 60 * 1000);
    return () => { clearInterval(weatherId); clearInterval(fxId); };
  }, [fetchWeather, fetchExchangeRates]);

  // ── Fallback Data ────────────────────────────────────────────────────────
  const fallbackAlerts = [
    { id: 'fa-1', title: 'IT Maintenance Window', message: 'Scheduled server maintenance on Sunday 25 May, 10PM–2AM.', time: '4h ago', type: 'warning', color: 'amber' },
    { id: 'fa-2', title: 'Leave Submission Deadline', message: 'June leave requests must be submitted by 30 May 2026.', time: '1d ago', type: 'info', color: 'blue' },
  ];
  const fallbackOffers = [
    { id: 'fo-1', title: 'Citrus Leisure Hotel Weekend Getaway', description: 'Enjoy 30% off on weekend getaways at Citrus Leisure properties.', badge: '30% OFF', cta: 'BOOK NOW', image_url: 'https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&q=80&w=400', color: 'blue' },
    { id: 'fo-2', title: 'GS Insurance Family Cover', description: 'Comprehensive family health insurance at a subsidized group rate.', badge: 'SPECIAL RATE', cta: 'LEARN MORE', image_url: 'https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&q=80&w=400', color: 'purple' },
    { id: 'fo-3', title: 'Heladiv Tea Bundle Premium Collection', description: 'Order curated Heladiv premium tea packs at exclusive staff prices.', badge: 'STAFF BENEFIT', cta: 'ORDER NOW', image_url: 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&q=80&w=400', color: 'orange' },
    { id: 'fo-4', title: 'Wellness Program Healthy You', description: 'Get exclusive access to fitness & mindfulness sessions.', badge: 'NEW', cta: 'JOIN NOW', image_url: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=400', color: 'teal' },
  ];
  const fallbackAnnouncements = [
    { title: 'New Security Policy', content: 'Please review and acknowledge the updated information Security Policy.', created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(), type: 'security' },
    { title: 'HR Policy Updated', content: 'New remote work policy has been updated. Please read the full document.', created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(), type: 'hr' },
    { title: 'Office Reopening Update', content: 'Company office will reopen on 02 June 2026.', created_at: new Date(Date.now() - 48 * 3600 * 1000).toISOString(), type: 'general' },
  ];

  const displayAlerts = activeAlerts.length > 0 ? activeAlerts : fallbackAlerts;
  const displayOffers = offers.length > 0 ? offers.slice(0, 4) : fallbackOffers;
  const displayAnnouncements = announcements.length > 0 ? announcements.slice(0, 3) : fallbackAnnouncements;

  // ── Offer Themes ─────────────────────────────────────────────────────────
  const offerThemes = {
    blue: { badge: 'bg-gradient-to-r from-blue-500 to-indigo-500', btn: 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md shadow-blue-500/10 hover:shadow-lg' },
    purple: { badge: 'bg-gradient-to-r from-violet-500 to-fuchsia-500', btn: 'bg-gradient-to-r from-violet-600 to-fuchsia-600 shadow-md shadow-violet-500/10 hover:shadow-lg' },
    orange: { badge: 'bg-gradient-to-r from-orange-500 to-amber-500', btn: 'bg-gradient-to-r from-orange-500 to-amber-500 shadow-md shadow-orange-500/10 hover:shadow-lg' },
    teal: { badge: 'bg-gradient-to-r from-teal-500 to-emerald-500', btn: 'bg-gradient-to-r from-teal-600 to-emerald-600 shadow-md shadow-teal-500/10 hover:shadow-lg' },
  };

  // ── Note Colors ──────────────────────────────────────────────────────────
  const noteColors = {
    amber: 'bg-amber-50 border-amber-200 text-amber-900',
    blue: 'bg-sky-50 border-sky-200 text-sky-900',
    emerald: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    rose: 'bg-rose-50 border-rose-200 text-rose-900',
  };

  const filteredNotes = notes.filter(n => n.text.toLowerCase().includes(searchQuery.toLowerCase()));

  const formatUpdatedAt = (dt) => {
    if (!dt) return '—';
    return dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  // ── Bank rate config ─────────────────────────────────────────────────────
  const bankConfigs = [
    {
      key: 'cbsl',
      label: 'CBSL',
      fullName: 'Central Bank of Sri Lanka',
      gradient: 'from-[#0B1528] to-[#1E3A8A]',
      glowColor: 'shadow-blue-500/10 hover:shadow-blue-500/25',
      badgeText: 'Official',
      icon: Building2,
      border: 'border-blue-500/25',
      orb: 'bg-blue-500/25',
    },
    {
      key: 'commercial',
      label: 'Commercial',
      fullName: 'Commercial Bank PLC',
      gradient: 'from-[#021E17] to-[#047857]',
      glowColor: 'shadow-emerald-500/10 hover:shadow-emerald-500/25',
      badgeText: 'Bank',
      icon: BarChart3,
      border: 'border-emerald-500/25',
      orb: 'bg-emerald-500/25',
    },
    {
      key: 'seylan',
      label: 'Seylan',
      fullName: 'Seylan Bank PLC',
      gradient: 'from-[#1A0B2E] to-[#6D28D9]',
      glowColor: 'shadow-violet-500/10 hover:shadow-violet-500/25',
      badgeText: 'Bank',
      icon: DollarSign,
      border: 'border-purple-500/25',
      orb: 'bg-purple-500/25',
    },
  ];

  return (
    <PremiumDashboard
      user={user}
      alerts={displayAlerts}
      offers={displayOffers}
      exchangeRates={exchangeRates}
      fxUpdatedAt={fxUpdatedAt}
      fxRefreshing={fxRefreshing}
      onRefreshRates={() => fetchExchangeRates(true)}
      weatherData={weatherData}
      weatherUpdatedAt={weatherUpdatedAt}
      weatherRefreshing={weatherRefreshing}
      onRefreshWeather={() => fetchWeather(true)}
      navigate={navigate}
      onOpenNotes={() => setShowNotesPanel(true)}
      noteCount={notes.length}
    />
  );

  /* Legacy dashboard markup retained temporarily below for safe rollback. */

  return (
    <div className="space-y-4 pb-16 animate-in fade-in duration-700 mx-auto">

      {/* ── TOP ANNOUNCEMENTS TICKER ─────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-[#C41230] to-[#9E0E27] rounded-2xl px-4 py-2.5 flex items-center justify-between shadow-lg shadow-red-900/20">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <span className="w-2 h-2 rounded-full bg-white animate-ping opacity-80" />
            <span className="text-white text-[10px] font-black uppercase tracking-widest">Live</span>
          </div>
          <div className="w-px h-4 bg-white/30" />
          <div className="flex-1 overflow-hidden h-5 relative flex items-center">
            <AnimatePresence mode="wait">
               <motion.span
                key={tickerIndex}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.5, ease: 'easeInOut' }}
                onClick={() => {
                  const currentItem = tickerItems[tickerIndex];
                  if (currentItem && currentItem.link) {
                    navigate(currentItem.link);
                  }
                }}
                className="absolute text-[12px] font-semibold text-white/90 truncate w-full cursor-pointer hover:text-white hover:underline transition-all"
              >
                {tickerItems[tickerIndex]?.text || tickerItems[tickerIndex]}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>
        <button
          onClick={() => navigate('/feed')}
          className="shrink-0 ml-4 px-4 py-1.5 bg-white/15 hover:bg-white/25 border border-white/20 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
        >
          View All
        </button>
      </div>

      {/* ── MAIN GRID ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* ── LEFT PANEL (col-span-9) ──────────────────────────────────── */}
        <div className="lg:col-span-9 space-y-4">

          {/* ROW 1 — Weather + Safety Alerts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* ── WEATHER CARD (iPhone-style immersive live scene) ───── */}
            <WeatherCard
              weatherData={weatherData}
              weatherUpdatedAt={weatherUpdatedAt}
              weatherRefreshing={weatherRefreshing}
              onRefresh={() => fetchWeather(true)}
            />

            {/* ── SAFETY ALERTS CARD ────────────────────────────────────── */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              whileHover={{ scale: 1.005 }}
              className="rounded-2xl relative overflow-hidden bg-gradient-to-br from-[#E23E3E] via-[#C82A2A] to-[#A81B1B] text-white shadow-xl shadow-red-950/20 min-h-[240px] flex flex-col group border border-white/10 transition-all duration-500"
            >
              {/* decorative glowing orbs inside Safety Alerts */}
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none group-hover:bg-white/20 transition-all duration-700 animate-pulse" />
              <div className="absolute -bottom-8 -left-8 w-36 h-36 bg-black/10 rounded-full blur-3xl pointer-events-none group-hover:bg-black/20 transition-all duration-700" />

              <div className="relative z-10 p-5 flex flex-col h-full">
                {/* Header */}
                <div className="flex justify-between items-center mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8.5 h-8.5 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center text-white shadow-md hover:scale-110 transition-transform duration-300">
                      <Megaphone className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-[11px] font-black uppercase tracking-[3px] text-white/95 leading-none">Safety Alerts</h3>
                      <p className="text-[9px] text-white/70 font-bold uppercase tracking-wider mt-1.5 leading-none">Active Notices</p>
                    </div>
                  </div>
                  
                  {/* Glowing signal dot and active badge */}
                  <div className="flex items-center gap-2.5">
                    <div className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </div>
                    <span className="px-3 py-1.5 rounded-full bg-white/15 border border-white/25 text-[9px] font-black text-white tracking-wide leading-none shadow-sm">
                      {displayAlerts.length} Active
                    </span>
                  </div>
                </div>

                {/* Scrollable list */}
                <div className="space-y-2.5 flex-1 overflow-y-auto custom-scrollbar pr-0.5 animate-in fade-in duration-500">
                  {displayAlerts.map(alert => {
                    const isWarning = alert.type === 'warning' || alert.type === 'danger' || alert.type === 'error';
                    const isSecurity = alert.type === 'security' || alert.type === 'success';
                    
                    const themeCls = isWarning
                      ? { iconBg: 'bg-amber-400/20 border-amber-400/35 text-amber-200 shadow-[0_0_8px_rgba(245,158,11,0.2)]', dot: 'bg-amber-400' }
                      : isSecurity
                      ? { iconBg: 'bg-rose-400/25 border-rose-400/35 text-rose-200 shadow-[0_0_8px_rgba(244,63,94,0.25)]', dot: 'bg-rose-400' }
                      : { iconBg: 'bg-sky-400/20 border-sky-400/35 text-sky-200 shadow-[0_0_8px_rgba(56,189,248,0.2)]', dot: 'bg-sky-400' };

                    const IconComp = isSecurity ? Shield : (alertIconMap[alert.type] || Info);

                    return (
                      <motion.div 
                        whileHover={{ scale: 1.02, x: 3 }}
                        key={alert.id} 
                        className="p-3 bg-white/10 border border-white/15 hover:bg-white/15 hover:border-white/25 rounded-2xl flex items-center justify-between transition-all duration-300 cursor-pointer group shadow-md backdrop-blur-md"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Glowing themed glass icon capsule */}
                          <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${themeCls.iconBg} transition-all duration-300 group-hover:scale-105`}>
                            <IconComp className="w-4.5 h-4.5" />
                          </div>
                          
                          <div className="min-w-0">
                            <p className="text-[11px] font-black text-white leading-snug truncate">{alert.title}</p>
                            <p className="text-[9.5px] text-white/85 font-semibold leading-normal truncate mt-0.5">{alert.message}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[8.5px] font-extrabold text-white/75">{alert.time}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-white/85 group-hover:translate-x-1 transition-transform duration-300" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <button
                  onClick={() => navigate('/alerts')}
                  className="mt-4 pt-3 border-t border-white/15 text-[9px] font-black text-white/90 hover:text-white uppercase tracking-[2px] w-full flex items-center justify-center gap-1 hover:gap-1.5 transition-all duration-300 cursor-pointer"
                >
                  <span>View All Alerts</span>
                  <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </motion.div>
          </div>

          {/* ROW 2 — USD Exchange Rates (3 banks) ───────────────────────── */}
          <div className="rounded-3xl bg-white dark:bg-[#131B2E] border border-slate-100 dark:border-white/5 shadow-xl p-6 glass-card">
            {/* Section header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-md animate-float">
                  <DollarSign className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">USD / LKR Exchange Rates</h3>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Live Bank Rates · Auto-refreshes every 15 min</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-slate-400 font-semibold">Updated {formatUpdatedAt(fxUpdatedAt)}</span>
                <button
                  onClick={() => fetchExchangeRates(true)}
                  disabled={fxRefreshing}
                  className="p-2 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-all cursor-pointer"
                  title="Refresh rates"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${fxRefreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* 3 Bank Rate Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {bankConfigs.map(({ key, label, fullName, gradient, glowColor, icon: BankIcon, border, orb }) => {
                const r = exchangeRates[key];
                return (
                  <motion.div
                    whileHover={{ y: -5, scale: 1.01 }}
                    key={key}
                    className={`rounded-3xl bg-gradient-to-br ${gradient} text-white p-5.5 border ${border} shadow-xl ${glowColor} relative overflow-hidden group transition-all duration-300`}
                  >
                    {/* glowing orb */}
                    <div className={`absolute -top-8 -right-8 w-32 h-32 ${orb} rounded-full blur-2xl pointer-events-none group-hover:scale-110 transition-transform duration-500`} />

                    <div className="relative z-10">
                      {/* Bank header */}
                      <div className="flex items-center justify-between mb-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center">
                            <BankIcon className="w-3.5 h-3.5 text-white" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/90">{label}</p>
                          </div>
                        </div>
                        {/* Change badge (fixed empty parenthesis bug) */}
                        <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-lg text-[9px] font-black ${r.up ? 'bg-emerald-400/20 text-emerald-300' : 'bg-rose-400/20 text-rose-300'}`}>
                          {r.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {r.change}
                        </div>
                      </div>

                      {/* Spot rate */}
                      <div className="mb-4">
                        <p className="text-[9px] text-white/55 font-black uppercase tracking-[2px] mb-1">Spot Rate</p>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-extrabold tracking-tight tabular-nums drop-shadow-sm">{r.rate}</span>
                          <span className="text-[10px] font-black text-white/50 tracking-wider">LKR</span>
                        </div>
                      </div>

                      {/* Buy / Sell glass capsules */}
                      <div className="grid grid-cols-2 gap-2.5">
                        <div className="bg-white/5 backdrop-blur-md rounded-2xl px-3.5 py-2.5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                          <p className="text-[8px] font-black uppercase tracking-[2px] text-white/40 mb-0.5">Buy</p>
                          <p className="text-sm font-black text-white tabular-nums leading-none mt-1">{r.buy}</p>
                        </div>
                        <div className="bg-white/5 backdrop-blur-md rounded-2xl px-3.5 py-2.5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300">
                          <p className="text-[8px] font-black uppercase tracking-[2px] text-white/40 mb-0.5">Sell</p>
                          <p className="text-sm font-black text-white tabular-nums leading-none mt-1">{r.sell}</p>
                        </div>
                      </div>

                      <p className="text-[9px] text-white/45 font-semibold mt-3.5 truncate border-t border-white/5 pt-2.5">{fullName}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* ROW 3 — Exclusive Staff Offers ─────────────────────────────── */}
          <div className="rounded-3xl bg-white dark:bg-[#131B2E] border border-slate-100 dark:border-white/5 shadow-xl p-6 glass-card">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md animate-float">
                  <Gift className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Exclusive Staff Offers</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Members-only deals</p>
                </div>
              </div>
              <button onClick={() => navigate('/offers')} className="text-[10px] font-black text-slate-400 hover:text-[#C41230] uppercase tracking-widest transition-colors cursor-pointer">
                View All →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {displayOffers.map((offer) => {
                const gradientTheme = offer.gradient || 'from-blue-500 to-indigo-500';
                return (
                  <motion.div 
                    whileHover={{ y: -6 }}
                    key={offer.id} 
                    className="group flex flex-col bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 relative before:absolute before:-left-2 before:top-[65%] before:-translate-y-1/2 before:w-4 before:h-4 before:bg-white dark:before:bg-[#131B2E] before:rounded-full before:z-10 after:absolute after:-right-2 after:top-[65%] after:-translate-y-1/2 after:w-4 after:h-4 after:bg-white dark:before:bg-[#131B2E] after:rounded-full after:z-10"
                  >
                    <div className="h-32 overflow-hidden relative">
                      <img
                        src={offer.image_url || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=300'}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <span className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-lg text-white text-[8px] font-black uppercase tracking-widest shadow-lg bg-gradient-to-r ${gradientTheme}`}>
                        {offer.badge}
                      </span>
                    </div>

                    {/* Voucher Content Area */}
                    <div className="p-4 flex flex-col flex-1 relative bg-slate-50/50 dark:bg-slate-900/10">
                      <h4 className="text-xs font-black text-slate-800 dark:text-white leading-snug line-clamp-2 mb-1.5">{offer.title}</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed line-clamp-2 flex-1">{offer.description}</p>
                      
                      {/* Tear-Off Dotted Indicator */}
                      <div className="w-full border-t border-dashed border-slate-200 dark:border-slate-850 my-3.5 relative"></div>

                      <button
                        onClick={() => alert(`Claimed: ${offer.title}! Details sent to ${user?.email}`)}
                        className={`w-full py-2.5 text-white rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-[0.98] hover:brightness-110 transition-all cursor-pointer bg-gradient-to-r ${gradientTheme} shadow-md hover:shadow-lg`}
                      >
                        {offer.cta}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* ROW 4 — Latest Announcements ───────────────────────────────── */}
          <div className="rounded-3xl bg-white dark:bg-[#131B2E] border border-slate-100 dark:border-white/5 shadow-xl p-6 glass-card">
            <div className="flex justify-between items-center mb-5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C41230] to-[#9E0E27] flex items-center justify-center shadow-md animate-float">
                  <Megaphone className="w-4.5 h-4.5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Latest Announcements</h3>
                  <p className="text-[10px] text-slate-400 font-semibold">Company-wide notices</p>
                </div>
              </div>
              <button onClick={() => navigate('/feed')} className="text-[10px] font-black text-slate-400 hover:text-[#C41230] uppercase tracking-widest transition-colors cursor-pointer">
                View All →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {displayAnnouncements.map((post, i) => {
                let iconBg = 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/20';
                let ActIcon = Megaphone;
                if (post.type === 'security') { ActIcon = AlertTriangle; iconBg = 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/20'; }
                else if (post.type === 'hr') { ActIcon = FileText; iconBg = 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/20'; }
                return (
                  <motion.div
                    whileHover={{ y: -4, scale: 1.015 }}
                    key={i}
                    onClick={() => navigate('/feed')}
                    className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl hover:bg-white dark:hover:bg-white/10 hover:border-[#C41230]/20 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className={`w-10 h-10 rounded-full border flex items-center justify-center shrink-0 ${iconBg} group-hover:scale-105 transition-transform`}>
                      <ActIcon className="w-4.5 h-4.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[11px] font-black text-slate-800 dark:text-white leading-tight">{post.title}</p>
                        <span className="text-[8px] font-bold text-slate-400 shrink-0">{getRelativeTime(post.created_at) || '1d ago'}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed mt-1 line-clamp-2">{post.content}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

        </div>

        {/* ── RIGHT SIDEBAR (col-span-3) ───────────────────────────────── */}
        <div className="lg:col-span-3 space-y-4">

          {/* Greeting Card */}
          <div className="rounded-3xl border border-slate-200/10 dark:border-white/10 shadow-2xl min-h-[195px] relative overflow-hidden flex items-center group hover:scale-[1.015] hover:shadow-amber-500/5 transition-all duration-500">
            {/* Premium backdrop image */}
            <div className="absolute inset-0 z-0 select-none pointer-events-none">
              <img
                src={premiumCardBg}
                alt="Premium corporate sunrise backdrop"
                className="w-full h-full object-cover brightness-[0.85] contrast-[1.05] group-hover:scale-[1.04] transition-transform duration-[1500ms] ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/40 to-transparent" />
            </div>

            {/* Left Content */}
            <div className="relative z-10 p-6 flex flex-col justify-between h-full w-full py-6 min-w-0">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[3px] text-amber-400 drop-shadow flex items-center gap-1.5">
                  {getTimeBasedGreeting()} {getTimeBasedGreeting() === 'Good Morning' ? '🌅' : getTimeBasedGreeting() === 'Good Afternoon' ? '☀️' : '🌙'}
                </span>
                <h2 className="text-3xl font-black text-white tracking-tight mt-2.5 drop-shadow-md select-none">
                  {user?.full_name?.split(' ')[0] || 'Nadumi'}!
                </h2>
                <div className="text-[11.5px] text-slate-200 font-semibold mt-2 leading-relaxed drop-shadow">
                  <span>Welcome back to the</span>
                  <div className="w-fit mt-1">
                    <span className="text-white font-extrabold uppercase tracking-wide border-b-2 border-amber-400 pb-0.5">GS Intranet Portal</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-6 bg-black/35 border border-white/5 rounded-full px-3 py-1 w-fit shadow-inner backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                <span className="text-[9px] text-slate-300 font-bold uppercase tracking-wider select-none leading-none mt-0.5">{currentDateTime}</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-3xl bg-white dark:bg-[#131B2E] border border-slate-100 dark:border-white/5 shadow-xl p-6 glass-card">
            <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-[3px] mb-4">Quick Actions</h3>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { name: 'WISE HR Portal', icon: Globe, path: '/wise', externalUrl: 'http://172.16.0.26/WISE/UI/User/login.aspx', bg: 'bg-emerald-50 dark:bg-emerald-950/30', text: 'text-emerald-600', border: 'border-emerald-100 dark:border-emerald-900/20', hoverShadow: 'hover:shadow-emerald-500/10' },
                { name: 'Company Feed', icon: Rss, path: '/feed', bg: 'bg-rose-50 dark:bg-rose-950/30', text: 'text-rose-600', border: 'border-rose-100 dark:border-rose-900/20', hoverShadow: 'hover:shadow-rose-500/10' },
                { name: 'Document Hub', icon: FileText, path: '/documents', bg: 'bg-amber-50 dark:bg-amber-950/30', text: 'text-amber-600', border: 'border-amber-100 dark:border-amber-900/20', hoverShadow: 'hover:shadow-amber-500/10' },
                { name: 'My Tasks', icon: CheckCircle2, path: '/tasks', bg: 'bg-violet-50 dark:bg-violet-950/30', text: 'text-violet-600', border: 'border-violet-100 dark:border-violet-900/20', hoverShadow: 'hover:shadow-violet-500/10' },
                { name: 'Directory', icon: Users, path: '/directory', bg: 'bg-sky-50 dark:bg-sky-950/30', text: 'text-sky-600', border: 'border-sky-100 dark:border-sky-900/20', hoverShadow: 'hover:shadow-sky-500/10' },
                { name: 'Notices & Perks', icon: Megaphone, path: '/feed', bg: 'bg-teal-50 dark:bg-teal-950/30', text: 'text-teal-600', border: 'border-teal-100 dark:border-teal-900/20', hoverShadow: 'hover:shadow-teal-500/10' },
              ].map((act, i) => {
                const Icon = act.icon;
                return (
                  <motion.button
                    whileHover={{ y: -4, scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    key={i}
                    onClick={() => {
                      if (act.externalUrl) {
                        window.open(act.externalUrl, '_blank');
                      } else {
                        navigate(act.path);
                      }
                    }}
                    className={`flex flex-col items-center gap-1.5 p-2.5 rounded-2xl border ${act.bg} ${act.border} hover:shadow-md ${act.hoverShadow} transition-all cursor-pointer group`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${act.text} ${act.bg} group-hover:scale-105 transition-transform`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className={`text-[8px] font-black uppercase tracking-wider text-center leading-tight w-full truncate ${act.text} opacity-80 group-hover:opacity-100`}>
                      {act.name}
                    </span>
                  </motion.button>
                );
              })}
            </div>
            <button
              onClick={() => navigate('/directory')}
              className="w-full py-2.5 mt-4 bg-gradient-to-r from-[#C41230] to-[#9E0E27] hover:from-[#9E0E27] hover:to-[#7F1D1D] text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md shadow-red-900/30 transition-all cursor-pointer active:scale-[0.98]"
            >
              View All Services
            </button>
          </div>

          {/* RSS News Card */}
          <div className="rounded-3xl bg-white dark:bg-[#131B2E] border border-slate-100 dark:border-white/5 shadow-xl p-6 glass-card mt-5 flex flex-col min-h-[300px] animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4.5">
              <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                <Rss className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-[3px]">Market News</h3>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Live Ada Derana Business Feed</p>
              </div>
            </div>

            {/* List */}
            <div className="space-y-3.5 flex-1 min-w-0">
              {rssLoading ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-2">
                  <RefreshCw className="w-6 h-6 text-orange-500 animate-spin" />
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Loading Feed...</span>
                </div>
              ) : rssNews.length > 0 ? (
                rssNews.slice(0, 3).map((item, idx) => (
                  <motion.a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.015, x: 2 }}
                    key={idx}
                    className="flex gap-3.5 p-2 bg-slate-50/50 hover:bg-slate-100/70 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-100/30 dark:border-white/5 rounded-2xl transition-all duration-300 group min-w-0"
                  >
                    <div className="w-13 h-13 rounded-xl overflow-hidden shrink-0 border border-slate-100/50 dark:border-white/10 shadow-sm relative group-hover:scale-105 transition-transform duration-300">
                      <img 
                        src={item.thumbnail} 
                        alt={item.title} 
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=200'; }}
                      />
                    </div>
                    <div className="min-w-0 flex-1 flex flex-col justify-between py-0.5">
                      <h4 className="text-[10.5px] font-bold text-slate-800 dark:text-white/95 leading-snug line-clamp-2 group-hover:text-orange-500 transition-colors">
                        {item.title}
                      </h4>
                      <div className="flex items-center justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1.5 leading-none">
                        <span className="text-orange-500/90 font-extrabold">{item.source?.split(' ')[0]}</span>
                        <span>{getRelativeTime(item.pubDate)}</span>
                      </div>
                    </div>
                  </motion.a>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-slate-200 dark:border-white/10 rounded-2xl">
                  <Rss className="w-6 h-6 text-slate-300 mb-2" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No News Available</p>
                </div>
              )}
            </div>

            {/* Footer View All */}
            <button
              onClick={() => navigate('/news?feed=external')}
              className="w-full py-2.5 mt-4 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-md shadow-orange-500/10 hover:shadow-orange-500/25 transition-all cursor-pointer flex items-center justify-center gap-1 active:scale-[0.98] group"
            >
              <span>View All News</span>
              <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

        </div>
      </div>

      {/* ── FLOATING WORKSPACE NOTES ─────────────────────────────────────── */}
      <div className="fixed bottom-8 right-8 z-50">
        <AnimatePresence>
          {showNotesPanel && (
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              className="absolute bottom-16 right-0 w-80 rounded-3xl p-5 bg-white/96 dark:bg-[#0F172A]/96 border border-slate-200 dark:border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.3)] backdrop-blur-2xl flex flex-col"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-amber-500" /> Workspace Notes
                </h3>
                <div className="flex gap-1.5">
                  <button onClick={() => addNote('amber')} className="w-7 h-7 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 hover:bg-amber-100 transition-all flex items-center justify-center cursor-pointer">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setShowNotesPanel(false)} className="w-7 h-7 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:bg-slate-100 transition-all flex items-center justify-center cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="relative mb-3">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search notes..."
                  className="w-full pl-8 pr-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10 placeholder-slate-400 font-semibold"
                />
                <Search className="w-3 h-3 text-slate-400 absolute left-2.5 top-2.5" />
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-0.5 custom-scrollbar">
                {filteredNotes.length > 0 ? filteredNotes.map(note => (
                  <div key={note.id} className={`p-3 border rounded-2xl flex flex-col shadow-sm ${noteColors[note.color]}`}>
                    <textarea
                      value={note.text}
                      onChange={e => updateNoteText(note.id, e.target.value)}
                      placeholder="Type your note..."
                      className="bg-transparent border-0 p-0 text-xs font-medium focus:ring-0 focus:outline-none resize-none min-h-[56px] w-full"
                    />
                    <div className="flex justify-between items-center border-t border-black/5 pt-2 mt-2">
                      <div className="flex gap-1.5">
                        {['amber', 'blue', 'emerald', 'rose'].map(c => (
                          <button
                            key={c}
                            onClick={() => updateNoteColor(note.id, c)}
                            className={`w-3.5 h-3.5 rounded-full transition-all cursor-pointer ${c === 'amber' ? 'bg-amber-300' : c === 'blue' ? 'bg-sky-300' : c === 'emerald' ? 'bg-emerald-300' : 'bg-rose-300'} ${note.color === c ? 'scale-110 ring-2 ring-offset-1 ring-slate-400' : 'scale-90 hover:scale-100'}`}
                          />
                        ))}
                      </div>
                      <button onClick={() => deleteNote(note.id)} className="p-1 hover:bg-rose-100 hover:text-rose-500 rounded-lg text-slate-400 transition-colors cursor-pointer">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-slate-200 rounded-2xl">
                    <StickyNote className="w-6 h-6 text-slate-300 mb-2" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Notes Found</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.93 }}
          onClick={() => setShowNotesPanel(!showNotesPanel)}
          className={`w-13 h-13 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all cursor-pointer relative ${showNotesPanel ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-gradient-to-br from-[#C41230] to-[#9E0E27] text-white shadow-red-900/50'}`}
        >
          {showNotesPanel ? <X className="w-5 h-5" /> : (
            <>
              <StickyNote className="w-5 h-5" />
              {notes.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 text-slate-900 border-2 border-white dark:border-slate-900 text-[8px] font-black rounded-full flex items-center justify-center shadow">
                  {notes.length}
                </span>
              )}
            </>
          )}
        </motion.button>
      </div>

      <WelcomePopup user={user} announcements={announcements} companyAlerts={activeAlerts} offers={offers} />
    </div>
  );
};

export default EmployeeDashboard;
