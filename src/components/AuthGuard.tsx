'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authStorage } from '@/lib/auth-storage';
import { Capacitor } from '@capacitor/core';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  // Start as false for web — only native needs the auth gate.
  // This prevents an extra mount cycle that discards SSR HTML.
  const [isChecking, setIsChecking] = useState(() => {
    try { return Capacitor.isNativePlatform(); } catch { return false; }
  });

  useEffect(() => {
    const checkAuth = async () => {
      // Skip auth check for login page
      if (pathname === '/login') {
        setIsChecking(false);
        return;
      }

      // Only enforce auth check in native Capacitor app
      if (Capacitor.isNativePlatform()) {
        const isValid = await authStorage.isTokenValid();
        
        if (!isValid) {
          router.push('/login');
        } else {
          setIsChecking(false);
        }
      } else {
        // For web, rely on server-side middleware
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [pathname, router]);

  // Show nothing while checking (avoid flash)
  if (isChecking && pathname !== '/login') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}
