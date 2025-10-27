'use client';

import * as React from 'react';
import { TrashIcon } from 'lucide-react';
import { toast } from 'sonner';

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
          Löschen ({testObjects.length})
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bist du sicher?</DialogTitle>
          <DialogDescription>
            Diese Aktion kann nicht rückgängig gemacht werden. Es werden{' '}
            <span className="font-medium">{testObjects.length}</span>{' '}
            Test-Objekt
            {testObjects.length > 1 ? 'e' : ''} permanent gelöscht.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:space-x-0">
          <DialogClose asChild>
            <Button variant="outline">Abbrechen</Button>
          </DialogClose>
          <Button
            aria-label="Delete selected rows"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? 'Löschen...' : 'Löschen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
