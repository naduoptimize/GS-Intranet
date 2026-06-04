import { useState, useEffect, useRef } from 'react';
import {
  Gift, Search, Plus, Trash2, Edit2, X, Check, AlertCircle,
  Building2, RefreshCw, Calendar, Sparkles, TrendingUp,
  Globe, Image as ImageIcon, Upload, Link as LinkIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:5000/api';

const GRADIENT_OPTIONS = [
  { value: 'from-sky-500 via-cyan-400 to-teal-500',          label: 'Ocean — Sky / Teal' },
  { value: 'from-violet-500 via-purple-500 to-fuchsia-500',  label: 'Royal — Violet / Fuchsia' },
  { value: 'from-amber-500 via-orange-400 to-rose-500',      label: 'Sunset — Amber / Rose' },
  { value: 'from-emerald-500 via-green-400 to-teal-500',     label: 'Nature — Emerald / Teal' },
  { value: 'from-rose-500 via-pink-500 to-red-500',          label: 'Passion — Rose / Red' },
  { value: 'from-brand-red via-brand-red-dark to-brand-red', label: 'Corporate — Brand Red' },
];

const BLANK_FORM = {
  category: '', badge: '', title: '', description: '',
  cta: 'Claim Offer', gradient: GRADIENT_OPTIONS[0].value,
  emoji: '🎁', valid_until: '', savings: '',
  image_url: '', subsidiary_id: '',
};

const inputCls = "w-full px-5 py-3.5 bg-slate-50/50 dark:bg-[#0B0F19]/60 backdrop-blur-md border border-slate-150/40 dark:border-white/5 rounded-2xl font-bold text-slate-800 dark:text-slate-100 focus:ring-4 focus:ring-brand-red/20 focus:border-brand-red/30 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm";

export default function AdminOffers() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  const fileInputRef = useRef(null);

  const [offers, setOffers]         = useState([]);
  const [subsidiaries, setSubsidiaries] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [toast, setToast]           = useState(null);
  const [uploading, setUploading]   = useState(false);
  const [urlMode, setUrlMode]       = useState(false);   // toggle between file-upload & URL paste

  // Modals
  const [formModal, setFormModal]   = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    ...BLANK_FORM,
    subsidiary_id: isSuperAdmin ? '' : (user?.subsidiary_id || ''),
  });

  // ── Data ────────────────────────────────────────────────────────────────────
  const loadData = async () => {
    setLoading(true);
    try {
      const [offersRes, subsRes] = await Promise.all([
        axios.get(`${API}/offers`, {
          params: { role: user.role, subsidiary_id: user.subsidiary_id },
        }),
        isSuperAdmin ? axios.get(`${API}/subsidiaries`) : Promise.resolve({ data: [] }),
      ]);
      let fetched = offersRes.data;
      if (!isSuperAdmin) {
        fetched = fetched.filter(o => Number(o.subsidiary_id) === Number(user.subsidiary_id));
      }
      setOffers(fetched);
      if (isSuperAdmin) setSubsidiaries(subsRes.data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load offers', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (user) loadData(); }, [user]);

  // ── Toast ───────────────────────────────────────────────────────────────────
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Modals ──────────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditingOffer(null);
    setUrlMode(false);
    setForm({ ...BLANK_FORM, subsidiary_id: isSuperAdmin ? '' : (user?.subsidiary_id || '') });
    setFormModal(true);
  };

  const openEdit = (offer) => {
    setEditingOffer(offer);
    setUrlMode(false);
    setForm({
      category:      offer.category      || '',
      badge:         offer.badge         || '',
      title:         offer.title         || '',
      description:   offer.description   || '',
      cta:           offer.cta           || 'Claim Offer',
      gradient:      offer.gradient      || GRADIENT_OPTIONS[0].value,
      emoji:         offer.emoji         || '🎁',
      valid_until:   offer.valid_until   || '',
      savings:       offer.savings       || '',
      image_url:     offer.image_url     || '',
      subsidiary_id: offer.subsidiary_id || '',
    });
    setFormModal(true);
  };

  // ── Image Upload ─────────────────────────────────────────────────────────────
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const uploadData = new FormData();
    uploadData.append('image', file);
    setUploading(true);
    showToast('Uploading image…', 'info');
    try {
      const { data } = await axios.post(`${API}/uploads/image`, uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm(prev => ({ ...prev, image_url: data.imageUrl }));
      showToast('Image uploaded ✓');
    } catch (err) {
      console.error(err);
      showToast('Image upload failed', 'error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Save ─────────────────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        subsidiary_id: isSuperAdmin ? (form.subsidiary_id || null) : user.subsidiary_id,
        image_url: form.image_url || null,
      };
      if (editingOffer) {
        await axios.put(`${API}/offers/${editingOffer.id}`, payload);
        showToast('Offer updated successfully ✓');
      } else {
        await axios.post(`${API}/offers`, payload);
        showToast('New offer published ✓');
      }
      setFormModal(false);
      loadData();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to save offer', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`${API}/offers/${deleteTarget.id}`);
      showToast('Offer deleted ✓');
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete offer', 'error');
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const getSubName = (id) => {
    if (!id) return 'Global (All Staff)';
    const sub = subsidiaries.find(s => s.id === id || s.id === parseInt(id));
    return sub ? sub.name : 'Subsidiary';
  };

  const filtered = offers.filter(o =>
    o.title?.toLowerCase().includes(search.toLowerCase()) ||
    o.category?.toLowerCase().includes(search.toLowerCase()) ||
    o.badge?.toLowerCase().includes(search.toLowerCase())
  );

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] pb-20 transition-colors duration-300">

      {/* ── TOAST ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }}
            className={`fixed top-8 right-8 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-white font-bold text-sm ${
              toast.type === 'error' ? 'bg-red-500' : toast.type === 'info' ? 'bg-sky-500' : 'bg-emerald-500'
            }`}
          >
            {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <Check className="w-5 h-5" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HERO BANNER ── */}
      <div className="px-4 sm:px-8 pt-4 sm:pt-8">
        <div className="relative h-[220px] sm:h-[300px] md:h-[350px] w-full overflow-hidden rounded-[24px] sm:rounded-[36px] shadow-xl group">
          <img
            src="/admin_premium_cover.png"
            alt="Offers Manager"
            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            onError={e => { e.target.src = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=1600'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/40 to-transparent" />
          <div className="absolute inset-0 flex items-center px-6 sm:px-10 md:px-16">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-brand-red/20 backdrop-blur-md border border-brand-red/30 rounded-full mb-2.5 sm:mb-3.5 animate-pulse">
                <div className="w-1.5 h-1.5 bg-brand-red rounded-full" />
                <span className="text-[8px] font-black text-brand-red uppercase tracking-[3px]">Staff Benefits & Deals</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-tighter leading-none mb-2">
                Offers &amp; <span className="text-brand-red">Promotions</span>
              </h1>
              <p className="text-white/60 text-xs sm:text-sm font-semibold leading-relaxed max-w-lg hidden sm:block">
                Manage exclusive employee benefits, group discounts, and partner deals. Publish globally or target specific subsidiaries.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="px-4 sm:px-8 md:px-10 -mt-10 sm:-mt-16 relative z-10">

        {/* ── STATS ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-5 mb-8">
          {(isSuperAdmin ? [
            { label: 'Total Offers',    value: offers.length,                                         icon: Gift,       color: 'text-brand-red', bgOrb: 'from-brand-red/10' },
            { label: 'Global Deals',    value: offers.filter(o => !o.subsidiary_id).length,           icon: Globe,      color: 'text-sky-500', bgOrb: 'from-sky-500/10' },
            { label: 'Entity Offers',   value: offers.filter(o => !!o.subsidiary_id).length,          icon: Building2,  color: 'text-violet-500', bgOrb: 'from-violet-500/10' },
            { label: 'With Images',     value: offers.filter(o => !!o.image_url).length,              icon: ImageIcon,  color: 'text-emerald-500', bgOrb: 'from-emerald-500/10' },
          ] : [
            { label: 'Entity Offers',   value: offers.length,                                         icon: Gift,       color: 'text-brand-red', bgOrb: 'from-brand-red/10' },
            { label: 'Claimable Deals', value: offers.filter(o => o.cta !== '').length,               icon: Sparkles,   color: 'text-violet-500', bgOrb: 'from-violet-500/10' },
            { label: 'Visual Offers',   value: offers.filter(o => !!o.image_url).length,              icon: ImageIcon,  color: 'text-emerald-500', bgOrb: 'from-emerald-500/10' },
            { label: 'My Entity',       value: user?.subsidiary_name || 'Assigned',                   icon: Building2,  color: 'text-sky-500', bgOrb: 'from-sky-500/10' },
          ]).map(s => (
            <motion.div
              key={s.label}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 350, damping: 20 }}
              className="bg-white/80 dark:bg-[#131B2E] rounded-2xl sm:rounded-[28px] border border-slate-150/40 dark:border-white/5 shadow-xl p-4 sm:p-6 flex items-center gap-4 hover:shadow-2xl transition-all duration-300 relative overflow-hidden group glass-card"
            >
              {/* Glow Orb */}
              <div className={`absolute -right-6 -bottom-6 w-20 h-20 rounded-full bg-gradient-to-br ${s.bgOrb} to-transparent blur-xl group-hover:scale-150 transition-all duration-500`} />
              
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center border bg-slate-50 dark:bg-[#0B0F19]/60 border-slate-150/40 dark:border-white/5 shrink-0 relative z-10">
                <s.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${s.color}`} />
              </div>
              <div className="relative z-10">
                <p className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white leading-none tracking-tight mb-1">{s.value}</p>
                <p className="text-[8px] sm:text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── PANEL ── */}
        <div className="bg-white/85 dark:bg-[#131B2E]/80 backdrop-blur-2xl rounded-3xl sm:rounded-[40px] border border-slate-150/40 dark:border-white/5 shadow-2xl overflow-hidden glass-card">

          {/* Panel Header */}
          <div className="px-5 sm:px-8 py-5 sm:py-6 border-b border-slate-100 dark:border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg sm:text-xl font-black text-slate-800 dark:text-white tracking-tight">Employee Benefits Catalogue</h2>
              <span className="px-3 py-1 bg-slate-50 dark:bg-[#0B0F19]/50 border border-slate-150/40 dark:border-white/5 rounded-full text-[9px] font-black text-slate-450 dark:text-slate-400 uppercase tracking-widest">
                {filtered.length} offer{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-350 dark:text-slate-500" />
                <input
                  value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search title, category, badge..."
                  className="pl-11 pr-5 py-3 bg-slate-50/50 dark:bg-[#0B0F19]/50 border border-slate-150/40 dark:border-white/5 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-4 focus:ring-brand-red/5 w-full transition-all"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <motion.button 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }}
                  onClick={loadData} 
                  className="p-3 bg-slate-50/50 dark:bg-[#0B0F19]/50 border border-slate-150/40 dark:border-white/5 rounded-xl text-slate-400 hover:text-brand-red transition-all flex justify-center items-center"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                </motion.button>
                <motion.button
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={openCreate}
                  className="flex items-center justify-center gap-2 bg-brand-red text-white px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-brand-red/90 transition-all shadow-lg shadow-brand-red/20 flex-[3] sm:flex-none"
                >
                  <Plus className="w-4 h-4" /> Add New Offer
                </motion.button>
              </div>
            </div>
          </div>

          {/* ── OFFER CARDS ── */}
          <div className="p-5 sm:p-8">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-10 h-10 border-4 border-slate-100 border-t-brand-red rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 bg-slate-50/50 dark:bg-[#0B0F19]/20 rounded-3xl border border-dashed border-slate-200 dark:border-white/5">
                <Gift className="w-12 h-12 text-slate-350 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-slate-700 dark:text-slate-300 font-black text-sm uppercase tracking-wider">No Offers Found</p>
                <p className="text-xs text-slate-450 mt-1 max-w-xs mx-auto">
                  {search ? 'No offers match your search.' : 'No offers published yet. Click "Add New Offer" to create one.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filtered.map((offer, i) => (
                  <motion.div
                    key={offer.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06, type: 'spring', stiffness: 260, damping: 24 }}
                    whileHover={{ y: -5 }}
                    className="group relative bg-white dark:bg-[#131B2E] rounded-[32px] border border-slate-150/40 dark:border-white/5 shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.14)] transition-all duration-500 flex flex-col min-h-[430px]"
                  >
                    {/* ── VISUAL HEADER ── */}
                    <div className="relative h-52 overflow-hidden shrink-0 rounded-t-[32px]">
                      <div className={`absolute inset-0 bg-gradient-to-br ${offer.gradient}`} />
                      {offer.image_url && (
                        <img
                          src={offer.image_url}
                          alt={offer.title}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-black/25" />
                      
                      <div className="absolute top-4 left-4 right-4 flex items-start justify-between z-10">
                        <span className="text-[9px] font-black text-white/90 uppercase tracking-[2px] bg-black/40 backdrop-blur-md border border-white/20 rounded-full px-3 py-1.5 shadow-sm">
                          {offer.category}
                        </span>
                        <span className="text-[9px] font-black text-slate-800 uppercase tracking-widest bg-white rounded-full px-3 py-1.5 shadow-lg">
                          {offer.savings}
                        </span>
                      </div>
                      
                      <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between z-10">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${offer.gradient} flex items-center justify-center text-xl shadow-xl border-2 border-white/40 shrink-0`}>
                            {offer.emoji}
                          </div>
                          <span className="text-[10px] font-black text-white uppercase tracking-wider bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/20">
                            {offer.badge}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                          <motion.button
                            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                            onClick={() => openEdit(offer)}
                            className="w-9 h-9 bg-white/95 backdrop-blur-sm rounded-xl flex items-center justify-center text-indigo-500 shadow-lg hover:bg-white transition-all"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                            onClick={() => setDeleteTarget(offer)}
                            className="w-9 h-9 bg-white/95 backdrop-blur-sm rounded-xl flex items-center justify-center text-rose-500 shadow-lg hover:bg-white transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </motion.button>
                        </div>
                      </div>
                    </div>

                    {/* ── CARD BODY ── */}
                    <div className="p-6 flex flex-col flex-1 relative">
                      <h3 className="font-black text-slate-800 dark:text-white text-[17px] leading-snug tracking-tight mb-2 line-clamp-2">
                        {offer.title}
                      </h3>
                      <p className="text-sm text-slate-450 dark:text-slate-400 font-semibold leading-relaxed line-clamp-3 flex-1">
                        {offer.description}
                      </p>

                      {/* ── TEAR-OFF VOUCHER NOTCH DIVIDER ── */}
                      <div className="relative my-4">
                        <div className="border-t-2 border-dashed border-slate-150 dark:border-white/10 w-full" />
                        {/* Left Notch cut-out */}
                        <div className="absolute -left-[37px] top-1/2 -translate-y-1/2 w-[22px] h-[22px] rounded-full bg-[#F8FAFC] dark:bg-[#0B0F19] border-r border-slate-150/40 dark:border-white/5 z-10" />
                        {/* Right Notch cut-out */}
                        <div className="absolute -right-[37px] top-1/2 -translate-y-1/2 w-[22px] h-[22px] rounded-full bg-[#F8FAFC] dark:bg-[#0B0F19] border-l border-slate-150/40 dark:border-white/5 z-10" />
                      </div>

                      {/* ── REDEEMABLE STUB ── */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500">
                            <Calendar className="w-3 h-3 shrink-0" />
                            {offer.valid_until}
                          </span>
                          {isSuperAdmin && (
                            <span className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${
                              !offer.subsidiary_id
                                ? 'bg-sky-50 text-sky-600 border-sky-100 dark:bg-sky-950/20 dark:border-sky-900/30'
                                : 'bg-violet-50 text-violet-600 border-violet-100 dark:bg-violet-950/20 dark:border-violet-900/30'
                            }`}>
                              <Building2 className="w-2.5 h-2.5" />
                              {getSubName(offer.subsidiary_id)}
                            </span>
                          )}
                        </div>
                        
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => openEdit(offer)}
                          className={`w-full py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-white flex items-center justify-center gap-2 bg-gradient-to-r ${offer.gradient} shadow-md hover:opacity-95 hover:shadow-lg transition-all`}
                        >
                          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                          {offer.cta}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── CREATE / EDIT MODAL ── */}
      <AnimatePresence>
        {formModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setFormModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="relative w-full max-w-2xl bg-white/95 dark:bg-[#131B2E]/95 backdrop-blur-2xl rounded-[32px] sm:rounded-[40px] shadow-2xl overflow-hidden border border-slate-150/40 dark:border-white/10 max-h-[92vh] flex flex-col glass-card"
            >
              {/* Modal Header */}
              <div className="p-7 border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-2xl font-black text-slate-850 dark:text-white tracking-tight">
                    {editingOffer ? 'Edit Offer' : 'Create New Offer'}
                  </h3>
                  <p className="text-slate-450 dark:text-slate-400 text-sm font-semibold mt-1">
                    {editingOffer ? 'Update this employee benefit.' : 'Publish an exclusive deal or promotion.'}
                  </p>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={() => setFormModal(false)} 
                  className="p-3 bg-slate-50 dark:bg-[#0B0F19]/50 rounded-2xl text-slate-400 hover:text-slate-800 dark:hover:text-slate-205 transition-all border border-slate-150/40 dark:border-white/5"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Form */}
              <form onSubmit={handleSave} className="p-7 space-y-5 overflow-y-auto flex-1 custom-scrollbar">

                {/* ── IMAGE SECTION ── */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                    Offer Banner Image <span className="text-slate-300 font-bold normal-case tracking-normal">(optional)</span>
                  </label>

                  {form.image_url ? (
                    /* Image Preview */
                    <div className="relative h-48 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5 shadow-sm group">
                      <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <label className="cursor-pointer bg-white text-slate-800 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-100 transition-colors shadow-lg">
                          Change Image
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" ref={fileInputRef} />
                        </label>
                        <button type="button" onClick={() => setForm(f => ({ ...f, image_url: '' }))}
                          className="bg-red-650 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-lg">
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Upload / URL Toggle */
                    <div className="space-y-3">
                      {/* Mode Toggle */}
                      <div className="flex bg-slate-50 dark:bg-[#0B0F19]/50 border border-slate-150/40 dark:border-white/5 rounded-2xl p-1">
                        <button
                          type="button"
                          onClick={() => setUrlMode(false)}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                            !urlMode ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-450 hover:text-slate-655 dark:hover:text-slate-300'
                          }`}
                        >
                          <Upload className="w-3.5 h-3.5" /> Upload File
                        </button>
                        <button
                          type="button"
                          onClick={() => setUrlMode(true)}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                            urlMode ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-450 hover:text-slate-655 dark:hover:text-slate-300'
                          }`}
                        >
                          <LinkIcon className="w-3.5 h-3.5" /> Paste URL
                        </button>
                      </div>

                      {!urlMode ? (
                        /* File Drop Zone */
                        <label className={`cursor-pointer border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center group min-h-[140px] transition-all ${
                          uploading
                            ? 'border-sky-305 bg-sky-50 dark:bg-sky-950/10'
                            : 'border-slate-200 dark:border-white/10 hover:border-brand-red/50 hover:bg-red-50/5 dark:hover:border-brand-red/40'
                        }`}>
                          {uploading ? (
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-8 h-8 border-2 border-sky-300 border-t-sky-600 rounded-full animate-spin" />
                              <span className="text-xs font-black text-sky-600 uppercase tracking-widest">Uploading…</span>
                            </div>
                          ) : (
                            <>
                              <ImageIcon className="w-9 h-9 text-slate-300 dark:text-slate-600 group-hover:text-brand-red group-hover:scale-110 transition-all mb-2" />
                              <span className="text-xs font-black text-slate-700 dark:text-slate-205">Click to upload banner image</span>
                              <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">PNG, JPG, WEBP · max 5 MB</span>
                            </>
                          )}
                          <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" ref={fileInputRef} disabled={uploading} />
                        </label>
                      ) : (
                        /* URL Input */
                        <div className="space-y-2">
                          <div className="flex gap-3">
                            <input
                              type="url"
                              value={form.image_url}
                              onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                              placeholder="https://example.com/offer-banner.jpg"
                              className={inputCls + ' flex-1'}
                            />
                            {form.image_url && (
                              <button type="button" onClick={() => setForm(f => ({ ...f, image_url: '' }))}
                                className="p-3 bg-slate-50 dark:bg-[#0B0F19]/50 border border-slate-150/40 dark:border-white/5 rounded-2xl text-slate-400 hover:text-rose-500 transition-all">
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          {form.image_url && (
                            <div className="h-32 rounded-xl overflow-hidden border border-slate-150/40 dark:border-white/5">
                              <img src={form.image_url} alt="URL preview" className="w-full h-full object-cover"
                                onError={e => { e.target.style.display = 'none'; }}
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ── GRADIENT THEME + EMOJI ── */}
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Colour Theme</label>
                    <select value={form.gradient} onChange={e => setForm(f => ({ ...f, gradient: e.target.value }))} className={inputCls + ' appearance-none cursor-pointer'}>
                      {GRADIENT_OPTIONS.map(g => <option key={g.value} value={g.value} className="bg-white dark:bg-[#131B2E] text-slate-805 dark:text-white">{g.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Emoji Icon *</label>
                    <input required type="text" value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} placeholder="e.g. 🌴" className={inputCls} />
                  </div>
                </div>

                {/* ── TITLE + CATEGORY ── */}
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Offer Title *</label>
                    <input required type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Citrus Hotel Stay" className={inputCls} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Category *</label>
                    <input required type="text" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. Leisure" className={inputCls} />
                  </div>
                </div>

                {/* ── BADGE + SAVINGS ── */}
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Badge Text *</label>
                    <input required type="text" value={form.badge} onChange={e => setForm(f => ({ ...f, badge: e.target.value }))} placeholder="e.g. 🏨 Exclusive" className={inputCls} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Savings *</label>
                    <input required type="text" value={form.savings} onChange={e => setForm(f => ({ ...f, savings: e.target.value }))} placeholder="e.g. 30% OFF" className={inputCls} />
                  </div>
                </div>

                {/* ── VALID UNTIL + CTA ── */}
                <div className="grid grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Valid Until *</label>
                    <input required type="text" value={form.valid_until} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))} placeholder="e.g. Dec 31, 2026" className={inputCls} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Call to Action *</label>
                    <input required type="text" value={form.cta} onChange={e => setForm(f => ({ ...f, cta: e.target.value }))} placeholder="e.g. Book Now" className={inputCls} />
                  </div>
                </div>

                {/* ── DESCRIPTION ── */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Description *</label>
                  <textarea required rows="3" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Full details about the offer, eligibility, and how to claim."
                    className={inputCls + ' resize-none'} />
                </div>

                {/* ── LIVE PREVIEW ── */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Card Preview</label>
                  <div className={`relative h-20 rounded-2xl overflow-hidden bg-gradient-to-br ${form.gradient} flex items-center gap-4 px-4 shadow-inner`}>
                    {form.image_url && <img src={form.image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />}
                    <span className="text-3xl relative z-10">{form.emoji || '🎁'}</span>
                    <div className="relative z-10 flex-1 min-w-0">
                      <p className="text-[9px] font-black text-white/70 uppercase tracking-[2px] truncate">{form.category || 'Category'}</p>
                      <p className="text-sm font-black text-white truncate leading-snug">{form.title || 'Offer Title'}</p>
                    </div>
                    <span className="relative z-10 bg-white/20 border border-white/30 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full shrink-0">
                      {form.savings || 'SAVINGS'}
                    </span>
                  </div>
                </div>

                {/* ── SUBSIDIARY (super admin only) ── */}
                {isSuperAdmin && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Target Audience</label>
                    <select value={form.subsidiary_id} onChange={e => setForm(f => ({ ...f, subsidiary_id: e.target.value }))} className={inputCls + ' appearance-none cursor-pointer'}>
                      <option value="" className="bg-white dark:bg-[#131B2E] text-slate-805 dark:text-white">Global (Visible to all staff)</option>
                      {subsidiaries.map(sub => <option key={sub.id} value={sub.id} className="bg-white dark:bg-[#131B2E] text-slate-805 dark:text-white">{sub.name}</option>)}
                    </select>
                  </div>
                )}

                {/* ── BUTTONS ── */}
                <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-white/5">
                  <button type="button" onClick={() => setFormModal(false)}
                    className="flex-1 py-4 bg-slate-50 dark:bg-[#0B0F19]/50 text-slate-400 dark:text-slate-450 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-xs border border-slate-150/40 dark:border-white/5">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting || uploading}
                    className="flex-[2] py-4 bg-brand-red text-white rounded-2xl font-black uppercase tracking-widest hover:bg-brand-red/90 transition-all shadow-xl shadow-brand-red/20 disabled:opacity-60 flex items-center justify-center gap-2 text-xs">
                    {submitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <><Gift className="w-4 h-4" /> {editingOffer ? 'Save Changes' : 'Publish Offer'}</>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── CONFIRM DELETE ── */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteTarget(null)}
              className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white/95 dark:bg-[#131B2E]/95 backdrop-blur-2xl rounded-[32px] border border-slate-150/40 dark:border-white/10 shadow-2xl p-10 max-w-sm w-full text-center glass-card">
              {deleteTarget.image_url && (
                <div className="h-24 rounded-2xl overflow-hidden mb-6 border border-slate-100 dark:border-white/5">
                  <img src={deleteTarget.image_url} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-100 dark:border-red-900/30 ${deleteTarget.image_url ? '' : 'bg-red-50 dark:bg-red-950/10'}`}>
                <Trash2 className="w-7 h-7 text-brand-red" />
              </div>
              <h3 className="text-xl font-black text-slate-805 dark:text-white mb-1">Delete This Offer?</h3>
              <p className="text-slate-400 text-sm font-semibold mb-2">
                <span className="font-black text-slate-700 dark:text-slate-300">"{deleteTarget.title}"</span>
              </p>
              <p className="text-slate-450 dark:text-slate-400 text-sm font-semibold mb-8">
                This offer will be permanently removed from the employee benefits portal.
              </p>
              <div className="flex gap-4">
                <button onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-4 bg-slate-50 dark:bg-[#0B0F19]/50 text-slate-400 dark:text-slate-450 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 transition-all text-xs border border-slate-150/40 dark:border-white/5">
                  Cancel
                </button>
                <button onClick={handleDelete}
                  className="flex-1 py-4 bg-brand-red text-white rounded-2xl font-black uppercase tracking-widest hover:bg-brand-red/90 transition-all shadow-xl shadow-brand-red/20 text-xs">
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
