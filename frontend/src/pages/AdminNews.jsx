import { useState, useEffect, useRef } from 'react';
import AdminPageHeader from '../components/AdminPageHeader';
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Newspaper, 
  Calendar, 
  Tag, 
  X, 
  Check, 
  AlertCircle,
  Image as ImageIcon,
  ExternalLink,
  RefreshCw,
  Building2,
  MoreVertical,
  Film,
  Layers,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:5000/api';

const TABS = ['All Media', 'Images', 'Videos', 'Banners', 'Icons'];
const CATEGORIES = ['All', 'Corporate', 'Healthcare', 'Teas', 'Technology', 'Travel', 'Leisure', 'General'];

export default function AdminNews() {
  const { user } = useAuth();
  const isSuperOrGroupAdmin = user?.role === 'superadmin' || user?.role === 'super_admin' || user?.role === 'groupadmin' || user?.role === 'group_admin';
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('All Media');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filterVisibility, setFilterVisibility] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image_url: '',
    category: 'Corporate',
    publish_date: new Date().toISOString().split('T')[0],
    subsidiary_id: isSuperOrGroupAdmin ? 'null' : (user?.subsidiary_id || '')
  });
  const [toast, setToast] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        subsidiary_id: isSuperOrGroupAdmin ? 'null' : user.subsidiary_id
      }));
      fetchNews();
    }
  }, [user]);

  // Click outside listener for dropdown menus
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNews = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/news`, {
        params: {
          subsidiaryId: user.subsidiary_id,
          role: user.role
        }
      });
      let fetchedNews = response.data || [];
      if (!isSuperOrGroupAdmin) {
        fetchedNews = fetchedNews.filter(item => Number(item.subsidiary_id) === Number(user.subsidiary_id));
      }
      setNews(fetchedNews);
    } catch (err) {
      console.error('Failed to fetch media/news', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleOpenModal = (item = null) => {
    setActiveMenuId(null);
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title,
        content: item.content || '',
        image_url: item.image_url || '',
        category: item.category || 'Corporate',
        publish_date: item.publish_date ? item.publish_date.split('T')[0] : new Date().toISOString().split('T')[0],
        subsidiary_id: item.subsidiary_id || 'null'
      });
    } else {
      setEditingItem(null);
      setFormData({
        title: '',
        content: '',
        image_url: '',
        category: 'Corporate',
        publish_date: new Date().toISOString().split('T')[0],
        subsidiary_id: isSuperOrGroupAdmin ? 'null' : (user?.subsidiary_id || '')
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return showToast('Title is required', 'error');

    const dataToSave = {
      ...formData,
      subsidiary_id: isSuperOrGroupAdmin
        ? (formData.subsidiary_id === 'null' ? null : formData.subsidiary_id)
        : user.subsidiary_id
    };

    try {
      if (editingItem) {
        await axios.put(`${API_BASE}/news/${editingItem.id}`, dataToSave);
        showToast('Media updated successfully ✓');
      } else {
        await axios.post(`${API_BASE}/news`, dataToSave);
        showToast('Media published successfully ✓');
      }
      setIsModalOpen(false);
      fetchNews();
    } catch (err) {
      showToast('Failed to save media', 'error');
    }
  };

  const handleDelete = async (id) => {
    setActiveMenuId(null);
    if (window.confirm('Are you sure you want to delete this media item?')) {
      try {
        await axios.delete(`${API_BASE}/news/${id}`);
        showToast('Media removed ✓');
        fetchNews();
      } catch (err) {
        showToast('Failed to delete media', 'error');
      }
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('image', file);

    try {
      showToast('Uploading file...', 'info');
      const response = await axios.post(`${API_BASE}/uploads/image`, uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setFormData(prev => ({
        ...prev,
        image_url: response.data.imageUrl
      }));
      showToast('Uploaded successfully ✓');
    } catch (err) {
      console.error(err);
      showToast('Failed to upload image', 'error');
    }
  };

  const filteredNews = news.filter(item => {
    const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchVisibility = filterVisibility === 'all' ||
                            (filterVisibility === 'global' && !item.subsidiary_id) ||
                            (filterVisibility === 'subsidiary' && item.subsidiary_id);
    return matchSearch && matchCat && matchVisibility;
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
        icon={Newspaper}
        title="Media Manager"
        description="Manage images, videos and media files for use across the intranet."
        actions={
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-brand-red hover:bg-[#a50f28] text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Upload Media
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
                  layoutId="mediaUnderline"
                  className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-brand-red rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar matching screenshot */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search media files..."
            className="w-full bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-700 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all shadow-sm"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 hidden sm:inline">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-brand-red/20 cursor-pointer shadow-sm"
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat === 'All' ? 'All' : cat}</option>
            ))}
          </select>

          {isSuperOrGroupAdmin && (
            <select
              value={filterVisibility}
              onChange={(e) => setFilterVisibility(e.target.value)}
              className="bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-brand-red/20 cursor-pointer shadow-sm"
            >
              <option value="all">All Scope</option>
              <option value="global">🌐 Global</option>
              <option value="subsidiary">🏢 Subsidiary</option>
            </select>
          )}

          <button
            onClick={fetchNews}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#131B2E] text-slate-500 hover:text-brand-red transition-all shadow-sm"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 3-Column Card Grid matching screenshot */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center text-slate-400">
          <div className="w-10 h-10 border-3 border-slate-200 border-t-brand-red rounded-full animate-spin mb-3" />
          <p className="text-xs font-semibold">Loading media files...</p>
        </div>
      ) : filteredNews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredNews.map((item) => {
            const fallbackImg = item.image_url || '/citrus_hero.png';
            const formattedDate = item.publish_date 
              ? new Date(item.publish_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : 'Oct 20, 2026';

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col justify-between"
              >
                {/* Thumbnail Image */}
                <div className="relative aspect-[16/10] bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <img
                    src={fallbackImg}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.target.src = '/citrus_hero.png'; }}
                  />
                  {item.category && (
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white/90 dark:bg-slate-900/90 text-slate-800 dark:text-white backdrop-blur-sm shadow-sm">
                      {item.category}
                    </span>
                  )}
                </div>

                {/* Card Content & Footer matching screenshot */}
                <div className="p-4 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-white/5">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-brand-red transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      2.4 MB • {formattedDate}
                    </p>
                  </div>

                  {/* Actions Dropdown */}
                  <div className="relative shrink-0">
                    <button
                      onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {activeMenuId === item.id && (
                      <div
                        ref={menuRef}
                        className="absolute right-0 bottom-full mb-1 w-36 bg-white dark:bg-[#1A233A] rounded-xl shadow-xl border border-slate-150 dark:border-white/10 py-1 z-30 text-left"
                      >
                        <button
                          onClick={() => handleOpenModal(item)}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                          Edit Media
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
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
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-white/5 rounded-2xl p-16 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center text-slate-400 mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-white">No media files found</h4>
          <p className="text-xs text-slate-400 mt-1">Try searching with different keywords or changing category.</p>
        </div>
      )}

      {/* Upload / Edit Media Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
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
                    <Newspaper className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {editingItem ? 'Edit Media Item' : 'Upload New Media'}
                    </h3>
                    <p className="text-xs text-slate-500">Add photos, articles or videos to the media hub</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    File / Article Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. tea-collection.jpg or Annual Milestone"
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-brand-red/20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-white outline-none"
                    >
                      {CATEGORIES.filter(c => c !== 'All').map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Publish Date
                    </label>
                    <input
                      type="date"
                      value={formData.publish_date}
                      onChange={(e) => setFormData({ ...formData, publish_date: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-white outline-none"
                    />
                  </div>
                </div>

                {isSuperOrGroupAdmin && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Target Audience
                    </label>
                    <select
                      value={formData.subsidiary_id}
                      onChange={(e) => setFormData({ ...formData, subsidiary_id: e.target.value })}
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

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Image File / Thumbnail
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-dashed border-slate-300 dark:border-white/15 rounded-xl p-3 text-xs text-slate-600 dark:text-slate-300 cursor-pointer file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-red file:text-white hover:file:bg-brand-red-dark"
                  />
                  {formData.image_url && (
                    <div className="mt-2 relative w-full h-28 rounded-xl overflow-hidden border border-slate-200">
                      <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Description / Content
                  </label>
                  <textarea
                    rows={3}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Brief description or caption..."
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-brand-red/20"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-brand-red hover:bg-[#a50f28] text-white text-xs font-semibold shadow-sm transition-all"
                  >
                    {editingItem ? 'Save Changes' : 'Upload Media'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
