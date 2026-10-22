import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
   Users,
   Globe,
   ChevronRight,
   Zap,
   ShieldCheck,
   Search,
   LayoutGrid,
   List
} from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const resolveImgUrl = (url) => {
   if (!url) return null;
   if (url.startsWith('http://') || url.startsWith('https://')) return url;
   if (url.startsWith('/uploads/')) return `http://localhost:5000${url}`;
   if (url.startsWith('uploads/')) return `http://localhost:5000/${url}`;
   return url;
};

const getSubLogo = (sub) => {
   if (typeof sub === 'object' && sub?.logo_url) {
      return resolveImgUrl(sub.logo_url);
   }
   const name = typeof sub === 'string' ? sub : sub?.name;
   const lowName = (name || '').toLowerCase();
   if (lowName.includes('teas') && !lowName.includes('heladiv')) return '/gs_teas_logo.png';
   if (lowName.includes('citrus')) return 'https://citrusleisure.com/wp-content/themes/citrusleisure/img/logo.png';
   if (lowName.includes('heladiv')) return '/heladiv_logo.png';
   if (lowName.includes('insurance')) return '/insurance_logo.png';
   if (lowName.includes('health') || lowName.includes('pharma') || lowName.includes('lab') || lowName.includes('ethical')) return '/health_logo.png';
   if (lowName.includes('travel')) return '/travel_logo.png';
   if (lowName.includes('holiday')) return '/holidays_logo.png';
   if (lowName.includes('consumer') || lowName.includes('seregen')) return '/consumer_logo.png';
   if (lowName.includes('solutions')) return '/solutions_logo.png';
   if (lowName.includes('recruitment') || lowName.includes('education')) return '/recruitment_logo.png';
   if (lowName.includes('invest')) return '/investments_logo.png';
   if (lowName.includes('asset')) return '/asset_management_logo.png';
   if (lowName.includes('optimize')) return '/solutions_logo.png';
   return '/api_logo.png';
};

const getSubCover = (sub) => {
   if (sub?.cover_image) {
      return resolveImgUrl(sub.cover_image);
   }
   const lowName = (sub?.name || '').toLowerCase();
   if (lowName.includes('teas') && !lowName.includes('heladiv')) return '/gs_teas_cover.png';
   if (lowName.includes('heladiv')) return '/sub_heladiv.png';
   if (lowName.includes('health') || lowName.includes('pharma') || lowName.includes('lab') || lowName.includes('ethical')) return '/health_cover.png';
   if (lowName.includes('insurance')) return '/insurance_cover.png';
   if (lowName.includes('invest')) return '/investments_cover.png';
   if (lowName.includes('consumer') || lowName.includes('seregen')) return '/consumer_cover.png';
   if (lowName.includes('travel')) return '/travel_cover.png';
   if (lowName.includes('optimize')) return '/industrial_premium.png';
   if (lowName.includes('education') || lowName.includes('recruit')) return '/recruitment_premium.png';
   return '/sub_1.png';
};

