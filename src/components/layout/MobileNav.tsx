'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { triggerNavigationLoading } from '@/components/NavigationLoader';
import {
  LayoutDashboard,
  ListTodo,
  LayoutGrid,
  BarChart3,
} from 'lucide-react';

const navItems = [
  { name: 'Home', href: '/', icon: LayoutDashboard },
  { name: 'Routine', href: '/routine', icon: ListTodo },
  { name: 'Domains', href: '/domains', icon: LayoutGrid },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
];

export default function MobileNav() {
  const pathname = usePathname();

  const handleNavClick = (href: string) => {
    // Only trigger loading if navigating to a different page
    const isActive = pathname === href || (href !== '/' && pathname.startsWith(href));
    if (!isActive) {
      triggerNavigationLoading();
    }
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-background/80 backdrop-blur-xl border-t border-border z-50 pb-safe">
      <div className="flex justify-around items-center h-full px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => handleNavClick(item.href)}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className={cn(
                "p-1.5 rounded-full transition-all",
                isActive && "bg-primary/10"
              )}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
