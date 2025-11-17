// app/api/labels/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';
import { withAuth } from '@/lib/auth-helpers';
import { validateParams, validateBody } from '@/lib/validation-helpers';
import { labelIdSchema, updateLabelSchema } from '@/lib/validations/labels';

const prisma = getPrismaClient();

// GET - Einzelnes Label
export const GET = withAuth(
  async (
    request: NextRequest,
    user,
    { params }: { params: { id: string } }
  ) => {
    try {
      const { id } = await validateParams(params, labelIdSchema);

      const label = await prisma.label.findUnique({
        where: { id },
        include: {
          _count: {
            select: { testObjects: true }
          }
        }
      });

      if (!label) {
        return NextResponse.json(
          { error: 'Label not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(label);
    } catch (error) {
      if (error instanceof NextResponse) {
        return error;
      }
      console.error('Error fetching label:', error);
      return NextResponse.json(
        { error: 'Failed to fetch label' },
        { status: 500 }
      );
    }
  }
);

// PATCH - Label bearbeiten
export const PATCH = withAuth(
  async (
    request: NextRequest,
    user,
    { params }: { params: { id: string } }
  ) => {
    try {
      const { id } = await validateParams(params, labelIdSchema);
      const data = await validateBody(request, updateLabelSchema);

      const label = await prisma.label.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.color !== undefined && { color: data.color })
        },
      });

      return NextResponse.json(label);
    } catch (error) {
      if (error instanceof NextResponse) {
        return error;
      }
      console.error('Error updating label:', error);
      return NextResponse.json(
        { error: 'Failed to update label' },
        { status: 500 }
      );
    }
  }
);

// DELETE - Label löschen
export const DELETE = withAuth(
  async (
    request: NextRequest,
    user,
    { params }: { params: { id: string } }
  ) => {
    try {
      const { id } = await validateParams(params, labelIdSchema);

      await prisma.label.delete({
        where: { id },
      });

      return NextResponse.json({ message: 'Label deleted' });
    } catch (error) {
      if (error instanceof NextResponse) {
        return error;
      }
      console.error('Error deleting label:', error);
      return NextResponse.json(
        { error: 'Failed to delete label' },
        { status: 500 }
      );
    }
  }
);
