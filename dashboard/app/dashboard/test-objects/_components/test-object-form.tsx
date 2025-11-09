// test-object-form.tsx
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { useTranslations } from 'next-intl';
import { Image as ImageIcon, FileText } from 'lucide-react';

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
import { FileUpload, FileUploadDropzone, FileUploadTrigger } from '@/components/ui/file-upload';
import { Button } from '@/components/ui/button';
import { SortableFileList } from '@/components/form/sortable-file-list';
import { TagsInput, Tag } from '@/components/ui/tags-input';
import { cn } from '@/lib/utils';

// Custom Hooks
import { useLabelsData } from '@/hooks/use-labels-data';
import { useSeparateFileLists } from '@/hooks/use-file-type-filter';

const testObjectSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich'),
  description: z.string().optional(),
  labelIds: z.array(z.string()).optional(),
});

type TestObjectFormValues = z.infer<typeof testObjectSchema>;

export interface TestObjectFormRef {
  submit: () => void;
  isLoading: boolean;
}

interface TestObjectFormProps {
  defaultValues?: Partial<TestObjectFormValues>;
  onSuccess?: () => void;
  className?: string;
}

export const TestObjectForm = React.forwardRef<
  TestObjectFormRef,
  TestObjectFormProps
>(({ defaultValues, onSuccess, className }, ref) => {
  const t = useTranslations();
  const [isLoading, setIsLoading] = React.useState(false);
  const [allFiles, setAllFiles] = React.useState<File[]>([]);
  const [selectedTags, setSelectedTags] = React.useState<Tag[]>([]);

  // Use custom hooks
  const { labels } = useLabelsData('TEST_OBJECT');
  const { images, documents, setImages, setDocuments } = useSeparateFileLists(
    allFiles,
    setAllFiles
  );

  // Convert labels to tags format for suggestions
  const labelSuggestions: Tag[] = React.useMemo(
    () => labels.map((label) => ({ id: label.id, name: label.name, color: label.color ?? undefined })),
    [labels]
  );

  const form = useForm<TestObjectFormValues>({
    resolver: zodResolver(testObjectSchema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? '',
      labelIds: defaultValues?.labelIds ?? [],
    },
  });

  // Initialize selectedTags from defaultValues
  React.useEffect(() => {
    if (defaultValues?.labelIds && defaultValues.labelIds.length > 0 && labels.length > 0) {
      const tags: Tag[] = defaultValues.labelIds
        .map((id) => {
          const label = labels.find((l) => l.id === id);
          if (!label) return null;
          return { id: label.id, name: label.name, color: label.color ?? undefined } as Tag;
        })
        .filter((tag): tag is Tag => tag !== null);
      setSelectedTags(tags);
    }
  }, [defaultValues?.labelIds, labels]);

  async function onSubmit(data: TestObjectFormValues) {
    setIsLoading(true);

    try {
      // Handle label creation for new tags
      const labelIds: string[] = [];

      for (const tag of selectedTags) {
        // Check if this is a new tag (starts with "new-")
        if (tag.id.startsWith('new-')) {
          // Create new label
          const labelResponse = await fetch('/api/labels', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: tag.name,
              type: 'TEST_OBJECT',
              color: tag.color || '#3b82f6',
            }),
          });

          if (labelResponse.ok) {
            const newLabel = await labelResponse.json();
            labelIds.push(newLabel.id);
          }
        } else {
          labelIds.push(tag.id);
        }
      }

      // Create test object
      const response = await fetch('/api/test-objects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description,
          labelIds,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create test object');
      }

      const testObject = await response.json();

      // Upload files if present
      if (images.length > 0 || documents.length > 0) {
        const formData = new FormData();
        formData.append('entityId', testObject.id);
        formData.append('entityType', 'TEST_OBJECT');

        // Add images with order
        images.forEach((file, index) => {
          formData.append('images', file);
          formData.append(`imageOrder_${index}`, index.toString());
        });

        // Add documents with order
        documents.forEach((file, index) => {
          formData.append('documents', file);
          formData.append(`documentOrder_${index}`, index.toString());
        });

        const uploadResponse = await fetch('/api/uploads', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload files');
        }
      }

      toast.success('Test-Objekt erfolgreich erstellt');
      form.reset();
      setAllFiles([]);
      setSelectedTags([]);
      onSuccess?.();

      // Reload page to show new data
      window.location.reload();
    } catch (error) {
      console.error('Error creating test object:', error);
      toast.error('Fehler beim Erstellen des Test-Objekts');
    } finally {
      setIsLoading(false);
    }
  }

  // Expose submit and isLoading to parent
  React.useImperativeHandle(ref, () => ({
    submit: form.handleSubmit(onSubmit),
    isLoading,
  }));

  const handleRemoveFile = React.useCallback(
    (file: File) => {
      setAllFiles((current) => current.filter((f) => f !== file));
    },
    []
  );

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('space-y-4 overflow-y-auto', className)}
      >
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('testObjects.table.title')}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t('testObjects.table.title_description')}
                  {...field}
                />
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
                <Textarea
                  placeholder={t('testObjects.table.description_placeholder')}
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="labelIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('testObjects.table.label')}</FormLabel>
              <FormControl>
                <TagsInput
                  value={selectedTags}
                  onChange={(tags) => {
                    setSelectedTags(tags);
                    // Update form field with all tag ids
                    field.onChange(tags.map((t) => t.id));
                  }}
                  suggestions={labelSuggestions}
                  placeholder={t('testObjects.table.label_placeholder')}
                  maxTags={5}
                  allowCreate={true}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* File Upload Section */}
        <div className="space-y-4">
          <div className="space-y-2">
            <FormLabel>{t('testObjects.form.files')}</FormLabel>
            <p className="text-muted-foreground text-sm">
              {t('testObjects.form.files_description')}
            </p>
          </div>

          <FileUpload
            value={allFiles}
            onValueChange={setAllFiles}
            accept="image/*,application/pdf"
            multiple
            maxFiles={30}
            maxSize={10 * 1024 * 1024} // 10MB
          >
            <FileUploadDropzone>
              <div className="flex flex-col items-center gap-2 py-6">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-sm">
                    {t('testObjects.form.dropzone_combined_title')}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {t('testObjects.form.dropzone_combined_description')}
                  </p>
                </div>
                <FileUploadTrigger asChild>
                  <Button type="button" variant="outline" size="sm">
                    {t('testObjects.form.select_files')}
                  </Button>
                </FileUploadTrigger>
              </div>
            </FileUploadDropzone>

            {/* Images List */}
            {images.length > 0 && (
              <div className="space-y-2">
                <FormLabel>
                  <ImageIcon className="mr-2 inline-block h-4 w-4" />
                  {t('testObjects.form.images')} ({images.length})
                </FormLabel>
                <p className="text-muted-foreground text-xs">
                  {t('testObjects.form.images_description')}
                </p>
                <SortableFileList
                  files={images}
                  onReorder={setImages}
                  onRemove={handleRemoveFile}
                />
              </div>
            )}

            {/* Documents List */}
            {documents.length > 0 && (
              <div className="space-y-2">
                <FormLabel>
                  <FileText className="mr-2 inline-block h-4 w-4" />
                  {t('testObjects.form.documents')} ({documents.length})
                </FormLabel>
                <p className="text-muted-foreground text-xs">
                  {t('testObjects.form.documents_description')}
                </p>
                <SortableFileList
                  files={documents}
                  onReorder={setDocuments}
                  onRemove={handleRemoveFile}
                />
              </div>
            )}
          </FileUpload>
        </div>
      </form>
    </Form>
  );
});

TestObjectForm.displayName = 'TestObjectForm';
