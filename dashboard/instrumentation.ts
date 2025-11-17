/**
 * Next.js Instrumentation
 * This file runs once when the Next.js server starts
 */

import { getPrismaClient } from './lib/prisma';
import { startBackgroundPolling, stopBackgroundPolling, cleanupOldReadings } from './lib/background-polling';
import { validateEnv, getEnvSummary } from './lib/env';
import { logger } from './lib/logger';

const prisma = getPrismaClient();

export async function register() {
  // Only run on server
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Validate environment variables first
    try {
      validateEnv();
      logger.info('Environment validation successful', getEnvSummary());
    } catch (error) {
      logger.error('Environment validation failed - server cannot start', error);
      process.exit(1);
    }

    logger.info('Initializing server...');

    // Get hardware config for polling interval
    try {
      const config = await prisma.hardwareConfig.findFirst();
      const pollingInterval = config?.dashboardUpdateInterval || 5000;
      const retentionTime = config?.graphDataRetentionTime || 3600000;

      // Start background polling service
      startBackgroundPolling(pollingInterval);

      // Schedule periodic cleanup (every hour)
      setInterval(async () => {
        logger.info('Running periodic cleanup...');
        await cleanupOldReadings(retentionTime);
      }, 60 * 60 * 1000); // Every hour

      logger.info('Background polling started', {
        pollingInterval,
        retentionTime,
      });
    } catch (error) {
      logger.error('Failed to start background polling', error);
    }

    // Cleanup on shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down...');
      stopBackgroundPolling();
      prisma.$disconnect();
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down...');
      stopBackgroundPolling();
      prisma.$disconnect();
    });
  }
}
