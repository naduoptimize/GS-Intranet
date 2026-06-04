import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Building2, 
  Globe, 
  Mail, 
  Phone,
  MapPin,
  X,
  AlertTriangle
} from 'lucide-react';
import DirectorsManager from '../components/DirectorsManager';

const API_BASE = 'http://localhost:5000/api';

const AdminSubsidiaries = () => {
  const [subsidiaries, setSubsidiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    mission: '',
    vision: '',
    location: '',
    website: '',
    email: '',
    phone: '',
    phone_2: ''
  });

  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    fetchSubsidiaries();
  }, []);

  const fetchSubsidiaries = async () => {
    try {
      const res = await axios.get(`${API_BASE}/subsidiaries`);
      setSubsidiaries(res.data);
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
    setFormData({
      name: '',
      description: '',
      mission: '',
      vision: '',
      location: '',
      website: '',
      email: '',
      phone: '',
      phone_2: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (sub) => {
    setModalMode('edit');
    setFormData({
      id: sub.id,
      name: sub.name || '',
      description: sub.description || '',
      mission: sub.mission || '',
      vision: sub.vision || '',
      location: sub.location || '',
      website: sub.website || '',
      email: sub.email || '',
      phone: sub.phone || '',
      phone_2: sub.phone_2 || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        await axios.post(`${API_BASE}/subsidiaries`, formData);
      } else {
        await axios.put(`${API_BASE}/subsidiaries/${formData.id}`, formData);
      }
      setIsModalOpen(false);
      fetchSubsidiaries();
    } catch (err) {
      console.error(err);
      alert('Error saving subsidiary');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await axios.delete(`${API_BASE}/subsidiaries/${deleteTarget}`);
      setDeleteTarget(null);
      fetchSubsidiaries();
    } catch (err) {
      console.error(err);
      alert('Error deleting subsidiary');
    }
  };

  const filteredSubsidiaries = subsidiaries.filter(sub => 
    sub.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Building2 className="w-8 h-8 text-brand-red" />
            Subsidiary Management
          </h1>
          <p className="text-slate-500 font-medium mt-2">
            Managing <span className="font-black text-slate-900">{subsidiaries.length}</span> group sectors & subsidiaries
          </p>
        </div>
        
        <button 
          onClick={openAddModal}
          className="bg-brand-red text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-red-700 transition-colors shadow-lg shadow-brand-red/20"
        >
          <Plus className="w-5 h-5" />
          Add Subsidiary
        </button>
      </div>



      <div className="bg-white rounded-[24px] border border-slate-100 shadow-sm p-6 mb-8">
        <div className="relative max-w-md">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search subsidiaries..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-red/20 transition-all font-medium"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-brand-red rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubsidiaries.map(sub => (
            <div key={sub.id} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative group">
              <div className="absolute top-6 right-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => openEditModal(sub)}
                  className="p-2 bg-slate-50 text-slate-600 hover:text-brand-red rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setDeleteTarget(sub.id)}
                  className="p-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-4 border border-slate-100">
                <Building2 className="w-7 h-7" />
              </div>

              <h3 className="text-xl font-black text-slate-900 mb-2 pr-16 leading-tight">{sub.name}</h3>
              <p className="text-sm text-slate-500 line-clamp-2 mb-6 h-10">{sub.description}</p>
              
              <div className="space-y-3">
                {sub.location && (
                  <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{sub.location}</span>
                  </div>
                )}
                {(sub.phone || sub.phone_2) && (
                  <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>
                      {sub.phone || '—'}
                      {sub.phone_2 ? ` / ${sub.phone_2}` : ''}
                    </span>
                  </div>
                )}
                {sub.email && (
                  <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{sub.email}</span>
                  </div>
                )}
                {sub.website && (
                  <div className="flex items-center gap-3 text-sm text-brand-red font-medium">
                    <Globe className="w-4 h-4" />
                    <a href={sub.website.startsWith('http') ? sub.website : `https://${sub.website}`} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">
                      {sub.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[32px] shadow-2xl overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0">
              <h2 className="text-2xl font-black text-slate-900">
                {modalMode === 'add' ? 'Add Subsidiary' : 'Edit Subsidiary'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 p-0">
              <form onSubmit={handleSubmit} className="p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Subsidiary Name *</label>
                  <input 
                    type="text" 
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-red/20 font-medium" 
                  />
                </div>
                
                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-red/20 font-medium" 
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Phone Number 1</label>
                  <input 
                    type="text" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-red/20 font-medium" 
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Website</label>
                  <input 
                    type="text" 
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="e.g. www.example.com"
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-red/20 font-medium" 
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Phone Number 2</label>
                  <input 
                    type="text" 
                    name="phone_2"
                    value={formData.phone_2}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-red/20 font-medium" 
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Location / Address</label>
                  <input 
                    type="text" 
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-red/20 font-medium" 
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Description</label>
                  <textarea 
                    name="description"
                    rows="2"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-red/20 font-medium resize-none" 
                  ></textarea>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Mission</label>
                  <textarea 
                    name="mission"
                    rows="2"
                    value={formData.mission}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-red/20 font-medium resize-none" 
                  ></textarea>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Vision</label>
                  <textarea 
                    name="vision"
                    rows="2"
                    value={formData.vision}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-brand-red/20 font-medium resize-none" 
                  ></textarea>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-8 py-3 bg-brand-red text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-brand-red/20">
                  {modalMode === 'add' ? 'Add Subsidiary' : 'Save Changes'}
                </button>
              </div>
            </form>
            
            {modalMode === 'edit' && formData.id && (
              <div className="px-6 md:px-8 pb-8">
                <DirectorsManager subsidiaryId={formData.id} />
              </div>
            )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[32px] p-8 text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Delete Subsidiary?</h2>
            <p className="text-slate-500 font-medium mb-8">
              This action cannot be undone. This might affect users and posts associated with this subsidiary.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 py-4 bg-slate-50 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors">
                Cancel
              </button>
              <button onClick={handleDelete} className="flex-1 py-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20">
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminSubsidiaries;
