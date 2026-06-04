import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Laptop,
  Search,
  ChevronRight,
  ShieldCheck,
  Clock,
  Check,
  Plus,
  Loader2,
  CheckCircle2,
  X,
  ClipboardList,
  Trash2,
  User,
  UserPlus,
  ArrowRight,
  Cpu,
  Wifi,
  Settings,
  Shield,
  Headphones,
  Zap,
  Activity,
  TrendingUp,
  Download,
  AlertTriangle,
  FileText,
  Send,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const AnimatedNumber = ({ value }) => {
  const [displayValue, setDisplayValue] = useState(0);
  
  useEffect(() => {
    const isPercent = typeof value === 'string' && value.endsWith('%');
    const numericValue = parseInt(isPercent ? value.slice(0, -1) : value, 10) || 0;
    
    if (numericValue === 0) {
      setDisplayValue(0);
      return;
    }
    
    let start = 0;
    const duration = 800; // ms
    const stepTime = 16; // ~60fps
    const totalSteps = duration / stepTime;
    const increment = numericValue / totalSteps;
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= numericValue) {
        setDisplayValue(numericValue);
        clearInterval(timer);
      } else {
        setDisplayValue(Math.floor(start));
      }
    }, stepTime);
    
    return () => clearInterval(timer);
  }, [value]);
  
  const isPercent = typeof value === 'string' && value.endsWith('%');
  return <span>{displayValue}{isPercent ? '%' : ''}</span>;
};

