import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: UserRole;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { isAuthenticated, hasRole } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (!hasRole(requiredRole)) {
    // If they're authenticated but don't have the required role
    // Redirect admin/manager to admin dashboard, employees to POS
    return hasRole('admin') || hasRole('manager') 
      ? <Navigate to="/admin" /> 
      : <Navigate to="/" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;