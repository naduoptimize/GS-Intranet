import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Megaphone,
  Gift,
  Sparkles,
  ArrowRight,
  Tag,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Info,
} from 'lucide-react';

const SESSION_KEY = 'gs_welcome_popup_shown';

const alertIconMap = {
  warning: AlertTriangle,
  info: Info,
  success: Shield,
  danger: AlertTriangle,
  error: AlertTriangle,
};

const alertColorMap = {
  amber: {
    bg: 'bg-amber-500/10 dark:bg-amber-500/5',
    border: 'border-amber-500/20',
    icon: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
    text: 'text-amber-700 dark:text-amber-300'
  },
  blue: {
    bg: 'bg-sky-500/10 dark:bg-sky-500/5',
    border: 'border-sky-500/20',
    icon: 'bg-sky-500/20 text-sky-600 dark:text-sky-400',
    text: 'text-sky-700 dark:text-sky-300'
  },
  emerald: {
    bg: 'bg-emerald-500/10 dark:bg-emerald-500/5',
    border: 'border-emerald-500/20',
    icon: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    text: 'text-emerald-700 dark:text-emerald-300'
  },
  rose: {
    bg: 'bg-rose-500/10 dark:bg-rose-500/5',
    border: 'border-rose-500/20',
    icon: 'bg-rose-500/20 text-rose-600 dark:text-rose-400',
    text: 'text-rose-700 dark:text-rose-300'
  },
  red: {
    bg: 'bg-rose-500/10 dark:bg-rose-500/5',
    border: 'border-rose-500/20',
    icon: 'bg-rose-500/20 text-rose-600 dark:text-rose-400',
    text: 'text-rose-700 dark:text-rose-300'
  },
};

