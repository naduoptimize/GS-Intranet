import { useState, useEffect, useRef } from 'react';
import AdminPageHeader from '../components/AdminPageHeader';
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
  Eye,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Layers,
  Sparkles
} from 'lucide-react';
import DirectorsManager from '../components/DirectorsManager';

const API_BASE = 'http://localhost:5000/api';

// Helper to resolve image paths (uploads, local assets, external URLs)
const resolveImgUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/uploads/')) return `http://localhost:5000${url}`;
  if (url.startsWith('uploads/')) return `http://localhost:5000/${url}`;
  return url;
};

// Fallback covers for common entities
const getFallbackCover = (name) => {
  const low = (name || '').toLowerCase();
  if (low.includes('health') || low.includes('pharma')) return '/health_cover.png';
  if (low.includes('insurance')) return '/insurance_cover.png';
  if (low.includes('invest')) return '/finance_cover.png';
  if (low.includes('tea') && !low.includes('heladiv')) return '/gs_teas_cover.png';
  if (low.includes('heladiv')) return '/export_cover.png';
  if (low.includes('travel')) return '/travel_cover.png';
  if (low.includes('citrus') || low.includes('leisure')) return '/citrus_hero.png';
  if (low.includes('consumer')) return '/consumer_cover.png';
  if (low.includes('solution') || low.includes('industrial')) return '/industrial_premium.png';
  if (low.includes('recruit')) return '/recruitment_premium.png';
  return '/sub_1.png';
};

// Common sectors in George Steuart Group
const SECTOR_OPTIONS = [
  'Holding',
  'Healthcare',
  'Finance',
  'Tea & Export',
  'FMCG & Consumer',
  'Leisure & Hospitality',
  'Industrial & Solutions',
  'Travel & Aviation',
  'Recruitment & Services',
  'IT & Digital',
  'Other'
];

