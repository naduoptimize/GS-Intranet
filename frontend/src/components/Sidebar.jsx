import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Rss,
  Building2,
  Users,
  FileText,
  Calendar,
  Settings,
  ChevronDown,
  LayoutGrid,
  Newspaper,
  Camera,
  X,
  ExternalLink,
  ChevronRight,
  MessageSquare,
  Megaphone
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const Sidebar = ({ onClose }) => {
  const { user } = useAuth();
  const location = useLocation();

  const isDirectoryActive = location.pathname.startsWith('/directory');
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(isDirectoryActive);

  const isSuperOrGroupAdmin = user?.role === 'superadmin' || user?.role === 'super_admin' || user?.role === 'groupadmin' || user?.role === 'group_admin';
  const isSubAdmin = user?.role === 'subadmin' || user?.role === 'sub_admin';
  const isAdmin = isSuperOrGroupAdmin || isSubAdmin;

  const sections = [
    {
      label: 'Main Navigation',
      items: [
        { name: 'Dashboard', icon: LayoutGrid, path: '/' },
        { name: 'Company Feed', icon: Rss, path: '/feed', badge: 'NEW' },
        { name: 'Subsidiaries', icon: Building2, path: '/subsidiary' },
        { name: 'Employee Directory', icon: Users, path: '/directory' },
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
      ]
    },
    ...(isAdmin ? [{
      label: isSuperOrGroupAdmin ? 'Group Administration' : `${user?.subsidiary_name || 'Subsidiary'} Admin`,
      items: isSuperOrGroupAdmin ? [
        { name: 'Admin Dashboard', icon: LayoutGrid, path: '/admin/dashboard' },
        { name: 'Subsidiaries Manager', icon: Building2, path: '/admin/subsidiaries' },
        { name: 'Employee Manager', icon: Users, path: '/admin/directory' },
        { name: 'Broadcast & Notices', icon: Megaphone, path: '/admin/communications' },
        { name: 'Media Manager', icon: Newspaper, path: '/admin/news' },
        { name: 'Document Manager', icon: FileText, path: '/admin/documents' },
        { name: 'Calendar Manager', icon: Calendar, path: '/admin/calendar' },
        { name: 'Memory Wall', icon: Camera, path: '/admin/memories' },
      ] : [
        { name: 'Employee Manager', icon: Users, path: '/admin/directory' },
        { name: 'Broadcast & Notices', icon: Megaphone, path: '/admin/communications' },
      ]
    }] : [])
  ];

  const formatRole = (r) => {
    if (!r) return 'Employee';
    if (r === 'superadmin' || r === 'super_admin') return 'Super Admin';
    if (r === 'groupadmin' || r === 'group_admin') return 'Group Admin';
    if (r === 'subadmin' || r === 'sub_admin') return 'Sub Admin';
    if (r === 'employee') return 'Employee';
    return r.replace('_', ' ');
  };

  return (
    <aside className="w-[240px] xl:w-[250px] bg-brand-red h-full text-white/70 flex flex-col shadow-xl relative overflow-hidden select-none">

      {/* Decorative Background Element */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      {/* Mobile Close Button */}
      <button
        onClick={onClose}
        className="lg:hidden absolute right-4 top-4 w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-white active:scale-90 transition-all z-[80]"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Brand Section */}
      <div className="px-4 py-4 mb-1 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-lg font-black text-brand-red text-lg rotate-[-5deg] hover:rotate-0 transition-transform cursor-pointer shrink-0">
            GS
          </div>
          <div className="min-w-0">
            <h1 className="text-white font-black text-lg tracking-tight leading-none truncate">API Family</h1>
            <p className="text-white/50 text-[9px] font-black uppercase tracking-[2.5px] mt-1">Intranet Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-2.5 space-y-4 overflow-y-auto custom-scrollbar pb-4 relative z-10">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <p className="px-3 text-[10px] font-black text-white/40 uppercase tracking-[3px] mb-1.5">{section.label}</p>
            <div className="space-y-1">
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
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group relative text-left outline-none cursor-pointer ${isAnySubActive
                          ? 'bg-white/15 text-white shadow font-black'
                          : 'hover:bg-white/10 hover:text-white font-semibold'
                        }`}
                      >
                        <item.icon className={`w-4 h-4 transition-transform group-hover:scale-110 shrink-0 ${isAnySubActive ? 'text-white' : 'text-white/60 group-hover:text-white'}`} />
                        <span className="text-[13px] tracking-tight truncate">{item.name}</span>
                        <ChevronDown className={`w-3.5 h-3.5 ml-auto transition-transform duration-300 shrink-0 ${isExpanded ? 'rotate-180 text-white' : 'text-white/40 group-hover:text-white'}`} />
                      </button>

                      <motion.div
                        initial={false}
                        animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden pl-4 space-y-0.5"
                      >
                        {item.subItems.map((sub) => (
                          <NavLink
                            key={sub.name}
                            to={sub.path}
                            onClick={() => {
                              if (window.innerWidth < 1024) onClose();
                            }}
                            className={({ isActive }) =>
                              `flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-all duration-150 group relative ${isActive
                                ? 'bg-white text-brand-red font-black shadow-sm'
                                : 'hover:bg-white/5 hover:text-white font-medium text-white/60'
                              }`
                            }
                          >
                            {({ isActive }) => (
                              <>
                                <span className={`w-1.5 h-1.5 rounded-full transition-transform ${isActive ? 'bg-brand-red scale-125' : 'bg-white/30 group-hover:bg-white'}`} />
                                <span className="text-[12px] tracking-tight truncate">{sub.name}</span>
                                {isActive && (
                                  <motion.div
                                    layoutId="activeSubIndicator"
                                    className="absolute left-[-8px] w-1 h-4 bg-white rounded-r-full"
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
                      `flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 group relative ${isActive
                        ? 'bg-white text-brand-red shadow-lg shadow-black/15 font-black'
                        : 'hover:bg-white/10 hover:text-white font-semibold'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon className={`w-4 h-4 transition-transform group-hover:scale-110 shrink-0 ${isActive ? 'text-brand-red' : 'text-white/60 group-hover:text-white'}`} />
                        <span className="text-[13px] tracking-tight truncate">{item.name}</span>

                        {item.badge && (
                          <span className="ml-auto bg-brand-red text-white text-[8px] px-1.5 py-0.5 rounded-full font-black tracking-wider shadow">
                            {item.badge}
                          </span>
                        )}

                        {isActive && (
                          <motion.div
                            layoutId="activeIndicator"
                            className="absolute left-[-10px] w-1.5 h-6 bg-white rounded-r-full"
                          />
                        )}

                        {!isActive && (
                          <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-0 -translate-x-1 group-hover:opacity-40 group-hover:translate-x-0 transition-all shrink-0" />
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
      <div className="p-3 mt-auto border-t border-white/10 relative z-10">
        <NavLink
          to="/settings"
          onClick={() => {
            if (window.innerWidth < 1024) onClose();
          }}
          className="bg-black/15 rounded-xl p-2.5 flex items-center gap-2.5 border border-white/5 group transition-all hover:bg-black/25 cursor-pointer w-full text-left"
        >
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center text-white font-black text-xs shadow-md group-hover:bg-brand-red transition-all shrink-0">
            {user?.profile_pic ? (
              <img src={user.profile_pic} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="uppercase text-[11px]">{user?.full_name?.charAt(0) || 'U'}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-[12px] font-bold truncate leading-tight">{user?.full_name || 'Guest'}</p>
            <p className="text-white/50 text-[9px] uppercase tracking-wider font-semibold truncate mt-0.5">
              {formatRole(user?.role)}
            </p>
          </div>
          <Settings className="w-3.5 h-3.5 ml-auto opacity-40 group-hover:opacity-100 transition-opacity shrink-0 text-white" />
        </NavLink>

        <a
          href="https://georgesteuart.lk"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 mt-2.5 text-[9px] font-black text-white/30 hover:text-white transition-colors uppercase tracking-[2px]"
        >
          <ExternalLink className="w-2.5 h-2.5" />
          Visit GS Global
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;
