// app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  const prisma = new PrismaClient();

  try {
    const { recoveryCode, userId, newPassword } = await request.json();

    if (!recoveryCode || !userId || !newPassword) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validiere, dass der Recovery Code zum User gehört und noch nicht verwendet wurde
    const recoveryCodes = await prisma.recoveryCode.findMany({
      where: {
        userId,
        used: false,
      },
    });

    let validCode = null;
    for (const code of recoveryCodes) {
      const isValid = await bcrypt.compare(recoveryCode, code.code);
      if (isValid) {
        validCode = code;
        break;
      }
    }

    if (!validCode) {
      return NextResponse.json(
        { error: 'Invalid recovery code' },
        { status: 401 }
      );
    }

    // Hash neues Passwort
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update Passwort
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Markiere Recovery Code als verwendet
    await prisma.recoveryCode.update({
      where: { id: validCode.id },
      data: {
        used: true,
        usedAt: new Date(),
      },
    });

    // Lösche alle Refresh Tokens des Users (Force Logout)
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
