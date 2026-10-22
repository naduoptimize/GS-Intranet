import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import MainLayout from './layout/MainLayout';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import DocumentCenter from './pages/DocumentCenter';
import AdminDocuments from './pages/AdminDocuments';
import EmployeeDirectory from './pages/EmployeeDirectory';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminDirectory from './pages/AdminDirectory';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import MySubsidiary from './pages/MySubsidiary';
import SubsidiaryDetail from './pages/SubsidiaryDetail';
import HolidayCalendar from './pages/HolidayCalendar';
import Settings from './pages/Settings';
import AdminManagement from './pages/AdminManagement';
import ForcePasswordChange from './pages/ForcePasswordChange';
import News from './pages/News';
import AdminNews from './pages/AdminNews';
import MemoriesWall from './pages/MemoriesWall';
import AdminCalendar from './pages/AdminCalendar';
import AdminMemories from './pages/AdminMemories';
import DirectMessages from './pages/DirectMessages';
import AdminSubsidiaries from './pages/AdminSubsidiaries';
import AdminCommunications from './pages/AdminCommunications';
import CommunicationsHub from './pages/CommunicationsHub';

// Protected Route Component
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-bg-light">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-brand-red rounded-full animate-spin"></div>
    </div>
  );

  if (!user) return <Navigate to="/login" />;

  const normalizedUserRole = user.role?.replace('_', '') || 'employee';

  if (roles) {
    const normalizedRoles = roles.map(r => r.replace('_', ''));
    if (!normalizedRoles.includes(normalizedUserRole) && !roles.includes(user.role)) {
      return <Navigate to="/" />;
    }
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

    const preset = { primary: '#C41230', dark: '#9E0E27', light: '#FFF0F3', sidebarDark: '#C41230' };
    localStorage.setItem('gs-theme-preset', 'George Steuart Heritage');
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
            <Route path="feed" element={<CommunicationsHub />} />
            <Route path="subsidiary" element={<MySubsidiary />} />
            <Route path="subsidiary/:id" element={<SubsidiaryDetail />} />
            <Route path="documents" element={<DocumentCenter />} />
            <Route path="directory" element={<EmployeeDirectory />} />
            <Route path="365-directory" element={<Navigate to="/directory" replace />} />
            <Route path="manual-directory" element={<Navigate to="/directory" replace />} />
            <Route path="calendar" element={<HolidayCalendar />} />
            <Route path="help" element={<Navigate to="/" replace />} />
            <Route path="settings" element={<Settings />} />
            <Route path="news" element={<News />} />
            <Route path="memories" element={<MemoriesWall />} />
            <Route path="messages" element={<DirectMessages />} />
            <Route path="communications" element={<Navigate to="/feed" replace />} />
            <Route path="offers" element={<CommunicationsHub />} />
            <Route path="alerts" element={<CommunicationsHub />} />
            
            {/* Admin Only Routes */}
            <Route path="admin/dashboard" element={
              <ProtectedRoute roles={['superadmin', 'groupadmin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="admin/analytics" element={
              <ProtectedRoute roles={['superadmin', 'groupadmin', 'subadmin']}>
                <AdminAnalytics />
              </ProtectedRoute>
            } />
            <Route path="admin/directory" element={
              <ProtectedRoute roles={['superadmin', 'groupadmin', 'subadmin']}>
                <AdminDirectory />
              </ProtectedRoute>
            } />
            <Route path="admin/management" element={
              <ProtectedRoute roles={['superadmin', 'groupadmin', 'subadmin']}>
                <AdminManagement />
              </ProtectedRoute>
            } />
            <Route path="admin/news" element={
              <ProtectedRoute roles={['superadmin', 'groupadmin', 'subadmin']}>
                <AdminNews />
              </ProtectedRoute>
            } />
            <Route path="admin/documents" element={
              <ProtectedRoute roles={['superadmin', 'groupadmin', 'subadmin']}>
                <AdminDocuments />
              </ProtectedRoute>
            } />
            <Route path="admin/calendar" element={
              <ProtectedRoute roles={['superadmin', 'groupadmin', 'subadmin']}>
                <AdminCalendar />
              </ProtectedRoute>
            } />
            <Route path="admin/communications" element={
              <ProtectedRoute roles={['superadmin', 'groupadmin', 'subadmin']}>
                <AdminCommunications />
              </ProtectedRoute>
            } />
            <Route path="admin/alerts" element={
              <ProtectedRoute roles={['superadmin', 'groupadmin', 'subadmin']}>
                <AdminCommunications />
              </ProtectedRoute>
            } />
            <Route path="admin/offers" element={
              <ProtectedRoute roles={['superadmin', 'groupadmin', 'subadmin']}>
                <AdminCommunications />
              </ProtectedRoute>
            } />
            <Route path="admin/subsidiaries" element={
              <ProtectedRoute roles={['superadmin', 'groupadmin']}>
                <AdminSubsidiaries />
              </ProtectedRoute>
            } />
            <Route path="admin/memories" element={
              <ProtectedRoute roles={['superadmin', 'groupadmin', 'subadmin']}>
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
