'use client';

import * as React from 'react';
import { Loader2, FileText, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  FileUpload,
  FileUploadDropzone,
  FileUploadTrigger,
} from '@/components/ui/file-upload';

interface FileUploadSectionProps {
  value: File[];
  onValueChange: (files: File[]) => void;
  isUploading?: boolean;
  accept?: string;
  maxFiles?: number;
  maxSize?: number;
  disabled?: boolean;
  title: string;
  dropzoneTitle: string;
  dropzoneDescription: string;
  selectFilesLabel: string;
  uploadingLabel?: string;
}

/**
 * Reusable file upload section with dropzone and upload status
 */
export function FileUploadSection({
  value,
  onValueChange,
  isUploading = false,
  accept = 'image/*,application/pdf',
  maxFiles = 30,
  maxSize = 10 * 1024 * 1024, // 10MB
  disabled = false,
  title,
  dropzoneTitle,
  dropzoneDescription,
  selectFilesLabel,
  uploadingLabel = 'Uploading...',
}: FileUploadSectionProps) {
  return (
    <div className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-medium">
        {title}
      </h3>
      <FileUpload
        value={value}
        onValueChange={onValueChange}
        accept={accept}
        multiple
        maxFiles={maxFiles}
        maxSize={maxSize}
        disabled={disabled || isUploading}
      >
        <FileUploadDropzone>
          <div className="flex flex-col items-center gap-2 py-6">
            {isUploading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm font-medium">{uploadingLabel}</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-sm">{dropzoneTitle}</p>
                  <p className="text-muted-foreground text-xs">
                    {dropzoneDescription}
                  </p>
                </div>
                <FileUploadTrigger asChild>
                  <Button type="button" variant="outline" size="sm">
                    {selectFilesLabel}
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
