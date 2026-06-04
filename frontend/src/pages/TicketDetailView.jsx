import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronRight, Clock, Shield, CheckCircle2, AlertTriangle,
  Download, Paperclip, Send, Lock, User, FileText,
  Activity, X, Check, Loader2, Laptop, Heart,
  UserPlus, Flag, StickyNote, Trash2, ArrowLeft, Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

const TicketDetailView = ({ department }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const isIT = department === 'it';
  const accent = isIT ? '#2563eb' : '#be123c';
  const deptLabel = isIT ? 'IT Service Desk' : 'HR Request Center';
  const deptPath = isIT ? '/admin/tickets/it' : '/admin/tickets/hr';
  const canAct = user?.role !== 'super_admin';

  // ── State ───────────────────────────────────────────
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [internalNotes, setInternalNotes] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('conversation');
  const [slaRemaining, setSlaRemaining] = useState(null);

  const [newComment, setNewComment] = useState('');
  const [newNote, setNewNote] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [submittingNote, setSubmittingNote] = useState(false);
  const [tempDeadline, setTempDeadline] = useState('');
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [extensionReason, setExtensionReason] = useState('');
  const [deadlineHistory, setDeadlineHistory] = useState([]);

  const [usersList, setUsersList] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [newPriority, setNewPriority] = useState('');
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');
  const [resolving, setResolving] = useState(false);

  const fileInputRef = useRef(null);

  // ── Data ────────────────────────────────────────────
  const fetchDetails = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/tickets/${id}/details`);
      setTicket(res.data.ticket);
      setComments(res.data.comments || []);
      setInternalNotes(res.data.internalNotes || []);
      setAttachments(res.data.attachments || []);
      setLogs(res.data.logs || []);
      setDeadlineHistory(res.data.deadlineHistory || []);
    } catch (err) {
      console.error('Ticket load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
    axios.get(`${backendUrl}/api/users`).then(r => setUsersList(r.data)).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!socket) return;
    const handle = ({ id: uid }) => { if (Number(uid) === Number(id)) fetchDetails(); };
    socket.on('ticket_updated', handle);
    socket.on('comment_added', handle);
    return () => { socket.off('ticket_updated', handle); socket.off('comment_added', handle); };
  }, [socket, id]);

  useEffect(() => {
    if (!ticket?.sla_deadline) return;
    const update = () => setSlaRemaining(new Date(ticket.sla_deadline) - new Date());
    update();
    const t = setInterval(update, 30000);
    return () => clearInterval(t);
  }, [ticket?.sla_deadline]);

  // ── Computed ────────────────────────────────────────
  const isDone = ['resolved', 'closed'].includes(ticket?.status);
  const slaBreached = slaRemaining !== null && slaRemaining <= 0 && !isDone;
  const totalSlaMs = ticket?.sla_deadline && ticket?.created_at
    ? new Date(ticket.sla_deadline) - new Date(ticket.created_at) : null;
  const slaPercent = totalSlaMs && slaRemaining !== null
    ? Math.min(100, Math.max(0, (slaRemaining / totalSlaMs) * 100)) : isDone ? 100 : 50;
  const slaColor = isDone ? '#10b981' : slaBreached ? '#e11d48' : slaPercent > 50 ? '#10b981' : slaPercent > 20 ? '#f59e0b' : '#e11d48';

  const formatSla = () => {
    if (isDone) return 'Completed';
    if (!slaRemaining) return 'N/A';
    if (slaRemaining <= 0) return 'Breached';
    const h = Math.floor(slaRemaining / 3600000);
    const m = Math.floor((slaRemaining % 3600000) / 60000);
    return h >= 24 ? `${Math.floor(h / 24)}d ${h % 24}h remaining` : `${h}h ${m}m remaining`;
  };

  const staffList = usersList.filter(u =>
    isIT ? ['it_staff','it_admin'].includes(u.role) : ['hr_staff','hr_admin'].includes(u.role)
  );

  const STEPS = ['open','assigned','in_progress','resolved','closed'];
  const STEP_LABELS = { open:'Created', assigned:'Assigned', in_progress:'In Progress', resolved:'Resolved', closed:'Closed' };
  const stepIdx = STEPS.indexOf(ticket?.status ?? 'open');

  const canEditDeadline = ['super_admin', 'it_admin', 'hr_admin'].includes(user?.role) ||
    (ticket?.assigned_to_id && Number(ticket.assigned_to_id) === Number(user?.id));

  const priorityClass = (p) => ({
    low:    'bg-slate-100 text-slate-600 border-slate-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    high:   'bg-orange-50 text-orange-700 border-orange-200',
    urgent: 'bg-red-50 text-red-700 border-red-200',
  }[p] || 'bg-slate-100 text-slate-600 border-slate-200');

  const statusClass = (s) => ({
    open:        'bg-sky-50 text-sky-600 border-sky-200',
    assigned:    'bg-indigo-50 text-indigo-600 border-indigo-200',
    in_progress: isIT ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-rose-50 text-rose-600 border-rose-200',
    pending:     'bg-amber-50 text-amber-600 border-amber-200',
    resolved:    'bg-emerald-50 text-emerald-700 border-emerald-200',
    closed:      'bg-slate-100 text-slate-600 border-slate-200',
  }[s] || 'bg-slate-100 text-slate-500 border-slate-200');

  // ── Actions ─────────────────────────────────────────
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submittingComment) return;
    setSubmittingComment(true);
    try { await axios.post(`${backendUrl}/api/tickets/${id}/comments`, { userId: user?.id, comment: newComment }); setNewComment(''); fetchDetails(); }
    finally { setSubmittingComment(false); }
  };
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim() || submittingNote) return;
    setSubmittingNote(true);
    try { await axios.post(`${backendUrl}/api/tickets/${id}/internal-notes`, { userId: user?.id, note: newNote }); setNewNote(''); fetchDetails(); }
    finally { setSubmittingNote(false); }
  };
  const handleSaveDeadline = async () => {
    try {
      await axios.put(`${backendUrl}/api/tickets/${id}/status`, {
        status: ticket.status,
        sla_deadline: tempDeadline || null,
        reason: extensionReason,
        current_user_id: user?.id
      });
      setShowExtensionModal(false);
      setExtensionReason('');
      fetchDetails();
    } catch (err) {
      console.error('Error saving deadline:', err);
      alert(err.response?.data?.message || 'Failed to update deadline');
    }
  };
  const handleAssign = async () => {
    if (!selectedAssignee || assigning) return;
    setAssigning(true);
    try {
      const p = JSON.parse(selectedAssignee);
      await axios.put(`${backendUrl}/api/tickets/${id}/status`, { status: 'assigned', assigned_to_id: p.id, current_user_id: user?.id });
      setShowAssignModal(false); setSelectedAssignee(''); fetchDetails();
    } finally { setAssigning(false); }
  };
  const handleChangePriority = async () => {
    if (!newPriority) return;
    try { await axios.put(`${backendUrl}/api/tickets/${id}/status`, { status: ticket.status, priority: newPriority, current_user_id: user?.id }); setShowPriorityModal(false); setNewPriority(''); fetchDetails(); }
    catch (e) { console.error(e); }
  };
  const handleResolve = async () => {
    setResolving(true);
    try { await axios.put(`${backendUrl}/api/tickets/${id}/status`, { status: 'resolved', resolution_notes: resolutionNote, current_user_id: user?.id }); setShowResolveModal(false); setResolutionNote(''); fetchDetails(); }
    finally { setResolving(false); }
  };
  const handleDelete = async () => {
    if (!window.confirm('Permanently delete this ticket?')) return;
    await axios.delete(`${backendUrl}/api/tickets/${id}`);
    navigate(deptPath);
  };
  const handleAttach = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    try {
      const up = await axios.post(`${backendUrl}/api/uploads/ticket-file`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await axios.post(`${backendUrl}/api/tickets/${id}/attachments`, { fileName: up.data.fileName, fileUrl: up.data.fileUrl, uploadedBy: user?.id });
      fetchDetails();
    } catch (err) { console.error(err); }
  };

  // ── Loading / not found ──────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-7 h-7 animate-spin" style={{ color: accent }} />
        <p className="text-sm font-bold text-slate-400">Loading ticket…</p>
      </div>
    </div>
  );
  if (!ticket) return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
      <p className="font-bold text-slate-500">Ticket not found.</p>
      <button onClick={() => navigate(deptPath)} className="text-sm font-black underline" style={{ color: accent }}>← Back to queue</button>
    </div>
  );

  // ── Render ───────────────────────────────────────────
  return (
    <div className="pb-24">

      {/* Breadcrumb */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 flex-wrap">
          <button onClick={() => navigate(deptPath)} className="hover:text-slate-700 flex items-center gap-1 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Tickets
          </button>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <Link to={deptPath} className="hover:text-slate-700 transition-colors">{deptLabel}</Link>
          <ChevronRight className="w-3 h-3 text-slate-300" />
          <span className="font-black" style={{ color: accent }}>{ticket.ticket_no || `#${id}`}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.open(`${backendUrl}/api/tickets/export/pdf?department=${department}&userId=${user?.id}&role=${user?.role}`, '_blank')}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-wider">
            <Download className="w-3 h-3" /> Export PDF
          </button>
          <button onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-lg text-[10px] font-black text-slate-600 hover:bg-slate-50 transition-all uppercase tracking-wider">
            <Printer className="w-3 h-3" /> Print
          </button>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-6">

        {/* ── LEFT ── */}
        <div className="space-y-5 min-w-0">

          {/* Header card */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">

            <div className="flex items-start gap-4 mb-5">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border"
                style={{ background: `${accent}12`, borderColor: `${accent}25` }}>
                {isIT ? <Laptop className="w-5 h-5" style={{ color: accent }} />
                       : <Heart className="w-5 h-5" style={{ color: accent }} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: accent }}>
                    {ticket.ticket_no || `#${id}`}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-wider ${priorityClass(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                  {slaBreached && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-600 text-[8px] font-black uppercase animate-pulse">
                      <AlertTriangle className="w-2.5 h-2.5" /> SLA Breached
                    </span>
                  )}
                </div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight leading-snug">{ticket.subject}</h1>
                {ticket.description && (
                  <p className="text-slate-500 text-xs font-medium mt-1">{ticket.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                    <User className="w-3 h-3" />
                    {ticket.full_name} ({ticket.subsidiary_name || 'GS Group'})
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                    <Clock className="w-3 h-3" />
                    {new Date(ticket.created_at).toLocaleString()}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="text-[10px] font-bold text-slate-400">via Web Portal</span>
                </div>
              </div>
            </div>

            {/* Info row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-100 rounded-xl overflow-hidden border border-slate-100 mb-4">
              {[
                { label: 'STATUS', el: <span className={`inline-flex px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider ${statusClass(ticket.status)}`}>{ticket.status?.replace('_',' ')}</span> },
                {
                  label: 'DUE DATE',
                  el: (
                    <div className="flex flex-col text-left">
                      <span className="text-[11px] font-black text-slate-700 flex items-center gap-1.5 flex-wrap">
                        {ticket.sla_deadline ? new Date(ticket.sla_deadline).toLocaleString() : 'N/A'}
                        {canEditDeadline && (
                          <button
                            type="button"
                            onClick={() => {
                              setTempDeadline(ticket.sla_deadline ? new Date(ticket.sla_deadline).toISOString().slice(0, 16) : '');
                              setExtensionReason('');
                              setShowExtensionModal(true);
                            }}
                            className="text-blue-600 hover:underline text-[9px] font-black uppercase tracking-wider ml-1"
                          >
                            Edit
                          </button>
                        )}
                      </span>
                      {ticket.employee_deadline && ticket.sla_deadline && new Date(ticket.employee_deadline).getTime() !== new Date(ticket.sla_deadline).getTime() && (
                        <span className="text-[8px] bg-amber-50 text-amber-700 font-black px-1.5 py-0.5 rounded border border-amber-200 mt-1 self-start animate-pulse">
                          Extended
                        </span>
                      )}
                    </div>
                  )
                },
                { label: 'PRIORITY', el: <span className={`inline-flex px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider ${priorityClass(ticket.priority)}`}>{ticket.priority}</span> },
                { label: 'ASSIGNED TO', el: <span className="text-[11px] font-black text-slate-700">{ticket.assignee_name || 'Unassigned'}</span> },
              ].map(item => (
                <div key={item.label} className="bg-white p-4">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">{item.label}</p>
                  {item.el}
                </div>
              ))}
            </div>

            {/* SLA bar */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 shrink-0">
                <Clock className="w-3.5 h-3.5" style={{ color: slaColor }} />
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">SLA</span>
              </div>
              <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: isDone ? '100%' : `${slaPercent}%` }}
                  transition={{ duration: 0.9, ease: 'easeOut' }} className="h-full rounded-full"
                  style={{ backgroundColor: slaColor }} />
              </div>
              <span className="text-[10px] font-black shrink-0" style={{ color: slaColor }}>{formatSla()}</span>
            </div>

            {/* Deadline Details Card */}
            {((ticket.employee_deadline && ticket.sla_deadline && new Date(ticket.employee_deadline).getTime() !== new Date(ticket.sla_deadline).getTime()) || ticket.extended_by_name) && (
              <div className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-5 mt-5 text-left">
                <div className="flex items-center gap-1.5 mb-3">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">Deadline Details</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block font-bold">Requested Deadline</span>
                    <span className="text-[11px] font-bold text-slate-700">
                      {ticket.employee_deadline 
                        ? new Date(ticket.employee_deadline).toLocaleString() 
                        : (deadlineHistory.length > 0 && deadlineHistory[0].old_deadline 
                            ? new Date(deadlineHistory[0].old_deadline).toLocaleString() 
                            : 'N/A')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block font-bold">Current Deadline</span>
                    <span className="text-[11px] font-black text-slate-900 flex items-center gap-1">
                      {new Date(ticket.sla_deadline).toLocaleString()}
                      {canEditDeadline && (
                        <button type="button" onClick={() => {
                          setTempDeadline(ticket.sla_deadline ? new Date(ticket.sla_deadline).toISOString().slice(0, 16) : '');
                          setExtensionReason('');
                          setShowExtensionModal(true);
                        }} className="text-blue-600 hover:underline text-[9px] font-black uppercase tracking-wider ml-1">Edit</button>
                      )}
                    </span>
                  </div>
                  {ticket.extension_reason && (
                    <div className="sm:col-span-2 border-t border-slate-100 pt-3">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block font-bold mb-0.5">Extension Reason</span>
                      <span className="text-xs font-semibold text-slate-655 leading-relaxed block">{ticket.extension_reason}</span>
                    </div>
                  )}
                  {ticket.extended_by_name && (
                    <div className="border-t border-slate-100 pt-3">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block font-bold">Extended By</span>
                      <span className="text-[11px] font-bold text-slate-700">{ticket.extended_by_name} ({ticket.extended_by_role?.replace('_', ' ')})</span>
                    </div>
                  )}
                  {ticket.extended_on && (
                    <div className="border-t border-slate-100 pt-3">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block font-bold">Extended On</span>
                      <span className="text-[11px] font-bold text-slate-700">{new Date(ticket.extended_on).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>

          {/* Progress timeline */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm px-8 py-6">
            <div className="flex items-start justify-between relative">
              {STEPS.map((step, idx) => {
                const done = stepIdx >= idx;
                const active = stepIdx === idx;
                return (
                  <div key={step} className="flex-1 flex flex-col items-center relative">
                    {idx > 0 && (
                      <div className="absolute top-[13px] right-[50%] w-full h-0.5 z-0"
                        style={{ backgroundColor: done ? accent : '#e2e8f0' }} />
                    )}
                    <div className="w-7 h-7 rounded-full flex items-center justify-center z-10 border-2 transition-all"
                      style={done && !active
                        ? { backgroundColor: accent, borderColor: accent }
                        : active
                        ? { backgroundColor: 'white', borderColor: accent }
                        : { backgroundColor: 'white', borderColor: '#e2e8f0' }}>
                      {done && !active ? <Check className="w-3.5 h-3.5 text-white" />
                        : active ? <div className="w-3 h-3 rounded-full" style={{ backgroundColor: accent }} />
                        : <div className="w-2 h-2 rounded-full bg-slate-200" />}
                    </div>
                    <p className={`text-[9px] font-black uppercase tracking-wider mt-2 text-center leading-tight ${done ? 'text-slate-700' : 'text-slate-400'}`}>
                      {STEP_LABELS[step]}
                    </p>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">

            <div className="flex border-b border-slate-100 px-2 pt-1 gap-0 overflow-x-auto scrollbar-none">
              {[
                { id: 'conversation', label: 'Conversation',    count: comments.length,      icon: Send },
                ...(deadlineHistory.length > 0 ? [
                  { id: 'deadline_history', label: 'Deadline History', count: deadlineHistory.length, icon: Clock }
                ] : []),
                { id: 'notes',        label: 'Internal Notes',  count: internalNotes.length, icon: Lock },
                { id: 'attachments',  label: 'Attachments',     count: attachments.length,   icon: Paperclip },
                { id: 'audit',        label: 'Audit Logs',      count: logs.length,          icon: Activity },
              ].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-3.5 text-[10px] font-black uppercase tracking-wider border-b-2 whitespace-nowrap transition-all ${
                    activeTab === tab.id ? 'text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                  style={activeTab === tab.id ? { borderBottomColor: accent } : {}}>
                  <tab.icon className="w-3.5 h-3.5" />
                  {tab.label}
                  <span className="px-1.5 py-0.5 rounded-full text-[8px] font-black bg-slate-100 text-slate-500">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {/* Conversation */}
              {activeTab === 'conversation' && (
                <motion.div key="conv" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="p-5 space-y-4 min-h-[260px]">

                  {/* System note */}
                  {logs.filter(l => l.action === 'create').map(l => (
                    <div key={`s${l.id}`} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                        <Activity className="w-4 h-4 text-slate-400" />
                      </div>
                      <div className="flex-1 bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black text-slate-500">System</span>
                            <span className="text-[8px] font-black uppercase tracking-wider bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded">System Note</span>
                          </div>
                          <span className="text-[9px] font-bold text-slate-400">{new Date(l.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-xs font-medium text-slate-500">Ticket created</p>
                      </div>
                    </div>
                  ))}

                  {comments.length === 0 && logs.filter(l => l.action === 'create').length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 gap-2">
                      <Send className="w-7 h-7 text-slate-200" />
                      <p className="text-xs font-bold text-slate-400">No messages yet</p>
                    </div>
                  )}

                  {comments.map(c => (
                    <div key={c.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0"
                        style={{ backgroundColor: accent }}>
                        {c.full_name?.charAt(0)}
                      </div>
                      <div className="flex-1 bg-slate-50 rounded-xl p-3.5 border border-slate-100">
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-black text-slate-800">{c.full_name}</span>
                            <span className="text-[8px] font-black uppercase bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded">
                              {c.role?.replace('_',' ')}
                            </span>
                          </div>
                          <span className="text-[9px] font-bold text-slate-400">{new Date(c.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-xs font-medium text-slate-700 leading-relaxed">{c.comment}</p>
                      </div>
                    </div>
                  ))}

                  <form onSubmit={handleAddComment} className="flex gap-2 pt-3 border-t border-slate-100">
                    <button type="button" onClick={() => fileInputRef.current?.click()}
                      className="shrink-0 w-9 h-9 flex items-center justify-center text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 border border-slate-200 transition-all">
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleAttach} className="hidden" />
                    <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)}
                      placeholder="Add a public comment…"
                      className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-medium text-slate-700 focus:outline-none focus:border-slate-400 bg-slate-50" />
                    <button type="submit" disabled={!newComment.trim() || submittingComment}
                      className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center text-white active:scale-95 disabled:opacity-40 transition-all"
                      style={{ backgroundColor: accent }}>
                      {submittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </form>
                </motion.div>
              )}

              {/* Deadline History */}
              {activeTab === 'deadline_history' && (
                <motion.div key="deadline_hist" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="p-5 space-y-6 min-h-[260px]">
                  <div className="relative border-l border-slate-100 pl-6 ml-3 space-y-6 text-left">
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
                </motion.div>
              )}

              {/* Internal Notes */}
              {activeTab === 'notes' && (
                <motion.div key="notes" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="p-5 space-y-4 min-h-[260px]">
                  <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                    <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <p className="text-[10px] font-bold text-amber-700">Staff-only — not visible to the ticket requester.</p>
                  </div>
                  {internalNotes.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 gap-2">
                      <StickyNote className="w-7 h-7 text-slate-200" />
                      <p className="text-xs font-bold text-slate-400">No internal notes yet</p>
                    </div>
                  )}
                  {internalNotes.map(n => (
                    <div key={n.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 font-black text-sm flex items-center justify-center shrink-0">
                        {n.full_name?.charAt(0)}
                      </div>
                      <div className="flex-1 bg-amber-50 rounded-xl p-3.5 border border-amber-100">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-black text-slate-800">{n.full_name}</span>
                          <span className="text-[9px] font-bold text-slate-400">{new Date(n.created_at).toLocaleString()}</span>
                        </div>
                        <p className="text-xs font-medium text-slate-700 leading-relaxed">{n.note}</p>
                      </div>
                    </div>
                  ))}
                  {canAct && (
                    <form onSubmit={handleAddNote} className="flex gap-2 pt-3 border-t border-slate-100">
                      <input type="text" value={newNote} onChange={e => setNewNote(e.target.value)}
                        placeholder="Add a staff-only internal note…"
                        className="flex-1 border border-amber-200 rounded-xl px-4 py-2.5 text-xs font-medium focus:outline-none focus:border-amber-400 bg-amber-50 text-slate-700" />
                      <button type="submit" disabled={!newNote.trim() || submittingNote}
                        className="shrink-0 px-4 h-9 rounded-xl text-white text-[10px] font-black uppercase tracking-wider active:scale-95 disabled:opacity-40 bg-amber-500 hover:bg-amber-600">
                        {submittingNote ? '…' : 'Add'}
                      </button>
                    </form>
                  )}
                </motion.div>
              )}

              {/* Attachments */}
              {activeTab === 'attachments' && (
                <motion.div key="att" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="p-5 min-h-[260px]">
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Files ({attachments.length})</p>
                    {canAct && (
                      <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all">
                        <Paperclip className="w-3 h-3" /> Attach File
                        <input type="file" onChange={handleAttach} className="hidden" />
                      </label>
                    )}
                  </div>
                  {attachments.length === 0
                    ? <div className="flex flex-col items-center justify-center py-10 gap-2"><Paperclip className="w-7 h-7 text-slate-200" /><p className="text-xs font-bold text-slate-400">No attachments</p></div>
                    : <div className="space-y-2">{attachments.map(a => (
                        <div key={a.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-black text-slate-700 truncate">{a.file_name}</p>
                              <p className="text-[9px] font-bold text-slate-400">By {a.full_name}</p>
                            </div>
                          </div>
                          <a href={a.file_url} target="_blank" rel="noreferrer"
                            className="shrink-0 w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-all">
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ))}</div>
                  }
                </motion.div>
              )}

              {/* Audit Logs */}
              {activeTab === 'audit' && (
                <motion.div key="audit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="p-5 min-h-[260px]">
                  {logs.length === 0
                    ? <div className="flex flex-col items-center justify-center py-10 gap-2"><Activity className="w-7 h-7 text-slate-200" /><p className="text-xs font-bold text-slate-400">No audit logs yet</p></div>
                    : <div className="space-y-3">{logs.map(l => (
                        <div key={l.id} className="flex items-start gap-3">
                          <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: accent }} />
                          <div className="flex-1">
                            <p className="text-xs font-bold text-slate-700">{l.full_name} <span className="font-medium text-slate-500">— {l.details}</span></p>
                            <p className="text-[9px] font-bold text-slate-400 mt-0.5">{new Date(l.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}</div>
                  }
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div className="space-y-4">

          {/* Ticket Summary */}
          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.08 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">Ticket Summary</h3>
            <div className="space-y-3.5">
              {[
                { icon: Shield,   label: 'Department',   value: isIT ? 'IT Department' : 'HR Department', highlight: true },
                { icon: FileText, label: 'Category',     value: ticket.category },
                { icon: User,     label: 'Created By',   value: ticket.full_name },
                { icon: Clock,    label: 'Last Updated', value: new Date(ticket.created_at).toLocaleDateString() },
                { icon: Activity, label: 'Ticket ID',    value: ticket.ticket_no || `#${id}` },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    <item.icon className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">{item.label}</span>
                  </div>
                  <span className="text-[10px] font-black text-right truncate max-w-[140px]"
                    style={{ color: item.highlight ? accent : '#334155' }}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* SLA Countdown */}
          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">SLA Countdown</h3>
            <div className="flex justify-center mb-3">
              <div className="relative w-36 h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={[{ value: Math.max(0, slaPercent) }, { value: Math.max(0, 100 - slaPercent) }]}
                      innerRadius={46} outerRadius={62} startAngle={90} endAngle={-270} dataKey="value" paddingAngle={3}>
                      <Cell fill={slaColor} />
                      <Cell fill="#f1f5f9" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  {isDone
                    ? <><CheckCircle2 className="w-6 h-6 text-emerald-500 mb-0.5" /><span className="text-[10px] font-black text-emerald-600">Done</span></>
                    : slaBreached
                    ? <><AlertTriangle className="w-5 h-5 text-rose-500 mb-0.5" /><span className="text-[10px] font-black text-rose-600">Breached</span></>
                    : <>
                        <span className="text-2xl font-black text-slate-800 leading-none">{slaRemaining ? `${Math.floor(slaRemaining/3600000)}h` : '—'}</span>
                        <span className="text-sm font-black text-slate-800 leading-none">{slaRemaining ? `${Math.floor((slaRemaining%3600000)/60000)}m` : ''}</span>
                        <span className="text-[9px] font-bold text-slate-400 mt-0.5">Remaining</span>
                      </>
                  }
                </div>
              </div>
            </div>
            {ticket.sla_deadline && (
              <p className="text-[9px] font-bold text-slate-400 text-center mb-3">
                Due: {new Date(ticket.sla_deadline).toLocaleString()}
              </p>
            )}
            <div className="flex justify-center">
              <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                isDone       ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                slaBreached  ? 'bg-rose-50 text-rose-600 border-rose-200 animate-pulse' :
                               'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {isDone ? '✓ Completed' : slaBreached ? '⚠ Breached' : '● On Track'}
              </span>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.16 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4">Quick Actions</h3>
            {canAct ? (
              <div className="space-y-2">
                {['open','assigned','in_progress','pending'].includes(ticket.status) && (
                  <button onClick={() => setShowAssignModal(true)}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-white text-[10px] font-black uppercase tracking-wider active:scale-95 shadow-sm transition-all"
                    style={{ backgroundColor: accent }}>
                    <UserPlus className="w-3.5 h-3.5" /> {ticket.assignee_name ? `Assign Ticket (${ticket.assignee_name})` : 'Assign Ticket'}
                  </button>
                )}
                <button onClick={() => setShowPriorityModal(true)}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all">
                  <Flag className="w-3.5 h-3.5" /> Change Priority
                </button>
                <button onClick={() => setActiveTab('notes')}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200 text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all">
                  <StickyNote className="w-3.5 h-3.5" /> Add Internal Note
                </button>
                {['assigned','in_progress','pending'].includes(ticket.status) && (
                  <button onClick={() => setShowResolveModal(true)}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Resolve Ticket
                  </button>
                )}
                <button onClick={handleDelete}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all">
                  <Trash2 className="w-3.5 h-3.5" /> Delete Ticket
                </button>
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 text-center font-bold py-3">View only — no actions available</p>
            )}
          </motion.div>
        </div>
      </div>

      {/* ── FIXED BOTTOM ACTION BAR (offset by sidebar 280px) ── */}
      {canAct && (
        <div className="fixed bottom-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-100 shadow-2xl px-6 py-3"
          style={{ left: '280px' }}>
          <div className="flex items-center gap-2 flex-wrap">
            {['open','assigned','in_progress','pending'].includes(ticket.status) && (
              <button onClick={() => setShowAssignModal(true)}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white text-[10px] font-black uppercase tracking-wider active:scale-95 shadow-sm transition-all"
                style={{ backgroundColor: accent }}>
                <UserPlus className="w-3.5 h-3.5" /> {ticket.assignee_name ? `Assign Ticket (${ticket.assignee_name})` : 'Assign Ticket'}
              </button>
            )}
            <button onClick={() => setShowPriorityModal(true)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all">
              <Flag className="w-3.5 h-3.5" /> Change Priority
            </button>
            <button onClick={() => setActiveTab('notes')}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-600 border border-amber-200 text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all">
              <StickyNote className="w-3.5 h-3.5" /> Add Internal Note
            </button>
            {['assigned','in_progress','pending'].includes(ticket.status) && (
              <button onClick={() => setShowResolveModal(true)}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wider active:scale-95 shadow-sm transition-all">
                <CheckCircle2 className="w-3.5 h-3.5" /> Resolve Ticket
              </button>
            )}
            <button onClick={handleDelete}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-[10px] font-black uppercase tracking-wider active:scale-95 transition-all">
              <Trash2 className="w-3.5 h-3.5" /> Delete Ticket
            </button>
          </div>
        </div>
      )}

      {/* ── MODALS ── */}
      <AnimatePresence>
        {showAssignModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-slate-900">Assign Ticket</h3>
                <button onClick={() => setShowAssignModal(false)} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"><X className="w-4 h-4" /></button>
              </div>
              <select value={selectedAssignee} onChange={e => setSelectedAssignee(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:outline-none mb-4 bg-slate-50">
                <option value="">— Select {isIT ? 'IT Specialist' : 'HR Staff'} —</option>
                {staffList.map(m => (
                  <option key={m.id} value={JSON.stringify({ id: m.id, name: m.full_name })}>
                    {m.full_name} ({m.job_title || m.role})
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <button onClick={() => setShowAssignModal(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-wider hover:bg-slate-50">Cancel</button>
                <button onClick={handleAssign} disabled={!selectedAssignee || assigning}
                  className="flex-1 py-2.5 rounded-xl text-white text-[10px] font-black uppercase tracking-wider disabled:opacity-50"
                  style={{ backgroundColor: accent }}>
                  {assigning ? 'Assigning…' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showPriorityModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-6 border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-slate-900">Change Priority</h3>
                <button onClick={() => setShowPriorityModal(false)} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"><X className="w-4 h-4" /></button>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                {['low','medium','high','urgent'].map(p => (
                  <button key={p} onClick={() => setNewPriority(p)}
                    className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                      newPriority === p ? 'text-white border-transparent' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                    }`}
                    style={newPriority === p ? { backgroundColor: accent } : {}}>
                    {p}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowPriorityModal(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-wider hover:bg-slate-50">Cancel</button>
                <button onClick={handleChangePriority} disabled={!newPriority}
                  className="flex-1 py-2.5 rounded-xl text-white text-[10px] font-black uppercase tracking-wider disabled:opacity-50"
                  style={{ backgroundColor: accent }}>
                  Update
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showResolveModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-slate-900">Resolve Ticket</h3>
                <button onClick={() => setShowResolveModal(false)} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"><X className="w-4 h-4" /></button>
              </div>
              <textarea rows={3} value={resolutionNote} onChange={e => setResolutionNote(e.target.value)}
                placeholder="Add resolution notes (optional)…"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-medium text-slate-700 focus:outline-none mb-4 bg-slate-50 resize-none" />
              <div className="flex gap-2">
                <button onClick={() => setShowResolveModal(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-wider hover:bg-slate-50">Cancel</button>
                <button onClick={handleResolve} disabled={resolving}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-white text-[10px] font-black uppercase tracking-wider disabled:opacity-50">
                  {resolving ? 'Resolving…' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showExtensionModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-slate-100 text-left">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-slate-900">Request Deadline Extension</h3>
                <button onClick={() => {
                  setShowExtensionModal(false);
                  setExtensionReason('');
                }} className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"><X className="w-4 h-4" /></button>
              </div>
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">New Date & Time</label>
                  <input
                    type="datetime-local"
                    value={tempDeadline}
                    onChange={(e) => setTempDeadline(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Reason for Extension (Mandatory)</label>
                  <textarea
                    rows="3"
                    value={extensionReason}
                    onChange={(e) => setExtensionReason(e.target.value)}
                    placeholder="e.g. Waiting for vendor response, additional investigation required..."
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none bg-slate-50 resize-none"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => {
                  setShowExtensionModal(false);
                  setExtensionReason('');
                }} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-wider hover:bg-slate-50">Cancel</button>
                <button onClick={handleSaveDeadline} disabled={!tempDeadline || !extensionReason.trim()}
                  className="flex-1 py-2.5 rounded-xl text-white text-[10px] font-black uppercase tracking-wider disabled:opacity-50"
                  style={{ backgroundColor: accent }}>
                  Save
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TicketDetailView;
