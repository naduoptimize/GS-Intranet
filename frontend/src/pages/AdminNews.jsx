import { useState, useEffect } from 'react';
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
  ChevronLeft,
  RefreshCw,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:5000/api';

const AdminNews = () => {
  const { user } = useAuth();
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVisibility, setFilterVisibility] = useState('all'); // 'all' | 'global' | 'subsidiary'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image_url: '',
    category: 'Corporate',
    publish_date: new Date().toISOString().split('T')[0],
    subsidiary_id: user?.role === 'super_admin' ? 'null' : user?.subsidiary_id
  });
  const [toast, setToast] = useState(null);

  const categories = ['Corporate', 'Healthcare', 'Teas', 'Technology', 'Travel', 'Leisure', 'General'];

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        subsidiary_id: user.role === 'super_admin' ? 'null' : user.subsidiary_id
      }));
      fetchNews();
    }
  }, [user]);

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
      let fetchedNews = response.data;
      if (user.role !== 'super_admin') {
        fetchedNews = fetchedNews.filter(item => Number(item.subsidiary_id) === Number(user.subsidiary_id));
      }
      setNews(fetchedNews);
    } catch (err) {
      console.error('Failed to fetch news', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        title: item.title,
        content: item.content,
        image_url: item.image_url,
        category: item.category,
        publish_date: item.publish_date.split('T')[0],
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
        subsidiary_id: user?.role === 'super_admin' ? 'null' : user?.subsidiary_id
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSave = {
        ...formData,
        subsidiary_id: user?.role === 'super_admin' ? (formData.subsidiary_id === 'null' ? null : formData.subsidiary_id) : user?.subsidiary_id
      };
      if (editingItem) {
        await axios.put(`${API_BASE}/news/${editingItem.id}`, dataToSave);
        showToast('News updated successfully');
      } else {
        await axios.post(`${API_BASE}/news`, dataToSave);
        showToast('News added successfully');
      }
      setIsModalOpen(false);
      fetchNews();
    } catch (err) {
      showToast('Failed to save news', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this news item?')) {
      try {
        await axios.delete(`${API_BASE}/news/${id}`);
        showToast('News deleted successfully');
        fetchNews();
      } catch (err) {
        showToast('Failed to delete news', 'error');
      }
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('image', file);

    try {
      showToast('Uploading image...', 'info');
      const response = await axios.post('http://localhost:5000/api/uploads/image', uploadData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setFormData(prev => ({
        ...prev,
        image_url: response.data.imageUrl
      }));
      showToast('Image uploaded successfully ✓');
    } catch (err) {
      console.error(err);
      showToast('Failed to upload image', 'error');
    }
  };

  const filteredNews = news.filter(item => {
    const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchVisibility = filterVisibility === 'all' ||
                            (filterVisibility === 'global' && !item.subsidiary_id) ||
                            (filterVisibility === 'subsidiary' && item.subsidiary_id);
    return matchSearch && matchVisibility;
  });  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] pb-20 transition-colors duration-350">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-10 right-10 z-[100] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 text-white font-bold text-sm ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}
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
            src="/admin_news_cover.png" 
            alt="News" 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/50 to-transparent"/>
          <div className="absolute inset-0 flex items-center px-6 sm:px-10 md:px-16">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-brand-red/20 backdrop-blur-md border border-brand-red/30 rounded-full mb-2.5 sm:mb-3.5">
                <div className="w-1.5 h-1.5 bg-brand-red rounded-full animate-pulse"/>
                <span className="text-[8px] font-black text-brand-red uppercase tracking-[3px]">Media Operations</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-tighter leading-none mb-2">
                Media &amp; <span className="text-brand-red">News Manager</span>
              </h1>
              <p className="text-white/60 text-xs sm:text-sm font-medium leading-relaxed max-w-lg hidden sm:block">
                Create and curate the official George Steuart Group news articles, corporate newsletters, and official feed content.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-8 md:px-10 -mt-10 sm:-mt-16 relative z-10">
        
        {/* Main Controls Card */}
        <div className="bg-white dark:bg-[#131B2E] rounded-3xl sm:rounded-[40px] border border-slate-100 dark:border-white/5 shadow-[0_8px_48px_rgba(0,0,0,0.03)] overflow-hidden">
          
          {/* Header Controls */}
          <div className="p-5 sm:p-8 border-b border-slate-50 dark:border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center justify-between lg:justify-start gap-3 w-full lg:w-auto">
              <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">Article Directory</h2>
              <span className="px-3 py-1 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-full text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{filteredNews.length} published</span>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500"/>
                <input value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} placeholder="Search news by title or category..."
                  className="pl-11 pr-5 py-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-sm font-bold text-slate-700 dark:text-white outline-none focus:ring-4 focus:ring-brand-red/5 w-full"/>
              </div>
              {user?.role === 'super_admin' && (
                <select 
                  value={filterVisibility}
                  onChange={(e) => setFilterVisibility(e.target.value)}
                  className="px-5 py-3 bg-slate-50 dark:bg-[#131B2E] border border-slate-100 dark:border-white/10 rounded-xl outline-none font-bold text-slate-700 dark:text-white text-sm cursor-pointer"
                >
                  <option value="all">All Visibilities</option>
                  <option value="global">🌐 All Staff (Global)</option>
                  <option value="subsidiary">🏢 My Subsidiary</option>
                </select>
              )}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button onClick={fetchNews} className="p-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-slate-400 hover:text-brand-red transition-all flex-1 sm:flex-none flex justify-center items-center">
                  <RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/>
                </button>
                <button onClick={()=>handleOpenModal()}
                  className="flex items-center justify-center gap-2 bg-brand-red text-white px-5 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-brand-red/90 hover:scale-105 active:scale-95 transition-all shadow-lg shadow-brand-red/20 flex-[3] sm:flex-none">
                  <Plus className="w-4 h-4"/> Add News
                </button>
              </div>
            </div>
          </div>

          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-white/5">
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Article</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Category</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Publish Date</th>
                  <th className="px-8 py-6 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                {loading ? (
                  <tr><td colSpan="4" className="text-center py-20 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest animate-pulse">Syncing Library...</td></tr>
                ) : filteredNews.length === 0 ? (
                  <tr><td colSpan="4" className="text-center py-20 text-slate-450 dark:text-slate-500 font-semibold">No news items found</td></tr>
                ) : filteredNews.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 shadow-sm border border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                          <img 
                            src={item.image_url} 
                            className="w-full h-full object-cover"
                            alt={item.title}
                            onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=News&background=f8fafc&color=cbd5e1'; }}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-slate-900 dark:text-white group-hover:text-brand-red dark:group-hover:text-red-400 transition-colors truncate text-sm">{item.title}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">{item.content.substring(0, 60)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1.5 bg-slate-100 dark:bg-white/5 text-slate-655 dark:text-slate-400 text-[9px] font-black uppercase tracking-widest rounded-lg border border-slate-200 dark:border-white/5">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold text-xs">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(item.publish_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {(user?.role === 'super_admin' || item.subsidiary_id === user?.subsidiary_id) && (
                          <>
                            <button 
                              onClick={() => handleOpenModal(item)}
                              className="p-2.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-slate-400 dark:text-slate-500 hover:text-indigo-650 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:border-indigo-100 dark:hover:border-indigo-900/30 transition-all"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDelete(item.id)}
                              className="p-2.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-slate-400 dark:text-slate-500 hover:text-brand-red hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-100 dark:hover:border-red-900/30 transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* MOBILE CARDS VIEW */}
          <div className="block md:hidden grid grid-cols-1 gap-4 p-5 bg-slate-50/10 dark:bg-slate-900/10">
            {loading ? (
              <div className="text-center py-20 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest animate-pulse">Syncing Library...</div>
            ) : filteredNews.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-[#131B2E] rounded-3xl border border-slate-100 dark:border-white/5 p-6">
                <p className="text-slate-400 dark:text-slate-500 font-bold text-sm">No news items found</p>
              </div>
            ) : (
              filteredNews.map((item) => (
                <div key={item.id} className="bg-white dark:bg-[#131B2E] border border-slate-100 dark:border-white/5 rounded-3xl p-5 shadow-sm space-y-4">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 shadow-sm border border-slate-100 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                      <img 
                        src={item.image_url} 
                        className="w-full h-full object-cover"
                        alt={item.title}
                        onError={(e) => { e.target.src = 'https://ui-avatars.com/api/?name=News&background=f8fafc&color=cbd5e1'; }}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-slate-800 dark:text-white text-sm">{item.title}</p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-550 font-medium mt-1">{new Date(item.publish_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">{item.content}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-white/5">
                    <span className="px-3 py-1 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-lg text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{item.category}</span>
                    {(user?.role === 'super_admin' || item.subsidiary_id === user?.subsidiary_id) && (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => handleOpenModal(item)} className="p-2.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-slate-400 dark:text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:border-indigo-100"><Edit2 className="w-4 h-4"/></button>
                        <button onClick={() => handleDelete(item.id)} className="p-2.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-slate-400 dark:text-slate-500 hover:text-brand-red hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-100"><Trash2 className="w-4 h-4"/></button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] overflow-y-auto flex items-start justify-center p-4 sm:p-6 md:p-10">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-slate-950/65 dark:bg-slate-950/85 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative my-4 sm:my-8 w-full max-w-2xl bg-white dark:bg-[#131B2E] border border-slate-100 dark:border-white/5 rounded-[32px] sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col z-10"
            >
              <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
                {/* Header */}
                <div className="p-6 sm:p-8 border-b border-slate-100 dark:border-white/5 shrink-0 flex items-center justify-between">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {editingItem ? 'Edit News Article' : 'Create New Article'}
                    </h3>
                    <p className="text-slate-400 dark:text-slate-500 text-xs sm:text-sm font-medium mt-0.5">Fill in the details for the official news feed.</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)} 
                    className="p-2.5 sm:p-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl text-slate-400 hover:text-slate-850 dark:hover:text-white transition-all shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Form content */}
                <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Article Title</label>
                    <input 
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl font-bold text-slate-850 dark:text-white focus:ring-4 focus:ring-brand-red/5 outline-none transition-all"
                      placeholder="Enter a compelling title..."
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Category</label>
                      <select 
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-6 py-4 bg-slate-50 dark:bg-[#131B2E] border border-slate-100 dark:border-white/10 rounded-2xl font-bold text-slate-800 dark:text-white focus:ring-4 focus:ring-brand-red/5 outline-none transition-all cursor-pointer"
                      >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Publish Date</label>
                      <input 
                        required
                        type="date"
                        value={formData.publish_date}
                        onChange={(e) => setFormData({ ...formData, publish_date: e.target.value })}
                        className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl font-bold text-slate-800 dark:text-white focus:ring-4 focus:ring-brand-red/5 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Visibility</label>
                      <div className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl flex items-center justify-between font-bold text-slate-800 dark:text-white transition-all h-[58px]">
                        {user?.role === 'super_admin' ? (
                          <select 
                            value={formData.subsidiary_id}
                            onChange={(e) => setFormData({...formData, subsidiary_id: e.target.value})}
                            className="w-full bg-transparent border-none outline-none font-bold text-slate-800 dark:text-white cursor-pointer"
                          >
                            <option value="null">🌐 Global</option>
                            <option value={user.subsidiary_id}>🏢 My Entity</option>
                          </select>
                        ) : (
                          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-450 font-bold text-xs truncate">
                            <Building2 className="w-4 h-4 shrink-0 animate-pulse" /> Entity Staff
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Article Cover Image</label>
                    
                    {formData.image_url ? (
                      <div className="relative h-40 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm group">
                        <img src={formData.image_url} className="w-full h-full object-cover" alt="Preview" />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <label className="cursor-pointer bg-white dark:bg-slate-800 text-slate-805 dark:text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-lg">
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
                            onClick={() => setFormData({ ...formData, image_url: '' })}
                            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-lg"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Drag and Drop Upload Box */}
                        <label className="cursor-pointer border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-brand-red/50 dark:hover:border-brand-red/50 hover:bg-red-50/5 rounded-2xl p-6 transition-all flex flex-col items-center justify-center text-center group min-h-[140px]">
                          <ImageIcon className="w-8 h-8 text-slate-350 dark:text-slate-500 group-hover:text-brand-red group-hover:scale-110 transition-all mb-2" />
                          <span className="text-xs font-black text-slate-700 dark:text-slate-300">Upload Image File</span>
                          <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-widest">PNG, JPG up to 5MB</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleImageUpload} 
                            className="hidden" 
                          />
                        </label>

                        {/* Paste URL Option Box */}
                        <div className="border-2 border-slate-200 dark:border-white/10 dark:bg-slate-900/50 bg-slate-50/50 rounded-2xl p-6 flex flex-col justify-center space-y-3 min-h-[140px] transition-all">
                          <div className="flex flex-col items-center justify-center text-center space-y-1">
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Or Use Image URL</span>
                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Link direct image address</span>
                          </div>
                          <input 
                            value={formData.image_url}
                            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                            className="w-full px-4 py-3 bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-white/10 rounded-xl font-bold text-xs text-slate-750 dark:text-slate-300 focus:ring-4 focus:ring-brand-red/5 outline-none transition-all text-center shadow-sm placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Article Content</label>
                    <textarea 
                      required
                      rows="6"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl font-bold text-slate-800 dark:text-white focus:ring-4 focus:ring-brand-red/5 outline-none transition-all resize-none"
                      placeholder="Write the full story here..."
                    />
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 sm:p-8 border-t border-slate-100 dark:border-white/5 shrink-0 flex gap-4 bg-slate-50/50 dark:bg-slate-900/40 rounded-b-[32px] sm:rounded-b-[40px]">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-2xl font-black uppercase tracking-widest transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-[2] py-4 bg-brand-red text-white rounded-2xl font-black uppercase tracking-widest hover:bg-brand-red/90 transition-all shadow-xl shadow-brand-red/20"
                  >
                    {editingItem ? 'Update Story' : 'Publish Story'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default AdminNews;
