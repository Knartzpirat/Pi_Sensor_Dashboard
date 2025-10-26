// app/dashboard/test-objects/components/data-table-row-actions.tsx
'use client';

import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import { Row } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TestObjectWithRelations } from '@/app/dashboard/test-objects/columns';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Pencil, Copy, Trash2, ExternalLink, ImageIcon } from 'lucide-react';

interface DataTableRowActionsProps {
  row: Row<TestObjectWithRelations>;
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const router = useRouter();
  const testObject = row.original;

  const handleDelete = async () => {
    if (!confirm('Möchten Sie dieses Testobjekt wirklich löschen?')) {
      return;
    }

    try {
      const response = await fetch(`/api/test-objects/${testObject.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Löschen fehlgeschlagen');

      toast.success('Testobjekt gelöscht');
      router.refresh();
    } catch (error) {
      toast.error('Fehler beim Löschen');
      console.error(error);
    }
  };

  const handleDuplicate = async () => {
    try {
      const response = await fetch('/api/test-objects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${testObject.title} (Kopie)`,
          description: testObject.description,
          labelId: testObject.labelId,
        }),
      });

      if (!response.ok) throw new Error('Duplizieren fehlgeschlagen');

      toast.success('Testobjekt dupliziert');
      router.refresh();
    } catch (error) {
      toast.error('Fehler beim Duplizieren');
      console.error(error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Menü öffnen</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem
          onClick={() =>
            router.push(`/dashboard/test-objects/${testObject.id}`)
          }
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Öffnen
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            router.push(`/dashboard/test-objects/${testObject.id}/edit`)
          }
        >
          <Pencil className="mr-2 h-4 w-4" />
          Bearbeiten
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            router.push(`/dashboard/test-objects/${testObject.id}/pictures`)
          }
        >
          <ImageIcon className="mr-2 h-4 w-4" />
          Bilder
          {testObject.pictures && testObject.pictures.length > 0 && (
            <DropdownMenuShortcut>
              {testObject.pictures.length}
            </DropdownMenuShortcut>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDuplicate}>
          <Copy className="mr-2 h-4 w-4" />
          Duplizieren
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDelete} className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Löschen
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