// Rank definitions based on job title for Org Chart
const getJobRank = (title) => {
  if (!title) return 6;
  const lower = title.toLowerCase();
  if (lower.includes('chairman') || lower.includes('chief executive') || lower === 'ceo' || lower.includes('managing director')) {
    return 1;
  }
  if (lower.includes('director') || lower === 'coo' || lower === 'cfo' || lower === 'cto' || lower.includes('chief financial') || lower.includes('chief technology') || lower.includes('chief operating')) {
    return 2;
  }
  if (lower.includes('head of') || lower.includes('general manager') || lower.includes('gm') || lower.includes('vice president') || lower.includes('deputy')) {
    return 3;
  }
  if (lower.includes('manager') || lower.includes('lead') || lower.includes('specialist')) {
    return 4;
  }
  if (lower.includes('executive') || lower.includes('engineer') || lower.includes('officer') || lower.includes('accountant') || lower.includes('coordinator') || lower.includes('consultant')) {
    return 5;
  }
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

    let parent = potentialParents.find(p => p.rank === node.rank - 1 && getDeptKey(p.department) === nodeDept);
    if (!parent) {
      parent = potentialParents.find(p => getDeptKey(p.department) === nodeDept);
    }
    if (!parent) {
      parent = potentialParents.find(p => p.rank === node.rank - 1);
    }
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
      <div className="bg-white border-t-4 border-t-[#C41230] border-x border-b border-slate-100 shadow-md hover:shadow-lg rounded-[20px] p-5 flex flex-col items-center text-center w-56 relative group transition-all shrink-0">
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
        
        <div className="bg-red-50 text-[#C41230] font-black text-[9px] px-3 py-1.5 rounded-full uppercase tracking-wider mb-2.5 leading-none max-w-full truncate" title={jobTitle}>
          {jobTitle}
        </div>
        
        <h4 className="font-black text-slate-800 text-sm truncate w-full leading-tight">{finalName}</h4>
        
        {department && (
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 truncate w-full leading-none">{department}</p>
        )}
      </div>
      
      {!isCompact && node.children && node.children.length > 0 && (
        <div className="flex flex-col items-center w-full">
          <div className="w-px h-6 bg-slate-200"></div>
          
          {node.children.length <= 10 ? (
            <div className="flex justify-center w-full relative">
              <div className="flex gap-8 relative">
                {node.children.map((child, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === node.children.length - 1;
                  return (
                    <div key={child.id} className="relative pt-6">
                      <div className="absolute top-0 left-0 right-0 flex justify-center h-6">
                        <div className={`flex-1 border-t border-slate-200 ${isFirst ? 'invisible' : ''}`} />
                        <div className="w-px border-l border-slate-200" />
                        <div className={`flex-1 border-t border-slate-200 ${isLast ? 'invisible' : ''}`} />
                      </div>
                      <OrgTreeNode node={child} />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
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

const initialFormData = {
  name: '',
  category: 'Holding',
  description: '',
  mission: '',
  vision: '',
  highlights: '',
  location: '',
  website: '',
  email: '',
  phone: '',
  phone_2: '',
  employees: '',
  cover_image: '',
  logo_url: '',
  status: 'Active'
};

const AdminSubsidiaries = () => {
  const [subsidiaries, setSubsidiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [formData, setFormData] = useState(initialFormData);
  const [submitting, setSubmitting] = useState(false);

  // File upload states & previews
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');

  const coverFileInputRef = useRef(null);
  const logoFileInputRef = useRef(null);

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

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveCover = () => {
    setCoverFile(null);
    setCoverPreview('');
    setFormData(prev => ({ ...prev, cover_image: '' }));
    if (coverFileInputRef.current) coverFileInputRef.current.value = '';
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
    setFormData(prev => ({ ...prev, logo_url: '' }));
    if (logoFileInputRef.current) logoFileInputRef.current.value = '';
  };

  const openAddModal = () => {
    setModalMode('add');
    setCoverFile(null);
    setLogoFile(null);
    setCoverPreview('');
    setLogoPreview('');
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  const openEditModal = (sub) => {
    setModalMode('edit');
    setCoverFile(null);
    setLogoFile(null);
    setCoverPreview(sub.cover_image ? resolveImgUrl(sub.cover_image) : '');
    setLogoPreview(sub.logo_url ? resolveImgUrl(sub.logo_url) : '');
    setFormData({
      id: sub.id,
      name: sub.name || '',
      category: sub.category || 'Holding',
      description: sub.description || '',
      mission: sub.mission || '',
      vision: sub.vision || '',
      highlights: sub.highlights || '',
      location: sub.location || '',
      website: sub.website || '',
      email: sub.email || '',
      phone: sub.phone || '',
      phone_2: sub.phone_2 || '',
      employees: sub.employees ?? '',
      cover_image: sub.cover_image || '',
      logo_url: sub.logo_url || '',
      status: sub.status || 'Active'
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Subsidiary Name is required');
      return;
    }

    setSubmitting(true);
    try {
      let finalCoverUrl = formData.cover_image;
      let finalLogoUrl = formData.logo_url;

      // 1. Upload Cover Image if selected
      if (coverFile) {
        const coverData = new FormData();
        coverData.append('image', coverFile);
        const coverRes = await axios.post(`${API_BASE}/uploads/image`, coverData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (coverRes.data?.imageUrl) {
          finalCoverUrl = coverRes.data.imageUrl;
        }
      }

      // 2. Upload Logo Image if selected
      if (logoFile) {
        const logoData = new FormData();
        logoData.append('image', logoFile);
        const logoRes = await axios.post(`${API_BASE}/uploads/image`, logoData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (logoRes.data?.imageUrl) {
          finalLogoUrl = logoRes.data.imageUrl;
        }
      }

      const payload = {
        ...formData,
        cover_image: finalCoverUrl,
        logo_url: finalLogoUrl
      };

      if (modalMode === 'add') {
        await axios.post(`${API_BASE}/subsidiaries`, payload);
      } else {
        await axios.put(`${API_BASE}/subsidiaries/${formData.id}`, payload);
      }

      setIsModalOpen(false);
      await fetchSubsidiaries();
    } catch (err) {
      console.error(err);
      alert('Error saving subsidiary: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
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

  const filteredSubsidiaries = subsidiaries.filter(sub => {
    const matchesSearch = 
      sub.name?.toLowerCase().includes(search.toLowerCase()) ||
      sub.category?.toLowerCase().includes(search.toLowerCase()) ||
      sub.location?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = 
      statusFilter === 'All' ? true :
      statusFilter === 'Active' ? (sub.status === 'Active' || sub.is_active === 1 || sub.is_active === true) :
      (sub.status === 'Inactive' || sub.is_active === 0 || sub.is_active === false);

    const matchesCategory = 
      categoryFilter === 'All' ? true :
      sub.category?.toLowerCase() === categoryFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="min-h-screen pb-16">
      <AdminPageHeader
        icon={Building2}
        title="Subsidiaries Manager"
        description="Create, edit, and manage all group subsidiary companies with custom branding, covers, and details."
        actions={
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-[#C41230] hover:bg-[#a50f28] text-white text-xs sm:text-sm font-bold px-4 py-2.5 rounded-xl shadow-md shadow-brand-red/20 transition-all cursor-pointer active:scale-95"
          >
            <Plus className="h-4 w-4" /> Add Subsidiary
          </button>
        }
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search subsidiaries by name, sector, location..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-700 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-brand-red/10 focus:border-brand-red transition-all shadow-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sector Filter */}
          <div className="flex items-center gap-2 bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-white/10 rounded-2xl px-3.5 py-2.5 shadow-sm text-xs font-medium text-slate-600 dark:text-slate-300">
            <span className="text-slate-400">Sector:</span>
            <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-white font-semibold outline-none cursor-pointer pr-1"
            >
              <option value="All">All Sectors</option>
              {SECTOR_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-white/10 rounded-2xl px-3.5 py-2.5 shadow-sm text-xs font-medium text-slate-600 dark:text-slate-300">
            <span className="text-slate-400">Status:</span>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-white font-semibold outline-none cursor-pointer pr-1"
            >
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-12 h-12 border-4 border-slate-200 border-t-brand-red rounded-full animate-spin"></div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Subsidiaries...</p>
        </div>
      ) : filteredSubsidiaries.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-100 text-center shadow-sm">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No subsidiaries found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {search ? 'Try clearing your search query or filters.' : 'Click "Add Subsidiary" above to register your first subsidiary company.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubsidiaries.map(sub => {
            const coverSrc = resolveImgUrl(sub.cover_image) || getFallbackCover(sub.name);
            const logoSrc = resolveImgUrl(sub.logo_url);
            const isActive = sub.status !== 'Inactive' && sub.is_active !== 0;

            return (
              <div 
                key={sub.id} 
                className="bg-white rounded-[24px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-brand-red/20 transition-all duration-300 overflow-hidden flex flex-col group"
              >
                {/* Cover Image Banner */}
                <div className="relative h-40 bg-slate-100 overflow-hidden shrink-0">
                  <img 
                    src={coverSrc} 
                    alt={sub.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    onError={(e) => {
                      e.target.src = getFallbackCover(sub.name);
                    }}
                  />
                  {/* Gradient Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                  
                  {/* Status Badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider backdrop-blur-md bg-black/40 text-white border border-white/20">
                    <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-slate-400'}`}></span>
                    {sub.status || 'Active'}
                  </div>

                  {/* Actions Bar (Top-Right) */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openTreeModal(sub)}
                      className="p-2 bg-white/90 hover:bg-white text-slate-700 hover:text-brand-red rounded-xl backdrop-blur-sm shadow-sm transition-all cursor-pointer"
                      title="View Org Chart"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => openEditModal(sub)}
                      className="p-2 bg-white/90 hover:bg-white text-slate-700 hover:text-brand-red rounded-xl backdrop-blur-sm shadow-sm transition-all cursor-pointer"
                      title="Edit Subsidiary"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => setDeleteTarget(sub.id)}
                      className="p-2 bg-red-500/90 hover:bg-red-600 text-white rounded-xl backdrop-blur-sm shadow-sm transition-all cursor-pointer"
                      title="Delete Subsidiary"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Sector Tag & Staff Count (Bottom of Banner) */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-2">
                    {sub.category && (
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/30">
                        {sub.category}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-black/40 backdrop-blur-md text-white/90 flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-300" />
                      {sub.staff_count ?? sub.employees ?? 0}
                    </span>
                  </div>

                  {/* Logo Badge (Floating Overlap) */}
                  <div className="absolute -bottom-5 left-5 w-14 h-14 rounded-2xl bg-white p-1.5 shadow-lg border border-slate-100 flex items-center justify-center overflow-hidden z-10 group-hover:scale-105 transition-transform duration-300">
                    {logoSrc ? (
                      <img src={logoSrc} alt={sub.name} className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full bg-red-50 text-brand-red font-black text-sm rounded-xl flex items-center justify-center uppercase">
                        {sub.name.slice(0, 2)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Content Body */}
                <div className="p-6 pt-8 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 group-hover:text-brand-red transition-colors leading-tight line-clamp-1 mb-1.5" title={sub.name}>
                      {sub.name}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 min-h-[32px] leading-relaxed mb-4">
                      {sub.description || 'No description provided.'}
                    </p>

                    <div className="space-y-2 text-xs text-slate-600 font-medium pt-2 border-t border-slate-100">
                      {sub.location && (
                        <div className="flex items-center gap-2.5 text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{sub.location}</span>
                        </div>
                      )}
                      {(sub.phone || sub.phone_2) && (
                        <div className="flex items-center gap-2.5 text-slate-600">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">
                            {sub.phone || '—'}
                            {sub.phone_2 ? ` / ${sub.phone_2}` : ''}
                          </span>
                        </div>
                      )}
                      {sub.email && (
                        <div className="flex items-center gap-2.5 text-slate-600">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{sub.email}</span>
                        </div>
                      )}
                      {sub.website && (
                        <div className="flex items-center gap-2.5 text-brand-red font-semibold">
                          <Globe className="w-3.5 h-3.5 shrink-0" />
                          <a 
                            href={sub.website.startsWith('http') ? sub.website : `https://${sub.website}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="hover:underline truncate"
                          >
                            {sub.website}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Highlights Snippet if available */}
                  {sub.highlights && (
                    <div className="mt-4 pt-3 border-t border-slate-50">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Highlights</p>
                      <p className="text-[11px] text-slate-600 line-clamp-1 italic">
                        {sub.highlights}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Subsidiary Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-3xl max-h-[92vh] flex flex-col rounded-[32px] shadow-2xl overflow-hidden border border-slate-100">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 shrink-0 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-50 text-brand-red flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 leading-tight">
                    {modalMode === 'add' ? 'Add New Subsidiary' : 'Edit Subsidiary'}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    {modalMode === 'add' 
                      ? 'Upload branding images and configure corporate entity details.' 
                      : `Update details and assets for ${formData.name || 'subsidiary'}.`}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Form Scrollable Body */}
            <div className="overflow-y-auto flex-1 p-6 md:p-8 space-y-6">
              <form onSubmit={handleSubmit} id="subsidiaryForm" className="space-y-6">
                
                {/* 1. BRANDING & MEDIA SECTION */}
                <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-100 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-brand-red" /> Branding & Media Assets
                    </span>
                  </div>

                  {/* Cover Image Upload Area */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Subsidiary Cover Banner (Header Image)
                    </label>
                    
                    {coverPreview ? (
                      <div className="relative h-44 rounded-2xl overflow-hidden border border-slate-200 group">
                        <img src={coverPreview} alt="Cover Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => coverFileInputRef.current?.click()}
                            className="px-3 py-1.5 bg-white text-slate-800 rounded-xl font-bold text-xs shadow-md hover:bg-slate-50 cursor-pointer"
                          >
                            Change Image
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveCover}
                            className="px-3 py-1.5 bg-red-500 text-white rounded-xl font-bold text-xs shadow-md hover:bg-red-600 cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={() => coverFileInputRef.current?.click()}
                        className="h-36 rounded-2xl border-2 border-dashed border-slate-200 hover:border-brand-red/50 bg-white flex flex-col items-center justify-center cursor-pointer transition-colors p-4 text-center group"
                      >
                        <div className="w-10 h-10 rounded-full bg-red-50 text-brand-red flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                          <Upload className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-700">Click to upload cover image</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Recommended: 1200x600px (JPG, PNG, WebP)</p>
                      </div>
                    )}
                    <input 
                      type="file" 
                      ref={coverFileInputRef} 
                      onChange={handleCoverChange} 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </div>

                  {/* Logo Image Upload Area */}
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Subsidiary Logo (Icon / Emblem)
                    </label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
                        {logoPreview ? (
                          <img src={logoPreview} alt="Logo Preview" className="w-full h-full object-contain p-1" />
                        ) : (
                          <Building2 className="w-7 h-7 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => logoFileInputRef.current?.click()}
                          className="px-4 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold text-slate-700 shadow-sm transition-all cursor-pointer"
                        >
                          {logoPreview ? 'Change Logo' : 'Upload Logo'}
                        </button>
                        {logoPreview && (
                          <button
                            type="button"
                            onClick={handleRemoveLogo}
                            className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          >
                            Remove Logo
                          </button>
                        )}
                        <input 
                          type="file" 
                          ref={logoFileInputRef} 
                          onChange={handleLogoChange} 
                          accept="image/*" 
                          className="hidden" 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. GENERAL INFO SECTION */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      Subsidiary Name *
                    </label>
                    <input 
                      type="text" 
                      name="name"
                      required
                      placeholder="e.g. George Steuart Health"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red font-medium text-sm outline-none transition-all" 
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      Sector / Category
                    </label>
                    <select 
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red font-medium text-sm outline-none transition-all cursor-pointer"
                    >
                      {SECTOR_OPTIONS.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      Status
                    </label>
                    <select 
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red font-medium text-sm outline-none transition-all cursor-pointer"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      Email Address
                    </label>
                    <input 
                      type="email" 
                      name="email"
                      placeholder="e.g. info@gshealth.lk"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red font-medium text-sm outline-none transition-all" 
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      Website URL
                    </label>
                    <input 
                      type="text" 
                      name="website"
                      placeholder="e.g. www.gshealth.lk"
                      value={formData.website}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red font-medium text-sm outline-none transition-all" 
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      Phone Number 1
                    </label>
                    <input 
                      type="text" 
                      name="phone"
                      placeholder="e.g. +94 11 234 5678"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red font-medium text-sm outline-none transition-all" 
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      Phone Number 2 (Optional)
                    </label>
                    <input 
                      type="text" 
                      name="phone_2"
                      placeholder="e.g. +94 11 234 5679"
                      value={formData.phone_2}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red font-medium text-sm outline-none transition-all" 
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      Location / Headquarters
                    </label>
                    <input 
                      type="text" 
                      name="location"
                      placeholder="e.g. Steuart House, Colombo 03"
                      value={formData.location}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red font-medium text-sm outline-none transition-all" 
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      Estimated Staff Count
                    </label>
                    <input 
                      type="number" 
                      name="employees"
                      placeholder="e.g. 150"
                      value={formData.employees}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red font-medium text-sm outline-none transition-all" 
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      Description / Overview
                    </label>
                    <textarea 
                      name="description"
                      rows="2"
                      placeholder="A short overview of the subsidiary's primary business activities and history..."
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red font-medium text-sm outline-none transition-all resize-none" 
                    ></textarea>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      Key Highlights / Accolades
                    </label>
                    <input 
                      type="text" 
                      name="highlights"
                      placeholder="e.g. Founded in 1835; 70+ Global Partners; ISO Certified"
                      value={formData.highlights}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red font-medium text-sm outline-none transition-all" 
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      Mission Statement
                    </label>
                    <textarea 
                      name="mission"
                      rows="2"
                      placeholder="Corporate mission statement..."
                      value={formData.mission}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red font-medium text-sm outline-none transition-all resize-none" 
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
                      Vision Statement
                    </label>
                    <textarea 
                      name="vision"
                      rows="2"
                      placeholder="Corporate vision statement..."
                      value={formData.vision}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-xl focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red font-medium text-sm outline-none transition-all resize-none" 
                    ></textarea>
                  </div>
                </div>

                {/* Submit Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)} 
                    disabled={submitting}
                    className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors cursor-pointer text-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className="flex items-center gap-2 px-8 py-2.5 bg-brand-red text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-brand-red/20 cursor-pointer text-sm active:scale-95 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                      </>
                    ) : (
                      modalMode === 'add' ? 'Create Subsidiary' : 'Save Changes'
                    )}
                  </button>
                </div>
              </form>
              
              {/* Directors Manager in Edit Mode */}
              {modalMode === 'edit' && formData.id && (
                <div className="pt-6 border-t border-slate-100">
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
              <button 
                onClick={() => setDeleteTarget(null)} 
                className="flex-1 py-4 bg-slate-50 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete} 
                className="flex-1 py-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 cursor-pointer"
              >
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
            <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="text-2xl font-black text-slate-900">{treeSubName}</h2>
                <p className="text-xs text-slate-500 font-medium mt-1">Organizational Chart & Hierarchy</p>
              </div>
              <button 
                onClick={() => setIsTreeModalOpen(false)} 
                className="p-2 text-slate-400 hover:bg-slate-50 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {treeLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400 font-medium bg-slate-50">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-brand-red rounded-full animate-spin"></div>
                Loading organizational tree...
              </div>
            ) : treeEmployees.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50">
                <Users className="w-12 h-12 text-slate-300 mb-3" />
                <h3 className="text-lg font-bold text-slate-700">No active employees found</h3>
                <p className="text-sm text-slate-400 max-w-sm mt-1">
                  There are no active synced or manual employees listed for this subsidiary in the directory.
                </p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0 relative bg-slate-50">
                <div className="flex-1 overflow-auto p-12 bg-slate-50 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] flex justify-center items-start custom-scrollbar">
                  <div 
                    style={{ 
                      transform: `scale(${zoom})`, 
                      transformOrigin: 'top center',
                      transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)' 
                    }}
                    className="flex justify-center"
                  >
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
                    className="p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors font-bold text-lg leading-none w-10 h-10 flex items-center justify-center border border-slate-100 cursor-pointer"
                    title="Zoom Out"
                  >
                    -
                  </button>
                  <span className="text-xs font-black text-slate-700 w-12 text-center select-none">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button 
                    onClick={handleZoomIn} 
                    className="p-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors font-bold text-lg leading-none w-10 h-10 flex items-center justify-center border border-slate-100 cursor-pointer"
                    title="Zoom In"
                  >
                    +
                  </button>
                  <button 
                    onClick={handleZoomReset} 
                    className="px-3 py-2 text-xs font-black text-brand-red bg-red-50 hover:bg-brand-red hover:text-white rounded-xl transition-all shadow-sm cursor-pointer"
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
