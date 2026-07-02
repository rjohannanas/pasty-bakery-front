'use client';

import React, { useEffect, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { Loader2 } from 'lucide-react';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser } = useAppStore();
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Initialize with a default user (no authentication needed)
    setUser({
      id: 'operator-1',
      email: 'operator@pastybakery.com',
      name: 'Operador',
      role: 'operator',
    });
    setIsHydrated(true);
  }, [setUser]);

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
}
