import { NextRequest, NextResponse } from 'next/server';
import { getPrismaClient } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { generateAccessToken, generateRefreshToken } from '@/lib/token-helper';

export async function POST(request: NextRequest) {
  try {
    const { username, password, stayLoggedIn } = await request.json();

    const prisma = getPrismaClient();
    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // ✅ Access Token IMMER generieren
    const accessToken = await generateAccessToken(
      user.id,
      user.username,
      user.role
    );

    // ✅ Refresh Token IMMER generieren (mit variabler Lebensdauer)
    const refreshToken = await generateRefreshToken(
      prisma,
      user.id,
      stayLoggedIn, // ✅ Unterschiedliche Lebensdauer
      request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      request.headers.get('user-agent') || undefined
    );

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });

    // ✅ Access Token Cookie (kurz)
    response.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 15, // 15 Minuten
      path: '/',
    });

    // ✅ Refresh Token Cookie (variabel)
    response.cookies.set('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: stayLoggedIn
        ? 60 * 60 * 24 * 30 // 30 Tage
        : 60 * 60 * 24, // 1 Tag
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
