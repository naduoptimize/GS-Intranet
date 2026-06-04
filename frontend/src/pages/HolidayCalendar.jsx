import { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  Clock, 
  MapPin, 
  Info,
  ExternalLink,
  Search,
  Sparkles,
  FileText,
  MoreVertical,
  Plus,
  Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const HolidayCalendar = () => {
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 4, 1)); // Start at May 2026 as per image
  const [selectedType, setSelectedType] = useState('All');
  const [pdfUrl, setPdfUrl] = useState(null);

  useEffect(() => {
    const fetchHolidays = async () => {
      try {
        const response = await axios.get(`${API_BASE}/holidays`);
        setHolidays(response.data);
      } catch (err) {
        console.error('Failed to fetch holidays', err);
      } finally {
        setLoading(false);
      }
    };
    const fetchPdfUrl = async () => {
      try {
        const response = await axios.get(`${API_BASE}/holidays/pdf`);
        setPdfUrl(response.data.pdfUrl);
      } catch (err) {
        console.error('Failed to fetch PDF URL', err);
      }
    };
    fetchHolidays();
    fetchPdfUrl();
  }, []);

  const types = [
    { name: 'All', color: 'bg-slate-900', text: 'text-white' },
    { name: 'Company Holidays', color: 'bg-blue-500', text: 'text-white', type: 'Mercantile' },
    { name: 'Public Holidays', color: 'bg-emerald-500', text: 'text-white', type: 'Public' },
    { name: 'Poya Days', color: 'bg-purple-500', text: 'text-white', type: 'Poya' },
    { name: 'Mercantile Holidays', color: 'bg-amber-500', text: 'text-white', type: 'Mercantile' },
    { name: 'Group Holidays', color: 'bg-rose-500', text: 'text-white', type: 'Group' }
  ];

  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  const getDaysInMonth = (year, month) => {
    const date = new Date(year, month, 1);
    const days = [];
    const firstDay = date.getDay();
    
    // Fill previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: prevMonthLastDay - i, currentMonth: false });
    }
    
    // Fill current month days
    const lastDay = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= lastDay; i++) {
      days.push({ day: i, currentMonth: true });
    }
    
    // Fill next month days
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, currentMonth: false });
    }
    
    return days;
  };

  const [showMonthPicker, setShowMonthPicker] = useState(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const calendarDays = getDaysInMonth(currentYear, currentMonth);

  const prevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  const setToday = () => {
    setCurrentDate(new Date());
    setShowMonthPicker(false);
  };

  const handleMonthSelect = (monthIndex) => {
    setCurrentDate(new Date(currentYear, monthIndex, 1));
    setShowMonthPicker(false);
  };

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

  const getHolidayForDay = (day, isCurrentMonth) => {
    if (!isCurrentMonth) return null;
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const holiday = holidays.find(h => toDateStr(h.holiday_date) === dateStr);
    if (holiday && (selectedType === 'All' || holiday.type === (types.find(t => t.name === selectedType)?.type || ''))) {
      return holiday;
    }
    return null;
  };

  const today0 = new Date().toISOString().split('T')[0];
  const upcomingHolidays = holidays
    .filter(h => toDateStr(h.holiday_date) >= today0)
    .sort((a, b) => toDateStr(a.holiday_date).localeCompare(toDateStr(b.holiday_date)))
    .slice(0, 4);  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 px-10">
      
      {/* ── HEADER SECTION ── */}
      <div className="flex items-center justify-between py-10">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Calendar</h1>
          <p className="text-sm text-slate-400 font-medium mt-1">Stay aligned with official schedules, public holidays, and poya days.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white border border-slate-100 rounded-xl p-1 shadow-sm">
            <button onClick={setToday} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-all">Today</button>
            <div className="flex items-center border-l border-slate-100 ml-1 pl-1">
              <button onClick={prevMonth} className="p-2 text-slate-400 hover:text-slate-900 transition-all"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={nextMonth} className="p-2 text-slate-400 hover:text-slate-900 transition-all"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setShowMonthPicker(!showMonthPicker)}
              className={`bg-white border border-slate-100 rounded-xl px-5 py-2.5 flex items-center gap-4 shadow-sm transition-all hover:border-slate-300 ${showMonthPicker ? 'ring-4 ring-brand-red/5 border-brand-red/20' : ''}`}
            >
              <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">
                {currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${showMonthPicker ? 'rotate-180 text-brand-red' : ''}`} />
            </button>

            {/* MONTH PICKER DROPDOWN */}
            <AnimatePresence>
              {showMonthPicker && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMonthPicker(false)} />
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full mt-3 right-0 w-64 bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-slate-100 p-4 z-50 grid grid-cols-2 gap-2"
                  >
                    <div className="col-span-2 px-2 py-2 mb-1 border-b border-slate-50">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Month <span className="text-brand-red ml-1">{currentYear}</span></p>
                    </div>
                    {months.map((month, idx) => (
                      <button
                        key={month}
                        onClick={() => handleMonthSelect(idx)}
                        className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${currentMonth === idx ? 'bg-brand-red text-white shadow-lg shadow-brand-red/20' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
                      >
                        {month.substring(0, 3)}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center bg-slate-900 rounded-xl p-1 shadow-lg">
            <button className="px-5 py-2.5 bg-white text-slate-900 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">Month</button>
            <button className="px-5 py-2.5 text-white/50 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">Week</button>
            <button className="px-5 py-2.5 text-white/50 hover:text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all">List</button>
          </div>

          <button className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-red transition-all shadow-lg">
            <Filter className="w-4 h-4" /> Filter
          </button>
        </div>
      </div>

      {/* ── LEGEND / TYPE FILTERS ── */}
      <div className="flex items-center gap-3 mb-10 overflow-x-auto no-scrollbar pb-2">
        {types.map((t) => (
          <button
            key={t.name}
            onClick={() => setSelectedType(t.name)}
            className={`flex items-center gap-2.5 px-6 py-3 rounded-full border transition-all whitespace-nowrap ${selectedType === t.name ? 'bg-slate-900 border-slate-900 text-white shadow-xl translate-y-[-2px]' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'}`}
          >
            {t.name !== 'All' && <div className={`w-2 h-2 rounded-full ${t.color}`} />}
            <span className="text-[10px] font-black uppercase tracking-widest">{t.name}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-10">
        
        {/* ── MAIN CALENDAR GRID ── */}
        <div className="col-span-9">
          <div className="bg-white rounded-[40px] border border-slate-100 shadow-[0_8px_48px_rgba(0,0,0,0.04)] overflow-hidden">
            <div className="grid grid-cols-7 border-b border-slate-50 bg-slate-50/30">
              {daysOfWeek.map(day => (
                <div key={day} className="py-6 text-center text-[10px] font-black text-slate-400 uppercase tracking-[4px]">{day}</div>
              ))}
            </div>
            
            <div className="grid grid-cols-7">
              {calendarDays.map((date, i) => {
                const holiday = getHolidayForDay(date.day, date.currentMonth);
                const isToday = date.day === new Date().getDate() && currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear() && date.currentMonth;
                
                return (
                  <div key={i} className={`min-h-[140px] p-6 border-b border-r border-slate-50 flex flex-col items-center group transition-colors hover:bg-slate-50/50 ${!date.currentMonth ? 'opacity-20 bg-slate-50/20' : ''}`}>
                    <span className={`text-xl font-black mb-2 ${isToday ? 'text-brand-red' : date.day === 1 || i % 7 === 0 || i % 7 === 6 ? 'text-red-400' : 'text-slate-800'}`}>
                      {date.day}
                    </span>
                    
                    {holiday && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full mt-auto"
                      >
                        <div className={`p-2 rounded-xl text-center shadow-sm border ${
                          holiday.type === 'Poya' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                          holiday.type === 'Public' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          holiday.type === 'Mercantile' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                          'bg-blue-50 text-blue-600 border-blue-100'
                        }`}>
                          <p className="text-[8px] font-black uppercase tracking-widest mb-1">{holiday.type} Day</p>
                          <p className="text-[10px] font-black leading-tight truncate">{holiday.name}</p>
                        </div>
                      </motion.div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          

        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div className="col-span-3 space-y-8">
          
          {/* Upcoming Events */}
          <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Upcoming Events</h3>
              <button className="text-[10px] font-black text-brand-red uppercase tracking-widest hover:underline transition-all">View all</button>
            </div>
            
            <div className="space-y-8">
              {upcomingHolidays.map((h, i) => (
                <div key={i} className="flex gap-4 group cursor-pointer">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    h.type === 'Poya' ? 'bg-purple-500' :
                    h.type === 'Public' ? 'bg-emerald-500' :
                    h.type === 'Mercantile' ? 'bg-amber-500' :
                    'bg-blue-500'
                  }`} />
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="text-xs font-black text-slate-900">{new Date(h.holiday_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${
                        h.type === 'Poya' ? 'bg-purple-50 text-purple-600' :
                        h.type === 'Public' ? 'bg-emerald-50 text-emerald-600' :
                        h.type === 'Mercantile' ? 'bg-amber-50 text-amber-600' :
                        'bg-blue-50 text-blue-600'
                      }`}>{h.type} Holiday</span>
                    </div>
                    <p className="text-xs font-medium text-slate-500 leading-relaxed group-hover:text-brand-red transition-colors">{h.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Calendar Legend */}
          <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm p-8">
            <h3 className="text-lg font-black text-slate-900 tracking-tight mb-8">Calendar Legend</h3>
            <div className="space-y-4">
              {types.slice(1).map((t) => (
                <div key={t.name} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${t.color}`} />
                  <span className="text-[11px] font-bold text-slate-500">{t.name}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2.5 mt-8">
              {pdfUrl && (
                <a 
                  href={pdfUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-brand-red text-white hover:bg-brand-red/90 transition-all rounded-xl text-[9px] font-black uppercase tracking-wider shadow-md hover:shadow-lg cursor-pointer whitespace-nowrap"
                >
                  <FileText className="w-3.5 h-3.5 text-white shrink-0" />
                  Download Holiday PDF
                </a>
              )}
            </div>
          </div>

        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-xl z-[100] flex items-center justify-center">
          <div className="flex flex-col items-center">
             <div className="w-16 h-16 border-4 border-slate-100 border-t-brand-red rounded-full animate-spin mb-6" />
             <p className="text-xs font-black text-slate-400 uppercase tracking-[5px] animate-pulse">Syncing Calendar</p>
          </div>
        </div>
      )}

    </div>
  );
};

// Simple utility component for the header
const ChevronDown = ({ className }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
);


export default HolidayCalendar;
