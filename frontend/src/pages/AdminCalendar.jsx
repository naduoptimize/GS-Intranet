import { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft, ChevronRight, Plus, Edit2, Trash2,
  X, Check, AlertCircle, RefreshCw, Calendar, Sparkles,
  Upload, Download, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_BASE = 'http://localhost:5000/api';

const TYPES = [
  { label: 'Public',      color: 'bg-emerald-500', light: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-450 border-emerald-100 dark:border-emerald-900/20' },
  { label: 'Poya',        color: 'bg-purple-500',  light: 'bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-450 border-purple-100 dark:border-purple-900/20'  },
  { label: 'Mercantile',  color: 'bg-amber-500',   light: 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-450 border-amber-100 dark:border-amber-900/20'   },
  { label: 'Group',       color: 'bg-blue-500',    light: 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-450 border-blue-100 dark:border-blue-900/20'     },
];

const typeStyle = (type) =>
  TYPES.find(t => t.label === type)?.light ?? 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-white/5';
const typeDot = (type) =>
  TYPES.find(t => t.label === type)?.color ?? 'bg-slate-400';

const DAYS = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function buildCalendar(year, month) {
  const first = new Date(year, month, 1).getDay();
  const last  = new Date(year, month + 1, 0).getDate();
  const prev  = new Date(year, month, 0).getDate();
  const days  = [];
  for (let i = first - 1; i >= 0; i--) days.push({ day: prev - i, cur: false });
  for (let i = 1; i <= last; i++)      days.push({ day: i, cur: true });
  const rem = 42 - days.length;
  for (let i = 1; i <= rem; i++)       days.push({ day: i, cur: false });
  return days;
}

const EMPTY = { name: '', holiday_date: '', type: 'Public' };

// Safely extract YYYY-MM-DD from either a string or a JS Date object
const toDateStr = (val) => {
  if (!val) return '';
  if (typeof val === 'string') return val.split('T')[0];
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return String(val).split('T')[0];
};

export default function AdminCalendar() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  const [holidays, setHolidays]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [curDate, setCurDate]       = useState(new Date(2026, 4, 1));
  const [filter, setFilter]         = useState('All');
  const [modal, setModal]           = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(EMPTY);
  const [deleteId, setDeleteId]     = useState(null);
  const [toast, setToast]           = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Holiday PDF State
  const [pdfUrl, setPdfUrl] = useState(null);
  const [pdfUploading, setPdfUploading] = useState(false);
  const pdfInputRef = useRef(null);

  const year  = curDate.getFullYear();
  const month = curDate.getMonth();
  const days  = buildCalendar(year, month);
  const today = new Date();

  useEffect(() => { 
    fetchHolidays(); 
    fetchPdfUrl();
  }, []);

  async function fetchPdfUrl() {
    try {
      const { data } = await axios.get(`${API_BASE}/holidays/pdf`);
      setPdfUrl(data.pdfUrl);
    } catch (err) {
      console.error(err);
    }
  }

  async function handlePdfUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const uploadData = new FormData();
    uploadData.append('image', file);
    setPdfUploading(true);
    showToast('Uploading PDF…', 'info');
    try {
      const { data } = await axios.post(`${API_BASE}/uploads/image`, uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const fileUrl = data.imageUrl;
      await axios.post(`${API_BASE}/holidays/pdf`, { pdfUrl: fileUrl });
      setPdfUrl(fileUrl);
      showToast('Official Holiday PDF updated successfully ✓');
    } catch (err) {
      console.error(err);
      showToast('PDF upload failed', 'error');
    } finally {
      setPdfUploading(false);
      if (pdfInputRef.current) pdfInputRef.current.value = '';
    }
  }

  async function fetchHolidays() {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/holidays`);
      setHolidays(data);
    } catch { showToast('Failed to load holidays', 'error'); }
    finally { setLoading(false); }
  }

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  }

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY, holiday_date: `${year}-${String(month+1).padStart(2,'0')}-01` });
    setModal(true);
  }

  function openEdit(h) {
    setEditing(h);
    setForm({ name: h.name, holiday_date: toDateStr(h.holiday_date), type: h.type });
    setModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editing) {
        await axios.put(`${API_BASE}/holidays/${editing.id}`, form);
        showToast('Holiday updated successfully ✓');
      } else {
        await axios.post(`${API_BASE}/holidays`, form);
        showToast('Holiday created successfully ✓');
      }
      setModal(false);
      fetchHolidays();
    } catch { showToast('Failed to save holiday', 'error'); }
    finally { setSubmitting(false); }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      await axios.delete(`${API_BASE}/holidays/${deleteId}`);
      showToast('Holiday deleted');
      setDeleteId(null);
      fetchHolidays();
    } catch { showToast('Delete failed', 'error'); }
  }

  function getHoliday(day, cur) {
    if (!cur) return null;
    const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const h  = holidays.find(h => toDateStr(h.holiday_date) === ds);
    if (!h) return null;
    if (filter !== 'All' && h.type !== filter) return null;
    return h;
  }

  const upcoming = holidays
    .filter(h => toDateStr(h.holiday_date) >= today.toISOString().split('T')[0])
    .sort((a,b) => toDateStr(a.holiday_date).localeCompare(toDateStr(b.holiday_date)))
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] pb-20 transition-colors duration-350">

      {/* ── TOAST ── */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }}
            className={`fixed top-8 right-8 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl text-white font-bold text-sm ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}
          >
            {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <Check className="w-5 h-5" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* HERO BANNER */}
      <div className="px-4 sm:px-8 pt-4 sm:pt-8">
        <div className="relative h-[220px] sm:h-[300px] md:h-[350px] w-full overflow-hidden rounded-[24px] sm:rounded-[36px] shadow-xl group">
          <img 
            src="/admin_calendar_cover.png" 
            alt="Calendar" 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/50 to-transparent"/>
          <div className="absolute inset-0 flex items-center px-6 sm:px-10 md:px-16">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-amber-500/20 backdrop-blur-md border border-amber-500/30 rounded-full mb-2.5 sm:mb-3.5">
                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"/>
                <span className="text-[8px] font-black text-amber-400 uppercase tracking-[3px]">Scheduler Operations</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-tighter leading-none mb-2">
                Calendar &amp; <span className="text-brand-red">Holiday Control</span>
              </h1>
              <p className="text-white/60 text-xs sm:text-sm font-medium leading-relaxed max-w-lg hidden sm:block">
                Configure corporate holidays, mercantile days, special team events, and global group operations calendars effortlessly.
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-8 md:px-10 -mt-10 sm:-mt-16 relative z-10">

        {/* Title Action Bar */}
        <div className="bg-white dark:bg-[#131B2E] p-5 sm:p-7 rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-lg font-black text-slate-800 dark:text-white tracking-tight">Enterprise Schedule</h2>
            <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">Control administrative calendar entries & holiday parameters.</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button onClick={fetchHolidays} className="p-3 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-slate-400 hover:text-brand-red dark:text-slate-500 dark:hover:text-white transition-all flex-1 sm:flex-none flex justify-center items-center shadow-sm">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {isSuperAdmin && (
              <button 
                onClick={openAdd}
                className="bg-brand-red text-white px-7 py-3.5 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2.5 shadow-lg shadow-brand-red/20 hover:scale-105 active:scale-95 transition-all flex-[3] sm:flex-none"
              >
                <Plus className="w-4 h-4" /> Add Holiday
              </button>
            )}
          </div>
        </div>

        {/* ── TYPE FILTERS ── */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto no-scrollbar pb-2">
          {['All', ...TYPES.map(t => t.label)].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${filter === f ? 'bg-slate-900 dark:bg-brand-red border-slate-900 dark:border-brand-red text-white shadow-md' : 'bg-white dark:bg-[#131B2E] border-slate-100 dark:border-white/5 text-slate-500 dark:text-slate-400 hover:border-slate-350 dark:hover:border-white/20'}`}
            >
              {f !== 'All' && <span className={`w-1.5 h-1.5 rounded-full ${typeDot(f)}`} />}
              {f}
            </button>
          ))}
        </div>

        {/* ── MAIN GRID ── */}
        <div className="grid grid-cols-12 gap-6 sm:gap-8">

        {/* Calendar */}
        <div className="col-span-12 lg:col-span-9">
          <div className="bg-white dark:bg-[#131B2E] rounded-[40px] border border-slate-100 dark:border-white/5 shadow-[0_8px_48px_rgba(0,0,0,0.04)] overflow-hidden">
            {/* Nav */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-slate-50 dark:border-white/5">
              <div className="flex items-center gap-4">
                <button onClick={() => setCurDate(new Date(year, month-1, 1))} className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition-all">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight min-w-[200px] text-center">
                  {MONTHS[month]} <span className="text-brand-red">{year}</span>
                </h2>
                <button onClick={() => setCurDate(new Date(year, month+1, 1))} className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 transition-all">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              <button
                onClick={() => setCurDate(new Date())}
                className="px-5 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
              >
                Today
              </button>
            </div>

            {/* Day Headers */}
            <div className="grid grid-cols-7 bg-slate-50/40 dark:bg-white/5 border-b border-slate-50 dark:border-white/5">
              {DAYS.map(d => (
                <div key={d} className="py-5 text-center text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[3px]">{d}</div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7">
              {days.map((d, i) => {
                const h = getHoliday(d.day, d.cur);
                const isToday = d.cur && d.day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                return (
                  <div
                    key={i}
                    onClick={() => { if (h && isSuperAdmin) openEdit(h); }}
                    className={`min-h-[120px] p-4 border-b border-r border-slate-50 dark:border-white/5 flex flex-col transition-colors ${!d.cur ? 'opacity-20' : ''} ${h && isSuperAdmin ? 'cursor-pointer hover:bg-slate-50/60 dark:hover:bg-white/5' : ''}`}
                  >
                    <span className={`text-lg font-black mb-2 leading-none ${isToday ? 'text-brand-red' : i % 7 === 0 || i % 7 === 6 ? 'text-red-400 dark:text-red-400/90' : 'text-slate-700 dark:text-slate-300'}`}>
                      {d.day}
                    </span>
                    {h && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        className={`mt-auto w-full p-2 rounded-xl border text-center group ${typeStyle(h.type)}`}
                      >
                        <p className="text-[7px] font-black uppercase tracking-widest mb-0.5 opacity-70">{h.type}</p>
                        <p className="text-[9px] font-black leading-tight truncate">{h.name}</p>
                        {isSuperAdmin && (
                          <div className="flex items-center justify-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={e => { e.stopPropagation(); openEdit(h); }}
                              className="p-1 bg-white/70 dark:bg-slate-800/80 rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-all text-slate-805 dark:text-white"
                              title="Edit"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={e => { e.stopPropagation(); setDeleteId(h.id); }}
                              className="p-1 bg-white/70 dark:bg-slate-800/80 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-red-500 transition-all"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="col-span-12 lg:col-span-3 space-y-6">

          {/* Official PDF Calendar Upload (Admin Only) */}
          <div className="bg-white dark:bg-[#131B2E] rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm p-7 space-y-5">
            <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-red" /> Official PDF Calendar
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold leading-relaxed">
              Upload the official George Steuart Group holiday calendar PDF for employee view and download.
            </p>
            
            {pdfUrl ? (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-white/5 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-2">Current Calendar</p>
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-black text-brand-red hover:underline flex items-center gap-1 max-w-full truncate">
                    <Download className="w-3.5 h-3.5 shrink-0" />
                    Open PDF File
                  </a>
                </div>
                <button 
                  type="button"
                  onClick={() => pdfInputRef.current?.click()}
                  className="p-2 bg-white dark:bg-slate-700 rounded-xl hover:text-brand-red transition-all border border-slate-100 dark:border-white/5 shadow-sm text-slate-400 shrink-0"
                  title="Replace PDF"
                >
                  <Upload className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                type="button"
                onClick={() => pdfInputRef.current?.click()}
                disabled={pdfUploading}
                className="w-full py-4.5 bg-slate-50 dark:bg-[#0B0F19]/50 border border-dashed border-slate-200 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center text-center hover:border-brand-red dark:hover:border-brand-red/40 transition-all cursor-pointer group"
              >
                <Upload className="w-6 h-6 text-slate-350 dark:text-slate-600 group-hover:text-brand-red group-hover:scale-115 transition-all mb-2" />
                <span className="text-xs font-black text-slate-700 dark:text-slate-205">Upload Holiday PDF</span>
                <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Click to select file</span>
              </button>
            )}

            <input 
              type="file" 
              ref={pdfInputRef}
              accept="application/pdf"
              onChange={handlePdfUpload}
              className="hidden"
            />
          </div>

          {/* Legend */}
          <div className="bg-white dark:bg-[#131B2E] rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm p-7">
            <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight mb-6 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-brand-red" /> Legend
            </h3>
            <div className="space-y-3">
              {TYPES.map(t => (
                <div key={t.label} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${t.color}`} />
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{t.label} Holiday</span>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming */}
          <div className="bg-white dark:bg-[#131B2E] rounded-[32px] border border-slate-100 dark:border-white/5 shadow-sm p-7">
            <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight mb-6 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-red" /> Upcoming
            </h3>
            <div className="space-y-5">
              {upcoming.length === 0 && (
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">No upcoming holidays found.</p>
              )}
              {upcoming.map((h, i) => (
                <div key={i} className={`flex items-start gap-3 group ${isSuperAdmin ? 'cursor-pointer' : ''}`} onClick={() => { if (isSuperAdmin) openEdit(h); }}>
                  <div className={`w-2.5 h-2.5 rounded-full mt-1 shrink-0 ${typeDot(h.type)}`} />
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-0.5">
                      {new Date(toDateStr(h.holiday_date) + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <p className="text-xs font-bold text-slate-805 dark:text-slate-300 group-hover:text-brand-red transition-colors truncate">{h.name}</p>
                  </div>
                  {isSuperAdmin && (
                    <button
                      onClick={e => { e.stopPropagation(); setDeleteId(h.id); }}
                      className="ml-auto p-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 dark:text-slate-600 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-slate-900 dark:bg-[#131B2E] border dark:border-white/5 rounded-[32px] p-7 text-white">
            <p className="text-[10px] font-black uppercase tracking-[3px] text-white/40 dark:text-slate-500 mb-4">This Month</p>
            <p className="text-5xl font-black tracking-tight">
              {holidays.filter(h => {
                const ds = toDateStr(h.holiday_date);
                return parseInt(ds.slice(5,7),10) - 1 === month && parseInt(ds.slice(0,4),10) === year;
              }).length}
            </p>
            <p className="text-xs font-bold text-white/40 dark:text-slate-500 mt-1">holidays recorded</p>
            <div className="mt-6 pt-6 border-t border-white/10 dark:border-white/5">
              <p className="text-[10px] font-black uppercase tracking-[3px] text-white/40 dark:text-slate-500 mb-1">Total Active</p>
              <p className="text-2xl font-black">{holidays.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── ADD / EDIT MODAL ── */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setModal(false)}
              className="absolute inset-0 bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="relative w-full max-w-lg bg-white dark:bg-[#131B2E] border border-slate-100 dark:border-white/5 rounded-[36px] shadow-2xl overflow-hidden z-10"
            >
              <div className="p-10">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {editing ? 'Edit Holiday' : 'Add Holiday'}
                    </h3>
                    <p className="text-slate-400 dark:text-slate-500 text-sm font-medium mt-1">
                      {editing ? 'Update the holiday details below.' : 'Fill in the details for the new holiday.'}
                    </p>
                  </div>
                  <button onClick={() => setModal(false)} className="p-3 bg-slate-50 dark:bg-white/5 rounded-2xl text-slate-400 hover:text-slate-800 dark:hover:text-white transition-all">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Holiday Name</label>
                    <input
                      required
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      placeholder="e.g. Sinhala & Tamil New Year"
                      className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl font-bold text-slate-800 dark:text-white focus:ring-4 focus:ring-brand-red/5 outline-none transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Date</label>
                      <input
                        required
                        type="date"
                        value={form.holiday_date}
                        onChange={e => setForm({ ...form, holiday_date: e.target.value })}
                        className="w-full px-6 py-4 bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 rounded-2xl font-bold text-slate-805 dark:text-white focus:ring-4 focus:ring-brand-red/5 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">Type</label>
                      <select
                        value={form.type}
                        onChange={e => setForm({ ...form, type: e.target.value })}
                        className="w-full px-6 py-4 bg-slate-50 dark:bg-[#131B2E] border border-slate-100 dark:border-white/10 rounded-2xl font-bold text-slate-800 dark:text-white focus:ring-4 focus:ring-brand-red/5 outline-none transition-all cursor-pointer"
                      >
                        {TYPES.map(t => <option key={t.label} value={t.label}>{t.label}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Preview badge */}
                  <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border ${typeStyle(form.type)}`}>
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${typeDot(form.type)}`} />
                    <span className="text-xs font-bold">{form.name || 'Holiday name preview'}</span>
                    <span className="ml-auto text-[10px] font-black uppercase tracking-widest opacity-60">{form.type}</span>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button type="button" onClick={() => setModal(false)} className="flex-1 py-4 bg-slate-50 dark:bg-white/5 text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-[2] py-4 bg-brand-red text-white rounded-2xl font-black uppercase tracking-widest hover:bg-brand-red/90 transition-all shadow-xl shadow-brand-red/20 disabled:opacity-60"
                    >
                      {submitting ? 'Saving…' : editing ? 'Update Holiday' : 'Create Holiday'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── DELETE CONFIRM ── */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeleteId(null)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white dark:bg-[#131B2E] border border-slate-100 dark:border-white/5 rounded-[32px] shadow-2xl p-10 max-w-sm w-full text-center z-10"
            >
              <div className="w-16 h-16 bg-red-50 dark:bg-red-950/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-100 dark:border-red-900/30">
                <Trash2 className="w-7 h-7 text-brand-red" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">Delete Holiday?</h3>
              <p className="text-slate-400 dark:text-slate-500 text-sm font-medium mb-8">This action will remove the holiday from the calendar. It cannot be undone.</p>
              <div className="flex gap-4">
                <button onClick={() => setDeleteId(null)} className="flex-1 py-4 bg-slate-50 dark:bg-white/5 text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
                  Cancel
                </button>
                <button onClick={confirmDelete} className="flex-1 py-4 bg-brand-red text-white rounded-2xl font-black uppercase tracking-widest hover:bg-brand-red/90 transition-all shadow-xl shadow-brand-red/20">
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      </div>

      {/* ── LOADING OVERLAY ── */}
      {loading && (
        <div className="fixed inset-0 bg-white/80 dark:bg-[#0B0F19]/80 backdrop-blur-xl z-[100] flex items-center justify-center transition-colors">
          <div className="flex flex-col items-center gap-4">
            <div className="w-14 h-14 border-4 border-slate-100 dark:border-white/5 border-t-brand-red dark:border-t-brand-red rounded-full animate-spin" />
            <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-[4px] animate-pulse">Loading Calendar</p>
          </div>
        </div>
      )}
    </div>
  );
}
