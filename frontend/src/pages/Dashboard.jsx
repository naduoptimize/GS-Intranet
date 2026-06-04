import { useAuth } from '../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import EmployeeDashboard from './EmployeeDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  // Route to the appropriate dashboard based on user role
  if (user?.role === 'super_admin' || user?.role === 'sub_admin' || user?.role === 'it_admin' || user?.role === 'hr_admin') {
    return <AdminDashboard />;
  }

  return <EmployeeDashboard />;
};

export default Dashboard;
