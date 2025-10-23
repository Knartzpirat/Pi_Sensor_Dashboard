import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import { verifyRefreshToken } from '@/lib/token-helper';

export async function GET() {
  const prisma = new PrismaClient();

  try {
    // Hole Refresh Token aus Cookie
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token found' },
        { status: 401 }
      );
    }

    // ✅ Verwende deine bestehende verifyRefreshToken Funktion
    const tokenData = await verifyRefreshToken(prisma, refreshToken);

    if (!tokenData) {
      return NextResponse.json(
        { error: 'Invalid or expired refresh token' },
        { status: 401 }
      );
    }

    // Hole alle unverwendeten Recovery Codes für diesen User
    const recoveryCodes = await prisma.recoveryCode.findMany({
      where: {
        userId: tokenData.userId,
        used: false,
      },
      select: {
        id: true,
        createdAt: true,
        used: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return NextResponse.json({
      userId: tokenData.userId,
      username: tokenData.username,
      role: tokenData.role,
      totalCodes: recoveryCodes.length,
      codesAvailable: recoveryCodes.filter((c) => !c.used).length,
      message: 'Recovery codes are only shown once during setup',
    });
  } catch (error) {
    console.error('Error fetching recovery codes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
