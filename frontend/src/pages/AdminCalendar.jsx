import { useState, useEffect, useRef } from 'react';
import AdminPageHeader from '../components/AdminPageHeader';
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
  { label: 'Public',      color: 'bg-emerald-500', light: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30' },
  { label: 'Poya',        color: 'bg-purple-500',  light: 'bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900/30'  },
  { label: 'Mercantile',  color: 'bg-amber-500',   light: 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/30'   },
  { label: 'Group',       color: 'bg-blue-500',    light: 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900/30'     },
];

const typeStyle = (type) =>
  TYPES.find(t => t.label === type)?.light ?? 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-white/10';
const typeDot = (type) =>
  TYPES.find(t => t.label === type)?.color ?? 'bg-slate-400';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
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
  const isSuperOrGroupAdmin = user?.role === 'superadmin' || user?.role === 'super_admin' || user?.role === 'groupadmin' || user?.role === 'group_admin';

  const [holidays, setHolidays]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [curDate, setCurDate]       = useState(new Date());
  const [filter, setFilter]         = useState('All');
  const [viewMode, setViewMode]     = useState('Month'); // 'Month' | 'Week' | 'Day'
  const [modal, setModal]           = useState(false);
  const [editing, setEditing]       = useState(null);
  const [form, setForm]             = useState(EMPTY);
  const [deleteId, setDeleteId]     = useState(null);
  const [toast, setToast]           = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const year  = curDate.getFullYear();
  const month = curDate.getMonth();
  const days  = buildCalendar(year, month);
  const today = new Date();

  useEffect(() => { 
    fetchHolidays(); 
  }, []);

  async function fetchHolidays() {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/holidays`);
      setHolidays(data || []);
    } catch { 
      showToast('Failed to load calendar events', 'error'); 
    } finally { 
      setLoading(false); 
    }
  }

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  function openAdd() {
    setEditing(null);
    setForm({ ...EMPTY, holiday_date: `${year}-${String(month+1).padStart(2,'0')}-01` });
    setModal(true);
  }

  function openEdit(h) {
    setEditing(h);
    setForm({ name: h.name, holiday_date: toDateStr(h.holiday_date), type: h.type || 'Public' });
    setModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.holiday_date) {
      showToast('Title and Date are required', 'error');
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        await axios.put(`${API_BASE}/holidays/${editing.id}`, form);
        showToast('Calendar event updated successfully ✓');
      } else {
        await axios.post(`${API_BASE}/holidays`, form);
        showToast('Event added to calendar ✓');
      }
      setModal(false);
      fetchHolidays();
    } catch (err) {
      showToast('Failed to save event', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      await axios.delete(`${API_BASE}/holidays/${deleteId}`);
      showToast('Event removed from calendar ✓');
      setDeleteId(null);
      fetchHolidays();
    } catch {
      showToast('Failed to delete event', 'error');
    }
  }

  const getHoliday = (dayNum, isCurMonth) => {
    if (!isCurMonth) return null;
    const targetStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    const found = holidays.filter(h => toDateStr(h.holiday_date) === targetStr);
    if (!found.length) return null;
    if (filter === 'All') return found;
    return found.filter(h => h.type === filter);
  };

  return (
    <div className="min-h-screen pb-16">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 right-6 z-[200] px-5 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-white font-semibold text-xs ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}
          >
            {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header matching screenshot */}
      <AdminPageHeader
        icon={Calendar}
        title="Calendar Manager"
        description="Manage company events, holidays and important dates."
        actions={
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-brand-red hover:bg-[#a50f28] text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Event
          </button>
        }
      />

      {/* Calendar Controls Bar matching screenshot */}
      <div className="bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-white/5 rounded-2xl p-4 shadow-sm mb-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Today & Nav Arrows */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurDate(new Date())}
            className="px-4 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-all shadow-sm"
          >
            Today
          </button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurDate(new Date(year, month - 1, 1))}
              className="p-2 border border-slate-200 dark:border-white/10 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurDate(new Date(year, month + 1, 1))}
              className="p-2 border border-slate-200 dark:border-white/10 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5 transition-all shadow-sm"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center: Month & Year matching screenshot */}
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          {MONTHS[month]} {year}
        </h2>

        {/* Right: View Toggles & Filter Chips */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl border border-slate-200/60 dark:border-white/5">
            {['Month', 'Week', 'Day'].map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === m
                    ? 'bg-white dark:bg-[#1A233A] text-brand-red font-bold shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          <button
            onClick={fetchHolidays}
            className="p-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-500 hover:text-brand-red hover:bg-slate-50 transition-all shadow-sm"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Category Chips */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
        {['All', ...TYPES.map(t => t.label)].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border shrink-0 flex items-center gap-1.5 ${
              filter === f
                ? 'bg-brand-red border-brand-red text-white shadow-sm'
                : 'bg-white dark:bg-[#131B2E] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-slate-300'
            }`}
          >
            {f !== 'All' && <span className={`w-2 h-2 rounded-full ${typeDot(f)}`} />}
            {f}
          </button>
        ))}
      </div>

      {/* Main Calendar Grid matching screenshot */}
      <div className="bg-white dark:bg-[#131B2E] border border-slate-200/80 dark:border-white/5 rounded-2xl shadow-sm overflow-hidden">
        {/* Day Header Row */}
        <div className="grid grid-cols-7 border-b border-slate-100 dark:border-white/5 bg-slate-50/60 dark:bg-white/[0.02]">
          {DAYS.map((d) => (
            <div
              key={d}
              className="py-3 text-center text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Days Matrix */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 dark:divide-white/5">
          {days.map((d, i) => {
            const hList = getHoliday(d.day, d.cur);
            const isToday = d.cur && d.day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
            const isWeekend = i % 7 === 0 || i % 7 === 6;

            return (
              <div
                key={i}
                className={`min-h-[110px] sm:min-h-[125px] p-2.5 flex flex-col transition-colors ${
                  !d.cur ? 'bg-slate-50/30 dark:bg-white/[0.01] opacity-30' : 'hover:bg-slate-50/50 dark:hover:bg-white/[0.02]'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                      isToday
                        ? 'bg-brand-red text-white shadow-sm'
                        : isWeekend
                        ? 'text-red-500'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {d.day}
                  </span>
                </div>

                {/* Event Pills */}
                <div className="space-y-1 mt-auto">
                  {hList && hList.map((h) => (
                    <div
                      key={h.id}
                      onClick={() => openEdit(h)}
                      className={`p-1.5 rounded-lg border text-left cursor-pointer group hover:scale-[1.02] transition-all ${typeStyle(h.type)}`}
                      title={`${h.name} (${h.type})`}
                    >
                      <p className="text-[10px] font-bold leading-tight truncate">
                        {h.name}
                      </p>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-[8px] font-semibold uppercase opacity-70">
                          {h.type}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(h.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-0.5"
                          title="Delete"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add / Edit Event Modal */}
      <AnimatePresence>
        {modal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModal(false)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white dark:bg-[#131B2E] rounded-2xl shadow-2xl border border-slate-100 dark:border-white/10 overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-brand-red/10 border border-brand-red/20 text-brand-red flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {editing ? 'Edit Calendar Event' : 'Add Calendar Event'}
                    </h3>
                    <p className="text-xs text-slate-500">Configure corporate holiday or special date</p>
                  </div>
                </div>
                <button
                  onClick={() => setModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Event / Holiday Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Sinhala & Tamil New Year or Annual Board Meeting"
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-brand-red/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={form.holiday_date}
                    onChange={(e) => setForm({ ...form, holiday_date: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-brand-red/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Classification
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-white outline-none"
                  >
                    {TYPES.map(t => (
                      <option key={t.label} value={t.label}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl bg-brand-red hover:bg-[#a50f28] text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Saving...' : editing ? 'Save Changes' : 'Add Event'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteId(null)}
              className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#131B2E] rounded-2xl shadow-2xl p-6 text-center border border-slate-100"
            >
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Delete Event?</h3>
              <p className="text-xs text-slate-500 mb-5">This event will be removed from all group calendars.</p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold"
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
