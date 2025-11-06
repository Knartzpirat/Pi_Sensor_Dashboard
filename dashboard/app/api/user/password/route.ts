import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { getPrismaClient } from '@/lib/prisma';

/**
 * PATCH /api/user/password
 * Change user password
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

    const { currentPassword, newPassword } = await request.json();

    // Validate input according to setup rules
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    if (newPassword.length > 100) {
      return NextResponse.json(
        { error: 'New password must be at most 100 characters long' },
        { status: 400 }
      );
    }

    // Verify current password
    console.log('Verifying password for user:', tokenRecord.userId);
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      tokenRecord.user.password
    );
    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: tokenRecord.userId },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
