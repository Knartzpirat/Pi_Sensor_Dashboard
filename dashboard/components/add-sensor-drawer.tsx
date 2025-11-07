'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

import type { BoardType } from '@/types/hardware';
import type { SensorConnectionType } from '@/types/sensor';
import { getSupportedConnectionTypes } from '@/types/sensor';
import { getGPIOBoardOptions, getCustomBoardOptions, type PinOption } from '@/lib/sensor-config';

interface AddSensorDrawerProps {
  boardType: BoardType;
  usedPins: number[]; // Already used pins/channels
  onSensorAdded?: () => void;
}

// Available sensor drivers
const SENSOR_DRIVERS = [
  { value: 'DHT22', label: 'DHT22', connectionType: 'io' as SensorConnectionType, description: 'Temperature & Humidity' },
  { value: 'DHT11', label: 'DHT11', connectionType: 'io' as SensorConnectionType, description: 'Temperature & Humidity' },
  { value: 'BMP280', label: 'BMP280', connectionType: 'i2c' as SensorConnectionType, description: 'Pressure & Temperature' },
  { value: 'BME280', label: 'BME280', connectionType: 'i2c' as SensorConnectionType, description: 'Pressure, Temp & Humidity' },
  { value: 'ADS1115', label: 'ADS1115', connectionType: 'i2c' as SensorConnectionType, description: '16-bit ADC' },
  { value: 'Analog', label: 'Analog Sensor', connectionType: 'adc' as SensorConnectionType, description: 'Generic analog sensor' },
];

