import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Image as ImageIcon, Send, MessageSquare, Share2, Bookmark,
  MoreHorizontal, Rss, Trash2, ChevronLeft, ChevronRight,
  ChevronDown, ChevronUp, Sparkles, AlertCircle,
  Clock, X, CheckCircle2, BookmarkCheck,
  Cake, Gift, Search, Filter, Plus, Zap, Check, ExternalLink,
  TrendingUp, Users, Eye, Heart, BarChart3, Award, Activity,
  Edit2, Pin, AlertTriangle, ShieldAlert, ShieldCheck,
  Megaphone, Globe, Building2, Copy, Calendar, ArrowUpRight,
  Shield, Layers, Flame, Smile, ThumbsUp, Compass
} from 'lucide-react';

const REACTION_CONFIG = {
  like:       { label: 'Like',       emoji: '👍', color: '#2563eb', bg: '#eff6ff', hoverBorder: '#bfdbfe' },
  appreciate: { label: 'Appreciate', emoji: '❤️', color: '#e11d48', bg: '#fff1f2', hoverBorder: '#fecdd3' },
  greatjob:   { label: 'Great Job',  emoji: '👏', color: '#059669', bg: '#ecfdf5', hoverBorder: '#a7f3d0' },
  amazing:    { label: 'Amazing',    emoji: '🔥', color: '#d97706', bg: '#fffbeb', hoverBorder: '#fde68a' },
  celebrate:  { label: 'Celebrate',  emoji: '🎉', color: '#7c3aed', bg: '#f5f3ff', hoverBorder: '#ddd6fe' },
};

/* ══════════════════════════════════════════════════════════════════════
   CELEBRATION HUB COMPONENT — LUXURY CONGLOMERATE CELEBRATIONS SLIDER
   ══════════════════════════════════════════════════════════════════════ */
