import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Target, 
  Eye, 
  Users,
  Image as ImageIcon
} from 'lucide-react';

const API_BASE = 'http://localhost:5000/api';

const SubsidiaryProfileModal = ({ subsidiary, onClose }) => {
  const [directors, setDirectors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (subsidiary) {
      const fetchDirectors = async () => {
        try {
          const res = await axios.get(`${API_BASE}/subsidiaries/${subsidiary.id}/directors`);
          setDirectors(res.data);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      };
      fetchDirectors();
    }
  }, [subsidiary]);

  if (!subsidiary) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-slate-900/60 backdrop-blur-md overflow-y-auto"
        onClick={onClose}
      >
        <motion.div 
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white w-full max-w-5xl rounded-[40px] shadow-2xl overflow-hidden my-auto relative"
          onClick={e => e.stopPropagation()}
        >
          {/* Header section with background pattern */}
          <div className="bg-slate-900 text-white p-10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-red/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            
            <button 
              onClick={onClose} 
              className="absolute top-6 right-6 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
              <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-[28px] flex items-center justify-center border border-white/10 shadow-xl shrink-0">
                <Building2 className="w-12 h-12 text-brand-red" />
              </div>
              <div>
                <h2 className="text-4xl font-black tracking-tight mb-2">{subsidiary.name}</h2>
                {subsidiary.description && (
                  <p className="text-white/70 text-lg font-medium max-w-2xl leading-relaxed">
                    {subsidiary.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="p-10 flex flex-col lg:flex-row gap-12">
            
            {/* Left Column: Details & Mission/Vision */}
            <div className="lg:w-1/3 space-y-10">
              {/* Contact Info */}
              <div className="bg-slate-50 rounded-[32px] p-8 border border-slate-100">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Contact & Details</h3>
                <div className="space-y-5">
                  {subsidiary.location && (
                    <div className="flex items-start gap-4 text-slate-600">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                        <MapPin className="w-5 h-5 text-brand-red" />
                      </div>
                      <span className="text-sm font-medium pt-2 leading-relaxed">{subsidiary.location}</span>
                    </div>
                  )}
                  {subsidiary.phone && (
                    <div className="flex items-center gap-4 text-slate-600">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                        <Phone className="w-5 h-5 text-brand-red" />
                      </div>
                      <span className="text-sm font-medium">{subsidiary.phone}</span>
                    </div>
                  )}
                  {subsidiary.email && (
                    <div className="flex items-center gap-4 text-slate-600">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                        <Mail className="w-5 h-5 text-brand-red" />
                      </div>
                      <a href={`mailto:${subsidiary.email}`} className="text-sm font-medium hover:text-brand-red transition-colors truncate">
                        {subsidiary.email}
                      </a>
                    </div>
                  )}
                  {subsidiary.website && (
                    <div className="flex items-center gap-4 text-slate-600">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                        <Globe className="w-5 h-5 text-brand-red" />
                      </div>
                      <a href={subsidiary.website.startsWith('http') ? subsidiary.website : `https://${subsidiary.website}`} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-brand-red hover:underline truncate">
                        {subsidiary.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Mission & Vision */}
              {(subsidiary.mission || subsidiary.vision) && (
                <div className="space-y-6">
                  {subsidiary.mission && (
                    <div className="bg-red-50/50 rounded-[32px] p-8 border border-red-100">
                      <div className="flex items-center gap-3 mb-4 text-brand-red">
                        <Target className="w-6 h-6" />
                        <h3 className="font-black text-lg tracking-tight">Our Mission</h3>
                      </div>
                      <p className="text-slate-600 text-sm leading-relaxed font-medium">
                        {subsidiary.mission}
                      </p>
                    </div>
                  )}
                  {subsidiary.vision && (
                    <div className="bg-slate-900 rounded-[32px] p-8 border border-slate-800">
                      <div className="flex items-center gap-3 mb-4 text-white">
                        <Eye className="w-6 h-6 text-brand-red" />
                        <h3 className="font-black text-lg tracking-tight">Our Vision</h3>
                      </div>
                      <p className="text-white/70 text-sm leading-relaxed font-medium">
                        {subsidiary.vision}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Board of Directors */}
            <div className="lg:w-2/3">
              <div className="flex items-center gap-3 mb-8">
                <Users className="w-8 h-8 text-slate-300" />
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Board of Directors & Leadership</h3>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-10 h-10 border-4 border-slate-200 border-t-brand-red rounded-full animate-spin"></div>
                </div>
              ) : directors.length === 0 ? (
                <div className="bg-slate-50 rounded-[32px] border border-dashed border-slate-200 p-12 text-center">
                  <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 font-medium">No directors listed for this subsidiary.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {directors.map((dir, i) => (
                    <motion.div 
                      key={dir.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="bg-white border border-slate-100 rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all flex flex-col group"
                    >
                      <div className="flex items-center gap-5 mb-5">
                        <div className="w-20 h-20 rounded-[20px] bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200 group-hover:border-brand-red/30 transition-colors">
                          {dir.image_url ? (
                            <img src={dir.image_url} alt={dir.name} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-8 h-8 text-slate-300" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 text-lg leading-tight mb-1">{dir.name}</h4>
                          <p className="text-[10px] font-black uppercase tracking-widest text-brand-red">{dir.title}</p>
                        </div>
                      </div>
                      {dir.bio && (
                        <p className="text-sm text-slate-500 leading-relaxed font-medium mt-auto">
                          {dir.bio}
                        </p>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default SubsidiaryProfileModal;
