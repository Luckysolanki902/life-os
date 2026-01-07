'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/lib/store';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import { cn } from '@/lib/utils';
import { initializePushNotifications, setupNotificationListeners, isNativeApp } from '@/lib/push-notifications';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const { isSidebarOpen, theme } = useSelector((state: RootState) => state.ui);
  const previousPathname = useRef(pathname);
  const pushInitialized = useRef(false);

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

  // Initialize Push Notifications
  useEffect(() => {
    if (pushInitialized.current) return;
    pushInitialized.current = true;
    
    const initPush = async () => {
      if (isNativeApp()) {
        console.log('Initializing push notifications for native app...');
        await initializePushNotifications();
        await setupNotificationListeners();
      }
    };
    
    initPush();
  }, []);

  // Page Transition Animation
  useEffect(() => {
    if (previousPathname.current !== pathname) {
      previousPathname.current = pathname;
      
      // Add fade animation on route change
      const mainContent = document.querySelector('[data-page-content]');
      if (mainContent) {
        mainContent.classList.remove('animate-in', 'fade-in', 'slide-in-from-bottom-4');
        // Trigger reflow
        void mainContent.getBoundingClientRect();
        mainContent.classList.add('animate-in', 'fade-in', 'slide-in-from-bottom-4');
      }
    }
  }, [pathname]);

  if (isLoginPage) {
    return <main className="min-h-screen bg-background">{children}</main>;
  }

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Safe area spacer for Android status bar */}
      <div className="h-[env(safe-area-inset-top)] bg-background" />
      <Sidebar />
      
      <main
        className={cn(
          'min-h-screen transition-all duration-300',
          'pb-24 md:pb-8', // Bottom padding for mobile nav
          isSidebarOpen ? 'md:pl-64' : 'md:pl-0'
        )}
      >
        <div 
          data-page-content
          className="container max-w-5xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          {children}
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
