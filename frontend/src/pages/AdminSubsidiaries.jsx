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
  AlertTriangle,
  Users,
  Eye
} from 'lucide-react';
import DirectorsManager from '../components/DirectorsManager';

const API_BASE = 'http://localhost:5000/api';

// Rank definitions based on job title
const getJobRank = (title) => {
  if (!title) return 6; // Default rank for empty title
  
  const lower = title.toLowerCase();
  
  // Rank 1: Top leadership / Chairman / CEO / President
  if (lower.includes('chairman') || lower.includes('chief executive') || lower === 'ceo' || lower.includes('managing director')) {
    return 1;
  }
  // Rank 2: Executive Directors / COOs / CFOs / CTOs
  if (lower.includes('director') || lower === 'coo' || lower === 'cfo' || lower === 'cto' || lower.includes('chief financial') || lower.includes('chief technology') || lower.includes('chief operating')) {
    return 2;
  }
  // Rank 3: GMs / Heads / VPs / Deputy heads
  if (lower.includes('head of') || lower.includes('general manager') || lower.includes('gm') || lower.includes('vice president') || lower.includes('deputy')) {
    return 3;
  }
  // Rank 4: Managers / Leads / Specialists
  if (lower.includes('manager') || lower.includes('lead') || lower.includes('specialist')) {
    return 4;
  }
  // Rank 5: Executives / Engineers / Officers / Accountants
  if (lower.includes('executive') || lower.includes('engineer') || lower.includes('officer') || lower.includes('accountant') || lower.includes('coordinator') || lower.includes('consultant')) {
    return 5;
  }
  // Rank 6: Assistants / Associates / Juniors / Interns / Trainees / Support / Other
  return 6;
};

// Build hierarchical tree recursively
const buildHierarchyTree = (employees) => {
  if (!employees || employees.length === 0) return null;
  
  const rankedEmployees = employees.map(emp => ({
    ...emp,
    rank: getJobRank(emp.job_title),
    children: []
  }));

  rankedEmployees.sort((a, b) => a.rank - b.rank);

  const minRank = Math.min(...rankedEmployees.map(e => e.rank));
  const rootNodes = rankedEmployees.filter(e => e.rank === minRank);
  const remainingNodes = rankedEmployees.filter(e => e.rank > minRank);

  const getDeptKey = (dept) => (dept || '').trim().toLowerCase();

  remainingNodes.forEach(node => {
    const nodeDept = getDeptKey(node.department);
    const potentialParents = rankedEmployees.filter(p => p.rank < node.rank);
    
    if (potentialParents.length === 0) return;

    // A: Try to find a parent of the immediate higher rank (Rank_node - 1) in the SAME department
    let parent = potentialParents.find(p => p.rank === node.rank - 1 && getDeptKey(p.department) === nodeDept);
    
    // B: Fall back to ANY higher rank in the SAME department
    if (!parent) {
      parent = potentialParents.find(p => getDeptKey(p.department) === nodeDept);
    }
    
    // C: Fall back to immediate higher rank (Rank_node - 1) regardless of department
    if (!parent) {
      parent = potentialParents.find(p => p.rank === node.rank - 1);
    }
    
    // D: Fall back to the absolute highest root node
    if (!parent) {
      parent = rootNodes[0];
    }
    
    if (parent) {
      parent.children.push(node);
    }
  });

  return rootNodes;
};

