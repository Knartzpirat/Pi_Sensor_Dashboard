// app/api/test-objects/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';
import { withAuth } from '@/lib/auth-helpers';
import { validateParams, validateBody } from '@/lib/validation-helpers';
import { testObjectIdSchema, updateTestObjectSchema } from '@/lib/validations/test-objects';

const prisma = getPrismaClient();

// GET - Einzelnes TestObject
export const GET = withAuth(
  async (
    request: NextRequest,
    user,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const { id } = await validateParams(params, testObjectIdSchema);
      const { searchParams } = new URL(request.url);
      const includePictures = searchParams.get('includePictures') === 'true';
      const includeDocuments = searchParams.get('includeDocuments') === 'true';

      const testObject = await prisma.testObject.findUnique({
        where: { id },
        include: {
          labels: true
        },
      });

      if (!testObject) {
        return NextResponse.json(
          { error: 'Test object not found' },
          { status: 404 }
        );
      }

      // Load pictures if requested
      let pictures = null;
      if (includePictures) {
        pictures = await prisma.picture.findMany({
          where: {
            entityType: 'TEST_OBJECT',
            entityId: id,
          },
          orderBy: { order: 'asc' },
        });
      }

      // Load documents if requested
      let documents = null;
      if (includeDocuments) {
        documents = await prisma.document.findMany({
          where: {
            entityType: 'TEST_OBJECT',
            entityId: id,
          },
          orderBy: { order: 'asc' },
        });
      }

      return NextResponse.json({
        ...testObject,
        ...(pictures !== null && { pictures }),
        ...(documents !== null && { documents }),
      });
    } catch (error) {
      if (error instanceof NextResponse) {
        return error;
      }
      console.error('Error fetching test object:', error);
      return NextResponse.json(
        { error: 'Failed to fetch test object' },
        { status: 500 }
      );
    }
  }
);

// PUT - TestObject aktualisieren
export const PUT = withAuth(
  async (
    request: NextRequest,
    user,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const { id } = await validateParams(params, testObjectIdSchema);
      const data = await validateBody(request, updateTestObjectSchema);

      const testObject = await prisma.testObject.update({
        where: { id },
        data: {
          ...(data.title && { title: data.title }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.labelIds !== undefined && {
            labels: {
              set: data.labelIds ? data.labelIds.map((labelId) => ({ id: labelId })) : [],
            },
          }),
        },
        include: {
          labels: true
        },
      });

      return NextResponse.json(testObject);
    } catch (error) {
      if (error instanceof NextResponse) {
        return error;
      }
      console.error('Error updating test object:', error);
      return NextResponse.json(
        { error: 'Failed to update test object' },
        { status: 500 }
      );
    }
  }
);

// DELETE - TestObject löschen
export const DELETE = withAuth(
  async (
    request: NextRequest,
    user,
    { params }: { params: Promise<{ id: string }> }
  ) => {
    try {
      const { id } = await validateParams(params, testObjectIdSchema);
      await prisma.testObject.delete({
        where: { id },
      });

      return NextResponse.json({ message: 'Test object deleted' });
    } catch (error) {
      if (error instanceof NextResponse) {
        return error;
      }
      console.error('Error deleting test object:', error);
      return NextResponse.json(
        { error: 'Failed to delete test object' },
        { status: 500 }
      );
    }
  }
);
