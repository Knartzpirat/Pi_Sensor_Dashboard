'use client';

import { useTranslations } from 'next-intl';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';
import { SwitchTheme } from './switch-theme';
import  LocaleSwitcher from '@/components/switch-locale';
import { LogoutButton } from '@/components/button-logout';

export function AppNavbar() {
  const t = useTranslations();
  const pathname = usePathname();

  // Nimm den letzten Teil der URL (z. B. "/dashboard" -> "dashboard")
  const pageName = pathname.split('/').filter(Boolean).pop() || 'Home';

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{t(`sidebar.pages.${pageName}`)}</h1>
      </div>
      <div className="flex justify-end p-4 gap-2 ">
        {/* TODO: Add Search Component
         * - Create components/navbar/global-search.tsx
         * - Global search for sensors, measurements, test objects
         * - Use Command component (cmdk) for fuzzy search
         * - Keyboard shortcut (Ctrl+K)
         */}
        
        {/* TODO: Add Notifications Component
         * - Create components/navbar/notifications.tsx
         * - Bell icon with notification count badge
         * - Dropdown with recent alerts/system notifications
         * - Use Popover component, mark as read functionality
         */}
        
        {/* TODO: Add User Menu Component
         * - Create components/navbar/user-menu.tsx
         * - Avatar with dropdown menu
         * - Profile settings, preferences, help links
         * - Use DropdownMenu component
         */}
        
        <LocaleSwitcher />
        <SwitchTheme />
        <LogoutButton />
      </div>
    </header>
  );
}
