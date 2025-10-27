import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateRefreshToken } from './token-helper';
import { getClientInfo } from './request-utils';

export interface SetupProgress {
  step: string;
  progress: number;
  error?: string;
}

export interface SetupResult {
  success: boolean;
  error?: string;
  recoveryCodes?: string[];
  refreshToken?: string;
  refreshTokenExpiresAt?: Date;
  userId?: string;
}

/**
 * Check if setup is allowed
 */
export async function isSetupAllowed(): Promise<boolean> {
  const prisma = new PrismaClient();

  try {
    // Check if setup has already been completed
    const setupStatus = await prisma.setupStatus.findFirst();

    if (setupStatus?.isCompleted) {
      // Check if ALLOW_SETUP_AGAIN is set in environment
      return process.env.ALLOW_SETUP_AGAIN === 'true';
    }

    return true;
  } catch (error) {
    console.error('Error checking setup status:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Run the setup process
 */
export async function runSetup(
  request: NextRequest,
  databaseUrl: string,
  username: string,
  password: string,
  onProgress: (progress: SetupProgress) => void
): Promise<SetupResult> {
  // Use the database URL from the form (not used in this simplified version)
  // In production, you might want to test the connection first
  const prisma = new PrismaClient();

  try {
    // Step 1: Hash password
    onProgress({ step: 'Hashing password...', progress: 20 });
    const hashedPassword = await bcrypt.hash(password, 12);

    // Step 2: Create admin user
    onProgress({ step: 'Creating admin user...', progress: 40 });
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: 'admin',
      },
    });

    // Step 3: Generate recovery codes
    onProgress({ step: 'Generating recovery codes...', progress: 60 });
    const recoveryCodes: string[] = [];
    const hashedRecoveryCodes = [];

    for (let i = 0; i < 10; i++) {
      // Generate a random 10-character code
      const code = generateRecoveryCode();
      recoveryCodes.push(code);

      // Hash the code before storing
      const hashedCode = await bcrypt.hash(code, 10);
      hashedRecoveryCodes.push(hashedCode);
    }

    // Store hashed recovery codes in database
    await prisma.recoveryCode.createMany({
      data: hashedRecoveryCodes.map((code) => ({
        code,
        userId: user.id,
        used: false,
      })),
    });

    // Step 4: Generate refresh token
    onProgress({ step: 'Generating authentication token...', progress: 80 });
    const { ipAddress, userAgent } = getClientInfo(request);
    const { token: refreshToken, expiresAt } = await generateRefreshToken(
      prisma,
      user.id,
      false,
      ipAddress,
      userAgent
    );

    // Step 5: Mark setup as completed
    onProgress({ step: 'Finalizing setup...', progress: 90 });
    await prisma.setupStatus.create({
      data: {
        isCompleted: true,
        completedAt: new Date(),
        version: '1.0.0',
      },
    });

    return {
      success: true,
      recoveryCodes,
      refreshToken,
      refreshTokenExpiresAt: expiresAt,
      userId: user.id,
    };
  } catch (error) {
    console.error('Setup error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Generate a random recovery code
 */
function generateRecoveryCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';

  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // Format as XXXXX-XXXXX
  return `${code.slice(0, 5)}-${code.slice(5)}`;
}