// OrgTreeNode recursive component
const OrgTreeNode = ({ node, isCompact = false }) => {
  const finalName = node.full_name;
  const jobTitle = node.job_title || 'Employee';
  const department = node.department || '';

  const imgUrl = node.is_synced 
    ? `http://localhost:5000/api/users/office365/photo/${node.email}`
    : (node.profile_pic 
        ? (node.profile_pic.startsWith('http') ? node.profile_pic : `http://localhost:5000/uploads/${node.profile_pic}`)
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(finalName)}&background=f1f5f9&color=475569&bold=true`);

  return (
    <div className="flex flex-col items-center">
      {/* Card Visual Layout matching user image template */}
      <div className="bg-white border-t-4 border-t-[#C8102E] border-x border-b border-slate-100 shadow-md hover:shadow-lg rounded-[20px] p-5 flex flex-col items-center text-center w-56 relative group transition-all shrink-0">
        <div className="w-16 h-20 rounded-2xl overflow-hidden border border-slate-200 shadow-sm mb-3 shrink-0 flex items-center justify-center bg-slate-50 relative">
          <img 
            src={imgUrl} 
            alt={finalName} 
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(finalName)}&background=f1f5f9&color=475569&bold=true`;
            }}
          />
        </div>
        
        {/* Job Title Badge */}
        <div className="bg-red-50 text-[#C8102E] font-black text-[9px] px-3 py-1.5 rounded-full uppercase tracking-wider mb-2.5 leading-none max-w-full truncate" title={jobTitle}>
          {jobTitle}
        </div>
        
        {/* Name */}
        <h4 className="font-black text-slate-800 text-sm truncate w-full leading-tight">{finalName}</h4>
        
        {/* Department / Email */}
        {department && (
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 truncate w-full leading-none">{department}</p>
        )}
      </div>
      
      {/* Connectors to children (skip if compact mode) */}
      {!isCompact && node.children && node.children.length > 0 && (
        <div className="flex flex-col items-center w-full">
          {/* Vertical drop line directly below card */}
          <div className="w-px h-6 bg-slate-200"></div>
          
          {node.children.length <= 10 ? (
            /* Standard Tree Row Layout */
            <div className="flex justify-center w-full relative">
              <div className="flex gap-8 relative">
                {node.children.map((child, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === node.children.length - 1;
                  return (
                    <div key={child.id} className="relative pt-6">
                      {/* Top connector lines alignment */}
                      <div className="absolute top-0 left-0 right-0 flex justify-center h-6">
                        {/* Left horizontal line */}
                        <div className={`flex-1 border-t border-slate-200 ${isFirst ? 'invisible' : ''}`} />
                        {/* Vertical line drop */}
                        <div className="w-px border-l border-slate-200" />
                        {/* Right horizontal line */}
                        <div className={`flex-1 border-t border-slate-200 ${isLast ? 'invisible' : ''}`} />
                      </div>
                      <OrgTreeNode node={child} />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Wrapped Grid Layout for > 10 children (e.g. 10x10 grid format) */
            <div className="bg-slate-100/50 border border-slate-200/50 rounded-[28px] p-6 max-w-full shadow-inner mt-2 flex flex-col items-center">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                Direct Reports ({node.children.length} employees)
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-4 justify-center">
                {node.children.map(child => (
                  <OrgTreeNode key={child.id} node={child} isCompact={true} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

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

  // Org Chart Modal States
  const [isTreeModalOpen, setIsTreeModalOpen] = useState(false);
  const [treeSubName, setTreeSubName] = useState('');
  const [treeEmployees, setTreeEmployees] = useState([]);
  const [treeLoading, setTreeLoading] = useState(false);
  const [zoom, setZoom] = useState(1);

  const openTreeModal = async (sub) => {
    setTreeSubName(sub.name);
    setTreeLoading(true);
    setIsTreeModalOpen(true);
    setZoom(1);
    try {
      const res = await axios.get(`http://localhost:5000/api/users?subsidiaryId=${sub.id}`);
      setTreeEmployees(res.data);
    } catch (err) {
      console.error('Failed to load employees for hierarchy', err);
      alert('Failed to load employees');
    } finally {
      setTreeLoading(false);
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 1.5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.1));
  const handleZoomReset = () => setZoom(1);

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
              <div className="absolute top-6 right-6">
                {/* Staff Count Badge (visible when not hovering) */}
                <div className="group-hover:opacity-0 transition-opacity duration-200 bg-slate-50 border border-slate-100 text-slate-600 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{sub.employees || 0}</span>
                </div>
                
                {/* Hover Actions (visible on hover) */}
                <div className="absolute right-0 top-0 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white pl-2">
                  <button 
                    onClick={() => openTreeModal(sub)}
                    className="p-2 bg-slate-50 text-slate-600 hover:text-brand-red rounded-lg transition-colors"
                    title="View Org Chart"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
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

      {/* Org Chart Modal */}
      {isTreeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-6xl h-[90vh] flex flex-col rounded-[32px] shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="text-2xl font-black text-slate-900">{treeSubName}</h2>
                <p className="text-xs text-slate-500 font-medium mt-1">Organizational Chart & Hierarchy</p>
              </div>
              <button 
                onClick={() => setIsTreeModalOpen(false)} 
                className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Modal Body */}
            {treeLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400 font-medium bg-slate-50">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-brand-red rounded-full animate-spin"></div>
                Loading organizational tree...
              </div>
            ) : treeEmployees.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50">
                <Users className="w-12 h-12 text-slate-350 mb-3" />
                <h3 className="text-lg font-bold text-slate-700">No active employees found</h3>
                <p className="text-sm text-slate-400 max-w-sm mt-1">
                  There are no active synced or manual employees listed for this subsidiary in the directory.
                </p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0 relative bg-slate-50">
                {/* Scrollable Canvas for Tree */}
                <div className="flex-1 overflow-auto p-12 bg-slate-50 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] flex justify-center items-start custom-scrollbar">
                  <div 
                    style={{ 
                      transform: `scale(${zoom})`, 
                      transformOrigin: 'top center',
                      transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)' 
                    }}
                    className="flex justify-center"
                  >
                    {/* Render the dynamic tree */}
                    {(() => {
                      const roots = buildHierarchyTree(treeEmployees);
                      if (!roots || roots.length === 0) return null;
                      return (
                        <div className="flex gap-16 justify-center">
                          {roots.map(root => (
                            <OrgTreeNode key={root.id} node={root} />
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Floating Zoom Controls */}
                <div className="absolute bottom-6 right-6 flex items-center gap-2 bg-white/80 backdrop-blur-md border border-slate-100 p-2 rounded-2xl shadow-lg z-10">
                  <button 
                    onClick={handleZoomOut} 
                    className="p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors font-bold text-lg leading-none w-10 h-10 flex items-center justify-center border border-slate-100"
                    title="Zoom Out"
                  >
                    -
                  </button>
                  <span className="text-xs font-black text-slate-700 w-12 text-center select-none">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button 
                    onClick={handleZoomIn} 
                    className="p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors font-bold text-lg leading-none w-10 h-10 flex items-center justify-center border border-slate-100"
                    title="Zoom In"
                  >
                    +
                  </button>
                  <button 
                    onClick={handleZoomReset} 
                    className="px-3 py-2 text-xs font-black text-brand-red bg-red-50 hover:bg-brand-red hover:text-white rounded-xl transition-all shadow-sm"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminSubsidiaries;
