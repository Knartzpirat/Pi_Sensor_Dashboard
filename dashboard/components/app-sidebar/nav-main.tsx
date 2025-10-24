'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
//import { DrawerNewMeasurement } from '@/components/drawer-newMeasurement';
//import { AddSensorSheetContent } from '@/components/sheet-addSensor';
//import { Drawer, DrawerTrigger } from '@/components/ui/drawer';
import { Sheet, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

import { CirclePlus, Grid2x2Plus, type LucideIcon } from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

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

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            {/* <Drawer>
              <DrawerTrigger asChild> */}
            <SidebarMenuButton className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground min-w-8 duration-200 ease-linear">
              <CirclePlus />
              <span>{t('buttons.startmeasurements')}</span>
            </SidebarMenuButton>
            {/*  </DrawerTrigger>
              <DrawerNewMeasurement />
            </Drawer> */}

            <Tooltip>
              <Sheet>
                <TooltipTrigger asChild>
                  <SheetTrigger asChild>
                    <Button
                      size="icon"
                      className="size-8 group-data-[collapsible=icon]:opacity-0"
                      variant="outline"
                    >
                      <Grid2x2Plus />
                      <span className="sr-only">{t('buttons.addsensor')}</span>
                    </Button>
                  </SheetTrigger>
                </TooltipTrigger>
                <TooltipContent>{t('buttons.addsensor')}</TooltipContent>

                {/* <AddSensorSheetContent /> */}
              </Sheet>
            </Tooltip>
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
