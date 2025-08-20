'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'student';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { isAuthenticated, user, isLoading, checkAuth } = useAuthStore();
  const [authChecked, setAuthChecked] = useState(false);
  const router = useRouter();

  // Run checkAuth on mount
  useEffect(() => {
    const verifyAuth = async () => {
      await checkAuth();
      setAuthChecked(true);
    };
    verifyAuth();
  }, [checkAuth]);

  // Handle redirects after auth check
  useEffect(() => {
    if (!authChecked || isLoading) return; // Wait until checkAuth finishes

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    const role = user?.role || user?.data?.user?.role; // Safe role extraction
    if (requiredRole && role !== requiredRole) {
      router.replace(role === 'admin' ? '/admin/dashboard' : '/student/dashboard');
    }
  }, [authChecked, isAuthenticated, requiredRole, user, isLoading, router]);

  // Loader while checking auth
  if (!authChecked || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // If not authenticated or wrong role, don't render
  const role = user?.role || user?.data?.user?.role;
  if (!isAuthenticated || !user || (requiredRole && role !== requiredRole)) {
    return null;
  }

  return <>{children}</>;
};
