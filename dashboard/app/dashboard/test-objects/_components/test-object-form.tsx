'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { useTranslations } from 'next-intl';
import { GripVertical, Image as ImageIcon, FileText, X } from 'lucide-react';

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
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadList,
  FileUploadItem,
  FileUploadItemPreview,
  FileUploadItemMetadata,
  FileUploadItemDelete,
  FileUploadTrigger,
} from '@/components/ui/file-upload';
import {
  Sortable,
  SortableContent,
  SortableItem,
  SortableItemHandle,
  SortableOverlay,
} from '@/components/ui/sortable';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const testObjectSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich'),
  description: z.string().optional(),
  labelId: z.string().optional(),
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
  const [labels, setLabels] = React.useState<{ id: string; name: string }[]>(
    []
  );
  const [allFiles, setAllFiles] = React.useState<File[]>([]);

  // Dateien nach Typ filtern
  const images = React.useMemo(
    () => allFiles.filter((file) => file.type.startsWith('image/')),
    [allFiles]
  );

  const pdfs = React.useMemo(
    () => allFiles.filter((file) => file.type === 'application/pdf'),
    [allFiles]
  );

  // Setter für separate Listen, die den gemeinsamen State aktualisieren
  const setImages = React.useCallback((newImages: File[]) => {
    setAllFiles((current) => [
      ...newImages,
      ...current.filter((f) => f.type === 'application/pdf'),
    ]);
  }, []);

  const setPdfs = React.useCallback((newPdfs: File[]) => {
    setAllFiles((current) => [
      ...current.filter((f) => f.type.startsWith('image/')),
      ...newPdfs,
    ]);
  }, []);

  const form = useForm<TestObjectFormValues>({
    resolver: zodResolver(testObjectSchema),
    defaultValues: {
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? '',
      labelId: defaultValues?.labelId ?? undefined,
    },
  });

  React.useEffect(() => {
    // Load available labels
    fetch('/api/labels?type=TEST_OBJECT')
      .then((res) => res.json())
      .then((data) => setLabels(data))
      .catch((error) => console.error('Error loading labels:', error));
  }, []);

  async function onSubmit(data: TestObjectFormValues) {
    setIsLoading(true);

    try {
      // Zuerst das Test-Objekt erstellen
      const response = await fetch('/api/test-objects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create test object');
      }

      const testObject = await response.json();

      // Dann Dateien hochladen (falls vorhanden)
      if (images.length > 0 || pdfs.length > 0) {
        const formData = new FormData();
        formData.append('entityId', testObject.id);
        formData.append('entityType', 'TEST_OBJECT');

        // Bilder mit ihrer Reihenfolge
        images.forEach((file, index) => {
          formData.append('images', file);
          formData.append(`imageOrder_${index}`, index.toString());
        });

        // PDFs mit ihrer Reihenfolge
        pdfs.forEach((file, index) => {
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

  // Parent kann submit() und isLoading von außen ansteuern
  React.useImperativeHandle(ref, () => ({
    submit: form.handleSubmit(onSubmit),
    isLoading,
  }));

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
          name="labelId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('testObjects.table.label')}</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value || undefined}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t('testObjects.table.label_placeholder')}
                    />
                  </SelectTrigger>
                </FormControl>

                <SelectContent>
                  {labels.map((label) => (
                    <SelectItem key={label.id} value={label.id}>
                      {label.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Gemeinsame Datei-Upload Dropzone */}
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
          </FileUpload>

          {/* Bilder Liste */}
            {images.length > 0 && (
            <div className="space-y-2">
              <FormLabel>
                <ImageIcon className="mr-2 inline-block h-4 w-4" />
                {t('testObjects.form.images')} ({images.length})
              </FormLabel>
              <p className="text-muted-foreground text-xs">
                {t('testObjects.form.images_description')}
              </p>
              <Sortable
                value={images}
                onValueChange={setImages}
                getItemValue={(file) => file.name + file.size}
              >
                <SortableContent>
                  <FileUploadList>
                    {images.map((file) => (
                      <SortableItem
                        key={file.name + file.size}
                        value={file.name + file.size}
                        asChild
                      >
                        <FileUploadItem value={file}>
                          <SortableItemHandle asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-10 w-6 cursor-grab active:cursor-grabbing"
                            >
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </SortableItemHandle>
                          <FileUploadItemPreview />
                          <FileUploadItemMetadata />
                          <FileUploadItemDelete asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setAllFiles((current) =>
                                  current.filter((f) => f !== file)
                                );
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </FileUploadItemDelete>
                        </FileUploadItem>
                      </SortableItem>
                    ))}
                  </FileUploadList>
                </SortableContent>
                <SortableOverlay>
                  {({ value }) => {
                    const file = images.find(
                      (f) => f.name + f.size === value
                    );
                    return file ? (
                      <FileUploadItem value={file} className="opacity-50">
                        <FileUploadItemPreview />
                        <FileUploadItemMetadata />
                      </FileUploadItem>
                    ) : null;
                  }}
                </SortableOverlay>
              </Sortable>
        </div>
          )}

          {/* PDF/Dokumente Liste */}
          {pdfs.length > 0 && (
        <div className="space-y-2">
          <FormLabel>
            <FileText className="mr-2 inline-block h-4 w-4" />
                {t('testObjects.form.documents')} ({pdfs.length})
          </FormLabel>
              <p className="text-muted-foreground text-xs">
            {t('testObjects.form.documents_description')}
          </p>
              <Sortable
                value={pdfs}
                onValueChange={setPdfs}
                getItemValue={(file) => file.name + file.size}
              >
                <SortableContent>
                  <FileUploadList>
                    {pdfs.map((file) => (
                      <SortableItem
                        key={file.name + file.size}
                        value={file.name + file.size}
                        asChild
                      >
                        <FileUploadItem value={file}>
                          <SortableItemHandle asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-10 w-6 cursor-grab active:cursor-grabbing"
                            >
                              <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </SortableItemHandle>
                          <FileUploadItemPreview />
                          <FileUploadItemMetadata />
                          <FileUploadItemDelete asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setAllFiles((current) =>
                                  current.filter((f) => f !== file)
                                );
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </FileUploadItemDelete>
                        </FileUploadItem>
                      </SortableItem>
                    ))}
                  </FileUploadList>
                </SortableContent>
                <SortableOverlay>
                  {({ value }) => {
                    const file = pdfs.find(
                      (f) => f.name + f.size === value
                    );
                    return file ? (
                      <FileUploadItem value={file} className="opacity-50">
                        <FileUploadItemPreview />
                        <FileUploadItemMetadata />
                      </FileUploadItem>
                    ) : null;
                  }}
                </SortableOverlay>
              </Sortable>
            </div>
            )}
        </div>
      </form>
    </Form>
  );
});

TestObjectForm.displayName = 'TestObjectForm';
