'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, FileText, Image as ImageIcon, GripVertical } from 'lucide-react';
import Image from 'next/image';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Editable,
  EditableArea,
  EditableInput,
  EditablePreview,
  EditableLabel,
} from '@/components/ui/editable';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Sortable } from '@/components/ui/sortable';
import { toast } from 'sonner';

interface Picture {
  id: string;
  url: string;
  originalName: string;
  order: number;
}

interface Document {
  id: string;
  url: string;
  originalName: string;
  order: number;
}

interface Label {
  id: string;
  name: string;
  color: string | null;
}

interface TestObject {
  id: string;
  title: string;
  description: string | null;
  labelId: string | null;
  label: Label | null;
}

interface TestObjectEditDrawerProps {
  testObjectId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function TestObjectEditDrawer({
  testObjectId,
  open,
  onOpenChange,
  onSuccess,
}: TestObjectEditDrawerProps) {
  const t = useTranslations();
  const [isLoading, setIsLoading] = React.useState(false);
  const [testObject, setTestObject] = React.useState<TestObject | null>(null);
  const [pictures, setPictures] = React.useState<Picture[]>([]);
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [labels, setLabels] = React.useState<Label[]>([]);

  // Load test object data
  React.useEffect(() => {
    if (!open || !testObjectId) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load test object with pictures and documents
        const testObjectRes = await fetch(
          `/api/test-objects/${testObjectId}?includePictures=true&includeDocuments=true`
        );
        if (!testObjectRes.ok) throw new Error('Failed to load test object');
        const testObjectData = await testObjectRes.json();
        setTestObject(testObjectData);
        setPictures(testObjectData.pictures || []);
        setDocuments(testObjectData.documents || []);

        // Load labels
        const labelsRes = await fetch('/api/labels?type=TEST_OBJECT');
        if (labelsRes.ok) {
          const labelsData = await labelsRes.json();
          setLabels(labelsData);
        }
      } catch (error) {
        console.error('Error loading test object:', error);
        toast.error(t('testObjects.edit.loadError'));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [open, testObjectId, t]);

  const handleTitleChange = async (newTitle: string) => {
    if (!testObjectId || !newTitle.trim()) return;

    try {
      const response = await fetch(`/api/test-objects/${testObjectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          description: testObject?.description,
          labelId: testObject?.labelId,
        }),
      });

      if (!response.ok) throw new Error('Failed to update title');

      setTestObject((prev) => prev ? { ...prev, title: newTitle } : null);
      toast.success(t('testObjects.edit.success'));
      onSuccess?.();
    } catch (error) {
      console.error('Error updating title:', error);
      toast.error(t('testObjects.edit.error'));
    }
  };

  const handleDescriptionChange = async (newDescription: string) => {
    if (!testObjectId) return;

    try {
      const response = await fetch(`/api/test-objects/${testObjectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: testObject?.title,
          description: newDescription || null,
          labelId: testObject?.labelId,
        }),
      });

      if (!response.ok) throw new Error('Failed to update description');

      setTestObject((prev) => prev ? { ...prev, description: newDescription || null } : null);
      toast.success(t('testObjects.edit.success'));
      onSuccess?.();
    } catch (error) {
      console.error('Error updating description:', error);
      toast.error(t('testObjects.edit.error'));
    }
  };

