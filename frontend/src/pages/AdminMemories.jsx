import { useState, useEffect, useRef } from 'react';
import AdminPageHeader from '../components/AdminPageHeader';
import {
  Camera, Plus, Edit2, Trash2, Search,
  X, Check, AlertCircle, RefreshCw,
  Heart, User, Image as ImageIcon,
  Building2, MoreVertical, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:5000/api';
const TABS = ['All Posts', 'Achievements', 'Events', 'People', 'CSR'];
const EMPTY = { title: '', description: '', image_url: '', subsidiary_id: 'null', category: 'Events' };

export default function AdminMemories() {
  const { user } = useAuth();
  const isSuperOrGroupAdmin = user?.role === 'superadmin' || user?.role === 'super_admin' || user?.role === 'groupadmin' || user?.role === 'group_admin';

  const [memories, setMemories]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [activeTab, setActiveTab]   = useState('All Posts');
  const [search, setSearch]         = useState('');
  const [filterVisibility, setFilterVisibility] = useState('all');
  const [modal, setModal]           = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(EMPTY);
  const [deleteId, setDeleteId]     = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]           = useState(null);

  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  // Reaction Inspection States
  const [likersModalMemory, setLikersModalMemory] = useState(null);
  const [likers, setLikers] = useState([]);
  const [loadingLikers, setLoadingLikers] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMemories();
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function fetchMemories() {
    setLoading(true);
    try {
      const url = `${API_BASE}/memories?subsidiaryId=${user.subsidiary_id}&role=${user.role}`;
      const { data } = await axios.get(url);
      let fetched = data || [];
      if (!isSuperOrGroupAdmin) {
        fetched = fetched.filter(m => Number(m.subsidiary_id) === Number(user.subsidiary_id));
      }
      setMemories(fetched);
    } catch { 
      showToast('Failed to load memories', 'error'); 
    } finally { 
      setLoading(false); 
    }
  }

  async function fetchLikers(memory) {
    setActiveMenuId(null);
    setLikersModalMemory(memory);
    setLoadingLikers(true);
    try {
      const response = await axios.get(`${API_BASE}/memories/${memory.id}/likers`);
      setLikers(response.data || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load reactions', 'error');
    } finally {
      setLoadingLikers(false);
    }
  }

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  function openAdd() {
    setEditing(null);
    setForm({
      ...EMPTY,
      subsidiary_id: isSuperOrGroupAdmin ? 'null' : (user?.subsidiary_id || '')
    });
    setModal(true);
  }

  function openEdit(m) {
    setActiveMenuId(null);
    setEditing(m);
    setForm({
      title: m.title || '',
      description: m.description || '',
      image_url: m.image_url || '',
      subsidiary_id: m.subsidiary_id || 'null',
      category: m.category || 'Events'
    });
    setModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title.trim()) return showToast('Title is required', 'error');
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        author_id: user.id,
        subsidiary_id: isSuperOrGroupAdmin ? (form.subsidiary_id === 'null' ? null : form.subsidiary_id) : user.subsidiary_id
      };
      if (editing) {
        await axios.put(`${API_BASE}/memories/${editing.id}`, payload);
        showToast('Memory updated successfully ✓');
      } else {
        await axios.post(`${API_BASE}/memories`, payload);
        showToast('Memory added to wall ✓');
      }
      setModal(false);
      fetchMemories();
    } catch { 
      showToast('Failed to save memory', 'error'); 
    } finally { 
      setSubmitting(false); 
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      await axios.delete(`${API_BASE}/memories/${deleteId}`);
      showToast('Memory removed ✓');
      setDeleteId(null);
      fetchMemories();
    } catch { 
      showToast('Delete failed', 'error'); 
    }
  }

  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('image', file);

    try {
      showToast('Uploading photo...', 'info');
      const response = await axios.post(`${API_BASE}/uploads/image`, uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
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

  const filteredMemories = memories.filter(m => {
    const matchSearch = (m.title || '').toLowerCase().includes(search.toLowerCase()) ||
                        (m.description || '').toLowerCase().includes(search.toLowerCase());
    const matchTab = activeTab === 'All Posts' || (m.category && m.category.toLowerCase() === activeTab.toLowerCase());
    const matchVisibility = filterVisibility === 'all' ||
                            (filterVisibility === 'global' && !m.subsidiary_id) ||
                            (filterVisibility === 'subsidiary' && m.subsidiary_id);
    return matchSearch && matchTab && matchVisibility;
  });

  return (
    <div className="min-h-screen pb-16">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-[200] px-5 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-white font-semibold text-xs ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}
          >
            {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header matching screenshot */}
      <AdminPageHeader
        icon={Camera}
        title="Memory Wall"
        description="Create and manage special moments, achievements and memories."
        actions={
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-brand-red hover:bg-[#a50f28] text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Post
          </button>
        }
      />

      {/* Tabs with Underline Indicator matching screenshot */}
      <div className="flex items-center gap-6 border-b border-slate-200 dark:border-white/10 mb-5 overflow-x-auto">
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-xs sm:text-sm font-semibold transition-all relative shrink-0 ${
                isActive
                  ? 'text-brand-red font-bold'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {tab}
              {isActive && (
                <motion.div
                  layoutId="memoryUnderline"
                  className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-brand-red rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search memories..."
            className="w-full bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-700 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all shadow-sm"
          />
        </div>

        <div className="flex items-center gap-3">
          {isSuperOrGroupAdmin && (
            <select
              value={filterVisibility}
              onChange={(e) => setFilterVisibility(e.target.value)}
              className="bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-brand-red/20 cursor-pointer shadow-sm"
            >
              <option value="all">All Scope</option>
              <option value="global">🌐 Global Posts</option>
              <option value="subsidiary">🏢 Subsidiary Only</option>
            </select>
          )}

          <button
            onClick={fetchMemories}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#131B2E] text-slate-500 hover:text-brand-red transition-all shadow-sm"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4-Column Card Grid matching screenshot */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center text-slate-400">
          <div className="w-10 h-10 border-3 border-slate-200 border-t-brand-red rounded-full animate-spin mb-3" />
          <p className="text-xs font-semibold">Loading Memory Wall...</p>
        </div>
      ) : filteredMemories.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {filteredMemories.map((m) => {
            const fallbackImg = m.image_url || '/citrus_hero.png';
            const formattedDate = m.created_at 
              ? new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'Mar 15, 2026';

            return (
              <div
                key={m.id}
                className="bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
              >
                {/* Photo Thumbnail */}
                <div className="relative aspect-[16/10] bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <img
                    src={fallbackImg}
                    alt={m.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.target.src = '/citrus_hero.png'; }}
                  />
                  {m.subsidiary_name && (
                    <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-white backdrop-blur-sm shadow-sm">
                      {m.subsidiary_name}
                    </span>
                  )}
                </div>

                {/* Card Content matching screenshot */}
                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-brand-red transition-colors">
                      {m.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {m.description || 'Special memory captured with team members.'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-white/5">
                    <span className="text-[11px] text-slate-400 font-medium">
                      {formattedDate}
                    </span>

                    <div className="flex items-center gap-1 relative">
                      <button
                        onClick={() => fetchLikers(m)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-rose-500 hover:text-rose-600 px-1.5 py-0.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20"
                        title="View reactions"
                      >
                        <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                        <span>{m.like_count || 0}</span>
                      </button>

                      <button
                        onClick={() => setActiveMenuId(activeMenuId === m.id ? null : m.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {activeMenuId === m.id && (
                        <div
                          ref={menuRef}
                          className="absolute right-0 bottom-full mb-1 w-36 bg-white dark:bg-[#1A233A] rounded-xl shadow-xl border border-slate-150 dark:border-white/10 py-1 z-30 text-left"
                        >
                          <button
                            onClick={() => openEdit(m)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                            Edit Memory
                          </button>
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              setDeleteId(m.id);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-white/5 rounded-2xl p-16 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center text-slate-400 mb-3">
            <Camera className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-white">No memories found</h4>
          <p className="text-xs text-slate-400 mt-1">Post your first memory to share moments with the group.</p>
        </div>
      )}

      {/* Add / Edit Memory Modal */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModal(false)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#131B2E] rounded-2xl shadow-2xl border border-slate-100 dark:border-white/10 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-red/10 border border-brand-red/20 text-brand-red flex items-center justify-center">
                    <Camera className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {editing ? 'Edit Memory' : 'Add to Memory Wall'}
                    </h3>
                    <p className="text-xs text-slate-500">Share corporate achievements & team moments</p>
                  </div>
                </div>
                <button
                  onClick={() => setModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Memory Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Annual Trip 2025 or CSR Blood Donation Drive"
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-brand-red/20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Category
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-white outline-none"
                    >
                      {TABS.filter(t => t !== 'All Posts').map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  {isSuperOrGroupAdmin && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Target Audience
                      </label>
                      <select
                        value={form.subsidiary_id}
                        onChange={(e) => setForm({ ...form, subsidiary_id: e.target.value })}
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-white outline-none"
                      >
                        <option value="null">🌐 All Staff (Global)</option>
                        <option value="1">George Steuart & Co.</option>
                        <option value="2">George Steuart Health</option>
                        <option value="3">George Steuart Insurance</option>
                        <option value="4">George Steuart Teas</option>
                        <option value="5">George Steuart Travel</option>
                        <option value="6">George Steuart Solutions</option>
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Upload Photo
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-dashed border-slate-300 dark:border-white/15 rounded-xl p-3 text-xs text-slate-600 dark:text-slate-300 cursor-pointer file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-red file:text-white hover:file:bg-brand-red-dark"
                  />
                  {form.image_url && (
                    <div className="mt-2 relative w-full h-28 rounded-xl overflow-hidden border border-slate-200">
                      <img src={form.image_url} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Description / Caption
                  </label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe the moment, achievement or celebration..."
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-brand-red/20"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl bg-brand-red hover:bg-[#a50f28] text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Posting...' : editing ? 'Save Changes' : 'Post Memory'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Likers Modal */}
      <AnimatePresence>
        {likersModalMemory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setLikersModalMemory(null)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#131B2E] rounded-2xl shadow-2xl p-6 border border-slate-100"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/5 mb-3">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                  Reactions ({likers.length})
                </h4>
                <button onClick={() => setLikersModalMemory(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {loadingLikers ? (
                  <p className="text-xs text-slate-400 text-center py-4">Loading reactions...</p>
                ) : likers.length > 0 ? (
                  likers.map((l, i) => (
                    <div key={i} className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-white/5">
                      <div className="w-7 h-7 rounded-full bg-brand-red/10 text-brand-red flex items-center justify-center text-xs font-bold">
                        {l.full_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-white">{l.full_name}</p>
                        <p className="text-[10px] text-slate-400">{l.job_title || 'Staff'}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center py-4">No reactions yet.</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteId(null)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#131B2E] rounded-2xl shadow-2xl p-6 text-center border border-slate-100"
            >
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Delete Memory?</h3>
              <p className="text-xs text-slate-500 mb-5">This post will be permanently removed from the wall.</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold"
                >
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
