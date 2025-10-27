import { PrismaClient } from '@prisma/client';
import { randomBytes } from 'crypto';

/**
 * Generate a new refresh token and store it in the database
 */
export async function generateRefreshToken(
  prisma: PrismaClient,
  userId: string,
  persistent: boolean = false,
  ipAddress?: string,
  userAgent?: string
): Promise<{ token: string; expiresAt: Date }> {
  // Generate a cryptographically secure random token
  const token = randomBytes(32).toString('hex');

  // Calculate expiration
  const expiresAt = new Date();
  if (persistent) {
    // 30 days for "stay logged in"
    expiresAt.setDate(expiresAt.getDate() + 30);
  } else {
    // 7 days for normal sessions
    expiresAt.setDate(expiresAt.getDate() + 7);
  }

  // Store in database
  await prisma.refreshToken.create({
    data: {
      token,
      userId,
      expiresAt,
      persistent,
      ipAddress,
      userAgent,
    },
  });

  return { token, expiresAt };
}

/**
 * Verify and optionally rotate a refresh token
 */
export async function verifyRefreshToken(
  prisma: PrismaClient,
  token: string,
  rotate: boolean = false
): Promise<{ userId: string; token: string; expiresAt: Date } | null> {
  // Find token in database
  const refreshToken = await prisma.refreshToken.findUnique({
    where: { token },
    include: { user: true },
  });

  // Check if token exists
  if (!refreshToken) {
    return null;
  }

  // Check if token is expired
  if (refreshToken.expiresAt < new Date()) {
    // Clean up expired token
    await prisma.refreshToken.delete({
      where: { id: refreshToken.id },
    });
    return null;
  }

  // Token is valid
  const result = {
    userId: refreshToken.userId,
    token: refreshToken.token,
    expiresAt: refreshToken.expiresAt,
  };

  // Optionally rotate the token (for added security)
  if (rotate) {
    // Delete old token
    await prisma.refreshToken.delete({
      where: { id: refreshToken.id },
    });

    // Generate new token
    const newToken = await generateRefreshToken(
      prisma,
      refreshToken.userId,
      refreshToken.persistent,
      refreshToken.ipAddress || undefined,
      refreshToken.userAgent || undefined
    );

    return {
      userId: refreshToken.userId,
      token: newToken.token,
      expiresAt: newToken.expiresAt,
    };
  }

  return result;
}

/**
 * Revoke a refresh token
 */
export async function revokeRefreshToken(
  prisma: PrismaClient,
  token: string
): Promise<boolean> {
  try {
    await prisma.refreshToken.delete({
      where: { token },
    });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Clean up expired tokens (should be run periodically)
 */
export async function cleanupExpiredTokens(
  prisma: PrismaClient
): Promise<number> {
  const result = await prisma.refreshToken.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });

  return result.count;
}
