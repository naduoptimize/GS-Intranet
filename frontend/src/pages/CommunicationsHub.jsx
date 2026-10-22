import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Megaphone, Gift, AlertTriangle, Building2, Globe,
  Search, Calendar, RefreshCw, Copy, Check,
  Layers, Heart, CheckCircle2, ThumbsUp, PartyPopper
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:5000/api';

export default function CommunicationsHub() {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState(() => {
    const requestedTab = searchParams.get('tab');
    if (['announcements', 'offers', 'alerts', 'all'].includes(requestedTab)) return requestedTab;
    if (location.pathname.endsWith('/offers')) return 'offers';
    if (location.pathname.endsWith('/alerts')) return 'alerts';
    return 'all';
  });
  const [announcements, setAnnouncements] = useState([]);
  const [offers, setOffers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState({});
  const [toast, setToast] = useState(null);
  const [reactions, setReactions] = useState({});
  const [reactingKey, setReactingKey] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const fetchStream = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const queryParams = {
        role: user.role || 'employee',
        subsidiary_id: user.subsidiary_id,
        user_id: user.id
      };

      const [postsRes, offersRes, alertsRes] = await Promise.all([
        axios.get(`${API_BASE}/posts`, { params: queryParams }),
        axios.get(`${API_BASE}/offers`, { params: queryParams }),
        axios.get(`${API_BASE}/alerts`, { params: queryParams })
      ]);

      setAnnouncements(postsRes.data || []);
      setOffers(offersRes.data || []);
      setAlerts(alertsRes.data || []);
      try {
        const reactionsRes = await axios.get(`${API_BASE}/communications/reactions`, { params: { user_id: user.id } });
        setReactions(Object.fromEntries((reactionsRes.data || []).map((reaction) => [`${reaction.item_type}:${reaction.item_id}`, reaction])));
      } catch (reactionError) {
        console.warn('Communications loaded without reaction summaries', reactionError);
        setReactions({});
      }
    } catch (err) {
      console.error('Failed to load employee communications stream', err);
      showToast('Could not load latest notices', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, showToast]);

  useEffect(() => {
    const timer = setTimeout(fetchStream, 0);
    return () => clearTimeout(timer);
  }, [fetchStream]);


  const handleCopyOffer = (id, badge) => {
    const promo = badge ? badge.replace(/[^A-Za-z0-9]/g, '').toUpperCase() + '-GS2026' : 'GS-STAFF2026';
    navigator.clipboard.writeText(promo);
    setCopiedId(id);
    showToast(`Promo code copied: ${promo} ✓`);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleAcknowledgeAlert = (id) => {
    setAcknowledgedAlerts(prev => ({ ...prev, [id]: true }));
    showToast('Notice acknowledged ✓');
  };

  const handleReaction = async (item, reactionType) => {
    const key = `${item.itemType}:${item.id}`;
    if (!user?.id || reactingKey === key) return;
    setReactingKey(key);
    try {
      const response = await axios.post(`${API_BASE}/communications/${item.itemType}/${item.id}/react`, {
        user_id: user.id,
        reaction_type: reactionType
      });
      setReactions((current) => ({ ...current, [key]: { item_type: item.itemType, item_id: item.id, ...response.data } }));
    } catch (error) {
      console.error('Failed to save reaction', error);
      showToast('Could not save your reaction', 'error');
    } finally {
      setReactingKey(null);
    }
  };

  // ── UNIFIED STREAM COMPOSITION ─────────────────────────────
  const allItems = useMemo(() => {
    const list = [
      ...announcements.map(a => ({
        ...a,
        itemType: 'announcement',
        reactionSummary: reactions[`announcement:${a.id}`] || { reaction_count: a.likes || 0, user_reaction: a.user_reaction },
        displayTitle: a.content?.length > 70 ? a.content.substring(0, 70) + '...' : a.content,
        createdDate: a.created_at
      })),
      ...offers.map(o => ({
        ...o,
        itemType: 'offer',
        reactionSummary: reactions[`offer:${o.id}`] || {},
        displayTitle: o.title,
        createdDate: o.created_at
      })),
      ...alerts.map(al => ({
        ...al,
        itemType: 'alert',
        reactionSummary: reactions[`alert:${al.id}`] || {},
        displayTitle: al.title,
        createdDate: al.created_at
      }))
    ];

    return list.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
  }, [announcements, offers, alerts, reactions]);

  // Filter based on active tab and search
  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      if (activeTab === 'announcements' && item.itemType !== 'announcement') return false;
      if (activeTab === 'offers' && item.itemType !== 'offer') return false;
      if (activeTab === 'alerts' && item.itemType !== 'alert') return false;

      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        item.displayTitle?.toLowerCase().includes(q) ||
        item.content?.toLowerCase().includes(q) ||
        item.description?.toLowerCase().includes(q) ||
        item.message?.toLowerCase().includes(q) ||
        item.badge?.toLowerCase().includes(q) ||
        item.category?.toLowerCase().includes(q) ||
        item.subsidiary_name?.toLowerCase().includes(q)
      );
    });
  }, [allItems, activeTab, search]);

  const activeLabel = activeTab === 'all' ? 'Latest communications' : activeTab === 'announcements' ? 'Company announcements' : activeTab === 'offers' ? 'Staff offers' : 'Alerts & bulletins';
  const contentSections = useMemo(() => {
    if (activeTab !== 'all') return [{ id: activeTab, items: filteredItems }];
    return [
      { id: 'offers', items: filteredItems.filter(item => item.itemType === 'offer') },
      { id: 'announcements', items: filteredItems.filter(item => item.itemType === 'announcement') },
      { id: 'alerts', items: filteredItems.filter(item => item.itemType === 'alert') }
    ].filter(section => section.items.length > 0);
  }, [activeTab, filteredItems]);

  return (
    <div className="mx-auto min-h-screen w-full max-w-[1450px] space-y-5 bg-[#F7F8FA] px-4 pb-12 pt-5 transition-colors duration-300 dark:bg-[#0B0F19] sm:px-6 lg:px-8">
      
      {/* ── TOAST ALERT ── */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-[200] px-5 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-xl ${
              toast.type === 'error' 
                ? 'bg-rose-50/95 dark:bg-rose-950/90 border-rose-200 text-rose-800 dark:text-rose-200' 
                : 'bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-200 text-emerald-800 dark:text-emerald-200'
            }`}
          >
            {toast.type === 'error'
              ? <AlertTriangle className="h-5 w-5 shrink-0 text-rose-500" />
              : <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />}
            <span className="text-xs sm:text-sm font-black tracking-wide">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-[#37080f] via-[#73101f] to-[#b3142f] px-6 py-6 text-white shadow-[0_22px_55px_-30px_rgba(120,16,35,0.7)] sm:px-8">
        <div className="absolute -right-12 -top-24 h-64 w-64 rounded-full bg-[#d7a343]/20 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 backdrop-blur">
              <Megaphone className="h-5 w-5" />
            </div>
            <div>
              <p className="mb-1 text-[9px] font-black uppercase tracking-[0.24em] text-[#e5c376]">Your workplace, at a glance</p>
              <h1 className="text-2xl font-black tracking-tight sm:text-[30px]">Company Feed</h1>
              <p className="mt-1 max-w-xl text-xs font-medium leading-5 text-white/65">News, benefits and important notices—without the endless scrolling.</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'announcements', label: 'Announcements', value: announcements.length, icon: Megaphone, tone: 'text-brand-red bg-[#FFF0F3]' },
              { id: 'offers', label: 'Offers', value: offers.length, icon: Gift, tone: 'text-[#A87627] bg-[#FFF6E6]' },
              { id: 'alerts', label: 'Alerts', value: alerts.length, icon: AlertTriangle, tone: 'text-rose-600 bg-rose-50' }
            ].map(({ id, label, value, icon: Icon, tone }) => (
              <button key={id} type="button" onClick={() => setActiveTab(id)} className={`min-w-[88px] rounded-xl border px-3 py-2.5 text-left transition-all hover:bg-white/15 sm:min-w-[108px] ${activeTab === id ? 'border-white/35 bg-white text-slate-900 shadow-lg' : 'border-white/10 bg-white/8 text-white'}`}>
                <span className={`mb-2 flex h-7 w-7 items-center justify-center rounded-lg ${tone}`}><Icon className="h-3.5 w-3.5" /></span>
                <strong className="block text-base font-black leading-none">{value}</strong>
                <span className={`mt-1 block text-[8px] font-black uppercase tracking-wider ${activeTab === id ? 'text-slate-400' : 'text-white/55'}`}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="space-y-5">

        {activeTab === 'all' && allItems.length > 0 && (
          <section className="update-ticker flex h-12 overflow-hidden rounded-2xl border border-[#eadfce] bg-white shadow-[0_10px_30px_-22px_rgba(80,35,26,0.3)]">
            <style>{`
              @keyframes communications-ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
              .update-ticker-track { animation: communications-ticker ${Math.max(22, allItems.length * 8)}s linear infinite; }
              .update-ticker:hover .update-ticker-track { animation-play-state: paused; }
              @media (prefers-reduced-motion: reduce) { .update-ticker-track { animation-play-state: paused; } }
            `}</style>
            <div className="relative z-10 flex shrink-0 items-center gap-2 bg-gradient-to-r from-[#9E0E27] to-[#C41230] px-4 text-white shadow-lg">
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/15"><Megaphone className="h-3.5 w-3.5" /></span>
              <span className="hidden text-[9px] font-black uppercase tracking-[0.18em] sm:block">Live updates</span>
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="update-ticker-track flex h-full w-max items-center will-change-transform">
                {[...allItems, ...allItems].map((item, index) => {
                  const ItemIcon = item.itemType === 'offer' ? Gift : item.itemType === 'alert' ? AlertTriangle : Megaphone;
                  const label = item.itemType === 'offer' ? 'Offer' : item.itemType === 'alert' ? 'Alert' : 'News';
                  return (
                    <button key={`${item.itemType}-${item.id}-${index}`} type="button" onClick={() => setActiveTab(item.itemType === 'announcement' ? 'announcements' : `${item.itemType}s`)} className="group flex h-full shrink-0 items-center gap-3 border-r border-slate-100 px-6 text-left transition-colors hover:bg-[#fff8f3]">
                      <ItemIcon className={`h-3.5 w-3.5 ${item.itemType === 'offer' ? 'text-[#b27b25]' : item.itemType === 'alert' ? 'text-rose-500' : 'text-brand-red'}`} />
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{label}</span>
                      <span className="max-w-[320px] truncate text-xs font-bold text-slate-700 group-hover:text-brand-red">{item.displayTitle}</span>
                      <span className="h-1 w-1 rounded-full bg-[#d7a343]" />
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── TABS & SEARCH BAR ── */}
        <div className="sticky top-[72px] z-30 rounded-[22px] border border-[#e7ddd1] bg-white/95 p-2.5 shadow-[0_14px_38px_-24px_rgba(63,32,26,0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95 sm:p-3">
          <div className="grid items-center gap-3 lg:grid-cols-[minmax(0,1fr)_340px]">
            
            {/* Filter Tabs */}
            <div className="grid grid-cols-2 gap-1 rounded-2xl bg-[#f3f5f8] p-1.5 dark:bg-white/5 sm:grid-cols-4">
              {[
                { id: 'all', label: 'All', count: allItems.length, icon: Layers },
                { id: 'announcements', label: 'Announcements', count: announcements.length, icon: Megaphone },
                { id: 'offers', label: 'Offers', count: offers.length, icon: Gift },
                { id: 'alerts', label: 'Alerts', count: alerts.length, icon: AlertTriangle }
              ].map(t => {
                const Icon = t.icon;
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`group flex min-w-0 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                      active 
                        ? 'bg-gradient-to-r from-[#a70f29] to-[#d01637] text-white shadow-[0_8px_20px_-8px_rgba(196,18,48,0.65)]' 
                        : 'text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-sm dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'
                    }`}
                  >
                    <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${active ? 'bg-white/15' : 'bg-white text-slate-400 shadow-sm dark:bg-white/5'}`}><Icon className="h-3.5 w-3.5" /></span>
                    <span className="truncate">{t.label}</span>
                    <span className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[8px] font-black ${
                      active ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-500 dark:bg-white/10'
                    }`}>
                      {t.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="flex items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search feed..."
                  className="w-full rounded-xl border border-slate-200 bg-[#fafbfc] py-3 pl-10 pr-4 text-xs font-bold text-slate-800 outline-none transition focus:border-brand-red/30 focus:bg-white focus:ring-4 focus:ring-brand-red/5 dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </div>
              <button
                onClick={fetchStream}
                title="Refresh Stream"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-brand-red/20 hover:bg-[#fff5f6] hover:text-brand-red dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-end justify-between gap-4 px-1">
          <div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#B38945]">Stay informed</p><h2 className="mt-1 text-xl font-black tracking-tight text-slate-900 dark:text-white">{activeLabel}</h2></div>
          <p className="text-xs font-bold text-slate-400">{filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}</p>
        </div>

        {/* ── BROADCAST CARDS STREAM ── */}
        {loading ? (
          <div className="glass-card p-16 text-center rounded-3xl">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-brand-red rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading latest notices &amp; perks...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="glass-card p-16 text-center rounded-3xl space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400 flex items-center justify-center mx-auto">
              <Layers className="w-8 h-8 opacity-40" />
            </div>
            <h4 className="text-base font-black text-slate-700 dark:text-white">No items found</h4>
            <p className="text-xs font-medium text-slate-400 max-w-md mx-auto">
              {search ? "No announcements, offers, or alerts match your search." : "No published notices in this category at this moment."}
            </p>
          </div>
        ) : (
          <div className="space-y-9">
            {contentSections.map(section => {
              const sectionMeta = section.id === 'alerts'
                ? { title: 'Alerts & bulletins', eyebrow: 'Important', icon: AlertTriangle, iconClass: 'bg-rose-50 text-rose-600', lineClass: 'bg-rose-500' }
                : section.id === 'offers'
                  ? { title: 'Staff offers', eyebrow: 'Exclusive benefits', icon: Gift, iconClass: 'bg-amber-50 text-[#A87627]', lineClass: 'bg-[#D7A343]' }
                  : { title: 'Company announcements', eyebrow: 'From the group', icon: Megaphone, iconClass: 'bg-[#FFF0F3] text-brand-red', lineClass: 'bg-brand-red' };
              const SectionIcon = sectionMeta.icon;
              return (
                <section key={section.id} className="space-y-4">
                  {activeTab === 'all' && (
                    <div className="flex items-center gap-3">
                      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${sectionMeta.iconClass}`}><SectionIcon className="h-4 w-4" /></span>
                      <div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">{sectionMeta.eyebrow}</p><h3 className="text-base font-black text-slate-900 dark:text-white">{sectionMeta.title}</h3></div>
                      <span className={`ml-1 h-px flex-1 ${sectionMeta.lineClass} opacity-20`} />
                      <button type="button" onClick={() => setActiveTab(section.id)} className="rounded-lg px-2 py-1 text-[10px] font-black text-slate-400 transition-colors hover:bg-white hover:text-brand-red">View all</button>
                    </div>
                  )}
                  <div className={`grid grid-cols-1 items-start gap-5 ${section.id === 'alerts' && activeTab === 'all' ? 'xl:grid-cols-3' : 'lg:grid-cols-2'}`}>
            {section.items.map(item => {
              const isAnnouncement = item.itemType === 'announcement';
              const isOffer = item.itemType === 'offer';
              const isAlert = item.itemType === 'alert';
              const isGlobal = !item.subsidiary_id;
              const isAcknowledged = acknowledgedAlerts[item.id];

              return (
                <motion.div
                  key={`${item.itemType}-${item.id}`}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-[24px] border bg-white shadow-[0_10px_30px_rgba(34,20,16,0.04)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_20px_45px_rgba(34,20,16,0.09)] dark:bg-slate-900 ${isAlert ? 'border-rose-200 dark:border-rose-900/50' : isOffer ? 'border-amber-200/80 dark:border-amber-900/40' : 'border-[#E8E0D7] dark:border-white/10'}`}
                >
                  {/* Top Color Accent */}
                  <div className={`h-1 w-full ${
                    isAlert ? 'bg-rose-500' : isOffer ? 'bg-gradient-to-r from-brand-gold to-amber-500' : 'bg-brand-red'
                  }`} />

                  <div className="flex-1 space-y-4 p-5 sm:p-6">
                    
                    {/* Header: Category Badge & Audience Scope */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                        isAlert 
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400' 
                          : isOffer 
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300' 
                          : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                      }`}>
                        {isAlert && <AlertTriangle className="w-3 h-3" />}
                        {isOffer && <Gift className="w-3 h-3" />}
                        {isAnnouncement && <Megaphone className="w-3 h-3" />}
                        <span>{isAlert ? 'Safety Notice' : isOffer ? (item.category || 'Staff Offer') : 'Announcement'}</span>
                      </span>

                      {/* Global vs Subsidiary scope badge */}
                      <span className={`px-2.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider flex items-center gap-1 ${
                        isGlobal 
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40' 
                          : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                      }`}>
                        {isGlobal ? <Globe className="w-2.5 h-2.5" /> : <Building2 className="w-2.5 h-2.5" />}
                        <span className="truncate max-w-[130px]">
                          {isGlobal ? 'All Group' : item.subsidiary_name || user?.subsidiary_name}
                        </span>
                      </span>
                    </div>

                    {/* ── CARD CONTENT: ANNOUNCEMENT ── */}
                    {isAnnouncement && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.profile_pic || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.author_name || 'Admin')}&background=C41230&color=fff`}
                            alt={item.author_name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-white/10 shadow-sm"
                          />
                          <div className="min-w-0">
                            <h5 className="text-xs font-black text-slate-800 dark:text-white truncate">
                              {item.author_name || 'Corporate Communications'}
                            </h5>
                            <p className="text-[10px] text-slate-400 font-bold">
                              {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                        </div>

                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line line-clamp-4">
                          {item.content}
                        </p>

                        {item.image_url && (
                          <div className="rounded-2xl overflow-hidden aspect-video bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-white/5">
                            <img src={item.image_url} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          </div>
                        )}

                      </div>
                    )}

                    {/* ── CARD CONTENT: STAFF OFFER ── */}
                    {isOffer && (
                      <div className="space-y-3">
                        {item.image_url ? (
                          <div className="relative -mx-1 overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800">
                            <img
                              src={item.image_url}
                              alt={item.title}
                              className="aspect-[16/8] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                            />
                            {item.badge && (
                              <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#A87627] shadow-lg backdrop-blur">
                                {item.badge}
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex aspect-[16/6] items-center justify-center rounded-2xl bg-gradient-to-br from-amber-50 to-[#FFF6E6] text-4xl dark:from-amber-950/30 dark:to-slate-900">
                            {item.emoji || '🎁'}
                          </div>
                        )}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            {item.badge && !item.image_url && (
                              <span className="inline-block px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 text-[10px] font-black uppercase tracking-wider mb-1.5">
                                {item.badge}
                              </span>
                            )}
                            <h4 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                              {item.title}
                            </h4>
                          </div>
                          <span className="text-3xl shrink-0 p-2 bg-slate-50 dark:bg-white/5 rounded-2xl">{item.emoji || '🎁'}</span>
                        </div>

                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                          {item.description}
                        </p>

                        {item.valid_until && (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>Valid until {item.valid_until}</span>
                          </div>
                        )}

                        <div className="pt-2 flex items-center gap-2">
                          <button
                            onClick={() => handleCopyOffer(item.id, item.badge)}
                            className="flex-1 py-2.5 px-4 bg-brand-gold text-slate-900 hover:brightness-105 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                          >
                            {copiedId === item.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedId === item.id ? 'Copied Code' : (item.cta || 'Claim Perk')}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ── CARD CONTENT: ALERT ── */}
                    {isAlert && (
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                            item.color === 'amber'
                              ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600'
                              : item.color === 'emerald'
                              ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600'
                              : 'bg-sky-100 dark:bg-sky-900/40 text-sky-600'
                          }`}>
                            <AlertTriangle className="w-5 h-5 animate-pulse" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                              {item.title}
                            </h4>
                            <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                              Issued {new Date(item.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <div className={`p-4 rounded-2xl text-xs font-semibold leading-relaxed ${
                          item.color === 'amber'
                            ? 'bg-amber-50/80 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800/40'
                            : item.color === 'emerald'
                            ? 'bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/40'
                            : 'bg-sky-50/80 dark:bg-sky-950/30 text-sky-900 dark:text-sky-200 border border-sky-200 dark:border-sky-800/40'
                        }`}>
                          {item.message}
                        </div>

                        <div className="pt-2 flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                            Mandatory Notice
                          </span>
                          <button
                            onClick={() => handleAcknowledgeAlert(item.id)}
                            disabled={isAcknowledged}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                              isAcknowledged
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 cursor-default'
                                : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 cursor-pointer'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{isAcknowledged ? 'Acknowledged' : 'Acknowledge'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                  </div>

                  <div className="border-t border-slate-100 bg-[#FCFBF9] px-5 py-3 dark:border-white/5 dark:bg-white/[0.02] sm:px-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-1">
                        {[
                          { id: 'like', label: 'Like', icon: ThumbsUp },
                          { id: 'appreciate', label: 'Appreciate', icon: Heart },
                          { id: 'celebrate', label: 'Celebrate', icon: PartyPopper }
                        ].map((reaction) => {
                          const ReactionIcon = reaction.icon;
                          const selected = item.reactionSummary?.user_reaction === reaction.id;
                          const itemKey = `${item.itemType}:${item.id}`;
                          return (
                            <button
                              key={reaction.id}
                              type="button"
                              disabled={reactingKey === itemKey}
                              onClick={() => handleReaction(item, reaction.id)}
                              className={`flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[10px] font-black transition-colors sm:text-[11px] ${selected ? 'bg-[#FFF0F3] text-brand-red' : 'text-slate-500 hover:bg-white hover:text-brand-red dark:hover:bg-white/5'}`}
                            >
                              <ReactionIcon className={`h-3.5 w-3.5 ${selected && reaction.id === 'appreciate' ? 'fill-current' : ''}`} />
                              <span>{reaction.label}</span>
                            </button>
                          );
                        })}
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">
                        {item.reactionSummary?.reaction_count || 0} reactions · Ref #{item.id}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
                  </div>
                </section>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
