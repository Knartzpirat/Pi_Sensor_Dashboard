import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateRefreshToken } from '@/lib/token-helper';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const prisma = new PrismaClient();

  try {
    const { username, password, stayLoggedIn } = await request.json();

    // Validierung
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // User finden
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Passwort prüfen
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Generiere Refresh Token mit expiresAt
    const { token: refreshToken, expiresAt } = await generateRefreshToken(
      prisma,
      user.id,
      stayLoggedIn || false, // ✅ Flag vom Frontend
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      request.headers.get('user-agent') || undefined
    );

    // Setze Cookies
    const cookieStore = await cookies();

    // ✅ Refresh Token Cookie mit maxAge aus DB
    const maxAge = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
    cookieStore.set('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge,
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}