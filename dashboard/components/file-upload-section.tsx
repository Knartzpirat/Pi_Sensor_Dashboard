'use client';

import { useTranslations } from 'next-intl';
import { Loader2, Image as ImageIcon, FileText, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadTrigger,
} from '@/components/ui/file-upload';

interface FileUploadSectionProps {
  files: File[];
  isUploading: boolean;
  onFilesChange: (files: File[]) => void;
}

/**
 * Reusable file upload section with drag & drop support
 */
export function FileUploadSection({
  files,
  isUploading,
  onFilesChange,
}: FileUploadSectionProps) {
  const t = useTranslations();

  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-medium">
        <Upload className="h-4 w-4" />
        {t('testObjects.edit.uploadNewFiles')}
      </h3>
      <FileUpload
        value={files}
        onValueChange={onFilesChange}
        accept="image/*,application/pdf"
        multiple
        maxFiles={30}
        maxSize={10 * 1024 * 1024} // 10MB
        disabled={isUploading}
      >
        <FileUploadDropzone>
          <div className="flex flex-col items-center gap-2 py-6">
            {isUploading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm font-medium">
                  {t('testObjects.edit.uploading')}
                </p>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        </FileUploadDropzone>
      </FileUpload>
    </div>
  );
}
