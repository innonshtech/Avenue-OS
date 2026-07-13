import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { FeatureFlag } from '@/types/user';

interface PermissionProtectedRouteProps {
  requiredFlag: FeatureFlag;
}

export default function PermissionProtectedRoute({ requiredFlag }: PermissionProtectedRouteProps) {
  const { user, isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Admin bypasses all checks implicitly if they have all flags, 
  // but just in case, we check if they have the flag
  if (user && !user.permissions?.includes(requiredFlag)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