function CelebrationHub({ userSubsidiary, onSendWishPoints }) {
  const navigate = useNavigate();
  const [birthdays, setBirthdays] = useState([]);
  const [loading, setLoading] = useState(true);
  const sliderRef = useRef(null);
  const [autoSlide, setAutoSlide] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const calculateAge = (dobString) => {
    if (!dobString) return '';
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleSendWishes = (person) => {
    const partner = {
      id: person.id,
      full_name: person.full_name,
      profile_pic: person.profile_pic || null,
      subsidiary_name: person.subsidiary_name || '',
      job_title: person.job_title || 'Colleague'
    };
    sessionStorage.setItem('quick_chat_partner', JSON.stringify(partner));
    sessionStorage.setItem(
      'quick_chat_initial_message',
      `🎉 Happy Birthday, ${person.full_name.split(' ')[0]}! Wishing you an incredible year ahead filled with success and happiness! 🎂✨`
    );
    if (onSendWishPoints) {
      onSendWishPoints(10, `Sent birthday wishes to ${person.full_name.split(' ')[0]}`);
    }
    navigate('/messages');
  };

  useEffect(() => {
    const fetchBirthdays = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/users/birthdays');
        if (res.data && res.data.length > 0) {
          setBirthdays(res.data.map(b => ({
            ...b,
            photo: b.profile_pic || `https://ui-avatars.com/api/?name=${encodeURIComponent(b.full_name)}&background=fdf2f2&color=9e0e27&bold=true`,
            wishes: Math.floor(Math.random() * 15) + 8
          })));
        } else {
          const mockBirthdayData = [
            { id: 'mock_1', full_name: 'Sanduni Perera', date_of_birth: '2000-05-21', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300', wishes: 24, subsidiary_name: 'GS Teas', job_title: 'Brand Specialist' },
            { id: 'mock_2', full_name: 'Dilshan Silva', date_of_birth: '1996-05-21', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300', wishes: 19, subsidiary_name: 'GS Health', job_title: 'Operations Manager' },
            { id: 'mock_3', full_name: 'Nimali Fernando', date_of_birth: '1998-05-21', photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=300', wishes: 32, subsidiary_name: 'GS Travel', job_title: 'Client Partner' }
          ];
          setBirthdays(mockBirthdayData.map(b => ({
            ...b,
            age: calculateAge(b.date_of_birth)
          })));
        }
      } catch (err) {
        console.error('Failed to fetch birthdays', err);
        const mockBirthdayData = [
          { id: 'mock_1', full_name: 'Sanduni Perera', date_of_birth: '2000-05-21', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300', wishes: 24, subsidiary_name: 'GS Teas', job_title: 'Brand Specialist' },
          { id: 'mock_2', full_name: 'Dilshan Silva', date_of_birth: '1996-05-21', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300', wishes: 19, subsidiary_name: 'GS Health', job_title: 'Operations Manager' },
          { id: 'mock_3', full_name: 'Nimali Fernando', date_of_birth: '1998-05-21', photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=300', wishes: 32, subsidiary_name: 'GS Travel', job_title: 'Client Partner' }
        ];
        setBirthdays(mockBirthdayData.map(b => ({
          ...b,
          age: calculateAge(b.date_of_birth)
        })));
      } finally {
        setLoading(false);
      }
    };
    fetchBirthdays();
  }, []);

  const filtered = birthdays.filter(b => b.subsidiary_name === userSubsidiary || !b.subsidiary_name);

  // Check scroll position for slider controls
  const updateScrollButtons = () => {
    if (sliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scrollSlider = (direction) => {
    if (sliderRef.current) {
      const scrollAmount = sliderRef.current.clientWidth * 0.75;
      sliderRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    if (!autoSlide || filtered.length <= 1) return;
    const interval = setInterval(() => {
      if (sliderRef.current) {
        const { scrollWidth, clientWidth, scrollLeft } = sliderRef.current;
        const maxScroll = scrollWidth - clientWidth;
        const next = scrollLeft + 280;
        sliderRef.current.scrollTo({ left: next >= maxScroll ? 0 : next, behavior: 'smooth' });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [autoSlide, filtered]);

  if (filtered.length === 0 && !loading) return null;

  return (
    <div className="relative overflow-hidden rounded-[26px] bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-indigo-500/10 dark:from-amber-950/20 dark:via-rose-950/20 dark:to-indigo-950/20 border border-amber-200/60 dark:border-amber-900/40 p-5 sm:p-6 backdrop-blur-xl shadow-[0_12px_40px_-20px_rgba(217,119,6,0.2)]">
      {/* Subtle ambient shimmer */}
      <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-gradient-to-br from-amber-300/30 via-rose-300/20 to-transparent blur-3xl pointer-events-none" />

      {/* Header bar */}
      <div className="flex items-center justify-between gap-4 mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20">
            <Cake className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Celebration Hub
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
                Today
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Celebrate colleagues across the conglomerate and share warm wishes
            </p>
          </div>
        </div>

        {/* Carousel buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => scrollSlider('left')}
            disabled={!canScrollLeft}
            className="w-8 h-8 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-brand-red disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
            title="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scrollSlider('right')}
            disabled={!canScrollRight}
            className="w-8 h-8 rounded-xl bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-brand-red disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
            title="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Cards Slider */}
      <div
        ref={sliderRef}
        onScroll={updateScrollButtons}
        onMouseEnter={() => setAutoSlide(false)}
        onMouseLeave={() => setAutoSlide(true)}
        className="flex gap-4 overflow-x-auto scroll-smooth no-scrollbar py-1 relative z-10"
      >
        {filtered.map(person => (
          <motion.div
            key={person.id}
            whileHover={{ y: -3 }}
            transition={{ duration: 0.2 }}
            className="min-w-[240px] max-w-[260px] flex-shrink-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800 p-4 flex flex-col items-center text-center shadow-sm hover:shadow-lg transition-all"
          >
            {/* Top Badge */}
            <div className="w-full flex items-center justify-between gap-1 mb-2">
              <span className="text-[9px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-200/50">
                Birthday Star
              </span>
              <span className="text-xs">🎂</span>
            </div>

            {/* Profile Avatar with gold ring */}
            <div className="relative my-1">
              <div className="w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-amber-400 via-rose-400 to-indigo-500 shadow-md">
                <img
                  src={person.photo}
                  alt={person.full_name}
                  className="w-full h-full rounded-full object-cover bg-white"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] shadow-sm border-2 border-white dark:border-slate-900">
                ✨
              </div>
            </div>

            {/* Name & Job */}
            <h4 className="font-black text-slate-800 dark:text-white text-sm mt-2 truncate w-full">
              {person.full_name}
            </h4>
            <p className="text-[10px] font-bold text-brand-red uppercase tracking-wider truncate w-full">
              {person.subsidiary_name || 'GEORGE STEUART'}
            </p>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">
              Turning {person.age || calculateAge(person.date_of_birth)} Today
            </p>

            {/* Wishes Counter & Action */}
            <div className="w-full pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
              <span className="text-[10px] font-black text-rose-500 flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 fill-rose-500" />
                <span>{person.wishes}</span>
              </span>
              <button
                onClick={() => handleSendWishes(person)}
                className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-red to-brand-red-dark hover:brightness-110 text-white font-black text-[10px] uppercase tracking-wider shadow-sm shadow-brand-red/20 active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Wish</span>
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MAIN REDESIGNED FEED PAGE
   ══════════════════════════════════════════════════════════════════════ */
const Feed = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isSuperOrGroupAdmin = user?.role === 'superadmin' || user?.role === 'super_admin' || user?.role === 'groupadmin' || user?.role === 'group_admin';
  const isSubAdmin = user?.role === 'subadmin' || user?.role === 'sub_admin';
  const isAdmin = isSuperOrGroupAdmin || isSubAdmin;

  // Moderation, Pinning, and options menu state
  const [activePostMenu, setActivePostMenu] = useState(null);
  const [filterFlaggedOnly, setFilterFlaggedOnly] = useState(false);

  // Post Editing state
  const [editingPost, setEditingPost] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editType, setEditType] = useState('general');
  const [editVisibility, setEditVisibility] = useState('global');
  const [editSubsidiary, setEditSubsidiary] = useState('');

  // Primary Data states
  const [posts, setPosts] = useState([]);
  const [offers, setOffers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [facts, setFacts] = useState([]);
  const [joiners, setJoiners] = useState([]);
  const [loading, setLoading] = useState(true);

  // Composer state
  const [newPostContent, setNewPostContent] = useState('');
  const [activeTab, setActiveTab] = useState('All Feed');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const fileInputRef = useRef(null);
  const [postVisibility, setPostVisibility] = useState(isSuperOrGroupAdmin ? 'global' : 'subsidiary');
  const [postType, setPostType] = useState('general');

  // Modals & Overlays
  const [factModalOpen, setFactModalOpen] = useState(false);
  const [editingFact, setEditingFact] = useState(null);
  const [factContent, setFactContent] = useState('');

  const [joinerModalOpen, setJoinerModalOpen] = useState(false);
  const [editingJoiner, setEditingJoiner] = useState(null);
  const [joinerName, setJoinerName] = useState('');
  const [joinerDept, setJoinerDept] = useState('');
  const [joinerDate, setJoinerDate] = useState('');
  const [joinerProfile, setJoinerProfile] = useState('');
  const [joinerGroupImg, setJoinerGroupImg] = useState('');
  const [joinerGroupDetails, setJoinerGroupDetails] = useState('');
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const [isUploadingGroup, setIsUploadingGroup] = useState(false);
  const [selectedJoiner, setSelectedJoiner] = useState(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [activeReactionHoverPost, setActiveReactionHoverPost] = useState(null);
  const [sharingPost, setSharingPost] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', icon: null });
  const [celebrationEmoji, setCelebrationEmoji] = useState(null);
  const touchTimerRef = useRef(null);

  // Reactions detail modal (Facebook-style)
  const [selectedPostReactions, setSelectedPostReactions] = useState(null);
  const [reactionsModalLoading, setReactionsModalLoading] = useState(false);
  const [reactionsModalTab, setReactionsModalTab] = useState('all');

  // Offers & Alerts acknowledgements
  const [copiedOfferId, setCopiedOfferId] = useState(null);
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState(() => {
    try {
      const stored = localStorage.getItem(`gs_acknowledged_alerts_${user?.id}`);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Pulse Points & Bookmarks
  const [pulsePoints, setPulsePoints] = useState(() => {
    const stored = localStorage.getItem(`pulse_points_${user?.id}`);
    return stored ? parseInt(stored) : 175;
  });

  const [bookmarkedPostIds, setBookmarkedPostIds] = useState(() => {
    const stored = localStorage.getItem(`bookmarked_posts_${user?.id}`);
    return stored ? JSON.parse(stored) : [];
  });

  // Populate edit fields
  useEffect(() => {
    if (editingPost) {
      setEditContent(editingPost.content || '');
      setEditType(editingPost.type || 'general');
      setEditVisibility(editingPost.visibility || 'global');
      setEditSubsidiary(editingPost.subsidiary_id || '');
    }
  }, [editingPost]);

  // Sync tab with URL search parameter (?tab=offers / alerts / announcements / all)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      if (tabParam === 'offers') setActiveTab('Staff Offers');
      else if (tabParam === 'alerts') setActiveTab('Safety Alerts');
      else if (tabParam === 'announcements') setActiveTab('Announcements');
      else if (tabParam === 'all') setActiveTab('All Feed');
    }
  }, [searchParams]);

  // Toast triggers
  const triggerToast = (message, icon = <CheckCircle2 className="w-5 h-5 text-emerald-500" />) => {
    setToast({ show: true, message, icon });
    setTimeout(() => setToast({ show: false, message: '', icon: null }), 3000);
  };

  const adjustPulsePoints = (amount, reason) => {
    const nextPoints = pulsePoints + amount;
    setPulsePoints(nextPoints);
    localStorage.setItem(`pulse_points_${user?.id}`, nextPoints.toString());

    setCelebrationEmoji(`+${amount} ✨`);
    setTimeout(() => setCelebrationEmoji(null), 2500);

    triggerToast(`${reason} (${amount > 0 ? '+' : ''}${amount} Pulse Points!)`, <Sparkles className="w-5 h-5 text-amber-500" />);
  };

  // Data fetching
  const fetchFacts = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/facts');
      setFacts(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchJoiners = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/joiners');
      setJoiners(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPosts = async () => {
    try {
      const queryParams = {
        subsidiary_id: user?.subsidiary_id || '',
        user_id: user?.id || '',
        role: user?.role || ''
      };
      const [postsRes, offersRes, alertsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/posts', { params: queryParams }),
        axios.get('http://localhost:5000/api/offers', { params: queryParams }),
        axios.get('http://localhost:5000/api/alerts', { params: queryParams })
      ]);
      setPosts(postsRes.data || []);
      setOffers(offersRes.data || []);
      setAlerts(alertsRes.data || []);
    } catch (error) {
      console.error('Failed to fetch feed and communications data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchFacts();
    fetchJoiners();
  }, [user]);

  // File selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    }
  };

  // Post creation
  const handleCreatePost = async () => {
    if (!newPostContent.trim() && !selectedFile) return;
    let uploadedImageUrl = null;
    if (selectedFile) {
      const formData = new FormData();
      formData.append('image', selectedFile);
      try {
        const uploadRes = await axios.post('http://localhost:5000/api/uploads/image', formData);
        uploadedImageUrl = uploadRes.data.imageUrl;
      } catch {
        triggerToast('Image upload failed', <AlertCircle className="w-5 h-5 text-brand-red" />);
        return;
      }
    }
    try {
      await axios.post('http://localhost:5000/api/posts', {
        author_id: user.id,
        content: newPostContent,
        image_url: uploadedImageUrl,
        type: postType,
        visibility: isSuperOrGroupAdmin ? postVisibility : 'subsidiary',
        subsidiary_id: user.subsidiary_id,
        role: user.role,
        user_subsidiary_id: user.subsidiary_id
      });
      setNewPostContent('');
      setSelectedFile(null);
      setFilePreview(null);
      fetchPosts();
      adjustPulsePoints(25, 'Published official update!');
    } catch {
      triggerToast('Failed to create post', <AlertCircle className="w-5 h-5 text-brand-red" />);
    }
  };

  // Reactions Handling
  const handleReact = async (postId, reactionType) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const prevReaction = post.user_reaction || null;
    const wasSameReaction = prevReaction === reactionType;
    const newReaction = wasSameReaction ? null : reactionType;

    setPosts(prevPosts => prevPosts.map(p => {
      if (p.id === postId) {
        let count = p.likes || 0;
        let types = p.reaction_types ? p.reaction_types.split(',').filter(Boolean) : [];

        if (wasSameReaction) {
          count = Math.max(0, count - 1);
          types = types.filter(t => t !== reactionType);
        } else if (prevReaction) {
          types = types.filter(t => t !== prevReaction);
          if (!types.includes(reactionType)) types.push(reactionType);
        } else {
          count = count + 1;
          if (!types.includes(reactionType)) types.push(reactionType);
        }

        return {
          ...p,
          user_reaction: newReaction,
          likes: count,
          reaction_types: types.join(',') || null
        };
      }
      return p;
    }));

    try {
      const res = await axios.post(`http://localhost:5000/api/posts/${postId}/like`, { user_id: user.id, type: reactionType });
      let pointsChange = 0;
      let reason = '';
      if (res.data.action === 'remove') {
        pointsChange = -5;
        reason = 'Removed reaction';
      } else if (res.data.action === 'add') {
        pointsChange = 5;
        reason = `Reacted with ${REACTION_CONFIG[reactionType]?.label || 'Like'}`;
      }
      if (pointsChange !== 0) adjustPulsePoints(pointsChange, reason);
    } catch (error) {
      console.error(error);
      fetchPosts();
    }
  };

  const handleDefaultReactClick = (postId) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const current = post.user_reaction || null;
    handleReact(postId, current || 'like');
  };

  const handleViewReactions = async (post) => {
    setReactionsModalLoading(true);
    setSelectedPostReactions({ post, list: [] });
    setReactionsModalTab('all');
    try {
      const res = await axios.get(`http://localhost:5000/api/posts/${post.id}/reactions`);
      setSelectedPostReactions({ post, list: res.data || [] });
    } catch (err) {
      console.error(err);
      triggerToast('Failed to load reactions', <AlertCircle className="w-5 h-5 text-brand-red" />);
      setSelectedPostReactions(null);
    } finally {
      setReactionsModalLoading(false);
    }
  };

  const handleTouchStart = (postId) => {
    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
    touchTimerRef.current = setTimeout(() => {
      setActiveReactionHoverPost(postId);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 450);
  };

  const handleTouchEnd = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  };

  // Bookmarking
  const toggleBookmark = (postId) => {
    const isBookmarked = bookmarkedPostIds.includes(postId);
    let nextBookmarks;
    if (isBookmarked) {
      nextBookmarks = bookmarkedPostIds.filter(id => id !== postId);
      triggerToast('Removed update from bookmarks', <Bookmark className="w-5 h-5 text-slate-400" />);
    } else {
      nextBookmarks = [...bookmarkedPostIds, postId];
      triggerToast('Saved update to bookmarks!', <BookmarkCheck className="w-5 h-5 text-brand-red" />);
      adjustPulsePoints(2, 'Bookmarked update');
    }
    setBookmarkedPostIds(nextBookmarks);
    localStorage.setItem(`bookmarked_posts_${user?.id}`, JSON.stringify(nextBookmarks));
  };

  // Deletion, Pinning, Flagging
  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this update?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/posts/${postId}`);
      triggerToast('Post deleted successfully!', <Trash2 className="w-5 h-5 text-rose-500" />);
      fetchPosts();
    } catch (err) {
      console.error(err);
      triggerToast('Failed to delete post', <AlertCircle className="w-5 h-5 text-brand-red" />);
    }
  };

  const handleTogglePin = async (post) => {
    const nextPinned = !post.is_pinned;
    try {
      await axios.put(`http://localhost:5000/api/posts/${post.id}/pin`, { is_pinned: nextPinned });
      triggerToast(nextPinned ? '📌 Post pinned at top of feed!' : '📌 Post unpinned', <Pin className="w-5 h-5 text-amber-500" />);
      fetchPosts();
    } catch (err) {
      console.error(err);
      triggerToast('Failed to update pin status', <AlertCircle className="w-5 h-5 text-brand-red" />);
    }
  };

  const handleToggleFlag = async (post) => {
    const nextFlagged = !post.is_flagged;
    try {
      await axios.put(`http://localhost:5000/api/posts/${post.id}/flag`, { is_flagged: nextFlagged });
      triggerToast(nextFlagged ? '⚠️ Post flagged for review' : '🛡️ Post flag resolved', <AlertTriangle className="w-5 h-5 text-rose-500" />);
      fetchPosts();
    } catch (err) {
      console.error(err);
      triggerToast('Failed to update flag status', <AlertCircle className="w-5 h-5 text-brand-red" />);
    }
  };

  const handleUpdatePost = async () => {
    if (!editContent.trim()) return;
    try {
      await axios.put(`http://localhost:5000/api/posts/${editingPost.id}`, {
        content: editContent,
        type: editType,
        visibility: editVisibility,
        subsidiary_id: editSubsidiary
      });
      triggerToast('Post updated successfully!', <Check className="w-5 h-5 text-emerald-500" />);
      setEditingPost(null);
      fetchPosts();
    } catch (err) {
      console.error(err);
      triggerToast('Failed to update post', <AlertCircle className="w-5 h-5 text-brand-red" />);
    }
  };

  // Facts handlers
  const handleAddOrUpdateFact = async () => {
    if (!factContent.trim()) return;
    try {
      if (editingFact) {
        await axios.put(`http://localhost:5000/api/facts/${editingFact.id}`, { content: factContent });
        triggerToast('Heritage insight updated!', <Check className="w-5 h-5 text-indigo-500" />);
      } else {
        await axios.post('http://localhost:5000/api/facts', { content: factContent });
        triggerToast('New heritage insight published!', <Check className="w-5 h-5 text-indigo-500" />);
      }
      setFactContent('');
      setEditingFact(null);
      setFactModalOpen(false);
      fetchFacts();
    } catch (err) {
      console.error(err);
      triggerToast('Failed to save fact', <AlertCircle className="w-5 h-5 text-brand-red" />);
    }
  };

  const handleDeleteFact = async (id) => {
    if (!window.confirm("Are you sure you want to delete this fact?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/facts/${id}`);
      triggerToast('Fact deleted', <Trash2 className="w-5 h-5 text-rose-500" />);
      fetchFacts();
    } catch (err) {
      console.error(err);
      triggerToast('Failed to delete fact', <AlertCircle className="w-5 h-5 text-brand-red" />);
    }
  };

  // Joiners handlers
  const handleAddOrUpdateJoiner = async () => {
    if (!isSuperOrGroupAdmin) {
      triggerToast('Administrator scope required', <AlertCircle className="w-5 h-5 text-brand-red" />);
      return;
    }
    if (!joinerDate) return;
    try {
      const payload = {
        name: 'George Steuart Family',
        department: 'Welcome Board',
        join_date: joinerDate,
        profile_photo: `https://ui-avatars.com/api/?name=GS&background=9E1B1B&color=fff`,
        group_image: joinerGroupImg || null,
        group_details: joinerGroupDetails || null
      };
      if (editingJoiner) {
        await axios.put(`http://localhost:5000/api/joiners/${editingJoiner.id}`, payload);
        triggerToast('Joiner details updated!', <Check className="w-5 h-5 text-emerald-500" />);
      } else {
        await axios.post('http://localhost:5000/api/joiners', payload);
        triggerToast('Welcomed new joiners!', <Check className="w-5 h-5 text-emerald-500" />);
      }
      clearJoinerFields();
      setJoinerModalOpen(false);
      fetchJoiners();
    } catch (err) {
      console.error(err);
      triggerToast('Failed to save joiner info', <AlertCircle className="w-5 h-5 text-brand-red" />);
    }
  };

  const clearJoinerFields = () => {
    setJoinerName('');
    setJoinerDept('');
    setJoinerDate('');
    setJoinerProfile('');
    setJoinerGroupImg('');
    setJoinerGroupDetails('');
    setEditingJoiner(null);
  };

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    if (type === 'profile') setIsUploadingProfile(true);
    else setIsUploadingGroup(true);

    try {
      const response = await fetch('http://localhost:5000/api/uploads/image', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (response.ok && data.imageUrl) {
        if (type === 'profile') setJoinerProfile(data.imageUrl);
        else setJoinerGroupImg(data.imageUrl);
        triggerToast('Image uploaded successfully!', <Check className="w-5 h-5 text-emerald-500" />);
      } else {
        triggerToast(data.message || 'Image upload failed', <AlertCircle className="w-5 h-5 text-brand-red" />);
      }
    } catch (err) {
      console.error(err);
      triggerToast('Error uploading image', <AlertCircle className="w-5 h-5 text-brand-red" />);
    } finally {
      if (type === 'profile') setIsUploadingProfile(false);
      else setIsUploadingGroup(false);
    }
  };

  const handleDeleteJoiner = async (id) => {
    if (!isSuperOrGroupAdmin) {
      triggerToast('Administrator scope required', <AlertCircle className="w-5 h-5 text-brand-red" />);
      return;
    }
    if (!window.confirm("Are you sure you want to delete this welcome board?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/joiners/${id}`);
      triggerToast('Joiner profile removed', <Trash2 className="w-5 h-5 text-rose-500" />);
      fetchJoiners();
    } catch (err) {
      console.error(err);
      triggerToast('Failed to delete joiner profile', <AlertCircle className="w-5 h-5 text-brand-red" />);
    }
  };

  // Staff Perks Copy & Alerts Acknowledge
  const handleCopyOffer = (id, badge) => {
    const promo = badge ? badge.replace(/[^A-Za-z0-9]/g, '').toUpperCase() + '-GS2026' : 'GS-STAFF2026';
    navigator.clipboard.writeText(promo);
    setCopiedOfferId(id);
    adjustPulsePoints(5, 'Explored Staff Privilege');
    triggerToast(`Promo code copied: ${promo} ✓`, <Gift className="w-5 h-5 text-amber-500" />);
    setTimeout(() => setCopiedOfferId(null), 2500);
  };

  const handleAcknowledgeAlert = (id) => {
    const next = { ...acknowledgedAlerts, [id]: true };
    setAcknowledgedAlerts(next);
    localStorage.setItem(`gs_acknowledged_alerts_${user?.id}`, JSON.stringify(next));
    adjustPulsePoints(10, 'Acknowledged Safety Directive');
    triggerToast('Safety directive acknowledged ✓', <CheckCircle2 className="w-5 h-5 text-emerald-500" />);
  };

  const copyPostLink = (post) => {
    const mockUrl = `${window.location.origin}/feed?post=${post.id}`;
    navigator.clipboard.writeText(mockUrl);
    triggerToast('Copied post link to clipboard!', <ExternalLink className="w-5 h-5 text-brand-red" />);
    setSharingPost(null);
  };

  // Format relative timestamp
  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - date) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour}h ago`;
    const diffDays = Math.floor(diffHour / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Post category badges and borders
  const getPostBadgeStyle = (type) => {
    switch (type?.toLowerCase()) {
      case 'announcement':
        return 'bg-brand-red/10 text-brand-red border border-brand-red/20';
      case 'achievement':
        return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300 border border-emerald-200/50';
      case 'event':
        return 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-300 border border-blue-200/50';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700';
    }
  };

  const renderReactionIcons = (reactionTypesStr) => {
    if (!reactionTypesStr) return null;
    const types = [...new Set(reactionTypesStr.split(','))];
    const emojis = types.map(t => REACTION_CONFIG[t]?.emoji).filter(Boolean);
    if (!emojis.length) return null;
    return (
      <div className="flex -space-x-1.5 items-center mr-1.5">
        {emojis.slice(0, 3).map((emoji, index) => (
          <div
            key={index}
            className="w-5 h-5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[10px] shadow-sm select-none"
            style={{ zIndex: 3 - index }}
          >
            {emoji}
          </div>
        ))}
      </div>
    );
  };

  // Combined and filtered stream
  const combinedStream = useMemo(() => {
    const formattedPosts = posts.map(p => ({
      ...p,
      itemType: 'post',
      sortDate: new Date(p.created_at || Date.now()).getTime()
    }));
    const formattedOffers = offers.map(o => ({
      ...o,
      itemType: 'offer',
      sortDate: new Date(o.created_at || Date.now()).getTime()
    }));
    const formattedAlerts = alerts.map(a => ({
      ...a,
      itemType: 'alert',
      sortDate: new Date(a.created_at || Date.now()).getTime()
    }));

    if (activeTab === 'Staff Offers') {
      return formattedOffers.sort((a, b) => b.sortDate - a.sortDate);
    }
    if (activeTab === 'Safety Alerts') {
      return formattedAlerts.sort((a, b) => b.sortDate - a.sortDate);
    }
    if (activeTab === 'Saved Bookmarks') {
      return formattedPosts.filter(p => bookmarkedPostIds.includes(p.id)).sort((a, b) => b.sortDate - a.sortDate);
    }
    if (activeTab === 'Announcements') {
      return formattedPosts.filter(p => p.type?.toLowerCase() === 'announcement').sort((a, b) => b.sortDate - a.sortDate);
    }
    if (activeTab === 'Achievements') {
      return formattedPosts.filter(p => p.type?.toLowerCase() === 'achievement').sort((a, b) => b.sortDate - a.sortDate);
    }
    if (activeTab === 'Events') {
      return formattedPosts.filter(p => p.type?.toLowerCase() === 'event').sort((a, b) => b.sortDate - a.sortDate);
    }

    // Default 'All Feed' with pinned posts or unacknowledged alerts prioritized
    return [...formattedAlerts, ...formattedPosts, ...formattedOffers].sort((a, b) => {
      const aPinned = a.itemType === 'post' && a.is_pinned;
      const bPinned = b.itemType === 'post' && b.is_pinned;
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;

      const aUnackAlert = a.itemType === 'alert' && !acknowledgedAlerts[a.id];
      const bUnackAlert = b.itemType === 'alert' && !acknowledgedAlerts[b.id];
      if (aUnackAlert && !bUnackAlert) return -1;
      if (!aUnackAlert && bUnackAlert) return 1;

      return b.sortDate - a.sortDate;
    });
  }, [posts, offers, alerts, activeTab, bookmarkedPostIds, acknowledgedAlerts]);

  const filteredStream = useMemo(() => {
    return combinedStream.filter(item => {
      if (item.itemType === 'post') {
        if (filterFlaggedOnly && !item.is_flagged) return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      if (item.itemType === 'post') {
        return (
          item.content?.toLowerCase().includes(q) ||
          item.author_name?.toLowerCase().includes(q) ||
          (item.subsidiary_name && item.subsidiary_name.toLowerCase().includes(q)) ||
          (item.type && item.type.toLowerCase().includes(q))
        );
      }
      if (item.itemType === 'offer') {
        return (
          item.title?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.badge?.toLowerCase().includes(q) ||
          item.category?.toLowerCase().includes(q) ||
          (item.subsidiary_name && item.subsidiary_name.toLowerCase().includes(q))
        );
      }
      if (item.itemType === 'alert') {
        return (
          item.title?.toLowerCase().includes(q) ||
          item.message?.toLowerCase().includes(q) ||
          (item.subsidiary_name && item.subsidiary_name.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [combinedStream, searchQuery, filterFlaggedOnly]);

  const unacknowledgedAlertsList = alerts.filter(a => !acknowledgedAlerts[a.id]);

  // Loading Skeleton State
  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="shimmer-loader rounded-[28px] h-60 w-full" />
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8 space-y-5">
            <div className="shimmer-loader rounded-2xl h-16 w-full" />
            <div className="shimmer-loader rounded-3xl h-36 w-full" />
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white dark:bg-slate-900 rounded-[26px] border border-slate-200/70 p-6 space-y-4">
                <div className="flex gap-4 items-center">
                  <div className="shimmer-loader w-12 h-12 rounded-2xl" />
                  <div className="space-y-2 flex-1">
                    <div className="shimmer-loader h-4 rounded-full w-1/3" />
                    <div className="shimmer-loader h-3 rounded-full w-1/4" />
                  </div>
                </div>
                <div className="shimmer-loader h-4 rounded-full w-full" />
                <div className="shimmer-loader h-4 rounded-full w-5/6" />
                <div className="shimmer-loader h-48 rounded-2xl w-full mt-3" />
              </div>
            ))}
          </div>
          <div className="hidden lg:block lg:col-span-4 space-y-5">
            <div className="shimmer-loader rounded-3xl h-60" />
            <div className="shimmer-loader rounded-3xl h-48" />
            <div className="shimmer-loader rounded-3xl h-64" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="feed-page-redesign max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 relative selection:bg-brand-red/10 selection:text-brand-red">

      {/* ── SPARKLES FLOATING NOTIFICATION FOR POINTS ── */}
      <AnimatePresence>
        {celebrationEmoji && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.6 }}
            animate={{ opacity: 1, y: -60, scale: 1.3 }}
            exit={{ opacity: 0, y: -120, scale: 0.8 }}
            transition={{ duration: 1.8, ease: 'easeOut' }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black px-6 py-2.5 rounded-full shadow-[0_15px_35px_rgba(245,158,11,0.4)] flex items-center gap-2 border border-white/40"
          >
            <Sparkles className="w-5 h-5 animate-spin" />
            <span>{celebrationEmoji}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TOAST NOTIFICATION SYSTEM ── */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 40, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 20, x: 20 }}
            className="fixed bottom-6 right-6 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.18)] flex items-center gap-3.5 max-w-sm"
          >
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/50 flex items-center justify-center shrink-0">
              {toast.icon}
            </div>
            <div>
              <p className="text-xs font-black text-slate-900 dark:text-white leading-snug">{toast.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SECTION 1: ULTRA-PREMIUM CINEMATIC HERO GREETING BANNER ── */}
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-[28px] border border-white/80 dark:border-slate-800 shadow-[0_20px_50px_-25px_rgba(158,14,39,0.22)] bg-slate-950 group"
      >
        {/* Cinematic Backdrop Image */}
        <div className="absolute inset-0">
          <img
            src="/feed_hero_banner.jpg"
            alt="George Steuart Conglomerate"
            className="w-full h-full object-cover object-[center_35%] transition-transform duration-1000 group-hover:scale-[1.02] opacity-85"
            onError={(e) => {
              e.target.src = '/news-media-center-hero-v2.png';
            }}
          />
          {/* Dynamic Scrim Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-slate-950/30" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/60 to-transparent" />
        </div>

        {/* Content Layer */}
        <div className="relative z-10 p-6 sm:p-8 lg:p-10 flex flex-col justify-between min-h-[220px] lg:min-h-[240px]">
          {/* Top Pill Indicators */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                Live Conglomerate Feed
              </span>
              <span className="text-white/30">•</span>
              <span className="text-[10px] font-bold text-white/70 uppercase tracking-wider">
                ESTD 1835
              </span>
            </div>

            {/* Pulse Points capsule */}
            <div className="flex items-center gap-2 bg-white/10 dark:bg-black/30 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-300">
                {pulsePoints} Pulse Points
              </span>
            </div>
          </div>

          {/* Headline and Description */}
          <div className="space-y-2 max-w-2xl my-4">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight">
              Good day, <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-300 via-amber-200 to-white">{user?.full_name?.split(' ')[0] || 'Colleague'}.</span>
            </h1>
            <p className="text-xs sm:text-sm font-medium text-slate-300 leading-relaxed max-w-xl">
              Connect across all George Steuart subsidiaries. Discover breaking group updates, staff perks, celebrations, and safety directives.
            </p>
          </div>

          {/* Quick Stats Bar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-3 border-t border-white/15">
            <button
              onClick={() => setActiveTab('All Feed')}
              className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-md ${
                activeTab === 'All Feed'
                  ? 'bg-brand-red text-white shadow-lg shadow-brand-red/30 border border-brand-red'
                  : 'bg-white/10 text-white/90 hover:bg-white/20 border border-white/15'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>All Updates</span>
              <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[9px] font-bold">
                {posts.length + offers.length + alerts.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('Announcements')}
              className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-md ${
                activeTab === 'Announcements'
                  ? 'bg-brand-red text-white shadow-lg shadow-brand-red/30 border border-brand-red'
                  : 'bg-white/10 text-white/90 hover:bg-white/20 border border-white/15'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5" />
              <span>Announcements</span>
              <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[9px] font-bold">
                {posts.filter(p => p.type?.toLowerCase() === 'announcement').length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('Staff Offers')}
              className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-md ${
                activeTab === 'Staff Offers'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 border border-amber-400 font-black'
                  : 'bg-white/10 text-white/90 hover:bg-white/20 border border-white/15'
              }`}
            >
              <Gift className="w-3.5 h-3.5 text-amber-300" />
              <span>Perks</span>
              <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[9px] font-bold">
                {offers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('Safety Alerts')}
              className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-md ${
                activeTab === 'Safety Alerts'
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 border border-rose-500'
                  : 'bg-white/10 text-white/90 hover:bg-white/20 border border-white/15'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-300" />
              <span>Safety</span>
              <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[9px] font-bold">
                {alerts.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab(activeTab === 'Saved Bookmarks' ? 'All Feed' : 'Saved Bookmarks')}
              className={`px-3.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer backdrop-blur-md ${
                activeTab === 'Saved Bookmarks'
                  ? 'bg-white text-brand-red shadow-lg border border-white'
                  : 'bg-white/10 text-white/90 hover:bg-white/20 border border-white/15'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Saved</span>
              <span className="px-1.5 py-0.2 rounded-md bg-white/20 text-[9px] font-bold">
                {bookmarkedPostIds.length}
              </span>
            </button>
          </div>
        </div>
      </motion.section>

      {/* ── SECTION 2: CELEBRATION HUB (CONGLOMERATE RECOGNITION) ── */}
      <CelebrationHub userSubsidiary={user?.subsidiary_name} onSendWishPoints={adjustPulsePoints} />

      {/* ── MAIN TWO-COLUMN FEED GRID ── */}
      <div className="grid grid-cols-12 gap-6 items-start">

        {/* ════════ LEFT COLUMN: MAIN STREAM (8 COLS) ════════ */}
        <div className="col-span-12 lg:col-span-8 space-y-5">

          {/* ── URGENT SAFETY DIRECTIVE CALLOUT BANNER ── */}
          {unacknowledgedAlertsList.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-rose-500/10 dark:from-rose-950/40 dark:to-rose-950/40 border border-rose-300/80 dark:border-rose-900/60 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-600/20">
                  <AlertTriangle className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">
                      Safety Compliance Directive
                    </span>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200">
                      {unacknowledgedAlertsList.length} Action Required
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white mt-0.5 line-clamp-1">
                    {unacknowledgedAlertsList[0]?.title}
                  </h4>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                <button
                  onClick={() => setActiveTab('Safety Alerts')}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 text-rose-600 border border-rose-200 dark:border-rose-800 text-[10px] font-black uppercase tracking-wider hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  View All
                </button>
                <button
                  onClick={() => handleAcknowledgeAlert(unacknowledgedAlertsList[0]?.id)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-md shadow-rose-600/20 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Acknowledge</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* ── FLOATING SEARCH & CATEGORY FILTER BAR ── */}
          <div className="sticky top-4 z-30 bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 shadow-[0_12px_36px_-15px_rgba(0,0,0,0.08)] space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              {/* Search Field */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search updates, perks, authors, directives..."
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-600 dark:text-slate-300 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Admin Flagged Filter button */}
              {isAdmin && (
                <button
                  onClick={() => setFilterFlaggedOnly(!filterFlaggedOnly)}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                    filterFlaggedOnly
                      ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 text-rose-600'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                  }`}
                >
                  <AlertTriangle className={`w-3.5 h-3.5 ${filterFlaggedOnly ? 'text-rose-500' : 'text-slate-400'}`} />
                  <span>{filterFlaggedOnly ? 'Flagged Only' : 'Filter Flagged'}</span>
                </button>
              )}
            </div>

            {/* Pill Tabs with smooth slider */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {[
                { id: 'All Feed', label: 'All Feed', count: posts.length + offers.length + alerts.length, icon: Layers },
                { id: 'Announcements', label: 'Announcements', count: posts.filter(p => p.type?.toLowerCase() === 'announcement').length, icon: Megaphone },
                { id: 'Staff Offers', label: 'Staff Offers', count: offers.length, icon: Gift },
                { id: 'Safety Alerts', label: 'Safety Bulletins', count: alerts.length, icon: AlertTriangle },
                { id: 'Achievements', label: 'Achievements', count: posts.filter(p => p.type?.toLowerCase() === 'achievement').length, icon: Award },
                { id: 'Events', label: 'Events', count: posts.filter(p => p.type?.toLowerCase() === 'event').length, icon: Calendar },
                { id: 'Saved Bookmarks', label: 'Saved', count: bookmarkedPostIds.length, icon: Bookmark },
              ].map(tab => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative px-3.5 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer select-none ${
                      active
                        ? 'text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100/70 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {active && (
                      <motion.div
                        layoutId="activeFeedTab"
                        className="absolute inset-0 bg-brand-red rounded-xl shadow-md shadow-brand-red/20"
                        transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-1.5">
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                      <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-bold ${
                        active ? 'bg-white/25 text-white' : 'bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}>
                        {tab.count}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── CREATE POST COMPOSER (ADMINISTRATORS) ── */}
          {isAdmin && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
            >
              {/* Gold Top Accent Line */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-red via-brand-gold to-brand-red" />

              <div className="flex gap-4">
                {/* Author Avatar */}
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shadow-sm">
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'Admin')}&background=9e0e27&color=fff&bold=true`}
                      alt="User"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>

                {/* Input Area */}
                <div className="flex-1 space-y-3.5">
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Publish an official group update, announcement, or milestone..."
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red resize-none transition-all"
                  />

                  {/* Image Attachment Preview */}
                  {filePreview && (
                    <div className="relative aspect-[16/9] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner group/prev">
                      <img src={filePreview} alt="Upload preview" className="w-full h-full object-cover" />
                      <button
                        onClick={() => { setSelectedFile(null); setFilePreview(null); }}
                        className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all shadow-md"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Category Chips and Action Row */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current.click()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-brand-red" />
                        <span>Add Media</span>
                      </button>

                      {/* Post Type Selector Chips */}
                      {['general', 'announcement', 'achievement', 'event'].map(type => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setPostType(type)}
                          className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                            postType === type
                              ? 'bg-brand-red text-white shadow-sm shadow-brand-red/20'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2.5">
                      {isSuperOrGroupAdmin ? (
                        <select
                          value={postVisibility}
                          onChange={(e) => setPostVisibility(e.target.value)}
                          className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
                        >
                          <option value="global">🌍 Global</option>
                          <option value="subsidiary">🏢 Subsidiary</option>
                        </select>
                      ) : (
                        <span className="text-[10px] font-black uppercase tracking-wider text-brand-red bg-brand-red/5 px-2.5 py-1 rounded-xl">
                          🏢 {user?.subsidiary_name || 'My Subsidiary'}
                        </span>
                      )}

                      <button
                        onClick={handleCreatePost}
                        disabled={!newPostContent.trim() && !selectedFile}
                        className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-red to-brand-red-dark hover:brightness-110 text-white font-black text-[10px] uppercase tracking-wider shadow-md shadow-brand-red/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Publish</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── THE FEED STREAM (POSTS, OFFERS, ALERTS) ── */}
          <div className="space-y-5">
            <AnimatePresence mode="popLayout">
              {filteredStream.length > 0 ? (
                filteredStream.map((item, idx) => {

                  /* ── RENDER ITEM TYPE: STAFF OFFER / PERK ── */
                  if (item.itemType === 'offer') {
                    return (
                      <motion.div
                        key={`offer-${item.id}`}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.03 }}
                        className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[26px] border border-amber-200/80 dark:border-amber-900/40 p-5 sm:p-6 shadow-sm hover:shadow-lg transition-all relative overflow-hidden group"
                      >
                        {/* Gold-Ruby Top Ribbon */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-amber-300 to-brand-red" />

                        <div className="space-y-4">
                          {/* Scope & Badges */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/60 flex items-center gap-1.5">
                                <Gift className="w-3.5 h-3.5 text-amber-600" />
                                <span>{item.category || 'Conglomerate Perk'}</span>
                              </span>
                              {item.badge && (
                                <span className="px-2.5 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider bg-brand-red text-white shadow-sm">
                                  {item.badge}
                                </span>
                              )}
                            </div>

                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              {!item.subsidiary_id ? <Globe className="w-3.5 h-3.5 text-emerald-600" /> : <Building2 className="w-3.5 h-3.5 text-slate-500" />}
                              <span>{!item.subsidiary_id ? 'All Conglomerate' : item.subsidiary_name || 'Subsidiary Privilege'}</span>
                            </span>
                          </div>

                          {/* Title & Emoji */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1.5 flex-1 min-w-0">
                              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                                {item.title}
                              </h3>
                              <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                                {item.description}
                              </p>
                            </div>
                            <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 flex items-center justify-center text-3xl shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                              {item.emoji || '🎁'}
                            </div>
                          </div>

                          {/* Image if available */}
                          {item.image_url && (
                            <div className="aspect-[16/8] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800">
                              <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700" />
                            </div>
                          )}

                          {/* Validity & Claim CTA */}
                          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                              <Calendar className="w-3.5 h-3.5 text-amber-500" />
                              <span>{item.valid_until ? `Valid until ${item.valid_until}` : 'Ongoing employee perk'}</span>
                            </div>

                            <button
                              onClick={() => handleCopyOffer(item.id, item.badge)}
                              className={`py-2 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95 ${
                                copiedOfferId === item.id
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black'
                              }`}
                            >
                              {copiedOfferId === item.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedOfferId === item.id ? 'Copied Promo Code!' : (item.cta || 'Claim Perk Code')}</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  }

                  /* ── RENDER ITEM TYPE: SAFETY DIRECTIVE / ALERT ── */
                  if (item.itemType === 'alert') {
                    const isAcknowledged = acknowledgedAlerts[item.id];
                    return (
                      <motion.div
                        key={`alert-${item.id}`}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.03 }}
                        className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[26px] border border-rose-300/80 dark:border-rose-900/50 p-5 sm:p-6 shadow-sm hover:shadow-lg transition-all relative overflow-hidden group"
                      >
                        {/* Severity Top Accent */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-500" />

                        <div className="space-y-4">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-wider bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/60 flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                                <span>Safety Notice &amp; Directive</span>
                              </span>
                              <span className="px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200">
                                Mandatory Compliance
                              </span>
                            </div>

                            <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              {!item.subsidiary_id ? <Globe className="w-3.5 h-3.5 text-emerald-600" /> : <Building2 className="w-3.5 h-3.5 text-slate-500" />}
                              <span>{!item.subsidiary_id ? 'All Group' : item.subsidiary_name || 'Subsidiary Directive'}</span>
                            </span>
                          </div>

                          <div className="flex items-start gap-3.5">
                            <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-800 shadow-sm">
                              <ShieldAlert className="w-5 h-5 animate-pulse" />
                            </div>
                            <div>
                              <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                                {item.title}
                              </h3>
                              <p className="text-[10px] font-bold text-slate-400 mt-1 flex items-center gap-1.5">
                                <Clock className="w-3 h-3" />
                                <span>Issued {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                              </p>
                            </div>
                          </div>

                          {/* Directive Message Box */}
                          <div className="p-4 rounded-2xl text-xs font-semibold leading-relaxed border bg-rose-50/70 dark:bg-rose-950/30 text-rose-950 dark:text-rose-100 border-rose-200/80 dark:border-rose-900/60">
                            {item.message}
                          </div>

                          {/* Footer with acknowledge action */}
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                              <Shield className="w-3.5 h-3.5 text-slate-400" />
                              <span>Compliance Tracking Active</span>
                            </span>

                            <button
                              onClick={() => handleAcknowledgeAlert(item.id)}
                              disabled={isAcknowledged}
                              className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                                isAcknowledged
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200/60 cursor-default'
                                  : 'bg-slate-950 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 shadow-md'
                              }`}
                            >
                              <Check className="w-4 h-4" />
                              <span>{isAcknowledged ? 'Acknowledged ✓' : 'Acknowledge Directive'}</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  }

                  /* ── RENDER ITEM TYPE: REGULAR POST ── */
                  const post = item;
                  const isBookmarked = bookmarkedPostIds.includes(post.id);

                  return (
                    <motion.div
                      key={`post-${post.id}`}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: idx * 0.03 }}
                      className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-[26px] border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden relative group"
                    >
                      {/* Top Accent Strip depending on type */}
                      {post.type === 'announcement' && (
                        <div className="h-1 w-full bg-gradient-to-r from-brand-red via-rose-500 to-amber-500" />
                      )}
                      {post.type === 'achievement' && (
                        <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />
                      )}
                      {post.type === 'event' && (
                        <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-400 to-blue-600" />
                      )}

                      {/* Header */}
                      <div className="p-5 sm:p-6 pb-3 flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3.5">
                          {/* Avatar */}
                          <div className="relative">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm flex items-center justify-center text-brand-red font-black text-lg">
                              {post.profile_pic ? (
                                <img src={post.profile_pic} alt={post.author_name} className="w-full h-full object-cover" />
                              ) : (
                                <span>{post.author_name?.split(' ').map(n => n[0]).join('') || 'GS'}</span>
                              )}
                            </div>
                            {post.type === 'announcement' && (
                              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-brand-red text-white rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm">
                                <Zap className="w-2.5 h-2.5" />
                              </div>
                            )}
                          </div>

                          {/* Author Info */}
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-black text-slate-900 dark:text-white text-sm">
                                {post.author_name}
                              </h4>
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider ${getPostBadgeStyle(post.type)}`}>
                                {post.type || 'General'}
                              </span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 flex items-center gap-1.5">
                              <span className="text-brand-red font-black">{post.subsidiary_name || 'GEORGE STEUART'}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {formatTimeAgo(post.created_at)}
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Status Badges & Menu */}
                        <div className="flex items-center gap-1.5 relative">
                          {post.is_pinned === 1 && (
                            <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-xl border border-amber-200/60 text-[9px] font-black uppercase tracking-wider select-none">
                              <Pin className="w-3 h-3 fill-amber-500 text-amber-500" />
                              <span>Pinned</span>
                            </div>
                          )}

                          {post.is_flagged === 1 && (
                            <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 px-2.5 py-1 rounded-xl border border-rose-200/60 text-[9px] font-black uppercase tracking-wider select-none">
                              <AlertTriangle className="w-3 h-3 fill-rose-500 text-rose-500" />
                              <span>Flagged</span>
                            </div>
                          )}

                          <button
                            onClick={() => toggleBookmark(post.id)}
                            className={`p-2 rounded-xl transition-colors cursor-pointer ${
                              isBookmarked
                                ? 'bg-rose-50 dark:bg-rose-950/40 text-brand-red'
                                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                            }`}
                            title={isBookmarked ? "Remove bookmark" : "Bookmark update"}
                          >
                            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                          </button>

                          {/* Dropdown Menu Trigger */}
                          <div className="relative">
                            <button
                              onClick={() => setActivePostMenu(activePostMenu === post.id ? null : post.id)}
                              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            <AnimatePresence>
                              {activePostMenu === post.id && (
                                <>
                                  <div className="fixed inset-0 z-10" onClick={() => setActivePostMenu(null)} />
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 8 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: 8 }}
                                    className="absolute right-0 mt-1.5 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-20 py-1.5 overflow-hidden"
                                  >
                                    {(post.author_id === user?.id || isAdmin) && (
                                      <button
                                        onClick={() => {
                                          setEditingPost(post);
                                          setActivePostMenu(null);
                                        }}
                                        className="w-full px-4 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
                                      >
                                        <Edit2 className="w-3.5 h-3.5 text-indigo-500" />
                                        <span>Edit Update</span>
                                      </button>
                                    )}

                                    {isAdmin && (
                                      <button
                                        onClick={() => {
                                          handleTogglePin(post);
                                          setActivePostMenu(null);
                                        }}
                                        className="w-full px-4 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
                                      >
                                        <Pin className={`w-3.5 h-3.5 ${post.is_pinned ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
                                        <span>{post.is_pinned ? 'Unpin Post' : 'Pin to Top'}</span>
                                      </button>
                                    )}

                                    <button
                                      onClick={() => {
                                        handleToggleFlag(post);
                                        setActivePostMenu(null);
                                      }}
                                      className="w-full px-4 py-2 text-left text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-colors cursor-pointer"
                                    >
                                      <AlertTriangle className={`w-3.5 h-3.5 ${post.is_flagged ? 'text-rose-500 fill-rose-500' : 'text-slate-400'}`} />
                                      <span>{post.is_flagged ? 'Remove Flag' : 'Flag Inappropriate'}</span>
                                    </button>

                                    {(post.author_id === user?.id || isAdmin) && (
                                      <button
                                        onClick={() => {
                                          handleDeletePost(post.id);
                                          setActivePostMenu(null);
                                        }}
                                        className="w-full px-4 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 transition-colors border-t border-slate-100 dark:border-slate-800 cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                        <span>Delete Post</span>
                                      </button>
                                    )}
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="px-5 sm:px-6 pb-4">
                        <p className="text-slate-700 dark:text-slate-200 text-xs sm:text-sm leading-relaxed font-normal whitespace-pre-wrap">
                          {post.content}
                        </p>
                      </div>

                      {/* Post Media Image */}
                      {post.image_url && (
                        <div className="px-5 sm:px-6 pb-4">
                          <div className="aspect-[16/9] rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-800 shadow-inner group/media">
                            <img
                              src={post.image_url}
                              alt="Post Media"
                              className="w-full h-full object-cover group-hover/media:scale-[1.02] transition-transform duration-700 cursor-zoom-in"
                              onClick={() => setSelectedJoiner({ group_image: post.image_url, group_details: post.content })}
                            />
                          </div>
                        </div>
                      )}

                      {/* Interactive Actions Bar */}
                      <div className="px-5 sm:px-6 py-3 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Reaction button with hover dock */}
                          <div
                            className="relative flex items-center"
                            onMouseEnter={() => setActiveReactionHoverPost(post.id)}
                            onMouseLeave={() => setActiveReactionHoverPost(null)}
                          >
                            {/* Hover Reaction Panel */}
                            <AnimatePresence>
                              {activeReactionHoverPost === post.id && (
                                <>
                                  <div
                                    className="fixed inset-0 z-30 block md:hidden cursor-default"
                                    onClick={() => setActiveReactionHoverPost(null)}
                                  />
                                  <motion.div
                                    initial={{ opacity: 0, y: 8, scale: 0.85 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 8, scale: 0.85 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute bottom-full left-0 mb-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 rounded-2xl shadow-[0_15px_35px_rgba(0,0,0,0.15)] flex gap-1.5 z-40"
                                  >
                                    {Object.entries(REACTION_CONFIG).map(([type, cfg]) => (
                                      <motion.button
                                        key={type}
                                        whileHover={{ scale: 1.3, y: -4 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => {
                                          handleReact(post.id, type);
                                          setActiveReactionHoverPost(null);
                                        }}
                                        className="w-9 h-9 rounded-xl flex items-center justify-center text-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative group/emoji cursor-pointer"
                                      >
                                        <span>{cfg.emoji}</span>
                                        <span className="absolute bottom-full mb-1.5 bg-slate-900 text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md opacity-0 group-hover/emoji:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-50">
                                          {cfg.label}
                                        </span>
                                      </motion.button>
                                    ))}
                                  </motion.div>
                                </>
                              )}
                            </AnimatePresence>

                            {/* Trigger Button */}
                            {(() => {
                              const rxn = post.user_reaction ? REACTION_CONFIG[post.user_reaction] : null;
                              return (
                                <button
                                  onClick={() => handleDefaultReactClick(post.id)}
                                  onTouchStart={() => handleTouchStart(post.id)}
                                  onTouchEnd={handleTouchEnd}
                                  onTouchCancel={handleTouchEnd}
                                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border cursor-pointer select-none ${
                                    rxn
                                      ? 'border-transparent shadow-sm'
                                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                  }`}
                                  style={rxn ? { background: rxn.bg, color: rxn.color } : {}}
                                >
                                  <span className="text-sm leading-none">{rxn ? rxn.emoji : '👍'}</span>
                                  <span>{rxn ? rxn.label : 'Like'}</span>
                                </button>
                              );
                            })()}
                          </div>

                          {/* Reaction Counter with Overlapping Emojis */}
                          {post.likes > 0 && (
                            <button
                              onClick={() => handleViewReactions(post)}
                              className="flex items-center hover:opacity-80 transition-opacity cursor-pointer"
                            >
                              {renderReactionIcons(post.reaction_types)}
                              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400">
                                {post.likes}
                              </span>
                            </button>
                          )}
                        </div>

                        {/* Share Button */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSharingPost(post)}
                            className="p-2 text-slate-400 hover:text-brand-red hover:bg-brand-red/5 rounded-xl transition-colors cursor-pointer"
                            title="Share update"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                /* Empty state */
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[28px] border border-slate-200/80 dark:border-slate-800 text-center py-16 px-6">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                    <Rss className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-black text-slate-800 dark:text-white">
                    No matching updates found
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                    Try adjusting your search keywords or switch category filter to explore other group activities.
                  </p>
                  <button
                    onClick={() => { setSearchQuery(''); setActiveTab('All Feed'); }}
                    className="mt-4 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-black uppercase tracking-wider transition-colors cursor-pointer"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ════════ RIGHT COLUMN: INTELLIGENCE SIDEBAR (4 COLS) ════════ */}
        <div className="hidden lg:block lg:col-span-4 space-y-5 sticky top-4 h-fit">

          {/* ── WIDGET 1: CONGLOMERATE PULSE & ENGAGEMENT ── */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-brand-gold to-brand-red" />

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-sm">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                    Pulse Points
                  </h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    Conglomerate Recognition
                  </p>
                </div>
              </div>

              <span className="text-lg font-black text-amber-500">
                {pulsePoints} <span className="text-[10px] text-slate-400 font-bold uppercase">PTS</span>
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[10px] font-bold">
                <span className="text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tier Status</span>
                <span className="text-brand-red font-black uppercase">Pioneer Contributor</span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-amber-500 to-brand-red h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (pulsePoints / 300) * 100)}%` }}
                />
              </div>
              <p className="text-[9px] font-medium text-slate-400 leading-tight">
                Earn points by reacting (+5), sharing updates (+5), sending birthday wishes (+10), or publishing posts (+25).
              </p>
            </div>
          </motion.div>

          {/* ── WIDGET 2: FEATURED PERKS SPOTLIGHT ── */}
          {offers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-brand-red" />

              <div className="flex items-center justify-between mb-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center border border-amber-200/50">
                    <Gift className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                      Staff Privileges
                    </h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      Exclusive Perks
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('Staff Offers')}
                  className="text-[9px] font-black uppercase tracking-wider text-brand-red hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>All ({offers.length})</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-2.5">
                {offers.slice(0, 2).map((offer) => (
                  <div
                    key={offer.id}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 hover:border-amber-200 dark:hover:border-amber-900/50 transition-all space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        {offer.badge && (
                          <span className="inline-block px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 text-[8px] font-black uppercase tracking-wider mb-0.5">
                            {offer.badge}
                          </span>
                        )}
                        <h4 className="text-xs font-black text-slate-800 dark:text-white truncate">
                          {offer.title}
                        </h4>
                      </div>
                      <span className="text-lg shrink-0">{offer.emoji || '🎁'}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[9px] font-bold text-slate-400 truncate max-w-[120px]">
                        {offer.subsidiary_name || 'All Conglomerate'}
                      </span>
                      <button
                        onClick={() => handleCopyOffer(offer.id, offer.badge)}
                        className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                          copiedOfferId === offer.id
                            ? 'bg-emerald-600 text-white'
                            : 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black'
                        }`}
                      >
                        {copiedOfferId === offer.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedOfferId === offer.id ? 'Copied' : 'Claim'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── WIDGET 3: DID YOU KNOW? (HERITAGE & TRIVIA) ── */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-red via-brand-gold to-indigo-500" />

            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center border border-indigo-200/50">
                  <span className="text-base">🧠</span>
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                    Did You Know?
                  </h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    Heritage &amp; Conglomerate Insights
                  </p>
                </div>
              </div>

              {isAdmin && (
                <button
                  onClick={() => {
                    setEditingFact(null);
                    setFactContent('');
                    setFactModalOpen(true);
                  }}
                  className="p-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 transition-colors text-[9px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              )}
            </div>

            {facts.length === 0 ? (
              <p className="text-xs font-medium text-slate-400 italic">No facts published yet.</p>
            ) : (
              <div className="space-y-3">
                {facts.slice(0, 3).map((fact) => (
                  <div
                    key={fact.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 relative group/fact"
                  >
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed pr-6">
                      "{fact.content}"
                    </p>

                    {isAdmin && (
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-0 group-hover/fact:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingFact(fact);
                            setFactContent(fact.content);
                            setFactModalOpen(true);
                          }}
                          className="p-1 rounded bg-white dark:bg-slate-700 text-slate-500 hover:text-indigo-600 shadow-sm"
                          title="Edit"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteFact(fact.id)}
                          className="p-1 rounded bg-white dark:bg-slate-700 text-slate-500 hover:text-rose-600 shadow-sm"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* ── WIDGET 4: WELCOME NEW JOINERS ── */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-red to-amber-500" />

            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-pink-50 dark:bg-pink-950/40 text-pink-600 flex items-center justify-center border border-pink-200/50">
                  <span className="text-base">🎉</span>
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                    Welcome Joiners
                  </h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    New Additions to the Family
                  </p>
                </div>
              </div>

              {isSuperOrGroupAdmin && (
                <button
                  onClick={() => {
                    clearJoinerFields();
                    setJoinerModalOpen(true);
                  }}
                  className="p-1.5 rounded-xl bg-pink-50 dark:bg-pink-950/60 text-pink-600 dark:text-pink-300 hover:bg-pink-100 transition-colors text-[9px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              )}
            </div>

            {joiners.length === 0 ? (
              <p className="text-xs font-medium text-slate-400 italic">No new joiner banner added this month.</p>
            ) : (
              <div>
                {joiners.find(j => j.group_image) ? (() => {
                  const targetJoiner = joiners.find(j => j.group_image);
                  const welcomeDate = new Date(targetJoiner.join_date);
                  const welcomeMonthYear = welcomeDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                  return (
                    <div className="rounded-2xl bg-gradient-to-br from-[#800C1F] via-[#9E0E27] to-[#500813] p-4 text-white shadow-md relative group/joiner">
                      <div className="flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-amber-200 mb-2">
                        <span>ESTD 1835 • GS</span>
                        <span>{welcomeMonthYear}</span>
                      </div>

                      <div
                        className="rounded-xl overflow-hidden aspect-[16/10] bg-black/40 cursor-zoom-in relative mb-3 border border-white/10"
                        onClick={() => setSelectedJoiner(targetJoiner)}
                      >
                        <img
                          src={targetJoiner.group_image}
                          alt="Welcome Group"
                          className="w-full h-full object-cover group-hover/joiner:scale-[1.03] transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                      </div>

                      {targetJoiner.group_details && (
                        <p className="text-[10px] text-white/80 leading-relaxed font-medium line-clamp-3 bg-black/20 p-2.5 rounded-xl border border-white/10">
                          {targetJoiner.group_details}
                        </p>
                      )}

                      {isSuperOrGroupAdmin && (
                        <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover/joiner:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingJoiner(targetJoiner);
                              setJoinerDate(targetJoiner.join_date ? targetJoiner.join_date.substring(0, 10) : '');
                              setJoinerGroupImg(targetJoiner.group_image || '');
                              setJoinerGroupDetails(targetJoiner.group_details || '');
                              setJoinerModalOpen(true);
                            }}
                            className="p-1 rounded bg-white/90 text-slate-800 hover:text-indigo-600 shadow-sm"
                            title="Edit"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleDeleteJoiner(targetJoiner.id)}
                            className="p-1 rounded bg-white/90 text-slate-800 hover:text-rose-600 shadow-sm"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })() : (
                  <p className="text-xs font-medium text-slate-400 italic">No welcome photo available.</p>
                )}
              </div>
            )}
          </motion.div>

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
         MODALS & OVERLAYS (SHARE, REACTIONS, EDIT, LIGHTBOX, FACT, JOINER)
         ══════════════════════════════════════════════════════════════════════ */}

      {/* ── REACTIONS DETAIL MODAL (FACEBOOK / LINKEDIN STYLE) ── */}
      <AnimatePresence>
        {selectedPostReactions && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPostReactions(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white dark:bg-slate-900 rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full z-10 overflow-hidden flex flex-col max-h-[80vh]"
            >
              {/* Header */}
              <div className="p-5 pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Post Reactions
                </h3>
                <button
                  onClick={() => setSelectedPostReactions(null)}
                  className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Reaction filter tabs */}
              <div className="flex items-center gap-1.5 px-5 py-2.5 border-b border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar bg-slate-50/50 dark:bg-slate-900/50">
                <button
                  onClick={() => setReactionsModalTab('all')}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap border ${
                    reactionsModalTab === 'all'
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  All ({selectedPostReactions.list.length})
                </button>

                {(() => {
                  const counts = selectedPostReactions.list.reduce((acc, r) => {
                    acc[r.type] = (acc[r.type] || 0) + 1;
                    return acc;
                  }, {});

                  return Object.entries(REACTION_CONFIG).map(([type, cfg]) => {
                    const count = counts[type] || 0;
                    if (count === 0) return null;
                    return (
                      <button
                        key={type}
                        onClick={() => setReactionsModalTab(type)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap border flex items-center gap-1 ${
                          reactionsModalTab === type
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <span>{cfg.emoji}</span>
                        <span>{cfg.label}</span>
                        <span className="opacity-70">({count})</span>
                      </button>
                    );
                  });
                })()}
              </div>

              {/* Reactor List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3 min-h-[220px]">
                {reactionsModalLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="w-7 h-7 border-2 border-slate-200 border-t-brand-red rounded-full animate-spin" />
                  </div>
                ) : selectedPostReactions.list.filter(r => reactionsModalTab === 'all' || r.type === reactionsModalTab).length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <p className="text-xs font-bold uppercase tracking-wider">No reactions yet</p>
                  </div>
                ) : (
                  selectedPostReactions.list
                    .filter(r => reactionsModalTab === 'all' || r.type === reactionsModalTab)
                    .map((reactor) => {
                      const cfg = REACTION_CONFIG[reactor.type];
                      return (
                        <div key={reactor.user_id} className="flex items-center gap-3.5 py-1">
                          <div className="relative shrink-0">
                            <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-brand-red">
                              {reactor.profile_pic ? (
                                <img src={reactor.profile_pic} alt={reactor.full_name} className="w-full h-full object-cover" />
                              ) : (
                                <span>{reactor.full_name?.split(' ').map(n => n[0]).join('') || 'GS'}</span>
                              )}
                            </div>
                            <div
                              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-sm border border-white dark:border-slate-900"
                              style={{ background: cfg?.bg || '#eff6ff' }}
                            >
                              {cfg?.emoji || '👍'}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-black text-slate-800 dark:text-white truncate">
                              {reactor.full_name}
                            </h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">
                              {reactor.subsidiary_name || 'GEORGE STEUART'}
                            </p>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── SHARE MODAL DIALOG ── */}
      <AnimatePresence>
        {sharingPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSharingPost(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white dark:bg-slate-900 rounded-[28px] p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full z-10 space-y-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Share Update</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Connect with team members</p>
                </div>
                <button
                  onClick={() => setSharingPost(null)}
                  className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-600 dark:text-slate-300 italic line-clamp-3">
                  "{sharingPost.content}"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => copyPostLink(sharingPost)}
                  className="p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl border border-slate-200 dark:border-slate-700 transition-all flex flex-col items-center gap-2 font-black text-[10px] uppercase tracking-wider text-slate-700 dark:text-slate-200 cursor-pointer shadow-sm"
                >
                  <ExternalLink className="w-5 h-5 text-brand-red" />
                  <span>Copy Link</span>
                </button>

                <button
                  onClick={() => {
                    triggerToast('Update shared to Subsidiary Channel!', <CheckCircle2 className="w-5 h-5 text-emerald-500" />);
                    adjustPulsePoints(5, 'Shared internally');
                    setSharingPost(null);
                  }}
                  className="p-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl border border-slate-200 dark:border-slate-700 transition-all flex flex-col items-center gap-2 font-black text-[10px] uppercase tracking-wider text-slate-700 dark:text-slate-200 cursor-pointer shadow-sm"
                >
                  <Send className="w-5 h-5 text-blue-500" />
                  <span>Internal Chat</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── EDIT POST MODAL DIALOG ── */}
      <AnimatePresence>
        {editingPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingPost(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white dark:bg-slate-900 rounded-[28px] p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full z-10 space-y-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">Edit Post Update</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Update text and category</p>
                </div>
                <button
                  onClick={() => setEditingPost(null)}
                  className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Content</label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red resize-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Category</label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="general">General</option>
                    <option value="announcement">Announcement</option>
                    <option value="achievement">Achievement</option>
                    <option value="event">Event</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Visibility</label>
                  <select
                    value={editVisibility}
                    onChange={(e) => setEditVisibility(e.target.value)}
                    disabled={!isSuperOrGroupAdmin}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer disabled:opacity-50"
                  >
                    <option value="global">🌍 Global Reach</option>
                    <option value="subsidiary">🏢 Subsidiary Only</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setEditingPost(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdatePost}
                  disabled={!editContent.trim()}
                  className="px-5 py-2 bg-brand-red hover:bg-brand-red-dark text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md shadow-brand-red/20 transition-all cursor-pointer disabled:opacity-40"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── FACT ADD/EDIT MODAL ── */}
      <AnimatePresence>
        {factModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFactModalOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white dark:bg-slate-900 rounded-[28px] p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full z-10 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {editingFact ? 'Edit Heritage Fact' : 'Add Heritage Insight'}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">George Steuart History &amp; Milestones</p>
                </div>
                <button
                  onClick={() => setFactModalOpen(false)}
                  className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <textarea
                value={factContent}
                onChange={(e) => setFactContent(e.target.value)}
                rows={4}
                placeholder="E.g. George Steuart & Co. was founded in 1835 as Sri Lanka's oldest mercantile establishment..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red resize-none transition-all"
              />

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setFactModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddOrUpdateFact}
                  disabled={!factContent.trim()}
                  className="px-5 py-2 bg-brand-red text-white hover:bg-brand-red-dark rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md shadow-brand-red/20 transition-all cursor-pointer disabled:opacity-40"
                >
                  {editingFact ? 'Save Fact' : 'Publish Fact'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── JOINER ADD/EDIT MODAL ── */}
      <AnimatePresence>
        {joinerModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setJoinerModalOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative bg-white dark:bg-slate-900 rounded-[28px] p-6 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full z-10 space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    {editingJoiner ? 'Edit Welcome Board' : 'Welcome New Joiners'}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Celebrate team members joining the conglomerate</p>
                </div>
                <button
                  onClick={() => setJoinerModalOpen(false)}
                  className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Join Date</label>
                  <input
                    type="date"
                    value={joinerDate}
                    onChange={(e) => setJoinerDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Group Photo</label>
                  {joinerGroupImg ? (
                    <div className="relative rounded-2xl overflow-hidden aspect-[16/7] border border-slate-200 group/prev">
                      <img src={joinerGroupImg} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setJoinerGroupImg('')}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/prev:opacity-100 transition-opacity text-white text-xs font-black uppercase tracking-wider"
                      >
                        Remove Photo
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full aspect-[16/7] rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-brand-red cursor-pointer transition-colors">
                      <span className="text-xl">📸</span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-1">
                        {isUploadingGroup ? 'Uploading image...' : 'Click to Upload Group Photo'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, 'group')}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">Welcome Details</label>
                  <textarea
                    value={joinerGroupDetails}
                    onChange={(e) => setJoinerGroupDetails(e.target.value)}
                    rows={4}
                    placeholder="01st Row: Sanduni - GS Teas | Dilshan - GS Health&#10;02nd Row: Nimali - GS Travel | Asiri - GS Consumer"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setJoinerModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddOrUpdateJoiner}
                  disabled={!joinerDate}
                  className="px-5 py-2 bg-brand-red text-white hover:bg-brand-red-dark rounded-xl text-[10px] font-black uppercase tracking-wider shadow-md shadow-brand-red/20 transition-all cursor-pointer disabled:opacity-40"
                >
                  {editingJoiner ? 'Save Details' : 'Welcome Joiners'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── LIGHTBOX ZOOM FOR GROUP / POST MEDIA ── */}
      <AnimatePresence>
        {selectedJoiner && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedJoiner(null)}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-md cursor-zoom-out"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-4xl w-full flex flex-col items-center gap-3 z-10"
            >
              <button
                onClick={() => setSelectedJoiner(null)}
                className="absolute -top-10 right-0 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-all shadow-md"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-full rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-black flex items-center justify-center max-h-[75vh]">
                <img
                  src={selectedJoiner.group_image}
                  alt="Enlarged Media View"
                  className="max-w-full max-h-[75vh] object-contain rounded-xl"
                />
              </div>

              {selectedJoiner.group_details && (
                <div className="w-full bg-slate-900/95 border border-white/15 p-4 rounded-xl text-white text-xs leading-relaxed text-center whitespace-pre-line shadow-xl backdrop-blur-md max-h-[15vh] overflow-y-auto">
                  {selectedJoiner.group_details}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Feed;
