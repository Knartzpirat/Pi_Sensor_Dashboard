import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import { verifyRefreshToken } from '@/lib/token-helper';

export async function GET() {
  const prisma = new PrismaClient();

  try {
    // Setup Status prüfen
    const setupStatus = await prisma.setupStatus.findFirst();
    const setupRequired = !setupStatus || !setupStatus.isCompleted;

    if (setupRequired) {
      return NextResponse.json({
        status: 'setup_required',
        redirect: '/setup',
      });
    }

    // Token prüfen
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get('refreshToken')?.value;

    if (!refreshToken) {
      return NextResponse.json({
        status: 'login_required',
        redirect: '/login',
      });
    }

    // Token validieren
    const tokenData = await verifyRefreshToken(prisma, refreshToken);

    if (!tokenData) {
      return NextResponse.json({
        status: 'login_required',
        redirect: '/login',
      });
    }

    return NextResponse.json({
      status: 'authenticated',
      redirect: '/dashboard',
      user: {
        id: tokenData.userId,
        username: tokenData.username,
        role: tokenData.role,
      },
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      {
        status: 'error',
        redirect: '/setup',
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
