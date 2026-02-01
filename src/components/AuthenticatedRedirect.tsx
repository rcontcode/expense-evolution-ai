import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface AuthenticatedRedirectProps {
  children: ReactNode;
  redirectTo?: string;
}

/**
 * Redirects authenticated users to a specified route (default: /dashboard).
 * Shows children for unauthenticated users.
 */
export function AuthenticatedRedirect({ 
  children, 
  redirectTo = '/dashboard' 
}: AuthenticatedRedirectProps) {
  const { user, loading } = useAuth();

  // Show minimal loading state while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="space-y-4 w-full max-w-md px-4">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  // Redirect authenticated users
  if (user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Show children for unauthenticated users
  return <>{children}</>;
}
