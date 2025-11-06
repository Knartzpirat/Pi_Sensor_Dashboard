'use client';

import { useTranslations } from 'next-intl';
import { FileText } from 'lucide-react';
import { SortableDocumentList } from '@/components/ui/sortable-document-list';

interface Document {
  id: string;
  url: string;
  originalName: string;
  order: number;
}

interface DocumentsSectionProps {
  documents: Document[];
  onReorder: (newDocuments: Document[]) => void;
  onDelete: (id: string, name: string) => void;
  onRename: (documentId: string, newName: string) => void;
}

/**
 * Reusable documents section for displaying and managing PDF documents
 */
export function DocumentsSection({
  documents,
  onReorder,
  onDelete,
  onRename,
}: DocumentsSectionProps) {
  const t = useTranslations();

  if (documents.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-medium">
        <FileText className="h-4 w-4" />
        {t('testObjects.form.documents')} ({documents.length})
      </h3>
      <SortableDocumentList
        documents={documents}
        onReorder={onReorder}
        onDelete={onDelete}
        onRename={onRename}
        deleteLabel={t('common.delete')}
        downloadLabel={t('common.download')}
        viewLabel={t('common.view')}
        allowRename={true}
      />
    </div>
  );
}
