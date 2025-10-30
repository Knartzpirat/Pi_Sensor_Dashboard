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
import { TestObjectForm, TestObjectFormRef } from './test-object-form';
import { useTranslations } from 'next-intl';

export function CreateTestObjectSheet() {
  const t = useTranslations();
  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const formRef = React.useRef<TestObjectFormRef>(null);

  React.useEffect(() => {
    const id = setInterval(() => {
      if (formRef.current?.isLoading !== isLoading) {
        setIsLoading(formRef.current?.isLoading ?? false);
      }
    }, 100);
    return () => clearInterval(id);
  }, [isLoading]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="mr-2 size-4" aria-hidden="true" />
          {t('testObjects.createTestObject.title')}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col gap-6 sm:max-w-md">
        <SheetHeader className="text-left">
          <SheetTitle>{t('testObjects.createTestObject.title')}</SheetTitle>
          <SheetDescription>
            {t('testObjects.createTestObject.description')}
          </SheetDescription>
        </SheetHeader>

        
          <TestObjectForm
            ref={formRef}
            className="  mx-4"
            onSuccess={() => setOpen(false)}
          />
        

        <SheetFooter className="gap-2 pt-2 sm:space-x-0">
          <Button
            type="button"
            className="w-full"
            disabled={isLoading}
            onClick={() => formRef.current?.submit()}
          >
            {isLoading
              ? t('loading.creating', { defaultValue: 'Erstellen…' })
              : t('testObjects.createTestObject.title', {
                  defaultValue: 'Test-Objekt erstellen',
                })}
          </Button>
          <SheetClose asChild>
            <Button type="button" variant="outline">
              {t('buttons.cancel')}
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
