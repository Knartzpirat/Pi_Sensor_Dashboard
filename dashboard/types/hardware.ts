/**
 * Hardware configuration types
 */

export type BoardType = 'GPIO' | 'CUSTOM';

/**
 * Hardware configuration (stores board type and dashboard settings)
 * Pin/channel assignments are stored per sensor
 */
export interface HardwareConfig {
  id?: string;
  boardType: BoardType;
  dashboardUpdateInterval?: number;
  graphDataRetentionTime?: number;
  createdAt?: string;
  updatedAt?: string;
}
