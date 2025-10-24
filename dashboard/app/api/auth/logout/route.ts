import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { PrismaClient } from '@prisma/client';
import { revokeRefreshToken } from '@/lib/token-helper';

const prisma = new PrismaClient();

export async function POST() {
  try {
    const cookieStore = await cookies();

    // Refresh-Token aus Cookie holen
    const refreshToken = cookieStore.get('refreshToken')?.value;

    if (refreshToken) {
      // Refresh-Token aus der Datenbank löschen
      await revokeRefreshToken(prisma, refreshToken);
    }

    // Response mit gelöschten Cookies erstellen
    const response = NextResponse.json(
      { message: 'Logout erfolgreich' },
      { status: 200 }
    );

    // Refresh Token Cookie löschen
    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Logout Fehler:', error);

    // Auch bei Fehler die Cookies löschen
    const response = NextResponse.json(
      { error: 'Logout fehlgeschlagen' },
      { status: 500 }
    );

    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } finally {
    await prisma.$disconnect();
  }
}
