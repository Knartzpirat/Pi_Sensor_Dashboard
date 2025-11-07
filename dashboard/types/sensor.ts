/**
 * Sensor configuration types
 */

/**
 * Sensor connection types
 */
export type SensorConnectionType = 'i2c' | 'adc' | 'io';

/**
 * Check if a connection type is supported by a board type
 */
export function isConnectionTypeSupported(
  connectionType: SensorConnectionType,
  boardType: 'GPIO' | 'CUSTOM'
): boolean {
  if (connectionType === 'adc') {
    // ADC sensors only work with Custom Board (has integrated ADC)
    return boardType === 'CUSTOM';
  }
  // i2c and io work with both boards
  return true;
}

/**
 * Get human-readable name for connection type
 */
export function getConnectionTypeName(type: SensorConnectionType): string {
  const names: Record<SensorConnectionType, string> = {
    i2c: 'I2C',
    adc: 'Analog (ADC)',
    io: 'Digital GPIO',
  };
  return names[type];
}

/**
 * Get supported connection types for a board
 */
export function getSupportedConnectionTypes(
  boardType: 'GPIO' | 'CUSTOM'
): SensorConnectionType[] {
  if (boardType === 'CUSTOM') {
    return ['i2c', 'adc', 'io'];
  }
  // GPIO Board only supports i2c and io
  return ['i2c', 'io'];
}