const ITServiceDesk = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Queue State
  const [activeSubTab, setActiveSubTab] = useState('queue');
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [expandedTicketId, setExpandedTicketId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [assigneeFilter, setAssigneeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Dynamic details state
  const [ticketDetail, setTicketDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [logs, setLogs] = useState([]);

  // Analytics Summary State
  const [analytics, setAnalytics] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  const [usersList, setUsersList] = useState([]);
  const [selectedAssignees, setSelectedAssignees] = useState({});
  const [resolutionComments, setResolutionComments] = useState({});
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Form State for creating IT ticket
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('User Issue');
  const [priority, setPriority] = useState('medium');
  const [description, setDescription] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const fileInputRef = useRef(null);

  const categories = [
    { id: 'User Issue', label: 'User Support Issue', icon: User },
    { id: 'Hardware Issue', label: 'Hardware Issue', icon: Laptop },
    { id: 'Software Issue', label: 'Software Issue', icon: Settings },
    { id: 'Network Issue', label: 'Network Issue', icon: Wifi },
  ];

  // Fetch Tickets
  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const params = { 
        department: 'it',
        userId: user?.id,
        role: user?.role
      };
      if (statusFilter !== 'all') params.status = statusFilter;
      const res = await axios.get(`${backendUrl}/api/tickets`, { params });
      setTickets(res.data);
    } catch (err) {
      console.error('Error fetching IT tickets:', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  // Fetch Analytics summary
  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const res = await axios.get(`${backendUrl}/api/tickets/analytics/summary`, {
        params: { department: 'it' }
      });
      setAnalytics(res.data);
    } catch (err) {
      console.error('Error fetching analytics summary:', err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // Fetch single ticket details
  const fetchTicketDetails = async (ticketId) => {
    setLoadingDetail(true);
    try {
      const res = await axios.get(`${backendUrl}/api/tickets/${ticketId}/details`);
      setTicketDetail(res.data.ticket);
      setComments(res.data.comments || []);
      setAttachments(res.data.attachments || []);
      setLogs(res.data.logs || []);
    } catch (err) {
      console.error('Error fetching ticket details:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchAnalytics();
  }, [statusFilter]);

  // Fetch active users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/users`);
        setUsersList(res.data);
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    };
    fetchUsers();
  }, []);

  // Listen to Socket.IO events
  useEffect(() => {
    if (!socket) return;

    socket.on('ticket_created', () => {
      fetchTickets();
      fetchAnalytics();
    });

    socket.on('ticket_updated', ({ id }) => {
      fetchTickets();
      fetchAnalytics();
      if (expandedTicketId && Number(expandedTicketId) === Number(id)) {
        fetchTicketDetails(id);
      }
    });

    socket.on('comment_added', ({ ticketId }) => {
      if (expandedTicketId && Number(expandedTicketId) === Number(ticketId)) {
        fetchTicketDetails(ticketId);
      }
    });

    socket.on('ticket_closed', () => {
      fetchTickets();
      fetchAnalytics();
    });

    return () => {
      socket.off('ticket_created');
      socket.off('ticket_updated');
      socket.off('comment_added');
      socket.off('ticket_closed');
    };
  }, [socket, expandedTicketId]);

  // Load details when expanded
  useEffect(() => {
    if (expandedTicketId) {
      fetchTicketDetails(expandedTicketId);
    } else {
      setTicketDetail(null);
      setComments([]);
      setAttachments([]);
      setLogs([]);
    }
  }, [expandedTicketId]);

  // Filter IT staff members
  const itStaff = usersList.filter(u => 
    u.role === 'it_staff' || 
    u.role === 'it_admin' || 
    u.department?.toLowerCase() === 'it'
  );

  // Dynamic category calculations
  const categoryCounts = useMemo(() => {
    const counts = {
      'User Issue': 0,
      'Hardware Issue': 0,
      'Software Issue': 0,
      'Network Issue': 0
    };
    tickets.forEach(t => {
      if (counts[t.category] !== undefined) {
        counts[t.category]++;
      } else {
        counts[t.category] = (counts[t.category] || 0) + 1;
      }
    });
    return counts;
  }, [tickets]);

  // Dynamic SLA Breached tickets calculation
  const breachedTickets = useMemo(() => {
    return tickets.filter(t => t.sla_deadline && new Date(t.sla_deadline) < new Date() && !['resolved', 'closed'].includes(t.status));
  }, [tickets]);

  // Oldest open unassigned ticket
  const oldestUnassignedTicket = useMemo(() => {
    return tickets
      .filter(t => !t.assigned_to_id && t.status === 'open')
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))[0];
  }, [tickets]);

  // Filtered workload cards
  const filteredTeamWorkload = useMemo(() => {
    if (!analytics?.teamWorkload) return [];
    return analytics.teamWorkload.filter(staff =>
      staff.full_name?.toLowerCase().includes(staffSearchQuery.toLowerCase())
    );
  }, [analytics?.teamWorkload, staffSearchQuery]);

  // Submit new IT ticket
  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    setSubmitLoading(true);
    try {
      const res = await axios.post(`${backendUrl}/api/tickets`, {
        userId: user?.id,
        subject,
        department: 'it',
        category,
        priority,
        description,
      });

      const newId = res.data.id;

      if (attachedFile) {
        const formData = new FormData();
        formData.append('file', attachedFile);

        const uploadRes = await axios.post(`${backendUrl}/api/uploads/ticket-file`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        await axios.post(`${backendUrl}/api/tickets/${newId}/attachments`, {
          fileName: uploadRes.data.fileName,
          fileUrl: uploadRes.data.fileUrl,
          uploadedBy: user?.id
        });
      }

      setFormSuccess(true);
      setTimeout(() => {
        setSubject(''); setDescription(''); setCategory('User Issue'); setPriority('medium'); setAttachedFile(null);
        setShowFormModal(false); setFormSuccess(false); 
        fetchTickets();
        fetchAnalytics();
      }, 1500);
    } catch (err) {
      console.error('Error submitting ticket:', err);
      alert('Could not submit ticket: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitLoading(false);
    }
  };

  // Assign ticket to yourself
  const handleAssignToSelf = async (ticketId) => {
    try {
      await axios.put(`${backendUrl}/api/tickets/${ticketId}/status`, {
        status: 'assigned',
        assigned_to_id: user?.id,
        current_user_id: user?.id
      });
      fetchTickets();
      fetchAnalytics();
      if (expandedTicketId === ticketId) fetchTicketDetails(ticketId);
    } catch (err) {
      console.error('Error claiming ticket:', err);
    }
  };

  // Assign ticket to staff member
  const handleAssignTicket = async (ticketId, assigneeJsonStr) => {
    if (!assigneeJsonStr) return;
    try {
      const assigneeObj = JSON.parse(assigneeJsonStr);
      await axios.put(`${backendUrl}/api/tickets/${ticketId}/status`, {
        status: 'assigned',
        assigned_to_id: assigneeObj.id,
        current_user_id: user?.id
      });
      setSelectedAssignees(prev => {
        const copy = { ...prev };
        delete copy[ticketId];
        return copy;
      });
      fetchTickets();
      fetchAnalytics();
      if (expandedTicketId === ticketId) fetchTicketDetails(ticketId);
    } catch (err) {
      console.error('Error assigning ticket:', err);
    }
  };

  // Resolve Ticket
  const handleResolveTicket = async (ticketId, notes = '') => {
    try {
      await axios.put(`${backendUrl}/api/tickets/${ticketId}/status`, {
        status: 'resolved',
        resolution_notes: notes,
        current_user_id: user?.id
      });
      fetchTickets();
      fetchAnalytics();
      if (expandedTicketId === ticketId) fetchTicketDetails(ticketId);
    } catch (err) {
      console.error('Error resolving ticket:', err);
    }
  };

  // Delete ticket
  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm('Permanently delete this IT ticket?')) return;
    try {
      await axios.delete(`${backendUrl}/api/tickets/${ticketId}`);
      setExpandedTicketId(null);
      fetchTickets();
      fetchAnalytics();
    } catch (err) {
      console.error('Error deleting ticket:', err);
    }
  };

  // Submit comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submittingComment) return;

    setSubmittingComment(true);
    try {
      await axios.post(`${backendUrl}/api/tickets/${expandedTicketId}/comments`, {
        userId: user?.id,
        comment: newComment
      });
      setNewComment('');
      fetchTicketDetails(expandedTicketId);
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Detail upload attachment handler
  const handleUploadDetailFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const uploadRes = await axios.post(`${backendUrl}/api/uploads/ticket-file`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      await axios.post(`${backendUrl}/api/tickets/${expandedTicketId}/attachments`, {
        fileName: uploadRes.data.fileName,
        fileUrl: uploadRes.data.fileUrl,
        uploadedBy: user?.id
      });

      fetchTicketDetails(expandedTicketId);
    } catch (err) {
      console.error('File attach error:', err);
    }
  };

  // Export excel/pdf
  const handleExport = (format) => {
    const params = new URLSearchParams({
      department: 'it',
      userId: user?.id,
      role: user?.role
    });
    if (statusFilter !== 'all') params.append('status', statusFilter);
    window.open(`${backendUrl}/api/tickets/export/${format}?${params.toString()}`);
  };

  // Filter queue
  const filteredTickets = tickets
    .filter(t => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchSubject = t.subject?.toLowerCase().includes(query);
        const matchDesc = t.description?.toLowerCase().includes(query);
        const matchNo = t.ticket_no?.toLowerCase().includes(query);
        const matchName = t.full_name?.toLowerCase().includes(query);
        if (!matchSubject && !matchDesc && !matchNo && !matchName) return false;
      }
      if (assigneeFilter === 'mine') {
        return t.assigned_to_id === user?.id;
      }
      if (assigneeFilter === 'unassigned') {
        return !t.assigned_to_id;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
      if (sortBy === 'priority') {
        const weight = { urgent: 4, high: 3, medium: 2, low: 1 };
        return (weight[b.priority] || 2) - (weight[a.priority] || 2);
      }
      return 0;
    });

  // Helpers badges
  const getPriorityBadge = (lvl) => {
    const map = {
      low: 'bg-slate-50 border-slate-200 text-slate-600',
      medium: 'bg-amber-50 border-amber-200 text-amber-700',
      high: 'bg-orange-50 border-orange-200 text-orange-700',
      urgent: 'bg-red-50 border-red-200 text-red-700',
    };
    return map[lvl] || map.medium;
  };

  const getStatusBadge = (st) => {
    const map = {
      open: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
      assigned: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
      in_progress: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
      resolved: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
      closed: 'bg-slate-500/10 text-slate-600 border-slate-500/20'
    };
    return map[st] || 'bg-slate-100 text-slate-500 border-slate-200';
  };

  const COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#6366f1', '#64748b'];

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20">
      {/* IT Hero */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-10 rounded-[38px] overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1E3A5F] to-[#1D4ED8] min-h-[300px] flex items-center shadow-xl shadow-blue-900/10"
      >
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-0 right-0 w-full h-full opacity-5 pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10 px-8 sm:px-12 md:px-16 py-12 flex-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 backdrop-blur-md border border-blue-400/30 rounded-full">
              <Cpu className="w-3.5 h-3.5 text-blue-300" />
              <span className="text-[8px] font-black text-blue-300 uppercase tracking-widest">
                IT Service Desk Queue
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 border border-emerald-400/30 rounded-full">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-[8px] font-black text-emerald-300 uppercase tracking-widest">Active Connection</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tighter leading-none mb-3">
            IT Service <span className="text-blue-300">Operations Console</span>
          </h1>
          <p className="text-blue-200/70 text-sm font-medium leading-relaxed max-w-lg mb-8">
            Process, delegate, and resolve employee hardware, network, and application issues. Manage workloads and monitor SLA rules.
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => handleExport('excel')}
              className="px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/25 rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" /> Export Queue
            </button>
          </div>
        </div>

        <div className="hidden lg:flex flex-col pr-16 opacity-25 text-white gap-3 select-none">
          <Laptop className="w-16 h-16" />
          <Wifi className="w-12 h-12 ml-4" />
        </div>
      </motion.section>

      <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-8">
        
        {/* Tab Switcher */}
        <div className="flex justify-center mb-8">
          <div className="bg-slate-100/50 p-1.5 rounded-[24px] flex items-center gap-1">
            <button
              onClick={() => setActiveSubTab('queue')}
              className={`px-8 py-3.5 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all relative ${
                activeSubTab === 'queue' ? 'text-white' : 'text-slate-400 hover:text-slate-650'
              }`}
            >
              {activeSubTab === 'queue' && (
                <motion.div layoutId="activeSubTab" className="absolute inset-0 bg-slate-900 rounded-[20px] shadow-xl" />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <ClipboardList className="w-3.5 h-3.5" /> Active Queue
              </span>
            </button>
            <button
              onClick={() => setActiveSubTab('dashboard')}
              className={`px-8 py-3.5 rounded-[20px] text-[10px] font-black uppercase tracking-widest transition-all relative ${
                activeSubTab === 'dashboard' ? 'text-white' : 'text-slate-400 hover:text-slate-650'
              }`}
            >
              {activeSubTab === 'dashboard' && (
                <motion.div layoutId="activeSubTab" className="absolute inset-0 bg-slate-900 rounded-[20px] shadow-xl" />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5" /> Operations Dashboard
              </span>
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeSubTab === 'queue' ? (
            <motion.div
              key="queue-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              {/* Tickets Queue Desk */}
              <div className="bg-white rounded-3xl p-6 md:p-10 border border-slate-100 shadow-sm min-h-[400px]">
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
                      <Laptop className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-800 tracking-tight">IT Request Queue</h2>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Active hardware, software, & networking logs</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      statusFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-slate-50 border border-slate-200 text-slate-500'
                    }`} onClick={() => setStatusFilter('all')}>All</span>
                    <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      statusFilter === 'open' ? 'bg-blue-600 text-white' : 'bg-slate-50 border border-slate-200 text-slate-500'
                    }`} onClick={() => setStatusFilter('open')}>Open</span>
                    <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      statusFilter === 'in_progress' ? 'bg-blue-600 text-white' : 'bg-slate-50 border border-slate-200 text-slate-500'
                    }`} onClick={() => setStatusFilter('in_progress')}>In Progress</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-200 items-center">
                  <div className="md:col-span-5 relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Search className="h-4 w-4 text-slate-400" />
                    </span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search ticket subject, description, requester or ID..."
                      className="w-full bg-white border border-slate-200 pl-9 pr-4 py-2 rounded-xl text-xs font-semibold text-slate-705 focus:outline-none focus:border-blue-400 shadow-sm"
                    />
                  </div>

                  <div className="md:col-span-4 flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                    {[
                      { id: 'all', label: 'All Logs' },
                      { id: 'mine', label: 'Mine' },
                      { id: 'unassigned', label: 'Unassigned' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setAssigneeFilter(tab.id)}
                        className={`flex-1 py-1 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                          assigneeFilter === tab.id ? 'bg-blue-600 text-white' : 'text-slate-550 hover:text-slate-800'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="md:col-span-3">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:border-blue-400 cursor-pointer shadow-sm"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="priority">Priority weight</option>
                    </select>
                  </div>
                </div>

                {/* List items */}
                {loadingTickets ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-450 gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <p className="text-xs font-bold">Querying support queue...</p>
                  </div>
                ) : filteredTickets.length > 0 ? (
                  <div className="space-y-4">
                    {filteredTickets.map(t => {
                      const isExpanded = expandedTicketId === t.id;
                      const isSlaBreached = t.sla_deadline && new Date(t.sla_deadline) < new Date() && !['resolved', 'closed'].includes(t.status);

                      return (
                        <div 
                          key={t.id} 
                          className={`rounded-2xl border transition-all duration-300 ${
                            isExpanded ? 'bg-slate-50/50 border-blue-200 shadow-md' : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'
                          }`}
                        >
                          <div 
                            onClick={() => navigate(`/admin/tickets/it/${t.id}`)}
                            className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                          >
                            <div className="flex items-start gap-3.5 min-w-0 flex-1">
                              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 shrink-0">
                                <Laptop className="w-5 h-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[9px] font-black text-slate-400">#{t.ticket_no || `IT-${t.id}`}</span>
                                  <span className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-wider ${getPriorityBadge(t.priority)}`}>
                                    {t.priority}
                                  </span>
                                  <span className="text-[9px] font-bold text-slate-400">{t.category}</span>
                                  <span className="text-[8px] font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">
                                    By: {t.full_name}
                                  </span>
                                  {isSlaBreached && (
                                    <span className="text-[8px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded flex items-center gap-0.5 animate-pulse">
                                      <AlertTriangle className="w-2.5 h-2.5" /> SLA BREACHED
                                    </span>
                                  )}
                                </div>
                                <h4 className="text-sm font-black text-slate-800 tracking-tight mt-1 truncate">{t.subject}</h4>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 justify-between md:justify-end shrink-0">
                              <span className="text-[8.5px] font-bold text-slate-400 hidden sm:block">Logged: {new Date(t.created_at).toLocaleDateString()}</span>
                              <span className={`px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${getStatusBadge(t.status)}`}>
                                {t.status?.replace('_', ' ')}
                              </span>
                              <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center text-slate-450 border border-slate-100">
                                <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                              </motion.div>
                            </div>
                          </div>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden border-t border-slate-100"
                              >
                                {loadingDetail ? (
                                  <div className="flex justify-center items-center py-8 gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                                    <span className="text-xs font-bold text-slate-400">Loading details...</span>
                                  </div>
                                ) : ticketDetail ? (
                                  <div className="p-6 space-y-6">
                                    {/* Requester Context */}
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Requester Context</p>
                                      <p className="text-xs font-black text-slate-700 mt-1 flex items-center gap-1.5">
                                        <User className="w-4 h-4 text-blue-600" /> {t.full_name} ({t.subsidiary_name || 'GS Group'}) - Ext: {t.phone || 'N/A'}
                                      </p>
                                    </div>

                                    <div>
                                      <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Ticket Description</h5>
                                      <div className="bg-white border border-slate-100 p-5 rounded-2xl">
                                        <p className="text-xs font-semibold text-slate-750 whitespace-pre-wrap leading-relaxed">{t.description}</p>
                                      </div>
                                    </div>

                                    {t.status === 'resolved' && t.resolution_notes && (
                                      <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl">
                                        <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Resolution comments</p>
                                        <p className="text-xs font-semibold text-slate-700 mt-1">{t.resolution_notes}</p>
                                      </div>
                                    )}

                                    {/* Comment & Attachments tabs */}
                                    <div className="border-t border-slate-200 pt-6">
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        
                                        {/* Comments */}
                                        <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col max-h-[350px]">
                                          <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Audit & Staff Comments</h5>
                                          <div className="flex-1 overflow-y-auto space-y-2.5 mb-2.5 pr-1 custom-scrollbar">
                                            {comments.length > 0 ? (
                                              comments.map(c => (
                                                <div key={c.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl">
                                                  <div className="flex justify-between items-center mb-1">
                                                    <span className="text-[9px] font-black text-slate-700">{c.full_name} ({c.role.replace('_', ' ')})</span>
                                                    <span className="text-[8px] font-bold text-slate-400">{new Date(c.created_at).toLocaleTimeString()}</span>
                                                  </div>
                                                  <p className="text-xs font-semibold text-slate-600 leading-normal">{c.comment}</p>
                                                </div>
                                              ))
                                            ) : (
                                              <p className="text-xs text-slate-400 italic text-center py-8">No comments logged</p>
                                            )}
                                          </div>
                                          <form onSubmit={handleAddComment} className="flex gap-2">
                                            <input 
                                              type="text" 
                                              placeholder="Add comment..."
                                              value={newComment}
                                              onChange={(e) => setNewComment(e.target.value)}
                                              className="flex-1 border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-blue-400 shadow-inner"
                                            />
                                            <button type="submit" disabled={!newComment.trim()} className="px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl active:scale-95 transition-transform flex items-center justify-center shrink-0 cursor-pointer">
                                              <Send className="w-3.5 h-3.5" />
                                            </button>
                                          </form>
                                        </div>

                                        {/* Attachments */}
                                        <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col max-h-[350px]">
                                          <div className="flex justify-between items-center mb-2.5">
                                            <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Attachments ({attachments.length})</h5>
                                            <label className="cursor-pointer bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 px-2 py-1 rounded-[10px] text-[8px] font-black uppercase tracking-wider transition-all">
                                              Attach File
                                              <input type="file" onChange={handleUploadDetailFile} className="hidden" />
                                            </label>
                                          </div>
                                          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                            {attachments.length > 0 ? (
                                              attachments.map(a => (
                                                <div key={a.id} className="p-2.5 border border-slate-100 rounded-xl flex items-center justify-between bg-slate-50/50">
                                                  <div className="min-w-0 flex-1">
                                                    <p className="text-xs font-black text-slate-700 truncate leading-none mb-0.5">{a.file_name}</p>
                                                    <p className="text-[8px] font-bold text-slate-450 uppercase truncate">By: {a.full_name}</p>
                                                  </div>
                                                  <a href={a.file_url} target="_blank" rel="noreferrer" className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 ml-2 shrink-0">
                                                    <Download className="w-3.5 h-3.5" />
                                                  </a>
                                                </div>
                                              ))
                                            ) : (
                                              <p className="text-xs text-slate-450 italic text-center py-8">No attachments</p>
                                            )}
                                          </div>
                                        </div>

                                      </div>
                                    </div>

                                    {/* Actions controls */}
                                    <div className="pt-5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                      <span className="text-[9px] font-black text-slate-405 uppercase tracking-widest flex items-center gap-1.5">
                                        <Shield className="w-4 h-4 text-blue-600" /> IT Specialist Controls
                                      </span>

                                      <div className="flex items-center gap-2 flex-wrap">
                                        {['open', 'assigned', 'in_progress', 'pending'].includes(t.status) && (
                                          <div className="flex items-center gap-2">
                                            {user?.role === 'super_admin' ? (
                                              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-2 rounded-xl border border-slate-200">
                                                Assignee: {t.assignee_name || 'Unassigned'}
                                              </span>
                                            ) : (
                                              <>
                                                <select
                                                  value={selectedAssignees[t.id] !== undefined ? selectedAssignees[t.id] : (
                                                    (() => {
                                                      const curr = itStaff.find(member => member.id === t.assigned_to_id);
                                                      return curr ? JSON.stringify({ id: curr.id, name: curr.full_name }) : '';
                                                    })()
                                                  )}
                                                  onChange={(e) => setSelectedAssignees({ ...selectedAssignees, [t.id]: e.target.value })}
                                                  className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-[10px] font-bold focus:outline-none focus:border-blue-400 cursor-pointer shadow-sm"
                                                >
                                                  <option value="">— Select IT Specialist —</option>
                                                  {itStaff.map(member => (
                                                    <option key={member.id} value={JSON.stringify({ id: member.id, name: member.full_name })}>
                                                      {member.full_name} ({member.job_title || 'IT Staff'})
                                                    </option>
                                                  ))}
                                                </select>
                                                <button 
                                                  onClick={() => handleAssignTicket(t.id, selectedAssignees[t.id])}
                                                  disabled={!selectedAssignees[t.id]}
                                                  className="px-4 py-2 bg-blue-600 hover:bg-blue-750 text-white rounded-xl text-[9px] font-black uppercase tracking-wider shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                  Assign
                                                </button>
                                                {t.status === 'open' && (
                                                  <button 
                                                    onClick={() => handleAssignToSelf(t.id)}
                                                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[9px] font-black uppercase tracking-wider active:scale-95"
                                                  >
                                                    Claim
                                                  </button>
                                                )}
                                              </>
                                            )}
                                          </div>
                                        )}

                                        {['assigned', 'in_progress', 'pending'].includes(t.status) && user?.role !== 'super_admin' && (
                                          <div className="flex items-center gap-2">
                                            <input 
                                              type="text"
                                              placeholder="Resolution comments..."
                                              value={resolutionComments[t.id] || ''}
                                              onChange={(e) => setResolutionComments({ ...resolutionComments, [t.id]: e.target.value })}
                                              className="border border-slate-200 px-3 py-2 rounded-xl text-[10px] font-bold focus:outline-none focus:border-blue-400 w-52 shadow-sm"
                                            />
                                            <button 
                                              onClick={() => handleResolveTicket(t.id, resolutionComments[t.id])}
                                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider shadow-sm active:scale-95"
                                            >
                                              Resolve
                                            </button>
                                          </div>
                                        )}

                                        {user?.role !== 'super_admin' && (
                                          <button 
                                            onClick={() => handleDeleteTicket(t.id)}
                                            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-150 text-rose-650 rounded-xl text-[9px] font-black uppercase tracking-wider active:scale-95 ml-auto"
                                          >
                                            Delete
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                  </div>
                                ) : null}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-450 gap-2">
                    <Laptop className="w-10 h-10 text-slate-300" />
                    <h4 className="text-slate-800 font-black text-base">No IT requests found</h4>
                    <p className="text-slate-400 text-xs mt-0.5">There are no tickets logged matching your search filters.</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="dashboard-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-8"
            >
              {/* Analytics summary row */}
              {loadingAnalytics ? (
                <div className="flex justify-center items-center py-20 gap-2 bg-white rounded-3xl border border-slate-100 shadow-sm">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <span className="text-sm font-bold text-slate-400">Recalculating IT metrics...</span>
                </div>
              ) : analytics ? (
                <>
                  {/* Premium Stats Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                    {[
                      { 
                        label: 'Total Support Load', 
                        value: analytics.summary.total, 
                        icon: ClipboardList, 
                        color: '#2563eb',
                        desc: 'All logged tickets'
                      },
                      { 
                        label: 'Active Queue Size', 
                        value: analytics.summary.open, 
                        icon: Clock, 
                        color: '#d97706',
                        desc: 'Open, In Progress, Pending'
                      },
                      { 
                        label: 'Resolved & Closed', 
                        value: Number(analytics.summary.resolved || 0) + Number(analytics.summary.closed || 0), 
                        icon: CheckCircle2, 
                        color: '#059669',
                        desc: 'Completed requests'
                      },
                      { 
                        label: 'SLA Compliance Rate', 
                        value: `${analytics.summary.slaCompliance}%`, 
                        icon: ShieldCheck, 
                        color: analytics.summary.slaViolations > 0 ? '#e11d48' : '#7c3aed',
                        desc: analytics.summary.slaViolations > 0 ? `${analytics.summary.slaViolations} Breaches detected` : 'Within SLA targets',
                        badge: analytics.summary.slaViolations > 0 ? 'Breach Alert' : null
                      }
                    ].map((card, i) => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, y: 20 }} 
                        animate={{ opacity: 1, y: 0 }} 
                        transition={{ delay: i * 0.06 }}
                        className="relative bg-white/70 backdrop-blur-xl border border-white rounded-[28px] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.1)] transition-all duration-300 overflow-hidden group text-left"
                      >
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(circle at top right, ${card.color}08, transparent 70%)` }} />
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm" style={{ background: `${card.color}15` }}>
                            <card.icon className="w-5.5 h-5.5" style={{ color: card.color }} />
                          </div>
                          {card.badge && (
                            <span className="text-[8px] font-black text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                              {card.badge}
                            </span>
                          )}
                        </div>
                        <h3 className="text-3xl font-black text-slate-800 tracking-tight">
                          <AnimatedNumber value={card.value} />
                        </h3>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5">{card.label}</p>
                        <p className="text-[9px] font-bold text-slate-400 mt-1 lowercase first-letter:uppercase">{card.desc}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* Second Row: Categorized tickets and workloads */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Category Distribution Chart */}
                    <div className="lg:col-span-5 bg-white p-6 md:p-8 rounded-[32px] border border-slate-100 shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex flex-col justify-start self-start w-full">
                      <div>
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Category Distribution</h3>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Ticket breakdown by category</p>
                      </div>

                      {(() => {
                        const total = tickets.length || 1;
                        const data = Object.entries(categoryCounts).map(([name, count]) => ({
                          name,
                          value: count
                        })).filter(d => d.value > 0);

                        const categoryColors = {
                          'User Issue': '#3b82f6',
                          'Hardware Issue': '#f59e0b',
                          'Software Issue': '#ef4444',
                          'Network Issue': '#10b981'
                        };

                        const categoryIcons = {
                          'User Issue': User,
                          'Hardware Issue': Laptop,
                          'Software Issue': Settings,
                          'Network Issue': Wifi
                        };

                        return (
                          <div className="space-y-6 mt-6">
                            {data.length > 0 ? (
                              <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
                                <div className="w-36 h-36 shrink-0 relative flex justify-center">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                      <Pie
                                        data={data}
                                        innerRadius={45}
                                        outerRadius={65}
                                        paddingAngle={3}
                                        dataKey="value"
                                      >
                                        {data.map((entry, idx) => (
                                          <Cell key={idx} fill={categoryColors[entry.name] || '#64748b'} />
                                        ))}
                                      </Pie>
                                    </PieChart>
                                  </ResponsiveContainer>
                                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-2xl font-black text-slate-800">{tickets.length}</span>
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total</span>
                                  </div>
                                </div>

                                <div className="flex-1 w-full space-y-3.5 text-left">
                                  {Object.entries(categoryCounts).map(([catName, count]) => {
                                    const pct = Math.round((count / total) * 100);
                                    const CatIcon = categoryIcons[catName] || Laptop;
                                    const col = categoryColors[catName] || '#64748b';

                                    return (
                                      <div key={catName} className="space-y-1">
                                        <div className="flex items-center justify-between text-[10px] font-black text-slate-700">
                                          <div className="flex items-center gap-1.5">
                                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: col }} />
                                            <CatIcon className="w-3.5 h-3.5 text-slate-400" />
                                            <span>{catName}</span>
                                          </div>
                                          <span className="text-slate-400">{count} ({pct}%)</span>
                                        </div>
                                        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                          <motion.div 
                                            initial={{ width: 0 }} 
                                            animate={{ width: `${pct}%` }} 
                                            transition={{ duration: 0.6 }} 
                                            className="h-full rounded-full" 
                                            style={{ backgroundColor: col }} 
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center justify-center py-10 text-slate-350 gap-2 w-full">
                                <Laptop className="w-8 h-8 text-slate-200" />
                                <p className="text-xs font-bold">No categorized tickets logged</p>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* IT Specialist Workload Cards */}
                    <div className="lg:col-span-7 bg-white p-6 md:p-8 rounded-[32px] border border-slate-100 shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex flex-col justify-between">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">IT Specialist Workload</h3>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Specialist ticket load & resolution rate</p>
                        </div>
                        <div className="relative w-full sm:w-60">
                          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Search className="h-3.5 w-3.5 text-slate-400" />
                          </span>
                          <input
                            type="text"
                            value={staffSearchQuery}
                            onChange={(e) => setStaffSearchQuery(e.target.value)}
                            placeholder="Filter specialist by name..."
                            className="w-full bg-slate-50 border border-slate-200 pl-8 pr-4 py-2 rounded-xl text-[10.5px] font-semibold text-slate-700 focus:outline-none focus:border-blue-400 shadow-sm"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                        {filteredTeamWorkload.length > 0 ? (
                          filteredTeamWorkload.map(staff => {
                            const totalTickets = staff.active_tickets + staff.resolved_tickets;
                            const resolutionRate = totalTickets > 0 ? Math.round((staff.resolved_tickets / totalTickets) * 100) : 0;
                            const workloadStatus = staff.active_tickets > 3 ? { text: 'High Load', color: 'text-red-650 bg-red-500/10 border-red-500/20' } :
                                                   staff.active_tickets > 0 ? { text: 'Balanced', color: 'text-blue-600 bg-blue-500/10 border-blue-500/20' } :
                                                                            { text: 'Available', color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/20' };
                            return (
                              <div key={staff.id} className="bg-slate-50/50 border border-slate-150 rounded-2xl p-4 flex flex-col justify-between hover:shadow-md hover:bg-white hover:border-blue-150 transition-all duration-300 group relative overflow-hidden text-left">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-50 to-indigo-50/10 rounded-bl-[60px] -z-10 group-hover:scale-110 transition-transform duration-300" />
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-base shadow-sm shrink-0">
                                    {staff.full_name?.charAt(0)}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <span className={`px-2 py-0.5 rounded-lg border text-[7.5px] font-black uppercase tracking-wider ${workloadStatus.color}`}>
                                      {workloadStatus.text}
                                    </span>
                                    <h4 className="text-xs font-black text-slate-800 tracking-tight mt-1 truncate">{staff.full_name}</h4>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest truncate">{staff.role.replace('_', ' ')}</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 divide-x divide-slate-150 border-t border-slate-150 mt-4 pt-3 text-left">
                                  <div className="pr-3">
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Active</p>
                                    <p className="text-base font-black text-blue-600 mt-0.5">{staff.active_tickets}</p>
                                  </div>
                                  <div className="pl-3">
                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Resolved</p>
                                    <p className="text-base font-black text-emerald-600 mt-0.5">{staff.resolved_tickets}</p>
                                  </div>
                                </div>
                                <div className="mt-3.5 pt-2 border-t border-slate-100">
                                  <div className="flex justify-between items-center text-[8px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                    <span>Resolution Rate</span>
                                    <span className="text-slate-650">{resolutionRate}%</span>
                                  </div>
                                  <div className="h-1 bg-slate-100 rounded-full overflow-hidden mb-1">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${resolutionRate}%` }} transition={{ duration: 0.6 }} className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full" />
                                  </div>
                                </div>
                                {oldestUnassignedTicket && (
                                  <button
                                    onClick={() => handleAssignTicket(oldestUnassignedTicket.id, JSON.stringify({ id: staff.id, name: staff.full_name }))}
                                    className="mt-3.5 w-full py-2 bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-200 text-blue-600 text-[8.5px] font-black uppercase tracking-widest rounded-xl transition-all duration-200 shadow-sm active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <UserPlus className="w-3.5 h-3.5" /> Delegate Task ({oldestUnassignedTicket.ticket_no || `#${oldestUnassignedTicket.id}`})
                                  </button>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="col-span-2 flex flex-col items-center justify-center py-12 text-slate-350 gap-2 w-full">
                            {analytics.teamWorkload && analytics.teamWorkload.length > 0 ? (
                              <>
                                <Search className="w-8 h-8 text-slate-200" />
                                <p className="text-xs font-bold">No specialists match your filter</p>
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-8 h-8 text-slate-200" />
                                <p className="text-xs font-bold">No IT specialists registered</p>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Third Row: SLA breaches monitor and monthly trends chart */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Monthly Trend Area Chart */}
                    <div className="lg:col-span-7 bg-white p-6 md:p-8 rounded-[32px] border border-slate-100 shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex flex-col">
                      <div className="flex justify-between items-start mb-6 text-left">
                        <div>
                          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Support Request Volume</h3>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Monthly ticket creation history</p>
                        </div>
                        <div className="px-3.5 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-right">
                          <p className="text-[7.5px] font-bold text-slate-400 uppercase tracking-widest">Avg Resolution Time</p>
                          <p className="text-xs font-black text-slate-700 mt-0.5">{analytics.summary.avgResolutionTimeHours} Hours</p>
                        </div>
                      </div>
                      <div className="flex-1 min-h-[240px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={analytics.trends}>
                            <defs>
                              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="month" tick={{ fontSize: 9, fontWeight: 'bold', fill: '#64748b' }} />
                            <YAxis tick={{ fontSize: 9, fontWeight: 'bold', fill: '#64748b' }} />
                            <Tooltip contentStyle={{ fontSize: 11, borderRadius: 16 }} />
                            <Area type="monotone" dataKey="count" name="Tickets" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#trendGradient)" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* SLA Breach Monitor Warnings */}
                    <div className="lg:col-span-5 bg-white p-6 md:p-8 rounded-[32px] border border-slate-100 shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex flex-col justify-between">
                      <div className="text-left">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">SLA Breach Monitor</h3>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Tickets requiring critical dispatch</p>
                      </div>

                      <div className="flex-1 overflow-y-auto max-h-[250px] pr-1 mt-6 space-y-3 custom-scrollbar text-left">
                        {breachedTickets.length > 0 ? (
                          breachedTickets.map(t => (
                            <div 
                              key={t.id} 
                              onClick={() => {
                                setExpandedTicketId(t.id);
                                setActiveSubTab('queue');
                              }}
                              className="p-3.5 bg-rose-50/50 border border-rose-100 rounded-2xl flex items-center justify-between gap-3 cursor-pointer hover:bg-rose-50 hover:border-rose-200 transition-all duration-200"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[8px] font-black text-rose-500">#{t.ticket_no || `IT-${t.id}`}</span>
                                  <span className="text-[8px] font-bold text-slate-450 uppercase">{t.category}</span>
                                </div>
                                <h4 className="text-xs font-black text-slate-800 mt-1 truncate">{t.subject}</h4>
                                <p className="text-[8.5px] font-semibold text-slate-400 mt-0.5">Assignee: {t.assignee_name || 'Unassigned'}</p>
                              </div>
                              <div className="shrink-0 text-right">
                                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-600 text-[7px] font-black uppercase tracking-wider inline-block">
                                  Breached
                                </span>
                                <p className="text-[7px] font-bold text-slate-400 uppercase mt-1">Deadline Passed</p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="flex flex-col items-center justify-center py-14 text-slate-350 gap-2 h-full">
                            <ShieldCheck className="w-10 h-10 text-emerald-500 animate-bounce" />
                            <h4 className="text-slate-800 font-black text-xs uppercase tracking-widest mt-1">All Clear</h4>
                            <p className="text-[9.5px] text-slate-400 text-center font-medium mt-0.5">No tickets have breached their SLA deadline.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* CREATE MODAL */}
      <AnimatePresence>
        {showFormModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100] overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[32px] w-full max-w-xl shadow-2xl relative overflow-hidden border border-slate-100 z-10 text-left my-8"
            >
              <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-md">
                    <Laptop className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 leading-none">New IT Support Ticket</h3>
                    <p className="text-slate-400 text-xs font-bold mt-1.5">Submit help request to the IT team queue</p>
                  </div>
                </div>
                <button onClick={() => setShowFormModal(false)} className="w-10 h-10 hover:bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-650">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitTicket} className="p-6 md:p-8 space-y-6">
                {formSuccess ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-4 border border-emerald-100 shadow-sm">
                      <CheckCircle2 className="w-8 h-8 animate-bounce" />
                    </div>
                    <h4 className="text-slate-800 font-black text-xl">IT Request Registered!</h4>
                    <p className="text-slate-400 text-xs mt-1">Ticket logged in dispatch dashboard.</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Subject / Title</label>
                      <input
                        type="text"
                        placeholder="vpn access, network issue, laptop issue..."
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-xl text-slate-700 placeholder-slate-300 font-bold text-xs focus:outline-none focus:border-blue-400 focus:bg-white transition-all shadow-sm"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Category</label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 px-3 py-3.5 rounded-xl text-xs font-bold text-slate-650 focus:outline-none focus:border-blue-400 focus:bg-white cursor-pointer shadow-sm"
                        >
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Priority Level</label>
                        <div className="grid grid-cols-4 gap-2">
                          {['low', 'medium', 'high', 'urgent'].map(lvl => (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => setPriority(lvl)}
                              className={`py-2 rounded-xl text-[8px] font-black uppercase tracking-wider border text-center transition-all ${
                                priority === lvl ? 'bg-blue-600 border-transparent text-white shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-500'
                              }`}
                            >
                              {lvl}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Description</label>
                      <textarea
                        rows="4"
                        placeholder="Detail explanation of the IT issue..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-xl text-slate-700 placeholder-slate-300 font-bold text-xs focus:outline-none focus:border-blue-400 focus:bg-white transition-all shadow-sm"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Attach Document / File (Optional)</label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current.click()}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                        >
                          Choose File
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={(e) => setAttachedFile(e.target.files[0])}
                          className="hidden"
                        />
                        {attachedFile && (
                          <div className="flex items-center gap-2 bg-slate-55 p-2 rounded-xl border border-slate-150 text-[10px] font-bold text-slate-650 truncate max-w-xs">
                            <span className="truncate">{attachedFile.name}</span>
                            <button type="button" onClick={() => setAttachedFile(null)} className="text-slate-400 hover:text-slate-600">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setShowFormModal(false)}
                        className="px-5 py-3 rounded-xl border border-slate-200 text-slate-500 font-black text-[9px] uppercase tracking-wider hover:bg-slate-55 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitLoading}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-[9px] uppercase tracking-wider hover:bg-blue-800 transition-all flex items-center gap-1.5"
                      >
                        {submitLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Log Ticket'}
                      </button>
                    </div>
                  </>
                )}
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ITServiceDesk;
