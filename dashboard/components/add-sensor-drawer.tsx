'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { env } from '@/lib/env';

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
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Grid2x2Plus } from 'lucide-react';

import type { BoardType } from '@/types/hardware';
import type { SensorConnectionType } from '@/types/sensor';
import { getSupportedConnectionTypes } from '@/types/sensor';
import { getGPIOBoardOptions, getCustomBoardOptions, type PinOption } from '@/lib/sensor-config';

interface AddSensorDrawerProps {
  boardType: BoardType;
  usedPins: number[]; // Already used pins/channels
  onSensorAdded?: () => void;
}

interface SupportedSensor {
  driverName: string;
  displayName: string;
  description: string;
  category: string;
  connectionTypes: string[];
  entities: Array<{
    name: string;
    unit: string;
    type: string;
    precision: number;
  }>;
  requiresCalibration: boolean;
  minPollInterval: number;
  supportsBoards: string[];
}

export function AddSensorDrawer({ boardType, usedPins, onSensorAdded }: AddSensorDrawerProps) {
  const t = useTranslations();
  const tSensors = useTranslations('sensors');
  const tCommon = useTranslations('common');

  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [supportedSensors, setSupportedSensors] = React.useState<SupportedSensor[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // Form state
  const [name, setName] = React.useState('');
  const [driver, setDriver] = React.useState('');
  const [connectionType, setConnectionType] = React.useState<SensorConnectionType | ''>('');
  const [pin, setPin] = React.useState<number | undefined>(undefined);
  const [i2cAddress, setI2cAddress] = React.useState('0x76'); // Default for BMP280

  // Load supported sensors from backend
  React.useEffect(() => {
    const loadSupportedSensors = async () => {
      try {
        const response = await fetch(`${env.clientBackendUrl}/sensors/supported?board_type=${boardType}`);
        if (!response.ok) throw new Error('Backend not available');
        const data = await response.json();
        setSupportedSensors(data.sensors || []);
      } catch (error) {
        console.warn('Backend not available, using manual driver input:', error);
        // Backend not available - user can enter driver manually
        setSupportedSensors([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadSupportedSensors();
  }, [boardType]);

  // Get supported connection types for current board
  const supportedConnectionTypes = React.useMemo(
    () => getSupportedConnectionTypes(boardType),
    [boardType]
  );

  // Filter available drivers based on board type
  const availableDrivers = React.useMemo(() => {
    return supportedSensors.filter((sensor) =>
      sensor.supportsBoards.includes(boardType)
    );
  }, [supportedSensors, boardType]);

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
    const selectedSensor = supportedSensors.find((s) => s.driverName === value);
    if (selectedSensor && selectedSensor.connectionTypes.length > 0) {
      setConnectionType(selectedSensor.connectionTypes[0] as SensorConnectionType);
      setPin(undefined); // Reset pin selection
    }
  };

  // Manual driver input change
  const handleManualDriverChange = (value: string) => {
    setDriver(value);
    // Don't auto-select connection type for manual input
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
      const connectionParams: Record<string, string> = {};
      if (connectionType === 'i2c' && boardType === 'GPIO') {
        // Only GPIO Board needs I2C address, Custom Board uses TCA9548A multiplexer
        connectionParams.i2c_address = i2cAddress;
      }

      // Get poll interval from selected sensor metadata
      const selectedSensor = supportedSensors.find((s) => s.driverName === driver);
      // Backend sends minPollInterval in seconds, convert to milliseconds
      const pollIntervalSeconds = selectedSensor?.minPollInterval || 1;
      const pollInterval = pollIntervalSeconds * 1000; // Convert to milliseconds

      // Prepare request body - only include defined values
      const requestBody: Record<string, unknown> = {
        name,
        driver,
        connectionType,
        boardType: String(boardType),
        pollInterval,
        enabled: true,
      };

      if (pin !== undefined && pin !== null) {
        requestBody.pin = pin;
      }

      if (Object.keys(connectionParams).length > 0) {
        requestBody.connectionParams = connectionParams;
      }

      // Create sensor
      const response = await fetch('/api/sensors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        try {
          const error = JSON.parse(errorText);
          throw new Error(error.error || 'Failed to create sensor');
        } catch {
          throw new Error(`Failed to create sensor: ${errorText}`);
        }
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
    <Tooltip>
      <Drawer open={open} onOpenChange={setOpen}>
        <TooltipTrigger asChild>
          <DrawerTrigger asChild>
            <Button
              size="icon"
              className="size-8 group-data-[collapsible=icon]:opacity-0"
              variant="outline"
            >
              <Grid2x2Plus />
              <span className="sr-only">{t('buttons.addsensor')}</span>
            </Button>
          </DrawerTrigger>
        </TooltipTrigger>
        <TooltipContent>{t('buttons.addsensor')}</TooltipContent>
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
              <Select value={driver} onValueChange={handleDriverChange} disabled={isLoading}>
                <SelectTrigger id="driver">
                  <SelectValue placeholder={isLoading ? 'Loading sensors...' : tSensors('selectSensorType')}>
                    {driver && availableDrivers.find(s => s.driverName === driver)?.displayName}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {availableDrivers.map((sensor) => (
                    <SelectItem key={sensor.driverName} value={sensor.driverName} className="py-3">
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{sensor.displayName}</span>
                        <span className="text-xs text-muted-foreground leading-relaxed">{sensor.description}</span>
                        <span className="text-xs text-muted-foreground leading-relaxed">
                          {sensor.entities.map((e) => e.name).join(', ')}
                        </span>
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
                <Select value={pin?.toString() || ''} onValueChange={(v) => setPin(parseInt(v))}>
                  <SelectTrigger id="pin">
                    <SelectValue placeholder={boardType === 'GPIO' ? tSensors('selectPin') : tSensors('selectChannel')}>
                      {pin !== undefined && pinOptions.find(o => o.value === pin)?.label}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {pinOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()} disabled={option.disabled} className="py-3">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{option.label}</span>
                          {option.description && (
                            <span className="text-xs text-muted-foreground leading-relaxed">{option.description}</span>
                          )}
                          {option.disabled && (
                            <span className="text-xs text-destructive leading-relaxed">
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

            {/* I2C Address (only for I2C sensors on GPIO Board) */}
            {connectionType === 'i2c' && boardType === 'GPIO' && (
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

            {/* I2C Multiplexer info for Custom Board */}
            {connectionType === 'i2c' && boardType === 'CUSTOM' && (
              <Alert>
                <AlertDescription>{tSensors('i2cMultiplexerInfo')}</AlertDescription>
              </Alert>
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
    </Tooltip>
  );
}
