import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth.ts';

interface RoleRouteProps {
  children: React.ReactNode;
  role: 'guest' | 'host';
}

export default function RoleRoute({ children, role }: RoleRouteProps) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex justify-center items-center h-40">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}
