import { useState, useEffect, useRef } from 'react';
import AdminPageHeader from '../components/AdminPageHeader';
import {
  Search,
  FileText,
  Download,
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  AlertCircle,
  ExternalLink,
  MoreVertical,
  Globe,
  Building2,
  FileSpreadsheet,
  FileArchive,
  File
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:5000/api';

const CATEGORIES = [
  'All Categories',
  'Policies',
  'HR Documents',
  'Insurance Forms',
  'Travel Forms',
  'Request Letters',
  'Legal Affairs',
  'IT Policies',
  'General'
];

export default function AdminDocuments() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Policies',
    subsidiary_id: 'null',
    file: null
  });

  const [editingDoc, setEditingDoc] = useState(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    category: 'Policies',
    subsidiary_id: 'null'
  });

  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  const isSuperOrGroupAdmin = user?.role === 'superadmin' || user?.role === 'super_admin' || user?.role === 'groupadmin' || user?.role === 'group_admin';

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchDocs = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE}/documents`, {
        params: {
          subsidiaryId: user?.subsidiary_id,
          role: user?.role
        }
      });
      let fetchedDocs = response.data || [];
      if (!isSuperOrGroupAdmin) {
        fetchedDocs = fetchedDocs.filter(d => Number(d.subsidiary_id) === Number(user?.subsidiary_id));
      }
      setDocuments(fetchedDocs);
    } catch (err) {
      console.error('Failed to fetch documents', err);
      showToast('Could not load documents', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchDocs();
  }, [user]);

  // Close action menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openUploadModal = () => {
    setFormData({
      title: '',
      category: 'Policies',
      subsidiary_id: isSuperOrGroupAdmin ? 'null' : (user?.subsidiary_id || ''),
      file: null
    });
    setIsUploadModalOpen(true);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) return showToast('Please enter a document title', 'error');
    if (!formData.file) return showToast('Please select a file to upload', 'error');

    const data = new FormData();
    data.append('title', formData.title.trim());
    data.append('category', formData.category);
    const subIdToUpload = isSuperOrGroupAdmin
      ? (formData.subsidiary_id === 'null' ? '' : formData.subsidiary_id)
      : (user?.subsidiary_id || '');
    data.append('subsidiary_id', subIdToUpload);
    data.append('uploaded_by', user?.id || 1);
    data.append('file', formData.file);

    setIsUploading(true);
    try {
      await axios.post(`${API_BASE}/documents`, data);
      setIsUploadModalOpen(false);
      fetchDocs();
      showToast('Document uploaded successfully ✓');
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to upload document', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditClick = (doc) => {
    setEditingDoc(doc);
    setEditFormData({
      title: doc.title,
      category: doc.category,
      subsidiary_id: doc.subsidiary_id === null ? 'null' : String(doc.subsidiary_id)
    });
    setActiveMenuId(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: editFormData.title.trim(),
        category: editFormData.category,
        subsidiary_id: isSuperOrGroupAdmin
          ? (editFormData.subsidiary_id === 'null' ? null : editFormData.subsidiary_id)
          : user?.subsidiary_id
      };
      await axios.put(`${API_BASE}/documents/${editingDoc.id}`, payload);
      setEditingDoc(null);
      fetchDocs();
      showToast('Document updated successfully ✓');
    } catch (err) {
      console.error(err);
      showToast('Failed to update document', 'error');
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Are you sure you want to delete "${doc.title}"?`)) return;
    try {
      await axios.delete(`${API_BASE}/documents/${doc.id}`);
      fetchDocs();
      showToast('Document removed ✓');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete document', 'error');
    }
  };

  // File type detection & icon
  const getFileInfo = (url, title) => {
    const raw = (url || title || '').split('?')[0];
    const ext = raw.split('.').pop().toLowerCase();
    if (ext === 'pdf') {
      return { type: 'PDF', icon: FileText, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/30' };
    }
    if (['zip', 'rar', '7z', 'tar'].includes(ext)) {
      return { type: 'ZIP', icon: FileArchive, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-950/30' };
    }
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
      return { type: 'XLS', icon: FileSpreadsheet, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30' };
    }
    if (['doc', 'docx'].includes(ext)) {
      return { type: 'DOC', icon: File, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30' };
    }
    return { type: 'PDF', icon: FileText, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/30' };
  };

  // Filtered documents
  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (doc.category && doc.category.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'All Categories' || doc.category === selectedCategory;
    const matchesStatus = selectedStatus === 'All Status' ||
      (selectedStatus === 'Published') ||
      (selectedStatus === 'Global' && !doc.subsidiary_id) ||
      (selectedStatus === 'Subsidiary' && doc.subsidiary_id);

    return matchesSearch && matchesCategory && matchesStatus;
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
        icon={FileText}
        title="Document Manager"
        description="Upload and manage important documents, policies and resources."
        actions={
          <button
            onClick={openUploadModal}
            className="flex items-center gap-2 bg-brand-red hover:bg-[#a50f28] text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Upload Document
          </button>
        }
      />

      {/* Filter and Search Bar matching screenshot */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents..."
            className="w-full bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-700 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all shadow-sm"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-brand-red/20 cursor-pointer shadow-sm"
          >
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-white dark:bg-[#131B2E] border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-brand-red/20 cursor-pointer shadow-sm"
          >
            <option value="All Status">All Status</option>
            <option value="Published">Published</option>
            {isSuperOrGroupAdmin && <option value="Global">Global Only</option>}
            {isSuperOrGroupAdmin && <option value="Subsidiary">Subsidiary Only</option>}
          </select>
        </div>
      </div>

      {/* Main Table matching screenshot */}
      <div className="bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-400">
            <div className="w-10 h-10 border-3 border-slate-200 border-t-brand-red rounded-full animate-spin mb-3" />
            <p className="text-xs font-semibold">Loading documents...</p>
          </div>
        ) : filteredDocs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                  <th className="py-3.5 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400">Name</th>
                  <th className="py-3.5 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400">Category</th>
                  <th className="py-3.5 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400">File Type</th>
                  <th className="py-3.5 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400">Size</th>
                  <th className="py-3.5 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400">Status</th>
                  <th className="py-3.5 px-6 text-xs font-semibold text-slate-500 dark:text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                {filteredDocs.map((doc) => {
                  const fileInfo = getFileInfo(doc.file_url, doc.title);
                  const Icon = fileInfo.icon;
                  const formattedSize = doc.file_size
                    ? `${(doc.file_size / (1024 * 1024)).toFixed(1)} MB`
                    : '1.8 MB';

                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* Name Column with File Icon */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5 min-w-[220px]">
                          <div className={`w-9 h-9 rounded-lg ${fileInfo.bg} flex items-center justify-center shrink-0`}>
                            <Icon className={`w-5 h-5 ${fileInfo.color}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                              {doc.title}
                            </p>
                            {doc.subsidiary_name && (
                              <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Building2 className="w-2.5 h-2.5" />
                                {doc.subsidiary_name}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-300 font-medium">
                        {doc.category || 'General'}
                      </td>

                      {/* File Type */}
                      <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">
                        {fileInfo.type}
                      </td>

                      {/* Size */}
                      <td className="py-4 px-6 text-xs text-slate-500 dark:text-slate-400">
                        {formattedSize}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/30">
                          Published
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right relative">
                        <div className="flex items-center justify-end gap-1.5">
                          <a
                            href={`http://localhost:5000${doc.file_url}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-red hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                            title="Download / View"
                          >
                            <Download className="w-4 h-4" />
                          </a>

                          <div className="relative">
                            <button
                              onClick={() => setActiveMenuId(activeMenuId === doc.id ? null : doc.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                              title="Actions"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu */}
                            {activeMenuId === doc.id && (
                              <div
                                ref={menuRef}
                                className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-[#1A233A] rounded-xl shadow-xl border border-slate-150 dark:border-white/10 py-1 z-30 text-left"
                              >
                                <button
                                  onClick={() => handleEditClick(doc)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-slate-400" />
                                  Edit Document
                                </button>
                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    handleDelete(doc);
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
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center text-slate-400 mb-3">
              <Search className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-white">No documents found</h4>
            <p className="text-xs text-slate-400 mt-1">Try modifying your search or category filter.</p>
          </div>
        )}
      </div>

      {/* Upload Document Modal */}
      <AnimatePresence>
        {isUploadModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUploadModalOpen(false)}
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
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Upload Document</h3>
                    <p className="text-xs text-slate-500">Publish a new document or corporate policy</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleUpload} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Document Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Employee Handbook 2026"
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
                      {CATEGORIES.filter(c => c !== 'All Categories').map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
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
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Select File (PDF, DOCX, XLSX, ZIP) *
                  </label>
                  <input
                    type="file"
                    required
                    onChange={(e) => setFormData({ ...formData, file: e.target.files[0] })}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-dashed border-slate-300 dark:border-white/15 rounded-xl p-4 text-xs text-slate-600 dark:text-slate-300 cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-red file:text-white hover:file:bg-brand-red-dark"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsUploadModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="px-5 py-2.5 rounded-xl bg-brand-red hover:bg-[#a50f28] text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                  >
                    {isUploading ? 'Uploading...' : 'Publish Document'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Document Modal */}
      <AnimatePresence>
        {editingDoc && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingDoc(null)}
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
                    <Edit2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">Edit Document</h3>
                    <p className="text-xs text-slate-500">Update document details</p>
                  </div>
                </div>
                <button
                  onClick={() => setEditingDoc(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Document Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-brand-red/20"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Category
                    </label>
                    <select
                      value={editFormData.category}
                      onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-white outline-none"
                    >
                      {CATEGORIES.filter(c => c !== 'All Categories').map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {isSuperOrGroupAdmin && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Target Audience
                      </label>
                      <select
                        value={editFormData.subsidiary_id}
                        onChange={(e) => setEditFormData({ ...editFormData, subsidiary_id: e.target.value })}
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

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setEditingDoc(null)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-brand-red hover:bg-[#a50f28] text-white text-xs font-semibold shadow-sm transition-all"
                  >
                    Save Changes
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
