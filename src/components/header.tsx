'use client';

import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserNav } from './user-nav';
import Logo from './logo';
import { cn } from '@/lib/utils';
import { useSidebar } from './ui/sidebar';
import { ThemeToggle } from './theme-toggle';

export function Header({ className }: { className?: string }) {
  const { isMobile } = useSidebar();
  return (
    <header
      className={cn(
        'sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-x-4 border-b bg-background px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8',
        className
      )}
    >
      <div className="flex items-center gap-4">
        {isMobile && <SidebarTrigger />}
      </div>

      <div className="flex flex-1 items-center justify-end gap-x-4 self-stretch lg:gap-x-6">
        <ThemeToggle />
        <UserNav />
      </div>
    </header>
  );
}