const MySubsidiary = () => {
   const { user } = useAuth();
   const navigate = useNavigate();
   const reduceMotion = useReducedMotion();
   const [subsidiaries, setSubsidiaries] = useState([]);
   const [loading, setLoading] = useState(true);
   const [searchQuery, setSearchQuery] = useState('');
   const [viewMode, setViewMode] = useState('grid');
   const [activeFilter, setActiveFilter] = useState('All');
   const [allUsers, setAllUsers] = useState([]);
   const [directors, setDirectors] = useState([]);

   useEffect(() => {
      const fetchData = async () => {
         try {
            const [subRes, userRes, dirRes] = await Promise.all([
               axios.get('http://localhost:5000/api/subsidiaries'),
               axios.get('http://localhost:5000/api/users'),
               axios.get('http://localhost:5000/api/subsidiaries/directors/all')
            ]);
            setSubsidiaries(subRes.data);
            setAllUsers(userRes.data);
            setDirectors(dirRes.data);
         } catch (err) {
            console.error('Failed to fetch data', err);
         } finally {
            setLoading(false);
         }
      };
      fetchData();
   }, [user]);

   const getHeadcount = (subId) => {
      const staffCount = allUsers.filter(u => Number(u.subsidiary_id) === Number(subId)).length;
      const dirCount = directors.filter(d => Number(d.subsidiary_id) === Number(subId)).length;
      return staffCount + dirCount;
   };

   const categories = [
      'All', 
      'Holding', 
      'IT & Digital', 
      'Healthcare', 
      'Tea & Export', 
      'Travel & Leisure', 
      'Finance', 
      'FMCG & Consumer', 
      'Industrial', 
      'Services'
   ];

   if (loading) {
      return (
         <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>
         </div>
      );
   }

   const filteredSubs = subsidiaries.filter(s => {
      // Exclude inactive entities set by admin in /admin/subsidiaries
      if (s.status === 'Inactive') return false;

      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
         s.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         s.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         s.location?.toLowerCase().includes(searchQuery.toLowerCase());

      if (activeFilter === 'All') return matchesSearch;

      const catLower = (s.category || '').toLowerCase();
      const descLower = (s.description || '').toLowerCase();
      const nameLower = (s.name || '').toLowerCase();

      let matchesCategory = catLower.includes(activeFilter.toLowerCase()) || descLower.includes(activeFilter.toLowerCase());

      if (activeFilter === 'IT & Digital') {
         matchesCategory = catLower.includes('it') || catLower.includes('digital') || catLower.includes('tech') || nameLower.includes('optimize');
      } else if (activeFilter === 'FMCG & Consumer') {
         matchesCategory = catLower.includes('fmcg') || catLower.includes('consumer') || nameLower.includes('seregen');
      } else if (activeFilter === 'Healthcare') {
         matchesCategory = catLower.includes('health') || catLower.includes('pharma') || catLower.includes('lab') || catLower.includes('ethical');
      } else if (activeFilter === 'Tea & Export') {
         matchesCategory = catLower.includes('tea') || catLower.includes('export') || nameLower.includes('heladiv');
      } else if (activeFilter === 'Travel & Leisure') {
         matchesCategory = catLower.includes('travel') || catLower.includes('holiday') || catLower.includes('leisure') || catLower.includes('aviation') || nameLower.includes('citrus');
      } else if (activeFilter === 'Finance') {
         matchesCategory = catLower.includes('finance') || catLower.includes('insurance') || catLower.includes('invest') || catLower.includes('asset');
      } else if (activeFilter === 'Services') {
         matchesCategory = catLower.includes('service') || catLower.includes('recruit') || catLower.includes('education');
      } else if (activeFilter === 'Industrial') {
         matchesCategory = catLower.includes('industrial') || catLower.includes('solution') || nameLower.includes('solution');
      } else if (activeFilter === 'Holding') {
         matchesCategory = catLower.includes('holding') || nameLower.includes('& co') || nameLower.includes('group');
      }

      return matchesSearch && matchesCategory;
   });

   return (
      <div className="mx-auto space-y-4 lg:space-y-5 pb-12 relative">
         <div className="fixed inset-0 pointer-events-none -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-50 via-white to-white" />

         {/* Refined Modern Enterprise Hero */}
         <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative h-[185px] sm:h-[205px] lg:h-[225px] rounded-[26px] overflow-hidden border border-white/80 shadow-[0_18px_48px_-24px_rgba(15,23,42,0.4)] group"
         >
            <motion.img
               src="/subsidiary-cinematic-portfolio-v2.png"
               alt="Cinematic Colombo corporate skyline"
               initial={{ scale: 1.04, x: '0%', y: '0%' }}
               animate={reduceMotion ? { scale: 1.04 } : {
                  scale: [1.04, 1.1, 1.065],
                  x: ['0%', '-1.25%', '0.45%'],
                  y: ['0%', '-0.65%', '0%']
               }}
               transition={reduceMotion ? { duration: 0 } : {
                  duration: 18,
                  ease: 'easeInOut',
                  repeat: Infinity,
                  repeatType: 'mirror'
               }}
               className="absolute inset-0 w-[102%] h-[102%] object-cover object-center will-change-transform"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/62 to-slate-950/10" />
            {!reduceMotion && (
               <motion.div
                  aria-hidden="true"
                  className="absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-18deg] bg-gradient-to-r from-transparent via-white/20 to-transparent blur-xl"
                  animate={{ x: ['-40%', '440%'], opacity: [0, 0.85, 0] }}
                  transition={{ duration: 7.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 4 }}
               />
            )}
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-brand-red/70 via-amber-400/50 to-transparent" />

            <div className="absolute inset-0 px-6 py-5 sm:px-8 lg:px-10 flex flex-col justify-center">
               <div className="max-w-xl flex items-center gap-5 sm:gap-7">
                  <motion.div 
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ duration: 0.55, ease: 'easeOut' }}
                     className="hidden sm:flex w-14 h-14 lg:w-16 lg:h-16 shrink-0 bg-white/85 backdrop-blur-xl rounded-2xl items-center justify-center shadow-[0_12px_28px_-12px_rgba(15,23,42,0.35)] p-2.5 border border-white"
                  >
                     <img src="/api_logo.png" alt="GS Logo" className="w-full h-full object-contain" />
                  </motion.div>
                  <div className="space-y-2.5">
                     <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.24em] text-brand-red">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.12)]" />
                        George Steuart Group
                     </div>
                     <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-black text-slate-900 tracking-[-0.045em] leading-[0.95]">
                        Corporate <span className="text-brand-red">Portfolio</span>
                     </h1>
                     <p className="max-w-lg text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                        Explore the diversified landscape of George Steuart & Company. A heritage of excellence spanning across sectors.
                     </p>
                  </div>
               </div>
            </div>

            <motion.div
               aria-hidden="true"
               className="absolute -top-24 -right-24 w-80 h-80 bg-brand-red/10 rounded-full blur-[100px]"
               animate={reduceMotion ? undefined : { opacity: [0.35, 0.7, 0.35], scale: [0.95, 1.08, 0.95] }}
               transition={{ duration: 6, ease: 'easeInOut', repeat: Infinity }}
            />
            {!reduceMotion && (
               <motion.div
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-gradient-to-r from-brand-red via-amber-400 to-transparent"
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: [0, 1], opacity: [0, 0.85, 0] }}
                  transition={{ duration: 8, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1.5 }}
               />
            )}
         </motion.div>

         <div className="sticky top-3 z-40 bg-white/90 backdrop-blur-3xl border border-white p-2 rounded-2xl shadow-[0_14px_36px_-24px_rgba(15,23,42,0.45)] flex flex-col xl:flex-row items-center justify-between gap-2 ring-1 ring-slate-200/70">
            <div className="flex p-1 bg-slate-50/80 rounded-xl overflow-x-auto no-scrollbar w-full xl:w-auto">
               {categories.map(cat => (
                  <button
                     key={cat}
                     onClick={() => setActiveFilter(cat)}
                     className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-[0.12em] transition-all whitespace-nowrap ${activeFilter === cat ? 'bg-white text-brand-red shadow-md shadow-brand-red/10 ring-1 ring-brand-red/5' : 'text-slate-400 hover:text-slate-700'}`}
                  >
                     {cat}
                  </button>
               ))}
            </div>

            <div className="flex items-center gap-2 w-full xl:w-auto">
               <div className="relative flex-1 md:w-56 group">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-brand-red transition-colors" />
                  <input
                     type="text"
                     placeholder="Search entities..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full bg-slate-50 border-none rounded-xl pl-10 pr-4 py-2.5 text-[11px] font-bold focus:ring-4 focus:ring-brand-red/5 outline-none transition-all"
                  />
               </div>
               <div className="flex bg-slate-100/50 p-1 rounded-xl">
                  <button onClick={() => setViewMode('grid')} aria-label="Grid view" className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-brand-red shadow-sm' : 'text-slate-300 hover:text-slate-500'}`}><LayoutGrid className="w-4 h-4" /></button>
                  <button onClick={() => setViewMode('list')} aria-label="List view" className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-brand-red shadow-sm' : 'text-slate-300 hover:text-slate-500'}`}><List className="w-4 h-4" /></button>
               </div>
            </div>
         </div>

         <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
            <AnimatePresence mode='popLayout'>
               {filteredSubs.map((sub, i) => {
                  const subUsers = allUsers.filter(u => u.subsidiary_id === sub.id).slice(0, 4);
                  return (
                     <motion.div
                        layout
                        key={sub.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        whileHover={viewMode === 'grid' ? { y: -5 } : { x: 3 }}
                        transition={{ duration: 0.35, delay: Math.min(i * 0.035, 0.2) }}
                        onClick={() => navigate(`/subsidiary/${sub.id}`)}
                        onKeyDown={(event) => {
                           if (event.key === 'Enter' || event.key === ' ') navigate(`/subsidiary/${sub.id}`);
                        }}
                        role="link"
                        tabIndex={0}
                        aria-label={`View ${sub.name} details`}
                        className={`group cursor-pointer relative ${viewMode === 'grid' ?
                           "bg-white rounded-[22px] border border-slate-100/90 shadow-[0_12px_30px_-22px_rgba(15,23,42,0.55)] hover:shadow-[0_20px_40px_-24px_rgba(158,14,39,0.32)] hover:border-brand-red/15 transition-[box-shadow,border-color] duration-500 overflow-hidden flex flex-col h-[338px]" :
                           "bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between hover:border-brand-red/20 transition-all shadow-sm"
                           }`}
                     >
                        {viewMode === 'grid' && (
                           <div className="relative h-[126px] overflow-hidden">
                              <img
                                 src={getSubCover(sub)}
                                 alt={sub.name}
                                 className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.06]"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                              <div className="absolute top-4 left-4 flex flex-col gap-2">
                                 <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950/35 backdrop-blur-xl border border-white/25 rounded-full text-white text-[8px] font-black uppercase tracking-[0.15em] shadow-sm">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                                    Active Entity
                                 </div>
                              </div>
                           </div>
                        )}

                        <div className={viewMode === 'grid' ? "p-4 flex flex-col flex-1" : "flex items-center gap-4 w-full"}>
                           <div className={`flex items-start justify-between ${viewMode === 'grid' ? 'mb-3' : 'mb-0'}`}>
                              <div className={`rounded-xl flex items-center justify-center transition-all duration-500 overflow-hidden ${viewMode === 'grid' ? 'w-16 h-16 bg-white shadow-[0_12px_26px_-14px_rgba(15,23,42,0.45)] border border-slate-100 -mt-10 relative z-20 group-hover:scale-105' : 'w-10 h-10 bg-slate-50 shrink-0'}`}>
                                 <img src={getSubLogo(sub)} alt={sub.name} className="w-full h-full object-contain p-2.5" />
                              </div>
                              {viewMode === 'grid' && (
                                 <div className="flex -space-x-2">
                                    {subUsers.map((u, idx) => (
                                       <div key={idx} className="w-8 h-8 rounded-full border-[3px] border-white bg-slate-100 overflow-hidden shadow-sm">
                                          <img src={u.profile_pic || `https://ui-avatars.com/api/?name=${u.full_name}&background=random`} alt="" className="w-full h-full object-cover" />
                                       </div>
                                    ))}
                                 </div>
                              )}
                           </div>

                           <div className="flex-1">
                              <div className="flex items-center gap-3 mb-1.5">
                                 <h3 className={`font-black text-slate-900 tracking-[-0.025em] transition-colors group-hover:text-brand-red ${viewMode === 'grid' ? 'text-[17px] leading-tight' : 'text-base'}`}>{sub.name}</h3>
                              </div>
                              <p className={`text-slate-500 font-medium text-[11px] leading-[1.65] opacity-85 group-hover:opacity-100 transition-opacity ${viewMode === 'grid' ? 'line-clamp-2' : 'line-clamp-1'}`}>
                                 {sub.description}
                              </p>
                           </div>

                           {viewMode === 'grid' ? (
                              <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                                 <div className="flex items-center gap-4">
                                    <div className="flex flex-col">
                                       <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.14em]">Headcount</span>
                                       <span className="text-xs font-black text-slate-800">{getHeadcount(sub.id).toLocaleString()}</span>
                                    </div>
                                    <div className="w-px h-8 bg-slate-100" />
                                    <div className="flex flex-col">
                                       <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.14em]">Category</span>
                                       <span className="text-xs font-black text-slate-800">{sub.category || 'Subsidiary'}</span>
                                    </div>
                                 </div>
                                 <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-brand-red group-hover:text-white transition-all duration-300 shadow-sm">
                                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                                 </div>
                              </div>
                           ) : (
                              <div className="hidden md:flex items-center gap-8 px-6">
                                 <div className="text-right">
                                    <p className="text-xs font-black text-slate-800">{getHeadcount(sub.id)}</p>
                                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-0.5">Staff</p>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-xs font-black text-slate-800">{sub.category || 'Subsidiary'}</p>
                                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-0.5">Sector</p>
                                 </div>
                                 <ChevronRight className="w-4 h-4 text-slate-200 group-hover:text-brand-red group-hover:translate-x-1 transition-all" />
                              </div>
                           )}
                        </div>
                     </motion.div>
                  );
               })}
            </AnimatePresence>
         </div>

         <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4">
            {[
               { label: 'Total Portfolio Headcount', value: subsidiaries.reduce((acc, s) => acc + getHeadcount(s.id), 0).toLocaleString(), icon: Users, color: 'text-brand-red', bg: 'bg-brand-red/5' },
               { label: 'Global Entities', value: subsidiaries.length, icon: Globe, color: 'text-slate-800', bg: 'bg-slate-50' },
               { label: 'Active Projects', value: '42+', icon: Zap, color: 'text-emerald-600', bg: 'bg-emerald-50' },
               { label: 'Network Health', value: '99.9%', icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' }
            ].map((stat, i) => (
               <motion.div whileHover={{ y: -3 }} key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow">
                  <div className={`w-10 h-10 shrink-0 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center`}>
                     <stat.icon className="w-5 h-5" />
                  </div>
                  <div>
                     <p className="text-lg font-black text-slate-800 tracking-tight">{stat.value}</p>
                     <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.12em] mt-0.5">{stat.label}</p>
                  </div>
               </motion.div>
            ))}
         </div>
      </div>
   );
};

export default MySubsidiary;
