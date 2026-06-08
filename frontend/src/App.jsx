import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import MainLayout from './layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Feed from './pages/Feed';
import DocumentCenter from './pages/DocumentCenter';
import AdminDocuments from './pages/AdminDocuments';
import EmployeeDirectory from './pages/EmployeeDirectory';
import ComingSoon365 from './pages/ComingSoon365';
import ManualDirectory from './pages/ManualDirectory';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminDirectory from './pages/AdminDirectory';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import MySubsidiary from './pages/MySubsidiary';
import SubsidiaryDetail from './pages/SubsidiaryDetail';
import HolidayCalendar from './pages/HolidayCalendar';
import HelpDesk from './pages/HelpDesk';
import Settings from './pages/Settings';
import AdminManagement from './pages/AdminManagement';
import ForcePasswordChange from './pages/ForcePasswordChange';
import News from './pages/News';
import AdminNews from './pages/AdminNews';
import MemoriesWall from './pages/MemoriesWall';
import AdminCalendar from './pages/AdminCalendar';
import AdminMemories from './pages/AdminMemories';
import DirectMessages from './pages/DirectMessages';
import AdminAlerts from './pages/AdminAlerts'; // Admin alerts panel
import AdminOffers from './pages/AdminOffers';
import AdminSubsidiaries from './pages/AdminSubsidiaries';
import ITServiceDesk from './pages/ITServiceDesk';
import HRRequestCenter from './pages/HRRequestCenter';
import TicketDetailView from './pages/TicketDetailView';
import Offers from './pages/Offers';
import Alerts from './pages/Alerts';

// Protected Route Component
const ProtectedRoute = ({ children, roles, departments }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-bg-light">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-brand-red rounded-full animate-spin"></div>
    </div>
  );

  if (!user) return <Navigate to="/login" />;

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  // Department-level isolation for sub-admins
  if (user.role === 'sub_admin' && departments && !departments.some(d => user.department?.toLowerCase() === d.toLowerCase())) {
    return <Navigate to="/" />;
  }

  if (user.needs_password_change && window.location.pathname !== '/force-password-change') {
    return <Navigate to="/force-password-change" />;
  }

  return children;
};

