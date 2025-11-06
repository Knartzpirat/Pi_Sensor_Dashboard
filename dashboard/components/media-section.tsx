'use client';

import { useTranslations } from 'next-intl';
import { Image as ImageIcon } from 'lucide-react';
import { SortableImageGrid } from '@/components/ui/sortable-image-grid';

interface Picture {
  id: string;
  url: string;
  originalName: string;
  order: number;
}

interface MediaSectionProps {
  pictures: Picture[];
  onReorder: (newPictures: Picture[]) => void;
  onDelete: (id: string, name: string) => void;
}

/**
 * Reusable media section for displaying and managing images
 */
export function MediaSection({
  pictures,
  onReorder,
  onDelete,
}: MediaSectionProps) {
  const t = useTranslations();

  if (pictures.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-medium">
        <ImageIcon className="h-4 w-4" />
        {t('testObjects.form.images')} ({pictures.length})
      </h3>
      <SortableImageGrid
        images={pictures}
        onReorder={onReorder}
        onDelete={onDelete}
        deleteLabel={t('common.delete')}
      />
    </div>
  );
}
