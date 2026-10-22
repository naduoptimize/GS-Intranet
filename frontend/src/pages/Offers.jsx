import { useState, useEffect } from 'react';
import { Gift, Search, Calendar, Sparkles, RefreshCw, Building2, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:5000/api';

export default function Offers() {
  const { user } = useAuth();
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const loadOffers = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/offers`, {
        params: { role: user?.role || 'employee', subsidiary_id: user?.subsidiary_id },
      });
      setOffers(data);
    } catch (err) {
      console.error('Failed to load offers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadOffers();
  }, [user]);

  // Extract unique categories for tab filtering
  const categories = ['All', ...new Set(offers.map(o => o.category).filter(Boolean))];

  // Filtering offers based on search and category
  const filtered = offers.filter(o => {
    const matchesSearch = 
      o.title?.toLowerCase().includes(search.toLowerCase()) ||
      o.description?.toLowerCase().includes(search.toLowerCase()) ||
      o.badge?.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = selectedCategory === 'All' || o.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] pb-20 transition-colors duration-300">
      
      {/* ── HERO BANNER ── */}
      <section className="relative h-[240px] sm:h-[290px] w-full overflow-hidden rounded-3xl shadow-lg group mb-8">
        <img
          src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=1600"
          alt="Staff Offers"
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/40 to-transparent" />
        <div className="absolute inset-0 flex items-center px-8 sm:px-12 md:px-16">
          <motion.div initial={{ opacity: 0, x: -25 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="max-w-2xl">
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 bg-brand-red/20 backdrop-blur-md border border-brand-red/30 rounded-full mb-4 animate-pulse">
              <Gift className="w-3.5 h-3.5 text-brand-red animate-bounce" />
              <span className="text-[9px] font-black text-brand-red uppercase tracking-[3px]">Corporate Rates &amp; Vouchers</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white tracking-tighter leading-none mb-3">
              Exclusive <span className="text-brand-red">Staff Offers</span>
            </h1>
            <p className="text-white/60 text-xs sm:text-sm font-semibold leading-relaxed max-w-lg hidden sm:block">
              Unlock special members-only discounts, leisure rates, tea packages, and corporate rates curated exclusively for the George Steuart family.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── FILTER BAR ── */}
      <section className="bg-white dark:bg-[#131B2E] p-5 sm:p-7 rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-5 mb-10 glass-card">
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto no-scrollbar max-w-full">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${
                selectedCategory === cat 
                  ? 'bg-slate-900 dark:bg-brand-red border-slate-900 dark:border-brand-red text-white shadow-md' 
                  : 'bg-slate-50 dark:bg-[#0B0F19]/50 border-slate-100 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:border-slate-350 dark:hover:border-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-350 dark:text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search deals, hotels, promos..."
              className="pl-11 pr-5 py-3.5 bg-slate-50/50 dark:bg-[#0B0F19]/50 border border-slate-150/40 dark:border-white/5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-4 focus:ring-brand-red/5 w-full transition-all"
            />
          </div>
          <button
            onClick={loadOffers}
            className="p-3.5 bg-slate-50/50 dark:bg-[#0B0F19]/50 border border-slate-150/40 dark:border-white/5 rounded-xl text-slate-400 hover:text-brand-red dark:text-slate-550 dark:hover:text-white transition-all flex justify-center items-center shrink-0 shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </section>

      {/* ── DEALS GRID ── */}
      <section className="px-1">
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-12 h-12 border-4 border-slate-150 border-t-brand-red rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-[#131B2E] rounded-3xl border border-dashed border-slate-200 dark:border-white/5 p-10">
            <Gift className="w-14 h-14 text-slate-300 dark:text-slate-650 mx-auto mb-3" />
            <p className="text-slate-700 dark:text-slate-305 font-black text-sm uppercase tracking-wider">No Active Offers</p>
            <p className="text-xs text-slate-450 mt-1 max-w-xs mx-auto">
              We couldn't find any offers matching your filters. Check back soon for new promotions!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((offer, idx) => {
              const gradientTheme = offer.gradient || 'from-sky-500 via-cyan-400 to-teal-500';
              return (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, type: 'spring', stiffness: 260, damping: 24 }}
                  whileHover={{ y: -6 }}
                  className="group flex flex-col bg-white dark:bg-[#131B2E] border border-slate-150/40 dark:border-white/5 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 min-h-[350px] relative before:absolute before:-left-2 before:top-[63%] before:-translate-y-1/2 before:w-4 before:h-4 before:bg-[#F8FAFC] dark:before:bg-[#0B0F19] before:rounded-full before:z-10 after:absolute after:-right-2 after:top-[63%] after:-translate-y-1/2 after:w-4 after:h-4 after:bg-[#F8FAFC] dark:after:bg-[#0B0F19] after:rounded-full after:z-10"
                >
                  {/* Banner Image */}
                  <div className="h-36 overflow-hidden relative shrink-0">
                    <div className={`absolute inset-0 bg-gradient-to-br ${gradientTheme}`} />
                    <img
                      src={offer.image_url || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=300'}
                      alt={offer.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-108 transition-transform duration-700"
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                    
                    <span className="absolute top-4 left-4 px-2.5 py-1 bg-black/40 backdrop-blur-md border border-white/20 text-white text-[8px] font-black uppercase tracking-widest rounded-full shadow-sm">
                      {offer.category}
                    </span>
                    
                    <span className="absolute top-4 right-4 bg-white text-slate-800 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                      {offer.savings}
                    </span>
                  </div>

                  {/* Voucher Info */}
                  <div className="p-5 flex flex-col flex-1 relative">
                    <div className="flex items-center gap-2 mb-2 shrink-0">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${gradientTheme} flex items-center justify-center text-lg border-2 border-white/40 shadow-md`}>
                        {offer.emoji || '🎁'}
                      </div>
                      <span className="text-[9px] font-black text-slate-400 dark:text-slate-450 uppercase tracking-widest">
                        {offer.badge}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-slate-850 dark:text-white leading-snug line-clamp-2 mb-1.5">
                      {offer.title}
                    </h3>
                    
                    <p className="text-xs text-slate-450 dark:text-slate-400 font-semibold leading-relaxed line-clamp-3 flex-1">
                      {offer.description}
                    </p>

                    {/* Tear-off dash divider */}
                    <div className="relative my-4 shrink-0">
                      <div className="border-t-2 border-dashed border-slate-150 dark:border-white/10 w-full" />
                    </div>

                    {/* Redeemable Bottom */}
                    <div className="space-y-4 shrink-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 dark:text-slate-500">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          Valid: {offer.valid_until}
                        </span>
                        
                        <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest ${
                          !offer.subsidiary_id
                            ? 'bg-sky-50 text-sky-600 border-sky-100 dark:bg-sky-950/20 dark:border-sky-900/30'
                            : 'bg-violet-50 text-violet-600 border-violet-100 dark:bg-violet-950/20 dark:border-violet-900/30'
                        }`}>
                          {!offer.subsidiary_id ? <Globe className="w-2.5 h-2.5" /> : <Building2 className="w-2.5 h-2.5" />}
                          {!offer.subsidiary_id ? 'Global' : offer.subsidiary_name || 'Subsidiary'}
                        </span>
                      </div>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => alert(`To claim this offer, please contact your subsidiary HR office with your employee number: ${user?.employee_no || 'N/A'}`)}
                        className={`w-full py-3.5 bg-gradient-to-r ${gradientTheme} text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-black/10 hover:opacity-95`}
                      >
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                        {offer.cta || 'Claim Offer'}
                      </motion.button>
                    </div>
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
