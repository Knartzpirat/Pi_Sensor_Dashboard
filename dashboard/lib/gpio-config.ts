/**
 * Raspberry Pi GPIO Pin Configuration
 *
 * Pin numbering: BCM (Broadcom SOC channel)
 */

export type PinFunction =
  | 'GPIO'
  | 'I2C'
  | 'UART'
  | 'PWM'
  | 'POWER'
  | 'GROUND';

export type PinMode = 'INPUT' | 'OUTPUT' | 'PWM' | 'I2C' | 'UART';

export interface GPIOPin {
  bcm: number;
  physical: number;
  name: string;
  functions: PinFunction[];
  defaultFunction: PinFunction;
  description?: string;
}

/**
 * Complete Raspberry Pi GPIO pin mapping (40-pin header)
 * Based on: https://pinout.xyz/
 */
export const GPIO_PINS: GPIOPin[] = [
  // Left side (odd numbers)
  { bcm: -1, physical: 1, name: '3V3 Power', functions: ['POWER'], defaultFunction: 'POWER', description: '3.3V power supply' },
  { bcm: 2, physical: 3, name: 'GPIO 2', functions: ['GPIO', 'I2C'], defaultFunction: 'I2C', description: 'I2C1 SDA' },
  { bcm: 3, physical: 5, name: 'GPIO 3', functions: ['GPIO', 'I2C'], defaultFunction: 'I2C', description: 'I2C1 SCL' },
  { bcm: 4, physical: 7, name: 'GPIO 4', functions: ['GPIO'], defaultFunction: 'GPIO', description: 'GPCLK0' },
  { bcm: -1, physical: 9, name: 'Ground', functions: ['GROUND'], defaultFunction: 'GROUND' },
  { bcm: 17, physical: 11, name: 'GPIO 17', functions: ['GPIO'], defaultFunction: 'GPIO' },
  { bcm: 27, physical: 13, name: 'GPIO 27', functions: ['GPIO'], defaultFunction: 'GPIO' },
  { bcm: 22, physical: 15, name: 'GPIO 22', functions: ['GPIO'], defaultFunction: 'GPIO' },
  { bcm: -1, physical: 17, name: '3V3 Power', functions: ['POWER'], defaultFunction: 'POWER' },
  { bcm: 10, physical: 19, name: 'GPIO 10', functions: ['GPIO'], defaultFunction: 'GPIO' },
  { bcm: 9, physical: 21, name: 'GPIO 9', functions: ['GPIO'], defaultFunction: 'GPIO' },
  { bcm: 11, physical: 23, name: 'GPIO 11', functions: ['GPIO'], defaultFunction: 'GPIO' },
  { bcm: -1, physical: 25, name: 'Ground', functions: ['GROUND'], defaultFunction: 'GROUND' },
  { bcm: 0, physical: 27, name: 'ID_SD', functions: ['I2C'], defaultFunction: 'I2C', description: 'ID EEPROM SDA (reserved)' },
  { bcm: 5, physical: 29, name: 'GPIO 5', functions: ['GPIO'], defaultFunction: 'GPIO' },
  { bcm: 6, physical: 31, name: 'GPIO 6', functions: ['GPIO'], defaultFunction: 'GPIO' },
  { bcm: 13, physical: 33, name: 'GPIO 13', functions: ['GPIO', 'PWM'], defaultFunction: 'GPIO', description: 'PWM1' },
  { bcm: 19, physical: 35, name: 'GPIO 19', functions: ['GPIO', 'PWM'], defaultFunction: 'GPIO', description: 'PWM1' },
  { bcm: 26, physical: 37, name: 'GPIO 26', functions: ['GPIO'], defaultFunction: 'GPIO' },
  { bcm: -1, physical: 39, name: 'Ground', functions: ['GROUND'], defaultFunction: 'GROUND' },

  // Right side (even numbers)
  { bcm: -1, physical: 2, name: '5V Power', functions: ['POWER'], defaultFunction: 'POWER', description: '5V power supply' },
  { bcm: -1, physical: 4, name: '5V Power', functions: ['POWER'], defaultFunction: 'POWER', description: '5V power supply' },
  { bcm: -1, physical: 6, name: 'Ground', functions: ['GROUND'], defaultFunction: 'GROUND' },
  { bcm: 14, physical: 8, name: 'GPIO 14', functions: ['GPIO', 'UART'], defaultFunction: 'UART', description: 'UART TXD' },
  { bcm: 15, physical: 10, name: 'GPIO 15', functions: ['GPIO', 'UART'], defaultFunction: 'UART', description: 'UART RXD' },
  { bcm: 18, physical: 12, name: 'GPIO 18', functions: ['GPIO', 'PWM'], defaultFunction: 'GPIO', description: 'PWM0' },
  { bcm: -1, physical: 14, name: 'Ground', functions: ['GROUND'], defaultFunction: 'GROUND' },
  { bcm: 23, physical: 16, name: 'GPIO 23', functions: ['GPIO'], defaultFunction: 'GPIO' },
  { bcm: 24, physical: 18, name: 'GPIO 24', functions: ['GPIO'], defaultFunction: 'GPIO' },
  { bcm: -1, physical: 20, name: 'Ground', functions: ['GROUND'], defaultFunction: 'GROUND' },
  { bcm: 25, physical: 22, name: 'GPIO 25', functions: ['GPIO'], defaultFunction: 'GPIO' },
  { bcm: 8, physical: 24, name: 'GPIO 8', functions: ['GPIO'], defaultFunction: 'GPIO' },
  { bcm: 7, physical: 26, name: 'GPIO 7', functions: ['GPIO'], defaultFunction: 'GPIO' },
  { bcm: 1, physical: 28, name: 'ID_SC', functions: ['I2C'], defaultFunction: 'I2C', description: 'ID EEPROM SCL (reserved)' },
  { bcm: -1, physical: 30, name: 'Ground', functions: ['GROUND'], defaultFunction: 'GROUND' },
  { bcm: 12, physical: 32, name: 'GPIO 12', functions: ['GPIO', 'PWM'], defaultFunction: 'GPIO', description: 'PWM0' },
  { bcm: -1, physical: 34, name: 'Ground', functions: ['GROUND'], defaultFunction: 'GROUND' },
  { bcm: 16, physical: 36, name: 'GPIO 16', functions: ['GPIO'], defaultFunction: 'GPIO' },
  { bcm: 20, physical: 38, name: 'GPIO 20', functions: ['GPIO'], defaultFunction: 'GPIO' },
  { bcm: 21, physical: 40, name: 'GPIO 21', functions: ['GPIO'], defaultFunction: 'GPIO' },
];

