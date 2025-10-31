'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2, Pencil, FileText, Image as ImageIcon, X } from 'lucide-react';
import Image from 'next/image';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

const testObjectFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  labelId: z.string().optional(),
});

type TestObjectFormValues = z.infer<typeof testObjectFormSchema>;

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
  const [isSaving, setIsSaving] = React.useState(false);
  const [testObject, setTestObject] = React.useState<TestObject | null>(null);
  const [pictures, setPictures] = React.useState<Picture[]>([]);
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [labels, setLabels] = React.useState<Label[]>([]);
  const [editingDocumentId, setEditingDocumentId] = React.useState<string | null>(null);
  const [editingDocumentName, setEditingDocumentName] = React.useState('');

  const form = useForm<TestObjectFormValues>({
    resolver: zodResolver(testObjectFormSchema),
    defaultValues: {
      title: '',
      description: '',
      labelId: undefined,
    },
  });

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

        // Set form values
        form.reset({
          title: testObjectData.title,
          description: testObjectData.description || '',
          labelId: testObjectData.labelId || undefined,
        });
      } catch (error) {
        console.error('Error loading test object:', error);
        toast.error(t('testObjects.edit.loadError'));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [open, testObjectId, form, t]);

  const onSubmit = async (data: TestObjectFormValues) => {
    if (!testObjectId) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/test-objects/${testObjectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to update test object');

      toast.success(t('testObjects.edit.success'));
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error updating test object:', error);
      toast.error(t('testObjects.edit.error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDocumentNameEdit = (doc: Document) => {
    setEditingDocumentId(doc.id);
    setEditingDocumentName(doc.originalName);
  };

  const handleDocumentNameSave = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ originalName: editingDocumentName }),
      });

      if (!response.ok) throw new Error('Failed to update document name');

      const updatedDoc = await response.json();
      setDocuments((prev) =>
        prev.map((doc) => (doc.id === documentId ? { ...doc, originalName: updatedDoc.originalName } : doc))
      );
      setEditingDocumentId(null);
      toast.success(t('testObjects.edit.documentNameUpdated'));
    } catch (error) {
      console.error('Error updating document name:', error);
      toast.error(t('testObjects.edit.documentNameError'));
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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('testObjects.table.title')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('testObjects.table.description')}</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="labelId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('testObjects.table.label')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('testObjects.table.label_placeholder')} />
                          </SelectTrigger>
                        </FormControl>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <SheetFooter className="gap-2">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                    {t('buttons.cancel')}
                  </Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t('common.save')}
                  </Button>
                </SheetFooter>
              </form>
            </Form>

            {pictures.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-medium">
                    <ImageIcon className="h-4 w-4" />
                    {t('testObjects.form.images')} ({pictures.length})
                  </h3>
                  <div className="grid grid-cols-4 gap-2">
                    {pictures.map((picture) => (
                      <div key={picture.id} className="relative aspect-square">
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
                </div>
              </>
            )}

            {documents.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="flex items-center gap-2 text-sm font-medium">
                    <FileText className="h-4 w-4" />
                    {t('testObjects.form.documents')} ({documents.length})
                  </h3>
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-2 rounded-md border p-2"
                      >
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        {editingDocumentId === doc.id ? (
                          <>
                            <Input
                              value={editingDocumentName}
                              onChange={(e) => setEditingDocumentName(e.target.value)}
                              className="h-8 flex-1"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDocumentNameSave(doc.id)}
                            >
                              {t('common.save')}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingDocumentId(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <span className="flex-1 text-sm truncate">{doc.originalName}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDocumentNameEdit(doc)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
