/**
 * Next.js Instrumentation
 * This file runs once when the Next.js server starts
 */

import { getPrismaClient } from './lib/prisma';
import { startBackgroundPolling, stopBackgroundPolling, cleanupOldReadings } from './lib/background-polling';

const prisma = getPrismaClient();

export async function register() {
  // Only run on server
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('[Instrumentation] Initializing server...');

    // Get hardware config for polling interval
    try {
      const config = await prisma.hardwareConfig.findFirst();
      const pollingInterval = config?.dashboardUpdateInterval || 5000;
      const retentionTime = config?.graphDataRetentionTime || 3600000;

      // Start background polling service
      startBackgroundPolling(pollingInterval);

      // Schedule periodic cleanup (every hour)
      setInterval(async () => {
        console.log('[Instrumentation] Running periodic cleanup...');
        await cleanupOldReadings(retentionTime);
      }, 60 * 60 * 1000); // Every hour

      console.log(`[Instrumentation] Background polling started with ${pollingInterval}ms interval`);
      console.log(`[Instrumentation] Data retention set to ${retentionTime}ms`);
    } catch (error) {
      console.error('[Instrumentation] Failed to start background polling:', error);
    }

    // Cleanup on shutdown
    process.on('SIGTERM', () => {
      console.log('[Instrumentation] SIGTERM received, shutting down...');
      stopBackgroundPolling();
      prisma.$disconnect();
    });

    process.on('SIGINT', () => {
      console.log('[Instrumentation] SIGINT received, shutting down...');
      stopBackgroundPolling();
      prisma.$disconnect();
    });
  }
}
