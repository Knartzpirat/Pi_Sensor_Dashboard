'use client';
import * as React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { StartMeasurementDrawer } from '@/components/start-measurement-drawer';
import { AddSensorDrawer } from '@/components/add-sensor-drawer';
import type { BoardType } from '@/types/hardware';

import { CirclePlus, type LucideIcon } from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

export function NavMain({
  items,
}: {
  items: {
    key: string;
    url: string;
    icon?: LucideIcon;
  }[];
}) {
  const t = useTranslations();
  const [boardType, setBoardType] = React.useState<BoardType>('GPIO');
  const [usedPins, setUsedPins] = React.useState<number[]>([]);

  // Load hardware config and used pins
  React.useEffect(() => {
    const loadData = async () => {
      try {
        // Get hardware config
        const configRes = await fetch('/api/hardware/config');
        const configData = await configRes.json();
        setBoardType(configData.config?.boardType || 'GPIO');

        // Get existing sensors to find used pins
        const sensorsRes = await fetch('/api/sensors');
        const sensorsData = await sensorsRes.json();
        const pins = (sensorsData.sensors || [])
          .filter((s: any) => s.pin !== null && s.pin !== undefined)
          .map((s: any) => s.pin);
        setUsedPins(pins);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  const handleSensorAdded = async () => {
    // Reload used pins after sensor is added
    try {
      const sensorsRes = await fetch('/api/sensors');
      const sensorsData = await sensorsRes.json();
      const pins = (sensorsData.sensors || [])
        .filter((s: any) => s.pin !== null && s.pin !== undefined)
        .map((s: any) => s.pin);
      setUsedPins(pins);
    } catch (error) {
      console.error('Error reloading sensors:', error);
    }
  };

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <StartMeasurementDrawer
              trigger={
                <SidebarMenuButton className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear">
                  <CirclePlus />
                  <span>{t('buttons.startmeasurements')}</span>
                </SidebarMenuButton>
              }
            />

            <AddSensorDrawer
              boardType={boardType}
              usedPins={usedPins}
              onSensorAdded={handleSensorAdded}
            />
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.key}>
              <SidebarMenuButton asChild>
                <Link href={item.url}>
                  {item.icon && <item.icon />}
                  <span>{t(`sidebar.pages.${item.key}`)}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