/**
 * I2C pin pairs
 * When one pin is used as GPIO, the entire I2C bus becomes unavailable
 */
export const I2C_PAIRS = [
  { name: 'I2C1', sda: 2, scl: 3, description: 'Primary I2C bus' },
  { name: 'I2C0', sda: 0, scl: 1, description: 'ID EEPROM (usually reserved)' },
];

/**
 * PWM-capable pins
 */
export const PWM_PINS = [12, 13, 18, 19];

/**
 * Get all usable GPIO pins (excludes power, ground, reserved)
 */
export function getUsableGPIOPins(): GPIOPin[] {
  return GPIO_PINS.filter(
    (pin) =>
      pin.bcm >= 0 &&
      !pin.functions.includes('POWER') &&
      !pin.functions.includes('GROUND') &&
      // Exclude ID EEPROM pins (usually reserved)
      pin.bcm !== 0 &&
      pin.bcm !== 1
  );
}

/**
 * Check if a pin is available for GPIO use
 */
export function isPinAvailableForGPIO(
  bcm: number,
  usedPins: number[],
  i2cChannels: string[]
): boolean {
  // Check if already used
  if (usedPins.includes(bcm)) {
    return false;
  }

  // Check I2C conflicts - if any channel uses I2C, those pins are reserved
  if (i2cChannels.length > 0) {
    const i2cPins = I2C_PAIRS.flatMap((pair) => [pair.sda, pair.scl]);
    if (i2cPins.includes(bcm)) {
      return false;
    }
  }

  return true;
}

/**
 * Check if I2C is available (not blocked by GPIO usage)
 */
export function isI2CAvailable(usedGPIOPins: number[]): boolean {
  // Check if either I2C1 SDA or SCL is used as GPIO
  return !usedGPIOPins.includes(2) && !usedGPIOPins.includes(3);
}
