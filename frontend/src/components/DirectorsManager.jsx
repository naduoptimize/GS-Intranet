import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, X, Users, Image as ImageIcon } from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const DirectorsManager = ({ subsidiaryId }) => {
  const [directors, setDirectors] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    bio: '',
    image_url: ''
  });

  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    if (subsidiaryId) fetchDirectors();
  }, [subsidiaryId]);

  const fetchDirectors = async () => {
    try {
      const res = await axios.get(`${API_BASE}/subsidiaries/${subsidiaryId}/directors`);
      setDirectors(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData({ name: '', title: '', bio: '', image_url: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (dir) => {
    setModalMode('edit');
    setFormData({
      id: dir.id,
      name: dir.name || '',
      title: dir.title || '',
      bio: dir.bio || '',
      image_url: dir.image_url || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        await axios.post(`${API_BASE}/subsidiaries/${subsidiaryId}/directors`, formData);
      } else {
        await axios.put(`${API_BASE}/subsidiaries/directors/${formData.id}`, formData);
      }
      setIsModalOpen(false);
      fetchDirectors();
    } catch (err) {
      console.error(err);
      alert('Error saving director');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`${API_BASE}/subsidiaries/directors/${deleteTarget}`);
      setDeleteTarget(null);
      fetchDirectors();
    } catch (err) {
      console.error(err);
      alert('Error deleting director');
    }
  };

  return (
    <div className="mt-8 pt-8 border-t border-slate-100">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-brand-red" />
          Board of Directors
        </h3>
        <button 
          type="button"
          onClick={openAddModal}
          className="text-sm font-bold text-brand-red bg-red-50 px-4 py-2 rounded-lg hover:bg-brand-red hover:text-white transition-colors flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> Add Director
        </button>
      </div>

      {loading ? (
        <div className="text-center py-4 text-slate-400">Loading directors...</div>
      ) : directors.length === 0 ? (
        <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-8 text-center">
          <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500 font-medium">No directors added yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {directors.map(dir => (
            <div key={dir.id} className="bg-white border border-slate-100 rounded-xl p-4 flex gap-4 relative group hover:border-slate-300 transition-colors">
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-sm rounded-lg p-1">
                <button type="button" onClick={() => openEditModal(dir)} className="p-1.5 text-slate-400 hover:text-brand-red hover:bg-red-50 rounded-md transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={() => setDeleteTarget(dir.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <div className="w-12 h-12 bg-slate-100 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-200">
                {dir.image_url ? (
                  <img src={dir.image_url} alt={dir.name} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-slate-300" />
                )}
              </div>
              <div className="min-w-0 pr-12">
                <h4 className="font-bold text-slate-900 truncate">{dir.name}</h4>
                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 truncate mb-1">{dir.title}</p>
                {dir.bio && <p className="text-xs text-slate-500 line-clamp-2">{dir.bio}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Director Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[24px] shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-black text-slate-900">
                {modalMode === 'add' ? 'Add Director' : 'Edit Director'}
              </h2>
              <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Director Name *</label>
                <input type="text" name="name" required value={formData.name} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-red/20 font-medium" />
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Title / Designation</label>
                <input type="text" name="title" value={formData.title} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-red/20 font-medium" />
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Image URL</label>
                <input type="text" name="image_url" placeholder="https://..." value={formData.image_url} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-red/20 font-medium text-sm" />
              </div>
              <div>
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Short Bio</label>
                <textarea name="bio" rows="3" value={formData.bio} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-red/20 font-medium resize-none text-sm"></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-sm text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 text-sm bg-brand-red text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-brand-red/20">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Director Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-[24px] p-6 text-center shadow-2xl">
            <h2 className="text-xl font-black text-slate-900 mb-2">Remove Director?</h2>
            <p className="text-slate-500 text-sm font-medium mb-6">Are you sure you want to remove this director from the subsidiary?</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setDeleteTarget(null)} className="flex-1 py-3 bg-slate-50 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors">Cancel</button>
              <button type="button" onClick={handleDelete} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors">Yes, Remove</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DirectorsManager;
