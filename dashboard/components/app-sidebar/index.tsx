// components/app-sidebar.tsx
'use client';
import { useTranslations } from 'next-intl';
import { NavMain } from './nav-main';
import { NavSecondary } from './nav-secondary';

import {
  ChartSpline,
  Home,
  Settings,
  Search,
  CircleQuestionMark,
  BookOpenText,
  Cable,
  SquareActivity,
  FlaskConical,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
} from '@/components/ui/sidebar';

const data = {
  navMain: [
    {
      key: 'dashboard',
      url: '/dashboard',
      icon: Home,
    },
    {
      key: 'measurements',
      url: '#', // TODO: Create /dashboard/measurements page with real-time sensor data
      icon: ChartSpline,
    },
    {
      key: 'reports',
      url: '#', // TODO: Create /dashboard/reports page with exportable charts and data
      icon: BookOpenText,
    },
    {
      key: 'sensors',
      url: '#', // TODO: Create /dashboard/sensors page for sensor management
      icon: Cable,
    },
    {
      key: 'test-objects',
      url: '/dashboard/test-objects',
      icon: FlaskConical,
    },
  ],

  navSecondary: [
    {
      key: 'settings',
      url: '/dashboard/settings',
      icon: Settings,
    },
    {
      key: 'help',
      url: '#',
      icon: CircleQuestionMark,
    },
    {
      key: 'search',
      url: '#',
      icon: Search,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const t = useTranslations();

  const navMainItems = data.navMain.map((navMainItem) => ({
    ...navMainItem,
    title: t(`sidebar.pages.${navMainItem.key}`),
  }));

  const navSecondaryItems = data.navSecondary.map((navSecondaryItem) => ({
    ...navSecondaryItem,
    title: t(`sidebar.pages.${navSecondaryItem.key}`),
  }));

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="#">
                <SquareActivity className="size-6" />
                <span className="text-base font-semibold">
                  {t('sidebar.title')}
                </span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMainItems} />
        
        {/* TODO: Add Sidebar Widget Components
         * - Create components/sidebar/sensor-status-widget.tsx
         * - Show online/offline sensor count with indicators
         * - Real-time status updates
         * 
         * - Create components/sidebar/recent-alerts-widget.tsx
         * - Show last 3-5 critical alerts in compact format
         * - Link to full alerts page
         * 
         * - Create components/sidebar/quick-stats-widget.tsx  
         * - Current temperature, humidity averages
         * - Mini charts or progress indicators
         */}
        
        <NavSecondary items={navSecondaryItems} className="mt-auto" />
      </SidebarContent>
    </Sidebar>
  );
}
