import { useState, useEffect } from 'react';
import { 
  Heart, 
  Share2, 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  X, 
  Image as ImageIcon,
  Check,
  AlertCircle,
  Clock,
  User,
  Building2,
  TrendingUp,
  Download,
  Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:5000/api';

const MemoriesWall = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'super_admin' || user?.role === 'sub_admin';
  
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filterSubsidiary, setFilterSubsidiary] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Upload Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image_url: '',
    subsidiary_id: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  const fetchMemories = async () => {
    try {
      const response = await axios.get(`${API_BASE}/memories`, {
        params: {
          subsidiaryId: user?.subsidiary_id,
          role: user?.role,
          userId: user?.id
        }
      });
      setMemories(response.data);
    } catch (err) {
      console.error('Failed to fetch memories', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (id) => {
    if (!user) return;
    try {
      const response = await axios.post(`${API_BASE}/memories/${id}/like`, {
        userId: user.id
      });
      const { liked } = response.data;
      setMemories(prev => prev.map(m => m.id === id ? { 
        ...m, 
        has_liked: liked ? 1 : 0,
        likes_count: liked ? m.likes_count + 1 : Math.max(0, m.likes_count - 1)
      } : m));
    } catch (err) {
      console.error('Failed to toggle like on memory', err);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!formData.image_url) {
      showToast('Please upload an image or provide a URL', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await axios.post(`${API_BASE}/memories`, {
        ...formData,
        author_id: user.id
      });
      setShowUploadModal(false);
      setFormData({ title: '', description: '', image_url: '', subsidiary_id: '' });
      fetchMemories();
      showToast('Memory captured successfully! 📸');
    } catch (err) {
      console.error('Upload failed', err);
      showToast('Failed to save memory', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (e) => {
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
      setFormData(prev => ({
        ...prev,
        image_url: response.data.imageUrl
      }));
      showToast('Photo uploaded successfully ✓');
    } catch (err) {
      console.error(err);
      showToast('Failed to upload image', 'error');
    }
  };

  const filteredMemories = memories.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          m.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-10 right-10 z-[110] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 text-white font-bold text-sm ${toast.type === 'error' ? 'bg-red-550' : toast.type === 'info' ? 'bg-indigo-650' : 'bg-emerald-500'}`}
          >
            {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <Check className="w-5 h-5" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* ── SECTION 1 — IMMERSIVE HERO ── */}
      <section className="mb-6 sm:px-1">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
          className="group relative mx-auto h-[170px] sm:h-[210px] lg:h-[270px] max-w-[1280px] overflow-hidden rounded-[24px] sm:rounded-[28px] border border-white/90 bg-[#f7e8dc] shadow-[0_22px_55px_-30px_rgba(88,28,33,0.42)]"
        >
          <img
            src="/memories-moments-hero-v2.png"
            className="h-full w-full object-cover object-[27%_center] sm:object-center transition-transform duration-[1400ms] ease-out group-hover:scale-[1.012]"
            alt="George Steuart Company Memories — Moments That Unite Us"
            onError={(e) => {
              e.target.src = '/memories_hero_banner_1778833359675.png';
            }}
          />
          <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/35" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />
        </motion.div>
      </section>

      {/* ── SECTION 2 — SEARCH & FILTERS ── */}
      <section className="mb-8">
        <div className="bg-white/80 backdrop-blur-2xl border border-slate-100 shadow-sm rounded-[24px] md:rounded-[32px] p-2 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
           <div className="relative flex-1 group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-brand-red transition-colors" />
              <input 
                type="text" 
                placeholder="Search memories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-16 pr-6 py-4 bg-transparent rounded-2xl text-sm font-bold focus:outline-none"
              />
           </div>
           <div className="flex items-center gap-2 px-2 pb-2 md:pb-0">
              <button className="flex-1 md:flex-none px-6 py-3 bg-slate-900 text-white rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-lg">Latest First</button>
              <button className="p-3 md:p-4 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl md:rounded-2xl transition-all">
                <Filter className="w-5 h-5" />
              </button>
           </div>
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence>
          {filteredMemories.map((memory, i) => (
            <motion.div
              key={memory.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="group relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 flex flex-col"
            >
              {/* Image Container */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <img 
                  src={memory.image_url} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  alt={memory.title}
                />
                {/* Visibility Badge */}
                <div className="absolute top-6 left-6 z-20">
                  {memory.subsidiary_id ? (
                    <div className="flex items-center gap-1.5 bg-emerald-500/90 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-[9px] font-black uppercase tracking-widest shadow-md">
                      <Building2 className="w-3.5 h-3.5" />
                      {memory.subsidiary_name || 'Entity'}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 bg-blue-500/90 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-[9px] font-black uppercase tracking-widest shadow-md">
                      <Globe className="w-3.5 h-3.5" />
                      All Staff
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 p-8 flex flex-col justify-end">
                  <p className="text-white text-lg font-black leading-tight mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">{memory.title}</p>
                  <p className="text-white/70 text-xs font-medium line-clamp-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-75">{memory.description}</p>
                </div>
                
                {/* Like Overlay Effect */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <motion.div 
                     whileTap={{ scale: 1.5, opacity: 1 }}
                     className="opacity-0 text-white"
                   >
                     <Heart className="w-20 h-20 fill-white" />
                   </motion.div>
                </div>
              </div>

              {/* Interaction Bar */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => handleLike(memory.id)}
                      className="flex items-center gap-2 group/btn"
                    >
                      <Heart className={`w-6 h-6 transition-all ${memory.has_liked ? 'fill-brand-red text-brand-red scale-110' : 'text-slate-350 group-hover/btn:text-brand-red'}`} />
                      <span className="text-xs font-black text-slate-800">{memory.likes_count}</span>
                    </button>
                  </div>
                  <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-350 group-hover:text-brand-red group-hover:bg-brand-red/5 transition-all cursor-pointer">
                    <Download className="w-5 h-5" />
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-50">
                   <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                     <User className="w-4 h-4" />
                   </div>
                   <div className="min-w-0">
                      <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest truncate">{memory.author_name || 'Admin'}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{new Date(memory.created_at).toLocaleDateString()}</p>
                   </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── SECTION 4 — UPLOAD MODAL ── */}
      <AnimatePresence>
        {showUploadModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUploadModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl" 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[45px] shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar"
            >
              <div className="p-10">
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Capture a Memory</h2>
                    <p className="text-slate-400 text-sm font-medium mt-1">Share an official moment with the GS family.</p>
                  </div>
                  <button 
                    onClick={() => setShowUploadModal(false)}
                    className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleUpload} className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Memory Title</label>
                      <input 
                        required
                        type="text" 
                        placeholder="e.g. Annual Cricket Day 2026"
                        value={formData.title}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-brand-red/5 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Visibility</label>
                      <select
                        value={formData.subsidiary_id}
                        onChange={(e) => setFormData({...formData, subsidiary_id: e.target.value})}
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-brand-red/5 outline-none transition-all appearance-none"
                      >
                        <option value="">🌐 Global (All Entities)</option>
                        {user?.subsidiary_id && (
                          <option value={user.subsidiary_id}>🏢 My Entity ({user.subsidiary_name || 'My Subsidiary'})</option>
                        )}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Memory Photo</label>
                    
                    {formData.image_url ? (
                      <div className="relative h-44 rounded-2xl overflow-hidden border border-slate-200 shadow-sm group">
                        <img src={formData.image_url} className="w-full h-full object-cover" alt="Preview" />
                        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <label className="cursor-pointer bg-white text-slate-805 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-100 transition-colors shadow-lg">
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
                            className="bg-red-650 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-colors shadow-lg"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Drag and Drop Upload Box */}
                        <label className="cursor-pointer border-2 border-dashed border-slate-200 hover:border-brand-red/50 hover:bg-red-50/5 rounded-2xl p-6 transition-all flex flex-col items-center justify-center text-center group min-h-[140px]">
                          <ImageIcon className="w-8 h-8 text-slate-350 group-hover:text-brand-red group-hover:scale-110 transition-all mb-2" />
                          <span className="text-xs font-black text-slate-700 dark:text-slate-300">Upload Image File</span>
                          <span className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">PNG, JPG up to 5MB</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleImageUpload} 
                            className="hidden" 
                          />
                        </label>

                        {/* Paste URL Option Box */}
                        <div className="border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 rounded-2xl p-6 flex flex-col justify-center space-y-3 min-h-[140px] transition-all">
                          <div className="flex flex-col items-center justify-center text-center space-y-1">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Or Use Image URL</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Link direct image address</span>
                          </div>
                          <input 
                            value={formData.image_url}
                            onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                            className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-xs text-slate-700 dark:text-slate-300 focus:ring-4 focus:ring-brand-red/5 outline-none transition-all text-center shadow-sm placeholder:text-slate-350"
                            placeholder="https://example.com/image.jpg"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Description</label>
                    <textarea 
                      required
                      placeholder="Share the story behind this moment..."
                      rows="4"
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-brand-red/5 outline-none transition-all resize-none"
                    />
                  </div>

                  <button 
                    disabled={isSubmitting}
                    className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black uppercase tracking-widest hover:bg-brand-red transition-all shadow-xl shadow-slate-200/50 flex items-center justify-center gap-4 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <ImageIcon className="w-6 h-6" />
                        Post to Memory Wall
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {loading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-xl z-[100] flex items-center justify-center">
          <div className="flex flex-col items-center">
             <div className="w-16 h-16 border-4 border-slate-100 border-t-brand-red rounded-full animate-spin mb-6" />
             <p className="text-xs font-black text-slate-400 uppercase tracking-[5px] animate-pulse">Loading Memories</p>
          </div>
        </div>
      )}

    </div>
  );
};

export default MemoriesWall;
