import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, ChevronLeft, ChevronRight, Grid2X2, List, Mail, MapPin, Network,
  MessageSquare, Phone, RefreshCw, Search, SlidersHorizontal, Users, X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = 'http://localhost:5000/api';
const PAGE_SIZE = 12;

const avatarUrl = (employee) => employee.profile_pic || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.full_name || 'Employee')}&background=C41230&color=fff&bold=true`;
const roleLabel = (role) => ({
  superadmin: 'Super Admin', super_admin: 'Super Admin', groupadmin: 'Group Admin',
  group_admin: 'Group Admin', subadmin: 'Sub Admin', sub_admin: 'Sub Admin', employee: 'Employee',
}[role] || role?.replaceAll('_', ' ') || 'Employee');

const BOARD = [
  { name: 'Varuni Fernando', title: 'Director', image: 'https://georgesteuart.lk/img/Varuni-Fernando.jpg' },
  { name: 'Dai Pathmananthan', title: 'Director', image: 'https://georgesteuart.lk/img/Dai-Pathmananthan.jpg' },
  { name: 'Manoj Pilimatalawwe', title: 'Director', image: 'https://georgesteuart.lk/img/Manoj-Pilimatalawwe.jpg' },
  { name: 'Eran Ranasinghe', title: 'Director', image: 'https://georgesteuart.lk/img/Eran-Ranasinghe.jpg' },
  { name: 'Channe Wijemanne', title: 'Director', image: 'https://georgesteuart.lk/img/channe-wijemanne1.jpg' },
];

const OFFICIAL_LEADERS = [
  { match: ['tea'], name: 'Dilukshan Fernando', title: 'COO / Director Sales, GS Teas', image: 'https://georgesteuart.lk/img/Dilukshan-Fernando.jpg' },
  { match: ['hva', 'food'], name: 'Graham Stork', title: 'Director / CEO, HVA Foods', image: 'https://georgesteuart.lk/img/Graham-Stork.jpg' },
  { match: ['health'], name: 'Eran Ranasinghe', title: 'Managing Director, GS Health', image: 'https://georgesteuart.lk/img/Eran-Ranasinghe-sm.jpg' },
  { match: ['citrus', 'leisure'], name: 'Chandana Talwatte', title: 'Director / CEO, Citrus Group', image: 'https://georgesteuart.lk/img/Chandana-Talwatte.jpg' },
  { match: ['insurance'], name: 'T. S. Arulanandan', title: 'Managing Director, GS Insurance Brokers', image: 'https://georgesteuart.lk/img/T.S.-Arulanandan.jpg' },
  { match: ['asset', 'investment'], name: 'Sudath de Silva', title: 'Managing Director / CEO, GS Asset Management', image: 'https://georgesteuart.lk/img/Sudath-de-Silva.jpg' },
  { match: ['consumer'], name: 'Tharanga Wickramasinghe', title: 'Director / CEO, GS Consumer', image: 'https://georgesteuart.lk/img/Tharanga-Wickramasinghe.jpg' },
  { match: ['solution'], name: 'Suharshani Welegama', title: 'CEO, GS Solutions', image: 'https://georgesteuart.lk/img/suharshani-welegama.jpeg' },
];

const OfficialPerson = ({ person, featured = false }) => (
  <div className={`flex items-center gap-3 ${featured ? 'flex-col text-center sm:flex-row sm:text-left' : ''}`}>
    <img src={person.image} alt={person.name} onError={(event) => { event.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name)}&background=C41230&color=fff&bold=true`; }} className={`${featured ? 'h-24 w-24 rounded-[24px]' : 'h-12 w-12 rounded-2xl'} shrink-0 border-2 border-white object-cover object-top shadow-lg`} />
    <div className="min-w-0"><p className={`${featured ? 'text-lg' : 'text-[10px]'} font-black text-text-main dark:text-white`}>{person.name}</p><p className="mt-1 text-[7px] font-black uppercase tracking-[.12em] text-brand-red">{person.title}</p></div>
  </div>
);

