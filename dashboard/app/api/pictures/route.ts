// app/api/pictures/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, EntityType } from '@prisma/client';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

const prisma = new PrismaClient();

// GET - Bilder abrufen (gefiltert nach entityType und entityId)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const entityType = searchParams.get('entityType') as EntityType | null;
    const entityId = searchParams.get('entityId');

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'entityType and entityId are required' },
        { status: 400 }
      );
    }

    const pictures = await prisma.picture.findMany({
      where: { entityType, entityId },
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
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const entityType = formData.get('entityType') as EntityType;
    const entityId = formData.get('entityId') as string;

    // Validierung
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!entityType || !entityId) {
      return NextResponse.json(
        { error: 'entityType and entityId are required' },
        { status: 400 }
      );
    }

    // Validiere EntityType
    if (!Object.values(EntityType).includes(entityType)) {
      return NextResponse.json(
        { error: 'Invalid entity type' },
        { status: 400 }
      );
    }

    // Finde höchste Order-Nummer für diese Entität
    const lastPicture = await prisma.picture.findFirst({
      where: { entityType, entityId },
      orderBy: { order: 'desc' },
    });
    const nextOrder = (lastPicture?.order ?? -1) + 1;

    // Generiere eindeutigen Dateinamen
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileExt = path.extname(file.name);
    const filename = `${crypto.randomBytes(16).toString('hex')}${fileExt}`;

    // Erstelle Upload-Verzeichnis
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
        entityType,
        entityId,
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
