/**
 * Hardware configuration types
 */

export type BoardType = 'GPIO' | 'CUSTOM';

/**
 * Hardware configuration (only stores board type)
 * Pin/channel assignments are stored per sensor
 */
export interface HardwareConfig {
  id?: string;
  boardType: BoardType;
  createdAt?: string;
  updatedAt?: string;
}