function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('gs-theme') || 'Light';
    const root = document.documentElement;
    
    if (savedTheme === 'Dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Restore Theme Preset custom variables
    const themePresets = {
      'Classic Crimson': { primary: '#C8102E', dark: '#A30D25', light: '#FDECEF', sidebarDark: '#A30D25' },
      'Teas Emerald': { primary: '#10B981', dark: '#065F46', light: '#ECFDF5', sidebarDark: '#065F46' },
      'Citrus Sunrise': { primary: '#F59E0B', dark: '#D97706', light: '#FEF3C7', sidebarDark: '#D97706' },
      'Royal Velvet': { primary: '#8B5CF6', dark: '#6D28D9', light: '#F5F3FF', sidebarDark: '#6D28D9' },
      'Ocean Breeze': { primary: '#3B82F6', dark: '#1D4ED8', light: '#EFF6FF', sidebarDark: '#1D4ED8' }
    };
    const savedPreset = localStorage.getItem('gs-theme-preset') || 'Classic Crimson';
    const preset = themePresets[savedPreset] || themePresets['Classic Crimson'];
    root.style.setProperty('--color-brand-red', preset.primary);
    root.style.setProperty('--color-brand-red-dark', preset.dark);
    root.style.setProperty('--color-brand-red-light', preset.light);
    root.style.setProperty('--color-sidebar-dark', preset.sidebarDark);
  }, []);

  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/register" element={<Navigate to="/login" replace />} />
          <Route path="/force-password-change" element={
            <ProtectedRoute>
              <ForcePasswordChange />
            </ProtectedRoute>
          } />

          {/* Protected Main Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="feed" element={<Feed />} />
            <Route path="subsidiary" element={<MySubsidiary />} />
            <Route path="subsidiary/:id" element={<SubsidiaryDetail />} />
            <Route path="documents" element={<DocumentCenter />} />
            <Route path="directory" element={<EmployeeDirectory />} />
            <Route path="365-directory" element={<ComingSoon365 />} />
            <Route path="manual-directory" element={<ManualDirectory />} />
            <Route path="calendar" element={<HolidayCalendar />} />
            <Route path="help" element={<HelpDesk />} />
            <Route path="settings" element={<Settings />} />
            <Route path="news" element={<News />} />
            <Route path="memories" element={<MemoriesWall />} />
            <Route path="messages" element={<DirectMessages />} />
            <Route path="offers" element={<Offers />} />
            <Route path="alerts" element={<Alerts />} />
            
            {/* Admin Only Routes */}
            <Route path="admin/analytics" element={
              <ProtectedRoute roles={['super_admin', 'sub_admin', 'it_admin', 'hr_admin']}>
                <AdminAnalytics />
              </ProtectedRoute>
            } />
            <Route path="admin/tickets" element={
              <ProtectedRoute roles={['super_admin', 'sub_admin', 'it_admin', 'hr_admin']}>
                <HelpDesk />
              </ProtectedRoute>
            } />
            <Route path="admin/tickets/it" element={
              <ProtectedRoute roles={['super_admin', 'sub_admin', 'it_admin']} departments={['it']}>
                <ITServiceDesk />
              </ProtectedRoute>
            } />
            <Route path="admin/tickets/it/:id" element={
              <ProtectedRoute roles={['super_admin', 'sub_admin', 'it_admin', 'it_staff']} departments={['it']}>
                <TicketDetailView department="it" />
              </ProtectedRoute>
            } />
            <Route path="admin/tickets/hr" element={
              <ProtectedRoute roles={['super_admin', 'sub_admin', 'hr_admin']} departments={['hr']}>
                <HRRequestCenter />
              </ProtectedRoute>
            } />
            <Route path="admin/tickets/hr/:id" element={
              <ProtectedRoute roles={['super_admin', 'sub_admin', 'hr_admin', 'hr_staff']} departments={['hr']}>
                <TicketDetailView department="hr" />
              </ProtectedRoute>
            } />
            <Route path="admin/directory" element={
              <ProtectedRoute roles={['super_admin', 'sub_admin', 'it_admin', 'hr_admin']}>
                <AdminDirectory />
              </ProtectedRoute>
            } />
            <Route path="admin/management" element={
              <ProtectedRoute roles={['super_admin', 'sub_admin', 'it_admin', 'hr_admin']}>
                <AdminManagement />
              </ProtectedRoute>
            } />
            <Route path="admin/news" element={
              <ProtectedRoute roles={['super_admin', 'sub_admin', 'it_admin', 'hr_admin']}>
                <AdminNews />
              </ProtectedRoute>
            } />
            <Route path="admin/documents" element={
              <ProtectedRoute roles={['super_admin', 'sub_admin', 'it_admin', 'hr_admin']}>
                <AdminDocuments />
              </ProtectedRoute>
            } />
            <Route path="admin/calendar" element={
              <ProtectedRoute roles={['super_admin', 'sub_admin', 'it_admin', 'hr_admin']}>
                <AdminCalendar />
              </ProtectedRoute>
            } />
            <Route path="admin/alerts" element={
              <ProtectedRoute roles={['super_admin', 'sub_admin', 'it_admin', 'hr_admin']}>
                <AdminAlerts />
              </ProtectedRoute>
            } />
            <Route path="admin/offers" element={
              <ProtectedRoute roles={['super_admin', 'sub_admin', 'it_admin', 'hr_admin']}>
                <AdminOffers />
              </ProtectedRoute>
            } />
            <Route path="admin/subsidiaries" element={
              <ProtectedRoute roles={['super_admin']}>
                <AdminSubsidiaries />
              </ProtectedRoute>
            } />
            <Route path="admin/memories" element={
              <ProtectedRoute roles={['super_admin', 'sub_admin', 'it_admin', 'hr_admin']}>
                <AdminMemories />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
