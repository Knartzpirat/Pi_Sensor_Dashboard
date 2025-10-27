'use client';

import * as React from 'react';
import { TrashIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { TestObjectsTableData } from '@/types/test-object';

interface DeleteTestObjectsDialogProps {
  testObjects: TestObjectsTableData[];
  onSuccess?: () => void;
}

export function DeleteTestObjectsDialog({
  testObjects,
  onSuccess,
}: DeleteTestObjectsDialogProps) {
  const t = useTranslations();
  const [open, setOpen] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  async function handleDelete() {
    setIsDeleting(true);

    try {
      // Delete all selected test objects
      await Promise.all(
        testObjects.map((testObject) =>
          fetch(`/api/test-objects/${testObject.id}`, {
            method: 'DELETE',
          })
        )
      );

      toast.success(
        `${testObjects.length} Test-Objekt${
          testObjects.length > 1 ? 'e' : ''
        } erfolgreich gelöscht`
      );

      setOpen(false);
      onSuccess?.();

      // Reload page to refresh data
      window.location.reload();
    } catch (error) {
      console.error('Error deleting test objects:', error);
      toast.error('Fehler beim Löschen der Test-Objekte');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <TrashIcon className="mr-2 size-4" aria-hidden="true" />
          {t('deleteDialog.confirm')} ({testObjects.length})
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('deleteDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('testObjects.deleteDialog.permanentDelete', {
              count: testObjects.length,
            })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:space-x-0">
          <DialogClose asChild>
            <Button variant="outline">{t('deleteDialog.cancel')}</Button>
          </DialogClose>
          <Button
            aria-label="Delete selected rows"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? t('deleteDialog.loading') : t('deleteDialog.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