const WelcomePopup = ({ user, announcements = [], companyAlerts = [], offers = [] }) => {
  const [visible, setVisible] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState('alerts');
  const [offersSlide, setOffersSlide] = React.useState(0);

  // Always show on every page load / refresh for now
  React.useEffect(() => {
    const t = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setVisible(false);
  };

  const currentOffer = offers.length > 0 ? offers[offersSlide] : null;
  const firstName = user?.full_name?.split(' ')[0] || 'there';

  const tabs = [
    {
      id: 'alerts',
      label: 'Alerts',
      icon: Megaphone,
      badge: companyAlerts.length,
      color: 'amber',
    },
    {
      id: 'announcements',
      label: 'announcements',
      icon: Bell,
      badge: announcements.length,
      color: 'rose',
    },
    {
      id: 'offers',
      label: 'Offers',
      icon: Gift,
      badge: offers.length,
      color: 'emerald',
    },
  ];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="welcome-backdrop"
          initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          animate={{ opacity: 1, backdropFilter: 'blur(16px)' }}
          exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          onClick={handleClose}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          style={{ background: 'rgba(5, 8, 15, 0.6)' }}
        >
          <motion.div
            key="welcome-modal"
            initial={{ opacity: 0, scale: 0.95, y: 30, rotateX: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20, rotateX: -10 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{ perspective: '1000px' }}
            className="relative w-full max-w-[600px] bg-white/90 dark:bg-[#0D1321]/90 backdrop-blur-2xl rounded-[36px] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] border border-white/40 dark:border-white/10 overflow-hidden flex flex-col"
          >
            {/* Soft background glow */}
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-red/20 dark:bg-brand-red/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-500/20 dark:bg-amber-500/10 rounded-full blur-[100px] pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 px-8 pt-8 pb-6 flex items-start justify-between">
              <div className="flex gap-4 items-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-brand-red/30 blur-xl rounded-full" />
                  <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-red to-rose-600 flex items-center justify-center shadow-lg border border-white/20">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <motion.p
                    initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="text-[10px] font-black text-brand-red uppercase tracking-[0.2em] mb-1"
                  >
                    GS Daily Briefing
                  </motion.p>
                  <motion.h2
                    initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="text-2xl font-black text-slate-800 dark:text-white tracking-tight leading-none"
                  >
                    Welcome back, {firstName}.
                  </motion.h2>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-10 h-10 rounded-full bg-slate-100/80 dark:bg-white/5 flex items-center justify-center text-slate-500 hover:bg-brand-red hover:text-white hover:rotate-90 transition-all duration-300 border border-transparent hover:border-brand-red/20 backdrop-blur-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Custom Segmented Tabs */}
            <div className="relative z-10 px-8">
              <div className="flex p-1.5 bg-slate-100/80 dark:bg-black/20 rounded-2xl backdrop-blur-md border border-white/20 dark:border-white/5">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`relative flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-colors duration-300 z-10 ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                        }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="popup-tab-indicator"
                          className="absolute inset-0 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-black/5 dark:border-white/10"
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-2">
                        <Icon className={`w-3.5 h-3.5 ${isActive && tab.color === 'amber' ? 'text-amber-500' : isActive && tab.color === 'rose' ? 'text-brand-red' : isActive && tab.color === 'emerald' ? 'text-emerald-500' : ''}`} />
                        {tab.label}
                        {tab.badge > 0 && (
                          <span className={`px-1.5 py-0.5 rounded-md text-[9px] ${isActive ? 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                            {tab.badge}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content Area */}
            <div className="relative z-10 mt-6 min-h-[300px] max-h-[50vh] overflow-y-auto px-8 pb-6 custom-scrollbar">
              <AnimatePresence mode="wait" initial={false}>

                {/* ── ALERTS TAB ── */}
                {activeTab === 'alerts' && (
                  <motion.div
                    key="alerts"
                    initial={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3"
                  >
                    {companyAlerts.length > 0 ? (
                      companyAlerts.map((alert, i) => {
                        const c = alertColorMap[alert.color] || alertColorMap.blue;
                        const IconComponent = alert.icon || alertIconMap[alert.type] || Bell;
                        return (
                          <motion.div
                            key={alert.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={`group relative flex gap-4 p-5 rounded-3xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg border ${c.bg} ${c.border}`}
                          >
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110 ${c.icon}`}>
                              <IconComponent className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0 pt-0.5">
                              <div className="flex items-center justify-between gap-3 mb-1">
                                <h4 className="text-[15px] font-black text-slate-850 dark:text-white leading-tight">{alert.title}</h4>
                                <span className="text-[10px] font-black text-slate-450 dark:text-slate-400 shrink-0">{alert.time}</span>
                              </div>
                              <p className="text-[13px] md:text-sm text-slate-655 dark:text-slate-300 leading-relaxed font-semibold mt-1.5">{alert.message}</p>
                            </div>
                          </motion.div>
                        );
                      })
                    ) : (
                      <div className="h-[250px] flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest mb-2">Systems Nominal</h4>
                        <p className="text-[12px] text-slate-400 max-w-[200px]">There are no active security or operational alerts right now.</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── ANNOUNCEMENTS TAB ── */}
                {activeTab === 'announcements' && (
                  <motion.div
                    key="announcements"
                    initial={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    {announcements.length > 0 ? (
                      announcements.map((post, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="group flex gap-4 p-3 rounded-2xl bg-white/50 dark:bg-white/5 border border-white/50 dark:border-white/10 hover:bg-white dark:hover:bg-white/10 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-xl"
                        >
                          <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 relative">
                            <img
                              src={post.image_url || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=300'}
                              alt=""
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <div className="flex-1 min-w-0 py-1 flex flex-col">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[9px] font-black text-brand-red uppercase tracking-widest">
                                {post.subsidiary_name || 'Corporate'}
                              </span>
                              <span className="text-[9px] font-bold text-slate-400">
                                {new Date(post.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <h4 className="text-[13px] font-black text-slate-800 dark:text-white leading-snug line-clamp-2 group-hover:text-brand-red transition-colors">
                              {post.title || post.content?.split('\n')[0]?.slice(0, 60)}
                            </h4>
                            <div className="mt-auto flex items-center text-[10px] font-bold text-slate-400 group-hover:text-brand-red transition-colors">
                              Read Article <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                            </div>
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="h-[250px] flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4">
                          <Bell className="w-8 h-8 text-slate-400" />
                        </div>
                        <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest mb-2">All Caught Up</h4>
                        <p className="text-[12px] text-slate-400 max-w-[200px]">You have read all recent company announcements.</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* ── OFFERS TAB ── */}
                {activeTab === 'offers' && (
                  <motion.div
                    key="offers"
                    initial={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                    exit={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
                    transition={{ duration: 0.3 }}
                  >
                    {offers.length > 0 && currentOffer ? (
                      <>
                        <AnimatePresence mode="wait">
                          <motion.div
                            key={offersSlide}
                            initial={{ opacity: 0, x: 30, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: -30, scale: 0.95 }}
                            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                            className={`relative rounded-3xl overflow-hidden bg-gradient-to-br ${currentOffer.gradient} p-8 min-h-[220px] flex flex-col justify-between group shadow-xl`}
                          >
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/noise-lines.png')] mix-blend-overlay opacity-20 pointer-events-none" />
                            {currentOffer.image_url && (
                              <img
                                src={currentOffer.image_url}
                                alt=""
                                className="absolute inset-0 w-full h-full object-cover opacity-25 mix-blend-overlay transition-transform duration-700 group-hover:scale-110 pointer-events-none"
                              />
                            )}

                            <div className="relative z-10">
                              <div className="flex items-start justify-between mb-4">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-white/20 text-white px-3 py-1 rounded-full backdrop-blur-md border border-white/20 shadow-sm">
                                  {currentOffer.badge}
                                </span>
                                <motion.span
                                  initial={{ scale: 0.5, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", delay: 0.2 }}
                                  className="text-[12px] font-black text-white bg-black/20 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg"
                                >
                                  {currentOffer.savings}
                                </motion.span>
                              </div>

                              <div className="flex items-center justify-between gap-4">
                                <div className="flex-1">
                                  <h3 className="text-2xl font-black text-white leading-tight tracking-tight mb-2 drop-shadow-md">
                                    {currentOffer.title}
                                  </h3>
                                  <p className="text-white/80 text-xs font-medium leading-relaxed line-clamp-2 max-w-[85%]">
                                    {currentOffer.description}
                                  </p>
                                </div>
                                <motion.div
                                  initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", delay: 0.3 }}
                                  className="text-6xl shrink-0 drop-shadow-2xl group-hover:scale-110 transition-transform duration-500"
                                >
                                  {currentOffer.emoji}
                                </motion.div>
                              </div>
                            </div>

                            <div className="relative z-10 flex items-center justify-between mt-6 pt-5 border-t border-white/20">
                              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/70">
                                <Tag className="w-3.5 h-3.5" />
                                Valid until: {currentOffer.valid_until}
                              </div>
                              <button className="flex items-center gap-2 bg-white text-slate-900 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl hover:shadow-white/20">
                                {currentOffer.cta}
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </motion.div>
                        </AnimatePresence>

                        {/* Pagination Controls */}
                        <div className="flex items-center justify-between mt-6 px-2">
                          <button
                            onClick={() => setOffersSlide((s) => (s - 1 + offers.length) % offers.length)}
                            className="w-10 h-10 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 hover:text-brand-red hover:border-brand-red shadow-sm transition-all"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>

                          <div className="flex gap-2">
                            {offers.map((_, idx) => (
                              <button
                                key={idx}
                                onClick={() => setOffersSlide(idx)}
                                className={`h-2 rounded-full transition-all duration-500 ${idx === offersSlide ? 'w-8 bg-brand-red' : 'w-2 bg-slate-200 dark:bg-slate-700 hover:bg-brand-red/40'
                                  }`}
                              />
                            ))}
                          </div>

                          <button
                            onClick={() => setOffersSlide((s) => (s + 1) % offers.length)}
                            className="w-10 h-10 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 hover:text-brand-red hover:border-brand-red shadow-sm transition-all"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <div className="h-[250px] flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                          <Gift className="w-8 h-8 text-emerald-500" />
                        </div>
                        <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest mb-2">No Special Offers</h4>
                        <p className="text-[12px] text-slate-400 max-w-[200px]">Check back later for exclusive staff promotions and benefits.</p>
                      </div>
                    )}
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* Footer Action */}
            <div className="relative z-10 px-8 py-5 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Briefing
              </span>
              <button
                onClick={handleClose}
                className="group flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
              >
                Proceed to Dashboard
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WelcomePopup;
