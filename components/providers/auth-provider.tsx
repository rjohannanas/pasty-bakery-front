'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/store';
import { Loader2 } from 'lucide-react';

const PUBLIC_ROUTES = ['/'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser } = useAppStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    // Check if user is logged in from localStorage
    const storedUser = localStorage.getItem('pasty_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('[v0] Error parsing stored user:', error);
        localStorage.removeItem('pasty_user');
      }
    }
  }, [isHydrated, setUser]);

  useEffect(() => {
    if (!isHydrated) return;

    const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
    const isAuthenticated = !!user;

    if (!isAuthenticated && !isPublicRoute) {
      router.push('/');
    } else if (isAuthenticated && pathname === '/') {
      router.push('/dashboard');
    }
  }, [user, pathname, router, isHydrated]);

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
