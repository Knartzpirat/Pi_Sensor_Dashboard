import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getPrismaClient } from '@/lib/prisma';

/**
 * GET /api/user/profile
 * Get current user profile information
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
      include: { user: true },
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

    const { user } = tokenRecord;

    // Return user profile (without password)
    return NextResponse.json({
      id: user.id,
      username: user.username,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/user/profile
 * Update current user profile (username)
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
      include: { user: true },
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

    const { username } = await request.json();

    // Validate username according to setup rules
    if (!username || username.trim().length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters long' },
        { status: 400 }
      );
    }

    if (username.trim().length > 20) {
      return NextResponse.json(
        { error: 'Username must be at most 20 characters long' },
        { status: 400 }
      );
    }

    // Check if username is already taken by another user
    const existingUser = await prisma.user.findUnique({
      where: { username: username.trim() },
    });

    if (existingUser && existingUser.id !== tokenRecord.userId) {
      return NextResponse.json(
        { error: 'Username already taken' },
        { status: 409 }
      );
    }

    // Update username
    const updatedUser = await prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { username: username.trim() },
    });

    return NextResponse.json({
      id: updatedUser.id,
      username: updatedUser.username,
      role: updatedUser.role,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
