// app/api/test-objects/[id]/pictures/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const prisma = new PrismaClient();

// GET - Alle Bilder eines TestObjects (sortiert)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pictures = await prisma.picture.findMany({
      where: { testObjectId: params.id },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(pictures);
  } catch (error) {
    console.error('Error fetching pictures:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pictures' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

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

    // Finde höchste Order-Nummer
    const lastPicture = await prisma.picture.findFirst({
      where: { testObjectId: params.id },
      orderBy: { order: 'desc' },
    });
    const nextOrder = (lastPicture?.order ?? -1) + 1;

    // Generiere eindeutigen Dateinamen
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileExt = path.extname(file.name);
    const filename = `${crypto.randomBytes(16).toString('hex')}${fileExt}`;

    // Erstelle Upload-Verzeichnis falls nicht vorhanden
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    // Speichere Datei
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
        order: nextOrder,
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
