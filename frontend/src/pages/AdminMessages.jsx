import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldAlert, 
  Search, 
  Trash2, 
  X, 
  Check, 
  AlertCircle, 
  RefreshCw, 
  MessageSquare, 
  Building2, 
  Calendar, 
  Clock, 
  User, 
  Download, 
  ArrowRight,
  Info,
  Copy,
  ChevronLeft,
  Shield,
  Lock,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function AdminMessages() {
  const { user } = useAuth();
  const isSub = user?.role === 'sub_admin';

  const [conversations, setConversations] = useState([]);
  const [subsidiaries, setSubsidiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subFilter, setSubFilter] = useState('');
  const [toast, setToast] = useState(null);

  // Active Audit State
  const [activeChat, setActiveChat] = useState(null); // { sender_id, receiver_id, sender_name, receiver_name, sender_email, receiver_email, sender_subsidiary, receiver_subsidiary, total_messages }
  const [chatHistory, setChatHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [showAuditSidebar, setShowAuditSidebar] = useState(true);

  const historyEndRef = useRef(null);
  const chatIntervalRef = useRef(null);
  const conversationsIntervalRef = useRef(null);

  useEffect(() => {
    load();
    // Poll active conversations list
    conversationsIntervalRef.current = setInterval(() => {
      load(true);
    }, 5000);

    return () => {
      if (conversationsIntervalRef.current) clearInterval(conversationsIntervalRef.current);
      if (chatIntervalRef.current) clearInterval(chatIntervalRef.current);
    };
  }, [user]);

  useEffect(() => {
    if (chatIntervalRef.current) clearInterval(chatIntervalRef.current);

    if (activeChat) {
      loadHistory();
      // Poll active chat log for real-time audit capability
      chatIntervalRef.current = setInterval(() => {
        loadHistory(true);
      }, 3000);
    } else {
      setChatHistory([]);
    }

    return () => {
      if (chatIntervalRef.current) clearInterval(chatIntervalRef.current);
    };
  }, [activeChat]);

  useEffect(() => {
    if (historyEndRef.current) {
      historyEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  async function load(silent = false) {
    if (!silent) setLoading(true);
    try {
      const params = isSub ? { subsidiaryId: user.subsidiary_id } : {};
      const [chatsRes, subsRes] = await Promise.all([
        axios.get(`${API}/messages/admin/conversations`, { params }),
        axios.get(`${API}/subsidiaries`)
      ]);
      setConversations(chatsRes.data);
      setSubsidiaries(subsRes.data);
    } catch (err) {
      if (!silent) showToast('Failed to load compliance conversations', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  }

  async function loadHistory(silent = false) {
    if (!activeChat) return;
    if (!silent) setLoadingHistory(true);
    try {
      const res = await axios.get(
        `${API}/messages/conversation/${activeChat.sender_id}`, 
        { params: { otherId: activeChat.receiver_id } }
      );
      setChatHistory(res.data);
    } catch (err) {
      if (!silent) showToast('Failed to load message log history', 'error');
    } finally {
      if (!silent) setLoadingHistory(false);
    }
  }

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleDeleteMessage() {
    if (!deleteConfirmId) return;
    try {
      await axios.delete(`${API}/messages/admin/message/${deleteConfirmId}`);
      showToast('Message moderated and deleted ✓');
      setDeleteConfirmId(null);
      
      // Refresh state
      loadHistory(true);
      load(true);
    } catch {
      showToast('Moderation delete failed', 'error');
    }
  }

  function handleExportAudit() {
    if (!activeChat || chatHistory.length === 0) return;
    
    const header = `=========================================
GEORGE STEUART GROUP COMPLIANCE CHAT AUDIT
Conversation: ${activeChat.sender_name} <-> ${activeChat.receiver_name}
Audited by: ${user?.full_name} (${user?.role})
Timestamp: ${new Date().toLocaleString()}
=========================================\n\n`;

    const log = chatHistory.map(m => {
      const sender = m.sender_id === activeChat.sender_id ? activeChat.sender_name : activeChat.receiver_name;
      return `[${new Date(m.created_at).toLocaleString()}] ${sender}: ${m.message_text}`;
    }).join('\n');

    const fullLog = header + log;
    
    navigator.clipboard.writeText(fullLog);
    showToast('Compliance Log copied to clipboard ✓');
  }

  // Filter conversations
  const filtered = conversations.filter(c => {
    const term = search.toLowerCase();
    const matchSearch = 
      c.sender_name?.toLowerCase().includes(term) ||
      c.receiver_name?.toLowerCase().includes(term) ||
      c.last_message?.toLowerCase().includes(term);

    const matchSub = 
      !subFilter || 
      String(c.sender_id) === subFilter || 
      c.sender_subsidiary === subFilter ||
      c.receiver_subsidiary === subFilter;

    return matchSearch && matchSub;
  });

  const formatTime = (isoString) => {
    if (!isoString) return '';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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

  // Group chat history by date labels
  const groupMessages = () => {
    const groups = {};
    chatHistory.forEach(msg => {
      const dateLabel = formatDateLabel(msg.created_at);
      if (!groups[dateLabel]) {
        groups[dateLabel] = [];
      }
      groups[dateLabel].push(msg);
    });
    return groups;
  };

  const messageGroups = groupMessages();

  return (
    <div className="flex flex-col h-[calc(100vh-125px)] md:h-[calc(100vh-180px)] lg:h-[calc(100vh-230px)] overflow-hidden bg-slate-50/50 rounded-[32px] border border-slate-100 shadow-sm relative">
      
      {/* Decorative BG Blurs */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-brand-red/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* TOAST Notifications */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -24, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: -24, scale: 0.95 }}
            className={`fixed top-8 right-8 z-[2000] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-white font-bold text-sm ${
              toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'
            }`}
          >
            {toast.type === 'error' ? <AlertCircle className="w-5 h-5"/> : <Check className="w-5 h-5"/>}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 overflow-hidden relative z-10">
        
        {/* ================= LEFT PANEL: ACTIVE THREADS ================= */}
        <div className={`w-full md:w-[350px] lg:w-[380px] border-r border-slate-100 flex flex-col bg-white/80 backdrop-blur-md transition-all duration-300 ${activeChat ? 'hidden md:flex' : 'flex'}`}>
          
          {/* Header */}
          <div className="p-6 border-b border-slate-100 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 bg-brand-red/10 rounded-2xl flex items-center justify-center text-brand-red">
                  <ShieldAlert className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h2 className="text-slate-900 font-black text-lg tracking-tight">Compliance Center</h2>
                  <p className="text-slate-400 text-xs font-bold">Audit &amp; Moderation Logs</p>
                </div>
              </div>
              <button 
                onClick={() => load()}
                className="w-10 h-10 bg-slate-50 border border-slate-100 hover:bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all"
                title="Refresh audit feed"
              >
                <RefreshCw className={`w-4 h-4 ${loading && !activeChat ? 'animate-spin' : ''}`}/>
              </button>
            </div>

            {/* Filters */}
            <div className="space-y-2.5">
              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                <input 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  placeholder="Search participants or logs..."
                  className="w-full bg-slate-50 border border-slate-100 focus:border-brand-red/30 focus:bg-white pl-11 pr-4 py-3 rounded-2xl text-slate-700 placeholder-slate-400 font-medium text-sm focus:outline-none transition-all"
                />
              </div>

              {/* Subsidiary dropdown filter (admins only) */}
              {!isSub && (
                <div className="relative">
                  <select
                    value={subFilter}
                    onChange={e => setSubFilter(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 focus:border-brand-red/30 focus:bg-white px-4 py-3 rounded-2xl text-[11px] font-black text-slate-500 outline-none appearance-none cursor-pointer focus:outline-none transition-all"
                  >
                    <option value="">All Entities / Subsidiaries</option>
                    {subsidiaries.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-slate-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Conversations Scroll List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {loading && conversations.length === 0 ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 bg-slate-50 rounded-2xl animate-pulse"/>
              ))
            ) : filtered.length === 0 ? (
              <div className="text-center py-12 px-6">
                <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm font-bold">No compliance threads</p>
                <p className="text-slate-400 text-xs mt-1">No chats matching your parameters were recorded.</p>
              </div>
            ) : (
              filtered.map((item, idx) => {
                const isActive = activeChat && 
                  ((activeChat.sender_id === item.sender_id && activeChat.receiver_id === item.receiver_id) ||
                   (activeChat.sender_id === item.receiver_id && activeChat.receiver_id === item.sender_id));
                
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveChat({
                      sender_id: item.sender_id,
                      receiver_id: item.receiver_id,
                      sender_name: item.sender_name,
                      receiver_name: item.receiver_name,
                      sender_email: item.sender_email,
                      receiver_email: item.receiver_email,
                      sender_subsidiary: item.sender_subsidiary,
                      receiver_subsidiary: item.receiver_subsidiary,
                      total_messages: item.total_messages
                    })}
                    className={`w-full flex flex-col p-4 rounded-2xl transition-all duration-300 text-left relative ${
                      isActive 
                        ? 'bg-brand-red text-white shadow-xl shadow-brand-red/20 scale-[1.01]' 
                        : 'hover:bg-slate-50 bg-white border border-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-start w-full mb-1">
                      <div className="min-w-0 flex-1 pr-2">
                        <h4 className="font-black text-[14px] truncate tracking-tight">
                          {item.sender_name} ↔ {item.receiver_name}
                        </h4>
                        <p className={`text-[10px] font-black uppercase tracking-wider mt-0.5 truncate ${
                          isActive ? 'text-white/70' : 'text-slate-400'
                        }`}>
                          {item.sender_subsidiary || 'George Steuart'} • {item.receiver_subsidiary || 'George Steuart'}
                        </p>
                      </div>
                      
                      <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider shrink-0 ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400 border border-slate-200/50'
                      }`}>
                        {item.total_messages} msgs
                      </span>
                    </div>

                    <p className={`text-xs truncate font-medium mt-1.5 w-full ${
                      isActive ? 'text-white/80' : 'text-slate-500'
                    }`}>
                      {item.last_message}
                    </p>

                    <div className={`flex justify-between items-center mt-3 pt-2.5 border-t w-full ${
                      isActive ? 'border-white/15 text-white/60' : 'border-slate-100 text-slate-400'
                    } text-[9px] font-bold`}>
                      <span>
                        Last activity: {formatDateLabel(item.last_message_time)} at {formatTime(item.last_message_time)}
                      </span>
                      <ArrowRight className="w-3 h-3 opacity-60" />
                    </div>

                    {isActive && (
                      <motion.div 
                        layoutId="activeAdminChatIndicator"
                        className="absolute left-[-2px] top-4 bottom-4 w-1 bg-white rounded-r-full"
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ================= RIGHT PANEL: CHAT AUDIT HISTORY ================= */}
        <div className={`flex-1 flex flex-col h-full bg-slate-50/20 backdrop-blur-sm ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
          
          {activeChat ? (
            <>
              {/* Header */}
              <div className="px-6 py-4 border-b border-slate-100 bg-white/90 backdrop-blur-md flex items-center justify-between z-10 shrink-0">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setActiveChat(null)}
                    className="md:hidden p-2 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6 text-slate-600" />
                  </button>

                  <div className="w-10 h-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white border border-slate-800 shadow-md">
                    <ShieldAlert className="w-5 h-5 text-brand-red animate-pulse" />
                  </div>

                  <div>
                    <h3 className="text-slate-900 font-black text-[16px] tracking-tight leading-tight">
                      Auditing: {activeChat.sender_name} ↔ {activeChat.receiver_name}
                    </h3>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest leading-none mt-1">
                      Compliance Logs • <span className="text-brand-red">Archived Feed</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={handleExportAudit}
                    className="hidden sm:flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-wider transition-all shadow-md shadow-slate-900/10 active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" /> Export Log
                  </button>

                  <button 
                    onClick={() => setShowAuditSidebar(prev => !prev)}
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
                      showAuditSidebar 
                        ? 'bg-brand-red/5 border-brand-red/20 text-brand-red' 
                        : 'bg-slate-50 border-slate-150 text-slate-400 hover:text-slate-600'
                    }`}
                    title="Audit Details Sidebar"
                  >
                    <Info className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Advisory Banner */}
              <div className="px-6 py-2.5 bg-red-50 border-b border-red-100/50 flex items-center gap-2 shrink-0 text-left">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-ping shrink-0" />
                <p className="text-[10px] font-black text-brand-red uppercase tracking-wider leading-none">
                  Compliance review active. Safety deletions are logged permanently.
                </p>
              </div>

              {/* Chat Viewport Row Wrapper */}
              <div className="flex-1 flex flex-row overflow-hidden relative">
                
                {/* Main Messages Area */}
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-white/40">
                    {loadingHistory && chatHistory.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center space-y-2">
                          <div className="w-8 h-8 border-4 border-brand-red border-t-transparent rounded-full animate-spin mx-auto" />
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Decrypting conversation logs...</p>
                        </div>
                      </div>
                    ) : chatHistory.length > 0 ? (
                      Object.keys(messageGroups).map((dateLabel) => (
                        <div key={dateLabel} className="space-y-4">
                          {/* Date Bubble */}
                          <div className="flex justify-center">
                            <span className="bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full border border-slate-200/50">
                              {dateLabel}
                            </span>
                          </div>

                          {/* Chat Bubbles */}
                          {messageGroups[dateLabel].map((msg) => {
                            const isSenderA = msg.sender_id === activeChat.sender_id;
                            const senderName = isSenderA ? activeChat.sender_name : activeChat.receiver_name;
                            
                            return (
                              <div 
                                key={msg.id}
                                className={`flex flex-col max-w-[75%] sm:max-w-[65%] ${
                                  isSenderA ? 'mr-auto items-start text-left' : 'ml-auto items-end text-right'
                                }`}
                              >
                                {/* Name + Time Header */}
                                <div className="flex items-center gap-1.5 mb-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                  <span>{senderName}</span>
                                  <span>•</span>
                                  <span>{formatTime(msg.created_at)}</span>
                                </div>

                                {/* Speech Bubble Card */}
                                <div className={`p-4 rounded-[24px] shadow-sm relative group border transition-all ${
                                  isSenderA 
                                    ? 'bg-white border-slate-100 text-slate-800 rounded-tl-[4px]' 
                                    : 'bg-slate-900 border-slate-800 text-white rounded-tr-[4px]'
                                }`}>
                                  <p className="text-[14px] leading-relaxed break-words whitespace-pre-wrap font-medium">
                                    {msg.message_text}
                                  </p>

                                  {/* Moderation Actions Trigger */}
                                  <button 
                                    onClick={() => setDeleteConfirmId(msg.id)}
                                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all duration-200 active:scale-90"
                                    title="Delete Message (Compliance Moderation)"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center p-8">
                        <div className="w-16 h-16 bg-brand-red/5 rounded-3xl flex items-center justify-center text-brand-red mb-4 border border-brand-red/5">
                          <Check className="w-7 h-7" />
                        </div>
                        <h4 className="text-slate-800 font-black text-[16px]">No Messages</h4>
                        <p className="text-slate-400 text-xs max-w-xs mt-1">This compliance conversation log is currently empty.</p>
                      </div>
                    )}
                    <div ref={historyEndRef} />
                  </div>
                </div>

                {/* Audit Sidebar / Info Drawer */}
                {showAuditSidebar && (
                  <div className="absolute right-0 top-0 bottom-0 w-[290px] border-l border-slate-100 bg-white flex flex-col p-6 overflow-y-auto no-scrollbar z-20 text-left shadow-2xl transition-all duration-300 transform translate-x-0">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 tracking-[3px] uppercase">Audit Details</p>
                      <button 
                        onClick={() => setShowAuditSidebar(false)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-6 flex-1">
                      
                      {/* Participant A */}
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                        <div className="flex items-center gap-2.5 mb-2.5">
                          <div className="w-7 h-7 rounded-lg bg-slate-200/60 border border-slate-350 flex items-center justify-center font-black text-[11px] text-slate-600 shadow-inner">
                            {activeChat.sender_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="text-[11px] font-black text-slate-800 truncate max-w-[170px]">{activeChat.sender_name}</p>
                            <p className="text-[8px] font-black text-brand-red uppercase tracking-wider">Primary Sender</p>
                          </div>
                        </div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Subsidiary / Entity</p>
                        <p className="text-[11px] font-bold text-slate-650 truncate mb-2">{activeChat.sender_subsidiary || 'George Steuart'}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Corporate Email</p>
                        <p className="text-[11px] font-semibold text-slate-600 truncate">{activeChat.sender_email}</p>
                      </div>

                      {/* Participant B */}
                      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-left">
                        <div className="flex items-center gap-2.5 mb-2.5">
                          <div className="w-7 h-7 rounded-lg bg-slate-200/60 border border-slate-350 flex items-center justify-center font-black text-[11px] text-slate-600 shadow-inner">
                            {activeChat.receiver_name?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <p className="text-[11px] font-black text-slate-800 truncate max-w-[170px]">{activeChat.receiver_name}</p>
                            <p className="text-[8px] font-black text-brand-red uppercase tracking-wider">Recipient Partner</p>
                          </div>
                        </div>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Subsidiary / Entity</p>
                        <p className="text-[11px] font-bold text-slate-650 truncate mb-2">{activeChat.receiver_subsidiary || 'George Steuart'}</p>
                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Corporate Email</p>
                        <p className="text-[11px] font-semibold text-slate-600 truncate">{activeChat.receiver_email}</p>
                      </div>

                      {/* Export Actions (Drawer view) */}
                      <div className="space-y-3 pt-3">
                        <button
                          onClick={handleExportAudit}
                          className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all shadow-md active:scale-[0.98]"
                        >
                          <Download className="w-4 h-4 text-brand-red" /> Export Full Audit Report
                        </button>
                      </div>

                      {/* Safety Standards Info card */}
                      <div className="p-4 bg-slate-50/50 border border-slate-150 rounded-[20px] flex items-start gap-2.5 text-left shadow-inner">
                        <Lock className="w-4 h-4 text-brand-red shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Internal Security</p>
                          <p className="text-[10px] text-slate-400 font-semibold mt-0.5 leading-relaxed">
                            Communications are monitored in accordance with the George Steuart Group Compliance Charter.
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white/30">
              <div className="w-20 h-20 bg-brand-red/5 rounded-[32px] flex items-center justify-center text-brand-red mb-6 border border-brand-red/5 shadow-sm">
                <ShieldAlert className="w-9 h-9" />
              </div>
              <h3 className="text-slate-900 font-black text-xl tracking-tight">Compliance Audit Console</h3>
              <p className="text-slate-550 text-sm max-w-md mt-2 font-bold leading-relaxed text-slate-500">
                Select an active communication thread from the left pane to analyze participant chat logs, investigate dialogue entries, and moderate corporate networks.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* ================= MODERATION CONFIRM MODAL ================= */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-[12000] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setDeleteConfirmId(null)} 
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 15 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 15 }} 
              className="relative bg-white rounded-[32px] shadow-2xl p-8 max-w-sm w-full text-center z-10 border border-slate-100"
            >
              <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-red-100">
                <Trash2 className="w-6 h-6 text-brand-red"/>
              </div>
              <h3 className="text-lg font-black text-slate-900 mb-1.5">Moderate Log?</h3>
              <p className="text-slate-400 text-xs font-semibold mb-6 leading-relaxed">
                This administrative action will permanently delete this message from the corporate server for compliance and group safety. This is irreversible.
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteConfirmId(null)} 
                  className="flex-1 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-550 border border-slate-150 rounded-xl font-black uppercase tracking-widest transition-all text-[10px]"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleDeleteMessage} 
                  className="flex-1 py-3.5 bg-brand-red hover:bg-brand-red-dark text-white rounded-xl font-black uppercase tracking-widest transition-all shadow-lg shadow-brand-red/10 text-[10px]"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
