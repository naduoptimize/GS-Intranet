import { useState } from 'react';
import { 
  Layers, 
  Search, 
  Plus, 
  CheckCircle2,
  TrendingUp,
  Target,
  Zap,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import { motion } from 'framer-motion';

const Projects = () => {
  const [activeTab, setActiveTab] = useState('Active');

  const projects = [
    { name: 'API Family Modernization', client: 'Group IT', progress: 85, team: 4, priority: 'High', status: 'Active', color: 'bg-brand-red' },
    { name: 'Citrus Leisure Digital Hub', client: 'Citrus Leisure', progress: 40, team: 6, priority: 'Critical', status: 'Active', color: 'bg-amber-500' },
    { name: 'Health Sector Supply Chain', client: 'GS Health', progress: 100, team: 3, priority: 'Medium', status: 'Completed', color: 'bg-emerald-500' },
    { name: 'Global Talent Acquisition', client: 'GS Recruitment', progress: 15, team: 2, priority: 'High', status: 'Active', color: 'bg-indigo-500' },
    { name: 'Insurance Risk Framework', client: 'GS Insurance', progress: 65, team: 5, priority: 'High', status: 'Active', color: 'bg-blue-500' },
    { name: 'Sustainable Solar Rollout', client: 'GS Solutions', progress: 0, team: 8, priority: 'Critical', status: 'Planning', color: 'bg-slate-900' }
  ];

  const filteredProjects = projects.filter(p => p.status === activeTab || activeTab === 'All');

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 pb-24 px-6 relative">
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 pt-12">
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-red/10 text-brand-red rounded-full text-[10px] font-black uppercase tracking-[4px]"
          >
            <Layers className="w-3 h-3" /> Group Project Portfolio
          </motion.div>
          <h1 className="text-6xl font-black text-slate-900 tracking-tighter leading-[0.8]">
            Strategic <br /><span className="text-brand-red">Initiatives</span>
          </h1>
          <p className="text-slate-500 font-medium text-lg max-w-xl leading-relaxed">
            Tracking cross-sector excellence and operational milestones across the George Steuart enterprise.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative group w-full sm:w-80">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-brand-red transition-colors" />
            <input 
              type="text"
              placeholder="Search initiatives..."
              className="w-full pl-12 pr-6 py-4 bg-white border border-slate-100 rounded-2xl shadow-sm focus:ring-4 focus:ring-brand-red/5 outline-none transition-all font-bold text-slate-800 text-xs"
            />
          </div>
          <button className="w-full sm:w-auto bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-brand-red transition-all shadow-xl flex items-center justify-center gap-3">
            <Plus className="w-5 h-5" /> New Project
          </button>
        </div>
      </div>

      {/* Tabs & Stats */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-8 bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm sticky top-6 z-40 backdrop-blur-xl bg-white/80">
        <div className="flex p-1 bg-slate-50 rounded-[22px] overflow-x-auto no-scrollbar w-full lg:w-auto">
          {['All', 'Active', 'Planning', 'Completed'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-white text-brand-red shadow-lg border border-brand-red/5' : 'text-slate-400 hover:text-slate-600'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-8 px-6">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-brand-red animate-pulse"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">12 Active</span>
          </div>
          <div className="w-px h-6 bg-slate-200"></div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">48 Completed</span>
          </div>
          <button className="text-slate-400 hover:text-brand-red transition-colors">
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Project Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {filteredProjects.map((project, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group bg-white p-8 rounded-[45px] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all cursor-pointer relative flex flex-col min-h-[420px]"
          >
            <div className="flex items-start justify-between mb-8">
              <div className={`px-4 py-1.5 rounded-full ${project.color}/10 ${project.color.replace('bg-', 'text-')} text-[9px] font-black uppercase tracking-widest`}>
                {project.status}
              </div>
              <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                <MoreHorizontal className="w-6 h-6" />
              </button>
            </div>

            <h3 className="text-2xl font-black text-slate-800 mb-2 leading-tight group-hover:text-brand-red transition-colors">{project.name}</h3>
            <p className="text-slate-400 font-bold text-[11px] uppercase tracking-widest mb-10">{project.client}</p>

            <div className="space-y-4 mb-10 flex-1">
              <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest">
                <span className="text-slate-400">Progress</span>
                <span className="text-slate-800">{project.progress}%</span>
              </div>
              <div className="h-3 bg-slate-50 rounded-full overflow-hidden p-0.5 border border-slate-100">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${project.progress}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className={`h-full ${project.color} rounded-full shadow-lg shadow-current/20`}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-8 border-t border-slate-50">
              <div className="flex -space-x-3">
                {[1, 2, 3].map(m => (
                  <div key={m} className="w-10 h-10 rounded-full border-4 border-white bg-slate-100 flex items-center justify-center font-black text-slate-400 text-[10px]">
                    {m}
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full border-4 border-white bg-slate-900 flex items-center justify-center font-black text-white text-[9px]">
                  +{project.team - 3}
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Priority</span>
                <span className={`text-[10px] font-black uppercase tracking-widest ${project.priority === 'Critical' ? 'text-brand-red' : 'text-slate-800'}`}>{project.priority}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pt-12">
        {[
          { label: 'On Track', value: '92%', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' },
          { label: 'Avg Velocity', value: '14.2', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50' },
          { label: 'Success Rate', value: '99.9%', icon: Target, color: 'text-brand-red', bg: 'bg-brand-red/5' },
          { label: 'Total Budget', value: 'GS-CAPEX', icon: TrendingUp, color: 'text-indigo-500', bg: 'bg-indigo-50' }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[35px] border border-slate-100 shadow-sm flex items-center gap-6 hover:shadow-lg transition-all">
            <div className={`w-14 h-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-slate-800 tracking-tight">{stat.value}</p>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Projects;
