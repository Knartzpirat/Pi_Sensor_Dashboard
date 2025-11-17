'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Check, ChevronsUpDown, Clock, Beaker, FileText, Timer, FlaskConical } from 'lucide-react';

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
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface SensorEntity {
  id: string;
  name: string;
  unit: string;
  type: string;
}

interface Sensor {
  id: string;
  name: string;
  driver: string;
  enabled: boolean;
  entities: SensorEntity[];
}

interface TestObject {
  id: string;
  title: string;
  description?: string;
}

interface StartMeasurementDrawerProps {
  trigger: React.ReactNode;
  onMeasurementStarted?: () => void;
}

export function StartMeasurementDrawer({ trigger, onMeasurementStarted }: StartMeasurementDrawerProps) {
  const t = useTranslations('measurements');
  const tCommon = useTranslations('common');

  const [open, setOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [sensors, setSensors] = React.useState<Sensor[]>([]);
  const [testObjects, setTestObjects] = React.useState<TestObject[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  // Track which sensor's test object combobox is open (sensorId or null)
  const [openComboboxSensorId, setOpenComboboxSensorId] = React.useState<string | null>(null);

  // Form state
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [duration, setDuration] = React.useState('60');
  const [durationUnit, setDurationUnit] = React.useState<'seconds' | 'minutes' | 'hours'>('minutes');
  const [interval, setInterval] = React.useState('1.0');
  const [selectedSensors, setSelectedSensors] = React.useState<Set<string>>(new Set());
  // Map of sensorId -> testObjectId for per-sensor test object assignment
  const [sensorTestObjects, setSensorTestObjects] = React.useState<Map<string, string>>(new Map());

  // Load sensors and test objects when drawer opens
  React.useEffect(() => {
    if (open) {
      // Reset state first
      setSensors([]);
      setTestObjects([]);
      setSelectedSensors(new Set());
      // Then load fresh data
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load both in parallel
      const [sensorsResponse, testObjectsResponse] = await Promise.all([
        fetch('/api/sensors'),
        fetch('/api/test-objects'),
      ]);

      const sensorsData = await sensorsResponse.json();
      const testObjectsData = await testObjectsResponse.json();

      // Process sensors
      if (sensorsData.sensors) {
        const enabledSensors = sensorsData.sensors.filter((s: Sensor) => s.enabled);
        setSensors(enabledSensors);

        // Pre-select all sensors
        const allSensorIds = new Set(enabledSensors.map((s: Sensor) => s.id));
        setSelectedSensors(allSensorIds);
      }

      // Process test objects
      // API returns array directly, not wrapped in { testObjects: [...] }
      if (Array.isArray(testObjectsData)) {
        setTestObjects(testObjectsData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load sensors and test objects');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDuration('60');
    setDurationUnit('minutes');
    setInterval('1.0');
    setSelectedSensors(new Set());
    setSensorTestObjects(new Map());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!title.trim()) {
      toast.error(t('validation.titleRequired'));
      return;
    }

    const durationValue = parseFloat(duration);
    if (!duration || isNaN(durationValue) || durationValue <= 0) {
      toast.error(t('validation.durationRequired'));
      return;
    }

    const intervalValue = parseFloat(interval);
    if (!interval || isNaN(intervalValue) || intervalValue <= 0) {
      toast.error(t('validation.intervalRequired'));
      return;
    }

    if (selectedSensors.size === 0) {
      toast.error(t('validation.sensorsRequired'));
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert duration to seconds
      let durationInSeconds = durationValue;
      if (durationUnit === 'minutes') {
        durationInSeconds = durationValue * 60;
      } else if (durationUnit === 'hours') {
        durationInSeconds = durationValue * 3600;
      }

      // Prepare measurement data with sensor-testObject mapping
      const sensorMappings = Array.from(selectedSensors).map((sensorId) => ({
        sensorId,
        testObjectId: sensorTestObjects.get(sensorId) || null,
      }));

      const measurementData = {
        title: title.trim(),
        description: description.trim() || undefined,
        duration: durationInSeconds,
        interval: intervalValue,
        sensors: sensorMappings,
      };

      // Start measurement via API
      const response = await fetch('/api/measurements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(measurementData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start measurement');
      }

      const result = await response.json();

      toast.success(t('success'));

      // Call callback and wait for it to complete BEFORE closing drawer
      if (onMeasurementStarted) {
        await onMeasurementStarted();
      }

      setOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error starting measurement:', error);
      toast.error(error instanceof Error ? error.message : t('error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSensor = (sensorId: string) => {
    setSelectedSensors((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sensorId)) {
        newSet.delete(sensorId);
      } else {
        newSet.add(sensorId);
      }
      return newSet;
    });
  };

  const selectAllSensors = () => {
    setSelectedSensors(new Set(sensors.map((s) => s.id)));
  };

  const deselectAllSensors = () => {
    setSelectedSensors(new Set());
  };

  const handleSensorTestObjectChange = (sensorId: string, testObjectId: string) => {
    setSensorTestObjects((prev) => {
      const newMap = new Map(prev);
      if (testObjectId === '') {
        newMap.delete(sensorId);
      } else {
        newMap.set(sensorId, testObjectId);
      }
      return newMap;
    });
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        {trigger}
      </DrawerTrigger>
      <DrawerContent className="max-h-[95vh] flex flex-col">
        <DrawerHeader className="border-b flex-shrink-0">
          <DrawerTitle className="flex items-center gap-2 text-xl">
            <Beaker className="h-5 w-5" />
            {t('startMeasurement')}
          </DrawerTitle>
          <DrawerDescription>{t('startMeasurementDescription')}</DrawerDescription>
        </DrawerHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex-1 overflow-y-auto px-6">
            <div className="space-y-8 py-6">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  <FileText className="h-4 w-4" />
                  <span>{t('basicInfo')}</span>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-base">
                    {t('measurementTitle')} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t('measurementTitlePlaceholder')}
                    required
                    className="h-11"
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-base">
                    {t('measurementDescription')}
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('measurementDescriptionPlaceholder')}
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </div>

              <Separator />

              {/* Timing Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  <Clock className="h-4 w-4" />
                  <span>{t('timeSettings')}</span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Duration */}
                  <div className="space-y-2">
                    <Label htmlFor="duration" className="text-base">
                      {t('duration')} <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="duration"
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        placeholder={t('durationPlaceholder')}
                        className="flex-1 h-11"
                        required
                      />
                      <Select value={durationUnit} onValueChange={(value: 'seconds' | 'minutes' | 'hours') => setDurationUnit(value)}>
                        <SelectTrigger className="w-[130px] h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="seconds">{t('timeUnits.seconds')}</SelectItem>
                          <SelectItem value="minutes">{t('timeUnits.minutes')}</SelectItem>
                          <SelectItem value="hours">{t('timeUnits.hours')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Interval */}
                  <div className="space-y-2">
                    <Label htmlFor="interval" className="text-base">
                      {t('interval')} <span className="text-destructive">*</span>
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="interval"
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={interval}
                        onChange={(e) => setInterval(e.target.value)}
                        placeholder={t('intervalPlaceholder')}
                        className="flex-1 h-11"
                        required
                      />
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {t('intervalSeconds')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Sensor Selection Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    <Timer className="h-4 w-4" />
                    <span>{t('selectSensors')}</span>
                    <span className="text-destructive">*</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={selectAllSensors}
                      className="h-8"
                    >
                      {tCommon('selectAll')}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={deselectAllSensors}
                      className="h-8"
                    >
                      {tCommon('clear')}
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{t('selectSensorsDescription')}</p>

                {isLoading ? (
                  <div className="flex items-center justify-center py-12 border rounded-lg bg-muted/30">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                      <p className="text-sm text-muted-foreground">{tCommon('loading')}</p>
                    </div>
                  </div>
                ) : sensors.length === 0 ? (
                  <div className="flex items-center justify-center py-12 border rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground">{t('noSensorsAvailable')}</p>
                  </div>
                ) : (
                  <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
                    {sensors.map((sensor) => (
                      <div
                        key={sensor.id}
                        className={cn(
                          'space-y-3 rounded-lg border bg-background p-4 transition-colors',
                          selectedSensors.has(sensor.id) && 'border-primary/50 bg-primary/5'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            id={`sensor-${sensor.id}`}
                            checked={selectedSensors.has(sensor.id)}
                            onCheckedChange={() => toggleSensor(sensor.id)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 space-y-1">
                            <Label
                              htmlFor={`sensor-${sensor.id}`}
                              className="text-base font-semibold cursor-pointer leading-none"
                            >
                              {sensor.name}
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              {t('driver')}: <span className="font-mono">{sensor.driver}</span>
                            </p>
                          </div>
                        </div>

                        {/* Test Object Selection for this sensor */}
                        <div className="ml-7 space-y-2">
                          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                            <FlaskConical className="h-3 w-3" />
                            {t('testObject')}
                          </Label>
                          <Popover
                            open={openComboboxSensorId === sensor.id}
                            onOpenChange={(isOpen) => setOpenComboboxSensorId(isOpen ? sensor.id : null)}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openComboboxSensorId === sensor.id}
                                className="w-full justify-between h-9 text-sm"
                                type="button"
                              >
                                {sensorTestObjects.get(sensor.id) ? (
                                  <span className="truncate">
                                    {testObjects.find((obj) => obj.id === sensorTestObjects.get(sensor.id))?.title}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">{t('noTestObject')}</span>
                                )}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[350px] p-0" align="start">
                              <Command>
                                <CommandInput placeholder={tCommon('search')} />
                                <CommandList>
                                  <CommandEmpty>{t('noTestObjects')}</CommandEmpty>
                                  <CommandGroup>
                                    {/* None option */}
                                    <CommandItem
                                      value=""
                                      onSelect={() => {
                                        handleSensorTestObjectChange(sensor.id, '');
                                        setOpenComboboxSensorId(null);
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          'mr-2 h-4 w-4',
                                          !sensorTestObjects.get(sensor.id) ? 'opacity-100' : 'opacity-0'
                                        )}
                                      />
                                      <span className="text-muted-foreground italic">{t('noTestObject')}</span>
                                    </CommandItem>
                                    {testObjects.map((obj) => (
                                      <CommandItem
                                        key={obj.id}
                                        value={obj.title}
                                        onSelect={() => {
                                          handleSensorTestObjectChange(sensor.id, obj.id);
                                          setOpenComboboxSensorId(null);
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            'mr-2 h-4 w-4',
                                            sensorTestObjects.get(sensor.id) === obj.id ? 'opacity-100' : 'opacity-0'
                                          )}
                                        />
                                        <div className="flex flex-col">
                                          <span>{obj.title}</span>
                                          {obj.description && (
                                            <span className="text-xs text-muted-foreground truncate">
                                              {obj.description}
                                            </span>
                                          )}
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>

                        {sensor.entities.length > 0 && (
                          <div className="ml-7 space-y-1">
                            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              {t('entities')} ({sensor.entities.length})
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {sensor.entities.map((entity) => (
                                <div
                                  key={entity.id}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-muted text-xs font-medium"
                                >
                                  <span>{entity.name}</span>
                                  <span className="text-muted-foreground">({entity.unit})</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {selectedSensors.size > 0 && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary" />
                    <span>
                      {selectedSensors.size} {selectedSensors.size === 1 ? t('sensor') : t('sensors')}{' '}
                      {t('selected')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DrawerFooter className="border-t bg-muted/30 flex-shrink-0">
            <div className="flex gap-3 w-full">
              <DrawerClose asChild>
                <Button type="button" variant="outline" className="flex-1 h-11">
                  {t('cancel')}
                </Button>
              </DrawerClose>
              <Button
                type="submit"
                className="flex-1 h-11"
                disabled={isSubmitting || selectedSensors.size === 0}
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    <span>{tCommon('loading')}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Beaker className="h-4 w-4" />
                    <span>{t('startButton')}</span>
                  </div>
                )}
              </Button>
            </div>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
