'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { TestObjectForm } from './test-object-form';
import { useTranslations } from 'next-intl';

export function CreateTestObjectSheet() {
  const t = useTranslations();
  const [open, setOpen] = React.useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="mr-2 size-4" aria-hidden="true" />
          {t('testObjects.createTestObject.title')}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col gap-6 sm:max-w-md">
        <ScrollArea className="h-screen">
          <SheetHeader className="text-left">
            <SheetTitle>{t('testObjects.createTestObject.title')}</SheetTitle>
            <SheetDescription>
              {t('testObjects.createTestObject.description')}
            </SheetDescription>
          </SheetHeader>
          <TestObjectForm className="mx-4" onSuccess={() => setOpen(false)} />
          <SheetFooter className="gap-2 pt-2 sm:space-x-0">
            <SheetClose asChild>
              <Button type="button" variant="outline">
                {t('buttons.cancel')}
              </Button>
            </SheetClose>
          </SheetFooter>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
