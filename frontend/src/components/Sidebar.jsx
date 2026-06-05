import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Rss,
  Building2,
  Users,
  FileText,
  BookOpen,
  Layers,
  Calendar,
  Settings,
  HelpCircle,
  Cpu,
  Heart,
  ChevronDown,
  LayoutGrid,
  Newspaper,
  Camera,
  X,
  ExternalLink,
  ChevronRight,
  MessageSquare,
  Megaphone,
  Gift
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Sidebar = ({ onClose }) => {
  const { user } = useAuth();
  const location = useLocation();

  const isDirectoryActive = location.pathname.startsWith('/directory') || location.pathname.startsWith('/365-directory');
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(isDirectoryActive);

  useEffect(() => {
    if (isDirectoryActive) {
      setIsDirectoryOpen(true);
    }
  }, [location.pathname, isDirectoryActive]);

  const isAdmin = user?.role === 'super_admin' || user?.role === 'sub_admin' || user?.role === 'it_admin' || user?.role === 'hr_admin';

  const userDept = user?.department?.toLowerCase() || '';
  const adminSupportItems = [];
  if (user?.role === 'super_admin') {
    adminSupportItems.push({ name: 'IT Service Desk', icon: Cpu, path: '/admin/tickets/it' });
    adminSupportItems.push({ name: 'HR Request Center', icon: Heart, path: '/admin/tickets/hr' });
  } else if (user?.role === 'it_admin') {
    adminSupportItems.push({ name: 'IT Service Desk', icon: Cpu, path: '/admin/tickets/it' });
  } else if (user?.role === 'hr_admin') {
    adminSupportItems.push({ name: 'HR Request Center', icon: Heart, path: '/admin/tickets/hr' });
  } else if (user?.role === 'sub_admin') {
    if (userDept === 'it') {
      adminSupportItems.push({ name: 'IT Service Desk', icon: Cpu, path: '/admin/tickets/it' });
    } else if (userDept === 'hr') {
      adminSupportItems.push({ name: 'HR Request Center', icon: Heart, path: '/admin/tickets/hr' });
    } else {
      adminSupportItems.push({ name: 'Support Desk', icon: HelpCircle, path: '/admin/tickets' });
    }
  }

  const isSpecializedAdmin = user?.role === 'it_admin' || user?.role === 'hr_admin' || (user?.role === 'sub_admin' && (userDept === 'it' || userDept === 'hr'));

  const sections = [
    {
      label: 'Main Navigation',
      items: [
        { name: 'Dashboard', icon: LayoutGrid, path: '/' },
        { name: 'Company Feed', icon: Rss, path: '/feed', badge: 'NEW' },
        { name: 'Subsidiaries', icon: Building2, path: '/subsidiary' },
        {
          name: 'Employee Directory',
          icon: Users,
          subItems: [
            { name: 'All Employees', path: '/directory' },
            { name: '365 Employees', path: '/365-directory' }
          ]
        },
        { name: 'Direct Messages', icon: MessageSquare, path: '/messages' },
        { name: 'Media Center', icon: Newspaper, path: '/news' },
        { name: 'Memories Wall', icon: Camera, path: '/memories' },
      ]
    },
    {
      label: 'Resources',
      items: [
        { name: 'Documents', icon: FileText, path: '/documents' },
        { name: 'Calendar', icon: Calendar, path: '/calendar' },
        { name: 'Help & Support', icon: HelpCircle, path: '/help' },
      ]
    },
    ...(isAdmin ? [{
      label: user?.role === 'super_admin' ? 'Group Administration' : `${user?.subsidiary_name || 'Subsidiary'} Admin`,
      items: isSpecializedAdmin ? adminSupportItems : [
        ...adminSupportItems,
        ...(user?.role === 'super_admin' ? [{ name: 'Subsidiaries Manager', icon: Building2, path: '/admin/subsidiaries' }] : []),
        { name: 'Media Manager', icon: Newspaper, path: '/admin/news' },
        { name: 'Document Manager', icon: FileText, path: '/admin/documents' },
        { name: 'Calendar Manager', icon: Calendar, path: '/admin/calendar' },
        { name: 'Memory Wall', icon: Camera, path: '/admin/memories' },
        { name: 'Employee Manager', icon: Users, path: '/admin/directory' },
        { name: 'Alerts Manager', icon: Megaphone, path: '/admin/alerts' },
        { name: 'Offers Manager', icon: Gift, path: '/admin/offers' },
      ]
    }] : [])
  ];

  return (
    <aside className="w-[280px] sm:w-[320px] lg:w-[280px] bg-brand-red-dark h-full text-white/70 flex flex-col shadow-2xl relative overflow-hidden">

      {/* Decorative Background Element */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      {/* Mobile Close Button */}
      <button
        onClick={onClose}
        className="lg:hidden absolute right-6 top-8 w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white active:scale-90 transition-all z-[80]"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Brand Section */}
      <div className="p-8 mb-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xl font-black text-brand-red text-2xl rotate-[-5deg] hover:rotate-0 transition-transform cursor-pointer">
            GS
          </div>
          <div>
            <h1 className="text-white font-black text-2xl tracking-tighter leading-none">API Family</h1>
            <p className="text-white/50 text-[10px] font-black uppercase tracking-[3px] mt-1">Intranet Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-4 space-y-10 overflow-y-auto custom-scrollbar pb-8 relative z-10">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-4">
            <p className="px-5 text-[11px] font-black text-white/40 uppercase tracking-[4px]">{section.label}</p>
            <div className="space-y-1.5">
              {section.items.map((item) => {
                if (item.subItems) {
                  const isExpanded = item.name === 'Employee Directory' ? isDirectoryOpen : false;
                  const toggleExpand = () => {
                    if (item.name === 'Employee Directory') {
                      setIsDirectoryOpen(!isDirectoryOpen);
                    }
                  };
                  const isAnySubActive = item.subItems.some(sub => location.pathname === sub.path);

                  return (
                    <div key={item.name} className="space-y-1">
                      <button
                        onClick={toggleExpand}
                        className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-[20px] transition-all duration-300 group relative text-left outline-none cursor-pointer ${isAnySubActive
                          ? 'bg-white/15 text-white shadow-lg font-black'
                          : 'hover:bg-white/10 hover:text-white font-bold'
                        }`}
                      >
                        <item.icon className={`w-5.5 h-5.5 transition-transform group-hover:scale-110 ${isAnySubActive ? 'text-white' : 'text-white/60 group-hover:text-white'}`} />
                        <span className="text-[15px] tracking-tight">{item.name}</span>
                        <ChevronDown className={`w-4 h-4 ml-auto transition-transform duration-300 ${isExpanded ? 'rotate-180 text-white' : 'text-white/40 group-hover:text-white'}`} />
                      </button>

                      <motion.div
                        initial={false}
                        animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden pl-6 space-y-1"
                      >
                        {item.subItems.map((sub) => (
                          <NavLink
                            key={sub.name}
                            to={sub.path}
                            onClick={() => {
                              if (window.innerWidth < 1024) onClose();
                            }}
                            className={({ isActive }) =>
                              `flex items-center gap-3 px-5 py-2.5 rounded-[15px] transition-all duration-200 group relative ${isActive
                                ? 'bg-white text-brand-red font-black scale-[1.02] shadow-md shadow-black/10'
                                : 'hover:bg-white/5 hover:text-white font-bold text-white/60'
                              }`
                            }
                          >
                            {({ isActive }) => (
                              <>
                                <span className={`w-1.5 h-1.5 rounded-full transition-transform ${isActive ? 'bg-brand-red scale-125' : 'bg-white/30 group-hover:bg-white'}`} />
                                <span className="text-[13px] tracking-tight">{sub.name}</span>
                                {isActive && (
                                  <motion.div
                                    layoutId="activeSubIndicator"
                                    className="absolute left-[-12px] w-1 h-5 bg-white rounded-r-full"
                                  />
                                )}
                              </>
                            )}
                          </NavLink>
                        ))}
                      </motion.div>
                    </div>
                  );
                }

                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={({ isActive }) =>
                      `flex items-center gap-4 px-5 py-3.5 rounded-[20px] transition-all duration-300 group relative ${isActive
                        ? 'bg-white text-brand-red shadow-2xl shadow-black/20 font-black scale-[1.02]'
                        : 'hover:bg-white/10 hover:text-white font-bold'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className={`w-5.5 h-5.5 transition-transform group-hover:scale-110 ${isActive ? 'text-brand-red' : 'text-white/60 group-hover:text-white'}`} />
                        <span className="text-[15px] tracking-tight">{item.name}</span>

                        {item.badge && (
                          <span className="ml-auto bg-brand-red text-white text-[8px] px-2 py-0.5 rounded-full font-black tracking-widest shadow-lg">
                            {item.badge}
                          </span>
                        )}

                        {isActive && (
                          <motion.div
                            layoutId="activeIndicator"
                            className="absolute left-[-12px] w-1.5 h-8 bg-white rounded-r-full shadow-[2px_0_8px_rgba(255,255,255,0.5)]"
                          />
                        )}

                        {!isActive && (
                          <ChevronRight className="w-4 h-4 ml-auto opacity-0 -translate-x-2 group-hover:opacity-30 group-hover:translate-x-0 transition-all" />
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer / User Profile */}
      <div className="p-6 mt-auto border-t border-white/5 relative z-10">
        <NavLink
          to="/settings"
          onClick={() => {
            if (window.innerWidth < 1024) onClose();
          }}
          className="bg-black/10 rounded-[28px] p-4 flex items-center gap-3 border border-white/5 group transition-all hover:bg-black/20 cursor-pointer w-full text-left"
        >
          <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center text-white font-black text-xs shadow-lg group-hover:bg-brand-red transition-all shrink-0">
            {user?.profile_pic ? (
              <img src={user.profile_pic} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="uppercase">{user?.full_name?.charAt(0) || 'U'}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-xs font-black truncate leading-none mb-1">{user?.full_name || 'Guest'}</p>
            <p className="text-white/40 text-[9px] uppercase tracking-widest font-bold truncate">
              {user?.role ? user.role.replace('_', ' ') : 'Visitor Account'}
            </p>
          </div>
          <Settings className="w-4 h-4 ml-auto opacity-30 group-hover:opacity-100 transition-opacity shrink-0" />
        </NavLink>

        <a
          href="https://georgesteuart.lk"
          target="_blank"
          className="flex items-center justify-center gap-2 mt-6 text-[9px] font-black text-white/30 hover:text-white transition-colors uppercase tracking-[3px]"
        >
          <ExternalLink className="w-3 h-3" />
          Visit GS Global
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;
