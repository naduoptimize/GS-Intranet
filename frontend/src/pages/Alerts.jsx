import { useState, useEffect } from 'react';
import { Megaphone, Search, AlertTriangle, Shield, Info, ChevronRight, RefreshCw, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:5000/api';

const alertIconMap = {
  warning: AlertTriangle,
  info: Info,
  success: Shield,
  danger: AlertTriangle,
  error: AlertTriangle,
};

export default function Alerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All');

  const loadAlerts = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/alerts`, {
        params: { subsidiary_id: user?.subsidiary_id, role: user?.role },
      });
      setAlerts(data);
    } catch (err) {
      console.error('Failed to load alerts', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadAlerts();
  }, [user]);

  const formatRelativeTime = (pubDateStr) => {
    if (!pubDateStr) return '';
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

  // Categories include Alert Types
  const alertTypes = ['All', 'warning', 'info', 'security'];

  // Filter alerts
  const filtered = alerts.filter(a => {
    const matchesSearch = 
      a.title?.toLowerCase().includes(search.toLowerCase()) ||
      a.message?.toLowerCase().includes(search.toLowerCase());
    
    const isWarning = a.type === 'warning' || a.type === 'danger' || a.type === 'error';
    const isSecurity = a.type === 'security' || a.type === 'success';
    
    let aType = 'info';
    if (isWarning) aType = 'warning';
    else if (isSecurity) aType = 'security';

    const matchesType = selectedType === 'All' || aType === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] pb-20 transition-colors duration-300">
      
      {/* ── HERO SECTION ── */}
      <section className="relative h-[250px] sm:h-[300px] w-full overflow-hidden rounded-[36px] bg-gradient-to-br from-[#E23E3E] via-[#C82A2A] to-[#A81B1B] text-white shadow-xl mb-12">
        <div className="absolute inset-0 bg-[radial-gradient(at_0%_0%,rgba(255,255,255,0.12)_0px,transparent_50%)]" />
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        
        <div className="absolute inset-0 flex items-center px-8 sm:px-12 md:px-16">
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full mb-4">
              <Megaphone className="w-3.5 h-3.5 text-white" />
              <span className="text-[9px] font-black text-white uppercase tracking-[3px]">Active Broadcast Bulletins</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tighter leading-none mb-3">
              Safety &amp; <span className="text-red-200">Alerts Center</span>
            </h1>
            <p className="text-white/80 text-xs sm:text-sm font-semibold leading-relaxed max-w-lg">
              Official company notices, IT maintenance schedules, health notices, and security advisories from George Steuart Group.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── SEARCH & FILTER ── */}
      <section className="bg-white dark:bg-[#131B2E] p-5 sm:p-7 rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-5 mb-10 glass-card">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full">
          {alertTypes.map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={`px-6 py-2.5 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${
                selectedType === type
                  ? 'bg-slate-900 dark:bg-brand-red border-slate-900 dark:border-brand-red text-white shadow-md' 
                  : 'bg-slate-50 dark:bg-[#0B0F19]/50 border-slate-100 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:border-slate-350 dark:hover:border-white/20'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-350 dark:text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search alert title or bulletin details..."
              className="pl-11 pr-5 py-3.5 bg-slate-50/50 dark:bg-[#0B0F19]/50 border border-slate-150/40 dark:border-white/5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-4 focus:ring-brand-red/5 w-full transition-all"
            />
          </div>
          <button
            onClick={loadAlerts}
            className="p-3.5 bg-slate-50/50 dark:bg-[#0B0F19]/50 border border-slate-150/40 dark:border-white/5 rounded-xl text-slate-400 hover:text-brand-red dark:text-slate-550 dark:hover:text-white transition-all flex justify-center items-center shrink-0 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </section>

      {/* ── BULLETINS LIST ── */}
      <section className="max-w-4xl mx-auto px-1">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-slate-150 border-t-brand-red rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-[#131B2E] rounded-3xl border border-dashed border-slate-200 dark:border-white/5 p-10">
            <Megaphone className="w-12 h-12 text-slate-300 dark:text-slate-650 mx-auto mb-3" />
            <p className="text-slate-700 dark:text-slate-300 font-black text-sm uppercase tracking-wider">All Clear!</p>
            <p className="text-xs text-slate-450 mt-1 max-w-xs mx-auto">
              No active alerts or advisories are currently broadcasted.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((alert, idx) => {
              const isWarning = alert.type === 'warning' || alert.type === 'danger' || alert.type === 'error';
              const isSecurity = alert.type === 'security' || alert.type === 'success';
              
              const themeCls = isWarning
                ? { 
                    card: 'bg-red-50/20 border-red-200/40 hover:border-red-305 dark:bg-red-950/5 dark:border-red-900/30', 
                    icon: 'bg-red-100 text-red-650 dark:bg-red-950 dark:text-red-300 border-red-250/20',
                    dot: 'bg-red-500' 
                  }
                : isSecurity
                ? { 
                    card: 'bg-emerald-50/25 border-emerald-250/40 hover:border-emerald-305 dark:bg-emerald-950/5 dark:border-emerald-900/30', 
                    icon: 'bg-emerald-100 text-emerald-650 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-250/20',
                    dot: 'bg-emerald-500' 
                  }
                : { 
                    card: 'bg-sky-50/20 border-sky-200/40 hover:border-sky-305 dark:bg-sky-950/5 dark:border-sky-900/30', 
                    icon: 'bg-sky-100 text-sky-650 dark:bg-sky-950 dark:text-sky-300 border-sky-250/20',
                    dot: 'bg-sky-500' 
                  };

              const Icon = isSecurity ? Shield : (alertIconMap[alert.type] || Info);

              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`p-5 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-300 cursor-pointer shadow-sm group ${themeCls.card}`}
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0 shadow-sm ${themeCls.icon} group-hover:scale-105 transition-transform`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-slate-800 dark:text-white leading-tight flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${themeCls.dot} animate-pulse`} />
                        {alert.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed mt-1">{alert.message}</p>
                      
                      <div className="flex items-center gap-3 mt-3.5">
                        <span className="flex items-center gap-1 text-[9px] font-black text-slate-405 dark:text-slate-500 uppercase tracking-widest leading-none">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          {new Date(alert.created_at).toLocaleDateString()}
                        </span>
                        
                        {alert.subsidiary_name && (
                          <span className="text-[8px] font-black text-[#C8102E]/80 dark:text-[#C8102E] uppercase tracking-widest px-2 py-0.5 rounded border border-[#C8102E]/10 dark:border-white/5 bg-[#C8102E]/5 shrink-0 leading-none">
                            {alert.subsidiary_name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 shrink-0 ml-16 sm:ml-0 self-end sm:self-center">
                    <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 group-hover:text-slate-650 transition-colors uppercase tracking-widest">
                      {formatRelativeTime(alert.created_at)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
