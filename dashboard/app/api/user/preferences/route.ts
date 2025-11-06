import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getPrismaClient } from '@/lib/prisma';

/**
 * GET /api/user/preferences
 * Get current user preferences
 */
export async function GET(request: NextRequest) {
  const prisma = getPrismaClient();

  try {
    // Get refresh token from cookies
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find user by refresh token
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          include: {
            preferences: true,
          },
        },
      },
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check if token is expired
    if (tokenRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Token expired' },
        { status: 401 }
      );
    }

    // If no preferences exist yet, create default preferences
    let preferences = tokenRecord.user.preferences;

    if (!preferences) {
      preferences = await prisma.userPreferences.create({
        data: {
          userId: tokenRecord.userId,
          dateFormat: 'DD.MM.YYYY',
          timezone: 'Europe/Berlin',
        },
      });
    }

    return NextResponse.json({
      id: preferences.id,
      dateFormat: preferences.dateFormat,
      timezone: preferences.timezone,
      updatedAt: preferences.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/preferences
 * Update current user preferences
 */
export async function PATCH(request: NextRequest) {
  const prisma = getPrismaClient();

  try {
    // Get refresh token from cookies
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find user by refresh token
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: {
        user: {
          include: {
            preferences: true,
          },
        },
      },
    });

    if (!tokenRecord) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Check if token is expired
    if (tokenRecord.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Token expired' },
        { status: 401 }
      );
    }

    const { dateFormat, timezone } = await request.json();

    // Validate input
    const validDateFormats = ['DD.MM.YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY'];

    if (dateFormat && !validDateFormats.includes(dateFormat)) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: { dateFormat?: string; timezone?: string } = {};
    if (dateFormat) updateData.dateFormat = dateFormat;
    if (timezone) updateData.timezone = timezone;

    // Update or create preferences
    let preferences;
    if (tokenRecord.user.preferences) {
      preferences = await prisma.userPreferences.update({
        where: { userId: tokenRecord.userId },
        data: updateData,
      });
    } else {
      preferences = await prisma.userPreferences.create({
        data: {
          userId: tokenRecord.userId,
          dateFormat: dateFormat || 'DD.MM.YYYY',
          timezone: timezone || 'Europe/Berlin',
        },
      });
    }

    return NextResponse.json({
      id: preferences.id,
      dateFormat: preferences.dateFormat,
      timezone: preferences.timezone,
      updatedAt: preferences.updatedAt,
    });
  } catch (error) {
    console.error('Error updating user preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
