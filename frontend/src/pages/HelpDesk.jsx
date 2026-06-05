import { useState, useEffect, useRef } from 'react';
import { 
  HelpCircle, 
  MessageSquare, 
  Search, 
  ChevronRight, 
  User, 
  Laptop, 
  Mail, 
  ShieldCheck, 
  Headphones, 
  Clock, 
  Check, 
  Plus, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Filter, 
  X, 
  ClipboardList, 
  Trash2, 
  UserPlus, 
  Briefcase, 
  Paperclip, 
  Send, 
  Star,
  FileText,
  Download,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useLocation } from 'react-router-dom';

const HelpDesk = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const location = useLocation();
  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  
  // Tabs: 'tickets' or 'directory'
  const [activeTab, setActiveTab] = useState('tickets');
  
  // Contacts Directory State
  const [selectedMatter, setSelectedMatter] = useState('hr');
  const [selectedCategory, setSelectedCategory] = useState('attendance');
  const [searchQuery, setSearchQuery] = useState('');

  // Ticket System State
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [expandedTicketId, setExpandedTicketId] = useState(null);
  
  // Ticket detail state (loaded dynamically when expanded)
  const [ticketDetail, setTicketDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [logs, setLogs] = useState([]);
  const [deadlineHistory, setDeadlineHistory] = useState([]);

  const [usersList, setUsersList] = useState([]);
  const [selectedAssignees, setSelectedAssignees] = useState({});
  const [viewMode, setViewMode] = useState(
    location.pathname.includes('/admin') ? 'admin' : 'personal'
  );

  // Staff assigned tasks state
  const [assignedTickets, setAssignedTickets] = useState([]);
  const [loadingAssigned, setLoadingAssigned] = useState(false);
  const [expandedAssignedId, setExpandedAssignedId] = useState(null);
  const [assignedDetail, setAssignedDetail] = useState(null);
  const [assignedComments, setAssignedComments] = useState([]);
  const [assignedAttachments, setAssignedAttachments] = useState([]);
  const [assignedLogs, setAssignedLogs] = useState([]);
  const [assignedDeadlineHistory, setAssignedDeadlineHistory] = useState([]);
  const [newAssignedComment, setNewAssignedComment] = useState('');
  const [submittingAssignedComment, setSubmittingAssignedComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState({});
  
  const [adminDeptFilter, setAdminDeptFilter] = useState('all');
  const [adminStatusFilter, setAdminStatusFilter] = useState('all');
  const [resolutionComments, setResolutionComments] = useState({});

  // Rating and feedback modal state
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingTicketId, setRatingTicketId] = useState(null);
  const [satisfactionRating, setSatisfactionRating] = useState(5);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);

  // New comment input
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // New ticket attachment uploads
  const [attachedFile, setAttachedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef(null);

  // Sync Socket.IO events
  useEffect(() => {
    if (!socket) return;

    socket.on('ticket_updated', ({ id, status, details }) => {
      fetchTickets();
      if (isStaffRole) fetchAssignedTickets();
      if (expandedTicketId && Number(expandedTicketId) === Number(id)) {
        fetchTicketDetails(id);
      }
      if (expandedAssignedId && Number(expandedAssignedId) === Number(id)) {
        fetchAssignedDetail(id);
      }
    });

    socket.on('comment_added', ({ ticketId, userName, comment }) => {
      if (expandedTicketId && Number(expandedTicketId) === Number(ticketId)) {
        // Refresh details to fetch full comment info
        fetchTicketDetails(ticketId);
      }
    });

    socket.on('ticket_closed', ({ id }) => {
      fetchTickets();
      if (expandedTicketId && Number(expandedTicketId) === Number(id)) {
        fetchTicketDetails(id);
      }
    });

    return () => {
      socket.off('ticket_updated');
      socket.off('comment_added');
      socket.off('ticket_closed');
    };
  }, [socket, expandedTicketId]);

  useEffect(() => {
    if (location.pathname.includes('/admin')) {
      setViewMode('admin');
    } else {
      setViewMode('personal');
    }
  }, [location.pathname]);

  useEffect(() => {
    if (user?.role === 'it_admin') {
      setAdminDeptFilter('it');
    } else if (user?.role === 'hr_admin') {
      setAdminDeptFilter('hr');
    } else if (user?.role === 'sub_admin') {
      const dept = user.department?.toLowerCase();
      if (dept === 'it' || dept === 'hr') {
        setAdminDeptFilter(dept);
      }
    }
  }, [user]);

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
  
  // Submit Ticket Form State
  const [subject, setSubject] = useState('');
  const [department, setDepartment] = useState('it');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('medium');
  const [description, setDescription] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [deadline, setDeadline] = useState('');
  const [tempDeadline, setTempDeadline] = useState('');
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [extensionReason, setExtensionReason] = useState('');
  const [editingTicket, setEditingTicket] = useState(null);
  const [customCategory, setCustomCategory] = useState('');

  // Reset form states on modal close
  useEffect(() => {
    if (!showFormModal) {
      setSubject('');
      setDepartment('it');
      setCategory('');
      setPriority('medium');
      setDescription('');
      setDeadline('');
      setCustomCategory('');
      setAttachedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [showFormModal]);

  // SLA Live Countdown State & Helpers
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const [submitCountdown, setSubmitCountdown] = useState('');
  useEffect(() => {
    if (!deadline) {
      setSubmitCountdown('');
      return;
    }
    const update = () => {
      const diff = new Date(deadline) - new Date();
      if (diff <= 0) {
        return 'Deadline has already passed!';
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      
      if (h >= 24) {
        return `${Math.floor(h / 24)}d ${h % 24}h remaining`;
      }
      return `${h}h ${m}m ${s}s remaining`;
    };
    setSubmitCountdown(update());
    const interval = setInterval(() => setSubmitCountdown(update()), 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  const formatSlaCountdown = (t) => {
    const isDone = ['resolved', 'closed'].includes(t.status);
    if (isDone) return '✓ Completed';
    if (!t.sla_deadline) return 'N/A';
    
    const diff = new Date(t.sla_deadline) - now;
    if (diff <= 0) return '⚠ Breached';
    
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    
    if (h >= 24) {
      return `${Math.floor(h / 24)}d ${h % 24}h remaining`;
    }
    return `${h}h ${m}m ${s}s remaining`;
  };

  const getSlaPercent = (t) => {
    const isDone = ['resolved', 'closed'].includes(t.status);
    if (isDone) return 100;
    if (!t.sla_deadline || !t.created_at) return 50;
    
    const total = new Date(t.sla_deadline) - new Date(t.created_at);
    if (total <= 0) return 0;
    
    const remaining = new Date(t.sla_deadline) - now;
    return Math.min(100, Math.max(0, (remaining / total) * 100));
  };

  const getSlaColor = (t) => {
    const isDone = ['resolved', 'closed'].includes(t.status);
    if (isDone) return '#10b981';
    if (!t.sla_deadline) return '#64748b';
    
    const diff = new Date(t.sla_deadline) - now;
    if (diff <= 0) return '#e11d48';
    
    const percent = getSlaPercent(t);
    if (percent > 50) return '#10b981';
    if (percent > 20) return '#f59e0b';
    return '#e11d48';
  };

  // Dynamic Category lists depending on department selection
  const categoryMap = {
    it: [
      { id: 'User Issue', label: 'User Support Issue' },
      { id: 'Hardware Issue', label: 'Hardware Issue' },
      { id: 'Software Issue', label: 'Software Issue' },
      { id: 'Network Issue', label: 'Network Issue' }
    ],
    hr: [
      { id: 'Attendance Matters', label: 'Attendance & Leave Queries' },
      { id: 'Payroll & Benefits', label: 'Payroll & Compensation Benefits' },
      { id: 'Administrative Services', label: 'Administrative & General HR Services' },
      { id: 'Documentation & Visa', label: 'Documentation, Visas & Formal Letters' }
    ],
    general: [
      { id: 'Booking & Schedule', label: 'Facilities Booking & Scheduling' },
      { id: 'Main Meeting Room', label: 'Main Meeting Room Support' },
      { id: 'Executive Board Room', label: 'Executive Board Room Support' },
      { id: 'Main Reception', label: 'Reception & Front Desk Ops' },
      { id: 'Security & Safety', label: 'Security & Workplace Safety' },
      { id: 'Catering Services', label: 'Lunchroom & Catering Services' }
    ]
  };

  // Directory Data
  const supportData = {
    hr: {
      title: 'Human Resources',
      label: 'People & Culture',
      icon: User,
      description: 'Attendance, Payroll, & Benefits',
      color: 'from-brand-red to-[#A00D25]',
      accent: 'text-brand-red',
      categories: [
        { 
          id: 'attendance', 
          label: 'Attendance Matters', 
          contacts: [{ name: 'Samadhi Muthukuda', ext: '2538', email: 'samadhi@georgesteuart.lk', initial: 'SM' }]
        },
        { 
          id: 'payroll', 
          label: 'Payroll & Benefits', 
          contacts: [{ name: 'Erandi Liyanadaura', ext: '2410', email: 'erandi@georgesteuart.lk', initial: 'EL' }]
        },
        { 
          id: 'admin', 
          label: 'Administrative Services', 
          contacts: [{ name: 'Supun Jayathilaka', ext: '2312', email: 'supun@georgesteuart.lk', initial: 'SJ' }]
        },
        { 
          id: 'docs', 
          label: 'Documentation & Visa', 
          contacts: [
            { name: 'Isuru Rukmal', ext: '2405', email: 'isuru@georgesteuart.lk', initial: 'IR' },
            { name: 'Sachin Senanayake', ext: '2402', email: 'sachin@georgesteuart.lk', initial: 'SS' },
            { name: 'Shennara Kulathunga', ext: '2409', email: 'shennara@georgesteuart.lk', initial: 'SK' }
          ]
        }
      ]
    },
    it: {
      title: 'IT & Digital',
      label: 'Tech Support',
      icon: Laptop,
      description: 'Hardware, Software & Network',
      color: 'from-blue-600 to-indigo-800',
      accent: 'text-blue-600',
      categories: [
        {
          id: 'user_issues',
          label: 'User Support',
          contacts: [
            { name: 'Dinuka Sampath', ext: '2434', email: 'dinuka@gsoptimize.lk', initial: 'DS' },
            { name: 'Sasindhu Maliyadda', ext: '2433', email: 'sasindhu@gsoptimize.lk', initial: 'SM' }
          ]
        },
        { 
          id: 'sys_admin', 
          label: 'Systems Admin', 
          contacts: [{ name: 'Divan Wanniarachchi', ext: '2432', email: 'divan@gsoptimize.lk', initial: 'DW' }] 
        },
        { 
          id: 'group_it', 
          label: 'Enterprise Infrastructure', 
          contacts: [{ name: 'Chanika Dassanayake', ext: '2431', email: 'chanika@gsoptimize.lk', initial: 'CD' }] 
        }
      ]
    },
    meeting: { 
      title: 'Facility Management', 
      label: 'Conferences',
      icon: MessageSquare,
      description: 'Board rooms & Media centers',
      color: 'from-emerald-500 to-teal-700',
      accent: 'text-emerald-500',
      categories: [
        { 
          id: 'availability', 
          label: 'Booking & Schedule', 
          contacts: [{ name: 'Wazeefa Cassim', ext: '2202', email: 'wazeefa@georgesteuart.lk', initial: 'WC' }] 
        },
        { id: 'meeting_room', label: 'Main Meeting Room', contacts: [{ name: 'Coordinator', ext: '2240', email: '-', initial: 'MR' }] },
        { id: 'board_room', label: 'Executive Board Room', contacts: [{ name: 'Secretariat', ext: '2250', email: '-', initial: 'BR' }] }
      ] 
    },
    frontdesk: { 
      title: 'Group Services', 
      label: 'Reception & Ops',
      icon: HelpCircle,
      description: 'Frontdesk, Security & Cafeteria',
      color: 'from-amber-500 to-orange-700',
      accent: 'text-amber-500',
      categories: [
        { id: 'reception', label: 'Main Reception', contacts: [{ name: 'Maheshi Perera', ext: '2000', email: 'maheshi@georgesteuart.lk', initial: 'MP' }] },
        { id: 'security', label: 'Security & Safety', contacts: [{ name: 'Guard Room', ext: '2001 / 2000', email: '-', initial: 'S' }] },
        { id: 'lunchroom', label: 'Catering Services', contacts: [{ name: 'Manager', ext: '2499', email: '-', initial: 'L' }] }
      ] 
    }
  };

  const currentMatter = supportData[selectedMatter];
  const currentCategory = currentMatter?.categories?.find(c => c.id === selectedCategory);

  const isStaffRole = user?.role === 'it_staff' || user?.role === 'hr_staff';

  // Fetch assigned tickets for staff (it_staff / hr_staff)
  const fetchAssignedTickets = async () => {
    if (!isStaffRole) return;
    setLoadingAssigned(true);
    try {
      const res = await axios.get(`${backendUrl}/api/tickets`, {
        params: { userId: user?.id, role: user?.role, department: user?.department }
      });
      setAssignedTickets(res.data);
    } catch (err) {
      console.error('Error fetching assigned tickets:', err);
    } finally {
      setLoadingAssigned(false);
    }
  };

  // Fetch detail of an assigned ticket (for staff)
  const fetchAssignedDetail = async (ticketId) => {
    try {
      const res = await axios.get(`${backendUrl}/api/tickets/${ticketId}/details`);
      setAssignedDetail(res.data.ticket);
      setAssignedComments(res.data.comments || []);
      setAssignedAttachments(res.data.attachments || []);
      setAssignedLogs(res.data.logs || []);
      setAssignedDeadlineHistory(res.data.deadlineHistory || []);
    } catch (err) {
      console.error('Error fetching assigned ticket detail:', err);
    }
  };

  // Update ticket status (for staff)
  const handleStaffUpdateStatus = async (ticketId, newStatus) => {
    setUpdatingStatus(prev => ({ ...prev, [ticketId]: true }));
    try {
      await axios.put(`${backendUrl}/api/tickets/${ticketId}/status`, {
        status: newStatus,
        current_user_id: user?.id
      });
      fetchAssignedTickets();
      if (expandedAssignedId === ticketId) fetchAssignedDetail(ticketId);
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [ticketId]: false }));
    }
  };

  // Add comment on an assigned ticket (for staff)
  const handleAssignedComment = async (e, ticketId) => {
    e.preventDefault();
    if (!newAssignedComment.trim() || submittingAssignedComment) return;
    setSubmittingAssignedComment(true);
    try {
      await axios.post(`${backendUrl}/api/tickets/${ticketId}/comments`, {
        userId: user?.id,
        comment: newAssignedComment
      });
      setNewAssignedComment('');
      fetchAssignedDetail(ticketId);
    } catch (err) {
      console.error('Error adding comment:', err);
    } finally {
      setSubmittingAssignedComment(false);
    }
  };

  // Fetch Tickets based on viewMode and filters
  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      if (viewMode === 'admin') {
        const params = {
          userId: user?.id,
          role: user?.role,
          department: user?.department
        };
        if (adminDeptFilter !== 'all') params.department = adminDeptFilter;
        if (adminStatusFilter !== 'all') params.status = adminStatusFilter;
        const res = await axios.get(`${backendUrl}/api/tickets`, { params });
        setTickets(res.data);
      } else {
        const userId = user?.id;
        const res = await axios.get(`${backendUrl}/api/tickets/my-tickets`, {
          params: { userId }
        });
        setTickets(res.data);
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  // Fetch detailed info of a ticket when expanded
  const fetchTicketDetails = async (ticketId) => {
    setLoadingDetail(true);
    try {
      const res = await axios.get(`${backendUrl}/api/tickets/${ticketId}/details`);
      setTicketDetail(res.data.ticket);
      setComments(res.data.comments || []);
      setAttachments(res.data.attachments || []);
      setLogs(res.data.logs || []);
      setDeadlineHistory(res.data.deadlineHistory || []);
    } catch (err) {
      console.error('Error fetching ticket details:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [user, viewMode, adminDeptFilter, adminStatusFilter]);

  useEffect(() => {
    if (isStaffRole) fetchAssignedTickets();
  }, [user]);

  useEffect(() => {
    if (expandedAssignedId) {
      fetchAssignedDetail(expandedAssignedId);
    } else {
      setAssignedDetail(null);
      setAssignedComments([]);
      setAssignedAttachments([]);
      setAssignedLogs([]);
      setAssignedDeadlineHistory([]);
    }
  }, [expandedAssignedId]);

  // Load ticket details when expandedTicketId changes
  useEffect(() => {
    if (expandedTicketId) {
      fetchTicketDetails(expandedTicketId);
    } else {
      setTicketDetail(null);
      setComments([]);
      setAttachments([]);
      setLogs([]);
      setDeadlineHistory([]);
    }
  }, [expandedTicketId]);

  // Adjust categories automatically when department selection changes in form
  const handleDepartmentChange = (dept) => {
    setDepartment(dept);
    setCategory('');
    setCustomCategory('');
  };

  // Submit new ticket
  const handleSubmitTicket = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim() || !category) return;
    if (category === 'Other' && !customCategory.trim()) return;

    setSubmitLoading(true);
    try {
      const payload = {
        userId: user?.id,
        subject,
        department,
        category: category === 'Other' ? customCategory : category,
        priority,
        description,
        deadline: deadline || null
      };
      const res = await axios.post(`${backendUrl}/api/tickets`, payload);
      const newTicketId = res.data.id;

      // Handle file attachment if uploaded
      if (attachedFile) {
        const formData = new FormData();
        formData.append('file', attachedFile);

        const uploadRes = await axios.post(`${backendUrl}/api/uploads/ticket-file`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        await axios.post(`${backendUrl}/api/tickets/${newTicketId}/attachments`, {
          fileName: uploadRes.data.fileName,
          fileUrl: uploadRes.data.fileUrl,
          uploadedBy: user?.id
        });
      }

      setFormSuccess(true);
      setTimeout(() => {
        setSubject('');
        setDescription('');
        setDepartment('it');
        setCategory('');
        setPriority('medium');
        setDeadline('');
        setCustomCategory('');
        setAttachedFile(null);
        setShowFormModal(false);
        setFormSuccess(false);
        fetchTickets();
      }, 1500);
    } catch (err) {
      console.error('Error submitting ticket:', err);
      alert('Could not submit ticket: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSaveDeadline = async (ticketId, currentStatus) => {
    try {
      await axios.put(`${backendUrl}/api/tickets/${ticketId}/status`, {
        status: currentStatus,
        sla_deadline: tempDeadline || null,
        reason: extensionReason,
        current_user_id: user?.id
      });
      setShowExtensionModal(false);
      setExtensionReason('');
      setEditingTicket(null);
      fetchTickets();
      if (expandedTicketId === ticketId) fetchTicketDetails(ticketId);
      if (expandedAssignedId === ticketId) fetchAssignedDetail(ticketId);
    } catch (err) {
      console.error('Error updating deadline:', err);
      alert(err.response?.data?.message || 'Failed to update deadline');
    }
  };

  // Submit satisfaction rating and feedback
  const handleRateTicket = async (e) => {
    e.preventDefault();
    setSubmittingRating(true);
    try {
      await axios.put(`${backendUrl}/api/tickets/${ratingTicketId}/rate`, {
        rating: satisfactionRating,
        feedback: ratingFeedback,
        userId: user?.id
      });
      setShowRatingModal(false);
      setRatingFeedback('');
      setSatisfactionRating(5);
      fetchTickets();
      if (expandedTicketId === ratingTicketId) {
        fetchTicketDetails(ratingTicketId);
      }
    } catch (err) {
      console.error('Error rating ticket:', err);
      alert('Failed to submit rating: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmittingRating(false);
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

  // Upload attachment inside expanded ticket details view
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
      console.error('Detail file attachment error:', err);
      alert('Failed to attach file');
    }
  };

  // Assign ticket to team member (Admin Action)
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
      if (expandedTicketId === ticketId) fetchTicketDetails(ticketId);
    } catch (err) {
      console.error('Error assigning ticket:', err);
    }
  };

  // Claim ticket (assign to self)
  const handleAssignToSelf = async (ticketId) => {
    try {
      await axios.put(`${backendUrl}/api/tickets/${ticketId}/status`, {
        status: 'assigned',
        assigned_to_id: user?.id,
        current_user_id: user?.id
      });
      fetchTickets();
      if (expandedTicketId === ticketId) fetchTicketDetails(ticketId);
    } catch (err) {
      console.error('Error claiming ticket:', err);
    }
  };

  // Resolve Ticket (Admin Action)
  const handleResolveTicket = async (ticketId, notes = '') => {
    try {
      await axios.put(`${backendUrl}/api/tickets/${ticketId}/status`, {
        status: 'resolved',
        resolution_notes: notes,
        current_user_id: user?.id
      });
      fetchTickets();
      if (expandedTicketId === ticketId) fetchTicketDetails(ticketId);
    } catch (err) {
      console.error('Error resolving ticket:', err);
    }
  };

  // Delete ticket (Admin/User Action)
  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm('Are you absolutely sure you want to delete this ticket? This action is permanent.')) return;
    try {
      await axios.delete(`${backendUrl}/api/tickets/${ticketId}`);
      setExpandedTicketId(null);
      fetchTickets();
    } catch (err) {
      console.error('Error deleting ticket:', err);
    }
  };

  // Export spreadsheet / PDF trigger
  const handleExport = (format) => {
    const params = new URLSearchParams({
      userId: user?.id,
      role: user?.role,
      department: user?.department
    });
    if (adminDeptFilter !== 'all') params.append('department', adminDeptFilter);
    if (adminStatusFilter !== 'all') params.append('status', adminStatusFilter);

    window.open(`${backendUrl}/api/tickets/export/${format}?${params.toString()}`);
  };

  // Get department staff filter helper
  const getDepartmentStaff = (dept) => {
    const d = dept?.toLowerCase();
    return usersList.filter(u =>
      u.role?.toLowerCase() === `${d}_staff` ||
      u.role?.toLowerCase() === `${d}_admin` ||
      u.department?.toLowerCase() === d
    );
  };

  // Statistics counters
  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    pending: tickets.filter(t => t.status === 'pending').length,
    inProgress: tickets.filter(t => t.status === 'in_progress').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    closed: tickets.filter(t => t.status === 'closed').length
  };

  // Priority badge formatter
  const getPriorityBadge = (lvl) => {
    switch (lvl) {
      case 'low': return 'bg-slate-100 border-slate-200 text-slate-600';
      case 'medium': return 'bg-amber-100 border-amber-200 text-amber-700';
      case 'high': return 'bg-orange-100 border-orange-200 text-orange-700';
      case 'urgent': return 'bg-rose-100 border-rose-200 text-rose-700';
      default: return 'bg-slate-100 border-slate-200 text-slate-600';
    }
  };

  // Status badge formatter
  const getStatusBadge = (st) => {
    switch (st) {
      case 'open': return 'bg-sky-500/10 text-sky-600 border-sky-500/20';
      case 'assigned': return 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20';
      case 'in_progress': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'pending': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'resolved': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'closed': return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
      default: return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  // Filtered tickets
  const filteredTickets = tickets.filter(t => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSubject = t.subject?.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchNo = t.ticket_no?.toLowerCase().includes(q);
      const matchName = t.full_name?.toLowerCase().includes(q);
      if (!matchSubject && !matchDesc && !matchNo && !matchName) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24">
      {/* Immersive Header */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-10 rounded-[38px] overflow-hidden bg-white border border-slate-100 shadow-xl flex flex-col md:flex-row min-h-[360px]"
      >
        <div className="flex-1 p-8 md:p-14 flex flex-col justify-center relative z-10">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex items-center gap-1.5 bg-brand-red/5 px-3 py-1.5 rounded-full border border-brand-red/10">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-red" />
              <span className="text-[9px] font-black text-brand-red uppercase tracking-wider">GS Support Center</span>
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Helpdesk Help Hub</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-slate-800 mb-5 leading-tight tracking-tight">
            Centralized Request <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-red to-brand-red-dark">Help Desk Portal</span>
          </h1>

          <p className="text-slate-500 font-medium max-w-lg leading-relaxed mb-6 text-base">
            Lodge IT support tickets, HR questions, or general office requests instantly. Monitor audit steps and communicate directly in real time.
          </p>

          <div className="flex items-center gap-3 flex-wrap">
            <button 
              onClick={() => { setActiveTab('tickets'); setShowFormModal(true); }}
              className="bg-brand-red text-white px-7 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-wider hover:bg-brand-red-dark transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-brand-red/20"
            >
              <Plus className="w-4 h-4" /> Create Request Ticket
            </button>
            <button 
              onClick={() => setActiveTab(activeTab === 'tickets' ? 'directory' : 'tickets')}
              className="bg-slate-50 hover:bg-slate-100 text-slate-600 px-7 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-wider border border-slate-200 transition-all active:scale-95"
            >
              {activeTab === 'tickets' ? 'View Help Directory' : 'Go to Ticket Queue'}
            </button>
          </div>
        </div>
        
        {/* Banner Graphics */}
        <div className="w-full md:w-[35%] h-full relative overflow-hidden min-h-[250px] md:min-h-auto flex-shrink-0">
          <img 
            src="/helpdesk_banner_3d.png" 
            alt="Corporate Support Desk" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-white via-white/50 to-transparent"></div>
        </div>
      </motion.section>

      {/* Tabs Menu Switcher */}
      <div className="flex justify-center mb-8 px-4">
        <div className="bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-slate-100 shadow-sm inline-flex w-full max-w-xl gap-1">
          <button 
            onClick={() => setActiveTab('tickets')}
            className={`flex-1 text-center py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === 'tickets' 
                ? 'bg-brand-red text-white shadow-md' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" /> My Tickets
          </button>
          {isStaffRole && (
            <button 
              onClick={() => { setActiveTab('assigned'); fetchAssignedTickets(); }}
              className={`flex-1 text-center py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 relative ${
                activeTab === 'assigned' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" /> Assigned Tasks
              {assignedTickets.length > 0 && (
                <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[8px] font-black flex items-center justify-center ${
                  activeTab === 'assigned' ? 'bg-white text-blue-600' : 'bg-brand-red text-white'
                }`}>
                  {assignedTickets.length}
                </span>
              )}
            </button>
          )}
          <button 
            onClick={() => setActiveTab('directory')}
            className={`flex-1 text-center py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === 'directory' 
                ? 'bg-brand-red text-white shadow-md' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Headphones className="w-3.5 h-3.5" /> Contacts Directory
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <AnimatePresence mode="wait">
          {activeTab === 'assigned' && isStaffRole ? (
            <motion.div
              key="assigned-tasks"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Staff Header */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px'}} />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <Briefcase className="w-5 h-5 text-blue-200" />
                    <span className="text-[10px] font-black text-blue-200 uppercase tracking-widest">My Work Queue</span>
                  </div>
                  <h2 className="text-2xl font-black leading-tight mb-2">Assigned Tickets</h2>
                  <p className="text-blue-200 text-sm font-semibold">
                    {assignedTickets.length} ticket{assignedTickets.length !== 1 ? 's' : ''} assigned to you for resolution
                  </p>
                </div>
                <div className="absolute right-8 top-1/2 -translate-y-1/2 flex gap-4 opacity-20">
                  <div className="w-24 h-24 rounded-full bg-white" />
                  <div className="w-16 h-16 rounded-full bg-white mt-8" />
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Assigned', value: assignedTickets.length, color: 'text-slate-800', bg: 'bg-white' },
                  { label: 'Assigned (Pending)', value: assignedTickets.filter(t => t.status === 'assigned').length, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                  { label: 'In Progress', value: assignedTickets.filter(t => t.status === 'in_progress').length, color: 'text-blue-600', bg: 'bg-blue-50' },
                  { label: 'Resolved', value: assignedTickets.filter(t => t.status === 'resolved').length, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                ].map((st, i) => (
                  <div key={i} className={`${st.bg} p-5 rounded-2xl border border-slate-100 shadow-sm`}>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{st.label}</p>
                    <h3 className={`text-2xl font-black ${st.color} mt-1`}>{st.value}</h3>
                  </div>
                ))}
              </div>

              {/* Ticket List */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-800">Your Assigned Ticket Queue</h3>
                    <p className="text-slate-400 text-xs mt-0.5">Update progress, add comments, and resolve tickets assigned to you</p>
                  </div>
                  <button onClick={fetchAssignedTickets} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5">
                    <Loader2 className={`w-3.5 h-3.5 ${loadingAssigned ? 'animate-spin' : ''}`} /> Refresh
                  </button>
                </div>

                {loadingAssigned ? (
                  <div className="flex justify-center items-center py-16 gap-2">
                    <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
                    <span className="text-xs font-bold text-slate-400">Loading your tasks...</span>
                  </div>
                ) : assignedTickets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center px-4">
                    <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-400 mb-4">
                      <Briefcase className="w-7 h-7" />
                    </div>
                    <h4 className="text-slate-700 font-black text-base">No tickets assigned yet</h4>
                    <p className="text-slate-400 text-xs mt-1 max-w-xs">When an admin assigns you a ticket, it will appear here for you to work on.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {assignedTickets.map(t => {
                      const isExpanded = expandedAssignedId === t.id;
                      const assignedDetailObj = isExpanded ? (assignedDetail || t) : t;
                      const hasAssignedExtension = !!(assignedDetailObj.extended_by_name || (assignedDetailObj.employee_deadline && assignedDetailObj.sla_deadline && new Date(assignedDetailObj.employee_deadline).getTime() !== new Date(assignedDetailObj.sla_deadline).getTime()));
                      const assignedOriginalDeadlineVal = assignedDetailObj.employee_deadline 
                        ? new Date(assignedDetailObj.employee_deadline).toLocaleString() 
                        : (isExpanded && assignedDeadlineHistory.length > 0 && assignedDeadlineHistory[0].old_deadline 
                            ? new Date(assignedDeadlineHistory[0].old_deadline).toLocaleString() 
                            : 'N/A');
                      const statusColor = t.status === 'resolved' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' :
                        t.status === 'in_progress' ? 'text-blue-600 bg-blue-50 border-blue-200' :
                        'text-indigo-600 bg-indigo-50 border-indigo-200';
                      return (
                        <div key={t.id} className={`transition-colors ${isExpanded ? 'bg-slate-50/50' : 'hover:bg-slate-50/30'}`}>
                          {/* Row */}
                          <div
                            className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                            onClick={() => setExpandedAssignedId(isExpanded ? null : t.id)}
                          >
                            <div className="flex items-start gap-4 min-w-0 flex-1">
                              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                                t.department === 'it' ? 'bg-blue-50 border-blue-100 text-blue-600' : 'bg-red-50 border-red-100 text-brand-red'
                              }`}>
                                {t.department === 'it' ? <Laptop className="w-5 h-5" /> : <User className="w-5 h-5" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="text-[10px] font-black text-slate-400 tracking-wider">#{t.ticket_no}</span>
                                  <span className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-wider ${getPriorityBadge(t.priority)}`}>{t.priority}</span>
                                  <span className="text-[9px] font-bold text-slate-400">{t.department.toUpperCase()} · {t.category}</span>
                                </div>
                                <h4 className="text-sm font-black text-slate-800 truncate">{t.subject}</h4>
                                <p className="text-[10px] font-semibold text-slate-500 mt-0.5">From: {t.full_name} · {new Date(t.created_at).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              {/* Quick status update buttons */}
                              {t.status !== 'resolved' && (
                                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                  {t.status === 'assigned' && (
                                    <button
                                      onClick={() => handleStaffUpdateStatus(t.id, 'in_progress')}
                                      disabled={updatingStatus[t.id]}
                                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1 shadow-sm disabled:opacity-50"
                                    >
                                      {updatingStatus[t.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Clock className="w-3 h-3" />} Start
                                    </button>
                                  )}
                                  {t.status === 'in_progress' && (
                                    <button
                                      onClick={() => handleStaffUpdateStatus(t.id, 'resolved')}
                                      disabled={updatingStatus[t.id]}
                                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1 shadow-sm disabled:opacity-50"
                                    >
                                      {updatingStatus[t.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Resolve
                                    </button>
                                  )}
                                </div>
                              )}
                              <span className={`px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${getStatusBadge(t.status)}`}>{t.status?.replace('_', ' ')}</span>
                              <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                                <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                              </motion.div>
                            </div>
                          </div>

                          {/* Expanded Detail */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden border-t border-slate-100"
                              >
                                <div className="p-6 space-y-6">
                                  {/* Description + SLA */}
                                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <div className="lg:col-span-2 space-y-4">
                                      <div>
                                        <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Ticket Description</h5>
                                        <div className="bg-white border border-slate-100 p-5 rounded-2xl">
                                          <p className="text-xs font-semibold text-slate-700 whitespace-pre-wrap leading-relaxed">{t.description}</p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-3 bg-white border border-slate-100 p-4 rounded-2xl">
                                        <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-150 flex items-center justify-center">
                                          <Clock className="w-4 h-4 text-slate-400" />
                                        </div>
                                        <div>
                                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">SLA Deadline</p>
                                          <p className="text-xs font-black text-slate-700">
                                            {assignedDetailObj.sla_deadline ? new Date(assignedDetailObj.sla_deadline).toLocaleString() : 'N/A'}
                                            {hasAssignedExtension && (
                                              <span className="text-[8px] bg-amber-50 text-amber-700 font-black px-1.5 py-0.5 rounded border border-amber-200 ml-2 animate-pulse">
                                                Extended
                                              </span>
                                            )}
                                            {(user?.role === 'super_admin' || user?.role === 'it_admin' || user?.role === 'hr_admin' || user?.id === t.assigned_to_id) && (
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setEditingTicket(t);
                                                  setTempDeadline(t.sla_deadline ? new Date(t.sla_deadline).toISOString().slice(0, 16) : '');
                                                  setExtensionReason('');
                                                  setShowExtensionModal(true);
                                                }}
                                                className="text-blue-600 hover:underline text-[9px] font-black uppercase tracking-wider ml-2"
                                              >
                                                Edit
                                              </button>
                                            )}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Deadline Details Card */}
                                      {hasAssignedExtension && (
                                        <div className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-5 text-left w-full">
                                          <div className="flex items-center gap-1.5 mb-3">
                                            <Clock className="w-4 h-4 text-amber-600" />
                                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">Deadline Details</span>
                                          </div>
                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div>
                                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Requested Deadline</span>
                                              <span className="text-[11px] font-bold text-slate-700">{assignedOriginalDeadlineVal}</span>
                                            </div>
                                            <div>
                                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Current Deadline</span>
                                              <span className="text-[11px] font-bold text-slate-700">{assignedDetailObj.sla_deadline ? new Date(assignedDetailObj.sla_deadline).toLocaleString() : 'N/A'}</span>
                                            </div>
                                            {assignedDetailObj.extension_reason && (
                                              <div className="sm:col-span-2 border-t border-slate-100 pt-3">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Extension Reason</span>
                                                <span className="text-xs font-semibold text-slate-655 leading-relaxed block">{assignedDetailObj.extension_reason}</span>
                                              </div>
                                            )}
                                            {assignedDetailObj.extended_by_name && (
                                              <div className="border-t border-slate-100 pt-3">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Extended By</span>
                                                <span className="text-[11px] font-bold text-slate-700">{assignedDetailObj.extended_by_name} ({assignedDetailObj.extended_by_role?.replace('_', ' ')})</span>
                                              </div>
                                            )}
                                            {assignedDetailObj.extended_on && (
                                              <div className="border-t border-slate-100 pt-3">
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Extended On</span>
                                                <span className="text-[11px] font-bold text-slate-700">{new Date(assignedDetailObj.extended_on).toLocaleString()}</span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    {/* Status controls panel */}
                                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                                      <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Quick Actions</h5>
                                      <div className="flex flex-col gap-2">
                                        {t.status === 'assigned' && (
                                          <button
                                            onClick={() => handleStaffUpdateStatus(t.id, 'in_progress')}
                                            disabled={updatingStatus[t.id]}
                                            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                                          >
                                            <Clock className="w-3.5 h-3.5" /> Mark In Progress
                                          </button>
                                        )}
                                        {(t.status === 'assigned' || t.status === 'in_progress') && (
                                          <button
                                            onClick={() => handleStaffUpdateStatus(t.id, 'resolved')}
                                            disabled={updatingStatus[t.id]}
                                            className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                                          >
                                            <Check className="w-3.5 h-3.5" /> Mark Resolved
                                          </button>
                                        )}
                                        {t.status === 'resolved' && (
                                          <div className="w-full px-4 py-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-2">
                                            <CheckCircle2 className="w-3.5 h-3.5" /> Ticket Resolved
                                          </div>
                                        )}
                                      </div>
                                      <div className="pt-3 border-t border-slate-200 space-y-1.5 text-[10px]">
                                        <div className="flex justify-between"><span className="text-slate-400 font-bold">Submitted by:</span><span className="font-black text-slate-700 truncate max-w-[120px]">{t.full_name}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-400 font-bold">Priority:</span><span className="font-black text-slate-700 capitalize">{t.priority}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-400 font-bold">Category:</span><span className="font-black text-slate-700 truncate max-w-[100px]">{t.category}</span></div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Comments + Logs */}
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Comments */}
                                    <div className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-col min-h-[280px] max-h-[380px]">
                                      <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Comments ({assignedComments.length})</h5>
                                      <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar mb-3">
                                        {assignedComments.length > 0 ? assignedComments.map(c => (
                                          <div key={c.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-1">
                                            <div className="flex justify-between items-center">
                                              <span className="text-[9px] font-black text-slate-700">{c.full_name}</span>
                                              <span className="text-[8px] font-bold text-slate-400">{new Date(c.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                            </div>
                                            <p className="text-xs font-semibold text-slate-600">{c.comment}</p>
                                          </div>
                                        )) : <p className="text-xs text-slate-400 italic text-center py-8">No comments yet</p>}
                                      </div>
                                      <form onSubmit={e => handleAssignedComment(e, t.id)} className="flex gap-2">
                                        <input
                                          type="text"
                                          placeholder="Add an update or note..."
                                          value={newAssignedComment}
                                          onChange={e => setNewAssignedComment(e.target.value)}
                                          className="flex-1 border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-blue-400/50 shadow-inner"
                                        />
                                        <button
                                          type="submit"
                                          disabled={submittingAssignedComment || !newAssignedComment.trim()}
                                          className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center active:scale-95 disabled:opacity-50 transition-all shrink-0"
                                        >
                                          <Send className="w-4 h-4" />
                                        </button>
                                      </form>
                                    </div>

                                    {/* Audit Log */}
                                    <div className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-col min-h-[280px] max-h-[380px]">
                                      <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Activity Log</h5>
                                      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 custom-scrollbar">
                                        {assignedLogs.length > 0 ? assignedLogs.map(log => (
                                          <div key={log.id} className="flex gap-3 items-start relative pl-4 before:content-[''] before:absolute before:left-[4px] before:top-2 before:bottom-[-20px] before:w-[1px] before:bg-slate-200 last:before:hidden">
                                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1 border-2 border-white ring-2 ring-blue-50 shrink-0" />
                                            <div className="min-w-0">
                                              <p className="text-xs font-black text-slate-800 leading-tight capitalize">{log.action}</p>
                                              <p className="text-[10px] font-bold text-slate-500 mt-0.5">{log.details}</p>
                                              <p className="text-[8px] font-extrabold text-slate-400 mt-1 uppercase tracking-widest">{log.full_name} · {new Date(log.created_at).toLocaleString()}</p>
                                            </div>
                                          </div>
                                        )) : <p className="text-xs text-slate-400 italic text-center py-8">No activity logged</p>}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Deadline History Section */}
                                  {assignedDeadlineHistory.length > 0 && (
                                    <div className="bg-white p-5 rounded-2xl border border-slate-100 mt-6 text-left">
                                      <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Deadline History</h5>
                                      <div className="relative border-l border-slate-100 pl-6 ml-3 space-y-6">
                                        {assignedDeadlineHistory.map((hist, idx) => (
                                          <div key={hist.id} className="relative">
                                            <div className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-white ring-2 ring-amber-50" />
                                            <div>
                                              <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                                                Extension #{idx + 1}
                                              </span>
                                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                                                <div>
                                                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Old Deadline</p>
                                                  <p className="text-xs font-bold text-slate-700">{hist.old_deadline ? new Date(hist.old_deadline).toLocaleString() : 'N/A'}</p>
                                                </div>
                                                <div>
                                                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">New Deadline</p>
                                                  <p className="text-xs font-bold text-slate-700">{hist.new_deadline ? new Date(hist.new_deadline).toLocaleString() : 'N/A'}</p>
                                                </div>
                                                <div>
                                                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Updated By</p>
                                                  <p className="text-xs font-bold text-slate-700">{hist.updated_by_name} ({hist.updated_by_role?.replace('_', ' ')})</p>
                                                </div>
                                                <div>
                                                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Updated At</p>
                                                  <p className="text-xs font-bold text-slate-700">{new Date(hist.created_at).toLocaleString()}</p>
                                                </div>
                                              </div>
                                              {hist.reason && (
                                                <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl mt-2 max-w-xl text-left">
                                                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Reason for Extension</p>
                                                  <p className="text-xs font-semibold text-slate-655 leading-relaxed">{hist.reason}</p>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          ) : activeTab === 'tickets' ? (
            <motion.div 
              key="tickets-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Counters cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: 'Total Logs', value: stats.total, color: 'text-slate-800' },
                  { label: 'Open', value: stats.open, color: 'text-sky-600' },
                  { label: 'Pending / Claimed', value: stats.pending + stats.assigned + stats.inProgress, color: 'text-blue-600' },
                  { label: 'Resolved', value: stats.resolved, color: 'text-emerald-600' },
                  { label: 'Closed', value: stats.closed, color: 'text-slate-500' }
                ].map((st, i) => (
                  <div key={i} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{st.label}</p>
                    <h3 className={`text-2xl font-black ${st.color} mt-1`}>{st.value}</h3>
                  </div>
                ))}
              </div>

              {/* Tickets Table Box */}
              <div className="bg-white rounded-3xl p-6 md:p-10 border border-slate-100 shadow-sm min-h-[400px]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 mb-8">
                  <div>
                    <h2 className="text-xl font-black text-slate-850">
                      {viewMode === 'admin' ? 'Support Desk Dashboard Queue' : 'My Support Tickets'}
                    </h2>
                    <p className="text-slate-400 text-xs font-bold mt-0.5">
                      {viewMode === 'admin' 
                        ? 'Admin Desk: View and assign company support logs' 
                        : 'Review your logged help desk tickets and responses'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Admin Switcher */}
                    {location.pathname.includes('/admin') && (user?.role === 'super_admin' || user?.role === 'sub_admin' || user?.role === 'it_admin' || user?.role === 'hr_admin') && (
                      <div className="bg-slate-100 p-1 rounded-xl flex gap-0.5 border border-slate-200">
                        <button 
                          onClick={() => { setViewMode('personal'); setExpandedTicketId(null); }}
                          className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                            viewMode === 'personal' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Personal
                        </button>
                        <button 
                          onClick={() => { setViewMode('admin'); setExpandedTicketId(null); }}
                          className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                            viewMode === 'admin' ? 'bg-brand-red text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          Admin Desk
                        </button>
                      </div>
                    )}

                    {viewMode === 'admin' && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleExport('excel')}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                        >
                          Excel Export
                        </button>
                        <button 
                          onClick={() => handleExport('pdf')}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all"
                        >
                          PDF Export
                        </button>
                      </div>
                    )}

                    <button 
                      onClick={() => setShowFormModal(true)}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" /> Submit Ticket
                    </button>
                  </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="relative md:col-span-2">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                      <Search className="h-4 w-4 text-slate-400" />
                    </span>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search tickets by subject, description, ticket number..."
                      className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-brand-red/30 focus:bg-white transition-all shadow-sm"
                    />
                  </div>

                  {viewMode === 'admin' && (
                    <>
                      <select 
                        value={adminDeptFilter}
                        onChange={(e) => setAdminDeptFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-650 focus:outline-none focus:border-brand-red/30 cursor-pointer shadow-sm"
                      >
                        <option value="all">All Departments</option>
                        <option value="it">IT Support</option>
                        <option value="hr">HR Request</option>
                        <option value="general">General Operation</option>
                      </select>

                      <select 
                        value={adminStatusFilter}
                        onChange={(e) => setAdminStatusFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-650 focus:outline-none focus:border-brand-red/30 cursor-pointer shadow-sm"
                      >
                        <option value="all">All Statuses</option>
                        <option value="open">Open</option>
                        <option value="assigned">Assigned</option>
                        <option value="in_progress">In Progress</option>
                        <option value="pending">Pending</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </>
                  )}
                </div>

                {/* Queue Listing */}
                {loadingTickets ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-2">
                    <Loader2 className="w-9 h-9 animate-spin text-brand-red" />
                    <p className="text-xs font-bold">Retrieving support desk queue...</p>
                  </div>
                ) : filteredTickets.length > 0 ? (
                  <div className="space-y-4">
                    {filteredTickets.map((t) => {
                      const isExpanded = expandedTicketId === t.id;
                      const detailObj = isExpanded ? (ticketDetail || t) : t;
                      const hasExtension = !!(detailObj.extended_by_name || (detailObj.employee_deadline && detailObj.sla_deadline && new Date(detailObj.employee_deadline).getTime() !== new Date(detailObj.sla_deadline).getTime()));
                      const originalDeadlineVal = detailObj.employee_deadline 
                        ? new Date(detailObj.employee_deadline).toLocaleString() 
                        : (isExpanded && deadlineHistory.length > 0 && deadlineHistory[0].old_deadline 
                            ? new Date(deadlineHistory[0].old_deadline).toLocaleString() 
                            : 'N/A');
                      return (
                        <div 
                          key={t.id} 
                          className={`rounded-2xl border transition-all duration-300 ${
                            isExpanded ? 'bg-slate-50/50 border-brand-red/20 shadow-md' : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'
                          }`}
                        >
                          {/* Row Header */}
                          <div 
                            onClick={() => setExpandedTicketId(isExpanded ? null : t.id)}
                            className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer"
                          >
                            <div className="flex items-start gap-4 min-w-0 flex-1">
                              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                                t.department === 'it' ? 'bg-blue-50 border-blue-100 text-blue-600' : t.department === 'hr' ? 'bg-red-50 border-red-100 text-brand-red' : 'bg-emerald-50 border-emerald-100 text-emerald-600'
                              }`}>
                                {t.department === 'it' ? <Laptop className="w-5 h-5" /> : t.department === 'hr' ? <User className="w-5 h-5" /> : <HelpCircle className="w-5 h-5" />}
                              </div>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[10px] font-black text-slate-400 tracking-wider">#{t.ticket_no || `TKT-${t.id}`}</span>
                                  <span className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase tracking-wider ${getPriorityBadge(t.priority)}`}>
                                    {t.priority}
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-400 capitalize">
                                    {t.department.toUpperCase()} · {t.category}
                                  </span>
                                  {viewMode === 'admin' && (
                                    <span className="text-[9px] font-black text-brand-red bg-brand-red/5 px-2 py-0.5 rounded">
                                      By: {t.full_name || 'Staff'}
                                    </span>
                                  )}
                                </div>
                                <h4 className="text-sm font-black text-slate-800 tracking-tight mt-1 truncate">{t.subject}</h4>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0 justify-between md:justify-end">
                              <span className="text-[9px] font-bold text-slate-400 hidden sm:block">Logged: {new Date(t.created_at).toLocaleDateString()}</span>
                              <span className={`px-3 py-1.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${getStatusBadge(t.status)}`}>
                                {t.status?.replace('_', ' ')}
                              </span>
                              <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100">
                                <ChevronRight className="w-3.5 h-3.5 rotate-90" />
                              </motion.div>
                            </div>
                          </div>

                          {/* Expanded Content */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden border-t border-slate-100"
                              >
                                {loadingDetail ? (
                                  <div className="flex justify-center items-center py-10 gap-2">
                                    <Loader2 className="w-6 h-6 animate-spin text-brand-red" />
                                    <span className="text-xs font-bold text-slate-400">Loading details...</span>
                                  </div>
                                ) : ticketDetail ? (
                                  <div className="p-6 space-y-6">
                                    {/* Action Logs timeline & resolution comment */}
                                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-150 space-y-4">
                                      <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Process Timeline</h5>
                                      
                                      <div className="flex flex-col sm:flex-row justify-between gap-4 relative">
                                        <div className="hidden sm:block absolute top-[16px] left-[10%] right-[10%] h-0.5 bg-slate-200 z-0" />
                                        
                                        {[
                                          { step: 'open', num: 1, title: 'Open', desc: 'Ticket submitted' },
                                          { step: 'assigned', num: 2, title: 'Assigned', desc: t.assigned_to_id ? `Assigned to ${t.assignee_name || t.assigned_to}` : 'Awaiting assignment' },
                                          { step: 'in_progress', num: 3, title: 'In Progress', desc: 'Work has started' },
                                          { step: 'resolved', num: 4, title: 'Resolved', desc: t.resolution_notes ? `Notes: ${t.resolution_notes}` : 'Pending fix' },
                                          { step: 'closed', num: 5, title: 'Closed', desc: t.rating ? `Rating: ${t.rating}/5 stars` : 'Final closure' }
                                        ].map((stepObj) => {
                                          const isActive = 
                                            t.status === stepObj.step || 
                                            (stepObj.step === 'open' && t.status !== 'open') ||
                                            (stepObj.step === 'assigned' && ['in_progress', 'resolved', 'closed'].includes(t.status)) ||
                                            (stepObj.step === 'in_progress' && ['resolved', 'closed'].includes(t.status)) ||
                                            (stepObj.step === 'resolved' && t.status === 'closed');
                                            
                                          return (
                                            <div key={stepObj.step} className="flex sm:flex-col items-center gap-3 sm:gap-1.5 z-10 w-full sm:w-[18%]">
                                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] ${
                                                isActive ? 'bg-brand-red text-white shadow-md' : 'bg-slate-200 text-slate-400'
                                              }`}>{stepObj.num}</div>
                                              <div className="text-left sm:text-center">
                                                <p className="text-xs font-black text-slate-800">{stepObj.title}</p>
                                                <p className="text-[8px] font-bold text-slate-400 mt-0.5 leading-tight">{stepObj.desc}</p>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>

                                      {/* Rating banner if ticket is closed */}
                                      {t.status === 'closed' && t.rating && (
                                        <div className="flex items-start gap-3 bg-white p-4 rounded-xl border border-slate-100 shadow-sm mt-2">
                                          <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                                            <Star className="w-4.5 h-4.5 fill-white" />
                                          </div>
                                          <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Satisfaction Rating & Feedback</p>
                                            <div className="flex gap-0.5 mt-1">
                                              {[1, 2, 3, 4, 5].map((star) => (
                                                <Star key={star} className={`w-3.5 h-3.5 ${star <= t.rating ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}`} />
                                              ))}
                                            </div>
                                            {t.feedback && <p className="text-xs font-semibold text-slate-650 mt-1.5 italic">"{t.feedback}"</p>}
                                          </div>
                                        </div>
                                      )}

                                      {/* Prompt customer rating if resolved */}
                                      {t.status === 'resolved' && viewMode === 'personal' && (
                                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-pulse">
                                          <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                                              <CheckCircle2 className="w-5 h-5" />
                                            </div>
                                            <div>
                                              <h5 className="text-xs font-black text-slate-850">Help Ticket Resolved!</h5>
                                              <p className="text-[9px] font-bold text-slate-500">Please provide your feedback to close the request.</p>
                                            </div>
                                          </div>
                                          <button 
                                            onClick={() => { setRatingTicketId(t.id); setShowRatingModal(true); }}
                                            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-black uppercase tracking-wider transition-all"
                                          >
                                            Rate & Close Ticket
                                          </button>
                                        </div>
                                      )}
                                    </div>

                                    {/* Main description and details */}
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                      <div className="lg:col-span-8 space-y-4">
                                        <div>
                                          <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Ticket Description</h5>
                                          <div className="bg-white border border-slate-100 p-5 rounded-2xl">
                                            <p className="text-xs font-semibold text-slate-750 whitespace-pre-wrap leading-relaxed">{t.description}</p>
                                          </div>
                                        </div>

                                        {/* SLA Indicator */}
                                        <div className="bg-white border border-slate-100 p-5 rounded-2xl space-y-3">
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              <Clock className="w-4.5 h-4.5 text-slate-400 animate-pulse" />
                                              <div>
                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Request Time to Deadline Time</p>
                                                <p className="text-xs font-black text-slate-700 flex items-center gap-1.5 flex-wrap">
                                                  <span>{new Date(detailObj.created_at).toLocaleString()}</span>
                                                  <span className="text-slate-400 font-bold">to</span>
                                                  <span>{detailObj.sla_deadline ? new Date(detailObj.sla_deadline).toLocaleString() : 'N/A'}</span>
                                                  {hasExtension && (
                                                    <span className="text-[8px] bg-amber-50 text-amber-700 font-black px-1.5 py-0.5 rounded border border-amber-200 animate-pulse">
                                                      Extended
                                                    </span>
                                                  )}
                                                  {(user?.role === 'super_admin' || user?.role === 'it_admin' || user?.role === 'hr_admin' || user?.id === t.assigned_to_id) && (
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        setEditingTicket(t);
                                                        setTempDeadline(t.sla_deadline ? new Date(t.sla_deadline).toISOString().slice(0, 16) : '');
                                                        setExtensionReason('');
                                                        setShowExtensionModal(true);
                                                      }}
                                                      className="text-blue-600 hover:underline text-[9px] font-black uppercase tracking-wider ml-1"
                                                    >
                                                      Edit
                                                    </button>
                                                  )}
                                                </p>
                                              </div>
                                            </div>
                                            
                                            <div className="text-right">
                                              <span className="text-xs font-black text-slate-700" style={{ color: getSlaColor(detailObj) }}>
                                                {formatSlaCountdown(detailObj)}
                                              </span>
                                            </div>
                                          </div>
                                          
                                          {detailObj.sla_deadline && detailObj.created_at && (
                                            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                              <div 
                                                className="h-full rounded-full transition-all duration-1000" 
                                                style={{ 
                                                  width: `${getSlaPercent(detailObj)}%`,
                                                  backgroundColor: getSlaColor(detailObj)
                                                }}
                                              />
                                            </div>
                                          )}
                                        </div>

                                        {/* Deadline Details Card */}
                                        {hasExtension && (
                                          <div className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-5 text-left w-full">
                                            <div className="flex items-center gap-1.5 mb-3">
                                              <Clock className="w-4 h-4 text-amber-600" />
                                              <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">Deadline Details</span>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                              <div>
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Requested Deadline</span>
                                                <span className="text-[11px] font-bold text-slate-700">{originalDeadlineVal}</span>
                                              </div>
                                              <div>
                                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Current Deadline</span>
                                                <span className="text-[11px] font-bold text-slate-700">{detailObj.sla_deadline ? new Date(detailObj.sla_deadline).toLocaleString() : 'N/A'}</span>
                                              </div>
                                              {detailObj.extension_reason && (
                                                <div className="sm:col-span-2 border-t border-slate-100 pt-3">
                                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Extension Reason</span>
                                                  <span className="text-xs font-semibold text-slate-655 leading-relaxed block">{detailObj.extension_reason}</span>
                                                </div>
                                              )}
                                              {detailObj.extended_by_name && (
                                                <div className="border-t border-slate-100 pt-3">
                                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Extended By</span>
                                                  <span className="text-[11px] font-bold text-slate-700">{detailObj.extended_by_name} ({detailObj.extended_by_role?.replace('_', ' ')})</span>
                                                </div>
                                              )}
                                              {detailObj.extended_on && (
                                                <div className="border-t border-slate-100 pt-3">
                                                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Extended On</span>
                                                  <span className="text-[11px] font-bold text-slate-700">{new Date(detailObj.extended_on).toLocaleString()}</span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>

                                      {/* Side Card info */}
                                      <div className="lg:col-span-4 bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4 h-fit">
                                        <div>
                                          <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5">Owner details</h5>
                                          <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
                                            <div className="w-8.5 h-8.5 rounded-lg bg-brand-red/10 text-brand-red flex items-center justify-center font-black text-xs">
                                              {t.full_name?.charAt(0) || 'E'}
                                            </div>
                                            <div className="min-w-0">
                                              <p className="text-xs font-black text-slate-800 truncate">{t.full_name}</p>
                                              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{t.job_title || 'Employee'}</p>
                                            </div>
                                          </div>
                                          <div className="space-y-1.5 mt-3 text-[10px]">
                                            <div className="flex justify-between"><span className="font-bold text-slate-400">Employee No:</span><span className="font-black text-slate-700">{t.employee_no || '-'}</span></div>
                                            <div className="flex justify-between"><span className="font-bold text-slate-400">Subsidiary:</span><span className="font-black text-slate-700 truncate max-w-[120px]">{t.subsidiary_name}</span></div>
                                            <div className="flex justify-between"><span className="font-bold text-slate-400">Email:</span><span className="font-black text-slate-700 truncate max-w-[120px]">{t.user_email}</span></div>
                                          </div>
                                        </div>

                                        {/* Assigned Specialist */}
                                        <div>
                                          <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Assigned expert</h5>
                                          {t.assigned_to_id ? (
                                            <div className="bg-white border border-slate-100 p-3 rounded-xl flex items-center gap-3 shadow-sm">
                                              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs">
                                                {t.assignee_name?.charAt(0) || 'A'}
                                              </div>
                                              <div className="min-w-0">
                                                <p className="text-xs font-black text-slate-800 truncate">{t.assignee_name}</p>
                                                <p className="text-[8px] font-bold text-slate-450 uppercase tracking-widest truncate">{t.assignee_email}</p>
                                              </div>
                                            </div>
                                          ) : (
                                            <p className="text-xs text-slate-450 italic mt-1 bg-white p-3 rounded-xl border border-slate-100 text-center">Unassigned</p>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Tabs inside Expanded View (Comments / Attachments / Logs) */}
                                    <div className="border-t border-slate-200 pt-6">
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        
                                        {/* Comments Feed */}
                                        <div className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-col min-h-[300px] max-h-[400px]">
                                          <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Live Comments ({comments.length})</h5>
                                          <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar mb-3">
                                            {comments.length > 0 ? (
                                              comments.map(c => (
                                                <div key={c.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-1">
                                                  <div className="flex justify-between items-center">
                                                    <span className="text-[9px] font-black text-slate-700">{c.full_name}</span>
                                                    <span className="text-[8px] font-bold text-slate-400">{new Date(c.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                  </div>
                                                  <p className="text-xs font-semibold text-slate-600 leading-normal">{c.comment}</p>
                                                </div>
                                              ))
                                            ) : (
                                              <p className="text-xs text-slate-400 italic text-center py-10">No comments yet</p>
                                            )}
                                          </div>
                                          <form onSubmit={handleAddComment} className="flex gap-2">
                                            <input 
                                              type="text" 
                                              placeholder="Add a comment..."
                                              value={newComment}
                                              onChange={(e) => setNewComment(e.target.value)}
                                              className="flex-1 border border-slate-200 px-3 py-2 rounded-xl text-xs focus:outline-none focus:border-brand-red/30 shadow-inner"
                                            />
                                            <button 
                                              type="submit" 
                                              disabled={submittingComment || !newComment.trim()}
                                              className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center active:scale-95 disabled:opacity-50 transition-all shrink-0 cursor-pointer"
                                            >
                                              <Send className="w-4 h-4" />
                                            </button>
                                          </form>
                                        </div>

                                        {/* Attachments Section */}
                                        <div className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-col min-h-[300px] max-h-[400px]">
                                          <div className="flex justify-between items-center mb-3">
                                            <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Attachments ({attachments.length})</h5>
                                            <label className="cursor-pointer bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1">
                                              <Paperclip className="w-3.5 h-3.5" /> Attach File
                                              <input 
                                                type="file" 
                                                onChange={handleUploadDetailFile}
                                                className="hidden" 
                                              />
                                            </label>
                                          </div>
                                          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                                            {attachments.length > 0 ? (
                                              attachments.map(a => (
                                                <div key={a.id} className="p-3 border border-slate-100 rounded-xl flex items-center justify-between group bg-slate-50/50 hover:bg-white transition-all shadow-sm">
                                                  <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="w-8 h-8 rounded-lg bg-red-50 text-brand-red flex items-center justify-center shrink-0 border border-red-100">
                                                      <FileText className="w-4.5 h-4.5" />
                                                    </div>
                                                    <div className="min-w-0">
                                                      <p className="text-xs font-black text-slate-705 truncate leading-none mb-1">{a.file_name}</p>
                                                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest truncate">By: {a.full_name}</p>
                                                    </div>
                                                  </div>
                                                  <a 
                                                    href={a.file_url} 
                                                    target="_blank" 
                                                    rel="noreferrer"
                                                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors shrink-0"
                                                  >
                                                    <Download className="w-3.5 h-3.5" />
                                                  </a>
                                                </div>
                                              ))
                                            ) : (
                                              <p className="text-xs text-slate-400 italic text-center py-10">No attachments uploaded</p>
                                            )}
                                          </div>
                                        </div>

                                        {/* Audit Log Trail */}
                                        <div className="bg-white p-5 rounded-2xl border border-slate-100 flex flex-col min-h-[300px] max-h-[400px]">
                                          <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Audit logs trail</h5>
                                          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 custom-scrollbar">
                                            {logs.length > 0 ? (
                                              logs.map(log => (
                                                <div key={log.id} className="flex gap-3 items-start relative pl-4 before:content-[''] before:absolute before:left-[4px] before:top-2 before:bottom-[-20px] before:w-[1px] before:bg-slate-200 last:before:hidden">
                                                  <span className="w-2.5 h-2.5 rounded-full bg-brand-red mt-1 border-2 border-white ring-2 ring-red-50 shrink-0" />
                                                  <div className="min-w-0">
                                                    <p className="text-xs font-black text-slate-800 leading-tight capitalize">{log.action}</p>
                                                    <p className="text-[10px] font-bold text-slate-500 mt-0.5 leading-relaxed">{log.details}</p>
                                                    <p className="text-[8px] font-extrabold text-slate-400 mt-1 uppercase tracking-widest">
                                                      {log.full_name} · {new Date(log.created_at).toLocaleString()}
                                                    </p>
                                                  </div>
                                                </div>
                                              ))
                                            ) : (
                                              <p className="text-xs text-slate-400 italic text-center py-10">No logs registered</p>
                                            )}
                                          </div>
                                        </div>

                                      </div>

                                      {/* Deadline History Section */}
                                      {deadlineHistory.length > 0 && (
                                        <div className="bg-white p-5 rounded-2xl border border-slate-100 mt-6 text-left">
                                          <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">Deadline History</h5>
                                          <div className="relative border-l border-slate-100 pl-6 ml-3 space-y-6">
                                            {deadlineHistory.map((hist, idx) => (
                                              <div key={hist.id} className="relative">
                                                <div className="absolute -left-[31px] top-1.5 w-2.5 h-2.5 rounded-full bg-amber-500 border-2 border-white ring-2 ring-amber-50" />
                                                <div>
                                                  <span className="text-[10px] font-black uppercase text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                                                    Extension #{idx + 1}
                                                  </span>
                                                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                                                    <div>
                                                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Old Deadline</p>
                                                      <p className="text-xs font-bold text-slate-700">{hist.old_deadline ? new Date(hist.old_deadline).toLocaleString() : 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">New Deadline</p>
                                                      <p className="text-xs font-bold text-slate-700">{hist.new_deadline ? new Date(hist.new_deadline).toLocaleString() : 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Updated By</p>
                                                      <p className="text-xs font-bold text-slate-700">{hist.updated_by_name} ({hist.updated_by_role?.replace('_', ' ')})</p>
                                                    </div>
                                                    <div>
                                                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Updated At</p>
                                                      <p className="text-xs font-bold text-slate-700">{new Date(hist.created_at).toLocaleString()}</p>
                                                    </div>
                                                  </div>
                                                  {hist.reason && (
                                                    <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl mt-2 max-w-xl text-left">
                                                      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Reason for Extension</p>
                                                      <p className="text-xs font-semibold text-slate-655 leading-relaxed">{hist.reason}</p>
                                                    </div>
                                                  )}
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>

                                    {/* Admin Controls Box inside detail panel */}
                                    {viewMode === 'admin' && (
                                      <div className="pt-5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="flex items-center gap-2 text-slate-400">
                                          <ShieldCheck className="w-4.5 h-4.5 text-brand-red" />
                                          <span className="text-[9px] font-black uppercase tracking-widest">Admin Actions Console</span>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 flex-wrap">
                                          {['open', 'assigned', 'in_progress', 'pending'].includes(t.status) && (
                                            <div className="flex items-center gap-2">
                                              {user?.role === 'super_admin' ? (
                                                <span className="text-xs font-bold text-slate-700 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                                                  Assignee: {t.assignee_name || 'Unassigned'}
                                                </span>
                                              ) : (
                                                <>
                                                  <select 
                                                    value={selectedAssignees[t.id] !== undefined ? selectedAssignees[t.id] : (
                                                      (() => {
                                                        const staff = getDepartmentStaff(t.department);
                                                        const curr = staff.find(member => member.id === t.assigned_to_id);
                                                        return curr ? JSON.stringify({ id: curr.id, name: curr.full_name }) : '';
                                                      })()
                                                    )} 
                                                    onChange={(e) => setSelectedAssignees({ ...selectedAssignees, [t.id]: e.target.value })}
                                                    className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-[10px] font-bold focus:outline-none focus:border-brand-red/30 cursor-pointer shadow-sm"
                                                  >
                                                    <option value="">— Select Specialist —</option>
                                                    {getDepartmentStaff(t.department).map(member => (
                                                      <option key={member.id} value={JSON.stringify({ id: member.id, name: member.full_name })}>
                                                        {member.full_name} ({member.job_title || 'Staff'})
                                                      </option>
                                                    ))}
                                                  </select>
                                                  <button 
                                                    onClick={() => handleAssignTicket(t.id, selectedAssignees[t.id])} 
                                                    disabled={!selectedAssignees[t.id]}
                                                    className="px-4 py-2 bg-brand-red hover:bg-brand-red-dark text-white rounded-xl text-[9px] font-black uppercase tracking-wider shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center gap-1"
                                                  >
                                                    <UserPlus className="w-3.5 h-3.5" /> Assign
                                                  </button>
                                                  {t.status === 'open' && (
                                                    <button 
                                                      onClick={() => handleAssignToSelf(t.id)} 
                                                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all active:scale-95"
                                                    >
                                                      Claim
                                                    </button>
                                                  )}
                                                </>
                                              )}
                                            </div>
                                          )}

                                          {['assigned', 'in_progress', 'pending'].includes(t.status) && (
                                            <div className="flex items-center gap-2">
                                              <input 
                                                type="text" 
                                                placeholder="Resolution notes..."
                                                value={resolutionComments[t.id] || ''}
                                                onChange={(e) => setResolutionComments({
                                                  ...resolutionComments,
                                                  [t.id]: e.target.value
                                                })}
                                                className="border border-slate-200 px-3 py-2 rounded-xl text-[10px] font-bold focus:outline-none focus:border-brand-red/30 shadow-inner w-56"
                                              />
                                              <button 
                                                onClick={() => handleResolveTicket(t.id, resolutionComments[t.id])} 
                                                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[9px] font-black uppercase tracking-wider shadow-md active:scale-95 flex items-center gap-1"
                                              >
                                                <Check className="w-3.5 h-3.5" /> Mark Resolved
                                              </button>
                                            </div>
                                          )}

                                          <button 
                                            onClick={() => handleDeleteTicket(t.id)}
                                            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-650 border border-rose-100 rounded-xl text-[9px] font-black uppercase tracking-wider active:scale-95 flex items-center gap-1 ml-auto"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" /> Delete
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-xs text-slate-400 italic text-center py-6">Could not fetch details</p>
                                )}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-300 mb-4 shadow-sm">
                      <ClipboardList className="w-6 h-6" />
                    </div>
                    <h4 className="text-slate-700 font-black text-base">No support tickets found</h4>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed max-w-xs">You have no tickets currently logged matching your search filters.</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="directory-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Directory sidebar */}
              <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-black text-slate-800">Support Contacts</h3>
                  <p className="text-slate-400 text-xs mt-1">Select a department to view internal support contacts.</p>
                </div>

                <div className="space-y-2">
                  {Object.keys(supportData).map((key) => {
                    const sd = supportData[key];
                    const Icon = sd.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          setSelectedMatter(key);
                          if (sd.categories && sd.categories.length > 0) {
                            setSelectedCategory(sd.categories[0].id);
                          }
                        }}
                        className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                          selectedMatter === key
                            ? 'bg-slate-900 border-slate-900 text-white shadow-lg'
                            : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${
                          selectedMatter === key ? 'bg-white/10 border-white/10 text-white' : `${sd.accent} bg-white border-slate-150`
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black uppercase tracking-wider">{sd.title}</p>
                          <p className={`text-[10px] mt-0.5 truncate ${selectedMatter === key ? 'text-white/60' : 'text-slate-400'}`}>{sd.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Directory main details */}
              <div className="lg:col-span-8 bg-white p-6 md:p-10 rounded-3xl border border-slate-100 shadow-sm">
                {currentMatter ? (
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-xl font-black text-slate-800 leading-none">{currentMatter.title} Contacts</h3>
                      <p className="text-slate-450 text-xs font-bold mt-1.5 uppercase tracking-wider">{currentMatter.label} Support Team</p>
                    </div>

                    {/* Category tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                      {currentMatter.categories.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => setSelectedCategory(c.id)}
                          className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
                            selectedCategory === c.id
                              ? 'bg-brand-red border-brand-red text-white shadow-md'
                              : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                          }`}
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>

                    {/* Contacts listings */}
                    {currentCategory ? (
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Assigned Personnel</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {currentCategory.contacts.map((contact, idx) => (
                            <div key={idx} className="p-5 border border-slate-100 rounded-2xl flex items-center gap-4 bg-slate-50/50">
                              <div className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center font-black text-slate-600 text-sm shadow-sm shrink-0">
                                {contact.initial}
                              </div>
                              <div className="min-w-0 flex-1">
                                <h5 className="text-sm font-black text-slate-800 leading-none mb-1.5 truncate">{contact.name}</h5>
                                <div className="space-y-1 text-[10px] font-semibold text-slate-500">
                                  <div className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 shrink-0 text-slate-400" /> <span className="truncate">{contact.email}</span></div>
                                  <div className="flex items-center gap-1.5"><HelpCircle className="w-3.5 h-3.5 shrink-0 text-slate-400" /> Ext: {contact.ext}</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">Select a category to view support contacts.</p>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Select a support category to get started.</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* CREATE TICKET MODAL */}
      <AnimatePresence>
        {showFormModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100] overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl relative overflow-hidden border border-slate-100 z-10 text-left my-8"
            >
              <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-red-50 to-pink-50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-brand-red to-brand-red-dark rounded-2xl flex items-center justify-center text-white shadow-md font-black text-xl">
                    GS
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 leading-none">New Support Request Ticket</h3>
                    <p className="text-slate-400 text-xs font-bold mt-1.5">Submit help logs to Central Service Operations</p>
                  </div>
                </div>
                <button onClick={() => setShowFormModal(false)} className="w-10 h-10 hover:bg-white rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitTicket} className="p-6 md:p-8 space-y-6">
                {formSuccess ? (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 mb-4 border border-emerald-100 shadow-sm">
                      <CheckCircle2 className="w-8 h-8 animate-bounce" />
                    </div>
                    <h4 className="text-slate-800 font-black text-xl">Ticket Logged Successfully!</h4>
                    <p className="text-slate-450 text-xs mt-1">Dispatched to the routed administration queue.</p>
                  </motion.div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Subject / Title</label>
                        <input
                          type="text"
                          placeholder="Short summary of request..."
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-xl text-slate-700 placeholder-slate-300 font-bold text-xs focus:outline-none focus:border-brand-red/30 focus:bg-white transition-all shadow-sm"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Routing Department</label>
                        <select
                          value={department}
                          onChange={(e) => handleDepartmentChange(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 px-3 py-3.5 rounded-xl text-xs font-bold text-slate-650 focus:outline-none focus:border-brand-red/30 focus:bg-white cursor-pointer shadow-sm"
                        >
                          <option value="it">IT & Tech Support Desk</option>
                          <option value="hr">Human Resources (HR) Desk</option>
                          <option value="general">General Operations / Facilities</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Category</label>
                        <select
                          value={category}
                          onChange={(e) => {
                            setCategory(e.target.value);
                            if (e.target.value !== 'Other') {
                              setCustomCategory('');
                            }
                          }}
                          className="w-full bg-slate-50 border border-slate-200 px-3 py-3.5 rounded-xl text-xs font-bold text-slate-655 focus:outline-none focus:border-brand-red/30 focus:bg-white cursor-pointer shadow-sm"
                          required
                        >
                          <option value="">— Select Category —</option>
                          {categoryMap[department]?.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.label}</option>
                          ))}
                          <option value="Other">Other...</option>
                        </select>

                        {category === 'Other' && (
                          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
                            <label className="block text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Specify Category</label>
                            <input
                              type="text"
                              value={customCategory}
                              onChange={(e) => setCustomCategory(e.target.value)}
                              placeholder="Type custom category name..."
                              className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-700 placeholder-slate-300 font-bold text-xs focus:outline-none focus:border-brand-red/30 focus:bg-white transition-all shadow-sm"
                              required
                            />
                          </motion.div>
                        )}
                      </div>

                      <div>
                        <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Priority Level</label>
                        <select
                          value={priority}
                          onChange={(e) => setPriority(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 px-3 py-3.5 rounded-xl text-xs font-bold text-slate-655 focus:outline-none focus:border-brand-red/30 focus:bg-white cursor-pointer shadow-sm"
                        >
                          <option value="low">🟢 Low – Small issue, work can continue normally.</option>
                          <option value="medium">🟡 Medium – Problem affects work, but you can still manage.</option>
                          <option value="high">🟠 High – Serious issue, needs fast help.</option>
                          <option value="urgent">🔴 Urgent – Work stopped or big problem, fix immediately.</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Required Deadline</label>
                      <input
                        type="datetime-local"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-xl text-slate-705 font-bold text-xs focus:outline-none focus:border-brand-red/30 focus:bg-white transition-all shadow-sm mb-4"
                        required
                      />
                    </div>

                    {deadline && (
                      <div className="mb-4 bg-brand-red/5 border border-brand-red/10 rounded-xl p-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-brand-red animate-pulse" />
                          <div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block font-bold">Estimated SLA Duration</span>
                            <span className="text-xs font-black text-slate-750">{submitCountdown || 'Calculating...'}</span>
                          </div>
                        </div>
                        <span className="text-[8px] bg-brand-red/10 text-brand-red font-black px-2 py-0.5 rounded uppercase tracking-wider">
                          {priority} priority
                        </span>
                      </div>
                    )}

                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Description / Explanation</label>
                      <textarea
                        rows="4"
                        placeholder="Detailed explanation of the issue or support requirements..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-xl text-slate-700 placeholder-slate-300 font-bold text-xs focus:outline-none focus:border-brand-red/30 focus:bg-white transition-all shadow-sm"
                        required
                      />
                    </div>

                    {/* File Attachment Upload */}
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Attach Document / File (Optional)</label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current.click()}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-5 py-3 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5"
                        >
                          <Paperclip className="w-4.5 h-4.5" /> {attachedFile ? 'Change File' : 'Choose File'}
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={(e) => setAttachedFile(e.target.files[0])}
                          className="hidden"
                        />
                        {attachedFile && (
                          <div className="flex items-center gap-2 bg-slate-55 p-2 rounded-xl border border-slate-150 text-[10px] font-bold text-slate-600 truncate max-w-sm">
                            <FileText className="w-4 h-4 shrink-0 text-slate-400" />
                            <span className="truncate">{attachedFile.name}</span>
                            <button 
                              type="button" 
                              onClick={() => setAttachedFile(null)} 
                              className="text-slate-400 hover:text-slate-600 ml-1 shrink-0"
                            >
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
                        className="px-6 py-3 bg-brand-red text-white rounded-xl font-black text-[9px] uppercase tracking-wider hover:bg-brand-red-dark transition-all flex items-center gap-1.5 shadow-md"
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

      {/* EXTENSION MODAL */}
      <AnimatePresence>
        {showExtensionModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100] overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[28px] w-full max-w-md shadow-2xl relative overflow-hidden border border-slate-100 text-left my-8"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-red-50 to-pink-50">
                <h3 className="text-md font-black text-slate-900 leading-none">Request Deadline Extension</h3>
                <button
                  onClick={() => {
                    setShowExtensionModal(false);
                    setExtensionReason('');
                    setEditingTicket(null);
                  }}
                  className="w-8 h-8 hover:bg-white rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-655 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">New Date & Time</label>
                  <input
                    type="datetime-local"
                    value={tempDeadline}
                    onChange={(e) => setTempDeadline(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-700 font-bold text-xs focus:outline-none focus:border-brand-red/30 focus:bg-white transition-all shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Reason for Extension (Mandatory)</label>
                  <textarea
                    rows="3"
                    placeholder="e.g. Waiting for vendor response, additional investigation required..."
                    value={extensionReason}
                    onChange={(e) => setExtensionReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-slate-700 placeholder-slate-300 font-bold text-xs focus:outline-none focus:border-brand-red/30 focus:bg-white transition-all shadow-sm resize-none"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowExtensionModal(false);
                      setExtensionReason('');
                      setEditingTicket(null);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-black text-[8px] uppercase tracking-wider hover:bg-slate-55 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleSaveDeadline(editingTicket?.id, editingTicket?.status)}
                    disabled={!tempDeadline || !extensionReason.trim()}
                    className="px-5 py-2.5 bg-brand-red text-white rounded-xl font-black text-[8px] uppercase tracking-wider hover:bg-brand-red-dark transition-all shadow-md disabled:opacity-50"
                  >
                    Save
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FEEDBACK & CLOSURE RATING MODAL */}
      <AnimatePresence>
        {showRatingModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[100] overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-[28px] w-full max-w-md shadow-2xl relative overflow-hidden border border-slate-100 text-left my-8"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50">
                <h3 className="text-md font-black text-slate-900 leading-none">Share Your Feedback</h3>
                <button onClick={() => setShowRatingModal(false)} className="w-8 h-8 hover:bg-white rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleRateTicket} className="p-6 space-y-5">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest text-center mb-3">Rate Resolution Satisfaction</label>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setSatisfactionRating(star)}
                        className="text-slate-300 hover:text-amber-500 transition-colors cursor-pointer"
                      >
                        <Star className={`w-8 h-8 ${star <= satisfactionRating ? 'text-amber-500 fill-amber-500' : 'text-slate-200'}`} />
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] font-black text-slate-500 text-center uppercase tracking-widest mt-2">
                    {satisfactionRating === 5 ? 'Excellent' : satisfactionRating === 4 ? 'Very Good' : satisfactionRating === 3 ? 'Good' : satisfactionRating === 2 ? 'Fair' : 'Poor'}
                  </p>
                </div>

                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Feedback Comments (Optional)</label>
                  <textarea
                    rows="3"
                    placeholder="Tell us what you think of the service or suggest any improvements..."
                    value={ratingFeedback}
                    onChange={(e) => setRatingFeedback(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-xl text-slate-700 placeholder-slate-300 font-bold text-xs focus:outline-none focus:border-brand-red/30 focus:bg-white transition-all shadow-sm"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowRatingModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 font-black text-[8px] uppercase tracking-wider hover:bg-slate-55 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRating}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[8px] uppercase tracking-wider transition-all shadow-md"
                  >
                    {submittingRating ? 'Submitting...' : 'Submit & Close Ticket'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default HelpDesk;
