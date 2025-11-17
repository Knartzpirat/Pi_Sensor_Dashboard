import { PrismaClient } from '@prisma/client';
import { env } from './env';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.isDevelopment ? ['query', 'error', 'warn'] : ['error'],
    });

if (!env.isProduction) globalForPrisma.prisma = prisma;

/**
 * Get Prisma client instance
 */
export function getPrismaClient(): PrismaClient {
  return prisma;
}

export async function disconnectPrisma() {
  if (prisma) {
    await prisma.$disconnect();
  }
}

// Prüft ob Setup bereits durchgeführt wurde
export async function isSetupCompleted(): Promise<boolean> {
  try {
    const client = getPrismaClient();
    const setup = await client.setupStatus.findFirst();
    return setup?.isCompleted ?? false;
  } catch {
    return false;
  }
}
