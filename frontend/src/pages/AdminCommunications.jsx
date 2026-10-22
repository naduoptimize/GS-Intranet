import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import AdminPageHeader from '../components/AdminPageHeader';
import { 
  Megaphone, Gift, AlertTriangle, Building2, Globe,
  Plus, Search, Trash2, Edit2, X, Check, AlertCircle, RefreshCw,
  Calendar, Image as ImageIcon, Layers, Users, ThumbsUp, Heart, PartyPopper
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = 'http://localhost:5000/api';

// Gradient choices for staff offers
const OFFER_GRADIENTS = [
  { value: 'from-sky-500 via-cyan-400 to-teal-500',          label: 'Ocean Cyan' },
  { value: 'from-violet-500 via-purple-500 to-fuchsia-500',  label: 'Royal Purple' },
  { value: 'from-amber-500 via-orange-400 to-rose-500',      label: 'Sunset Gold' },
  { value: 'from-emerald-500 via-green-400 to-teal-500',     label: 'Emerald Green' },
  { value: 'from-rose-500 via-pink-500 to-red-500',          label: 'Crimson Rose' },
  { value: 'from-brand-red via-brand-red-dark to-brand-red', label: 'Corporate Heritage' },
];

const OFFER_CATEGORIES = ['Healthcare', 'Teas & FMCG', 'Travel & Leisure', 'Financial', 'Lifestyle', 'Education', 'General'];

const BLANK_ANNOUNCEMENT = {
  content: '',
  type: 'announcement',
  visibility: 'global',
  subsidiary_id: '',
  image_url: ''
};

const BLANK_OFFER = {
  category: 'Healthcare',
  badge: '20% OFF',
  title: '',
  description: '',
  cta: 'Claim Perk',
  gradient: OFFER_GRADIENTS[0].value,
  emoji: '🎁',
  valid_until: '',
  savings: '20% OFF',
  image_url: '',
  subsidiary_id: ''
};

const BLANK_ALERT = {
  title: '',
  message: '',
  type: 'info',
  color: 'blue',
  subsidiary_id: ''
};

const inputCls = "w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl font-bold text-slate-800 dark:text-white focus:ring-4 focus:ring-brand-red/10 focus:border-brand-red/40 outline-none transition-all placeholder:text-slate-400 text-xs sm:text-sm";

export default function AdminCommunications() {
  const { user } = useAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const isSuperOrGroupAdmin = user?.role === 'superadmin' || user?.role === 'super_admin' || user?.role === 'groupadmin' || user?.role === 'group_admin';
  const isSubAdmin = user?.role === 'subadmin' || user?.role === 'sub_admin';

  // State
  const [activeTab, setActiveTab] = useState(() => {
    const requestedTab = searchParams.get('tab');
    if (['announcements', 'offers', 'alerts', 'all'].includes(requestedTab)) return requestedTab;
    if (location.pathname.endsWith('/alerts')) return 'alerts';
    if (location.pathname.endsWith('/offers')) return 'offers';
    return 'all';
  });
  const [announcements, setAnnouncements] = useState([]);
  const [offers, setOffers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [subsidiaries, setSubsidiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSubFilter, setSelectedSubFilter] = useState('all');
  const [toast, setToast] = useState(null);
  const [reactionSummaries, setReactionSummaries] = useState({});
  const [reactionViewer, setReactionViewer] = useState(null);
  const [reactionUsers, setReactionUsers] = useState([]);
  const [loadingReactions, setLoadingReactions] = useState(false);

  // Modal states
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [announcementForm, setAnnouncementForm] = useState(BLANK_ANNOUNCEMENT);

  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [offerForm, setOfferForm] = useState(BLANK_OFFER);

  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [alertForm, setAlertForm] = useState(BLANK_ALERT);

  const [deleteTarget, setDeleteTarget] = useState(null); // { id, type: 'announcement'|'offer'|'alert', title }
  const [submitting, setSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  // ── LOAD ALL DATA ──────────────────────────────────────────
  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const fetchAllData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const queryParams = {
        role: user.role,
        subsidiary_id: isSuperOrGroupAdmin ? 'all' : user.subsidiary_id,
        user_id: user.id
      };

      const [postsRes, offersRes, alertsRes, subsRes, reactionsRes] = await Promise.all([
        axios.get(`${API}/posts`, { params: queryParams }),
        axios.get(`${API}/offers`, { params: queryParams }),
        axios.get(`${API}/alerts`, { params: queryParams }),
        axios.get(`${API}/subsidiaries`),
        axios.get(`${API}/communications/reactions`, { params: { user_id: user.id } })
      ]);

      // Filter announcements if subadmin (backend already filters for employees, ensure admin scoping)
      let fetchedPosts = postsRes.data;
      let fetchedOffers = offersRes.data;
      let fetchedAlerts = alertsRes.data;

      if (isSubAdmin) {
        fetchedPosts = fetchedPosts.filter(p => !p.subsidiary_id || Number(p.subsidiary_id) === Number(user.subsidiary_id));
        fetchedOffers = fetchedOffers.filter(o => !o.subsidiary_id || Number(o.subsidiary_id) === Number(user.subsidiary_id));
        fetchedAlerts = fetchedAlerts.filter(a => !a.subsidiary_id || Number(a.subsidiary_id) === Number(user.subsidiary_id));
      }

      setAnnouncements(fetchedPosts);
      setOffers(fetchedOffers);
      setAlerts(fetchedAlerts);
      setSubsidiaries(subsRes.data || []);
      setReactionSummaries(Object.fromEntries((reactionsRes.data || []).map(reaction => [`${reaction.item_type}:${reaction.item_id}`, reaction])));
    } catch (err) {
      console.error('Failed to load communications hub data', err);
      showToast('Failed to load broadcast communications', 'error');
    } finally {
      setLoading(false);
    }
  }, [user, isSubAdmin, isSuperOrGroupAdmin, showToast]);

  useEffect(() => {
    const timer = setTimeout(fetchAllData, 0);
    return () => clearTimeout(timer);
  }, [fetchAllData]);

  // ── COMBINED FEED LIST WITH TYPE METADATA ───────────────────
  const allItems = useMemo(() => {
    const list = [
      ...announcements.map(a => ({
        ...a,
        itemType: 'announcement',
        reactionSummary: reactionSummaries[`announcement:${a.id}`] || { reaction_count: a.likes || 0 },
        displayTitle: a.content?.length > 70 ? a.content.substring(0, 70) + '...' : a.content,
        createdDate: a.created_at
      })),
      ...offers.map(o => ({
        ...o,
        itemType: 'offer',
        reactionSummary: reactionSummaries[`offer:${o.id}`] || {},
        displayTitle: o.title,
        createdDate: o.created_at
      })),
      ...alerts.map(al => ({
        ...al,
        itemType: 'alert',
        reactionSummary: reactionSummaries[`alert:${al.id}`] || {},
        displayTitle: al.title,
        createdDate: al.created_at
      }))
    ];

    // Sort by latest created
    return list.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
  }, [announcements, offers, alerts, reactionSummaries]);

  // Filter based on activeTab, search, and selectedSubFilter
  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      // Tab filter
      if (activeTab === 'announcements' && item.itemType !== 'announcement') return false;
      if (activeTab === 'offers' && item.itemType !== 'offer') return false;
      if (activeTab === 'alerts' && item.itemType !== 'alert') return false;

      // Search filter
      const searchLower = search.toLowerCase();
      const matchSearch = 
        item.displayTitle?.toLowerCase().includes(searchLower) ||
        item.content?.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower) ||
        item.message?.toLowerCase().includes(searchLower) ||
        item.subsidiary_name?.toLowerCase().includes(searchLower) ||
        item.badge?.toLowerCase().includes(searchLower) ||
        item.category?.toLowerCase().includes(searchLower);

      if (!matchSearch) return false;

      // Subsidiary filter (for super/group admin)
      if (isSuperOrGroupAdmin && selectedSubFilter !== 'all') {
        if (selectedSubFilter === 'global') {
          if (item.subsidiary_id) return false;
        } else {
          if (String(item.subsidiary_id) !== String(selectedSubFilter)) return false;
        }
      }

      return true;
    });
  }, [allItems, activeTab, search, selectedSubFilter, isSuperOrGroupAdmin]);

  // ── CREATE / EDIT HANDLERS ─────────────────────────────────

  // 1. Announcements
  const openCreateAnnouncement = () => {
    setEditingAnnouncement(null);
    setAnnouncementForm({
      ...BLANK_ANNOUNCEMENT,
      visibility: isSuperOrGroupAdmin ? 'global' : 'subsidiary',
      subsidiary_id: isSuperOrGroupAdmin ? '' : (user?.subsidiary_id || '')
    });
    setAnnouncementModalOpen(true);
  };

  const openEditAnnouncement = (item) => {
    setEditingAnnouncement(item);
    setAnnouncementForm({
      content: item.content || '',
      type: item.type || 'announcement',
      visibility: item.visibility || (item.subsidiary_id ? 'subsidiary' : 'global'),
      subsidiary_id: item.subsidiary_id || '',
      image_url: item.image_url || ''
    });
    setAnnouncementModalOpen(true);
  };

  const handleSaveAnnouncement = async (e) => {
    e.preventDefault();
    if (!announcementForm.content.trim()) {
      showToast('Announcement content is required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const targetSubId = isSubAdmin 
        ? user?.subsidiary_id 
        : (announcementForm.visibility === 'global' ? null : (announcementForm.subsidiary_id || null));

      const payload = {
        author_id: user.id,
        content: announcementForm.content,
        image_url: announcementForm.image_url || null,
        type: announcementForm.type,
        visibility: isSuperOrGroupAdmin ? announcementForm.visibility : 'subsidiary',
        subsidiary_id: targetSubId,
        role: user.role,
        user_subsidiary_id: user.subsidiary_id
      };

      if (editingAnnouncement) {
        await axios.put(`${API}/posts/${editingAnnouncement.id}`, payload);
        showToast('Announcement updated successfully ✓');
      } else {
        await axios.post(`${API}/posts`, payload);
        showToast('Announcement published successfully ✓');
      }
      setAnnouncementModalOpen(false);
      fetchAllData();
    } catch (err) {
      console.error(err);
      showToast('Failed to save announcement', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Staff Offers
  const openCreateOffer = () => {
    setEditingOffer(null);
    setOfferForm({
      ...BLANK_OFFER,
      subsidiary_id: isSuperOrGroupAdmin ? '' : (user?.subsidiary_id || '')
    });
    setOfferModalOpen(true);
  };

  const openEditOffer = (item) => {
    setEditingOffer(item);
    setOfferForm({
      category: item.category || 'Healthcare',
      badge: item.badge || '',
      title: item.title || '',
      description: item.description || '',
      cta: item.cta || 'Claim Perk',
      gradient: item.gradient || OFFER_GRADIENTS[0].value,
      emoji: item.emoji || '🎁',
      valid_until: item.valid_until || '',
      savings: item.savings || '',
      image_url: item.image_url || '',
      subsidiary_id: item.subsidiary_id || ''
    });
    setOfferModalOpen(true);
  };

  const handleSaveOffer = async (e) => {
    e.preventDefault();
    if (!offerForm.title.trim() || !offerForm.description.trim() || !offerForm.image_url) {
      showToast('Offer title, description and image are required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const targetSubId = isSubAdmin 
        ? user?.subsidiary_id 
        : (offerForm.subsidiary_id === '' || offerForm.subsidiary_id === 'null' ? null : offerForm.subsidiary_id);

      const payload = {
        ...offerForm,
        subsidiary_id: targetSubId,
        role: user.role,
        user_subsidiary_id: user.subsidiary_id
      };

      if (editingOffer) {
        await axios.put(`${API}/offers/${editingOffer.id}`, payload);
        showToast('Offer updated successfully ✓');
      } else {
        await axios.post(`${API}/offers`, payload);
        showToast('Offer published successfully ✓');
      }
      setOfferModalOpen(false);
      fetchAllData();
    } catch (err) {
      console.error(err);
      showToast('Failed to save offer', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Safety Alerts
  const openCreateAlert = () => {
    setEditingAlert(null);
    setAlertForm({
      ...BLANK_ALERT,
      subsidiary_id: isSuperOrGroupAdmin ? '' : (user?.subsidiary_id || '')
    });
    setAlertModalOpen(true);
  };

  const openEditAlert = (item) => {
    setEditingAlert(item);
    setAlertForm({
      title: item.title || '',
      message: item.message || '',
      type: item.type || 'info',
      color: item.color || 'blue',
      subsidiary_id: item.subsidiary_id || ''
    });
    setAlertModalOpen(true);
  };

  const handleAlertSeverityChange = (typeVal) => {
    let colorVal = 'blue';
    if (typeVal === 'warning') colorVal = 'amber';
    if (typeVal === 'success') colorVal = 'emerald';
    setAlertForm(prev => ({ ...prev, type: typeVal, color: colorVal }));
  };

  const handleSaveAlert = async (e) => {
    e.preventDefault();
    if (!alertForm.title.trim() || !alertForm.message.trim()) {
      showToast('Alert title and message are required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const targetSubId = isSubAdmin 
        ? user?.subsidiary_id 
        : (alertForm.subsidiary_id === '' || alertForm.subsidiary_id === 'null' ? null : alertForm.subsidiary_id);

      const payload = {
        ...alertForm,
        subsidiary_id: targetSubId,
        role: user.role,
        user_subsidiary_id: user.subsidiary_id
      };

      if (editingAlert) {
        await axios.put(`${API}/alerts/${editingAlert.id}`, payload);
        showToast('Alert updated successfully ✓');
      } else {
        await axios.post(`${API}/alerts`, payload);
        showToast('Alert issued successfully ✓');
      }
      setAlertModalOpen(false);
      fetchAllData();
    } catch (err) {
      console.error(err);
      showToast('Failed to save alert', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Delete Handler
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setSubmitting(true);
    try {
      const queryParams = {
        role: user.role,
        user_subsidiary_id: user.subsidiary_id,
        user_id: user.id
      };

      if (deleteTarget.type === 'announcement') {
        await axios.delete(`${API}/posts/${deleteTarget.id}`, { params: queryParams });
      } else if (deleteTarget.type === 'offer') {
        await axios.delete(`${API}/offers/${deleteTarget.id}`, { params: queryParams });
      } else if (deleteTarget.type === 'alert') {
        await axios.delete(`${API}/alerts/${deleteTarget.id}`, { params: queryParams });
      }

      showToast(`Removed from communications stream ✓`);
      setDeleteTarget(null);
      fetchAllData();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to delete item', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openReactionViewer = async (item) => {
    setReactionViewer(item);
    setReactionUsers([]);
    setLoadingReactions(true);
    try {
      const response = await axios.get(`${API}/communications/${item.itemType}/${item.id}/reactions`);
      setReactionUsers(response.data || []);
    } catch (error) {
      console.error(error);
      showToast('Could not load reaction details', 'error');
    } finally {
      setLoadingReactions(false);
    }
  };

  // Image Upload helper for announcements & offers
  const handleImageFileSelect = async (e, formType) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    try {
      const res = await axios.post(`${API}/uploads/image`, formData);
      if (res.data?.imageUrl) {
        if (formType === 'announcement') {
          setAnnouncementForm(prev => ({ ...prev, image_url: res.data.imageUrl }));
        } else if (formType === 'offer') {
          setOfferForm(prev => ({ ...prev, image_url: res.data.imageUrl }));
        }
        showToast('Image uploaded successfully ✓');
      }
    } catch (err) {
      console.error('Image upload failed', err);
      showToast('Failed to upload image', 'error');
    }
  };

  // Check if current user can edit/delete an item
  const canManageItem = (item) => {
    if (isSuperOrGroupAdmin) return true;
    if (isSubAdmin && Number(item.subsidiary_id) === Number(user?.subsidiary_id)) return true;
    return false;
  };

  return (
    <div className="relative mx-auto min-h-screen w-full max-w-[1450px] bg-[#F7F8FA] px-4 pb-20 pt-5 transition-colors duration-300 dark:bg-[#0B0F19] sm:px-6 lg:px-8">
      
      {/* ── TOAST NOTIFICATION ── */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-[200] px-5 py-3.5 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-xl ${
              toast.type === 'error' 
                ? 'bg-rose-50/95 dark:bg-rose-950/90 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200' 
                : 'bg-emerald-50/95 dark:bg-emerald-950/90 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
            }`}
          >
            {toast.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" /> : <Check className="w-5 h-5 shrink-0 text-emerald-500" />}
            <span className="text-xs sm:text-sm font-black tracking-wide">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HEADER SECTION ── */}
      <AdminPageHeader
        icon={Megaphone}
        title="Communications Centre"
        description={isSuperOrGroupAdmin 
          ? "Create, manage, and dispatch company announcements, member benefits, and safety alerts across group entities."
          : `Manage announcements, staff perks, and alerts for ${user?.subsidiary_name || 'your subsidiary'}.`
        }
        className="rounded-[28px] border border-[#E8E0D7] bg-white px-6 py-6 shadow-[0_18px_55px_rgba(34,20,16,0.06)] dark:border-white/10 dark:bg-slate-900 sm:px-7"
        meta={<span className="mt-2 inline-flex rounded-full bg-[#FFF6E6] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-[#A87627]">Publishing workspace</span>}
        actions={
          <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
            <button 
              onClick={openCreateAnnouncement}
              className="px-4 py-2.5 rounded-xl bg-brand-red hover:bg-[#a50f28] text-white text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shadow-sm cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Announcement</span>
            </button>
            <button 
              onClick={openCreateOffer}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#131B2E] border border-amber-300/80 hover:bg-amber-50/50 text-amber-800 dark:text-amber-300 text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shadow-sm cursor-pointer active:scale-95"
            >
              <Gift className="w-4 h-4 text-amber-600" />
              <span>Staff Offer</span>
            </button>
            <button 
              onClick={openCreateAlert}
              className="px-4 py-2.5 rounded-xl bg-white dark:bg-[#131B2E] border border-rose-300/80 hover:bg-rose-50/50 text-rose-700 dark:text-rose-400 text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 shadow-sm cursor-pointer active:scale-95"
            >
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Issue Alert</span>
            </button>
          </div>
        }
      />

      <div className="space-y-5">

        {/* ── STATS COUNTER BAR ── */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 sm:gap-4">
          <div className="flex items-center gap-4 rounded-[20px] border border-[#E8E0D7] bg-white p-4 shadow-[0_8px_24px_rgba(34,20,16,0.04)] transition-all hover:-translate-y-0.5 dark:border-white/10 dark:bg-[#131B2E] sm:p-5">
            <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/40 text-brand-red border border-red-100/60 dark:border-red-900/20 flex items-center justify-center shrink-0">
              <Megaphone className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Announcements</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{announcements.length}</h3>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-[20px] border border-[#E8E0D7] bg-white p-4 shadow-[0_8px_24px_rgba(34,20,16,0.04)] transition-all hover:-translate-y-0.5 dark:border-white/10 dark:bg-[#131B2E] sm:p-5">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 border border-amber-200/60 dark:border-amber-900/20 flex items-center justify-center shrink-0">
              <Gift className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Staff Offers</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{offers.length}</h3>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-[20px] border border-[#E8E0D7] bg-white p-4 shadow-[0_8px_24px_rgba(34,20,16,0.04)] transition-all hover:-translate-y-0.5 dark:border-white/10 dark:bg-[#131B2E] sm:p-5">
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-200/60 dark:border-rose-900/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Active Alerts</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{alerts.length}</h3>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-[20px] border border-[#E8E0D7] bg-white p-4 shadow-[0_8px_24px_rgba(34,20,16,0.04)] transition-all hover:-translate-y-0.5 dark:border-white/10 dark:bg-[#131B2E] sm:p-5">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200/60 dark:border-emerald-900/20 flex items-center justify-center shrink-0">
              {isSuperOrGroupAdmin ? <Globe className="w-6 h-6" /> : <Building2 className="w-6 h-6" />}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-400 uppercase tracking-wider">Audience Scope</p>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                {isSuperOrGroupAdmin ? "All Subsidiaries" : (user?.subsidiary_name || 'My Subsidiary')}
              </h3>
            </div>
          </div>
        </div>

        {/* ── TABS WITH UNDERLINE INDICATOR ── */}
        <div className="flex items-center gap-6 border-b border-slate-200 dark:border-white/10 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'All Items', count: allItems.length, icon: Layers },
            { id: 'announcements', label: 'Announcements', count: announcements.length, icon: Megaphone },
            { id: 'offers', label: 'Staff Offers', count: offers.length, icon: Gift },
            { id: 'alerts', label: 'Safety Alerts', count: alerts.length, icon: AlertTriangle }
          ].map(t => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`pb-3 text-xs sm:text-sm font-semibold transition-all relative shrink-0 flex items-center gap-2 cursor-pointer ${
                  active 
                    ? 'text-brand-red font-bold' 
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  active ? 'bg-red-50 text-brand-red' : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'
                }`}>
                  {t.count}
                </span>
                {active && (
                  <motion.div
                    layoutId="commTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-brand-red rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* ── FILTER & SEARCH BAR ── */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search broadcasts..."
              className="w-full bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-700 dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-brand-red/10 focus:border-brand-red transition-all shadow-sm"
            />
          </div>

          <div className="flex items-center gap-2.5">
            {isSuperOrGroupAdmin && (
              <div className="flex items-center gap-2 bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-white/10 rounded-2xl px-3.5 py-2.5 shadow-sm text-xs font-medium text-slate-600 dark:text-slate-300">
                <span className="text-slate-400">Audience:</span>
                <select
                  value={selectedSubFilter}
                  onChange={(e) => setSelectedSubFilter(e.target.value)}
                  className="bg-transparent text-slate-800 dark:text-white font-semibold outline-none cursor-pointer pr-1"
                >
                  <option value="all">All Audiences</option>
                  <option value="global">🌐 Global Reach Only</option>
                  {subsidiaries.map(s => (
                    <option key={s.id} value={s.id}>🏢 {s.name}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={fetchAllData}
              title="Refresh Broadcast Stream"
              className="p-2.5 rounded-2xl bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-400 hover:text-slate-700 transition-all shadow-sm cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* ── BROADCAST ITEMS LIST ── */}
        {loading ? (
          <div className="bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-white/5 p-12 text-center rounded-2xl shadow-sm">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-brand-red rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Loading broadcast stream...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-white/5 p-12 text-center rounded-2xl shadow-sm space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-white/5 text-slate-400 flex items-center justify-center mx-auto">
              <Megaphone className="w-8 h-8 opacity-40 text-brand-red" />
            </div>
            <h4 className="text-base font-bold text-slate-800 dark:text-white">No communications found</h4>
            <p className="text-xs font-medium text-slate-400 max-w-md mx-auto">
              {search ? "No items matching your search criteria." : "There are no announcements, offers, or alerts published in this view."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredItems.map(item => {
              const isAnnouncement = item.itemType === 'announcement';
              const isOffer = item.itemType === 'offer';
              const isAlert = item.itemType === 'alert';
              const isGlobal = !item.subsidiary_id;
              const hasManageAccess = canManageItem(item);

              return (
                <motion.div
                  key={`${item.itemType}-${item.id}`}
                  layout
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-[#131B2E] rounded-2xl overflow-hidden border border-slate-200/80 dark:border-white/5 flex flex-col justify-between hover:shadow-md transition-all duration-300 relative group"
                >
                  <div className="p-5 sm:p-6 space-y-3.5 flex-1">
                    {/* Header line: Type badge & Scope */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1.5 ${
                        isAlert 
                          ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/60' 
                          : isOffer 
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200/60' 
                          : 'bg-red-50 dark:bg-red-950/40 text-brand-red dark:text-red-400 border border-red-100/70'
                      }`}>
                        {isAlert && <AlertTriangle className="w-3 h-3" />}
                        {isOffer && <Gift className="w-3 h-3" />}
                        {isAnnouncement && <Megaphone className="w-3 h-3" />}
                        <span>{isAlert ? 'Safety Notice' : isOffer ? 'Staff Offer' : 'Announcement'}</span>
                      </span>

                      {/* Reach indicator */}
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium flex items-center gap-1 ${
                        isGlobal 
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/40' 
                          : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300 border border-slate-200/70'
                      }`}>
                        {isGlobal ? <Globe className="w-3 h-3 text-emerald-600" /> : <Building2 className="w-3 h-3 text-slate-500" />}
                        <span className="truncate max-w-[130px]">
                          {isGlobal ? 'Global' : item.subsidiary_name || `Entity #${item.subsidiary_id}`}
                        </span>
                      </span>
                    </div>

                    {/* Announcement Card Details */}
                    {isAnnouncement && (
                      <div className="space-y-3">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 line-clamp-3 leading-relaxed whitespace-pre-line">
                          {item.content}
                        </p>
                        {item.image_url && (
                          <div className="rounded-xl overflow-hidden aspect-video bg-slate-100 dark:bg-slate-800 border border-slate-100 dark:border-white/5">
                            <img src={item.image_url} alt="Cover" className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100 dark:border-white/5">
                          <span className="font-medium">By {item.author_name || 'Janidu Perera'}</span>
                          <span>{new Date(item.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    )}

                    {/* Offer Card Details */}
                    {isOffer && (
                      <div className="space-y-3">
                        {item.image_url && (
                          <div className="-mx-1 overflow-hidden rounded-2xl border border-slate-100 bg-slate-100 dark:border-white/5 dark:bg-slate-800">
                            <img src={item.image_url} alt={item.title} className="aspect-[16/8] w-full object-cover" />
                          </div>
                        )}
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                            {item.title}
                          </h4>
                          <span className="text-2xl shrink-0">{item.emoji || '🎁'}</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap pt-1">
                          {item.savings && (
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                              {item.savings}
                            </span>
                          )}
                          {item.valid_until && (
                            <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                              <Calendar className="w-3 h-3" />
                              Valid until {item.valid_until}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Alert Card Details */}
                    {isAlert && (
                      <div className="space-y-3">
                        <h4 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                          {item.title}
                        </h4>
                        <div className={`p-3.5 rounded-xl text-xs font-medium leading-relaxed ${
                          item.color === 'amber' 
                            ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border border-amber-200/80 dark:border-amber-800/40' 
                            : item.color === 'emerald'
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 border border-emerald-200/80 dark:border-emerald-800/40'
                            : 'bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 border border-rose-200/80 dark:border-rose-800/40'
                        }`}>
                          {item.message}
                        </div>
                        <div className="text-xs text-slate-400 pt-1">
                          Posted on {new Date(item.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions Footer */}
                  <div className="px-5 sm:px-6 py-3 bg-slate-50/70 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => openReactionViewer(item)}
                      className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-500 transition-colors hover:bg-white hover:text-brand-red dark:hover:bg-white/5"
                    >
                      <Users className="h-3.5 w-3.5" />
                      <span>{item.reactionSummary?.reaction_count || 0} reactions</span>
                    </button>

                    {hasManageAccess ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            if (isAnnouncement) openEditAnnouncement(item);
                            else if (isOffer) openEditOffer(item);
                            else if (isAlert) openEditAlert(item);
                          }}
                          className="p-1.5 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 hover:text-brand-red hover:border-brand-red/30 transition-all cursor-pointer shadow-2xs"
                          title="Edit Details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ id: item.id, type: item.itemType, title: item.displayTitle })}
                          className="p-1.5 rounded-lg bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-rose-600 hover:border-rose-300 transition-all cursor-pointer shadow-2xs"
                          title="Delete Broadcast"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-400 italic">Global View</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {reactionViewer && (
          <div className="fixed inset-0 z-[170] flex items-center justify-center p-4">
            <motion.button aria-label="Close reaction viewer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setReactionViewer(null)} className="absolute inset-0 bg-slate-950/55 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 12 }} className="relative z-10 w-full max-w-md overflow-hidden rounded-[26px] border border-white/20 bg-white shadow-2xl dark:bg-[#131B2E]">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 dark:border-white/10">
                <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#B38945]">Audience engagement</p><h3 className="mt-1 text-lg font-black text-slate-900 dark:text-white">Reactions</h3></div>
                <button type="button" onClick={() => setReactionViewer(null)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/5"><X className="h-4 w-4" /></button>
              </div>
              <div className="max-h-[55vh] space-y-2 overflow-y-auto p-4">
                {loadingReactions ? (
                  <div className="py-12 text-center"><RefreshCw className="mx-auto h-5 w-5 animate-spin text-brand-red" /><p className="mt-2 text-xs font-bold text-slate-400">Loading reactions...</p></div>
                ) : reactionUsers.length === 0 ? (
                  <div className="py-12 text-center"><Users className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-bold text-slate-600 dark:text-slate-300">No reactions yet</p><p className="mt-1 text-xs text-slate-400">Employee reactions will appear here.</p></div>
                ) : reactionUsers.map(person => {
                  const ReactionIcon = person.reaction_type === 'celebrate' ? PartyPopper : person.reaction_type === 'appreciate' ? Heart : ThumbsUp;
                  return (
                    <div key={person.user_id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-[#FCFBF9] p-3 dark:border-white/5 dark:bg-white/[0.03]">
                      <img src={person.profile_pic || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.full_name || 'Employee')}&background=C41230&color=fff`} alt="" className="h-10 w-10 rounded-xl object-cover" />
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-slate-800 dark:text-white">{person.full_name}</p><p className="truncate text-[10px] font-semibold text-slate-400">{person.job_title || 'Employee'}{person.subsidiary_name ? ` · ${person.subsidiary_name}` : ''}</p></div>
                      <span className="flex items-center gap-1.5 rounded-xl bg-white px-2.5 py-2 text-[10px] font-black capitalize text-brand-red shadow-sm dark:bg-white/5"><ReactionIcon className={`h-3.5 w-3.5 ${person.reaction_type === 'appreciate' ? 'fill-current' : ''}`} />{person.reaction_type}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 1: CREATE / EDIT ANNOUNCEMENT ── */}
      <AnimatePresence>
        {announcementModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAnnouncementModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }} className="relative w-full max-w-lg bg-white dark:bg-[#131B2E] border border-slate-100 dark:border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 z-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-brand-red/10 text-brand-red flex items-center justify-center font-black">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {editingAnnouncement ? 'Edit Announcement' : 'Publish Announcement'}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Feed &amp; Broadcast Stream</p>
                  </div>
                </div>
                <button onClick={() => setAnnouncementModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
              </div>

              <form onSubmit={handleSaveAnnouncement} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Update Content</label>
                  <textarea
                    rows={4}
                    value={announcementForm.content}
                    onChange={e => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                    placeholder="Type the official announcement message here..."
                    className={inputCls}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Category</label>
                    <select
                      value={announcementForm.type}
                      onChange={e => setAnnouncementForm({ ...announcementForm, type: e.target.value })}
                      className={inputCls}
                    >
                      <option value="announcement">Official Announcement</option>
                      <option value="achievement">Achievement &amp; Milestone</option>
                      <option value="event">Corporate Event</option>
                      <option value="general">General Notice</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Audience Reach</label>
                    {isSuperOrGroupAdmin ? (
                      <select
                        value={announcementForm.visibility === 'global' ? 'global' : (announcementForm.subsidiary_id || 'subsidiary')}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === 'global') {
                            setAnnouncementForm({ ...announcementForm, visibility: 'global', subsidiary_id: '' });
                          } else {
                            setAnnouncementForm({ ...announcementForm, visibility: 'subsidiary', subsidiary_id: val === 'subsidiary' ? subsidiaries[0]?.id || '' : val });
                          }
                        }}
                        className={inputCls}
                      >
                        <option value="global">🌐 Global (All Group Staff)</option>
                        {subsidiaries.map(s => (
                          <option key={s.id} value={s.id}>🏢 {s.name}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                        <Building2 className="w-3.5 h-3.5 text-brand-red shrink-0" />
                        <span className="truncate">{user?.subsidiary_name || 'My Subsidiary Staff'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Media Image URL / Upload */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Cover Image (Optional)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={announcementForm.image_url}
                      onChange={e => setAnnouncementForm({ ...announcementForm, image_url: e.target.value })}
                      placeholder="https://... or upload below"
                      className={inputCls}
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={e => handleImageFileSelect(e, 'announcement')}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-3 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 text-slate-700 dark:text-white rounded-2xl text-xs font-black shrink-0 transition-colors cursor-pointer"
                    >
                      <ImageIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/10">
                  <button type="button" onClick={() => setAnnouncementModalOpen(false)} className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-xl bg-brand-red text-white text-xs font-black uppercase tracking-wider hover:bg-brand-red-dark disabled:opacity-50">
                    {submitting ? 'Saving...' : editingAnnouncement ? 'Update Announcement' : 'Publish Now'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 2: CREATE / EDIT STAFF OFFER ── */}
      <AnimatePresence>
        {offerModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOfferModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }} className="relative w-full max-w-xl bg-white dark:bg-[#131B2E] border border-slate-100 dark:border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 z-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-black">
                    <Gift className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {editingOffer ? 'Edit Staff Offer' : 'Create Staff Offer'}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Corporate Perks &amp; Discounts</p>
                  </div>
                </div>
                <button onClick={() => setOfferModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
              </div>

              <form onSubmit={handleSaveOffer} className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Offer Title</label>
                    <input
                      type="text"
                      value={offerForm.title}
                      onChange={e => setOfferForm({ ...offerForm, title: e.target.value })}
                      placeholder="e.g. 25% Off at George Steuart Pharmacy"
                      className={inputCls}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Discount Badge</label>
                    <input
                      type="text"
                      value={offerForm.badge}
                      onChange={e => setOfferForm({ ...offerForm, badge: e.target.value })}
                      placeholder="25% OFF"
                      className={inputCls}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</label>
                  <textarea
                    rows={3}
                    value={offerForm.description}
                    onChange={e => setOfferForm({ ...offerForm, description: e.target.value })}
                    placeholder="Details about the offer, eligibility, and how staff can claim it..."
                    className={inputCls}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Offer Image <span className="text-brand-red">*</span></label>
                    <span className="text-[10px] font-semibold text-slate-400">Recommended 1600 × 900</span>
                  </div>
                  {offerForm.image_url ? (
                    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 dark:border-white/10 dark:bg-slate-900">
                      <img src={offerForm.image_url} alt="Offer preview" className="aspect-[16/7] w-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-950/45 opacity-0 transition-opacity group-hover:opacity-100">
                        <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-xl bg-white px-3 py-2 text-xs font-black text-slate-800">Replace image</button>
                        <button type="button" onClick={() => setOfferForm({ ...offerForm, image_url: '' })} className="rounded-xl bg-rose-600 px-3 py-2 text-xs font-black text-white">Remove</button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-amber-200 bg-amber-50/50 px-6 py-7 text-amber-800 transition-colors hover:border-amber-400 hover:bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20">
                      <ImageIcon className="mb-2 h-6 w-6" />
                      <span className="text-xs font-black">Upload offer image</span>
                      <span className="mt-1 text-[10px] font-medium opacity-70">PNG, JPG or WEBP</span>
                    </button>
                  )}
                  <input type="file" ref={fileInputRef} onChange={e => handleImageFileSelect(e, 'offer')} accept="image/png,image/jpeg,image/webp" className="hidden" />
                  <input type="url" value={offerForm.image_url} onChange={e => setOfferForm({ ...offerForm, image_url: e.target.value })} placeholder="Or paste an image URL" className={inputCls} />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                    <select
                      value={offerForm.category}
                      onChange={e => setOfferForm({ ...offerForm, category: e.target.value })}
                      className={inputCls}
                    >
                      {OFFER_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Valid Until</label>
                    <input
                      type="text"
                      value={offerForm.valid_until}
                      onChange={e => setOfferForm({ ...offerForm, valid_until: e.target.value })}
                      placeholder="Dec 31, 2026"
                      className={inputCls}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Emoji Icon</label>
                    <input
                      type="text"
                      value={offerForm.emoji}
                      onChange={e => setOfferForm({ ...offerForm, emoji: e.target.value })}
                      placeholder="💊, ☕, ✈️"
                      className={inputCls}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gradient Theme</label>
                    <select
                      value={offerForm.gradient}
                      onChange={e => setOfferForm({ ...offerForm, gradient: e.target.value })}
                      className={inputCls}
                    >
                      {OFFER_GRADIENTS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Audience Reach</label>
                    {isSuperOrGroupAdmin ? (
                      <select
                        value={offerForm.subsidiary_id || ''}
                        onChange={e => setOfferForm({ ...offerForm, subsidiary_id: e.target.value })}
                        className={inputCls}
                      >
                        <option value="">🌐 Global (All Subsidiaries)</option>
                        {subsidiaries.map(s => <option key={s.id} value={s.id}>🏢 {s.name}</option>)}
                      </select>
                    ) : (
                      <div className="p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                        <Building2 className="w-3.5 h-3.5 text-brand-gold shrink-0" />
                        <span className="truncate">{user?.subsidiary_name || 'My Subsidiary'}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/10">
                  <button type="button" onClick={() => setOfferModalOpen(false)} className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-xl bg-brand-gold text-slate-900 text-xs font-black uppercase tracking-wider hover:brightness-105 disabled:opacity-50">
                    {submitting ? 'Saving...' : editingOffer ? 'Update Offer' : 'Publish Offer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 3: CREATE / EDIT SAFETY ALERT ── */}
      <AnimatePresence>
        {alertModalOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setAlertModalOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 15 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 15 }} className="relative w-full max-w-lg bg-white dark:bg-[#131B2E] border border-slate-100 dark:border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 z-10 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-600 flex items-center justify-center font-black">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {editingAlert ? 'Edit Safety Alert' : 'Issue Safety Alert'}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Critical Broadcast System</p>
                  </div>
                </div>
                <button onClick={() => setAlertModalOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
              </div>

              <form onSubmit={handleSaveAlert} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Alert Headline</label>
                  <input
                    type="text"
                    value={alertForm.title}
                    onChange={e => setAlertForm({ ...alertForm, title: e.target.value })}
                    placeholder="e.g. Health Facility Scheduled Drill at 2 PM"
                    className={inputCls}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Message &amp; Directives</label>
                  <textarea
                    rows={4}
                    value={alertForm.message}
                    onChange={e => setAlertForm({ ...alertForm, message: e.target.value })}
                    placeholder="Detailed notice for personnel..."
                    className={inputCls}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Severity &amp; Theme</label>
                    <select
                      value={alertForm.type}
                      onChange={e => handleAlertSeverityChange(e.target.value)}
                      className={inputCls}
                    >
                      <option value="warning">⚠️ Warning / Operational Alert (Amber)</option>
                      <option value="info">ℹ️ Information / HR Notice (Blue)</option>
                      <option value="success">🛡️ Policy / Clearance Notice (Emerald)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Audience Reach</label>
                    {isSuperOrGroupAdmin ? (
                      <select
                        value={alertForm.subsidiary_id || ''}
                        onChange={e => setAlertForm({ ...alertForm, subsidiary_id: e.target.value })}
                        className={inputCls}
                      >
                        <option value="">🌐 Global (All Group Staff)</option>
                        {subsidiaries.map(s => <option key={s.id} value={s.id}>🏢 {s.name}</option>)}
                      </select>
                    ) : (
                      <div className="p-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                        <Building2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        <span className="truncate">{user?.subsidiary_name || 'My Subsidiary Staff'}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/10">
                  <button type="button" onClick={() => setAlertModalOpen(false)} className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5">Cancel</button>
                  <button type="submit" disabled={submitting} className="px-6 py-2.5 rounded-xl bg-brand-red text-white text-xs font-black uppercase tracking-wider hover:bg-brand-red-dark disabled:opacity-50">
                    {submitting ? 'Saving...' : editingAlert ? 'Update Alert' : 'Issue Alert'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL 4: DELETE CONFIRMATION ── */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-[160] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDeleteTarget(null)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-sm bg-white dark:bg-[#131B2E] border border-slate-100 dark:border-white/10 rounded-3xl p-6 shadow-2xl space-y-4 z-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">Delete Broadcast?</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Are you sure you want to delete <span className="font-bold text-slate-700 dark:text-white">"{deleteTarget.title}"</span>? This will immediately remove it from all employee viewports.
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button onClick={() => setDeleteTarget(null)} className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5">Cancel</button>
                <button onClick={confirmDelete} disabled={submitting} className="px-5 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-black uppercase tracking-wider hover:bg-rose-700 disabled:opacity-50">
                  {submitting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
