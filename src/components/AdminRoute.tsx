import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIsAdmin } from '@/hooks/data/useIsAdmin';
import { useAdminAccessGuard } from '@/hooks/useAdminAccessGuard';
import { Skeleton } from '@/components/ui/skeleton';
import { ShieldAlert } from 'lucide-react';

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const location = useLocation();
  const { isBlocked, logUnauthorizedAttempt } = useAdminAccessGuard();

  // Log unauthorized access attempts
  useEffect(() => {
    if (!loading && !adminLoading && user && isAdmin === false) {
      logUnauthorizedAttempt(user.id, location.pathname);
    }
  }, [loading, adminLoading, user, isAdmin, location.pathname, logUnauthorizedAttempt]);

  if (loading || adminLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4 w-full max-w-md p-8">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    if (isBlocked) {
      return (
        <div className="flex h-screen items-center justify-center bg-background">
          <div className="text-center max-w-md p-8 space-y-4">
            <ShieldAlert className="h-16 w-16 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold text-foreground">Acceso Restringido</h1>
            <p className="text-muted-foreground">
              No tienes permisos para acceder a esta sección. Este intento ha sido registrado.
            </p>
          </div>
        </div>
      );
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
