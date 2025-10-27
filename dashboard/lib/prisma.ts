import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Get Prisma client instance
 */
export function getPrismaClient(): PrismaClient {
  return prisma;
}

export async function disconnectPrisma() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
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
