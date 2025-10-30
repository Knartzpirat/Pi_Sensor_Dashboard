import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  const prisma = new PrismaClient();

  try {
    const formData = await request.formData();

    const entityId = formData.get('entityId') as string;
    const entityType = formData.get('entityType') as string;

    if (!entityId || !entityType) {
      return NextResponse.json(
        { error: 'entityId and entityType are required' },
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

    const savedImages = [];
    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      if (!file || file.size === 0) continue;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Eindeutigen Dateinamen generieren
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const ext = file.name.split('.').pop();
      const filename = `${timestamp}-${random}.${ext}`;
      const filepath = join(imagesDir, filename);

      await writeFile(filepath, buffer);

      // In Datenbank speichern
      const picture = await prisma.picture.create({
        data: {
          filename,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          url: `/uploads/images/${filename}`,
          order: imageOrders[i.toString()] ?? i,
          entityType: entityType as any,
          entityId,
        },
      });

      savedImages.push(picture);
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

    const savedDocuments = [];
    for (let i = 0; i < documents.length; i++) {
      const file = documents[i];
      if (!file || file.size === 0) continue;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Eindeutigen Dateinamen generieren
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(7);
      const ext = file.name.split('.').pop();
      const filename = `${timestamp}-${random}.${ext}`;
      const filepath = join(documentsDir, filename);

      await writeFile(filepath, buffer);

      // In Datenbank speichern
      const document = await prisma.document.create({
        data: {
          filename,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          url: `/uploads/documents/${filename}`,
          order: documentOrders[i.toString()] ?? i,
          entityType: entityType as any,
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
  } finally {
    await prisma.$disconnect();
  }
}
