// app/api/test-objects/[id]/pictures/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { writeFile } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const prisma = new PrismaClient();

// POST - Bild hochladen
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Prüfe ob TestObject existiert
    const testObject = await prisma.testObject.findUnique({
      where: { id: params.id },
    });

    if (!testObject) {
      return NextResponse.json(
        { error: 'Test object not found' },
        { status: 404 }
      );
    }

    // Generiere eindeutigen Dateinamen
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileExt = path.extname(file.name);
    const filename = `${crypto.randomBytes(16).toString('hex')}${fileExt}`;

    // Speichere Datei (z.B. in public/uploads)
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);

    // Speichere in DB
    const picture = await prisma.picture.create({
      data: {
        filename,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        url: `/uploads/${filename}`,
        testObjectId: params.id,
      },
    });

    return NextResponse.json(picture, { status: 201 });
  } catch (error) {
    console.error('Error uploading picture:', error);
    return NextResponse.json(
      { error: 'Failed to upload picture' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
