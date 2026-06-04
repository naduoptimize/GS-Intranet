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
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const getSubLogo = (name) => {
   const lowName = (name || '').toLowerCase();
   if (lowName.includes('teas') && !lowName.includes('heladiv')) return '/gs_teas_logo.png';
   if (lowName.includes('citrus')) return 'https://citrusleisure.com/wp-content/themes/citrusleisure/img/logo.png';
   if (lowName.includes('heladiv')) return '/heladiv_logo.png';
   if (lowName.includes('insurance')) return '/insurance_logo.png';
   if (lowName.includes('health')) return '/health_logo.png';
   if (lowName.includes('travel')) return '/travel_logo.png';
   if (lowName.includes('holiday')) return '/holidays_logo.png';
   if (lowName.includes('consumer')) return '/consumer_logo.png';
   if (lowName.includes('solutions')) return '/solutions_logo.png';
   if (lowName.includes('recruitment')) return '/recruitment_logo.png';
   if (lowName.includes('invest')) return '/investments_logo.png';
   if (lowName.includes('asset')) return '/asset_management_logo.png';
   return '/api_logo.png';
};

const getSubCover = (sub) => {
   const lowName = (sub.name || '').toLowerCase();
   if (lowName.includes('teas') && !lowName.includes('heladiv')) return '/gs_teas_cover.png';
   if (lowName.includes('heladiv')) return '/sub_heladiv.png';
   if (lowName.includes('health') || lowName.includes('pharmaceuticals')) return '/health_cover.png';
   if (lowName.includes('insurance')) return '/insurance_cover.png';
   if (lowName.includes('invest')) return '/investments_cover.png';
   return sub.cover_image || '/sub_1.png';
};

