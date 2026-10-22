import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Send, 
  Search, 
  MessageSquare, 
  User, 
  Clock, 
  Sparkles, 
  Check, 
  CheckCheck,
  ChevronLeft,
  X,
  MessageCircle,
  Info,
  Mail,
  Phone,
  ShieldAlert,
  Copy
} from 'lucide-react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';

const DirectMessages = () => {
  const { user } = useAuth();

  const hasValidProfilePic = (pic) => {
    return pic && pic !== 'null' && pic !== 'undefined' && String(pic).trim() !== '';
  };

  const getProfilePicUrl = (pic) => {
    if (!hasValidProfilePic(pic)) return null;
    if (pic.startsWith('http://') || pic.startsWith('https://') || pic.startsWith('/')) {
      return pic;
    }
    const host = backendUrl.replace('/api', '');
    return `${host}/uploads/${pic}`;
  };
  const [conversations, setConversations] = useState([]);
  const [activePartner, setActivePartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatSearch, setNewChatSearch] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showColleagueSidebar, setShowColleagueSidebar] = useState(window.innerWidth >= 1280);

  const quickReplies = [
    { text: "Approved.", icon: "👍" },
    { text: "Email sent!", icon: "💼" },
    { text: "Let's schedule a meeting.", icon: "📅" },
    { text: "Can you jump on a quick call?", icon: "📞" },
    { text: "Working on this now.", icon: "📝" },
    { text: "Out of office.", icon: "🚪" }
  ];

  const messagesEndRef = useRef(null);
  const chatIntervalRef = useRef(null);
  const conversationsIntervalRef = useRef(null);

  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // 1. Fetch Conversations List
  const fetchConversations = async (silent = false) => {
    if (!user?.id) return;
    try {
      const response = await axios.get(`${backendUrl}/messages/conversations/${user.id}`);
      setConversations(response.data);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  };

  // 2. Fetch Message History for active conversation
  const fetchMessages = async (partnerId, silent = false) => {
    if (!user?.id || !partnerId) return;
    if (!silent) setLoadingHistory(true);
    try {
      const response = await axios.get(
        `${backendUrl}/messages/conversation/${user.id}?otherId=${partnerId}`
      );
      setMessages(response.data);
      
      // Mark as read
      await axios.put(`${backendUrl}/messages/read/${partnerId}`, { receiver_id: user.id });
      fetchConversations(true); // silent update to refresh unread count
    } catch (error) {
      console.error('Failed to fetch message history:', error);
    } finally {
      if (!silent) setLoadingHistory(false);
    }
  };

  // 3. Fetch all users for starting a new chat
  const fetchAllUsers = async () => {
    try {
      const response = await axios.get(`${backendUrl}/users`);
      // Filter out the current user
      const filtered = response.data.filter(u => u.id !== user?.id);
      setAllUsers(filtered);
    } catch (error) {
      console.error('Failed to fetch employee directory:', error);
    }
  };

  // 4. Initial Setup & Intervals
  useEffect(() => {
    fetchConversations();
    fetchAllUsers();

    // Check if there's a quick-chat redirect partner in sessionStorage
    const redirectPartner = sessionStorage.getItem('quick_chat_partner');
    if (redirectPartner) {
      try {
        const partner = JSON.parse(redirectPartner);
        setActivePartner(partner);
        fetchMessages(partner.id);
        
        const initialMsg = sessionStorage.getItem('quick_chat_initial_message');
        if (initialMsg) {
          setNewMessage(initialMsg);
          sessionStorage.removeItem('quick_chat_initial_message');
        }
        
        sessionStorage.removeItem('quick_chat_partner');
      } catch (err) {
        console.error('Failed to parse quick chat partner:', err);
      }
    }

    // Set polling for conversations list
    conversationsIntervalRef.current = setInterval(() => {
      fetchConversations(true);
    }, 4000);

    return () => {
      if (conversationsIntervalRef.current) clearInterval(conversationsIntervalRef.current);
      if (chatIntervalRef.current) clearInterval(chatIntervalRef.current);
    };
  }, [user?.id]);

  // 5. Update polling when active conversation changes
  useEffect(() => {
    if (chatIntervalRef.current) clearInterval(chatIntervalRef.current);

    if (activePartner) {
      // Poll active chat history every 2 seconds for smooth real-time response
      chatIntervalRef.current = setInterval(() => {
        fetchMessages(activePartner.id, true);
      }, 2000);
    }

    return () => {
      if (chatIntervalRef.current) clearInterval(chatIntervalRef.current);
    };
  }, [activePartner, user?.id]);

  // 6. Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 7. Send Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activePartner) return;

    const messagePayload = {
      sender_id: user.id,
      receiver_id: activePartner.id,
      message_text: newMessage.trim()
    };

    // Optimistically add message to UI
    const tempMsg = {
      id: Date.now(),
      sender_id: user.id,
      receiver_id: activePartner.id,
      message_text: newMessage.trim(),
      created_at: new Date().toISOString(),
      is_read: 0,
      optimistic: true
    };
    setMessages(prev => [...prev, tempMsg]);
    setNewMessage('');

    try {
      const response = await axios.post(`${backendUrl}/messages`, messagePayload);
      
      // Update with actual saved database message
      setMessages(prev => prev.map(msg => msg.id === tempMsg.id ? response.data : msg));
      fetchConversations(true);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== tempMsg.id));
    }
  };

  // Select a user to start/continue a chat
  const handleSelectPartner = (partner) => {
    setActivePartner(partner);
    fetchMessages(partner.id);
    setShowNewChatModal(false);
  };

  // Format timestamp helper
  const formatTime = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDateLabel = (isoString) => {
    const date = new Date(isoString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  // Group messages by date
  const groupMessages = () => {
    const groups = {};
    messages.forEach(msg => {
      const dateLabel = formatDateLabel(msg.created_at);
      if (!groups[dateLabel]) {
        groups[dateLabel] = [];
      }
      groups[dateLabel].push(msg);
    });
    return groups;
  };

  // Filter conversations based on sidebar search query
  const filteredConversations = conversations.filter(c => 
    c.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.job_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.subsidiary_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter users inside "Start New Chat" modal
  const filteredUsers = allUsers.filter(u =>
    u.full_name?.toLowerCase().includes(newChatSearch.toLowerCase()) ||
    u.job_title?.toLowerCase().includes(newChatSearch.toLowerCase()) ||
    u.subsidiary_name?.toLowerCase().includes(newChatSearch.toLowerCase())
  );

  const messageGroups = groupMessages();

  return (
    <div className="flex flex-col h-[calc(100vh-105px)] lg:h-[calc(100vh-130px)] overflow-hidden bg-slate-50/50 rounded-2xl border border-slate-100 shadow-sm relative">
      {/* Decorative Blur BG */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-brand-red/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-1 overflow-hidden relative z-10">
        
        {/* ================= LEFT PANEL: CONVERSATIONS LIST ================= */}
        <div className={`w-full md:w-[350px] lg:w-[380px] border-r border-slate-100 flex flex-col bg-white/80 backdrop-blur-md transition-all duration-300 ${activePartner ? 'hidden md:flex' : 'flex'}`}>
          
          {/* Header & Search */}
          <div className="p-6 border-b border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-brand-red/10 rounded-2xl flex items-center justify-center text-brand-red">
                  <MessageSquare className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h2 className="text-slate-900 font-black text-xl tracking-tight">Direct Messages</h2>
                  <p className="text-slate-400 text-xs font-bold">Colleague Chat Center</p>
                </div>
              </div>
              <button 
                onClick={() => setShowNewChatModal(true)}
                className="w-10 h-10 bg-brand-red text-white hover:bg-brand-red-dark rounded-xl flex items-center justify-center shadow-lg shadow-brand-red/20 active:scale-95 transition-all"
              >
                <Sparkles className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-100 focus:border-brand-red/30 focus:bg-white pl-11 pr-4 py-3 rounded-2xl text-slate-700 placeholder-slate-400 font-medium text-sm focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Conversations Scrollbar */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((chat) => {
                const isActive = activePartner?.id === chat.id;
                return (
                  <button
                    key={chat.id}
                    onClick={() => handleSelectPartner(chat)}
                    className={`w-full flex items-center gap-3.5 p-4 rounded-2xl transition-all duration-300 text-left relative ${
                      isActive 
                        ? 'bg-brand-red text-white shadow-xl shadow-brand-red/20 scale-[1.01]' 
                        : 'hover:bg-slate-50 bg-transparent text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    {/* Avatar / Initials */}
                    <div className="relative flex-shrink-0 w-12 h-12">
                      {hasValidProfilePic(chat.profile_pic) ? (
                        <img 
                          src={getProfilePicUrl(chat.profile_pic)} 
                          alt={chat.full_name} 
                          className="w-full h-full rounded-xl object-cover border-2 border-white/20 shadow-md"
                          onError={(e) => { e.target.src = ''; }}
                        />
                      ) : (
                        <div className={`w-full h-full rounded-xl flex items-center justify-center font-black text-sm border shadow-md ${
                          isActive 
                            ? 'bg-white text-brand-red border-white/25' 
                            : 'bg-slate-100 border-slate-200 text-slate-600'
                        }`}>
                          {chat.full_name?.charAt(0) || 'U'}
                        </div>
                      )}
                      
                      {/* Active Status Ring (Seeded or Simulated) */}
                      <span className={`absolute bottom-[-2px] right-[-2px] w-3.5 h-3.5 rounded-full border-2 border-white ${
                        isActive ? 'bg-white' : 'bg-emerald-500'
                      }`} />
                    </div>

                    {/* Metadata Pane */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h4 className="font-black text-[15px] truncate tracking-tight">{chat.full_name}</h4>
                        <span className={`text-[10px] font-bold ${isActive ? 'text-white/60' : 'text-slate-400'}`}>
                          {chat.last_message_time ? new Date(chat.last_message_time).toLocaleDateString([], {month: 'short', day: 'numeric'}) : ''}
                        </span>
                      </div>
                      
                      <p className={`text-[11px] font-black uppercase tracking-wider mb-1 truncate ${isActive ? 'text-white/65' : 'text-slate-400'}`}>
                        {chat.job_title} • {chat.subsidiary_name}
                      </p>

                      <p className={`text-xs truncate ${isActive ? 'text-white/80 font-medium' : 'text-slate-500 font-medium'}`}>
                        {chat.last_message}
                      </p>
                    </div>

                    {/* Unread Counter Badge */}
                    {chat.unread_count > 0 && !isActive && (
                      <span className="flex-shrink-0 bg-brand-red text-white text-[10px] font-black w-5.5 h-5.5 rounded-full flex items-center justify-center shadow-lg shadow-brand-red/30 animate-pulse">
                        {chat.unread_count}
                      </span>
                    )}

                    {/* Active Left Pill */}
                    {isActive && (
                      <motion.div 
                        layoutId="activeChatIndicator"
                        className="absolute left-[-2px] w-1 h-8 bg-white rounded-r-full"
                      />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="text-center py-12 px-6">
                <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm font-bold">No active conversations</p>
                <p className="text-slate-400 text-xs mt-1">Click the top-right button to start chatting with your colleagues!</p>
              </div>
            )}
          </div>
        </div>

        {/* ================= RIGHT PANEL: CHAT ARENA ================= */}
        <div className={`flex-1 min-w-0 overflow-hidden flex flex-col h-full bg-slate-50/20 backdrop-blur-sm ${!activePartner ? 'hidden md:flex' : 'flex'}`}>
          {activePartner ? (
            <>
              {/* Chat Header */}
              <div className="px-6 py-4 border-b border-slate-100 bg-white/90 backdrop-blur-md flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Back Arrow for Mobile View */}
                  <button 
                    onClick={() => setActivePartner(null)}
                    className="md:hidden p-2 hover:bg-slate-100 rounded-xl transition-colors mr-1"
                  >
                    <ChevronLeft className="w-6 h-6 text-slate-600" />
                  </button>

                  <div className="relative flex-shrink-0 w-11 h-11">
                    {hasValidProfilePic(activePartner.profile_pic) ? (
                      <img 
                        src={getProfilePicUrl(activePartner.profile_pic)} 
                        alt={activePartner.full_name} 
                        className="w-full h-full rounded-xl object-cover border border-slate-200 shadow-sm"
                        onError={(e) => { e.target.src = ''; }}
                      />
                    ) : (
                      <div className="w-full h-full rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-slate-600 shadow-sm">
                        {activePartner.full_name?.charAt(0) || 'U'}
                      </div>
                    )}
                    <span className="absolute bottom-[-1px] right-[-1px] w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
                  </div>

                  <div>
                    <h3 className="text-slate-900 font-black text-[16px] tracking-tight leading-tight">{activePartner.full_name}</h3>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">
                      {activePartner.job_title} • <span className="text-brand-red">{activePartner.subsidiary_name}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="hidden lg:flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3.5 py-1.5 rounded-full font-black text-[10px] uppercase tracking-wider">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                    Online Context
                  </div>
                  
                  {/* Toggle Colleague Details Sidebar */}
                  <button 
                    onClick={() => setShowColleagueSidebar(prev => !prev)}
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
                      showColleagueSidebar 
                        ? 'bg-brand-red/5 border-brand-red/20 text-brand-red' 
                        : 'bg-slate-50 border-slate-150 text-slate-400 hover:text-slate-600'
                    }`}
                    title="Toggle Info Pane"
                  >
                    <Info className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Message + Sidebar Row Wrapper */}
              <div className="flex-1 flex flex-row overflow-hidden relative">
                
                {/* Main Chat Area Pane */}
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  
                  {/* Messages Arena Scroll */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-white/40">
                    {loadingHistory ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center space-y-2">
                          <div className="w-8 h-8 border-4 border-brand-red border-t-transparent rounded-full animate-spin mx-auto" />
                          <p className="text-slate-400 text-xs font-bold">Retrieving secure chat logs...</p>
                        </div>
                      </div>
                    ) : messages.length > 0 ? (
                      Object.keys(messageGroups).map((dateLabel) => (
                        <div key={dateLabel} className="space-y-4">
                          {/* Date Indicator bubble */}
                          <div className="flex justify-center">
                            <span className="bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full border border-slate-200/50">
                              {dateLabel}
                            </span>
                          </div>

                          {/* Conversation Bubbles */}
                          {messageGroups[dateLabel].map((msg) => {
                            const isSelf = msg.sender_id === user.id;
                            return (
                              <div 
                                key={msg.id}
                                className={`flex ${isSelf ? 'justify-end' : 'justify-start'}`}
                              >
                                <div className={`max-w-[75%] sm:max-w-[65%] rounded-[24px] p-4 shadow-sm relative group ${
                                  isSelf 
                                    ? 'bg-brand-red text-white rounded-br-[4px] shadow-brand-red/10' 
                                    : 'bg-white text-slate-800 border border-slate-100 rounded-bl-[4px]'
                                }`}>
                                  <p className="text-[14px] leading-relaxed break-words whitespace-pre-wrap font-medium">
                                    {msg.message_text}
                                  </p>
                                  
                                  <div className={`flex items-center gap-1.5 justify-end mt-2 text-[9px] font-bold ${
                                    isSelf ? 'text-white/60' : 'text-slate-400'
                                  }`}>
                                    <Clock className="w-3 h-3" />
                                    {formatTime(msg.created_at)}
                                    
                                    {isSelf && (
                                      msg.is_read ? (
                                        <CheckCheck className="w-3.5 h-3.5 text-white" />
                                      ) : (
                                        <Check className="w-3.5 h-3.5 text-white/50" />
                                      )
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <div className="w-16 h-16 bg-brand-red/5 rounded-3xl flex items-center justify-center text-brand-red mb-4 shadow-sm">
                          <Sparkles className="w-7 h-7" />
                        </div>
                        <h4 className="text-slate-800 font-black text-[16px]">Start the Conversation!</h4>
                        <p className="text-slate-400 text-xs max-w-xs mt-1">Send a friendly greeting to {activePartner.full_name} and establish secure group chat lines.</p>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Corporate Quick Replies */}
                  <div className="px-6 py-2.5 bg-white border-t border-slate-100/50 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider shrink-0 mr-1.5">Quick:</span>
                    {quickReplies.map((qr, idx) => (
                      <button 
                        key={idx}
                        type="button"
                        onClick={() => setNewMessage(`${qr.icon} ${qr.text}`)}
                        className="px-3.5 py-1.5 bg-slate-50 hover:bg-brand-red/5 hover:text-brand-red text-slate-600 rounded-full border border-slate-150 text-[11px] font-semibold whitespace-nowrap active:scale-95 transition-all flex items-center gap-1.5 shrink-0"
                      >
                        <span>{qr.icon}</span>
                        <span>{qr.text}</span>
                      </button>
                    ))}
                  </div>

                  {/* Message Entry Input */}
                  <form 
                    onSubmit={handleSendMessage}
                    className="p-4 bg-white border-t border-slate-100 flex items-center gap-3 backdrop-blur-md relative shrink-0"
                  >
                    <input
                      type="text"
                      placeholder={`Send a secure message to ${activePartner.full_name?.split(' ')[0]}...`}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-100 focus:border-brand-red/20 focus:bg-white px-5 py-4 rounded-2xl text-slate-700 placeholder-slate-400 font-medium text-sm focus:outline-none transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="h-[52px] px-6 bg-brand-red text-white hover:bg-brand-red-dark disabled:bg-slate-100 disabled:text-slate-400 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-brand-red/10 active:scale-95 disabled:scale-100 disabled:shadow-none transition-all animate-none"
                    >
                      <Send className="w-4 h-4" />
                      <span className="hidden sm:inline font-black text-xs uppercase tracking-wider">Send</span>
                    </button>
                  </form>
                </div>

                {/* Colleague Details Sidebar */}
                {showColleagueSidebar && (
                  <div className="absolute xl:relative right-0 top-0 bottom-0 w-[285px] border-l border-slate-100 bg-white flex flex-col p-6 overflow-y-auto no-scrollbar z-20 text-left shadow-2xl xl:shadow-none transition-all duration-300 transform translate-x-0 shrink-0">
                    <div className="flex justify-end mb-2">
                      <button 
                        onClick={() => setShowColleagueSidebar(false)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-col items-center text-center pb-6 border-b border-slate-100">
                      {/* Big Avatar */}
                      <div className="relative mb-4 w-20 h-20 flex-shrink-0">
                        {hasValidProfilePic(activePartner.profile_pic) ? (
                          <img 
                            src={getProfilePicUrl(activePartner.profile_pic)} 
                            alt={activePartner.full_name} 
                            className="w-full h-full rounded-3xl object-cover border-4 border-slate-50 shadow-md"
                            onError={(e) => { e.target.src = ''; }}
                          />
                        ) : (
                          <div className="w-full h-full rounded-3xl bg-slate-50 border border-slate-150 flex items-center justify-center font-black text-2xl text-slate-400 shadow-md">
                            {activePartner.full_name?.charAt(0) || 'U'}
                          </div>
                        )}
                        <span className="absolute bottom-0 right-0 w-4.5 h-4.5 rounded-full bg-emerald-500 border-2 border-white" />
                      </div>
                      
                      {/* Name */}
                      <h4 className="text-slate-800 font-black text-[15px] leading-snug tracking-tight">{activePartner.full_name}</h4>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1">{activePartner.job_title}</p>
                      
                      {/* Subsidiary Tag */}
                      <span className="inline-block mt-3 px-3 py-1 bg-brand-red/5 border border-brand-red/10 text-brand-red rounded-xl text-[10px] font-black uppercase tracking-widest">
                        {activePartner.subsidiary_name}
                      </span>
                    </div>

                    {/* Metadata Section */}
                    <div className="py-6 border-b border-slate-100 space-y-4">
                      <p className="text-[9px] font-black text-slate-400 tracking-[3px] uppercase">Corporate File</p>
                      
                      {/* Email */}
                      <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Corporate Email</p>
                          <p className="text-[12px] font-bold text-slate-700 truncate">{activePartner.email || `${activePartner.full_name?.toLowerCase().replace(/\s+/g, '')}@georgesteuart.lk`}</p>
                        </div>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(activePartner.email || `${activePartner.full_name?.toLowerCase().replace(/\s+/g, '')}@georgesteuart.lk`);
                          }}
                          className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition-colors ml-2 shrink-0"
                          title="Copy Email"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Ext / Phone */}
                      <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Direct Line / Ext</p>
                          <p className="text-[12px] font-bold text-slate-700">{activePartner.phone || '+94 11 234 5678 (Ext 2042)'}</p>
                        </div>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(activePartner.phone || '+94 11 234 5678 (Ext 2042)');
                          }}
                          className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg transition-colors ml-2 shrink-0"
                          title="Copy Phone"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Safety Banner */}
                    <div className="pt-4 flex items-start gap-2.5 p-4 bg-slate-50 border border-slate-150 rounded-[20px] shadow-inner text-left">
                      <ShieldAlert className="w-4 h-4 text-brand-red shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Internal Security</p>
                        <p className="text-[10px] text-slate-400 font-semibold mt-0.5 leading-relaxed">Communications are encrypted under Steuart Group compliance.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white/30">
              <div className="w-20 h-20 bg-brand-red/5 rounded-[32px] flex items-center justify-center text-brand-red mb-6 shadow-sm border border-brand-red/5">
                <MessageCircle className="w-9 h-9" />
              </div>
              <h3 className="text-slate-900 font-black text-xl tracking-tight">Colleague Messaging Hub</h3>
              <p className="text-slate-500 text-sm max-w-md mt-2 font-bold">
                Select an active conversation on the left, or use the quick directory search to establish secure lines with any corporate employee.
              </p>
              <button 
                onClick={() => setShowNewChatModal(true)}
                className="mt-6 px-6 py-3.5 bg-brand-red hover:bg-brand-red-dark text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-xl shadow-brand-red/15 active:scale-95 transition-all flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Find Employee
              </button>
            </div>
          )}
        </div>

      </div>

      {/* ================= NEW CHAT LOOKUP MODAL ================= */}
      <AnimatePresence>
        {showNewChatModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
            {/* Backdrop overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNewChatModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            {/* Modal Body Card */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-white rounded-[32px] w-full max-w-md shadow-2xl relative overflow-hidden flex flex-col max-h-[80vh] border border-slate-100 z-10"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-slate-900 font-black text-lg leading-none">Find Employee</h3>
                  <p className="text-slate-400 text-xs font-bold mt-1">Start a direct messaging channel</p>
                </div>
                <button 
                  onClick={() => setShowNewChatModal(false)}
                  className="w-8 h-8 hover:bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Field */}
              <div className="p-4 bg-slate-50/50 border-b border-slate-100">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                  <input
                    type="text"
                    placeholder="Search by name, title, or subsidiary..."
                    value={newChatSearch}
                    onChange={(e) => setNewChatSearch(e.target.value)}
                    className="w-full bg-white border border-slate-150 pl-11 pr-4 py-3 rounded-2xl text-slate-700 placeholder-slate-400 font-medium text-sm focus:outline-none focus:border-brand-red/30 transition-all"
                  />
                </div>
              </div>

              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar max-h-[45vh]">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((emp) => (
                    <button
                      key={emp.id}
                      onClick={() => handleSelectPartner(emp)}
                      className="w-full flex items-center gap-3.5 p-3 hover:bg-slate-50 rounded-2xl transition-all text-left group"
                    >
                      {/* Avatar */}
                      <div className="flex-shrink-0 w-11 h-11 relative">
                        {hasValidProfilePic(emp.profile_pic) ? (
                          <img 
                            src={getProfilePicUrl(emp.profile_pic)} 
                            alt={emp.full_name} 
                            className="w-full h-full rounded-xl object-cover border border-slate-200 shadow-sm"
                            onError={(e) => { e.target.src = ''; }}
                          />
                        ) : (
                          <div className="w-full h-full rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-sm text-slate-600 group-hover:bg-brand-red/10 group-hover:text-brand-red transition-all">
                            {emp.full_name?.charAt(0) || 'U'}
                          </div>
                        )}
                      </div>

                      {/* Metainfo */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-black text-slate-800 text-[14px] leading-tight group-hover:text-brand-red transition-colors">{emp.full_name}</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mt-1 truncate">
                          {emp.job_title}
                        </p>
                        <p className="text-[9px] font-black text-brand-red/80 uppercase tracking-widest mt-0.5 truncate">
                          {emp.subsidiary_name}
                        </p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <User className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 text-xs font-bold">No employees found</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DirectMessages;
