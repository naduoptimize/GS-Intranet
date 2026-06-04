import React from 'react';
import {
  CloudSun,
  TrendingUp,
  CalendarDays,
  ArrowRight,
  Plus,
  ThumbsUp,
  MessageSquare,
  Rss,
  GraduationCap,
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
  Sparkles,
  ExternalLink,
  Tag,
  Search,
  Mail,
  Phone,
  X,
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import WelcomePopup from '../components/WelcomePopup';

// ── Alert Icon Map ───────────────────────────────────────────────────────────
const alertIconMap = {
  warning: AlertTriangle,
  info: Info,
  success: Shield,
};


// ── George Steuart Heritage Trivia Data ───────────────────────────────────────
const GS_TRIVIA = [
  {
    id: 1,
    title: "Oldest Mercantile Firm",
    fact: "Established in 1835 by Captain James Steuart, George Steuart & Co. is proud to be Sri Lanka's oldest mercantile establishment, with over 190 years of trusted legacy.",
    icon: Shield,
    color: "from-amber-500/20 to-amber-600/5",
    badge: "Est. 1835",
  },
  {
    id: 2,
    title: "The Ceylon Tea Pioneers",
    fact: "Originally focused on coffee, George Steuart pioneered tea plantation management in Sri Lanka. Today, Heladiv Tea brings premium Ceylon Tea to over 50 countries globally.",
    icon: Sparkles,
    color: "from-emerald-500/20 to-emerald-600/5",
    badge: "Ceylon Tea",
  },
  {
    id: 3,
    title: "Citrus Leisure Gateway",
    fact: "Citrus Leisure, the hospitality arm, operates world-class resorts (Citrus Waskaduwa, Citrus Hikkaduwa, The Steuart by Citrus) offering authentic Sri Lankan hospitality.",
    icon: Gift,
    color: "from-sky-500/20 to-sky-600/5",
    badge: "Hospitality",
  },
  {
    id: 4,
    title: "190+ Years of Unity",
    fact: "Across travel, tea exports, financial services, healthcare, and leisure, the 'George Steuart Family' includes over 1,200 colleagues working in unity across Sri Lanka.",
    icon: Users,
    color: "from-rose-500/20 to-rose-600/5",
    badge: "GS Family",
  }
];

// ── Daily Work Motivation Prompts ───────────────────────────────────────────
const MOTIVATIONAL_PROMPTS = [
  "Small steps in the right direction can turn out to be the biggest steps of your life. Keep pushing! 🚀",
  "Great things in business are never done by one person; they're done by a team of people. Go GS team! 🤝",
  "Don't count the days, make the days count. Have a wonderful and productive day ahead! ☀️",
  "Success is the sum of small efforts, repeated day in and day out. You're doing amazing! ✨",
  "Remember to take a 5-minute break to rest your eyes, stretch, and stay hydrated today! 💧"
];

// ── Static Offers & Promotions Data ──────────────────────────────────────────
const GS_OFFERS = [
  {
    id: 1,
    category: 'Leisure',
    badge: '🏨 Exclusive',
    title: 'Citrus Leisure Hotel Stays',
    description:
      'Enjoy 30% off on weekend getaways at Citrus Leisure properties across Sri Lanka — exclusively for GS Group employees and their families.',
    cta: 'Book Now',
    gradient: 'from-sky-500 via-cyan-400 to-teal-500',
    emoji: '🌴',
    validUntil: 'Dec 31, 2026',
    savings: '30% OFF',
  },
  {
    id: 2,
    category: 'Insurance',
    badge: '🛡 Special Rate',
    title: 'GS Insurance Family Cover',
    description:
      'Get comprehensive family health insurance at a subsidised group rate, available only to permanent employees of the George Steuart Group.',
    cta: 'Learn More',
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-500',
    emoji: '🛡️',
    validUntil: 'Ongoing',
    savings: '25% OFF',
  },
  {
    id: 3,
    category: 'Tea & FMCG',
    badge: '🍵 Staff Benefit',
    title: 'Heladiv Premium Tea Bundle',
    description:
      'Order curated Heladiv premium tea packs at cost price. Monthly bundles available for delivery or pickup from the GS Teas warehouse.',
    cta: 'Order Bundle',
    gradient: 'from-amber-500 via-orange-400 to-rose-500',
    emoji: '🍵',
    validUntil: 'Monthly Renewal',
    savings: 'COST PRICE',
  },
  {
    id: 4,
    category: 'Travel',
    badge: '✈️ Group Rates',
    title: 'GS Travels Holiday Packages',
    description:
      'Exclusive holiday packages through GS Travels including airfare, accommodation, and travel insurance — at negotiated group rates.',
    cta: 'Explore Packages',
    gradient: 'from-emerald-500 via-green-400 to-teal-500',
    emoji: '✈️',
    validUntil: 'Dec 31, 2026',
    savings: 'UP TO 40% OFF',
  },
  {
    id: 5,
    category: 'Wellness',
    badge: '💊 Health Benefit',
    title: 'GS Healthcare Wellness Program',
    description:
      'Annual wellness check-ups, dental, and optical consultations at a significantly reduced cost through the GS Healthcare network.',
    cta: 'Register Now',
    gradient: 'from-rose-500 via-pink-500 to-red-500',
    emoji: '💊',
    validUntil: 'Dec 31, 2026',
    savings: 'FREE CHECK-UP',
  },
];

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [announcements, setAnnouncements] = React.useState([]);
  const [stats, setStats] = React.useState({ userCount: 1248, docCount: 0 });
  const [holidays, setHolidays] = React.useState([]);
  const [alerts, setAlerts] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [externalNews, setExternalNews] = React.useState([]);
  const [newsLoading, setNewsLoading] = React.useState(true);
  const [offers, setOffers] = React.useState([]);

  // Benefits category state
  const [selectedOfferCategory, setSelectedOfferCategory] = React.useState('All');

  // Interactive Mood Tracker State
  const [mood, setMood] = React.useState(() => {
    return localStorage.getItem('gs_user_mood') || '';
  });

  const handleMoodSelect = (selectedMood) => {
    const nextMood = mood === selectedMood ? '' : selectedMood;
    setMood(nextMood);
    if (nextMood) {
      localStorage.setItem('gs_user_mood', nextMood);
    } else {
      localStorage.removeItem('gs_user_mood');
    }
  };

  // Dynamic Acknowledged Alerts State
  const [acknowledgedAlerts, setAcknowledgedAlerts] = React.useState(() => {
    const saved = localStorage.getItem('gs_acknowledged_alerts');
    return saved ? JSON.parse(saved) : [];
  });

  const activeAlerts = alerts.filter(alert => !acknowledgedAlerts.includes(alert.id));

  const acknowledgeAlert = (id) => {
    const updated = [...acknowledgedAlerts, id];
    setAcknowledgedAlerts(updated);
    localStorage.setItem('gs_acknowledged_alerts', JSON.stringify(updated));
  };

  // Trivia Slide Index State
  const [triviaIndex, setTriviaIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setTriviaIndex((prev) => (prev + 1) % GS_TRIVIA.length);
    }, 10000); // cycle every 10 seconds
    return () => clearInterval(timer);
  }, []);

  // Multi Sticky Notes state and migration logic
  const [notes, setNotes] = React.useState(() => {
    const savedNotes = localStorage.getItem('gs_dashboard_notes');
    if (savedNotes) {
      try {
        return JSON.parse(savedNotes);
      } catch (e) {
        console.error('Failed to parse saved notes', e);
      }
    }
    
    // Fallback: migrate old single note if it exists
    const oldMemo = localStorage.getItem('gs_dashboard_memo');
    const oldColor = localStorage.getItem('gs_dashboard_memo_color') || 'amber';
    if (oldMemo && oldMemo.trim() !== '') {
      const migratedNotes = [
        {
          id: 'migrated-1',
          text: oldMemo,
          color: oldColor,
          updatedAt: new Date().toISOString(),
        }
      ];
      localStorage.setItem('gs_dashboard_notes', JSON.stringify(migratedNotes));
      localStorage.removeItem('gs_dashboard_memo');
      return migratedNotes;
    }
    
    // Default fallback note
    const defaultNotes = [
      {
        id: 'default-1',
        text: 'Welcome to your Workspace Notes! 📝\n\n• Capture ideas, reminders, or phone extensions here.\n• Click "+ Add Note" to create multiple sticky notes.\n• Switch individual note colors from the bottom dots.\n• Seek notes instantly using the filter bar above!',
        color: 'amber',
        updatedAt: new Date().toISOString(),
      }
    ];
    localStorage.setItem('gs_dashboard_notes', JSON.stringify(defaultNotes));
    return defaultNotes;
  });

  const [searchQuery, setSearchQuery] = React.useState('');

  const addNote = (color = 'amber') => {
    const newNote = {
      id: `note-${Date.now()}`,
      text: '',
      color,
      updatedAt: new Date().toISOString(),
    };
    const updatedNotes = [newNote, ...notes];
    setNotes(updatedNotes);
    localStorage.setItem('gs_dashboard_notes', JSON.stringify(updatedNotes));
  };

  const updateNoteText = (id, text) => {
    const updatedNotes = notes.map(note =>
      note.id === id ? { ...note, text, updatedAt: new Date().toISOString() } : note
    );
    setNotes(updatedNotes);
    localStorage.setItem('gs_dashboard_notes', JSON.stringify(updatedNotes));
  };

  const updateNoteColor = (id, color) => {
    const updatedNotes = notes.map(note =>
      note.id === id ? { ...note, color, updatedAt: new Date().toISOString() } : note
    );
    setNotes(updatedNotes);
    localStorage.setItem('gs_dashboard_notes', JSON.stringify(updatedNotes));
  };

  const deleteNote = (id) => {
    const updatedNotes = notes.filter(note => note.id !== id);
    setNotes(updatedNotes);
    localStorage.setItem('gs_dashboard_notes', JSON.stringify(updatedNotes));
  };

  // Sticky notes drawer open state
  const [isNotesOpen, setIsNotesOpen] = React.useState(false);

  // Live weather state
  const [weatherData, setWeatherData] = React.useState({
    temp: 31,
    humidity: 68,
    description: 'Partly Cloudy',
    code: 2,
  });
  const [exchangeRate, setExchangeRate] = React.useState({
    rate: '328.20',
    buy: '332.09',
    sell: '342.70',
    change: '+9.40%',
  });

  // Live ticking date and time state
  const [currentDateTime, setCurrentDateTime] = React.useState('');

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      };
      setCurrentDateTime(now.toLocaleString('en-US', options));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

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

  const getWeatherTheme = (description) => {
    const desc = description?.toLowerCase() || '';
    if (desc.includes('clear') || desc.includes('sunny')) {
      return {
        gradient: 'from-amber-500/5 via-sky-50/20 to-white dark:from-amber-500/10 dark:via-[#0F1524] dark:to-[#0F1524]',
        accent: 'bg-amber-500',
        textColor: 'text-amber-500',
        iconBg: 'bg-amber-500/10',
      };
    }
    if (desc.includes('rain') || desc.includes('thunder')) {
      return {
        gradient: 'from-slate-500/10 via-indigo-50/10 to-white dark:from-slate-800/20 dark:via-[#0F1524] dark:to-[#0F1524]',
        accent: 'bg-indigo-500',
        textColor: 'text-indigo-500',
        iconBg: 'bg-indigo-500/10',
      };
    }
    return {
      gradient: 'from-sky-500/5 via-slate-50/10 to-white dark:from-sky-800/10 dark:via-[#0F1524] dark:to-[#0F1524]',
      accent: 'bg-sky-400',
      textColor: 'text-sky-500',
      iconBg: 'bg-sky-500/10',
    };
  };

  const getSubLogo = (name) => {
    const lowName = (name || '').toLowerCase();
    if (lowName.includes('teas') && !lowName.includes('heladiv')) return '/gs_teas_logo.png';
    if (lowName.includes('citrus')) return 'https://citrusleisure.com/wp-content/themes/citrusleisure/img/logo.png';
    if (lowName.includes('heladiv')) return '/heladiv_logo.png';
    if (lowName.includes('insurance')) return '/insurance_logo.png';
    if (lowName.includes('health')) return '/health_logo.png';
    if (lowName.includes('travel')) return '/travel_logo.png';
    if (lowName.includes('holiday')) return '/holidays_logo.png';
    if (lowName.includes('consumer')) return '/consumer_logo.png';
    if (lowName.includes('solutions')) return '/solutions_logo.png';
    if (lowName.includes('recruitment')) return '/recruitment_logo.png';
    if (lowName.includes('invest')) return '/investments_logo.png';
    if (lowName.includes('asset')) return '/asset_management_logo.png';
    return '/api_logo.png';
  };

  const getSubsidiaryRepresentatives = (subName) => {
    const lowName = (subName || '').toLowerCase();
    if (lowName.includes('tea')) {
      return { hrName: 'Samadhi Muthukuda', hrExt: '2538', hrEmail: 'samadhi@georgesteuart.lk', itName: 'Dinuka Sampath', itExt: '2434', itEmail: 'dinuka@gsoptimize.lk', sector: 'Tea Exports & FMCG' };
    }
    if (lowName.includes('citrus') || lowName.includes('leisure')) {
      return { hrName: 'Erandi Liyanadaura', hrExt: '2410', hrEmail: 'erandi@georgesteuart.lk', itName: 'Sasindhu Maliyadda', itExt: '2433', itEmail: 'sasindhu@gsoptimize.lk', sector: 'Leisure & Hospitality' };
    }
    if (lowName.includes('insurance')) {
      return { hrName: 'Isuru Rukmal', hrExt: '2405', hrEmail: 'isuru@georgesteuart.lk', itName: 'Divan Wanniarachchi', itExt: '2432', itEmail: 'divan@gsoptimize.lk', sector: 'Financial Services' };
    }
    return { hrName: 'Samadhi Muthukuda', hrExt: '2538', hrEmail: 'samadhi@georgesteuart.lk', itName: 'Dinuka Sampath', itExt: '2434', itEmail: 'dinuka@gsoptimize.lk', sector: 'Diversified Conglomerate' };
  };



  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const postsRes = await axios.get(`http://localhost:5000/api/posts?subsidiary_id=${user?.subsidiary_id}`);
        setAnnouncements(postsRes.data.filter(p => p.type === 'announcement').slice(0, 3));

        const statsRes = await axios.get(`http://localhost:5000/api/analytics/stats?subsidiaryId=${user?.subsidiary_id}`);
        setStats(statsRes.data);

        const holidayRes = await axios.get('http://localhost:5000/api/holidays');
        const upcomingHolidays = holidayRes.data
          .filter(h => new Date(h.holiday_date) >= new Date())
          .slice(0, 3);
        setHolidays(upcomingHolidays);

        try {
          const alertsRes = await axios.get('http://localhost:5000/api/alerts', {
            params: {
              subsidiary_id: user?.subsidiary_id,
              role: user?.role
            }
          });
          const formattedAlerts = alertsRes.data.map(alert => ({
            ...alert,
            time: getRelativeTime(alert.created_at)
          }));
          setAlerts(formattedAlerts);
        } catch (err) {
          console.error('Failed to fetch dynamic alerts', err);
        }


        try {
          const offersRes = await axios.get('http://localhost:5000/api/offers', {
            params: {
              subsidiary_id: user?.subsidiary_id,
              role: user?.role
            }
          });
          setOffers(offersRes.data);
        } catch (err) {
          console.error('Failed to fetch dynamic offers', err);
        }

        try {
          setNewsLoading(true);
          const newsRes = await axios.get('http://localhost:5000/api/news/external-feed');
          setExternalNews(newsRes.data.slice(0, 4));
        } catch (err) {
          console.error('Failed to fetch RSS news feed', err);
        } finally {
          setNewsLoading(false);
        }

        try {
          const weatherRes = await axios.get(
            'https://api.open-meteo.com/v1/forecast?latitude=6.9271&longitude=79.8612&current=temperature_2m,relative_humidity_2m,weather_code'
          );
          const current = weatherRes.data.current;
          const code = current.weather_code;
          let description = 'Partly Cloudy';
          if (code === 0) description = 'Clear Sky';
          else if (code === 1) description = 'Mainly Clear';
          else if (code === 2) description = 'Partly Cloudy';
          else if (code === 3) description = 'Overcast';
          else if ([45, 48].includes(code)) description = 'Foggy';
          else if ([51, 53, 55, 80, 81, 82].includes(code)) description = 'Light Rain';
          else if ([61, 63, 65].includes(code)) description = 'Rainy';
          else if ([95, 96, 99].includes(code)) description = 'Thunderstorms';
          setWeatherData({ temp: Math.round(current.temperature_2m), humidity: current.relative_humidity_2m, description, code });
        } catch (err) {
          console.error('Failed to fetch live weather', err);
        }

        try {
          const fxRes = await axios.get('http://localhost:5000/api/analytics/cbsl-rates');
          const lkrRate = parseFloat(fxRes.data.rate);
          const buyRate = parseFloat(fxRes.data.buy);
          const sellRate = parseFloat(fxRes.data.sell);
          if (lkrRate) {
            const baseRate = 300.00;
            const percentageChange = (((lkrRate - baseRate) / baseRate) * 100).toFixed(2);
            const changeStr = percentageChange >= 0 ? `+${percentageChange}%` : `${percentageChange}%`;
            setExchangeRate({ rate: lkrRate.toFixed(2), buy: buyRate ? buyRate.toFixed(2) : '332.09', sell: sellRate ? sellRate.toFixed(2) : '342.70', change: changeStr });
          }
        } catch (err) {
          console.error('Failed to fetch exchange rate', err);
        }

      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const nextHoliday = holidays[0] || { name: 'No Upcoming Holidays', holiday_date: new Date() };

  const alertColorMap = {
    amber: { bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200 dark:border-amber-800/40', icon: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400', badge: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
    blue: { bg: 'bg-sky-50 dark:bg-sky-950/20', border: 'border-sky-200 dark:border-sky-800/40', icon: 'bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400', badge: 'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300', dot: 'bg-sky-500' },
    emerald: { bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-200 dark:border-emerald-800/40', icon: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-700 max-w-[1600px] mx-auto">
      {/* ── 1. WOW HERO BANNER ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative rounded-[32px] overflow-hidden min-h-[360px] flex flex-col justify-end p-8 md:p-12 shadow-2xl group border border-slate-100 dark:border-white/5"
      >
        <img
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2000"
          alt="Modern Office"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[15s] group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F1C] via-[#0A0F1C]/70 to-transparent" />
        <div className="absolute inset-0 bg-brand-red/10 mix-blend-overlay" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-4 shadow-xl"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">{getTimeBasedGreeting()}</span>
            </motion.div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight mb-2 drop-shadow-lg">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">{user?.full_name?.split(' ')[0] || 'Member'}</span>
            </h1>
            <p className="text-slate-300 font-medium max-w-xl text-sm md:text-base drop-shadow">
              Your central hub for George Steuart Group updates, tools, and professional growth.
            </p>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-end gap-2"
          >
            <div className="px-6 py-3 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center gap-3 shadow-2xl">
              <Clock className="w-5 h-5 text-brand-red" />
              <span className="text-lg font-black text-white tracking-wider">{currentDateTime || 'Loading time...'}</span>
            </div>
            <div className="px-4 py-2 bg-brand-red/90 backdrop-blur-md rounded-xl shadow-lg border border-red-400/30 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              <span className="text-[10px] font-black text-white uppercase tracking-widest">{user?.subsidiary_name || 'Group Corporate'}</span>
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* ── 2. BENTO GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* Weather & FX (Col 3) */}
        {(() => {
          const theme = getWeatherTheme(weatherData.description);
          return (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
              className={`md:col-span-4 lg:col-span-3 rounded-[32px] p-6 bg-gradient-to-br ${theme.gradient} border border-slate-100 dark:border-white/5 shadow-xl flex flex-col justify-between group overflow-hidden relative`}
            >
              <div className="relative z-10 flex justify-between items-start mb-6">
                <div className={`w-12 h-12 ${theme.iconBg} rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform`}>
                  <CloudSun className={`w-6 h-6 ${theme.textColor}`} />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Colombo</p>
                  <p className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{weatherData.temp}°</p>
                </div>
              </div>
              <div className="relative z-10 pt-4 border-t border-slate-200 dark:border-white/10">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">USD/LKR (CBSL)</p>
                <div className="flex justify-between items-end">
                  <p className="text-xl font-black text-slate-800 dark:text-white tracking-tight">{exchangeRate.rate}</p>
                  <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">{exchangeRate.change}</span>
                </div>
              </div>
              <div className={`absolute -bottom-10 -right-10 w-32 h-32 ${theme.textColor}/10 rounded-full blur-3xl`} />
            </motion.div>
          );
        })()}

        {/* Mood Tracker (Col 4) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
          className="md:col-span-4 lg:col-span-4 rounded-[32px] p-6 bg-white dark:bg-[#12182B] border border-slate-100 dark:border-white/5 shadow-xl flex flex-col justify-between relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-rose-400 to-indigo-400" />
          <div className="flex justify-between items-center mb-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Daily Vibe
            </p>
          </div>
          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed italic mb-4 line-clamp-2">
            "{MOTIVATIONAL_PROMPTS[new Date().getDate() % MOTIVATIONAL_PROMPTS.length]}"
          </p>
          <div className="flex justify-between gap-2">
            {[
              { key: 'energetic', emoji: '🌟', color: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 ring-amber-400/50' },
              { key: 'focused', emoji: '🎯', color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 ring-emerald-400/50' },
              { key: 'happy', emoji: '😊', color: 'bg-sky-100 text-sky-600 dark:bg-sky-500/20 ring-sky-400/50' },
              { key: 'need_tea', emoji: '☕', color: 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 ring-rose-400/50' }
            ].map(m => (
              <button
                key={m.key}
                onClick={() => handleMoodSelect(m.key)}
                className={`flex-1 aspect-square rounded-2xl flex flex-col items-center justify-center gap-1 transition-all duration-300 ${mood === m.key ? `${m.color} scale-110 shadow-lg ring-2` : 'bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 hover:-translate-y-1'}`}
              >
                <span className="text-xl drop-shadow-sm">{m.emoji}</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Active Alerts (Col 5) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
          className="md:col-span-4 lg:col-span-5 rounded-[32px] p-6 bg-brand-red dark:bg-brand-red-dark text-white shadow-xl shadow-brand-red/20 relative overflow-hidden flex flex-col"
        >
          <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex justify-between items-center mb-4 relative z-10">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/80 flex items-center gap-2">
              <Megaphone className="w-3.5 h-3.5" /> Company Alerts
            </p>
            <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black">{activeAlerts.length} Active</span>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative z-10 space-y-2 max-h-[140px]">
            {activeAlerts.length > 0 ? (
              activeAlerts.slice(0, 2).map(alert => (
                <div key={alert.id} className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex justify-between items-center group">
                  <div>
                    <p className="text-[11px] font-black text-white mb-0.5 leading-tight">{alert.title}</p>
                    <p className="text-[10px] text-white/70 line-clamp-1">{alert.message}</p>
                  </div>
                  <button onClick={() => acknowledgeAlert(alert.id)} className="w-6 h-6 rounded-full bg-white/10 hover:bg-white/30 flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-all">
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2 drop-shadow-md" />
                <p className="text-xs font-black tracking-wider">All Clear</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Main Feed (Col 8) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="md:col-span-12 lg:col-span-8 rounded-[32px] p-6 md:p-8 bg-white dark:bg-[#12182B] border border-slate-100 dark:border-white/5 shadow-xl flex flex-col"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-3">
              <span className="w-2 h-6 bg-brand-red rounded-full" /> Latest Announcements
            </h3>
            <button onClick={() => navigate('/feed')} className="text-[10px] font-black text-slate-400 hover:text-brand-red uppercase tracking-widest flex items-center gap-1 transition-colors">
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
            {loading ? (
              [1, 2].map(i => <div key={i} className="bg-slate-100 dark:bg-white/5 rounded-2xl animate-pulse min-h-[200px]" />)
            ) : announcements.length > 0 ? (
              announcements.slice(0, 2).map((post, i) => (
                <div key={i} className="group relative rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer min-h-[200px] flex flex-col justify-end p-6">
                  <img src={post.image_url || 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=800'} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                  <div className="relative z-10 transform group-hover:-translate-y-1 transition-transform">
                    <span className="inline-block px-2.5 py-1 rounded-lg bg-brand-red text-white text-[9px] font-black uppercase tracking-widest mb-3 shadow-sm">{post.subsidiary_name || 'Corporate'}</span>
                    <h4 className="text-white font-black text-sm md:text-base leading-snug line-clamp-2 drop-shadow-md">{post.title || post.content.split('\n')[0].slice(0, 60)}</h4>
                  </div>
                </div>
              ))
            ) : (
               <div className="col-span-2 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl min-h-[200px]">
                 <p className="text-slate-400 font-bold text-xs">No announcements</p>
               </div>
            )}
          </div>
        </motion.div>

        {/* Heritage Trivia (Col 4) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="md:col-span-12 lg:col-span-4 rounded-[32px] p-6 md:p-8 bg-gradient-to-br from-slate-900 to-[#0A0F1C] border border-white/10 text-white shadow-xl relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay" />
          <div className="flex justify-between items-center relative z-10 mb-6">
            <span className="text-[9px] font-black uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full border border-white/10 shadow-sm backdrop-blur-md">GS Heritage</span>
            <Shield className="w-4 h-4 text-amber-400 drop-shadow-lg" />
          </div>
          
          <div className="relative z-10 flex-1 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              {(() => {
                const currentSlide = GS_TRIVIA[triviaIndex];
                const SlideIcon = currentSlide.icon;
                return (
                  <motion.div
                    key={triviaIndex}
                    initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.4 }}
                    className="text-center"
                  >
                    <div className="w-14 h-14 mx-auto rounded-2xl bg-white/10 flex items-center justify-center mb-5 border border-white/20 shadow-lg backdrop-blur-md">
                      <SlideIcon className="w-6 h-6 text-amber-400 drop-shadow-md" />
                    </div>
                    <h4 className="text-sm md:text-base font-black text-white uppercase tracking-wider mb-2 drop-shadow-md">{currentSlide.title}</h4>
                    <p className="text-xs text-slate-300 font-medium leading-relaxed max-w-[90%] mx-auto">{currentSlide.fact}</p>
                  </motion.div>
                );
              })()}
            </AnimatePresence>
          </div>
          
          <div className="relative z-10 flex justify-center gap-1.5 mt-8">
            {GS_TRIVIA.map((_, i) => (
              <button key={i} onClick={() => setTriviaIndex(i)} className={`h-1.5 rounded-full transition-all duration-300 ${triviaIndex === i ? 'w-5 bg-amber-400' : 'w-1.5 bg-white/20 hover:bg-white/40'}`} />
            ))}
          </div>
        </motion.div>

        {/* Offers & Benefits (Col 12) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          className="md:col-span-12 rounded-[32px] p-6 md:p-8 bg-white dark:bg-[#12182B] border border-slate-100 dark:border-white/5 shadow-xl"
        >
          <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
            <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-500/20">
                <Gift className="w-5 h-5" />
              </div>
              Exclusive Staff Offers
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar w-full sm:w-auto">
              {['All', 'Leisure', 'Insurance', 'Tea & FMCG', 'Travel', 'Wellness'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedOfferCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${
                    selectedOfferCategory === cat ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md' : 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200 dark:hover:bg-white/10'
                  }`}
                >
                  {cat === 'Tea & FMCG' ? 'Tea' : cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(selectedOfferCategory === 'All' ? offers : offers.filter(o => o.category === selectedOfferCategory)).slice(0,4).map((offer, idx) => (
              <motion.div
                key={offer.id}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.1 }}
                className={`group relative rounded-3xl overflow-hidden bg-gradient-to-br ${offer.gradient || 'from-slate-700 to-slate-900'} p-6 flex flex-col justify-between min-h-[240px] shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300`}
              >
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/noise-lines.png')] opacity-20 mix-blend-overlay pointer-events-none" />
                <div className="relative z-10 flex justify-between items-start mb-4">
                  <span className="text-[9px] font-black text-white bg-white/20 px-3 py-1 rounded-full uppercase tracking-widest backdrop-blur-md border border-white/20 shadow-sm">{offer.badge}</span>
                  <span className="text-4xl drop-shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-transform duration-300">{offer.emoji}</span>
                </div>
                <div className="relative z-10">
                  <h4 className="text-lg font-black text-white leading-tight mb-2 drop-shadow-md">{offer.title}</h4>
                  <p className="text-[11px] text-white/80 line-clamp-2 mb-5 font-medium leading-relaxed">{offer.description}</p>
                  <button onClick={() => alert(`Claimed ${offer.title}!`)} className="w-full py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 group-hover:bg-white group-hover:text-slate-900 shadow-sm">
                    {offer.cta} <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <WelcomePopup user={user} announcements={announcements} companyAlerts={activeAlerts} offers={offers} />
    </div>
  );
};

export default EmployeeDashboard;