const MySubsidiary = () => {
   const { user } = useAuth();
   const navigate = useNavigate();
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

   const categories = ['All', 'Holding', 'Tech', 'Healthcare', 'Tea', 'Travel', 'Finance', 'Leisure', 'Industrial', 'FMCG'];

   if (loading) {
      return (
         <div className="flex items-center justify-center min-h-[60vh]">
            <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin"></div>
         </div>
      );
   }

   const filteredSubs = subsidiaries.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
         s.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = activeFilter === 'All' || 
         s.category?.toLowerCase().includes(activeFilter.toLowerCase()) ||
         s.description?.toLowerCase().includes(activeFilter.toLowerCase());
      return matchesSearch && matchesFilter;
   });

   return (
      <div className="max-w-[1600px] mx-auto space-y-12 pb-32 px-4 relative">
         <div className="fixed inset-0 pointer-events-none -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-50 via-white to-white" />

         {/* Refined Modern Enterprise Hero */}
         <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative h-[560px] rounded-[50px] overflow-hidden shadow-2xl mb-12 group"
         >
            <img
               src="/image copy.png"
               alt="Colombo Lotus Tower"
               className="w-full h-full object-cover transition-transform duration-[15s] group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/10 to-transparent" />

            <div className="absolute inset-0 p-12 md:p-24 flex flex-col justify-center">
               <div className="max-w-3xl space-y-8">
                  <motion.div 
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     className="w-24 h-24 bg-white/80 backdrop-blur-xl rounded-3xl flex items-center justify-center shadow-2xl p-4 border border-white/50"
                  >
                     <img src="/api_logo.png" alt="GS Logo" className="w-full h-full object-contain" />
                  </motion.div>
                  <div className="space-y-4">
                     <h1 className="text-6xl md:text-8xl font-black text-slate-900 tracking-tighter leading-[0.9]">
                        Corporate <br /><span className="text-brand-red">Portfolio</span>
                     </h1>
                     <p className="text-xl text-slate-500 font-medium max-w-xl leading-relaxed">
                        Explore the diversified landscape of George Steuart & Company. A heritage of excellence spanning across sectors.
                     </p>
                  </div>
               </div>
            </div>

            <div className="absolute -top-24 -right-24 w-96 h-96 bg-brand-red/10 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px]" />
         </motion.div>

         <div className="sticky top-6 z-40 bg-white/70 backdrop-blur-3xl border border-white/40 p-4 rounded-[35px] shadow-2xl shadow-slate-200/50 flex flex-col xl:flex-row items-center justify-between gap-6 ring-1 ring-black/5">
            <div className="flex p-1.5 bg-slate-50/50 rounded-[24px] overflow-x-auto no-scrollbar w-full xl:w-auto">
               {categories.map(cat => (
                  <button
                     key={cat}
                     onClick={() => setActiveFilter(cat)}
                     className={`px-6 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${activeFilter === cat ? 'bg-white text-brand-red shadow-xl shadow-brand-red/10 border border-brand-red/5' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                     {cat}
                  </button>
               ))}
            </div>

            <div className="flex items-center gap-4 w-full xl:w-auto">
               <div className="relative flex-1 md:w-64 group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-300 group-focus-within:text-brand-red transition-colors" />
                  <input
                     type="text"
                     placeholder="Search entities..."
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full bg-slate-50 border-none rounded-xl pl-11 pr-4 py-3 text-[11px] font-bold focus:ring-4 focus:ring-brand-red/5 outline-none transition-all"
                  />
               </div>
               <div className="flex bg-slate-100/50 p-1 rounded-xl">
                  <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-brand-red shadow-sm' : 'text-slate-300'}`}><LayoutGrid className="w-4 h-4" /></button>
                  <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-brand-red shadow-sm' : 'text-slate-300'}`}><List className="w-4 h-4" /></button>
               </div>
            </div>
         </div>

         <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10" : "space-y-4"}>
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
                        transition={{ duration: 0.4, delay: i * 0.05 }}
                        onClick={() => navigate(`/subsidiary/${sub.id}`)}
                        className={`group cursor-pointer relative ${viewMode === 'grid' ?
                           "bg-white rounded-[40px] border border-slate-100 shadow-xl hover:shadow-2xl hover:shadow-brand-red/5 transition-all duration-500 overflow-hidden flex flex-col h-[520px]" :
                           "bg-white p-5 rounded-2xl border border-slate-50 flex items-center justify-between hover:border-brand-red/20 transition-all shadow-sm"
                           }`}
                     >
                        {viewMode === 'grid' && (
                           <div className="relative h-56 overflow-hidden">
                              <img
                                 src={getSubCover(sub)}
                                 alt={sub.name}
                                 className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                              <div className="absolute top-6 left-6 flex flex-col gap-2">
                                 <div className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-xl border border-white/20 rounded-full text-white text-[9px] font-black uppercase tracking-widest">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                                    Active Entity
                                 </div>
                              </div>
                           </div>
                        )}

                        <div className={viewMode === 'grid' ? "p-8 flex flex-col flex-1" : "flex items-center gap-6 w-full"}>
                           <div className="flex items-start justify-between mb-6">
                              <div className={`rounded-2xl flex items-center justify-center transition-all duration-500 overflow-hidden ${viewMode === 'grid' ? 'w-20 h-20 bg-white shadow-2xl border border-slate-100 -mt-16 relative z-20 group-hover:scale-110' : 'w-10 h-10 bg-slate-50 shrink-0'}`}>
                                 <img src={getSubLogo(sub.name)} alt={sub.name} className="w-full h-full object-contain p-2" />
                              </div>
                              {viewMode === 'grid' && (
                                 <div className="flex -space-x-3">
                                    {subUsers.map((u, idx) => (
                                       <div key={idx} className="w-10 h-10 rounded-full border-4 border-white bg-slate-100 overflow-hidden shadow-sm">
                                          <img src={u.profile_pic || `https://ui-avatars.com/api/?name=${u.full_name}&background=random`} alt="" className="w-full h-full object-cover" />
                                       </div>
                                    ))}
                                 </div>
                              )}
                           </div>

                           <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                 <h3 className={`font-black text-slate-800 tracking-tight transition-colors group-hover:text-brand-red ${viewMode === 'grid' ? 'text-xl leading-tight' : 'text-base'}`}>{sub.name}</h3>
                              </div>
                              <p className="text-slate-500 font-medium text-[13px] line-clamp-3 leading-relaxed opacity-80 group-hover:opacity-100 transition-opacity">
                                 {sub.description}
                              </p>
                           </div>

                           {viewMode === 'grid' ? (
                              <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between">
                                 <div className="flex items-center gap-6">
                                    <div className="flex flex-col">
                                       <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Headcount</span>
                                       <span className="text-sm font-black text-slate-800">{getHeadcount(sub.id).toLocaleString()}</span>
                                    </div>
                                    <div className="w-px h-8 bg-slate-100" />
                                    <div className="flex flex-col">
                                       <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Category</span>
                                       <span className="text-sm font-black text-slate-800">{sub.category || 'Subsidiary'}</span>
                                    </div>
                                 </div>
                                 <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center group-hover:bg-slate-900 group-hover:text-white transition-all duration-500 group-hover:rotate-[360deg] shadow-sm">
                                    <ChevronRight className="w-6 h-6" />
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

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-10">
            {[
               { label: 'Total Portfolio Headcount', value: subsidiaries.reduce((acc, s) => acc + getHeadcount(s.id), 0).toLocaleString(), icon: Users, color: 'text-brand-red', bg: 'bg-brand-red/5' },
               { label: 'Global Entities', value: subsidiaries.length, icon: Globe, color: 'text-slate-800', bg: 'bg-slate-50' },
               { label: 'Active Projects', value: '42+', icon: Zap, color: 'text-emerald-600', bg: 'bg-emerald-50' },
               { label: 'Network Health', value: '99.9%', icon: ShieldCheck, color: 'text-indigo-600', bg: 'bg-indigo-50' }
            ].map((stat, i) => (
               <div key={i} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm flex items-center gap-6 hover:shadow-md transition-shadow">
                  <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center`}>
                     <stat.icon className="w-6 h-6" />
                  </div>
                  <div>
                     <p className="text-xl font-black text-slate-800 tracking-tight">{stat.value}</p>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{stat.label}</p>
                  </div>
               </div>
            ))}
         </div>
      </div>
   );
};

export default MySubsidiary;
