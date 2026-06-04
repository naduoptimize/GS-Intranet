import { useState, useEffect } from 'react';
import {
  Search,
  FileText,
  Download,
  Filter,
  FolderOpen,
  Clock,
  ShieldCheck,
  Briefcase,
  Plane,
  HeartPulse,
  Plus,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  Star,
  FileBadge2,
  Lock,
  Upload,
  X,
  Building2 as BuildingIcon,
  Globe,
  Edit,
  Trash2,
  LayoutGrid,
  List,
  Printer,
  ArrowUpRight,
  HardDrive,
  Layers,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:5000/api';

const AdminDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Policies',
    subsidiary_id: user?.role === 'super_admin' ? 'null' : user?.subsidiary_id,
    file: null
  });

  const [editingDoc, setEditingDoc] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    category: 'Policies',
    subsidiary_id: 'null'
  });

  const [layoutMode, setLayoutMode] = useState('list'); // 'list' | 'grid'
  const [inspectorDoc, setInspectorDoc] = useState(null);

  const canManage = (doc) => {
    return user?.role === 'super_admin' || Number(doc.subsidiary_id) === Number(user?.subsidiary_id);
  };

  const fetchDocs = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/documents?subsidiaryId=${user?.subsidiary_id}&role=${user?.role}`);
      let fetchedDocs = response.data;
      if (user?.role !== 'super_admin') {
        fetchedDocs = fetchedDocs.filter(d => Number(d.subsidiary_id) === Number(user?.subsidiary_id));
      }
      setDocuments(fetchedDocs);
    } catch (err) {
      console.error('Failed to fetch docs', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, [user]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!formData.file) return alert('Please select a file');

    const data = new FormData();
    data.append('title', formData.title);
    data.append('category', formData.category);
    const subIdToUpload = user?.role === 'super_admin' ? (formData.subsidiary_id === 'null' ? null : formData.subsidiary_id) : user?.subsidiary_id;
    data.append('subsidiary_id', subIdToUpload || '');
    data.append('uploaded_by', user?.id || 1);
    data.append('file', formData.file);

    setIsUploading(true);
    try {
      await axios.post(`${API_BASE}/documents`, data);
      setIsModalOpen(false);
      setFormData({ ...formData, title: '', file: null });
      fetchDocs();
      alert('Document published successfully!');
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message || 'Failed to publish document';
      alert(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Are you sure you want to delete "${doc.title}"?`)) return;
    try {
      await axios.delete(`${API_BASE}/documents/${doc.id}`);
      fetchDocs();
      alert('Document deleted successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to delete document');
    }
  };

  const handleEditClick = (doc) => {
    setEditingDoc(doc);
    setEditFormData({
      title: doc.title,
      category: doc.category,
      subsidiary_id: doc.subsidiary_id === null ? 'null' : doc.subsidiary_id
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...editFormData,
        subsidiary_id: user?.role === 'super_admin' ? (editFormData.subsidiary_id === 'null' ? null : editFormData.subsidiary_id) : user?.subsidiary_id
      };
      await axios.put(`${API_BASE}/documents/${editingDoc.id}`, payload);
      setEditingDoc(null);
      fetchDocs();
      alert('Document updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to update document');
    }
  };

  const openUploadModal = () => {
    setFormData({
      title: '',
      category: 'Policies',
      subsidiary_id: user?.role === 'super_admin' ? 'null' : user?.subsidiary_id,
      file: null
    });
    setIsModalOpen(true);
  };

  const categories = [
    { name: 'Policies', icon: ShieldCheck, color: '#C8102E', bg: 'bg-red-50' },
    { name: 'HR Documents', icon: FileText, color: '#6366f1', bg: 'bg-indigo-50' },
    { name: 'Insurance Forms', icon: HeartPulse, color: '#10b981', bg: 'bg-emerald-50' },
    { name: 'Travel Forms', icon: Plane, color: '#f59e0b', bg: 'bg-amber-50' },
    { name: 'Request Letters', icon: Briefcase, color: '#8b5cf6', bg: 'bg-purple-50' },
    { name: 'Legal Affairs', icon: FolderOpen, color: '#64748b', bg: 'bg-slate-50' }
  ];

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const recentDocs = documents.slice(0, 3);
  const pinnedDocs = documents.slice(0, 2);

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">

      {/* SECTION 1 — IMMERSIVE HERO BANNER */}
      <section className="relative h-[400px] mb-12 rounded-[40px] overflow-hidden group">
        <img
          src="/document.png"
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          alt="Document Manager Hero"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=2000';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/40 to-transparent" />

        <div className="relative h-full flex flex-col justify-center px-12 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-brand-red/20 backdrop-blur-md border border-brand-red/30 rounded-full mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse" />
              <span className="text-[10px] font-black text-brand-red uppercase tracking-[3px]">Admin Dashboard</span>
            </div>
            <h1 className="text-6xl font-black text-white tracking-tighter mb-4">
              Document <span className="text-brand-red">Manager</span>
            </h1>
            <p className="text-lg text-white/70 font-medium max-w-xl mb-10 leading-relaxed">
              Manage and audit George Steuart official forms, corporate templates, entity-level resources, and public folders in one administrative dashboard.
            </p>

            <div className="relative max-w-xl">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find a document, policy, or form..."
                className="w-full pl-16 pr-6 py-5 bg-white shadow-2xl rounded-[24px] text-slate-800 font-medium focus:ring-4 focus:ring-brand-red/10 transition-all outline-none text-lg border-none"
              />
            </div>
          </motion.div>
        </div>

        {/* Decorative Element */}
        <div className="absolute bottom-10 right-12 flex gap-4">
          <div className="px-6 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[20px]">
            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Total Assets</p>
            <p className="text-white text-2xl font-black">{documents.length}+</p>
          </div>
          <div className="px-6 py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-[20px]">
            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Last Updated</p>
            <p className="text-white text-2xl font-black">Today</p>
          </div>
        </div>
      </section>

      {/* STATS COUNT GRID */}
      <section className="mb-12 grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-[#131B2E] border border-slate-100 dark:border-white/5 p-6 rounded-[28px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#C8102E]/10 flex items-center justify-center text-[#C8102E]">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1.5">Total Assets</p>
            <h4 className="text-xl font-black text-slate-800 dark:text-white">{documents.length} Files</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-[#131B2E] border border-slate-100 dark:border-white/5 p-6 rounded-[28px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-600">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1.5">Global Access</p>
            <h4 className="text-xl font-black text-slate-800 dark:text-white">{documents.filter(d => !d.subsidiary_id).length} Files</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-[#131B2E] border border-slate-100 dark:border-white/5 p-6 rounded-[28px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/10 flex items-center justify-center text-emerald-600">
            <BuildingIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1.5">Subsidiary Assets</p>
            <h4 className="text-xl font-black text-slate-800 dark:text-white">{documents.filter(d => d.subsidiary_id).length} Files</h4>
          </div>
        </div>
        <div className="bg-white dark:bg-[#131B2E] border border-slate-100 dark:border-white/5 p-6 rounded-[28px] shadow-[0_4px_20px_rgba(0,0,0,0.02)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-indigo-600">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1.5">Storage Status</p>
            <h4 className="text-xl font-black text-slate-805 dark:text-slate-200">Active / Online</h4>
          </div>
        </div>
      </section>

      {/* SECTION 2 — QUICK ACCESS CATEGORIES */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="w-1.5 h-6 bg-brand-red rounded-full" />
            Browse by Category
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${selectedCategory === 'All' ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 hover:text-slate-600'}`}
            >
              All Files
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
              onClick={() => setSelectedCategory(cat.name)}
              className={`relative bg-white border border-slate-100 p-8 rounded-[32px] flex flex-col items-center text-center cursor-pointer transition-all shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)] group ${selectedCategory === cat.name ? 'ring-2 ring-brand-red border-transparent' : ''}`}
            >
              <div className={`w-16 h-16 ${cat.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform shadow-sm`}>
                <cat.icon className="w-8 h-8" style={{ color: cat.color }} />
              </div>
              <h4 className="font-black text-slate-800 text-sm mb-2">{cat.name}</h4>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                <span>View Library</span>
                <ChevronRight className="w-3 h-3 text-slate-300" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* SECTION 3 — MAIN CONTENT AREA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

        {/* LEFT COLUMN: DOCUMENT EXPLORER */}
        <section className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-[0_8px_48px_rgba(0,0,0,0.05)] overflow-hidden">
            <div className="p-8 border-b border-slate-50 dark:border-white/5 flex items-center justify-between bg-slate-50/30 dark:bg-[#131B2E]/50">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Administrative Repository</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium mt-1">Showing {filteredDocs.length} assets in {selectedCategory}</p>
              </div>
              <div className="flex items-center gap-3">
                {/* Layout Mode Toggle */}
                <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex gap-1 border border-slate-200/50 dark:border-white/5">
                  <button
                    onClick={() => setLayoutMode('list')}
                    className={`p-1.5 rounded-lg transition-all ${layoutMode === 'list' ? 'bg-white dark:bg-slate-700 text-brand-red shadow-sm' : 'text-slate-450 hover:text-slate-600 dark:hover:text-slate-350'}`}
                    title="List View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setLayoutMode('grid')}
                    className={`p-1.5 rounded-lg transition-all ${layoutMode === 'grid' ? 'bg-white dark:bg-slate-700 text-brand-red shadow-sm' : 'text-slate-450 hover:text-slate-600 dark:hover:text-slate-350'}`}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>

                <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-white/5 rounded-xl text-xs font-black text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all uppercase tracking-widest">
                  <Filter className="w-4 h-4" /> Filter
                </button>
                <button
                  onClick={openUploadModal}
                  className="flex items-center gap-2 px-5 py-2.5 bg-brand-red text-white rounded-xl text-xs font-black hover:bg-brand-red/90 transition-all uppercase tracking-widest shadow-lg shadow-brand-red/20 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Upload
                </button>
              </div>
            </div>

            <div className="p-2">
              {isLoading ? (
                <div className="p-20 flex flex-col items-center justify-center text-slate-400">
                  <div className="w-12 h-12 border-4 border-slate-100 border-t-brand-red rounded-full animate-spin mb-4" />
                  <p className="font-bold text-sm uppercase tracking-widest">Synchronizing Library...</p>
                </div>
              ) : filteredDocs.length > 0 ? (
                layoutMode === 'list' ? (
                  <div className="divide-y divide-slate-50 dark:divide-white/5">
                    {filteredDocs.map((doc, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => setInspectorDoc(doc)}
                        className="group p-6 hover:bg-slate-50/80 dark:hover:bg-[#1e293b]/35 transition-all flex items-center gap-6 cursor-pointer rounded-2xl mx-2 my-1 border border-transparent hover:border-slate-100 dark:hover:border-white/5"
                      >
                        <div className="w-14 h-14 bg-white dark:bg-[#131B2E] border border-slate-100 dark:border-white/5 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-brand-red/5 group-hover:text-brand-red group-hover:border-brand-red/10 transition-all shadow-sm">
                          <FileText className="w-6 h-6" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-black text-slate-900 dark:text-white group-hover:text-brand-red transition-colors truncate text-base">{doc.title}</p>
                            {doc.subsidiary_id ? (
                              <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-[8px] font-black uppercase tracking-widest rounded-md border border-emerald-100 dark:border-emerald-900/10 flex items-center gap-1 shrink-0">
                                <BuildingIcon className="w-2.5 h-2.5" />
                                {doc.subsidiary_name || 'Entity'}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 text-[8px] font-black uppercase tracking-widest rounded-md border border-blue-100 dark:border-blue-900/10 flex items-center gap-1 shrink-0">
                                <Globe className="w-2.5 h-2.5" />
                                All Staff
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              {new Date(doc.created_at).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Lock className="w-3.5 h-3.5" />
                              {doc.subsidiary_id ? 'Internal' : 'Global Access'}
                            </span>
                            <span className="text-brand-red/60 dark:text-brand-red/70 bg-brand-red/5 dark:bg-brand-red/10 px-2 py-0.5 rounded-md">
                              {doc.category}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0" onClick={(e) => e.stopPropagation()}>
                          <a
                            href={`http://localhost:5000${doc.file_url}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 text-slate-400 hover:text-brand-red hover:border-brand-red/20 rounded-xl transition-all shadow-sm flex items-center justify-center"
                            title="Download Document"
                          >
                            <Download className="w-5 h-5" />
                          </a>
                          <a
                            href={`http://localhost:5000${doc.file_url}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all shadow-sm flex items-center justify-center"
                            title="View Online"
                          >
                            <ExternalLink className="w-5 h-5" />
                          </a>
                          {canManage(doc) && (
                            <>
                              <button
                                onClick={() => handleEditClick(doc)}
                                className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 text-slate-400 hover:text-indigo-600 hover:border-indigo-200 rounded-xl transition-all shadow-sm flex items-center justify-center cursor-pointer"
                                title="Edit Document"
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDelete(doc)}
                                className="p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 text-slate-400 hover:text-rose-600 hover:border-rose-200 rounded-xl transition-all shadow-sm flex items-center justify-center cursor-pointer"
                                title="Delete Document"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                    {filteredDocs.map((doc, i) => {
                      const fileExt = doc.file_url.split('.').pop().toLowerCase();
                      const fileColor = fileExt === 'pdf' ? 'from-rose-500 to-red-650' : fileExt === 'xlsx' || fileExt === 'xls' ? 'from-emerald-500 to-teal-655' : 'from-blue-500 to-indigo-600';
                      
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          onClick={() => setInspectorDoc(doc)}
                          className="group bg-white dark:bg-[#131B2E] border border-slate-100 dark:border-white/5 rounded-3xl p-6 hover:shadow-xl dark:hover:shadow-black/35 hover:-translate-y-1.5 transition-all cursor-pointer flex flex-col justify-between"
                        >
                          <div className="space-y-4">
                            {/* Card Header: File Mockup and Status */}
                            <div className="flex justify-between items-start">
                              <div className={`w-14 h-16 rounded-2xl bg-gradient-to-br ${fileColor} flex flex-col justify-between p-2.5 text-white font-black shadow-lg shadow-black/10 relative overflow-hidden group-hover:scale-105 transition-transform`}>
                                <div className="absolute top-[-10px] right-[-10px] w-6 h-6 bg-white/20 rounded-full blur-sm" />
                                <span className="text-[10px] tracking-wider uppercase leading-none">{fileExt}</span>
                                <FileText className="w-6 h-6 text-white/90 self-end" />
                              </div>

                              <div className="flex flex-col items-end gap-1.5">
                                {doc.subsidiary_id ? (
                                  <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-[8px] font-black uppercase tracking-widest rounded-full border border-emerald-100/50 dark:border-emerald-900/10">
                                    {doc.subsidiary_name || 'Entity'}
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 text-[8px] font-black uppercase tracking-widest rounded-full border border-blue-100/50 dark:border-blue-900/10">
                                    🌐 All Staff
                                  </span>
                                )}
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{new Date(doc.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>

                            {/* Card Body: Title & Category */}
                            <div className="space-y-1">
                              <h4 className="font-black text-slate-800 dark:text-white group-hover:text-[#C8102E] transition-colors leading-snug line-clamp-2 text-base">
                                {doc.title}
                              </h4>
                              <p className="text-[9px] text-slate-450 font-black uppercase tracking-widest">{doc.category}</p>
                            </div>
                          </div>

                          {/* Card Footer: Quick Actions */}
                          <div className="flex items-center justify-between pt-5 border-t border-slate-50 dark:border-white/5 mt-5">
                            <span className="text-[8px] font-black text-[#C8102E]/70 uppercase tracking-widest flex items-center gap-1 group-hover:text-[#C8102E] transition-colors">
                              Inspect File <ArrowUpRight className="w-3.5 h-3.5" />
                            </span>
                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                              <a
                                href={`http://localhost:5000${doc.file_url}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-brand-red/10 text-slate-455 hover:text-brand-red rounded-xl transition-all shadow-inner flex items-center justify-center"
                                title="Download Document"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                              {canManage(doc) && (
                                <>
                                  <button
                                    onClick={() => handleEditClick(doc)}
                                    className="p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 text-slate-455 hover:text-indigo-650 rounded-xl transition-all shadow-inner flex items-center justify-center cursor-pointer"
                                    title="Edit Document"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(doc)}
                                    className="p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-455 hover:text-rose-655 rounded-xl transition-all shadow-inner flex items-center justify-center cursor-pointer"
                                    title="Delete Document"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )
              ) : (
                <div className="p-20 flex flex-col items-center justify-center text-center">
                  <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <Search className="w-10 h-10 text-slate-200" />
                  </div>
                  <h4 className="text-slate-800 dark:text-white font-black">No documents found</h4>
                  <p className="text-slate-400 text-sm mt-1">Try adjusting your search or category filter.</p>
                </div>
              )}
            </div>

            {filteredDocs.length > 5 && (
              <div className="p-6 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-50 dark:border-white/5 flex justify-center">
                <button className="flex items-center gap-2 text-xs font-black text-slate-450 hover:text-brand-red uppercase tracking-[3px] transition-all group">
                  Load More Assets
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN: SIDEBAR UTILITIES */}
        <section className="lg:col-span-4 space-y-8">

          {/* Pinned / Important Documents */}
          <div className="bg-white dark:bg-[#131B2E] rounded-[32px] border border-slate-100 dark:border-white/5 shadow-[0_8px_48px_rgba(0,0,0,0.05)] p-8">
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3 mb-6">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              Essential Assets
            </h3>
            <div className="space-y-4">
              {pinnedDocs.length > 0 ? pinnedDocs.map((doc, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-slate-50/50 dark:bg-slate-800/10 rounded-2xl border border-slate-100 dark:border-white/5 group cursor-pointer hover:bg-white dark:hover:bg-[#131B2E] hover:border-brand-red/20 dark:hover:border-brand-red/20 transition-all">
                  <div className="w-12 h-12 bg-white dark:bg-slate-805 rounded-xl flex items-center justify-center text-slate-400 shadow-sm border border-slate-100 dark:border-white/5 group-hover:text-brand-red transition-all">
                    <FileBadge2 className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-slate-800 dark:text-slate-205 truncate mb-0.5">{doc.title}</p>
                    <p className="text-[10px] text-brand-red font-black uppercase tracking-widest">Required Reading</p>
                  </div>
                </div>
              )) : (
                <p className="text-xs text-slate-400 text-center py-4">No pinned documents available.</p>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-[#131B2E] rounded-[32px] border border-slate-100 dark:border-white/5 shadow-[0_8px_48px_rgba(0,0,0,0.05)] p-8">
            <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3 mb-6">
              <Clock className="w-5 h-5 text-indigo-500" />
              Recent Updates
            </h3>
            <div className="space-y-6">
              {recentDocs.map((doc, i) => (
                <div key={i} className="flex gap-4 relative">
                  {i !== recentDocs.length - 1 && <div className="absolute left-2.5 top-8 bottom-[-16px] w-0.5 bg-slate-50 dark:bg-slate-800" />}
                  <div className="w-5 h-5 bg-white dark:bg-slate-850 border-2 border-slate-100 dark:border-white/5 rounded-full flex items-center justify-center z-10 shrink-0 mt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-800 dark:text-slate-205 leading-tight mb-1">{doc.title}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Added Recently</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </section>

      </div>

      {/* Upload Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-[600px] bg-white rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-10">
                <div className="flex justify-between items-center mb-10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-brand-red rounded-2xl flex items-center justify-center shadow-lg shadow-brand-red/20 text-white">
                      <Upload className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900">Upload Document</h2>
                      <p className="text-slate-500 font-medium">Add a new official resource.</p>
                    </div>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleUpload} className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Document Title</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Employee Leave Policy 2026"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-[20px] focus:ring-4 focus:ring-brand-red/5 outline-none transition-all font-bold text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-[20px] outline-none font-bold text-slate-800 appearance-none"
                      >
                        {categories.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Visibility</label>
                      <div className="w-full px-6 py-4 bg-slate-50 rounded-[20px] flex items-center gap-3">
                        {user?.role === 'super_admin' ? (
                          <select
                            value={formData.subsidiary_id}
                            onChange={(e) => setFormData({ ...formData, subsidiary_id: e.target.value })}
                            className="w-full bg-transparent border-none outline-none font-bold text-slate-800 appearance-none cursor-pointer"
                          >
                            <option value="null">🌐 Global (All Staff)</option>
                            <option value={user.subsidiary_id}>🏢 My Entity Only</option>
                          </select>
                        ) : (
                          <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                            <BuildingIcon className="w-4 h-4" /> Entity Staff Only
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select File</label>
                    <div className="relative group">
                      <input
                        required
                        type="file"
                        onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
                        className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="w-full flex flex-col items-center justify-center gap-4 py-12 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[32px] cursor-pointer hover:bg-slate-100 hover:border-brand-red/30 transition-all group"
                      >
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                          <Upload className="w-7 h-7 text-brand-red" />
                        </div>
                        <div className="text-center">
                          <p className="font-black text-slate-800 tracking-tight">
                            {formData.file ? formData.file.name : 'Click to Browse Files'}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">PDF, DOCX, XLSX (Max 20MB)</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isUploading}
                    className="w-full bg-brand-red text-white py-5 rounded-[24px] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-brand-red/20 hover:bg-brand-red-dark hover:scale-[0.98] transition-all disabled:opacity-70 flex items-center justify-center gap-3"
                  >
                    {isUploading ? 'Publishing...' : 'Publish Document'} <ArrowRight className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingDoc && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingDoc(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-[600px] bg-white rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className="p-10">
                <div className="flex justify-between items-center mb-10">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20 text-white">
                      <Edit className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900">Edit Document</h2>
                      <p className="text-slate-500 font-medium">Update document metadata.</p>
                    </div>
                  </div>
                  <button onClick={() => setEditingDoc(null)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleEditSubmit} className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Document Title</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Employee Leave Policy 2026"
                      value={editFormData.title}
                      onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                      className="w-full px-6 py-4 bg-slate-50 border-none rounded-[20px] focus:ring-4 focus:ring-brand-red/5 outline-none transition-all font-bold text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                      <select
                        value={editFormData.category}
                        onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-[20px] outline-none font-bold text-slate-800 appearance-none cursor-pointer"
                      >
                        {categories.map(cat => <option key={cat.name} value={cat.name}>{cat.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Visibility</label>
                      <div className="w-full px-6 py-4 bg-slate-50 rounded-[20px] flex items-center gap-3">
                        {user?.role === 'super_admin' ? (
                          <select
                            value={editFormData.subsidiary_id}
                            onChange={(e) => setEditFormData({ ...editFormData, subsidiary_id: e.target.value })}
                            className="w-full bg-transparent border-none outline-none font-bold text-slate-800 appearance-none cursor-pointer"
                          >
                            <option value="null">🌐 Global (All Staff)</option>
                            <option value={user.subsidiary_id}>🏢 My Entity Only</option>
                          </select>
                        ) : (
                          <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                            <BuildingIcon className="w-4 h-4" /> Entity Staff Only
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-brand-red text-white py-5 rounded-[24px] font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-brand-red/20 hover:bg-brand-red-dark hover:scale-[0.98] transition-all flex items-center justify-center gap-3 cursor-pointer"
                  >
                    Save Changes <ArrowRight className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Inspector Slide-Over Drawer */}
      <AnimatePresence>
        {inspectorDoc && (
          <div className="fixed inset-0 z-[110] flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setInspectorDoc(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            {/* Drawer Body */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-[460px] h-full bg-white dark:bg-[#0b0f19] shadow-2xl flex flex-col justify-between border-l border-slate-100 dark:border-white/5 z-10"
            >
              {/* Header */}
              <div className="p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#C8102E]/10 flex items-center justify-center text-[#C8102E]">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-base">File Metadata</h3>
                    <p className="text-[9px] text-slate-400 dark:text-slate-505 font-bold uppercase tracking-widest mt-0.5">Asset audit & inspection</p>
                  </div>
                </div>
                <button
                  onClick={() => setInspectorDoc(null)}
                  className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-450 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body Content */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                {/* Vector file mockup representation */}
                {(() => {
                  const fileExt = inspectorDoc.file_url.split('.').pop().toLowerCase();
                  const fileColor = fileExt === 'pdf' ? 'from-rose-500 to-red-650' : fileExt === 'xlsx' || fileExt === 'xls' ? 'from-emerald-500 to-teal-600' : 'from-blue-500 to-indigo-650';
                  
                  return (
                    <div className="flex flex-col items-center text-center p-6 bg-slate-50/50 dark:bg-[#131B2E]/30 rounded-[32px] border border-slate-100 dark:border-white/5">
                      <div className={`w-20 h-24 rounded-3xl bg-gradient-to-br ${fileColor} flex flex-col justify-between p-3.5 text-white font-black shadow-xl shadow-black/15 mb-4 relative overflow-hidden`}>
                        <div className="absolute top-[-10px] right-[-10px] w-8 h-8 bg-white/20 rounded-full blur-sm" />
                        <span className="text-xs tracking-wider uppercase leading-none">{fileExt}</span>
                        <FileText className="w-9 h-9 text-white/95 self-end" />
                      </div>
                      <h4 className="font-black text-slate-900 dark:text-white text-lg leading-snug">
                        {inspectorDoc.title}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1 bg-white dark:bg-slate-800 border border-slate-200/50 dark:border-white/5 px-3 py-1 rounded-full">
                        {inspectorDoc.category}
                      </span>
                    </div>
                  );
                })()}

                {/* Audit Grid Details */}
                <div className="space-y-4">
                  <h5 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Metadata Specs</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50/50 dark:bg-[#131B2E]/20 p-4 rounded-2xl border border-slate-100/50 dark:border-white/5">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Access Clearance</p>
                      <p className="font-black text-slate-850 dark:text-slate-200 mt-1 flex items-center gap-1.5 text-xs">
                        {inspectorDoc.subsidiary_id ? (
                          <>
                            <BuildingIcon className="w-3.5 h-3.5 text-emerald-500" />
                            Entity Only
                          </>
                        ) : (
                          <>
                            <Globe className="w-3.5 h-3.5 text-blue-500" />
                            Global Staff
                          </>
                        )}
                      </p>
                    </div>
                    <div className="bg-slate-50/50 dark:bg-[#131B2E]/20 p-4 rounded-2xl border border-slate-100/50 dark:border-white/5">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Estimated Read</p>
                      <p className="font-black text-slate-850 dark:text-slate-200 mt-1 flex items-center gap-1.5 text-xs">
                        <Clock className="w-3.5 h-3.5 text-brand-red" />
                        5-7 Mins
                      </p>
                    </div>
                    <div className="bg-slate-50/50 dark:bg-[#131B2E]/20 p-4 rounded-2xl border border-slate-100/50 dark:border-white/5">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Published Date</p>
                      <p className="font-black text-slate-855 dark:text-slate-200 mt-1 text-xs">
                        {new Date(inspectorDoc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="bg-slate-50/50 dark:bg-[#131B2E]/20 p-4 rounded-2xl border border-slate-100/50 dark:border-white/5">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">File Size / Integrity</p>
                      <p className="font-black text-slate-855 dark:text-slate-200 mt-1 text-xs">
                        Verified 2.4 MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* Audit Actions Info */}
                <div className="p-5 bg-blue-50/30 dark:bg-blue-950/10 border border-blue-100/40 dark:border-blue-900/10 rounded-2xl space-y-2">
                  <h6 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" /> Corporate Directive
                  </h6>
                  <p className="text-[11px] text-slate-505 dark:text-slate-400 leading-relaxed font-semibold">
                    This official establishment document is indexed under the George Steuart compliance schema. All staff are expected to read and adhere to all referenced provisions and policies.
                  </p>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-8 border-t border-slate-100 dark:border-white/5 flex gap-4 shrink-0 bg-slate-50/50 dark:bg-[#131B2E]/20">
                <a
                  href={`http://localhost:5000${inspectorDoc.file_url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 bg-brand-red text-white py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-brand-red/10 hover:bg-brand-red-dark hover:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> Download File
                </a>
                <button
                  onClick={() => window.print()}
                  className="px-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 text-slate-500 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-2xl transition-all flex items-center justify-center"
                  title="Print Mock"
                >
                  <Printer className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDocuments;
