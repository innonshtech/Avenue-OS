import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';

export default function ProtectedRoute() {
  const { isAuthenticated, isCheckingSession, user } = useAuthStore();
  const location = useLocation();

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-zinc-400 text-sm font-medium tracking-wide">Authenticating secure session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  if (user?.role === 'ADMIN' && (location.pathname === '/dashboard' || location.pathname.startsWith('/dashboard/'))) {
    return <Navigate to="/admin" replace />;
  }

  return <Outlet />;
}
