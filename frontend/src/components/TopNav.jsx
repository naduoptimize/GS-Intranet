import { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Bell, 
  Mail, 
  ChevronDown, 
  LogOut, 
  User, 
  Settings, 
  HelpCircle,
  Check,
  Volume2,
  FileText,
  ShieldCheck,
  MessageSquare,
  Sun,
  Moon,
  Command
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const TopNav = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Dropdown States
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);

  // Theme Switching State
  const [theme, setTheme] = useState(() => localStorage.getItem('gs-theme') || 'Light');

  // Command Palette Overlay States
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [paletteSearch, setPaletteSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [employees, setEmployees] = useState([]);

  // Refs for Click Outside
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);
  const msgRef = useRef(null);

  // Notifications & Conversations Data State
  const [notifications, setNotifications] = useState([]);
  const [conversations, setConversations] = useState([]);

  // Unread counts
  const unreadNotifCount = notifications.filter(n => !n.is_read).length;
  const unreadMsgCount = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0);

  const getProfilePicUrl = (pic) => {
    if (!pic || pic === 'null' || pic === 'undefined' || String(pic).trim() === '') return null;
    if (pic.startsWith('http://') || pic.startsWith('https://') || pic.startsWith('/')) {
      return pic;
    }
    return `http://localhost:5000/uploads/${pic}`;
  };

  const getNotifDetails = (type) => {
    switch (type) {
      case 'announcement':
        return { title: 'Group Announcement', icon: Volume2, color: 'text-[#C41230] bg-red-50' };
      case 'document':
        return { title: 'New Document Uploaded', icon: FileText, color: 'text-blue-600 bg-blue-50' };
      case 'security':
        return { title: 'Security Sync Complete', icon: ShieldCheck, color: 'text-green-600 bg-green-50' };
      default:
        return { title: 'Notification', icon: Bell, color: 'text-[#C41230] bg-red-50/10' };
    }
  };

  const formatRelativeTime = (pubDateStr) => {
    if (!pubDateStr) return '';
    try {
      const pubDate = new Date(pubDateStr);
      const now = new Date();
      const diffMs = now - pubDate;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${diffDays}d ago`;
    } catch (e) {
      return '';
    }
  };

  const fetchData = async () => {
    if (!user?.id) return;
    try {
      const notifRes = await axios.get(`http://localhost:5000/api/notifications/${user.id}`);
      setNotifications(notifRes.data);

      const msgRes = await axios.get(`http://localhost:5000/api/messages/conversations/${user.id}`);
      setConversations(msgRes.data);
    } catch (err) {
      console.error('Failed to fetch navbar data', err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);
    return () => clearInterval(interval);
  }, [user?.id]);

  // Handle reactive theme toggle and synchronization
  const handleThemeToggle = () => {
    const nextTheme = theme === 'Dark' ? 'Light' : 'Dark';
    setTheme(nextTheme);
    localStorage.setItem('gs-theme', nextTheme);
    const root = document.documentElement;
    if (nextTheme === 'Dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    window.dispatchEvent(new Event('storage'));
  };

  // Sync theme changes reactively across other pages or sections
  useEffect(() => {
    const handleStorageChange = () => {
      setTheme(localStorage.getItem('gs-theme') || 'Light');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Fetch all employee directory users for search matching
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/users');
        setEmployees(res.data);
      } catch (err) {
        console.error('Failed to load employee list', err);
      }
    };
    if (user?.id) {
      loadEmployees();
    }
  }, [user?.id]);

  // Window-level hotkey event listener (Ctrl+K / Cmd+K and ESC)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsPaletteOpen(prev => !prev);
      }
      if (e.key === 'Escape') {
        setIsPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setIsNotificationsOpen(false);
      }
      if (msgRef.current && !msgRef.current.contains(event.target)) {
        setIsMessagesOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllNotifRead = async () => {
    if (!user?.id) return;
    try {
      await axios.put(`http://localhost:5000/api/notifications/read-all/${user.id}`);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllMsgRead = async () => {
    if (!user?.id) return;
    try {
      const unreadConvs = conversations.filter(c => c.unread_count > 0);
      await Promise.all(unreadConvs.map(c => 
        axios.put(`http://localhost:5000/api/messages/read/${c.id}`, { receiver_id: user.id })
      ));
      setConversations(prev => prev.map(c => ({ ...c, unread_count: 0 })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotifClick = async (notif) => {
    try {
      await axios.put(`http://localhost:5000/api/notifications/${notif.id}/read`);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: 1 } : n));
    } catch (err) {
      console.error(err);
    }
    setIsNotificationsOpen(false);
    navigate(notif.link || '/feed');
  };

  const handleMsgClick = (conv) => {
    const partner = {
      id: conv.id,
      full_name: conv.full_name,
      profile_pic: conv.profile_pic || null,
      subsidiary_name: conv.subsidiary_name || '',
      job_title: conv.job_title || 'Colleague'
    };
    sessionStorage.setItem('quick_chat_partner', JSON.stringify(partner));
    setIsMessagesOpen(false);
    navigate('/messages');
  };

  const handleEmployeeSelect = (emp) => {
    const partner = {
      id: emp.id,
      full_name: emp.full_name,
      profile_pic: emp.profile_pic || null,
      subsidiary_name: emp.subsidiary_name || '',
      job_title: emp.job_title || 'Colleague'
    };
    sessionStorage.setItem('quick_chat_partner', JSON.stringify(partner));
    setIsPaletteOpen(false);
    navigate('/messages');
  };

  const staticCommands = [
    { id: 'dash', title: 'Go to Dashboard', category: 'Navigation', shortcut: '↵', action: () => navigate('/') },
    { id: 'feed', title: 'Go to Company Feed', category: 'Navigation', shortcut: '↵', action: () => navigate('/feed') },
    { id: 'dir', title: 'Go to Employee Directory', category: 'Navigation', shortcut: '↵', action: () => navigate('/directory') },
    { id: 'docs', title: 'Go to Document Center', category: 'Navigation', shortcut: '↵', action: () => navigate('/documents') },
    { id: 'msg', title: 'Go to Direct Messages', category: 'Navigation', shortcut: '↵', action: () => navigate('/messages') },
    { id: 'news', title: 'Go to Media Center', category: 'Navigation', shortcut: '↵', action: () => navigate('/news') },
    { id: 'mems', title: 'Go to Memories Wall', category: 'Navigation', shortcut: '↵', action: () => navigate('/memories') },
    { id: 'alerts', title: 'Go to Company Feed', category: 'Navigation', shortcut: '↵', action: () => navigate('/feed') },
    { id: 'settings', title: 'Go to Settings & Profile', category: 'Navigation', shortcut: '↵', action: () => navigate('/settings') },
    { id: 'theme', title: `Switch to ${theme === 'Dark' ? 'Light' : 'Dark'} Theme`, category: 'Actions', shortcut: 'T', action: () => handleThemeToggle() },
    { id: 'logout', title: 'Sign Out / Log Out', category: 'Actions', shortcut: 'Q', action: () => { logout(); setIsPaletteOpen(false); } },
  ];

  const filteredCommands = staticCommands.filter(cmd => 
    cmd.title.toLowerCase().includes(paletteSearch.toLowerCase()) ||
    cmd.category.toLowerCase().includes(paletteSearch.toLowerCase())
  );

  const filteredEmployees = paletteSearch.trim() === ''
    ? employees.slice(0, 4)
    : employees.filter(emp => 
        emp.full_name.toLowerCase().includes(paletteSearch.toLowerCase()) ||
        (emp.job_title && emp.job_title.toLowerCase().includes(paletteSearch.toLowerCase())) ||
        (emp.subsidiary_name && emp.subsidiary_name.toLowerCase().includes(paletteSearch.toLowerCase()))
      );

  const results = [
    ...filteredCommands.map(c => ({ type: 'command', data: c })),
    ...filteredEmployees.map(e => ({ type: 'employee', data: e })),
  ];

  // Reset selectedIndex whenever search query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [paletteSearch]);

  // Handle keyboard event inside command input
  const handlePaletteKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        const selected = results[selectedIndex];
        if (selected.type === 'command') {
          selected.data.action();
          setIsPaletteOpen(false);
        } else if (selected.type === 'employee') {
          handleEmployeeSelect(selected.data);
        }
      }
    } else if (e.key === 'Escape') {
      setIsPaletteOpen(false);
    }
  };

  return (
    <header className="hidden lg:flex h-16 bg-white/70 dark:bg-[#0B0F19]/70 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100/80 dark:border-white/5 transition-all">
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 flex items-center justify-between">
        {/* Search Bar */}
        <div className="relative w-full max-w-[340px] sm:max-w-[360px] group">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 group-focus-within:text-[#C41230] transition-colors duration-300">
            <Search className="w-4 h-4" />
          </span>
          <input 
            type="text" 
            placeholder="Search posts, employees, departments..."
            onClick={() => setIsPaletteOpen(true)}
            onFocus={(e) => { e.target.blur(); setIsPaletteOpen(true); }}
            readOnly
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-white/10 rounded-2xl transition-all duration-300 text-xs font-medium placeholder:text-slate-400 shadow-sm text-slate-700 dark:text-white outline-none cursor-pointer hover:border-slate-300 focus:border-[#C41230]/20"
          />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
        {/* Notifications & Messages */}
        <div className="flex items-center gap-1.5">
          
          {/* Instant Theme Toggle Button */}
          <button 
            onClick={handleThemeToggle}
            className="w-8.5 h-8.5 flex items-center justify-center rounded-lg bg-white text-slate-400 hover:text-[#C41230] hover:bg-[#C41230]/5 border border-slate-100 hover:border-[#C41230]/10 shadow-sm transition-all group cursor-pointer relative"
            title={`Switch to ${theme === 'Dark' ? 'Light' : 'Dark'} theme`}
          >
            <AnimatePresence mode="wait" initial={false}>
              {theme === 'Dark' ? (
                <motion.div
                  key="sun"
                  initial={{ rotate: -45, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 45, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Sun className="w-4 h-4 text-amber-500 group-hover:scale-105 transition-transform" />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ rotate: -45, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 45, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <Moon className="w-4 h-4 text-indigo-500 group-hover:scale-105 transition-transform" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          {/* Notifications Dropdown Container */}
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                setIsMessagesOpen(false);
                setIsDropdownOpen(false);
              }}
              className={`w-8.5 h-8.5 flex items-center justify-center rounded-lg transition-all relative group shadow-sm border ${
                isNotificationsOpen 
                ? 'bg-[#C41230]/10 border-[#C41230]/20 text-[#C41230]'
                : 'bg-white text-slate-400 hover:text-[#C41230] hover:bg-[#C41230]/5 border-slate-100 hover:border-[#C41230]/10'
              }`}
            >
              <Bell className="w-4 h-4 group-hover:scale-105 transition-transform" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-[#C41230] text-white text-[9px] flex items-center justify-center rounded-full border border-white font-black shadow-md animate-pulse">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {isNotificationsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="absolute right-0 mt-3 w-80 sm:w-96 bg-white border border-slate-100 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] z-50 origin-top-right overflow-hidden p-2"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Notifications</span>
                    {unreadNotifCount > 0 && (
                      <button 
                        onClick={handleMarkAllNotifRead}
                        className="text-[10px] font-black text-[#C41230] hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-[280px] overflow-y-auto custom-scrollbar my-2 space-y-1">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-slate-400">
                        <Check className="w-8 h-8 text-green-500 mx-auto mb-2 opacity-50" />
                        <p className="text-xs font-bold">All caught up!</p>
                      </div>
                    ) : (
                      notifications.map(notif => {
                        const details = getNotifDetails(notif.type);
                        const NotifIcon = details.icon;
                        return (
                          <button
                            key={notif.id}
                            onClick={() => handleNotifClick(notif)}
                            className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left group ${
                              notif.is_read ? 'hover:bg-slate-50' : 'bg-red-50/20 hover:bg-red-50/40'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${details.color}`}>
                              <NotifIcon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className={`text-[11px] font-black truncate ${notif.is_read ? 'text-slate-700' : 'text-slate-900'}`}>{details.title}</p>
                                <span className="text-[9px] text-slate-400 font-bold shrink-0">{formatRelativeTime(notif.created_at)}</span>
                              </div>
                              <p className="text-[10px] text-slate-500 font-semibold line-clamp-2 mt-0.5">{notif.message}</p>
                            </div>
                            {!notif.is_read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#C41230] shrink-0 mt-1.5 animate-pulse" />
                            )}
                          </button>
                        );
                      })
                    )}
                  </div>

                  <div className="border-t border-slate-50 p-2">
                    <button 
                      onClick={() => { setIsNotificationsOpen(false); navigate('/feed'); }}
                      className="w-full text-center py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                    >
                      View All Announcements
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Messages Dropdown Container */}
          <div className="relative" ref={msgRef}>
            <button 
              onClick={() => {
                setIsMessagesOpen(!isMessagesOpen);
                setIsNotificationsOpen(false);
                setIsDropdownOpen(false);
              }}
              className={`w-8.5 h-8.5 flex items-center justify-center rounded-lg transition-all relative group shadow-sm border ${
                isMessagesOpen 
                ? 'bg-[#C41230]/10 border-[#C41230]/20 text-[#C41230]'
                : 'bg-white text-slate-400 hover:text-[#C41230] hover:bg-[#C41230]/5 border-slate-100 hover:border-[#C41230]/10'
              }`}
            >
              <Mail className="w-4 h-4 group-hover:scale-105 transition-transform" />
              {unreadMsgCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#C41230] text-white text-[8px] flex items-center justify-center rounded-full border border-white font-black shadow-md animate-pulse">
                  {unreadMsgCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {isMessagesOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 15, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="absolute right-0 mt-3 w-80 sm:w-96 bg-white border border-slate-100 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] z-50 origin-top-right overflow-hidden p-2"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Messages</span>
                    {unreadMsgCount > 0 && (
                      <button 
                        onClick={handleMarkAllMsgRead}
                        className="text-[10px] font-black text-[#C41230] hover:underline"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-[280px] overflow-y-auto custom-scrollbar my-2 space-y-1">
                    {conversations.length === 0 ? (
                      <div className="py-8 text-center text-slate-400">
                        <MessageSquare className="w-8 h-8 text-slate-350 mx-auto mb-2 opacity-50" />
                        <p className="text-xs font-bold">No new messages</p>
                      </div>
                    ) : (
                      conversations.map(conv => (
                        <button
                          key={conv.id}
                          onClick={() => handleMsgClick(conv)}
                          className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left group ${
                            conv.unread_count === 0 ? 'hover:bg-slate-50' : 'bg-red-50/20 hover:bg-red-50/40'
                          }`}
                        >
                          <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 flex items-center justify-center shadow-sm">
                            {getProfilePicUrl(conv.profile_pic) ? (
                              <img src={getProfilePicUrl(conv.profile_pic)} alt={conv.full_name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-[#C41230] to-[#3D050C] flex items-center justify-center text-white text-[10px] font-black uppercase">
                                {conv.full_name?.charAt(0) || 'U'}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className={`text-[11px] font-black truncate ${conv.unread_count === 0 ? 'text-slate-700' : 'text-slate-900'}`}>{conv.full_name}</p>
                              <span className="text-[9px] text-slate-400 font-bold shrink-0">{formatRelativeTime(conv.last_message_time)}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 font-semibold line-clamp-2 mt-0.5">{conv.last_message}</p>
                          </div>
                          {conv.unread_count > 0 && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#C41230] shrink-0 mt-1.5 animate-pulse" />
                          )}
                        </button>
                      ))
                    )}
                  </div>

                  <div className="border-t border-slate-50 p-2">
                    <button 
                      onClick={() => { setIsMessagesOpen(false); navigate('/messages'); }}
                      className="w-full text-center py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                    >
                      View in Inbox
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* Profile Dropdown Container */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => {
              setIsDropdownOpen(!isDropdownOpen);
              setIsNotificationsOpen(false);
              setIsMessagesOpen(false);
            }}
            className="flex items-center gap-2.5 py-1 px-1.5 hover:bg-white/60 rounded-xl transition-all group cursor-pointer text-left"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden shadow-sm border border-slate-200 shrink-0 flex items-center justify-center bg-slate-100">
               {user?.profile_pic ? (
                 <img src={getProfilePicUrl(user?.profile_pic)} alt="Profile" className="w-full h-full object-cover" />
               ) : (
                 <span className="text-[#C41230] font-black text-xs uppercase">
                   {user?.full_name ? user.full_name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'GS'}
                 </span>
               )}
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-bold text-slate-800 leading-tight group-hover:text-[#C41230] transition-colors">
                {user?.full_name || 'Ruwan Perera'}
              </p>
              <p className="text-[10px] font-medium text-slate-400 leading-none mt-0.5">
                {user?.role === 'superadmin' ? 'Super Admin' : user?.role === 'groupadmin' ? 'Group Admin' : user?.role === 'subadmin' ? 'Sub Admin' : user?.job_title || 'Employee'}
              </p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Real Interactive Floating Dropdown Menu */}
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.95 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="absolute right-0 mt-3 w-64 bg-white border border-slate-100 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] p-2 z-50 origin-top-right overflow-hidden"
              >
                {/* User Header Details inside dropdown */}
                <div className="px-4 py-3 bg-slate-50 rounded-xl mb-2 text-left">
                  <p className="text-xs font-black text-slate-850 truncate">{user?.full_name || 'Guest User'}</p>
                  <p className="text-[10px] text-slate-400 font-bold truncate mt-0.5">{user?.email || 'guest@georgesteuart.lk'}</p>
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#C41230]/5 text-[#C41230] text-[8px] font-black uppercase tracking-widest rounded-md mt-2">
                    {user?.role || 'employee'}
                  </div>
                </div>

                {/* Navigation Options */}
                <div className="space-y-0.5">
                  <button 
                    onClick={() => { navigate('/settings'); setIsDropdownOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[11px] font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all text-left"
                  >
                    <User className="w-4 h-4 text-slate-450" />
                    My Profile
                  </button>
                  <button 
                    onClick={() => { navigate('/feed'); setIsDropdownOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[11px] font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all text-left"
                  >
                    <ShieldCheck className="w-4 h-4 text-slate-450" />
                    Alerts & Notices
                  </button>
                </div>

                {/* Divider inside dropdown */}
                <div className="h-px bg-slate-100 my-1.5" />

                {/* Logout Option */}
                <button
                  onClick={() => {
                    setIsDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[11px] font-black text-red-600 hover:bg-red-50 transition-all text-left"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      </div>

      {/* ── INTERACTIVE GLOBAL COMMAND PALETTE MODAL ── */}
      <AnimatePresence>
        {isPaletteOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-md cursor-pointer"
              onClick={() => setIsPaletteOpen(false)}
            />

            {/* Translucent Command Palette Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: -15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -15 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative w-full max-w-2xl bg-white dark:bg-[#131B2E] border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[500px] z-10"
            >
              {/* Search Header Bar */}
              <div className="flex items-center px-6 py-4.5 border-b border-slate-50 dark:border-slate-800/80 gap-3 shrink-0">
                <Command className="w-5 h-5 text-slate-400 dark:text-slate-500 animate-pulse" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search pages, team members, or trigger quick actions..."
                  value={paletteSearch}
                  onChange={(e) => setPaletteSearch(e.target.value)}
                  onKeyDown={handlePaletteKeyDown}
                  className="flex-1 bg-transparent border-0 text-sm font-semibold text-slate-800 dark:text-white placeholder:text-slate-400 outline-none p-0 focus:ring-0 focus:border-transparent"
                />
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 px-2 py-0.5 rounded-lg select-none">
                    ESC
                  </span>
                </div>
              </div>

              {/* Scrollable Results Center */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
                {results.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 dark:text-slate-500 flex flex-col items-center justify-center gap-3">
                    <Search className="w-8 h-8 opacity-40 shrink-0" />
                    <p className="text-xs font-bold">No matches found for "{paletteSearch}"</p>
                    <p className="text-[10px] opacity-70">Double-check spelling or try searching for another term.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Dynamic categories rendering */}
                    {['Navigation', 'Actions', 'Colleagues'].map(category => {
                      // Filter results belonging to this category
                      const categoryItems = results.filter(item => {
                        if (category === 'Colleagues') return item.type === 'employee';
                        return item.type === 'command' && item.data.category === category;
                      });

                      if (categoryItems.length === 0) return null;

                      return (
                        <div key={category} className="space-y-1">
                          <h5 className="px-3.5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[3px] select-none">
                            {category}
                          </h5>
                          <div className="space-y-0.5">
                            {categoryItems.map(item => {
                              // Get absolute index in the flat results list
                              const globalIndex = results.indexOf(item);
                              const isSelected = selectedIndex === globalIndex;

                              if (item.type === 'command') {
                                const cmd = item.data;
                                return (
                                  <button
                                    key={cmd.id}
                                    onClick={() => {
                                      cmd.action();
                                      setIsPaletteOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl transition-all text-left ${
                                      isSelected
                                      ? 'bg-slate-50 dark:bg-slate-800/40 text-[#C41230] dark:text-white border-l-4 border-l-[#C41230] font-black shadow-sm'
                                      : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/10 text-slate-650 dark:text-slate-350 font-bold'
                                    }`}
                                  >
                                    <span className="text-xs tracking-tight">{cmd.title}</span>
                                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-extrabold select-none">
                                      {cmd.shortcut}
                                    </span>
                                  </button>
                                );
                              } else {
                                const emp = item.data;
                                return (
                                  <button
                                    key={emp.id}
                                    onClick={() => handleEmployeeSelect(emp)}
                                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all text-left ${
                                      isSelected
                                      ? 'bg-slate-50 dark:bg-slate-800/40 text-slate-900 dark:text-white border-l-4 border-l-[#C41230] font-black shadow-sm'
                                      : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/10 text-slate-650 dark:text-slate-350 font-bold'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3 min-w-0 pr-4">
                                      <div className="w-7 h-7 rounded-lg overflow-hidden shrink-0 flex items-center justify-center bg-gradient-to-br from-[#C41230] to-[#3D050C] shadow-sm">
                                        {emp.profile_pic ? (
                                          <img
                                            src={emp.profile_pic.startsWith('http') ? emp.profile_pic : `http://localhost:5000/uploads/${emp.profile_pic}`}
                                            alt={emp.full_name}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <span className="text-white font-black text-[9px] uppercase">
                                            {emp.full_name.charAt(0)}
                                          </span>
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-xs truncate">{emp.full_name}</p>
                                        <p className="text-[9px] text-slate-400 dark:text-slate-500 font-extrabold truncate mt-0.5">
                                          {emp.job_title || 'Colleague'} • {emp.subsidiary_name || 'George Steuart'}
                                        </p>
                                      </div>
                                    </div>
                                    <span className="text-[8px] font-black text-[#C41230]/80 dark:text-[#C41230] uppercase tracking-widest px-2.5 py-1 rounded-md bg-[#C41230]/5 dark:bg-[#C41230]/10 shrink-0">
                                      Send Msg
                                    </span>
                                  </button>
                                );
                              }
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Interactive Footer */}
              <div className="px-6 py-3.5 border-t border-slate-50 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-900/10 shrink-0 flex items-center justify-between select-none">
                <div className="flex items-center gap-4 text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded">↑↓</kbd>
                    Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded">↵</kbd>
                    Select
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded">esc</kbd>
                    Close
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[8px] font-black text-[#C41230] dark:text-[#C41230] uppercase tracking-[2px]">
                  <span>GS Command Center</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default TopNav;