const CompanyHierarchy = ({ employees, subsidiaries, onSelect, onOpenDirectory }) => {
  const hierarchy = subsidiaries.map((company) => {
    const members = employees.filter((employee) => Number(employee.subsidiary_id) === Number(company.id));
    const departments = [...new Set(members.map((employee) => employee.department).filter(Boolean))];
    const directoryLeader = members.find((employee) => /director|manager|head|chief|ceo/i.test(`${employee.job_title || ''} ${employee.role || ''}`));
    const companyName = company.name.toLowerCase();
    const officialLeader = OFFICIAL_LEADERS.find((leader) => leader.match.some((term) => companyName.includes(term)));
    return { ...company, members, departments, directoryLeader, officialLeader };
  });

  const chairman = { name: 'Sarva Ameresekere', title: 'Group Chairman', image: 'https://georgesteuart.lk/img/Sarva-Ameresekere.jpg' };

  return (
    <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 rounded-[26px] border border-[#E8E0D7] bg-white p-4 shadow-[0_20px_55px_-42px_rgba(94,45,51,.35)] dark:border-white/[0.07] dark:bg-[#111827] sm:p-6">
      <div className="text-center"><p className="text-[8px] font-black uppercase tracking-[.24em] text-brand-gold">Leadership structure</p><h2 className="mt-1 text-xl font-black tracking-tight text-text-main dark:text-white">George Steuart Group</h2><p className="mt-1 text-[9px] text-text-secondary">Official group leadership and subsidiary management</p></div>

      <div className="mx-auto max-w-md rounded-[24px] border border-brand-red/15 bg-gradient-to-br from-brand-red-light to-white p-5 shadow-[0_20px_50px_-35px_rgba(196,18,48,.45)] dark:from-brand-red/10 dark:to-white/[0.03]">
        <OfficialPerson person={chairman} featured />
      </div>

      <div className="mx-auto h-7 w-px bg-gradient-to-b from-brand-red to-brand-gold" />
      <div><p className="mb-3 text-center text-[8px] font-black uppercase tracking-[.2em] text-text-secondary">Board of Directors</p><div className="grid grid-cols-2 gap-2.5 md:grid-cols-5">{BOARD.map((person, index) => <motion.div key={person.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .05 }} className="rounded-2xl border border-[#EEE8E0] bg-brand-ivory/60 p-3 dark:border-white/[0.06] dark:bg-white/[0.03]"><OfficialPerson person={person} /></motion.div>)}</div></div>

      <div className="mx-auto h-7 w-px bg-gradient-to-b from-brand-gold to-brand-gold/20" />
      <div className="flex items-center gap-3"><div className="h-px flex-1 bg-[#EEE8E0] dark:bg-white/[0.06]" /><p className="text-[8px] font-black uppercase tracking-[.2em] text-brand-gold">Subsidiary leadership</p><div className="h-px flex-1 bg-[#EEE8E0] dark:bg-white/[0.06]" /></div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {hierarchy.map((company, index) => (
          <motion.article key={company.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * .035, .35) }} className="group relative rounded-[20px] border border-[#EEE8E0] bg-brand-ivory/55 p-4 transition-all hover:-translate-y-0.5 hover:border-brand-gold/50 hover:bg-white hover:shadow-[0_18px_45px_-34px_rgba(158,14,39,.3)] dark:border-white/[0.06] dark:bg-white/[0.025] dark:hover:bg-white/[0.045]">
            <div className="absolute left-1/2 top-[-21px] hidden h-5 w-px -translate-x-1/2 bg-brand-gold/25 xl:block" />
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-brand-red shadow-sm dark:bg-white/[0.07]"><Building2 className="h-4.5 w-4.5" /></div>
              <div className="min-w-0 flex-1"><h3 className="truncate text-[11px] font-black text-text-main dark:text-white">{company.name}</h3><p className="mt-1 text-[8px] font-bold uppercase tracking-wider text-text-secondary">{company.members.length} team members · {company.departments.length} departments</p></div>
              <span className="rounded-lg bg-brand-red-light px-2 py-1 text-[7px] font-black text-brand-red dark:bg-brand-red/10">{company.members.length}</span>
            </div>

            {company.officialLeader ? <div className="mt-4 rounded-xl border border-[#EEE8E0] bg-white p-2.5 dark:border-white/[0.06] dark:bg-white/[0.04]"><OfficialPerson person={company.officialLeader} /></div> : company.directoryLeader ? <button onClick={() => onSelect(company.directoryLeader)} className="mt-4 flex w-full items-center gap-3 rounded-xl border border-[#EEE8E0] bg-white p-2.5 text-left hover:border-brand-red/20 dark:border-white/[0.06] dark:bg-white/[0.04]"><img src={avatarUrl(company.directoryLeader)} alt={company.directoryLeader.full_name} className="h-9 w-9 rounded-xl object-cover" /><span className="min-w-0 flex-1"><span className="block truncate text-[9px] font-black text-text-main dark:text-white">{company.directoryLeader.full_name}</span><span className="block truncate text-[7px] font-bold uppercase text-brand-red">{company.directoryLeader.job_title || roleLabel(company.directoryLeader.role)}</span></span></button> : <p className="mt-4 rounded-xl border border-dashed border-[#E8E0D7] px-3 py-3 text-center text-[8px] text-text-secondary dark:border-white/10">Leader not listed in the official reference</p>}

            <div className="mt-3 flex flex-wrap gap-1.5">{company.departments.slice(0, 4).map((item) => <span key={item} className="rounded-lg bg-white px-2 py-1 text-[7px] font-bold text-text-secondary shadow-sm dark:bg-white/[0.05]">{item}</span>)}{company.departments.length > 4 && <span className="rounded-lg px-2 py-1 text-[7px] font-black text-brand-red">+{company.departments.length - 4} more</span>}{!company.departments.length && <span className="text-[8px] text-text-secondary">No departments listed</span>}</div>
          </motion.article>
        ))}
      </div>
      <div className="flex flex-col items-center justify-between gap-3 rounded-2xl bg-[#261F20] px-5 py-4 text-white sm:flex-row"><div><p className="text-[10px] font-black">Employee Directory</p><p className="mt-0.5 text-[8px] text-white/50">Continue from leadership to all {employees.length.toLocaleString()} employee profiles.</p></div><button onClick={onOpenDirectory} className="flex items-center gap-2 rounded-xl bg-brand-red px-3 py-2 text-[8px] font-black uppercase tracking-wider transition-colors hover:bg-brand-red-dark"><Users className="h-3.5 w-3.5" />Open full directory</button></div>
    </motion.section>
  );
};

