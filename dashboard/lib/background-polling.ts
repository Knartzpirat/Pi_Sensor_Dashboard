/**
 * Background Polling Service
 *
 * This service runs in the Next.js backend and continuously collects sensor data
 * from the FastAPI backend, storing it in the database via Prisma.
 *
 * The service is initialized once when the server starts and runs until shutdown.
 */

import { env } from './env';

let pollingInterval: NodeJS.Timeout | null = null;
let isPolling = false;

/**
 * Start the background polling service
 * @param intervalMs - Polling interval in milliseconds (default: 5000ms = 5 seconds)
 */
export function startBackgroundPolling(intervalMs: number = 5000) {
  if (pollingInterval) {
    console.log('[Background Polling] Service is already running');
    return;
  }

  console.log(`[Background Polling] Starting service with ${intervalMs}ms interval`);

  // Poll immediately on start
  pollSensorData();

  // Then poll at regular intervals
  pollingInterval = setInterval(async () => {
    await pollSensorData();
  }, intervalMs);
}

/**
 * Stop the background polling service
 */
export function stopBackgroundPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
    console.log('[Background Polling] Service stopped');
  }
}

/**
 * Get the polling status
 */
export function getPollingStatus() {
  return {
    isRunning: pollingInterval !== null,
    isPolling,
  };
}

/**
 * Internal function to poll sensor data
 */
async function pollSensorData() {
  if (isPolling) {
    console.log('[Background Polling] Skipping poll - previous poll still running');
    return;
  }

  isPolling = true;

  try {
    // Call our own API route to collect sensor data
    const response = await fetch(`${env.appUrl}/api/sensor-readings/collect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`[Background Polling] Failed to collect data: ${response.statusText}`);
      return;
    }

    const result = await response.json();

    if (result.success) {
      console.log(`[Background Polling] Collected ${result.readingsCount} readings at ${result.timestamp}`);
    } else {
      console.error('[Background Polling] Collection failed:', result.error);
    }
  } catch (error) {
    console.error('[Background Polling] Error during polling:', error);
  } finally {
    isPolling = false;
  }
}

/**
 * Cleanup old sensor readings
 * Call this periodically (e.g., once per hour) to remove old data
 *
 * @param retentionTimeMs - Keep readings newer than this (default: 24 hours)
 */
export async function cleanupOldReadings(retentionTimeMs: number = 24 * 60 * 60 * 1000) {
  try {
    const cutoffTime = Date.now() - retentionTimeMs;

    const response = await fetch(
      `${env.appUrl}/api/sensor-readings?before=${cutoffTime}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.ok) {
      const result = await response.json();
      console.log(`[Background Polling] Cleanup: Deleted ${result.deletedCount} old readings`);
    } else {
      console.error('[Background Polling] Cleanup failed:', response.statusText);
    }
  } catch (error) {
    console.error('[Background Polling] Error during cleanup:', error);
  }
}
