/**
 * Sensor configuration utilities
 */

import type { SensorConnectionType } from '@/types/sensor';
import { getUsableGPIOPins, isI2CAvailable } from './gpio-config';

/**
 * Get available pins/channels for a sensor based on board type and connection type
 */
export interface PinOption {
  value: number;
  label: string;
  description?: string;
  disabled?: boolean;
}

/**
 * Get available options for GPIO Board
 */
export function getGPIOBoardOptions(
  connectionType: SensorConnectionType,
  usedPins: number[]
): PinOption[] {
  if (connectionType === 'i2c') {
    // I2C uses fixed pins (GPIO 2/3)
    const available = isI2CAvailable(usedPins);
    return [
      {
        value: 2,
        label: 'I2C1 (GPIO 2/3)',
        description: 'Primary I2C bus',
        disabled: !available,
      },
    ];
  }

  if (connectionType === 'io') {
    // Digital GPIO - return all available pins
    const gpioPins = getUsableGPIOPins();
    return gpioPins
      .filter((pin) => !usedPins.includes(pin.bcm))
      .map((pin) => ({
        value: pin.bcm,
        label: `GPIO ${pin.bcm}`,
        description: `Physical Pin ${pin.physical}${pin.description ? ` - ${pin.description}` : ''}`,
      }));
  }

  // ADC not supported on GPIO Board
  return [];
}

/**
 * Get available channel options for Custom Board
 */
export function getCustomBoardOptions(
  connectionType: SensorConnectionType,
  usedChannels: number[]
): PinOption[] {
  const channels: PinOption[] = [];

  for (let i = 1; i <= 8; i++) {
    const isUsed = usedChannels.includes(i);

    let description = '';
    if (connectionType === 'i2c') {
      description = 'I2C capable';
    } else if (connectionType === 'adc') {
      description = 'Analog input with ADC';
    } else if (connectionType === 'io') {
      description = 'Digital GPIO';
    }

    channels.push({
      value: i,
      label: `Channel ${i}`,
      description,
      disabled: isUsed,
    });
  }

  return channels;
}

/**
 * Validate sensor configuration
 */
export interface SensorConfigValidation {
  valid: boolean;
  error?: string;
}

export function validateSensorConfig(
  boardType: 'GPIO' | 'CUSTOM',
  connectionType: SensorConnectionType,
  pin?: number
): SensorConfigValidation {
  // Check if ADC on GPIO Board
  if (boardType === 'GPIO' && connectionType === 'adc') {
    return {
      valid: false,
      error: 'ADC sensors are only supported on Custom Board',
    };
  }

  // Check if pin is provided
  if (pin === undefined || pin === null) {
    return {
      valid: false,
      error: boardType === 'GPIO' ? 'Please select a GPIO pin' : 'Please select a channel',
    };
  }

  // Validate pin range for Custom Board
  if (boardType === 'CUSTOM' && (pin < 1 || pin > 8)) {
    return {
      valid: false,
      error: 'Channel must be between 1 and 8',
    };
  }

  return { valid: true };
}
