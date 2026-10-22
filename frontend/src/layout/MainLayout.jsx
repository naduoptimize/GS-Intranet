import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import TopNav from '../components/TopNav';
import { motion, AnimatePresence } from 'framer-motion';

const MainLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      
      {/* ── DESKTOP SIDEBAR (Static/Sticky) ── */}
      <div className="hidden lg:block w-[240px] xl:w-[250px] shrink-0 h-screen sticky top-0 z-[50]">
        <Sidebar />
      </div>

      {/* ── MOBILE SIDEBAR (Drawer) ── */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[260px] z-[70] lg:hidden"
            >
              <Sidebar onClose={() => setIsSidebarOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        {/* Mobile Header */}
        <header className="lg:hidden h-14 bg-brand-red flex items-center justify-between px-4 sticky top-0 z-[40] shadow-md">
           <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center font-black text-brand-red text-sm rotate-[-5deg]">GS</div>
              <span className="text-white font-black tracking-tight text-sm uppercase">API Family</span>
           </div>
           <button 
             onClick={() => setIsSidebarOpen(true)}
             className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white active:scale-95 transition-all"
           >
             <Menu className="w-5 h-5" />
           </button>
        </header>

        {/* Desktop TopNav */}
        <TopNav />
        
        {/* Page Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 xl:px-10 py-6">
          <div className="w-full max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
