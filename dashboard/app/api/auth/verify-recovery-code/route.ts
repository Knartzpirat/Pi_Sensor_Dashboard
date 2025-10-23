// app/api/auth/verify-recovery-code/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  const prisma = new PrismaClient();

  try {
    const { recoveryCode } = await request.json();

    if (!recoveryCode) {
      return NextResponse.json(
        { error: 'Recovery code is required' },
        { status: 400 }
      );
    }

    // Normalisiere Code Format (entferne Bindestriche, Großbuchstaben)
    const normalizedCode = recoveryCode.toUpperCase().replace(/-/g, '');

    // Hole alle unverwendeten Recovery Codes
    const recoveryCodes = await prisma.recoveryCode.findMany({
      where: {
        used: false,
      },
      include: {
        user: true,
      },
    });

    // Vergleiche mit allen Codes (gehashte Codes in DB)
    let foundCode = null;
    for (const code of recoveryCodes) {
      // Vergleiche mit Bindestrichen
      const isValid = await bcrypt.compare(recoveryCode, code.code);

      // Vergleiche auch ohne Bindestriche (falls User sie vergessen hat)
      const isValidNormalized = await bcrypt.compare(normalizedCode, code.code);

      if (isValid || isValidNormalized) {
        foundCode = code;
        break;
      }
    }

    if (!foundCode) {
      return NextResponse.json(
        { error: 'Invalid or already used recovery code' },
        { status: 401 }
      );
    }

    // Code ist gültig - gebe UserId zurück
    return NextResponse.json({
      success: true,
      userId: foundCode.userId,
      username: foundCode.user.username,
    });
  } catch (error) {
    console.error('Recovery code verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