  const handleLabelChange = async (newLabelId: string) => {
    if (!testObjectId) return;

    try {
      const response = await fetch(`/api/test-objects/${testObjectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: testObject?.title,
          description: testObject?.description,
          labelId: newLabelId || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to update label');

      const selectedLabel = labels.find((l) => l.id === newLabelId) || null;
      setTestObject((prev) => prev ? { ...prev, labelId: newLabelId, label: selectedLabel } : null);
      toast.success(t('testObjects.edit.success'));
      onSuccess?.();
    } catch (error) {
      console.error('Error updating label:', error);
      toast.error(t('testObjects.edit.error'));
    }
  };

  const handleDocumentNameChange = async (documentId: string, newName: string) => {
    if (!newName.trim()) return;

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalName: newName }),
      });

      if (!response.ok) throw new Error('Failed to update document name');

      const updatedDoc = await response.json();
      setDocuments((prev) =>
        prev.map((doc) => (doc.id === documentId ? { ...doc, originalName: updatedDoc.originalName } : doc))
      );
      toast.success(t('testObjects.edit.documentNameUpdated'));
    } catch (error) {
      console.error('Error updating document name:', error);
      toast.error(t('testObjects.edit.documentNameError'));
    }
  };

  const handlePicturesReorder = async (newPictures: Picture[]) => {
    setPictures(newPictures);

    // Update order in database
    try {
      await Promise.all(
        newPictures.map((pic, index) =>
          fetch(`/api/pictures/${pic.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order: index }),
          })
        )
      );
      toast.success(t('testObjects.edit.orderUpdated'));
      onSuccess?.();
    } catch (error) {
      console.error('Error updating picture order:', error);
      toast.error(t('testObjects.edit.orderUpdateError'));
    }
  };

  const handleDocumentsReorder = async (newDocuments: Document[]) => {
    setDocuments(newDocuments);

    // Update order in database
    try {
      await Promise.all(
        newDocuments.map((doc, index) =>
          fetch(`/api/documents/${doc.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order: index }),
          })
        )
      );
      toast.success(t('testObjects.edit.orderUpdated'));
      onSuccess?.();
    } catch (error) {
      console.error('Error updating document order:', error);
      toast.error(t('testObjects.edit.orderUpdateError'));
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t('testObjects.edit.title')}</SheetTitle>
          <SheetDescription>{t('testObjects.edit.description')}</SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6 py-6">
            {/* Images Section */}
            {pictures.length > 0 && (
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-medium">
                  <ImageIcon className="h-4 w-4" />
                  {t('testObjects.form.images')} ({pictures.length})
                </h3>
                <Sortable value={pictures} onValueChange={handlePicturesReorder}>
                  <div className="grid grid-cols-4 gap-2">
                    {pictures.map((picture) => (
                      <div key={picture.id} className="relative aspect-square group">
                        <div className="absolute top-1 left-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="p-1 bg-black/50 rounded cursor-grab active:cursor-grabbing">
                            <GripVertical className="h-4 w-4 text-white" />
                          </div>
                        </div>
                        <Image
                          src={picture.url}
                          alt={picture.originalName}
                          fill
                          className="rounded-md object-cover"
                          unoptimized
                        />
                      </div>
                    ))}
                  </div>
                </Sortable>
              </div>
            )}

            {/* Documents Section */}
            {documents.length > 0 && (
              <div className="space-y-3">
                <h3 className="flex items-center gap-2 text-sm font-medium">
                  <FileText className="h-4 w-4" />
                  {t('testObjects.form.documents')} ({documents.length})
                </h3>
                <Sortable value={documents} onValueChange={handleDocumentsReorder}>
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-2 rounded-md border p-2 group"
                      >
                        <div className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity">
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <Editable
                          value={doc.originalName}
                          onSubmit={(value) => handleDocumentNameChange(doc.id, value)}
                          className="flex-1"
                        >
                          <EditableArea className="w-full">
                            <EditablePreview className="w-full" />
                            <EditableInput className="w-full" />
                          </EditableArea>
                        </Editable>
                      </div>
                    ))}
                  </div>
                </Sortable>
              </div>
            )}

            {(pictures.length > 0 || documents.length > 0) && <Separator />}

            {/* Basic Info Section */}
            <div className="space-y-4">
              <Editable
                value={testObject?.title || ''}
                onSubmit={handleTitleChange}
                required
              >
                <EditableLabel>{t('testObjects.table.title')}</EditableLabel>
                <EditableArea>
                  <EditablePreview />
                  <EditableInput />
                </EditableArea>
              </Editable>

              <Editable
                value={testObject?.description || ''}
                onSubmit={handleDescriptionChange}
                placeholder={t('testObjects.table.description_placeholder')}
              >
                <EditableLabel>{t('testObjects.table.description')}</EditableLabel>
                <EditableArea>
                  <EditablePreview />
                  <EditableInput />
                </EditableArea>
              </Editable>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t('testObjects.table.label')}
                </label>
                <Select
                  value={testObject?.labelId || undefined}
                  onValueChange={handleLabelChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t('testObjects.table.label_placeholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {labels.map((label) => (
                      <SelectItem key={label.id} value={label.id}>
                        <div className="flex items-center gap-2">
                          {label.color && (
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: label.color }}
                            />
                          )}
                          {label.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
