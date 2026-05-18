import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth.ts';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex justify-center items-center h-40">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
