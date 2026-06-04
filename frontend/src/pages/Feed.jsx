import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Image as ImageIcon, Send, MessageSquare, Share2, Bookmark,
  MoreHorizontal, Rss, Trash2,
  ChevronDown, ChevronUp, Sparkles, AlertCircle,
  Clock, X, CheckCircle2, BookmarkCheck,
  Cake, Gift,
  Search, Filter, Plus, Zap, Check, ExternalLink,
  TrendingUp, Users, Eye, Heart, BarChart3, Award, Activity,
  Edit2, Pin, AlertTriangle, ShieldAlert, ShieldCheck
} from 'lucide-react';

const REACTION_CONFIG = {
  like:       { label: 'Like',       emoji: '👍', color: '#3b82f6', bg: '#eff6ff' },
  appreciate: { label: 'Appreciate', emoji: '❤️', color: '#f43f5e', bg: '#fff1f2' },
  greatjob:   { label: 'Great Job',  emoji: '👏', color: '#10b981', bg: '#f0fdf4' },
  amazing:    { label: 'Amazing',    emoji: '🔥', color: '#f59e0b', bg: '#fffbeb' },
  celebrate:  { label: 'Celebrate',  emoji: '🎉', color: '#6366f1', bg: '#eef2ff' },
};

// CelebrationHub component – horizontal slider showing birthday cards for the current subsidiary
function CelebrationHub({ userSubsidiary }) {
  const navigate = useNavigate();
  const [birthdays, setBirthdays] = useState([]);
  const [loading, setLoading] = useState(true);

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
      `🎉 Happy Birthday, ${person.full_name.split(' ')[0]}! Wishing you a fantastic day and a wonderful year ahead! 🎂✨`
    );
    navigate('/messages');
  };

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

  useEffect(() => {
    const fetchBirthdays = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/users/birthdays');
        if (res.data && res.data.length > 0) {
          setBirthdays(res.data.map(b => ({
            ...b,
            photo: b.profile_pic || `https://ui-avatars.com/api/?name=${b.full_name}&background=eef2ff&color=4f46e5&bold=true`,
            wishes: Math.floor(Math.random() * 15) + 5
          })));
        } else {
          // Fallback mock data with calculated age from date_of_birth
          const mockBirthdayData = [
            { id: 'mock_1', full_name: 'Sanduni Perera', date_of_birth: '2000-05-21', photo: 'https://randomuser.me/api/portraits/women/44.jpg', wishes: 24, subsidiary_name: 'GS Teas' },
            { id: 'mock_2', full_name: 'Dilshan Silva', date_of_birth: '1996-05-21', photo: 'https://randomuser.me/api/portraits/men/22.jpg', wishes: 15, subsidiary_name: 'GS Health' },
            { id: 'mock_3', full_name: 'Nimali Fernando', date_of_birth: '1998-05-21', photo: 'https://randomuser.me/api/portraits/women/8.jpg', wishes: 31, subsidiary_name: 'GS Travel' }
          ];
          setBirthdays(mockBirthdayData.map(b => ({
            ...b,
            age: calculateAge(b.date_of_birth)
          })));
        }
      } catch (err) {
        console.error('Failed to fetch birthdays', err);
        // Fallback mock data
        const mockBirthdayData = [
          { id: 'mock_1', full_name: 'Sanduni Perera', date_of_birth: '2000-05-21', photo: 'https://randomuser.me/api/portraits/women/44.jpg', wishes: 24, subsidiary_name: 'GS Teas' },
          { id: 'mock_2', full_name: 'Dilshan Silva', date_of_birth: '1996-05-21', photo: 'https://randomuser.me/api/portraits/men/22.jpg', wishes: 15, subsidiary_name: 'GS Health' },
          { id: 'mock_3', full_name: 'Nimali Fernando', date_of_birth: '1998-05-21', photo: 'https://randomuser.me/api/portraits/women/8.jpg', wishes: 31, subsidiary_name: 'GS Travel' }
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

  // Filter to current subsidiary
  const filtered = birthdays.filter(b => b.subsidiary_name === userSubsidiary || !b.subsidiary_name);

  const sliderRef = useRef(null);
  const [autoSlide, setAutoSlide] = useState(true);

  // Auto‑slide logic – scrolls the container horizontally every 4 seconds
  useEffect(() => {
    if (!autoSlide || filtered.length === 0) return;
    const interval = setInterval(() => {
      if (sliderRef.current) {
        const { scrollWidth, clientWidth, scrollLeft } = sliderRef.current;
        const maxScroll = scrollWidth - clientWidth;
        const next = scrollLeft + clientWidth * 0.8;
        sliderRef.current.scrollTo({ left: next > maxScroll ? 0 : next, behavior: 'smooth' });
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [autoSlide, filtered]);

  return (
    <div className="relative bg-gradient-to-r from-pink-200 via-purple-200 to-indigo-200 p-6 rounded-2xl overflow-hidden shadow-xl animate-float">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes confetti-fall {
          0% { transform: translateY(-100%) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
        .confetti::before,
        .confetti::after {
          content: '';
          position: absolute;
          top: -10%;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          background-image: radial-gradient(circle, rgba(255,255,255,0.9) 20%, transparent 20%),
                            radial-gradient(circle, rgba(255,215,0,0.9) 20%, transparent 20%);
          background-size: 10px 10px;
          animation: confetti-fall 3s linear infinite;
          opacity: 0.8;
        }

        /* Ensure scrollbar hidden for slider */
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
      ` }} />
      {/* Confetti burst – CSS animation */}
      <div className="confetti absolute inset-0 pointer-events-none" />
      <h2 className="text-xl font-black text-slate-800 mb-4">Celebration Hub</h2>
      <div
        className="flex gap-4 overflow-x-auto scroll-smooth scrollbar-none"
        ref={sliderRef}
        onMouseEnter={() => setAutoSlide(false)}
        onMouseLeave={() => setAutoSlide(true)}
      >
        {filtered.map(person => (
          <motion.div
            key={person.id}
            className="min-w-[260px] bg-white/90 backdrop-blur-md rounded-3xl border border-slate-100 shadow-lg p-5 flex flex-col items-center hover:scale-105 hover:shadow-2xl transition-all"
            whileHover={{ scale: 1.03 }}
          >
            <div className="flex items-center gap-2 mb-2 w-full justify-between">
              <span className="text-sm font-black uppercase text-pink-600">Today's Star</span>
              <Cake className="w-5 h-5 text-amber-500" />
            </div>
            <img
              src={person.photo}
              alt={person.full_name}
              className="w-24 h-24 rounded-full object-cover border-4 border-pink-200 mb-3 shadow-md"
            />
            <p className="font-black text-slate-800 text-lg">{person.full_name}</p>
            <p className="text-sm text-slate-500 mb-2">
              Turning {person.age || calculateAge(person.date_of_birth)} Today <span className="animate-pulse">✨</span>
            </p>
            <div className="flex items-center gap-2 mb-3 text-rose-500 font-black">
              <Heart className="w-4 h-4" /> {person.wishes} Wishes
            </div>
            <button 
              onClick={() => handleSendWishes(person)}
              className="px-4 py-2 bg-pink-600 text-white rounded-xl hover:bg-pink-700 transition-colors font-black text-sm active:scale-95 transition-all shadow-md hover:shadow-pink-500/20"
            >
              Send Wishes
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}



const Feed = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'sub_admin' || user?.role === 'it_admin' || user?.role === 'hr_admin';

  // Moderation, Pinning, and options menu state
  const [activePostMenu, setActivePostMenu] = useState(null);
  const [showModPanel, setShowModPanel] = useState(false);
  const [filterFlaggedOnly, setFilterFlaggedOnly] = useState(false);

  // Post Editing state
  const [editingPost, setEditingPost] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editType, setEditType] = useState('general');
  const [editVisibility, setEditVisibility] = useState('global');
  const [editSubsidiary, setEditSubsidiary] = useState('');

  // When editingPost changes, populate fields
  useEffect(() => {
    if (editingPost) {
      setEditContent(editingPost.content);
      setEditType(editingPost.type || 'general');
      setEditVisibility(editingPost.visibility || 'global');
      setEditSubsidiary(editingPost.subsidiary_id || '');
    }
  }, [editingPost]);

  const [posts, setPosts] = useState([]);
  
  // Did You Know & Welcome New Joiners states
  const [facts, setFacts] = useState([]);
  const [joiners, setJoiners] = useState([]);
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
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [activeTab, setActiveTab] = useState('All Feed');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const fileInputRef = useRef(null);
  const [postVisibility, setPostVisibility] = useState(user?.role === 'super_admin' ? 'global' : 'subsidiary');
  const [postType, setPostType] = useState('general');

  const [searchQuery, setSearchQuery] = useState('');
  const [activeReactionHoverPost, setActiveReactionHoverPost] = useState(null);
  const [sharingPost, setSharingPost] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', icon: null });
  const [celebrationEmoji, setCelebrationEmoji] = useState(null);

  // Reactions detail modal state (Facebook-style)
  const [selectedPostReactions, setSelectedPostReactions] = useState(null); // { post, list: [] }
  const [reactionsModalLoading, setReactionsModalLoading] = useState(false);
  const [reactionsModalTab, setReactionsModalTab] = useState('all');

  // Long press timer for mobile
  const touchTimerRef = useRef(null);
  


  // Local storage enhancements (Pulse Points, liked state, bookmark state, poll state)
  const [pulsePoints, setPulsePoints] = useState(() => {
    const stored = localStorage.getItem(`pulse_points_${user?.id}`);
    return stored ? parseInt(stored) : 150;
  });

  const [bookmarkedPostIds, setBookmarkedPostIds] = useState(() => {
    const stored = localStorage.getItem(`bookmarked_posts_${user?.id}`);
    return stored ? JSON.parse(stored) : [];
  });

  const [likedPostIds, setLikedPostIds] = useState(() => {
    const stored = localStorage.getItem(`liked_posts_${user?.id}`);
    return stored ? JSON.parse(stored) : [];
  });

  // Interactive Poll state
  const [pollVote, setPollVote] = useState(() => {
    return localStorage.getItem(`gs_poll_vote_${user?.id}`) || '';
  });
  const [pollVotes, setPollVotes] = useState(() => {
    const stored = localStorage.getItem('gs_poll_votes_dist');
    return stored ? JSON.parse(stored) : { 1: 48, 2: 36, 3: 24, 4: 15 };
  });

  // GS Conglomerate Celebrations state
  const [wishedCelebrations, setWishedCelebrations] = useState(() => {
    const stored = localStorage.getItem(`wished_celebrations_${user?.id}`);
    return stored ? JSON.parse(stored) : [];
  });

  const handleWishCelebration = (id, name) => {
    if (wishedCelebrations.includes(id)) return;
    const nextWished = [...wishedCelebrations, id];
    setWishedCelebrations(nextWished);
    localStorage.setItem(`wished_celebrations_${user?.id}`, JSON.stringify(nextWished));
    adjustPulsePoints(10, `Sent celebratory wishes to ${name}!`);
  };

  const triggerToast = (message, icon = <CheckCircle2 className="w-5 h-5 text-emerald-500" />) => {
    setToast({ show: true, message, icon });
    setTimeout(() => setToast({ show: false, message: '', icon: null }), 3000);
  };

  const renderReactionIcons = (reactionTypesStr) => {
    if (!reactionTypesStr) return null;
    // Deduplicate types while preserving order
    const types = [...new Set(reactionTypesStr.split(','))];
    const emojis = types.map(t => REACTION_CONFIG[t]?.emoji).filter(Boolean);
    if (!emojis.length) return null;
    return (
      <div className="flex -space-x-1 items-center mr-1.5">
        {emojis.slice(0, 3).map((emoji, index) => (
          <div
            key={index}
            className="w-5 h-5 rounded-full bg-white border border-slate-100 flex items-center justify-center text-[10px] shadow-sm select-none"
            style={{ zIndex: 3 - index }}
          >
            {emoji}
          </div>
        ))}
      </div>
    );
  };

  const fetchFacts = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/facts');
      setFacts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchJoiners = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/joiners');
      setJoiners(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPosts = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/posts?subsidiary_id=${user?.subsidiary_id}&user_id=${user?.id}`);
      const data = response.data;
      setPosts(data);
    } catch (error) {
      console.error('Failed to fetch posts', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchPosts(); 
    fetchFacts();
    fetchJoiners();
  }, [user]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) { 
      setSelectedFile(file); 
      setFilePreview(URL.createObjectURL(file)); 
    }
  };

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
        visibility: postVisibility, 
        subsidiary_id: user.subsidiary_id
      });
      setNewPostContent(''); 
      setSelectedFile(null); 
      setFilePreview(null);
      fetchPosts();
      
      // Earn points for posting
      adjustPulsePoints(25, 'Published a new update!');
    } catch { 
      triggerToast('Failed to create post', <AlertCircle className="w-5 h-5 text-brand-red" />);
    }
  };

  const adjustPulsePoints = (amount, reason) => {
    const nextPoints = pulsePoints + amount;
    setPulsePoints(nextPoints);
    localStorage.setItem(`pulse_points_${user?.id}`, nextPoints.toString());
    
    // Sparkles celebration
    setCelebrationEmoji(`+${amount} ✨`);
    setTimeout(() => setCelebrationEmoji(null), 2500);
    
    triggerToast(`${reason} (${amount > 0 ? '+' : ''}${amount} Pulse Points!)`, <Sparkles className="w-5 h-5 text-amber-500" />);
  };

  const handleReact = async (postId, reactionType) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const prevReaction = post.user_reaction || null;
    const wasSameReaction = prevReaction === reactionType;
    const newReaction = wasSameReaction ? null : reactionType;

    // Optimistically update the posts list state
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
      
      // Revert the optimistic update on error
      setPosts(prevPosts => prevPosts.map(p => {
        if (p.id === postId) {
          let count = p.likes || 0;
          let types = p.reaction_types ? p.reaction_types.split(',').filter(Boolean) : [];

          if (wasSameReaction) {
            count = count + 1;
            if (!types.includes(reactionType)) types.push(reactionType);
          } else if (prevReaction) {
            types = types.filter(t => t !== reactionType);
            if (!types.includes(prevReaction)) types.push(prevReaction);
          } else {
            count = Math.max(0, count - 1);
            types = types.filter(t => t !== reactionType);
          }

          return {
            ...p,
            user_reaction: prevReaction,
            likes: count,
            reaction_types: types.join(',') || null
          };
        }
        return p;
      }));
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
      setSelectedPostReactions({ post, list: res.data });
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
    }, 500);
  };

  const handleTouchEnd = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  };

  const toggleBookmark = (postId) => {
    const isBookmarked = bookmarkedPostIds.includes(postId);
    let nextBookmarks;
    if (isBookmarked) {
      nextBookmarks = bookmarkedPostIds.filter(id => id !== postId);
      triggerToast('Removed update from bookmarks', <Bookmark className="w-5 h-5 text-slate-400" />);
    } else {
      nextBookmarks = [...bookmarkedPostIds, postId];
      triggerToast('Added update to your bookmarks!', <BookmarkCheck className="w-5 h-5 text-brand-red" />);
      adjustPulsePoints(2, 'Bookmarked updates');
    }
    setBookmarkedPostIds(nextBookmarks);
    localStorage.setItem(`bookmarked_posts_${user?.id}`, JSON.stringify(nextBookmarks));
  };



  const handleDeletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/posts/${postId}`);
      triggerToast('🗑️ Post deleted successfully!', <Trash2 className="w-5 h-5 text-rose-500" />);
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
      triggerToast(nextPinned ? '📌 Post pinned at the top!' : '📌 Post unpinned', <Pin className="w-5 h-5 text-amber-500" />);
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
      triggerToast(nextFlagged ? '⚠️ Post flagged for moderation' : '🛡️ Post flag resolved', <AlertTriangle className="w-5 h-5 text-rose-500" />);
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
      triggerToast('📝 Post updated successfully!', <Check className="w-5 h-5 text-emerald-500" />);
      setEditingPost(null);
      fetchPosts();
    } catch (err) {
      console.error(err);
      triggerToast('Failed to update post', <AlertCircle className="w-5 h-5 text-brand-red" />);
    }
  };

  // facts and achievements handlers
  const handleAddOrUpdateFact = async () => {
    if (!factContent.trim()) return;
    try {
      if (editingFact) {
        await axios.put(`http://localhost:5000/api/facts/${editingFact.id}`, { content: factContent });
        triggerToast('🧠 Fact updated successfully!', <Check className="w-5 h-5 text-indigo-500" />);
      } else {
        await axios.post('http://localhost:5000/api/facts', { content: factContent });
        triggerToast('🧠 New fact published!', <Check className="w-5 h-5 text-indigo-500" />);
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
      triggerToast('🗑️ Fact deleted', <Trash2 className="w-5 h-5 text-rose-500" />);
      fetchFacts();
    } catch (err) {
      console.error(err);
      triggerToast('Failed to delete fact', <AlertCircle className="w-5 h-5 text-brand-red" />);
    }
  };

  // joiners handlers
  const handleAddOrUpdateJoiner = async () => {
    if (user?.role !== 'super_admin') {
      triggerToast('Access denied. Super Admin only!', <AlertCircle className="w-5 h-5 text-brand-red" />);
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
        triggerToast('🎉 Joiner details updated!', <Check className="w-5 h-5 text-emerald-500" />);
      } else {
        await axios.post('http://localhost:5000/api/joiners', payload);
        triggerToast('🎉 Welcomed new joiner!', <Check className="w-5 h-5 text-emerald-500" />);
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
        triggerToast('📸 Image uploaded successfully!', <Check className="w-5 h-5 text-emerald-500" />);
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
    if (user?.role !== 'super_admin') {
      triggerToast('Access denied. Super Admin only!', <AlertCircle className="w-5 h-5 text-brand-red" />);
      return;
    }
    if (!window.confirm("Are you sure you want to delete this new joiner?")) return;
    try {
      await axios.delete(`http://localhost:5000/api/joiners/${id}`);
      triggerToast('🗑️ Joiner profile removed', <Trash2 className="w-5 h-5 text-rose-500" />);
      fetchJoiners();
    } catch (err) {
      console.error(err);
      triggerToast('Failed to delete joiner profile', <AlertCircle className="w-5 h-5 text-brand-red" />);
    }
  };

  const handleVote = (optionId) => {
    if (pollVote) return;
    const newVotes = { ...pollVotes, [optionId]: pollVotes[optionId] + 1 };
    setPollVotes(newVotes);
    setPollVote(optionId);
    localStorage.setItem(`gs_poll_vote_${user?.id}`, optionId.toString());
    localStorage.setItem('gs_poll_votes_dist', JSON.stringify(newVotes));
    
    adjustPulsePoints(15, 'Participated in Daily Poll!');
  };

  const handleShareClick = (post) => {
    setSharingPost(post);
  };

  const copyPostLink = (post) => {
    const mockUrl = `${window.location.origin}/feed/post/${post.id}`;
    navigator.clipboard.writeText(mockUrl);
    triggerToast('📋 Copied post link to clipboard!', <ExternalLink className="w-5 h-5 text-brand-red" />);
    setSharingPost(null);
  };

  const getPostTypeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'announcement':
        return 'border-l-4 border-l-brand-red';
      case 'achievement':
        return 'border-l-4 border-l-emerald-500';
      case 'event':
        return 'border-l-4 border-l-blue-500';
      default:
        return 'border-l-4 border-l-slate-350';
    }
  };

  const getPostBadge = (type) => {
    switch (type?.toLowerCase()) {
      case 'announcement':
        return 'bg-brand-red/5 text-brand-red border border-brand-red/10';
      case 'achievement':
        return 'bg-emerald-50 text-emerald-500 border border-emerald-100';
      case 'event':
        return 'bg-blue-50 text-blue-500 border border-blue-100';
      default:
        return 'bg-slate-50 text-slate-500 border border-slate-100';
    }
  };

  const filteredPosts = posts.filter(post => {
    // 1. Tab check
    let matchesTab = true;
    if (activeTab === 'Saved Bookmarks') {
      matchesTab = bookmarkedPostIds.includes(post.id);
    } else if (activeTab !== 'All Feed') {
      matchesTab = post.type?.toLowerCase() === activeTab.toLowerCase().slice(0, -1);
    }
    
    // 2. Search check
    const matchesSearch = searchQuery.trim() === '' || 
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
      post.author_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.subsidiary_name && post.subsidiary_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (post.type && post.type.toLowerCase().includes(searchQuery.toLowerCase()));

    // 3. Admin flagged filter check
    const matchesFlagged = !filterFlaggedOnly || post.is_flagged;

    return matchesTab && matchesSearch && matchesFlagged;
  });

  const totalPollVotes = Object.values(pollVotes).reduce((a, b) => a + b, 0);

  if (loading) return (
    <div className="space-y-8 pb-16">
      <div className="shimmer-loader rounded-[40px] h-48 w-full" />
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="shimmer-loader rounded-[32px] h-20 w-full" />
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-[40px] border border-slate-100 p-8 space-y-4">
              <div className="flex gap-4 items-center">
                <div className="shimmer-loader w-14 h-14 rounded-2xl" />
                <div className="space-y-2 flex-1">
                  <div className="shimmer-loader h-4 rounded-full w-1/3" />
                  <div className="shimmer-loader h-3 rounded-full w-1/4" />
                </div>
              </div>
              <div className="shimmer-loader h-4 rounded-full w-full" />
              <div className="shimmer-loader h-4 rounded-full w-4/5" />
              <div className="shimmer-loader h-4 rounded-full w-2/3" />
              <div className="shimmer-loader h-48 rounded-[24px] w-full mt-2" />
            </div>
          ))}
        </div>
        <div className="hidden lg:block lg:col-span-4 space-y-6">
          <div className="shimmer-loader rounded-[32px] h-64" />
          <div className="shimmer-loader rounded-[32px] h-48" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-10 pb-16 relative">
      
      {/* ── SPARKLES FLOATING NOTIFICATION FOR POINTS ── */}
      <AnimatePresence>
        {celebrationEmoji && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.3 }}
            animate={{ opacity: 1, y: -80, scale: 1.5 }}
            exit={{ opacity: 0, y: -150, scale: 0.5 }}
            transition={{ duration: 1.8, ease: 'easeOut' }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none bg-gradient-to-r from-amber-500 to-yellow-400 text-white font-black px-6 py-3 rounded-full shadow-2xl flex items-center gap-2"
          >
            <Sparkles className="w-6 h-6 animate-pulse" />
            <span>{celebrationEmoji}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── TOAST NOTIFICATION SYSTEM ── */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: 50 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 20, x: 20 }}
            className="fixed bottom-6 right-6 z-50 glass-card bg-white/95 dark:bg-slate-900/95 border-l-4 border-l-emerald-500 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex items-center gap-4 max-w-sm"
          >
            <div className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center shrink-0">
              {toast.icon}
            </div>
            <div>
              <p className="text-xs font-black text-slate-805 dark:text-slate-100">{toast.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HIGH END INTRO GREETING & STATS BANNER ── */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative glass-card overflow-hidden glow-hover"
      >
        {/* Animated gradient top strip */}
        <div className="absolute top-0 left-0 w-full h-1.5 animated-gradient-border" />
        
        {/* Decorative shapes */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-brand-red/[0.04] via-transparent to-transparent rounded-bl-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-500/[0.03] to-transparent rounded-tr-full pointer-events-none" />

        <div className="p-8 md:p-10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="flex h-3 w-3 relative pulse-ring rounded-full">
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                </span>
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Live Feed Active</span>
                <span className="text-[9px] font-bold text-slate-300 ml-1">•</span>
                <span className="text-[9px] font-bold text-slate-400">{posts.length} updates today</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight leading-none">
                Ayubowan, <span className="text-gradient-red">{user?.full_name?.split(' ')[0]}!</span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xl text-base leading-relaxed">
                Your daily pulse across the George Steuart conglomerate — updates, wins, and celebrations.
            </p>
          </div>

          {/* Quick interactive widgets */}
          <div className="grid grid-cols-3 gap-3 shrink-0">
            <div className="bg-slate-50/80 dark:bg-slate-900/60 p-4 rounded-3xl border border-slate-100 dark:border-slate-800/60 text-center min-w-[100px] hover:scale-105 transition-transform">
              <div className="w-8 h-8 rounded-xl bg-brand-red/10 flex items-center justify-center mx-auto mb-2">
                <Activity className="w-4 h-4 text-brand-red" />
              </div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Subsidiary</p>
              <p className="text-[10px] font-black text-brand-red mt-0.5 truncate max-w-[100px] uppercase">
                {user?.subsidiary_name?.split(' ')[0] || 'GS'}
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-500/5 to-indigo-500/5 p-4 rounded-3xl border border-blue-100/40 text-center min-w-[100px] hover:scale-105 transition-transform">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
                <BarChart3 className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Posts</p>
              <p className="text-lg font-black text-blue-600 mt-0.5">{posts.length}</p>
            </div>

            <button 
              onClick={() => setActiveTab(activeTab === 'Saved Bookmarks' ? 'All Feed' : 'Saved Bookmarks')}
              className={`p-4 rounded-3xl border text-center min-w-[100px] transition-all hover:scale-105 ${activeTab === 'Saved Bookmarks' ? 'bg-brand-red text-white border-brand-red shadow-lg shadow-brand-red/20' : 'bg-slate-50/80 dark:bg-slate-900/60 text-slate-500 border-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center mx-auto mb-2 ${activeTab === 'Saved Bookmarks' ? 'bg-white/20' : 'bg-emerald-500/10'}`}>
                <Bookmark className={`w-4 h-4 ${activeTab === 'Saved Bookmarks' ? 'fill-current text-white' : 'text-emerald-500'}`} />
              </div>
              <p className="text-[8px] font-black uppercase tracking-widest">Saved</p>
              <p className={`text-lg font-black mt-0.5 ${activeTab === 'Saved Bookmarks' ? 'text-white' : 'text-emerald-600'}`}>{bookmarkedPostIds.length}</p>
            </button>
          </div>
        </div>
      </div>
    </motion.div>

      {/* ── MAIN CONTENT GRID ── */}
      <div className="grid grid-cols-12 gap-8">
        
        {/* Left Feed Section */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          
          {/* SEARCH AND FILTERS BAR */}
          <div className="glass-card p-6 space-y-5">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative flex-1 w-full">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search updates, keywords, authors..."
                  className="premium-input w-full pl-12 placeholder:text-slate-350 text-sm"
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Search className="w-5 h-5 text-slate-400" />
                </div>
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-500 transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              
              <div className="flex items-center gap-3 shrink-0 self-stretch sm:self-auto">
                 {isAdmin && (
                   <button 
                     onClick={() => setFilterFlaggedOnly(!filterFlaggedOnly)}
                     className={`flex items-center justify-center gap-2 px-5 py-4 rounded-2xl transition-all border font-black text-xs uppercase tracking-widest w-full sm:w-auto ${filterFlaggedOnly ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100' : 'bg-slate-50 hover:bg-slate-100 text-slate-550 border-slate-150'}`}
                   >
                     <AlertTriangle className={`w-4 h-4 ${filterFlaggedOnly ? 'text-rose-500' : 'text-slate-400'}`} />
                     {filterFlaggedOnly ? 'Showing Flagged' : 'Filter Flagged'}
                   </button>
                 )}
                 <button className="flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-550 px-5 py-4 rounded-2xl transition-all border border-slate-150 font-black text-xs uppercase tracking-widest w-full sm:w-auto">
                   <Filter className="w-4 h-4 text-slate-400" />
                   Filter Options
                 </button>
               </div>
            </div>

            {/* Category selection pills */}
            <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1">
              {['All Feed', 'Announcements', 'Achievements', 'Events'].map((tab) => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${activeTab === tab ? 'bg-brand-red text-white border-brand-red shadow-lg shadow-brand-red/15 scale-105' : 'bg-slate-50 hover:bg-slate-100 text-slate-405 border-slate-100'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* CREATE POST COMPOSER FOR ADMINS */}
          {(user?.role === 'super_admin' || user?.role === 'sub_admin' || user?.role === 'it_admin' || user?.role === 'hr_admin') && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-8 relative overflow-hidden"
            >
              <div className="flex gap-6">
                <div className="w-14 h-14 rounded-2xl bg-brand-red/5 flex items-center justify-center shrink-0">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white shadow-md">
                    <img src={`https://ui-avatars.com/api/?name=${user?.full_name}&background=C8102E&color=fff`} alt="User" />
                  </div>
                </div>
                <div className="flex-1 space-y-6">
                  <textarea 
                    value={newPostContent} 
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="What official update would you like to publish today?"
                    className="premium-input w-full resize-none placeholder:text-slate-350 text-sm"
                    rows="3"
                  />
                  
                  {filePreview && (
                    <div className="relative w-full aspect-video rounded-[24px] overflow-hidden border-4 border-slate-50 shadow-inner">
                      <img src={filePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        onClick={() => { setSelectedFile(null); setFilePreview(null); }}
                        className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white p-2 rounded-full hover:bg-black/80 transition-all"
                      >
                        <Plus className="w-5 h-5 rotate-45" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="flex items-center gap-6">
                      <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
                      <button 
                        onClick={() => fileInputRef.current.click()}
                        className="flex items-center gap-2 text-slate-400 hover:text-brand-red transition-all text-[10px] font-black uppercase tracking-widest group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center group-hover:bg-brand-red/10">
                          <ImageIcon className="w-4 h-4" />
                        </div>
                        Media File
                      </button>
                      
                      <button 
                        onClick={() => setPostType(postType === 'announcement' ? 'general' : 'announcement')}
                        className={`flex items-center gap-2 transition-all text-[10px] font-black uppercase tracking-widest ${postType === 'announcement' ? 'text-brand-red' : 'text-slate-400 hover:text-brand-red'}`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${postType === 'announcement' ? 'bg-brand-red text-white' : 'bg-slate-50'}`}>
                          <Send className="w-4 h-4" />
                        </div>
                        Official Update
                      </button>
                    </div>

                    <div className="flex items-center gap-4">
                      {user?.role === 'super_admin' && (
                        <select 
                          value={postVisibility} 
                          onChange={(e) => setPostVisibility(e.target.value)}
                          className="premium-input bg-slate-50 text-slate-500 text-[9px] font-black uppercase tracking-[2px] cursor-pointer transition-all"
                        >
                          <option value="global">🌍 Global</option>
                          <option value="subsidiary">🏢 Subsidiary</option>
                        </select>
                      )}
                      
                      <button 
                        onClick={handleCreatePost} 
                        disabled={!newPostContent.trim() && !selectedFile}
                        className="premium-btn-brand text-[10px] font-black uppercase tracking-widest disabled:opacity-30 transition-all"
                      >
                        Publish Post
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* THE FEED POSTS LIST */}
          <AnimatePresence mode="popLayout">
            {filteredPosts.length > 0 ? filteredPosts.map((post, idx) => {
              const isBookmarked = bookmarkedPostIds.includes(post.id);
              
              return (
                <motion.div 
                  key={post.id}
                  initial={{ opacity: 0, scale: 0.98, y: 30 }} 
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }} 
                  transition={{ delay: idx * 0.05, type: 'spring', damping: 25 }}
                  className={`glass-card premium-card-hover overflow-hidden group ${getPostTypeColor(post.type)}`}
                >
                  {/* Post Header */}
                  <div className="p-8 flex justify-between items-start">
                    <div className="flex gap-4">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-brand-red border border-slate-100 overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
                          {post.profile_pic ? (
                            <img src={post.profile_pic} alt={post.author_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-brand-red text-white font-black text-xl italic">
                              {post.author_name.split(' ').map(n => n[0]).join('')}
                            </div>
                          )}
                        </div>
                        {post.type === 'announcement' && (
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-brand-red text-white rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                            <Zap className="w-3 h-3" />
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <h4 className="font-black text-slate-800 flex items-center gap-3">
                          {post.author_name}
                          <span className={`text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${getPostBadge(post.type)}`}>
                            {post.type || 'General'}
                          </span>
                        </h4>
                        
                        <p className="text-[10px] font-bold text-slate-400 mt-1.5 uppercase tracking-widest flex items-center gap-2">
                          <span className="text-brand-red/60">{post.subsidiary_name || 'GEORGE STEUART'}</span>
                          <span className="w-1.5 h-1.5 bg-slate-250 rounded-full"></span>
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-350" /> {new Date(post.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 relative">
                      {post.is_pinned === 1 && (
                        <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-3 py-1.5 rounded-xl border border-amber-100 animate-pulse text-[9px] font-black uppercase tracking-wider mr-1 shadow-sm shadow-amber-500/5 select-none">
                          <Pin className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                          Pinned
                        </div>
                      )}
                      
                      {post.is_flagged === 1 && (
                        <div className="flex items-center gap-1 bg-rose-50 text-rose-600 px-3 py-1.5 rounded-xl border border-rose-100 text-[9px] font-black uppercase tracking-wider mr-1 shadow-sm shadow-rose-500/5 select-none">
                          <AlertTriangle className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
                          Flagged
                        </div>
                      )}

                      <button 
                        onClick={() => toggleBookmark(post.id)}
                        className={`p-3 rounded-2xl transition-all ${isBookmarked ? 'bg-brand-red-light text-brand-red hover:bg-brand-red-light/80' : 'text-slate-300 hover:text-slate-800 hover:bg-slate-50'}`}
                        title={isBookmarked ? "Remove bookmark" : "Bookmark this post"}
                      >
                        <Bookmark className={`w-4.5 h-4.5 ${isBookmarked ? 'fill-current' : ''}`} />
                      </button>
                      
                      <div className="relative">
                        <button 
                          onClick={() => setActivePostMenu(activePostMenu === post.id ? null : post.id)}
                          className={`p-3 rounded-2xl transition-all ${activePostMenu === post.id ? 'bg-slate-100 text-slate-800' : 'text-slate-300 hover:text-slate-800 hover:bg-slate-50'}`}
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                        
                        <AnimatePresence>
                          {activePostMenu === post.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setActivePostMenu(null)} />
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-md border border-slate-100 rounded-2xl shadow-xl z-20 py-2 overflow-hidden"
                              >
                                {(post.author_id === user?.id || isAdmin) && (
                                  <button 
                                    onClick={() => {
                                      setEditingPost(post);
                                      setActivePostMenu(null);
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-all"
                                  >
                                    <Edit2 className="w-4 h-4 text-indigo-500" />
                                    Edit Post
                                  </button>
                                )}
                                
                                {isAdmin && (
                                  <button 
                                    onClick={() => {
                                      handleTogglePin(post);
                                      setActivePostMenu(null);
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-all"
                                  >
                                    <Pin className={`w-4 h-4 ${post.is_pinned ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
                                    {post.is_pinned ? 'Unpin Post' : 'Pin Post'}
                                  </button>
                                )}

                                <button 
                                  onClick={() => {
                                    handleToggleFlag(post);
                                    setActivePostMenu(null);
                                  }}
                                  className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-all"
                                >
                                  <AlertTriangle className={`w-4 h-4 ${post.is_flagged ? 'text-rose-500 fill-rose-500' : 'text-slate-400'}`} />
                                  {post.is_flagged ? 'Remove Flag' : 'Flag Inappropriate'}
                                </button>
                                
                                {(post.author_id === user?.id || isAdmin) && (
                                  <button 
                                    onClick={() => {
                                      handleDeletePost(post.id);
                                      setActivePostMenu(null);
                                    }}
                                    className="w-full px-4 py-2.5 text-left text-xs font-bold text-rose-600 hover:bg-rose-55 flex items-center gap-2 transition-all border-t border-slate-100"
                                  >
                                    <Trash2 className="w-4 h-4 text-rose-500" />
                                    Delete Post
                                  </button>
                                )}
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <div className="px-10 pb-8">
                    <p className="text-slate-600 text-base leading-relaxed font-medium whitespace-pre-wrap">{post.content}</p>
                  </div>

                  {/* Post Image */}
                  {post.image_url && (
                    <div className="px-10 pb-8">
                      <div className="relative aspect-[16/9] rounded-[32px] overflow-hidden bg-slate-100 border border-slate-50 shadow-inner group-hover:shadow-2xl transition-all duration-700">
                        <img 
                          src={post.image_url} 
                          alt="Post Media" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2.5s]" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
                      </div>
                    </div>
                  )}

                  {/* Action Bar */}
                  <div className="px-8 py-6 bg-slate-50/40 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div 
                        className="relative flex items-center"
                        onMouseEnter={() => setActiveReactionHoverPost(post.id)}
                        onMouseLeave={() => setActiveReactionHoverPost(null)}
                      >
                        {/* Hover Reaction Panel */}
                        <AnimatePresence>
                          {activeReactionHoverPost === post.id && (
                            <>
                              {/* Mobile Tap-outside Backdrop */}
                              <div 
                                className="fixed inset-0 z-30 block md:hidden cursor-default"
                                onClick={() => setActiveReactionHoverPost(null)}
                              />
                              
                              <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.8 }}
                                transition={{ duration: 0.15 }}
                                className="absolute bottom-full left-0 mb-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-2.5 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex gap-2.5 z-40"
                              >
                                {Object.entries(REACTION_CONFIG).map(([type, cfg]) => (
                                  <motion.button
                                    key={type}
                                    whileHover={{ scale: 1.35, y: -6 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => {
                                      handleReact(post.id, type);
                                      setActiveReactionHoverPost(null);
                                    }}
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm relative group/emoji"
                                  >
                                    <span>{cfg.emoji}</span>
                                    {/* Tooltip */}
                                    <span className="absolute bottom-full mb-2 bg-slate-950 text-white text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md opacity-0 group-hover/emoji:opacity-100 transition-opacity pointer-events-none whitespace-nowrap shadow-md z-[50]">
                                      {cfg.label}
                                    </span>
                                  </motion.button>
                                ))}
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>

                        {/* Reaction Trigger Button */}
                        {(() => {
                          const rxn = post.user_reaction ? REACTION_CONFIG[post.user_reaction] : null;
                          return (
                            <button
                              onClick={() => handleDefaultReactClick(post.id)}
                              onTouchStart={() => handleTouchStart(post.id)}
                              onTouchEnd={handleTouchEnd}
                              onTouchCancel={handleTouchEnd}
                              onMouseDown={() => {
                                touchTimerRef.current = setTimeout(() => {
                                  setActiveReactionHoverPost(post.id);
                                }, 500);
                              }}
                              onMouseUp={() => {
                                if (touchTimerRef.current) {
                                  clearTimeout(touchTimerRef.current);
                                  touchTimerRef.current = null;
                                }
                              }}
                              onMouseLeave={() => {
                                if (touchTimerRef.current) {
                                  clearTimeout(touchTimerRef.current);
                                  touchTimerRef.current = null;
                                }
                              }}
                              className="flex items-center gap-2.5 px-6 py-3 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest border select-none"
                              style={rxn
                                ? { background: rxn.bg, color: rxn.color, borderColor: 'transparent', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }
                                : { background: '#fff', color: '#94a3b8', borderColor: '#f1f5f9' }
                              }
                            >
                              <span className="text-base leading-none shrink-0" style={{ lineHeight: 1 }}>
                                {rxn ? rxn.emoji : '👍'}
                              </span>
                              <span>{rxn ? rxn.label : 'Like'}</span>
                            </button>
                          );
                        })()}
                      </div>

                      {/* Overlapping Reaction Emojis & Reaction Count */}
                      {post.likes > 0 && (
                        <div 
                          className="flex items-center ml-2 cursor-pointer hover:underline"
                          onClick={() => handleViewReactions(post)}
                        >
                          {renderReactionIcons(post.reaction_types)}
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                            {post.likes}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleShareClick(post)}
                        className="p-3 text-slate-400 hover:text-brand-red hover:bg-brand-red/5 rounded-2xl transition-all"
                        title="Share update"
                      >
                        <Share2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            }) : (
              <div className="glass-card text-center py-20">
                <div className="w-20 h-20 bg-slate-50 dark:bg-slate-850/60 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300 dark:text-slate-650">
                  <Rss className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">No matching updates</h3>
                <p className="text-slate-400 text-sm mt-2">Adjust your filters or try a different search keyword.</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Sidebar Section */}
        <div className="hidden lg:block lg:col-span-4 space-y-6 sticky top-32 h-fit">

          {/* ── DID YOU KNOW? WIDGET ── */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-7 relative overflow-hidden glow-hover"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 to-indigo-500" />
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  <span className="text-lg">🧠</span>
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-sm">Did You Know?</h3>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Conglomerate Insights</p>
                </div>
              </div>
              
              {isAdmin && (
                <button
                  onClick={() => {
                    setEditingFact(null);
                    setFactContent('');
                    setFactModalOpen(true);
                  }}
                  className="p-2 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors text-[9px] font-black uppercase tracking-widest flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              )}
            </div>

            {facts.length === 0 ? (
              <p className="text-xs font-semibold text-slate-400 italic">No facts added yet.</p>
            ) : (
              <div className="space-y-4">
                {facts.map((fact) => (
                  <div key={fact.id} className="p-4 bg-slate-50/50 border border-slate-100 rounded-2xl relative group/fact">
                    <p className="text-xs font-semibold text-slate-600 leading-relaxed pr-8">
                      {fact.content}
                    </p>
                    
                    {isAdmin && (
                      <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover/fact:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingFact(fact);
                            setFactContent(fact.content);
                            setFactModalOpen(true);
                          }}
                          className="p-1 rounded bg-white border border-slate-200 text-slate-400 hover:text-indigo-500 hover:border-indigo-100 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDeleteFact(fact.id)}
                          className="p-1 rounded bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-colors"
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

          {/* ── WELCOME NEW JOINERS WIDGET ── */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-7 relative overflow-hidden glow-hover"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-rose-500" />
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-pink-500/10 flex items-center justify-center">
                  <span className="text-lg">🎉</span>
                </div>
                <div>
                  <h3 className="font-black text-slate-800 text-sm">Welcome Joiners</h3>
                  <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">New faces this month</p>
                </div>
              </div>
              
              {user?.role === 'super_admin' && (
                <button
                  onClick={() => {
                    clearJoinerFields();
                    setJoinerModalOpen(true);
                  }}
                  className="p-2 rounded-xl bg-pink-50 text-pink-600 hover:bg-pink-100 transition-colors text-[9px] font-black uppercase tracking-widest flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              )}
            </div>

            {joiners.length === 0 ? (
              <p className="text-xs font-semibold text-slate-400 italic">No new joiners this month.</p>
            ) : (
              <div className="space-y-6">
                {joiners.find(j => j.group_image) ? (() => {
                  const targetJoiner = joiners.find(j => j.group_image);
                  const welcomeDate = new Date(targetJoiner.join_date);
                  const welcomeMonthYear = welcomeDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                  return (
                    <div className="bg-gradient-to-b from-[#9E1B1B] to-[#701010] p-6 rounded-[28px] shadow-xl border border-red-800 text-white flex flex-col gap-4">
                      {/* Logo and ESTD 1835 Header */}
                      <div className="flex flex-col items-center text-center space-y-1">
                        <span className="text-[8px] font-black text-[#F4C430] tracking-widest uppercase">ESTD 1835</span>
                        <h4 className="font-serif text-sm font-extrabold tracking-wide text-white">George Steuart & Co</h4>
                        <span className="text-[10px] font-bold text-red-200 uppercase tracking-widest">First Day Welcome!</span>
                      </div>

                      {/* Framed Group Photo */}
                      <div className="p-1.5 bg-[#1a1512] rounded-2xl border-4 border-[#3a3028] shadow-2xl relative group/welcomeImg">
                        <div 
                          className="rounded-lg overflow-hidden aspect-[16/10] bg-slate-800 cursor-pointer"
                          onClick={() => setSelectedJoiner(targetJoiner)}
                        >
                          <img 
                            src={targetJoiner.group_image} 
                            alt="Joiners Welcome Group" 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover/welcomeImg:scale-105"
                          />
                        </div>

                        {user?.role === 'super_admin' && (
                          <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-0 group-hover/welcomeImg:opacity-100 transition-opacity z-10">
                            <button
                              onClick={() => {
                                setEditingJoiner(targetJoiner);
                                setJoinerName(targetJoiner.name);
                                setJoinerDept(targetJoiner.department);
                                setJoinerDate(targetJoiner.join_date ? targetJoiner.join_date.substring(0, 10) : '');
                                setJoinerProfile(targetJoiner.profile_photo || '');
                                setJoinerGroupImg(targetJoiner.group_image || '');
                                setJoinerGroupDetails(targetJoiner.group_details || '');
                                setJoinerModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-white/95 border border-slate-200 text-slate-700 hover:text-indigo-600 hover:bg-white transition-all shadow-md"
                              title="Edit"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteJoiner(targetJoiner.id)}
                              className="p-1.5 rounded-lg bg-white/95 border border-slate-200 text-slate-700 hover:text-rose-600 hover:bg-white transition-all shadow-md"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Date & Signature Logo */}
                      <div className="flex items-center justify-between px-1 text-[9px] text-red-200 font-bold border-b border-red-800/60 pb-3">
                        <span className="font-serif italic text-[#F4C430] text-sm font-black">GS</span>
                        <span>{welcomeMonthYear}</span>
                      </div>

                      {/* Row List / Welcome Description */}
                      {targetJoiner.group_details && (
                        <div className="text-[10px] text-red-50 leading-relaxed whitespace-pre-line font-medium bg-red-950/40 p-4 rounded-xl border border-red-800/40">
                          {targetJoiner.group_details}
                        </div>
                      )}
                    </div>
                  );
                })() : (
                  <p className="text-xs font-semibold text-slate-400 italic">No welcome banner added yet.</p>
                )}
              </div>
            )}
          </motion.div>

          {/* ── CELEBRATION HUB ── */}
          <CelebrationHub userSubsidiary={user?.subsidiary_name} />
          
          {/* ── GS CONGLOMERATE CELEBRATIONS (removed) */}
          {/* Retained old block commented for reference */}
          {/*
          <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Cake className="w-5 h-5 text-brand-red" />
                <h3 className="font-black text-slate-800 text-lg">GS Celebrations</h3>
              </div>
              <span className="bg-brand-red/5 text-brand-red text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest">
                Today
              </span>
            </div>

            <p className="text-slate-500 text-xs font-semibold leading-relaxed mb-6">
              Connect with colleagues across subsidiaries and send your warmest wishes to earn Pulse Points!
            </p>

            <div className="space-y-5">
              {[
                { id: 'bday_1', name: 'Sanduni Perera', type: 'birthday', details: 'Celebrating 26th Birthday 🎂', subsidiary: 'GS Teas', color: 'from-pink-500 to-rose-500', avatar: 'SP' },
                { id: 'anniv_1', name: 'Dilshan Silva', type: 'anniversary', details: '5 Years at George Steuart! 🏅', subsidiary: 'GS Health', color: 'from-blue-500 to-indigo-600', avatar: 'DS' },
                { id: 'bday_2', name: 'Malith Fernando', type: 'birthday', details: 'Celebrating 30th Birthday 🎂', subsidiary: 'GS Travel', color: 'from-amber-500 to-orange-500', avatar: 'MF' }
              ].map((c) => {
                const hasWished = wishedCelebrations.includes(c.id);

                return (
                  <div key={c.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/80 hover:bg-slate-50 transition-all duration-300 flex items-center gap-4 group/item">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${c.color} flex items-center justify-center font-black text-white text-sm shadow-md shrink-0 transition-transform duration-300 group-hover/item:scale-105`}>
                      <span>{c.avatar}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black text-slate-800 truncate flex items-center gap-1.5">
                        {c.name}
                        <span className="text-[9px] font-black text-brand-red uppercase tracking-wider scale-90 origin-left">
                          {c.subsidiary}
                        </span>
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 mt-0.5 truncate">{c.details}</p>
                    </div>

                    <div className="shrink-0">
                      <button
                        onClick={() => handleWishCelebration(c.id, c.name)}
                        disabled={hasWished}
                        className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all shadow-sm ${hasWished ? 'bg-emerald-50 text-emerald-600 border border-emerald-100 cursor-default flex items-center gap-1 shadow-none' : 'bg-white hover:bg-brand-red hover:text-white hover:border-brand-red text-slate-600 border border-slate-150'}`}
                      >
                        {hasWished ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            Wished!
                          </>
                        ) : (
                          'Wish 🎉'
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1">
                <Gift className="w-3.5 h-3.5 text-brand-red animate-bounce" />
                Conglomerate spirit awards +10 PTS
              </p>
            </div>
          </div>
          */}

        </div>
      </div>

      {/* ── SHARE MODAL DIALOG ── */}
      <AnimatePresence>
        {sharingPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSharingPost(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-slate-900 rounded-[36px] p-8 border border-slate-100 dark:border-slate-800 shadow-2xl max-w-md w-full z-10 space-y-6"
            >
              <button 
                onClick={() => setSharingPost(null)}
                className="absolute top-6 right-6 p-2 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Share Intranet Update</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Spread the news across the conglomerate</p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850">
                <p className="text-xs text-slate-500 italic line-clamp-3">"{sharingPost.content}"</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => copyPostLink(sharingPost)}
                  className="p-4 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-2xl border border-slate-100 transition-all flex flex-col items-center gap-2 font-black text-[10px] uppercase tracking-widest"
                >
                  <ExternalLink className="w-5 h-5 text-brand-red" />
                  Copy URL Link
                </button>
                
                <button 
                  onClick={() => {
                    triggerToast('💬 Update successfully sent to subsidiary channel!', <CheckCircle2 className="w-5 h-5 text-emerald-500" />);
                    adjustPulsePoints(5, 'Shared internally');
                    setSharingPost(null);
                  }}
                  className="p-4 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-2xl border border-slate-100 transition-all flex flex-col items-center gap-2 font-black text-[10px] uppercase tracking-widest"
                >
                  <Send className="w-5 h-5 text-blue-500" />
                  Subsidiary Chat
                </button>
              </div>

              <div className="pt-2 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Shared updates contribute towards weekly pulse points
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── REACTIONS DETAIL MODAL (LIKE FACEBOOK) ── */}
      <AnimatePresence>
        {selectedPostReactions && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPostReactions(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-slate-900 rounded-[36px] border border-slate-100 dark:border-slate-800 shadow-2xl max-w-md w-full z-10 overflow-hidden flex flex-col max-h-[80vh]"
            >
              {/* Header */}
              <div className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 relative shrink-0">
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">Post Reactions</h3>
                <button 
                  onClick={() => setSelectedPostReactions(null)}
                  className="absolute top-5 right-5 p-2 rounded-full bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Tab Selector */}
              <div className="flex items-center gap-1.5 px-6 py-3 border-b border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
                <button
                  onClick={() => setReactionsModalTab('all')}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap border ${reactionsModalTab === 'all' ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-800 dark:border-slate-100' : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 border-slate-100 dark:border-slate-700'}`}
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
                        className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all whitespace-nowrap border flex items-center gap-1.5 ${reactionsModalTab === type ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-800 dark:border-slate-100' : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 border-slate-100 dark:border-slate-700'}`}
                      >
                        <span>{cfg.emoji}</span>
                        <span className="uppercase tracking-wider text-[9px] font-black">{cfg.label}</span>
                        <span className="text-[9px] opacity-70">({count})</span>
                      </button>
                    );
                  });
                })()}
              </div>

              {/* Reactor List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[200px]">
                {reactionsModalLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="w-8 h-8 border-3 border-slate-150 border-t-brand-red rounded-full animate-spin"></div>
                  </div>
                ) : selectedPostReactions.list.filter(r => reactionsModalTab === 'all' || r.type === reactionsModalTab).length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <p className="text-xs font-bold uppercase tracking-widest">No reactions here yet</p>
                  </div>
                ) : (
                  selectedPostReactions.list
                    .filter(r => reactionsModalTab === 'all' || r.type === reactionsModalTab)
                    .map((reactor) => {
                      const cfg = REACTION_CONFIG[reactor.type];
                      
                      return (
                        <div key={reactor.user_id} className="flex items-center gap-4 py-1.5 group/reactor">
                          {/* Avatar with Badge */}
                          <div className="relative shrink-0">
                            <div className="w-11 h-11 rounded-xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50">
                              {reactor.profile_pic ? (
                                <img src={reactor.profile_pic} alt={reactor.full_name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-brand-red text-white font-black text-base italic">
                                  {reactor.full_name.split(' ').map(n => n[0]).join('')}
                                </div>
                              )}
                            </div>
                            {/* Floating Reaction Badge */}
                            <div 
                              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-md border-2 border-white select-none"
                              style={{ background: cfg?.bg || '#eff6ff' }}
                            >
                              {cfg?.emoji || '👍'}
                            </div>
                          </div>

                          {/* Name and Subsidiary */}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-slate-800 dark:text-slate-100 group-hover/reactor:text-brand-red transition-colors truncate">
                              {reactor.full_name}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate mt-0.5">
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

      {/* ── EDIT POST MODAL DIALOG ── */}
      <AnimatePresence>
        {editingPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingPost(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-slate-900 rounded-[36px] p-8 border border-slate-100 dark:border-slate-800 shadow-2xl max-w-lg w-full z-10 space-y-6"
            >
              <button 
                onClick={() => setEditingPost(null)}
                className="absolute top-6 right-6 p-2 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Edit Conglomerate Update</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Update your post and visibility</p>
              </div>

              {/* Text Area */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Post Content</label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={5}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all resize-none"
                  placeholder="What's new across George Steuart today?"
                />
              </div>

              {/* Post Type Selector */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value)}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-red/20 transition-all cursor-pointer"
                  >
                    <option value="general">General</option>
                    <option value="announcement">Announcement</option>
                    <option value="achievement">Achievement</option>
                    <option value="event">Event</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Audience Reach</label>
                  <select
                    value={editVisibility}
                    onChange={(e) => setEditVisibility(e.target.value)}
                    disabled={user?.role !== 'super_admin'}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-red/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <option value="global">🌍 Global Reach</option>
                    <option value="subsidiary">🏢 Subsidiary Only</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setEditingPost(null)}
                  className="px-6 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdatePost}
                  disabled={!editContent.trim()}
                  className="px-8 py-3.5 bg-brand-red text-white hover:bg-brand-red-dark disabled:opacity-30 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-brand-red/10"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── FACT ADMIN ADD/EDIT MODAL ── */}
      <AnimatePresence>
        {factModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFactModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-slate-900 rounded-[36px] p-8 border border-slate-100 dark:border-slate-800 shadow-2xl max-w-md w-full z-10 space-y-6"
            >
              <button 
                onClick={() => setFactModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                  {editingFact ? '✏️ Edit Insights Fact' : '🧠 Add Did You Know Fact'}
                </h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Share a key conglomerate milestone or fact</p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fact Details</label>
                <textarea
                  value={factContent}
                  onChange={(e) => setFactContent(e.target.value)}
                  rows={4}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red transition-all resize-none"
                  placeholder="E.g., Did you know George Steuart & Co. was founded in 1835..."
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setFactModalOpen(false)}
                  className="px-6 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddOrUpdateFact}
                  disabled={!factContent.trim()}
                  className="px-8 py-3.5 bg-brand-red text-white hover:bg-brand-red-dark disabled:opacity-30 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-brand-red/10"
                >
                  {editingFact ? 'Save Changes' : 'Publish Fact'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── JOINER ADMIN ADD/EDIT MODAL ── */}
      <AnimatePresence>
        {joinerModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setJoinerModalOpen(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-slate-900 rounded-[36px] p-8 border border-slate-105 dark:border-slate-800 shadow-2xl max-w-lg w-full z-10 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setJoinerModalOpen(false)}
                className="absolute top-6 right-6 p-2 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
                  {editingJoiner ? '✏️ Edit Welcome Details' : '🎉 Welcome New Joiner'}
                </h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Celebrate new additions to our workforce</p>
              </div>

              <div className="space-y-4">


                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Join Date</label>
                  <input
                    type="date"
                    value={joinerDate}
                    onChange={(e) => setJoinerDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-105 rounded-xl text-xs font-bold text-slate-750 focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Group Welcome Image</label>
                  <div className="space-y-3">
                    {joinerGroupImg ? (
                      <div className="relative rounded-2xl overflow-hidden aspect-[16/6] border border-slate-100 group/groupPreview">
                        <img src={joinerGroupImg} alt="Group Banner Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setJoinerGroupImg('')}
                          className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/groupPreview:opacity-100 transition-opacity text-white text-xs font-black uppercase tracking-widest"
                        >
                          Remove Photo
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full aspect-[16/6] rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 hover:border-brand-red cursor-pointer transition-colors group">
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-2xl group-hover:scale-110 transition-transform duration-300">📸</span>
                          <span className="text-[9px] font-black text-slate-400 group-hover:text-slate-600 uppercase tracking-widest">
                            {isUploadingGroup ? 'Uploading image...' : 'Click to Upload Group Image'}
                          </span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 'group')}
                          className="hidden"
                        />
                      </label>
                    )}
                    
                    {!joinerGroupImg && (
                      <input
                        type="text"
                        value={joinerGroupImg}
                        onChange={(e) => setJoinerGroupImg(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-105 rounded-xl text-xs font-bold text-slate-750 focus:outline-none"
                        placeholder="Or paste direct group welcome image URL..."
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Group Welcome Message (Optional)</label>
                  <textarea
                    value={joinerGroupDetails}
                    onChange={(e) => setJoinerGroupDetails(e.target.value)}
                    rows={6}
                    className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-700 font-medium focus:outline-none resize-none text-xs"
                    placeholder={`01st Row (left - right)\nMayantha - GS Health | Akesh - GS Consumer\n\n02nd Row (left - right)\nPromod - Seregen | Asiri - GS Consumer`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  onClick={() => setJoinerModalOpen(false)}
                  className="px-6 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddOrUpdateJoiner}
                  disabled={!joinerDate}
                  className="px-8 py-3.5 bg-brand-red text-white hover:bg-brand-red-dark disabled:opacity-30 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-xl shadow-brand-red/10"
                >
                  {editingJoiner ? 'Save Changes' : 'Welcome Joiner'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── SELECTED JOINER DETAILS VIEW MODAL (LIGHTBOX) ── */}
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
              className="relative max-w-5xl w-full bg-transparent flex flex-col items-center gap-4 z-10"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedJoiner(null)}
                className="absolute -top-12 right-0 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all shadow-lg backdrop-blur-sm"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Big High-Res Framed Image */}
              <div className="w-full bg-[#1a1512] rounded-3xl p-2.5 border-4 border-[#3a3028] shadow-2xl overflow-hidden max-h-[75vh] flex items-center justify-center">
                <img 
                  src={selectedJoiner.group_image} 
                  alt="George Steuart Welcome Board Large" 
                  className="max-w-full max-h-[70vh] object-contain rounded-2xl"
                />
              </div>

              {/* Row Details / Caption Card */}
              {selectedJoiner.group_details && (
                <div className="w-full max-w-2xl bg-gradient-to-b from-[#9E1B1B]/95 to-[#701010]/95 p-5 rounded-2xl shadow-xl border border-red-800 text-white text-xs whitespace-pre-line leading-relaxed text-center shadow-2xl backdrop-blur-sm max-h-[15vh] overflow-y-auto">
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
