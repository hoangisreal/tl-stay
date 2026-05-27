import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth.ts';
import type { UserRole } from '../services/authService.ts';

interface RoleRouteProps {
  children: React.ReactNode;
  role?: UserRole;
  roles?: UserRole[];
}

export default function RoleRoute({ children, role, roles }: RoleRouteProps) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex justify-center items-center h-40">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  const allowedRoles = roles ?? (role ? [role] : []);
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
