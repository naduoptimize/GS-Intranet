import { useState, useEffect } from 'react';
import {
  Camera, Plus, Edit2, Trash2, Search,
  X, Check, AlertCircle, RefreshCw,
  Heart, User, Image as ImageIcon, LayoutGrid, List,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:5000/api';
const EMPTY = { title: '', description: '', image_url: '', subsidiary_id: 'null' };
const inputCls = "w-full px-5 py-3.5 bg-slate-50/50 dark:bg-[#0B0F19]/60 backdrop-blur-md border border-slate-150/40 dark:border-white/5 rounded-2xl font-bold text-slate-800 dark:text-slate-100 focus:ring-4 focus:ring-brand-red/20 focus:border-brand-red/30 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm";

export default function AdminMemories() {
  const { user } = useAuth();

  const [memories, setMemories]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filterVisibility, setFilterVisibility] = useState('all'); // 'all' | 'global' | 'subsidiary'
  const [view, setView]             = useState('grid');   // 'grid' | 'list'
  const [modal, setModal]           = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(EMPTY);
  const [deleteId, setDeleteId]     = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]           = useState(null);

  // Reaction Inspection States
  const [likersModalMemory, setLikersModalMemory] = useState(null);
  const [likers, setLikers] = useState([]);
  const [loadingLikers, setLoadingLikers] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMemories();
    }
  }, [user]);

  async function fetchMemories() {
    setLoading(true);
    try {
      const url = `${API_BASE}/memories?subsidiaryId=${user.subsidiary_id}&role=${user.role}`;
      const { data } = await axios.get(url);
      let fetched = data;
      if (user.role !== 'super_admin') {
        fetched = fetched.filter(m => Number(m.subsidiary_id) === Number(user.subsidiary_id));
      }
      setMemories(fetched);
    } catch { showToast('Failed to load memories', 'error'); }
    finally { setLoading(false); }
  }

  async function fetchLikers(memory) {
    setLikersModalMemory(memory);
    setLoadingLikers(true);
    try {
      const response = await axios.get(`${API_BASE}/memories/${memory.id}/likers`);
      setLikers(response.data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load reactions', 'error');
    } finally {
      setLoadingLikers(false);
    }
  }

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  }

  function openAdd() {
    setEditing(null);
    setForm({
      ...EMPTY,
      subsidiary_id: user?.role === 'super_admin' ? 'null' : user?.subsidiary_id
    });
    setModal(true);
  }

  function openEdit(m) {
    setEditing(m);
    setForm({
      title: m.title,
      description: m.description,
      image_url: m.image_url,
      subsidiary_id: m.subsidiary_id || 'null'
    });
    setModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        author_id: user.id,
        subsidiary_id: user.role !== 'super_admin' ? user.subsidiary_id : (form.subsidiary_id === 'null' ? null : form.subsidiary_id)
      };
      if (editing) {
        await axios.put(`${API_BASE}/memories/${editing.id}`, payload);
        showToast('Memory updated ✓');
      } else {
        await axios.post(`${API_BASE}/memories`, payload);
        showToast('Memory posted ✓');
      }
      setModal(false);
      fetchMemories();
    } catch { showToast('Failed to save memory', 'error'); }
    finally { setSubmitting(false); }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      await axios.delete(`${API_BASE}/memories/${deleteId}`);
      showToast('Memory removed');
      setDeleteId(null);
      fetchMemories();
    } catch { showToast('Delete failed', 'error'); }
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('image', file);

    try {
      showToast('Uploading photo...', 'info');
      const response = await axios.post('http://localhost:5000/api/uploads/image', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setForm(prev => ({
        ...prev,
        image_url: response.data.imageUrl
      }));
      showToast('Photo uploaded successfully ✓');
    } catch (err) {
      console.error(err);
      showToast('Failed to upload image', 'error');
    }
  }

  const filtered = memories.filter(m => {
    const matchSearch = m.title.toLowerCase().includes(search.toLowerCase()) ||
                        m.description?.toLowerCase().includes(search.toLowerCase());
    const matchVisibility = filterVisibility === 'all' ||
                            (filterVisibility === 'global' && !m.subsidiary_id) ||
                            (filterVisibility === 'subsidiary' && m.subsidiary_id);
    return matchSearch && matchVisibility;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] pb-20 transition-colors duration-300">

      {/* ── TOAST ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }}
            className={`fixed top-8 right-8 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-white font-bold text-sm ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}
          >
            {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <Check className="w-5 h-5" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO BANNER */}
      <div className="px-4 sm:px-8 pt-4 sm:pt-8">
        <div className="relative h-[220px] sm:h-[300px] md:h-[350px] w-full overflow-hidden rounded-[24px] sm:rounded-[36px] shadow-xl group">
          <img 
            src="/admin_memories_cover.png" 
            alt="Memories" 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            onError={e => { e.target.src = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1600'; }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/50 to-transparent"/>
          <div className="absolute inset-0 flex items-center px-6 sm:px-10 md:px-16">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-rose-500/20 backdrop-blur-md border border-rose-500/30 rounded-full mb-2.5 sm:mb-3.5 animate-pulse">
                <div className="w-1.5 h-1.5 bg-rose-450 rounded-full"/>
                <span className="text-[8px] font-black text-rose-400 uppercase tracking-[3px]">Moments Control</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-tighter leading-none mb-2">
                Memory Wall &amp; <span className="text-brand-red">Moments Manager</span>
              </h1>
              <p className="text-white/60 text-xs sm:text-sm font-semibold leading-relaxed max-w-lg hidden sm:block">
                Curate, approve, and manage the official George Steuart corporate photo wall and captured community stories.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-8 md:px-10 -mt-10 sm:-mt-16 relative z-10">

        {/* Title Action Bar */}
        <div className="bg-white/80 dark:bg-[#131B2E]/80 backdrop-blur-2xl p-5 sm:p-7 rounded-3xl border border-slate-150/40 dark:border-white/5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 glass-card">
          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Active Memories</h2>
            <p className="text-slate-450 dark:text-slate-400 text-xs font-semibold mt-0.5">Curate corporate timeline highlights & moments captured.</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <motion.button 
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={fetchMemories} 
              className="p-3 bg-slate-50/50 dark:bg-[#0B0F19]/50 border border-slate-150/40 dark:border-white/5 rounded-xl text-slate-400 hover:text-brand-red transition-all flex-1 sm:flex-none flex justify-center items-center shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </motion.button>
            
            {/* View toggles */}
            <div className="flex items-center bg-slate-50/50 dark:bg-[#0B0F19]/50 border border-slate-150/40 dark:border-white/5 rounded-xl p-1 shadow-sm shrink-0">
              <button onClick={() => setView('grid')} className={`p-2 rounded-lg transition-all ${view === 'grid' ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-655 dark:hover:text-slate-205'}`}>
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setView('list')} className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-slate-800 dark:bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-655 dark:hover:text-slate-205'}`}>
                <List className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <motion.button 
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openAdd}
              className="bg-brand-red text-white px-7 py-3.5 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2.5 shadow-lg shadow-brand-red/20 hover:bg-brand-red/90 transition-all flex-[3] sm:flex-none"
            >
              <Plus className="w-4 h-4" /> Add Memory
            </motion.button>
          </div>
        </div>

      {/* ── SEARCH BAR ── */}
      <div className="mb-8 bg-white/80 dark:bg-[#131B2E]/80 backdrop-blur-2xl border border-slate-150/40 dark:border-white/5 rounded-2xl shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center px-6 py-4 gap-4 glass-card">
        <div className="flex items-center gap-4 flex-1">
          <Search className="w-5 h-5 text-slate-350 dark:text-slate-500 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search memories by title or description..."
            className="flex-1 bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 placeholder:text-slate-350 outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-slate-300 hover:text-slate-600 dark:text-slate-600 dark:hover:text-slate-300 transition-all">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-4 shrink-0">
          {user?.role === 'super_admin' && (
            <select 
              value={filterVisibility}
              onChange={(e) => setFilterVisibility(e.target.value)}
              className="px-5 py-2.5 bg-slate-50/50 dark:bg-[#0B0F19]/50 border border-slate-150/40 dark:border-white/5 rounded-xl outline-none font-bold text-slate-700 dark:text-slate-200 text-sm cursor-pointer appearance-none pr-8 relative"
            >
              <option value="all" className="bg-white dark:bg-[#131B2E] text-slate-805 dark:text-white">All Visibilities</option>
              <option value="global" className="bg-white dark:bg-[#131B2E] text-slate-805 dark:text-white">🌐 All Staff (Global)</option>
              <option value="subsidiary" className="bg-white dark:bg-[#131B2E] text-slate-805 dark:text-white">🏢 My Subsidiary</option>
            </select>
          )}
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest shrink-0">{filtered.length} results</span>
        </div>
      </div>

      {/* ── STATS BAR ── */}
      <div className="grid grid-cols-3 gap-5 mb-8">
        {[
          { label: 'Total Memories', value: memories.length, color: 'text-slate-800 dark:text-white', orb: 'from-slate-500/10' },
          { label: 'Total Likes', value: memories.reduce((s, m) => s + (m.likes_count || 0), 0), color: 'text-brand-red', orb: 'from-brand-red/10' },
          { label: 'This Month', value: memories.filter(m => new Date(m.created_at).getMonth() === new Date().getMonth()).length, color: 'text-emerald-500', orb: 'from-emerald-500/10' },
        ].map(s => (
          <motion.div 
            key={s.label} 
            whileHover={{ y: -4, scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 350, damping: 20 }}
            className="bg-white/80 dark:bg-[#131B2E] border border-slate-155/40 dark:border-white/5 rounded-[28px] p-6 shadow-sm relative overflow-hidden group glass-card"
          >
            {/* Glow orb */}
            <div className={`absolute -right-6 -bottom-6 w-20 h-20 rounded-full bg-gradient-to-br ${s.orb} to-transparent blur-xl group-hover:scale-150 transition-all duration-500`} />
            
            <p className={`text-4xl font-black tracking-tight relative z-10 ${s.color}`}>{s.value}</p>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1 relative z-10">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── GRID VIEW ── */}
      {view === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-white dark:bg-[#131B2E] rounded-[32px] overflow-hidden animate-pulse border border-slate-150/40 dark:border-white/5">
                    <div className="aspect-[4/5] bg-slate-105 dark:bg-slate-800" />
                    <div className="p-5 space-y-2">
                      <div className="h-4 bg-slate-105 dark:bg-slate-800 rounded-xl w-3/4" />
                      <div className="h-3 bg-slate-105 dark:bg-slate-800 rounded-xl w-1/2" />
                    </div>
                  </div>
                ))
              : filtered.map((m, i) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.04 }}
                  whileHover={{ y: -6 }}
                  className="group relative bg-white dark:bg-[#131B2E] rounded-[32px] overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.12)] transition-all duration-500 border border-slate-150/40 dark:border-white/5 flex flex-col glass-card"
                >
                  {/* Image */}
                  <div className="relative aspect-[4/5] overflow-hidden bg-slate-100 dark:bg-slate-900 rounded-t-[32px]">
                    <img
                      src={m.image_url}
                      alt={m.title}
                      className="w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-105"
                      onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(m.title)}&background=f1f5f9&color=94a3b8&size=400`; }}
                    />
                    
                    {/* Admin action overlay */}
                    {(user?.role === 'super_admin' || m.subsidiary_id === user?.subsidiary_id) && (
                      <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 z-20">
                        <motion.button
                          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => openEdit(m)}
                          className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-500 shadow-xl hover:scale-110 transition-all cursor-pointer"
                        >
                          <Edit2 className="w-5 h-5" />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => setDeleteId(m.id)}
                          className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-brand-red shadow-xl hover:scale-110 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-5 h-5" />
                        </motion.button>
                      </div>
                    )}
                    
                    {/* Likes badge */}
                    <motion.button
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={(e) => { e.stopPropagation(); fetchLikers(m); }}
                      className="absolute top-4 right-4 flex items-center gap-1.5 bg-white/95 dark:bg-[#131B2E]/95 backdrop-blur-sm px-3.5 py-1.5 rounded-full shadow-md cursor-pointer z-10 border border-transparent dark:border-white/10"
                      title="View who reacted"
                    >
                      <Heart className="w-3.5 h-3.5 text-brand-red fill-brand-red animate-pulse" />
                      <span className="text-[10px] font-black text-slate-800 dark:text-white">{m.likes_count || 0}</span>
                    </motion.button>
                  </div>

                  {/* Info */}
                  <div className="p-5 flex flex-col flex-1 relative">
                    <p className="font-black text-slate-800 dark:text-white text-sm truncate tracking-tight">{m.title}</p>
                    <p className="text-xs text-slate-450 dark:text-slate-400 font-semibold mt-1 line-clamp-2 leading-relaxed flex-1">{m.description}</p>
                    
                    <div className="flex items-center gap-2.5 mt-4 pt-4 border-t border-slate-50 dark:border-white/5">
                      <div className="w-7 h-7 bg-slate-100 dark:bg-[#0B0F19] rounded-full flex items-center justify-center shrink-0 border border-slate-150/40 dark:border-white/5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-black text-slate-700 dark:text-slate-300 truncate">{m.author_name || 'Admin'}</p>
                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-505">{new Date(m.created_at).toLocaleDateString()}</p>
                      </div>
                      
                      {m.subsidiary_id ? (
                        <span className="px-2 py-0.5 rounded-full bg-violet-50 text-violet-650 dark:bg-violet-950/20 dark:text-violet-400 border border-violet-100/50 dark:border-violet-900/30 text-[8px] font-black uppercase tracking-widest">
                          Entity
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-650 dark:bg-sky-950/20 dark:text-sky-400 border border-sky-100/50 dark:border-sky-900/30 text-[8px] font-black uppercase tracking-widest">
                          Global
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            }
          </AnimatePresence>
          {!loading && filtered.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-24 text-slate-350 dark:text-slate-600">
              <Camera className="w-16 h-16 mb-4 animate-bounce" />
              <p className="text-sm font-black uppercase tracking-widest">No memories found</p>
            </div>
          )}
        </div>
      )}

      {/* ── LIST VIEW ── */}
      {view === 'list' && (
        <div className="bg-white/80 dark:bg-[#131B2E]/80 backdrop-blur-2xl rounded-[32px] sm:rounded-[40px] border border-slate-150/40 dark:border-white/5 shadow-2xl overflow-hidden glass-card">
          <div className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-0 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#0B0F19]/50 px-8 py-4">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest w-20">Photo</span>
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Memory</span>
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mr-10">Likes</span>
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Actions</span>
          </div>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-0 px-8 py-5 border-b border-slate-100 dark:border-white/5 animate-pulse">
                  <div className="w-16 h-16 rounded-xl bg-slate-105 dark:bg-slate-800 mr-6" />
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-105 dark:bg-slate-800 rounded-xl w-48" />
                    <div className="h-3 bg-slate-105 dark:bg-slate-800 rounded-xl w-72" />
                  </div>
                  <div className="h-6 w-12 bg-slate-105 dark:bg-slate-800 rounded-xl mr-10" />
                  <div className="flex gap-2">
                    <div className="w-10 h-10 bg-slate-105 dark:bg-slate-800 rounded-xl" />
                    <div className="w-10 h-10 bg-slate-105 dark:bg-slate-800 rounded-xl" />
                  </div>
                </div>
              ))
            : filtered.map(m => (
                <div key={m.id} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-0 px-8 py-5 border-b border-slate-100 dark:border-white/5 hover:bg-slate-55/40 dark:hover:bg-[#0B0F19]/40 transition-colors group">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 shrink-0 mr-6 border border-slate-150/40 dark:border-white/5">
                    <img
                      src={m.image_url}
                      alt={m.title}
                      className="w-full h-full object-cover"
                      onError={e => { e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(m.title)}&background=f1f5f9&color=94a3b8`; }}
                    />
                  </div>
                  <div className="min-w-0 pr-8">
                    <p className="font-black text-slate-800 dark:text-white text-sm truncate group-hover:text-brand-red transition-colors">{m.title}</p>
                    <p className="text-xs text-slate-450 dark:text-slate-450 font-semibold mt-0.5 truncate">{m.description}</p>
                    <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold mt-1 uppercase tracking-widest">
                      {m.author_name || 'Admin'} · {new Date(m.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={() => fetchLikers(m)}
                    className="flex items-center gap-1.5 mr-10 px-3 py-1.5 rounded-full hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-all cursor-pointer border border-transparent hover:border-slate-200/50 dark:hover:border-white/5"
                    title="View who reacted"
                  >
                    <Heart className="w-4 h-4 text-brand-red fill-brand-red" />
                    <span className="text-sm font-black text-slate-700 dark:text-slate-300">{m.likes_count || 0}</span>
                  </motion.button>
                  {(user?.role === 'super_admin' || m.subsidiary_id === user?.subsidiary_id) ? (
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <motion.button
                        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                        onClick={() => openEdit(m)}
                        className="p-2.5 bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-white/5 rounded-xl text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 hover:border-indigo-100 transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}
                        onClick={() => setDeleteId(m.id)}
                        className="p-2.5 bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-white/5 rounded-xl text-slate-400 hover:text-brand-red hover:border-red-100 transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  ) : <div className="w-20" />}
                </div>
              ))
          }
          {!loading && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-slate-350 dark:text-slate-600">
              <Camera className="w-12 h-12 mb-3" />
              <p className="text-xs font-black uppercase tracking-widest">No memories found</p>
            </div>
          )}
        </div>
      )}

      {/* ── ADD / EDIT MODAL ── */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-[100] overflow-y-auto flex items-start justify-center p-4 sm:p-6 md:p-10">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setModal(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="relative my-4 sm:my-8 w-full max-w-2xl bg-white/95 dark:bg-[#131B2E]/95 backdrop-blur-2xl rounded-[32px] sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col border border-slate-150/40 dark:border-white/10 glass-card"
            >
              <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
                {/* Header */}
                <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-white/5 shrink-0 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                      {editing ? 'Edit Memory' : 'Capture a Memory'}
                    </h3>
                    <p className="text-slate-450 dark:text-slate-400 text-xs sm:text-sm font-semibold mt-0.5">
                      {editing ? 'Update the details of this memory.' : 'Share an official moment with the GS family.'}
                    </p>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    type="button" 
                    onClick={() => setModal(false)} 
                    className="p-2.5 sm:p-3 bg-slate-50 dark:bg-[#0B0F19]/50 border border-slate-150/40 dark:border-white/5 rounded-2xl text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </motion.button>
                </div>

                {/* Form content */}
                <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Memory Title</label>
                      <input
                        required
                        value={form.title}
                        onChange={e => setForm({ ...form, title: e.target.value })}
                        placeholder="e.g. Annual Cricket Day 2026"
                        className={inputCls}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Visibility</label>
                      <div className="w-full px-5 py-3.5 bg-slate-50/50 dark:bg-[#0B0F19]/60 backdrop-blur-md border border-slate-150/40 dark:border-white/5 rounded-2xl flex items-center justify-between font-bold text-slate-800 dark:text-white transition-all h-[54px]">
                        {user?.role === 'super_admin' ? (
                          <select 
                            value={form.subsidiary_id}
                            onChange={(e) => setForm({...form, subsidiary_id: e.target.value})}
                            className="w-full bg-transparent border-none outline-none font-bold text-slate-800 dark:text-slate-200 cursor-pointer appearance-none"
                          >
                            <option value="null" className="bg-white dark:bg-[#131B2E] text-slate-805 dark:text-white">🌐 Global</option>
                            <option value={user.subsidiary_id} className="bg-white dark:bg-[#131B2E] text-slate-805 dark:text-white">🏢 My Entity</option>
                          </select>
                        ) : (
                          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs truncate">
                            <Building2 className="w-4 h-4 shrink-0 animate-pulse" /> Entity Staff
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Memory Photo</label>
                    
                    {form.image_url ? (
                      <div className="relative h-44 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/5 shadow-sm group">
                        <img src={form.image_url} className="w-full h-full object-cover" alt="Preview" />
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <label className="cursor-pointer bg-white text-slate-800 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-100 transition-colors shadow-lg">
                            Change Image
                            <input 
                              type="file" 
                              accept="image/*" 
                              onChange={handleImageUpload} 
                              className="hidden" 
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setForm({ ...form, image_url: '' })}
                            className="bg-red-650 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-lg"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Drag and Drop Upload Box */}
                        <label className="cursor-pointer border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-brand-red/50 hover:bg-red-50/5 dark:hover:border-brand-red/40 rounded-2xl p-6 transition-all flex flex-col items-center justify-center text-center group min-h-[140px]">
                          <ImageIcon className="w-8 h-8 text-slate-350 dark:text-slate-600 group-hover:text-brand-red group-hover:scale-110 transition-all mb-2" />
                          <span className="text-xs font-black text-slate-700 dark:text-slate-205">Upload Image File</span>
                          <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">PNG, JPG up to 5MB</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleImageUpload} 
                            className="hidden" 
                          />
                        </label>

                        {/* Paste URL Option Box */}
                        <div className="border-2 border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#0B0F19]/50 rounded-2xl p-6 flex flex-col justify-center space-y-3 min-h-[140px] transition-all">
                          <div className="flex flex-col items-center justify-center text-center space-y-1">
                            <span className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest">Or Use Image URL</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Link direct image address</span>
                          </div>
                          <input 
                            value={form.image_url}
                            onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                            className="w-full px-4 py-3 bg-white dark:bg-[#0B0F19]/50 border border-slate-200 dark:border-white/5 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-250 focus:ring-4 focus:ring-brand-red/5 outline-none transition-all text-center shadow-sm placeholder:text-slate-350"
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Description</label>
                    <textarea
                      required
                      rows={4}
                      value={form.description}
                      onChange={e => setForm({ ...form, description: e.target.value })}
                      placeholder="Share the story behind this moment..."
                      className={inputCls + ' resize-none'}
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 sm:p-8 border-t border-slate-100 dark:border-white/5 shrink-0 flex gap-4 bg-slate-50/50 dark:bg-[#0B0F19]/50 rounded-b-[32px] sm:rounded-b-[40px]">
                  <button type="button" onClick={() => setModal(false)} className="flex-1 py-4 bg-slate-105 dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-2xl font-black uppercase tracking-widest transition-all text-xs border border-slate-150/40 dark:border-white/5">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-[2] py-4 bg-brand-red text-white rounded-2xl font-black uppercase tracking-widest hover:bg-brand-red/90 transition-all shadow-xl shadow-brand-red/20 disabled:opacity-60 flex items-center justify-center gap-3 text-xs"
                  >
                    {submitting
                      ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : <><Camera className="w-5 h-5" /> {editing ? 'Update Memory' : 'Post to Wall'}</>
                    }
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── DELETE CONFIRM ── */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeleteId(null)}
              className="absolute inset-0 bg-slate-900/70 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white/95 dark:bg-[#131B2E]/95 backdrop-blur-2xl rounded-[32px] border border-slate-150/40 dark:border-white/10 shadow-2xl p-10 max-w-sm w-full text-center glass-card"
            >
              <div className="w-16 h-16 bg-red-50 dark:bg-red-950/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-100 dark:border-red-900/30">
                <Trash2 className="w-7 h-7 text-brand-red" />
              </div>
              <h3 className="text-xl font-black text-slate-805 dark:text-white tracking-tight mb-2">Remove Memory?</h3>
              <p className="text-slate-450 dark:text-slate-400 text-sm font-semibold mb-8">
                This will permanently delete the memory from the wall. This cannot be undone.
              </p>
              <div className="flex gap-4">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-4 bg-slate-50 dark:bg-[#0B0F19]/50 text-slate-400 dark:text-slate-450 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-100 transition-all text-xs border border-slate-150/40 dark:border-white/5">
                  Cancel
                </button>
                <button onClick={confirmDelete} className="flex-1 py-4 bg-brand-red text-white rounded-2xl font-black uppercase tracking-widest hover:bg-brand-red/90 transition-all shadow-xl shadow-brand-red/20 text-xs">
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── LIKERS LIST MODAL ── */}
      <AnimatePresence>
        {likersModalMemory && (
          <div className="fixed inset-0 z-[120] overflow-y-auto flex items-start justify-center p-4 sm:p-6 md:p-10">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setLikersModalMemory(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="relative my-4 sm:my-8 w-full max-w-md bg-white/95 dark:bg-[#131B2E]/95 backdrop-blur-2xl rounded-[32px] sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col border border-slate-150/40 dark:border-white/10 glass-card"
            >
              {/* Header */}
              <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-white/5 shrink-0 flex items-center justify-between">
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-slate-805 dark:text-white tracking-tight flex items-center gap-2">
                    <Heart className="w-5 h-5 text-brand-red fill-brand-red animate-pulse" /> Reactions
                  </h3>
                  <p className="text-slate-450 dark:text-slate-450 text-xs font-semibold mt-0.5">
                    People who reacted to "{likersModalMemory.title}"
                  </p>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  type="button" 
                  onClick={() => setLikersModalMemory(null)} 
                  className="p-2 bg-slate-50 dark:bg-[#0B0F19]/50 border border-slate-150/40 dark:border-white/5 rounded-xl text-slate-400 hover:text-slate-800 transition-all shrink-0"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>

              {/* Content */}
              <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar max-h-[50vh] space-y-4">
                {loadingLikers ? (
                  <div className="flex flex-col items-center justify-center py-10 space-y-3">
                    <div className="w-8 h-8 border-2 border-brand-red/30 border-t-brand-red rounded-full animate-spin" />
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Loading reactions...</span>
                  </div>
                ) : likers.length === 0 ? (
                  <div className="text-center py-10 text-slate-350 flex flex-col items-center justify-center space-y-2">
                    <Heart className="w-8 h-8 text-slate-200 dark:text-slate-700" />
                    <p className="text-xs font-black uppercase tracking-widest">No reactions yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50 dark:divide-white/5">
                    {likers.map(liker => (
                      <div key={liker.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                        {liker.profile_pic ? (
                          <img
                            src={liker.profile_pic}
                            className="w-10 h-10 rounded-full object-cover border border-slate-100 dark:border-white/5 shrink-0"
                            alt={liker.full_name}
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-[#0B0F19] border border-slate-200 dark:border-white/5 flex items-center justify-center text-slate-450 dark:text-slate-300 font-black text-sm uppercase shrink-0">
                            {liker.full_name?.charAt(0)}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black text-slate-800 dark:text-white truncate">{liker.full_name}</p>
                          <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 truncate uppercase tracking-widest">{liker.email}</p>
                          {liker.subsidiary_name && (
                            <span className="inline-block mt-0.5 px-2 py-0.5 bg-red-50 dark:bg-red-950/20 text-[8px] font-black text-brand-red dark:text-red-400 rounded-md uppercase tracking-wider border border-red-100/50 dark:border-red-900/30">
                              {liker.subsidiary_name}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 bg-slate-50 dark:bg-[#0B0F19]/50 shrink-0 border-t border-slate-100 dark:border-white/5 flex justify-end">
                <button 
                  onClick={() => setLikersModalMemory(null)}
                  className="px-5 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-350 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-colors border border-slate-150/40 dark:border-white/5"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>

      {/* ── LOADING OVERLAY ── */}
      {loading && (
        <div className="fixed inset-0 bg-white/80 dark:bg-[#0B0F19]/80 backdrop-blur-xl z-[100] flex items-center justify-center transition-all">
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 border-4 border-slate-105 dark:border-slate-800 border-t-brand-red rounded-full animate-spin" />
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[4px] animate-pulse">Loading Memories</p>
          </div>
        </div>
      )}
    </div>
  );
}