const EmployeeDirectory = () => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [subsidiaries, setSubsidiaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [subsidiary, setSubsidiary] = useState('all');
  const [department, setDepartment] = useState('all');
  const [tab, setTab] = useState('all');
  const [view, setView] = useState('grid');
  const [mode, setMode] = useState('directory');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);

  const loadDirectory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [usersResult, subsidiariesResult] = await Promise.all([
        axios.get(`${API_URL}/users`),
        axios.get(`${API_URL}/subsidiaries`),
      ]);
      setEmployees(Array.isArray(usersResult.data) ? usersResult.data : []);
      setSubsidiaries(Array.isArray(subsidiariesResult.data) ? subsidiariesResult.data : []);
    } catch (requestError) {
      console.error('Failed to load employee directory', requestError);
      setError('The employee directory could not be loaded. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(loadDirectory, 0);
    return () => window.clearTimeout(timer);
  }, [loadDirectory]);

  const departments = useMemo(() => [...new Set(employees.map((employee) => employee.department).filter(Boolean))].sort(), [employees]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return employees.filter((employee) => {
      const text = [employee.full_name, employee.job_title, employee.role, employee.department, employee.subsidiary_name, employee.email]
        .filter(Boolean).join(' ').toLowerCase();
      const matchesSearch = !query || text.includes(query);
      const matchesSubsidiary = subsidiary === 'all' || String(employee.subsidiary_id) === subsidiary;
      const matchesDepartment = department === 'all' || employee.department === department;
      const matchesTab = tab !== 'mine' || Number(employee.subsidiary_id) === Number(currentUser?.subsidiary_id);
      return matchesSearch && matchesSubsidiary && matchesDepartment && matchesTab;
    });
  }, [employees, search, subsidiary, department, tab, currentUser?.subsidiary_id]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleEmployees = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const openMessage = (employee) => {
    sessionStorage.setItem('quick_chat_partner', JSON.stringify({
      id: employee.id,
      full_name: employee.full_name,
      job_title: employee.job_title || employee.role,
      subsidiary_name: employee.subsidiary_name,
      profile_pic: employee.profile_pic || null,
    }));
    navigate('/messages');
  };

  const clearFilters = () => {
    setSearch('');
    setSubsidiary('all');
    setDepartment('all');
    setTab('all');
    setPage(1);
  };

  if (loading) return (
    <div className="flex min-h-[65vh] items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-11 w-11 animate-spin rounded-full border-4 border-brand-red/10 border-t-brand-red" />
        <p className="mt-4 text-[9px] font-black uppercase tracking-[.22em] text-text-secondary">Loading directory</p>
      </div>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-5 pb-10">
      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative h-[190px] overflow-hidden rounded-[22px] shadow-[0_22px_55px_-34px_rgba(158,14,39,.5)] sm:h-[235px] lg:h-[285px] xl:h-[305px]">
        <img src="/employee-directory-hero-v2.png" alt="Welcome to the George Steuart family" className="block h-full w-full object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, x: 12 }}
          animate={{ opacity: 1, scale: 1, x: 0, y: [0, -3, 0] }}
          transition={{ opacity: { duration: 0.45, delay: 0.35 }, scale: { duration: 0.45, delay: 0.35 }, x: { duration: 0.45, delay: 0.35 }, y: { duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 0.8 } }}
          className="absolute bottom-3 right-3 flex items-center gap-3 rounded-2xl border border-white/35 bg-white/90 px-3.5 py-3 shadow-[0_15px_40px_-18px_rgba(38,31,32,.5)] backdrop-blur-xl sm:bottom-5 sm:right-5 sm:px-4"
        >
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-brand-red text-white shadow-lg shadow-brand-red/20">
            <span className="absolute inset-[-4px] animate-ping rounded-[15px] border border-white/40" />
            <Users className="relative h-4.5 w-4.5" />
          </div>
          <div>
            <p className="text-[7px] font-black uppercase tracking-[.16em] text-text-secondary">Our people</p>
            <div className="mt-0.5 flex items-end gap-1.5">
              <AnimatePresence mode="popLayout">
                <motion.strong key={employees.length} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="text-xl font-black leading-none tracking-[-.04em] text-text-main sm:text-2xl">{employees.length.toLocaleString()}</motion.strong>
              </AnimatePresence>
              <span className="pb-0.5 text-[8px] font-bold text-text-secondary">employees</span>
            </div>
          </div>
        </motion.div>
      </motion.section>

      {error && (
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-brand-red/15 bg-brand-red-light px-4 py-3 text-[10px] font-bold text-brand-red">
          <span>{error}</span><button onClick={loadDirectory} className="flex items-center gap-1.5 font-black uppercase tracking-wider"><RefreshCw className="h-3.5 w-3.5" />Retry</button>
        </div>
      )}

      <div className="flex justify-center">
        <div className="grid w-full max-w-md grid-cols-2 rounded-2xl border border-[#E8E0D7] bg-white p-1.5 shadow-[0_12px_35px_-30px_rgba(94,45,51,.4)] dark:border-white/[0.07] dark:bg-[#111827]">
          <button onClick={() => setMode('directory')} className={`relative flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[9px] font-black uppercase tracking-[.12em] ${mode === 'directory' ? 'text-white' : 'text-text-secondary hover:text-brand-red'}`}>{mode === 'directory' && <motion.span layoutId="directoryMode" className="absolute inset-0 rounded-xl bg-brand-red shadow-lg shadow-brand-red/15" />}<Users className="relative h-3.5 w-3.5" /><span className="relative">Directory</span></button>
          <button onClick={() => setMode('hierarchy')} className={`relative flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[9px] font-black uppercase tracking-[.12em] ${mode === 'hierarchy' ? 'text-white' : 'text-text-secondary hover:text-brand-red'}`}>{mode === 'hierarchy' && <motion.span layoutId="directoryMode" className="absolute inset-0 rounded-xl bg-brand-red shadow-lg shadow-brand-red/15" />}<Network className="relative h-3.5 w-3.5" /><span className="relative">Company hierarchy</span></button>
        </div>
      </div>

      {mode === 'directory' ? <>

      <section className="overflow-hidden rounded-[22px] border border-[#E8E0D7] bg-white shadow-[0_18px_50px_-40px_rgba(94,45,51,.3)] dark:border-white/[0.07] dark:bg-[#111827]">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1"><Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-red" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search employees by name, role, department or email..." className="!h-11 !w-full !rounded-xl !border-[#E8E0D7] !bg-brand-ivory/70 !py-0 !pl-11 !pr-4 !text-[11px] dark:!border-white/[0.07] dark:!bg-white/[0.035]" /></div>
          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <button onClick={() => setFiltersOpen((open) => !open)} aria-expanded={filtersOpen} className={`relative flex h-10 items-center gap-2 rounded-xl border px-3.5 text-[8px] font-black uppercase tracking-[.1em] transition-all ${filtersOpen ? 'border-brand-red bg-brand-red text-white shadow-lg shadow-brand-red/15' : 'border-[#E8E0D7] bg-white text-text-secondary hover:border-brand-red/30 hover:text-brand-red dark:border-white/[0.07] dark:bg-white/[0.035]'}`}><SlidersHorizontal className="h-3.5 w-3.5" />Filters{(tab === 'mine' || subsidiary !== 'all' || department !== 'all') && <span className={`flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[7px] ${filtersOpen ? 'bg-white text-brand-red' : 'bg-brand-red text-white'}`}>{Number(tab === 'mine') + Number(subsidiary !== 'all') + Number(department !== 'all')}</span>}</button>
            <div className="flex rounded-xl border border-[#E8E0D7] bg-white p-1 dark:border-white/[0.07] dark:bg-white/[0.035]"><button aria-label="Grid view" onClick={() => setView('grid')} className={`flex h-8 w-8 items-center justify-center rounded-lg ${view === 'grid' ? 'bg-brand-red text-white' : 'text-slate-400 hover:text-brand-red'}`}><Grid2X2 className="h-3.5 w-3.5" /></button><button aria-label="List view" onClick={() => setView('list')} className={`flex h-8 w-8 items-center justify-center rounded-lg ${view === 'list' ? 'bg-brand-red text-white' : 'text-slate-400 hover:text-brand-red'}`}><List className="h-3.5 w-3.5" /></button></div>
          </div>
        </div>
        <AnimatePresence initial={false}>
          {filtersOpen && <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: .22 }} className="overflow-hidden border-t border-[#EEE8E0] dark:border-white/[0.06]"><div className="grid grid-cols-1 gap-3 bg-brand-ivory/40 p-4 md:grid-cols-3 dark:bg-white/[0.015]">
            <div><p className="mb-1.5 text-[7px] font-black uppercase tracking-[.16em] text-text-secondary">Directory scope</p><div className="grid h-10 grid-cols-2 rounded-xl border border-[#E8E0D7] bg-white p-1 dark:border-white/[0.07] dark:bg-white/[0.035]"><button onClick={() => { setTab('all'); setPage(1); }} className={`rounded-lg text-[8px] font-black uppercase tracking-[.08em] ${tab === 'all' ? 'bg-brand-red text-white' : 'text-text-secondary'}`}>All employees</button><button onClick={() => { setTab('mine'); setPage(1); }} disabled={!currentUser?.subsidiary_id} className={`rounded-lg text-[8px] font-black uppercase tracking-[.08em] disabled:opacity-40 ${tab === 'mine' ? 'bg-brand-red text-white' : 'text-text-secondary'}`}>My subsidiary</button></div></div>
            <label><span className="mb-1.5 block text-[7px] font-black uppercase tracking-[.16em] text-text-secondary">Subsidiary</span><select value={subsidiary} onChange={(event) => { setSubsidiary(event.target.value); setPage(1); }} className="!h-10 !w-full !rounded-xl !border-[#E8E0D7] !bg-white !px-3 !py-0 !text-[10px] !font-bold dark:!border-white/[0.07] dark:!bg-[#111827]"><option value="all">All subsidiaries</option>{subsidiaries.map((item) => <option key={item.id} value={String(item.id)}>{item.name}</option>)}</select></label>
            <label><span className="mb-1.5 block text-[7px] font-black uppercase tracking-[.16em] text-text-secondary">Department</span><select value={department} onChange={(event) => { setDepartment(event.target.value); setPage(1); }} className="!h-10 !w-full !rounded-xl !border-[#E8E0D7] !bg-white !px-3 !py-0 !text-[10px] !font-bold dark:!border-white/[0.07] dark:!bg-[#111827]"><option value="all">All departments</option>{departments.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
            {(tab === 'mine' || subsidiary !== 'all' || department !== 'all') && <div className="md:col-span-3 flex justify-end"><button onClick={clearFilters} className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-wider text-brand-red"><X className="h-3 w-3" />Clear all filters</button></div>}
          </div></motion.div>}
        </AnimatePresence>
      </section>

      <div className="flex items-center justify-between"><div><h2 className="text-sm font-black text-text-main dark:text-white">{tab === 'mine' ? 'My subsidiary colleagues' : 'All colleagues'}</h2><p className="mt-0.5 text-[9px] font-medium text-text-secondary">{filtered.length} {filtered.length === 1 ? 'person' : 'people'} found</p></div><SlidersHorizontal className="h-4 w-4 text-brand-gold" /></div>

      {visibleEmployees.length ? (
        <motion.div layout className={view === 'grid' ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' : 'space-y-2'}>
          {visibleEmployees.map((employee, index) => view === 'grid' ? (
            <motion.article key={employee.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .025 }} onClick={() => setSelected(employee)} className="group cursor-pointer rounded-[22px] border border-[#E8E0D7] bg-white p-4 shadow-[0_15px_40px_-36px_rgba(94,45,51,.4)] transition-all hover:-translate-y-0.5 hover:border-brand-gold/45 hover:shadow-[0_22px_50px_-34px_rgba(158,14,39,.25)] dark:border-white/[0.07] dark:bg-[#111827]">
              <div className="flex items-start gap-3.5"><img src={avatarUrl(employee)} alt={employee.full_name} className="h-14 w-14 shrink-0 rounded-2xl border border-[#EEE8E0] object-cover" /><div className="min-w-0 flex-1"><h3 className="truncate text-[12px] font-black text-text-main group-hover:text-brand-red dark:text-white">{employee.full_name}</h3><p className="mt-0.5 truncate text-[9px] font-bold text-brand-red">{employee.job_title || roleLabel(employee.role)}</p><p className="mt-2 flex items-center gap-1.5 truncate text-[9px] font-medium text-text-secondary"><Building2 className="h-3 w-3 shrink-0 text-brand-gold" />{employee.subsidiary_name || 'George Steuart Group'}</p></div></div>
              <div className="mt-4 flex items-center justify-between border-t border-[#EEE8E0] pt-3 dark:border-white/[0.06]"><span className="rounded-lg bg-brand-ivory px-2 py-1 text-[7px] font-black uppercase tracking-wider text-text-secondary dark:bg-white/[0.04]">{employee.department || 'General'}</span><div className="flex gap-1"><a href={employee.email ? `mailto:${employee.email}` : undefined} onClick={(event) => event.stopPropagation()} className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-ivory text-text-secondary hover:bg-brand-red hover:text-white dark:bg-white/[0.04]"><Mail className="h-3.5 w-3.5" /></a><button onClick={(event) => { event.stopPropagation(); openMessage(employee); }} className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-ivory text-text-secondary hover:bg-brand-red hover:text-white dark:bg-white/[0.04]"><MessageSquare className="h-3.5 w-3.5" /></button></div></div>
            </motion.article>
          ) : (
            <motion.article key={employee.id} layout initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} onClick={() => setSelected(employee)} className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-[#E8E0D7] bg-white p-3 transition-all hover:border-brand-gold/45 dark:border-white/[0.07] dark:bg-[#111827]"><img src={avatarUrl(employee)} alt={employee.full_name} className="h-11 w-11 shrink-0 rounded-xl object-cover" /><div className="min-w-0 flex-1"><h3 className="truncate text-[11px] font-black text-text-main group-hover:text-brand-red dark:text-white">{employee.full_name}</h3><p className="mt-0.5 truncate text-[8px] font-bold text-text-secondary">{employee.job_title || roleLabel(employee.role)}</p></div><span className="hidden max-w-[180px] truncate text-[9px] font-bold text-text-secondary md:block">{employee.department || 'General'}</span><span className="hidden max-w-[220px] truncate text-[9px] text-text-secondary lg:block">{employee.subsidiary_name}</span><div className="flex gap-1"><a href={employee.email ? `mailto:${employee.email}` : undefined} onClick={(event) => event.stopPropagation()} className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-ivory text-text-secondary hover:bg-brand-red hover:text-white dark:bg-white/[0.04]"><Mail className="h-3.5 w-3.5" /></a><button onClick={(event) => { event.stopPropagation(); openMessage(employee); }} className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-ivory text-text-secondary hover:bg-brand-red hover:text-white dark:bg-white/[0.04]"><MessageSquare className="h-3.5 w-3.5" /></button></div><ChevronRight className="h-4 w-4 text-slate-300" /></motion.article>
          ))}
        </motion.div>
      ) : (
        <div className="rounded-[24px] border border-dashed border-[#DCD2C7] bg-white px-6 py-16 text-center dark:border-white/10 dark:bg-[#111827]"><Users className="mx-auto h-8 w-8 text-brand-gold" /><h3 className="mt-3 text-sm font-black text-text-main dark:text-white">No employees found</h3><p className="mt-1 text-[10px] text-text-secondary">Try changing your search or directory filters.</p><button onClick={clearFilters} className="mt-4 text-[8px] font-black uppercase tracking-wider text-brand-red">Clear all filters</button></div>
      )}

      {totalPages > 1 && <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-[#E8E0D7] bg-white px-4 py-3 dark:border-white/[0.07] dark:bg-[#111827] sm:flex-row"><p className="text-[9px] font-medium text-text-secondary">Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}</p><div className="flex items-center gap-2"><button disabled={safePage === 1} onClick={() => setPage(safePage - 1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E8E0D7] text-text-secondary disabled:opacity-35 dark:border-white/10"><ChevronLeft className="h-3.5 w-3.5" /></button><span className="min-w-16 text-center text-[9px] font-black text-text-main dark:text-white">{safePage} / {totalPages}</span><button disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)} className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E8E0D7] text-text-secondary disabled:opacity-35 dark:border-white/10"><ChevronRight className="h-3.5 w-3.5" /></button></div></div>}

      </> : <CompanyHierarchy employees={employees} subsidiaries={subsidiaries} onSelect={setSelected} onOpenDirectory={() => setMode('directory')} />}

      <AnimatePresence>{selected && <div className="fixed inset-0 z-[100] flex justify-end"><motion.button aria-label="Close profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelected(null)} className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm" /><motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 260 }} className="relative flex h-full w-full max-w-[440px] flex-col overflow-y-auto bg-brand-ivory shadow-2xl dark:bg-[#0C111D]">
        <div className="relative bg-gradient-to-br from-brand-red to-brand-red-dark px-6 pb-7 pt-6 text-white"><button onClick={() => setSelected(null)} className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20"><X className="h-4 w-4" /></button><img src={avatarUrl(selected)} alt={selected.full_name} className="mt-9 h-20 w-20 rounded-[22px] border-2 border-white/20 object-cover shadow-xl" /><h2 className="mt-4 text-xl font-black tracking-tight">{selected.full_name}</h2><p className="mt-1 text-[10px] font-bold text-white/65">{selected.job_title || roleLabel(selected.role)}</p></div>
        <div className="space-y-4 p-5"><div className="grid grid-cols-2 gap-2"><a href={selected.email ? `mailto:${selected.email}` : undefined} className="flex items-center justify-center gap-2 rounded-xl bg-brand-red py-3 text-[9px] font-black uppercase tracking-wider text-white"><Mail className="h-3.5 w-3.5" />Email</a><button onClick={() => openMessage(selected)} className="flex items-center justify-center gap-2 rounded-xl bg-[#261F20] py-3 text-[9px] font-black uppercase tracking-wider text-white"><MessageSquare className="h-3.5 w-3.5" />Message</button></div>
          <div className="overflow-hidden rounded-2xl border border-[#E8E0D7] bg-white dark:border-white/[0.07] dark:bg-[#111827]">{[
            { icon: Building2, label: 'Subsidiary', value: selected.subsidiary_name || 'George Steuart Group' },
            { icon: Users, label: 'Department', value: selected.department || 'General' },
            { icon: Mail, label: 'Email', value: selected.email || 'Not available' },
            { icon: Phone, label: 'Phone', value: selected.phone || 'Not available' },
            { icon: MapPin, label: 'Location', value: selected.location || 'Sri Lanka' },
          ].map((item) => <div key={item.label} className="flex items-center gap-3 border-b border-[#EEE8E0] px-4 py-3.5 last:border-0 dark:border-white/[0.06]"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-red-light text-brand-red dark:bg-brand-red/10"><item.icon className="h-3.5 w-3.5" /></span><div className="min-w-0"><p className="text-[7px] font-black uppercase tracking-wider text-text-secondary">{item.label}</p><p className="mt-0.5 truncate text-[10px] font-bold text-text-main dark:text-white">{item.value}</p></div></div>)}</div>
        </div>
      </motion.aside></div>}</AnimatePresence>
    </div>
  );
};

export default EmployeeDirectory;