export function AddSensorDrawer({ boardType, usedPins, onSensorAdded }: AddSensorDrawerProps) {
  const t = useTranslations();
  const tSensors = useTranslations('sensors');
  const tCommon = useTranslations('common');

  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Form state
  const [name, setName] = React.useState('');
  const [driver, setDriver] = React.useState('');
  const [connectionType, setConnectionType] = React.useState<SensorConnectionType | ''>('');
  const [pin, setPin] = React.useState<number | undefined>(undefined);
  const [i2cAddress, setI2cAddress] = React.useState('0x76'); // Default for BMP280

  // Get supported connection types for current board
  const supportedConnectionTypes = React.useMemo(
    () => getSupportedConnectionTypes(boardType),
    [boardType]
  );

  // Filter available drivers based on board type
  const availableDrivers = React.useMemo(() => {
    return SENSOR_DRIVERS.filter((d) => supportedConnectionTypes.includes(d.connectionType));
  }, [supportedConnectionTypes]);

  // Get available pins/channels
  const pinOptions = React.useMemo((): PinOption[] => {
    if (!connectionType) return [];

    if (boardType === 'GPIO') {
      return getGPIOBoardOptions(connectionType, usedPins);
    } else {
      return getCustomBoardOptions(connectionType, usedPins);
    }
  }, [boardType, connectionType, usedPins]);

  // Auto-select connection type when driver is selected
  const handleDriverChange = (value: string) => {
    setDriver(value);
    const selectedDriver = SENSOR_DRIVERS.find((d) => d.value === value);
    if (selectedDriver) {
      setConnectionType(selectedDriver.connectionType);
      setPin(undefined); // Reset pin selection
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Validation
      if (!name || !driver || !connectionType) {
        toast.error('Please fill in all required fields');
        return;
      }

      if (pin === undefined) {
        toast.error(boardType === 'GPIO' ? tSensors('selectPin') : tSensors('selectChannel'));
        return;
      }

      // Prepare connection params
      const connectionParams: any = {};
      if (connectionType === 'i2c') {
        connectionParams.i2c_address = i2cAddress;
      }

      // Create sensor
      const response = await fetch('/api/sensors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          driver,
          connectionType,
          pin,
          connectionParams: Object.keys(connectionParams).length > 0 ? connectionParams : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create sensor');
      }

      toast.success('Sensor added successfully');
      setOpen(false);
      onSensorAdded?.();

      // Reset form
      setName('');
      setDriver('');
      setConnectionType('');
      setPin(undefined);
      setI2cAddress('0x76');
    } catch (error) {
      console.error('Error creating sensor:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add sensor');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          {tSensors('addSensor')}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <form onSubmit={handleSubmit}>
          <DrawerHeader>
            <DrawerTitle>{tSensors('addSensor')}</DrawerTitle>
            <DrawerDescription>{tSensors('addSensorDescription')}</DrawerDescription>
          </DrawerHeader>

          <div className="p-4 space-y-4 max-w-2xl mx-auto">
            {/* Sensor Name */}
            <div className="space-y-2">
              <Label htmlFor="name">{tSensors('sensorName')}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Living Room Sensor"
                required
              />
            </div>

            {/* Sensor Driver */}
            <div className="space-y-2">
              <Label htmlFor="driver">{tSensors('sensorType')}</Label>
              <Select value={driver} onValueChange={handleDriverChange}>
                <SelectTrigger id="driver">
                  <SelectValue placeholder={tSensors('selectSensorType')} />
                </SelectTrigger>
                <SelectContent>
                  {availableDrivers.map((d) => (
                    <SelectItem key={d.value} value={d.value}>
                      <div className="flex flex-col">
                        <span>{d.label}</span>
                        <span className="text-xs text-muted-foreground">{d.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Connection Type (read-only, auto-selected) */}
            {connectionType && (
              <div className="space-y-2">
                <Label>{tSensors('connectionType')}</Label>
                <div className="text-sm text-muted-foreground">
                  {tSensors(`connectionTypes.${connectionType}`)} - {tSensors(`connectionTypes.${connectionType}Description`)}
                </div>
              </div>
            )}

            {/* Pin/Channel Selection */}
            {connectionType && pinOptions.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="pin">
                  {boardType === 'GPIO' ? tSensors('selectPin') : tSensors('selectChannel')}
                </Label>
                <Select value={pin?.toString()} onValueChange={(v) => setPin(parseInt(v))}>
                  <SelectTrigger id="pin">
                    <SelectValue placeholder={boardType === 'GPIO' ? tSensors('selectPin') : tSensors('selectChannel')} />
                  </SelectTrigger>
                  <SelectContent>
                    {pinOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()} disabled={option.disabled}>
                        <div className="flex flex-col">
                          <span>{option.label}</span>
                          {option.description && (
                            <span className="text-xs text-muted-foreground">{option.description}</span>
                          )}
                          {option.disabled && (
                            <span className="text-xs text-destructive">
                              {boardType === 'GPIO' ? tSensors('pinInUse') : tSensors('channelInUse')}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* I2C Address (only for I2C sensors) */}
            {connectionType === 'i2c' && (
              <div className="space-y-2">
                <Label htmlFor="i2cAddress">{tSensors('i2cAddress')}</Label>
                <Input
                  id="i2cAddress"
                  value={i2cAddress}
                  onChange={(e) => setI2cAddress(e.target.value)}
                  placeholder="0x76"
                />
                <p className="text-xs text-muted-foreground">{tSensors('i2cAddressDescription')}</p>
              </div>
            )}

            {/* Warning for no available pins */}
            {connectionType && pinOptions.length === 0 && (
              <Alert>
                <AlertDescription>{tSensors('noAvailablePins')}</AlertDescription>
              </Alert>
            )}

            {/* ADC not supported warning */}
            {connectionType === 'adc' && boardType === 'GPIO' && (
              <Alert variant="destructive">
                <AlertDescription>{tSensors('adcNotSupported')}</AlertDescription>
              </Alert>
            )}
          </div>

          <DrawerFooter>
            <Button type="submit" disabled={isSubmitting || !name || !driver || !connectionType || pin === undefined}>
              {isSubmitting ? tCommon('loading') : tSensors('addSensor')}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">{tCommon('cancel')}</Button>
            </DrawerClose>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
