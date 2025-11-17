import { NextRequest, NextResponse } from 'next/server';
import { EntityType } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { getPrismaClient } from '@/lib/prisma';
import { withAuth } from '@/lib/auth-helpers';
import {
  validateUploadedFile,
  generateSecureFilename,
} from '@/lib/file-security';
import {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  MAX_IMAGE_SIZE,
  MAX_DOCUMENT_SIZE,
} from '@/lib/validations/files';

// Allowed file extensions (extracted from MIME types)
const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'] as const;
const ALLOWED_DOCUMENT_EXTENSIONS = ['pdf'] as const;

export const POST = withAuth(async (request, user) => {
  const prisma = getPrismaClient();

  try {
    const formData = await request.formData();

    const entityId = formData.get('entityId') as string;
    const entityType = formData.get('entityType') as string;

    console.log('Upload API called with:', { entityId, entityType });

    if (!entityId || !entityType) {
      return NextResponse.json(
        { error: 'entityId and entityType are required' },
        { status: 400 }
      );
    }

    // Validate entityType
    if (!Object.values(EntityType).includes(entityType as EntityType)) {
      return NextResponse.json(
        { error: 'Invalid entity type' },
        { status: 400 }
      );
    }

    // Upload-Ordner erstellen falls nicht vorhanden
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const imagesDir = join(uploadDir, 'images');
    const documentsDir = join(uploadDir, 'documents');

    if (!existsSync(imagesDir)) {
      await mkdir(imagesDir, { recursive: true });
    }
    if (!existsSync(documentsDir)) {
      await mkdir(documentsDir, { recursive: true });
    }

    // Bilder verarbeiten
    const images = formData.getAll('images') as File[];
    const imageOrders: Record<string, number> = {};

    // Order-Werte extrahieren
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('imageOrder_')) {
        const index = key.split('_')[1];
        imageOrders[index] = parseInt(value as string);
      }
    }

    console.log('Processing images:', images.length, 'files');

    const savedImages = [];
    const validationErrors = [];

    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      console.log('Image file:', { name: file?.name, size: file?.size, type: file?.type });

      // Skip if not a File object
      if (!file || typeof file !== 'object' || !('arrayBuffer' in file)) {
        console.log('Skipping invalid file object');
        continue;
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // ✅ Comprehensive security validation
      const validation = validateUploadedFile(
        file,
        buffer,
        ALLOWED_IMAGE_EXTENSIONS,
        ALLOWED_IMAGE_TYPES,
        MAX_IMAGE_SIZE
      );

      if (!validation.valid) {
        console.error(`Image validation failed for ${file.name}:`, validation.error);
        validationErrors.push({
          file: file.name,
          error: validation.error,
        });
        continue;
      }

      // ✅ Generate cryptographically secure filename
      const ext = validation.sanitizedFilename!.split('.').pop()!;
      const filename = generateSecureFilename(ext);
      const filepath = join(imagesDir, filename);

      await writeFile(filepath, buffer);

      // In Datenbank speichern mit validiertem MIME-Type
      const picture = await prisma.picture.create({
        data: {
          filename,
          originalName: validation.sanitizedFilename!,
          mimeType: validation.detectedMimeType!, // Use detected MIME type, not client-provided
          size: file.size,
          url: `/uploads/images/${filename}`,
          order: imageOrders[i.toString()] ?? i,
          entityType: entityType as EntityType,
          entityId,
        },
      });

      savedImages.push(picture);
    }

    // Return validation errors if any
    if (validationErrors.length > 0 && savedImages.length === 0) {
      return NextResponse.json(
        {
          error: 'All image uploads failed validation',
          errors: validationErrors,
        },
        { status: 400 }
      );
    }

    // PDFs verarbeiten
    const documents = formData.getAll('documents') as File[];
    const documentOrders: Record<string, number> = {};

    // Order-Werte extrahieren
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('documentOrder_')) {
        const index = key.split('_')[1];
        documentOrders[index] = parseInt(value as string);
      }
    }

    console.log('Processing documents:', documents.length, 'files');

    const savedDocuments = [];

    for (let i = 0; i < documents.length; i++) {
      const file = documents[i];
      console.log('Document file:', { name: file?.name, size: file?.size, type: file?.type });

      // Skip if not a File object
      if (!file || typeof file !== 'object' || !('arrayBuffer' in file)) {
        console.log('Skipping invalid file object');
        continue;
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // ✅ Comprehensive security validation
      const validation = validateUploadedFile(
        file,
        buffer,
        ALLOWED_DOCUMENT_EXTENSIONS,
        ALLOWED_DOCUMENT_TYPES,
        MAX_DOCUMENT_SIZE
      );

      if (!validation.valid) {
        console.error(`Document validation failed for ${file.name}:`, validation.error);
        validationErrors.push({
          file: file.name,
          error: validation.error,
        });
        continue;
      }

      // ✅ Generate cryptographically secure filename
      const ext = validation.sanitizedFilename!.split('.').pop()!;
      const filename = generateSecureFilename(ext);
      const filepath = join(documentsDir, filename);

      await writeFile(filepath, buffer);

      // In Datenbank speichern mit validiertem MIME-Type
      const document = await prisma.document.create({
        data: {
          filename,
          originalName: validation.sanitizedFilename!,
          mimeType: validation.detectedMimeType!, // Use detected MIME type, not client-provided
          size: file.size,
          url: `/uploads/documents/${filename}`,
          order: documentOrders[i.toString()] ?? i,
          entityType: entityType as EntityType,
          entityId,
        },
      });

      savedDocuments.push(document);
    }

    return NextResponse.json({
      success: true,
      images: savedImages.length,
      documents: savedDocuments.length,
      data: {
        images: savedImages,
        documents: savedDocuments,
      },
      ...(validationErrors.length > 0 && {
        warnings: {
          message: 'Some files failed validation and were skipped',
          errors: validationErrors,
        },
      }),
    });

  } catch (error) {
    console.error('Error uploading files:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload files',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});
