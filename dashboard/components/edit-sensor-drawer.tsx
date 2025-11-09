'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle } from 'lucide-react';

import type { BoardType } from '@/types/hardware';
import type { SensorConnectionType } from '@/types/sensor';
import { getGPIOBoardOptions, getCustomBoardOptions, type PinOption } from '@/lib/sensor-config';

interface Sensor {
  id: string;
  name: string;
  driver: string;
  connectionType: string;
  pin?: number;
  enabled: boolean;
  entities: Array<{
    id: string;
    name: string;
    unit: string;
    type: string;
  }>;
}

interface EditSensorDrawerProps {
  sensor: Sensor | null;
  boardType: BoardType;
  usedPins: number[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSensorUpdated?: () => void;
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

export function EditSensorDrawer({ sensor, boardType, usedPins, open, onOpenChange, onSensorUpdated }: EditSensorDrawerProps) {
  const tSensors = useTranslations('sensors');
  const tCommon = useTranslations('common');

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [supportedSensors, setSupportedSensors] = React.useState<SupportedSensor[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);

  // Form state
  const [name, setName] = React.useState('');
  const [driver, setDriver] = React.useState('');
  const [connectionType, setConnectionType] = React.useState<SensorConnectionType | ''>('');
  const [pin, setPin] = React.useState<number | undefined>(undefined);
  const [i2cAddress, setI2cAddress] = React.useState('0x76');

  // Track original values
  const [originalDriver, setOriginalDriver] = React.useState('');

  // Load supported sensors from backend
  React.useEffect(() => {
    const loadSupportedSensors = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
        const response = await fetch(`${backendUrl}/sensors/supported?board_type=${boardType}`);
        const data = await response.json();
        setSupportedSensors(data.sensors || []);
      } catch (error) {
        console.error('Failed to load supported sensors:', error);
        setSupportedSensors([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadSupportedSensors();
  }, [boardType]);

  // Update form when sensor changes
  React.useEffect(() => {
    if (sensor) {
      setName(sensor.name);
      setDriver(sensor.driver);
      setOriginalDriver(sensor.driver);
      setConnectionType(sensor.connectionType as SensorConnectionType);
      setPin(sensor.pin);
    }
  }, [sensor]);

  // Filter available drivers based on board type
  const availableDrivers = React.useMemo(() => {
    return supportedSensors.filter((s) =>
      s.supportsBoards.includes(boardType)
    );
  }, [supportedSensors, boardType]);

  // Get available pins/channels (excluding current sensor's pin)
  const pinOptions = React.useMemo((): PinOption[] => {
    if (!connectionType) return [];

    // Filter out used pins, but include the current sensor's pin
    const availablePins = usedPins.filter(p => p !== sensor?.pin);

    if (boardType === 'GPIO') {
      return getGPIOBoardOptions(connectionType, availablePins);
    } else {
      return getCustomBoardOptions(connectionType, availablePins);
    }
  }, [boardType, connectionType, usedPins, sensor]);

  // Auto-select connection type when driver is selected
  const handleDriverChange = (value: string) => {
    setDriver(value);
    const selectedSensor = supportedSensors.find((s) => s.driverName === value);
    if (selectedSensor && selectedSensor.connectionTypes.length > 0) {
      setConnectionType(selectedSensor.connectionTypes[0] as SensorConnectionType);
      setPin(undefined); // Reset pin selection
    }
  };

  const handleSaveClick = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmDialog(true);
  };

  const handleConfirmSave = async () => {
    if (!sensor) return;

    setIsSubmitting(true);
    setShowConfirmDialog(false);

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
        connectionParams.i2c_address = i2cAddress;
      }

      // Update sensor
      const response = await fetch(`/api/sensors/${sensor.id}`, {
        method: 'PATCH',
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
        throw new Error(error.error || 'Failed to update sensor');
      }

      toast.success(tSensors('sensorUpdated'));
      onOpenChange(false);
      onSensorUpdated?.();
    } catch (error) {
      console.error('Error updating sensor:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update sensor');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!sensor) return null;

  const driverChanged = driver !== originalDriver;

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <form onSubmit={handleSaveClick}>
            <DrawerHeader>
              <DrawerTitle>{tSensors('editSensor')}</DrawerTitle>
              <DrawerDescription>{tSensors('editSensorDescription')}</DrawerDescription>
            </DrawerHeader>

            <div className="p-4 space-y-4 max-w-2xl mx-auto">
              {/* Sensor Name */}
              <div className="space-y-2">
                <Label htmlFor="edit-name">{tSensors('sensorName')}</Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Living Room Sensor"
                  required
                />
              </div>

              {/* Sensor Driver */}
              <div className="space-y-2">
                <Label htmlFor="edit-driver">{tSensors('sensorType')}</Label>
                <Select value={driver} onValueChange={handleDriverChange} disabled={isLoading}>
                  <SelectTrigger id="edit-driver">
                    <SelectValue placeholder={isLoading ? 'Loading sensors...' : tSensors('selectSensorType')}>
                      {driver && availableDrivers.find(s => s.driverName === driver)?.displayName}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {availableDrivers.map((s) => (
                      <SelectItem key={s.driverName} value={s.driverName} className="py-3">
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{s.displayName}</span>
                          <span className="text-xs text-muted-foreground leading-relaxed">{s.description}</span>
                          <span className="text-xs text-muted-foreground leading-relaxed">
                            {s.entities.map((e) => e.name).join(', ')}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Driver Change Warning */}
              {driverChanged && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {tSensors('driverChangeWarning')}
                  </AlertDescription>
                </Alert>
              )}

              {/* Connection Type (read-only, auto-selected) */}
              {connectionType && (
                <div className="space-y-2">
                  <Label>{tSensors('connectionType')}</Label>
                  <div className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
                    {tSensors(`connectionTypes.${connectionType}`)} - {tSensors(`connectionTypes.${connectionType}Description`)}
                  </div>
                </div>
              )}

              {/* Pin/Channel Selection */}
              {connectionType && pinOptions.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="edit-pin">
                    {boardType === 'GPIO' ? tSensors('selectPin') : tSensors('selectChannel')}
                  </Label>
                  <Select value={pin?.toString()} onValueChange={(v) => setPin(parseInt(v))}>
                    <SelectTrigger id="edit-pin">
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
                  <Label htmlFor="edit-i2cAddress">{tSensors('i2cAddress')}</Label>
                  <Input
                    id="edit-i2cAddress"
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
                {isSubmitting ? tCommon('loading') : tCommon('save')}
              </Button>
              <DrawerClose asChild>
                <Button variant="outline">{tCommon('cancel')}</Button>
              </DrawerClose>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tSensors('confirmSaveTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {driverChanged ? (
                <div className="space-y-2">
                  <p>{tSensors('confirmSaveDescriptionWithDriverChange')}</p>
                  <Alert variant="destructive" className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      {tSensors('driverChangeWarningDetailed')}
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                tSensors('confirmSaveDescription')
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSave} disabled={isSubmitting}>
              {isSubmitting ? tCommon('loading') : tCommon('save')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
