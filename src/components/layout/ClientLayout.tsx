'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import { cn } from '@/lib/utils';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const { isSidebarOpen, theme } = useSelector((state: RootState) => state.ui);

  // Theme Sync
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  if (isLoginPage) {
    return <main className="min-h-screen bg-background">{children}</main>;
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      <Sidebar />
      
      <main
        className={cn(
          'min-h-screen transition-all duration-300',
          'pb-24 md:pb-8', // Bottom padding for mobile nav
          isSidebarOpen ? 'md:pl-64' : 'md:pl-0'
        )}
      >
        <div className="container max-w-5xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
          {children}
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
