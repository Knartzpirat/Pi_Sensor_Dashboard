import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyRefreshToken } from '@/lib/token-helper';

// Pfade die keine Auth benötigen
const publicPaths = [
  '/setup',
  '/login',
  '/forget-password',
  '/setup/recovery-codes',
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // API Routes und statische Files durchlassen
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  // Öffentliche Pfade durchlassen
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  const prisma = new PrismaClient();

  try {
    // Setup Status prüfen
    const setupStatus = await prisma.setupStatus.findFirst();

    if (!setupStatus || !setupStatus.isCompleted) {
      return NextResponse.redirect(new URL('/setup', request.url));
    }

    // Token prüfen
    const refreshToken = request.cookies.get('refreshToken')?.value;

    if (!refreshToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Token validieren
    const tokenData = await verifyRefreshToken(prisma, refreshToken);

    if (!tokenData) {
      // Token ungültig -> Cookie löschen
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('refreshToken');
      response.cookies.delete('accessToken');
      return response;
    }

    // User ist authentifiziert
    return NextResponse.next();
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.redirect(new URL('/setup', request.url));
  } finally {
    await prisma.$disconnect();
  }
}
