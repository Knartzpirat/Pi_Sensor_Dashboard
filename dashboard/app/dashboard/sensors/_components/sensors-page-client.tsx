'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Cable, Power, PowerOff, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AddSensorDrawer } from '@/components/add-sensor-drawer';
import { EditSensorDrawer } from '@/components/edit-sensor-drawer';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from '@/components/ui/context-menu';
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

import type { BoardType } from '@/types/hardware';

interface Sensor {
  id: string;
  name: string;
  driver: string;
  connectionType: string;
  pin: number | null;
  enabled: boolean;
  entities: Array<{
    id: string;
    name: string;
    unit: string;
    type: string;
  }>;
}

interface SensorsPageClientProps {
  initialSensors: Sensor[];
  boardType: BoardType;
}

export function SensorsPageClient({ initialSensors, boardType }: SensorsPageClientProps) {
  const t = useTranslations();
  const tSensors = useTranslations('sensors');
  const tCommon = useTranslations('common');

  const [sensors, setSensors] = React.useState<Sensor[]>(initialSensors);
  const [sensorToDelete, setSensorToDelete] = React.useState<Sensor | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [sensorToEdit, setSensorToEdit] = React.useState<Sensor | null>(null);

  // Get list of used pins/channels
  const usedPins = React.useMemo(() => {
    return sensors
      .filter((s) => s.pin !== null && s.pin !== undefined)
      .map((s) => s.pin as number);
  }, [sensors]);

  const handleSensorAdded = async () => {
    // Reload sensors list
    const response = await fetch('/api/sensors');
    const data = await response.json();
    setSensors(data.sensors || []);
  };

  const handleToggleEnabled = async (sensorId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/sensors/${sensorId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      });

      if (response.ok) {
        setSensors((prev) =>
          prev.map((s) => (s.id === sensorId ? { ...s, enabled } : s))
        );
      }
    } catch (error) {
      console.error('Error updating sensor:', error);
    }
  };

  const handleEdit = (sensor: Sensor) => {
    setSensorToEdit(sensor);
  };

  const handleDeleteClick = (sensor: Sensor) => {
    setSensorToDelete(sensor);
  };

  const handleDeleteConfirm = async () => {
    if (!sensorToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/sensors/${sensorToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete sensor');
      }

      setSensors((prev) => prev.filter((s) => s.id !== sensorToDelete.id));
      toast.success(tSensors('sensorDeleted'));
      setSensorToDelete(null);
    } catch (error) {
      console.error('Error deleting sensor:', error);
      toast.error(tSensors('deleteSensorError'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('sidebar.pages.sensors')}
          </h1>
          <p className="text-muted-foreground">
            Manage your connected sensors
          </p>
        </div>
        <AddSensorDrawer
          boardType={boardType}
          usedPins={usedPins}
          onSensorAdded={handleSensorAdded}
        />
      </div>

      {/* Board Info */}
      <Card>
        <CardHeader>
          <CardTitle>Hardware Configuration</CardTitle>
          <CardDescription>
            Current board: <strong>{boardType === 'GPIO' ? 'Raspberry Pi GPIO' : 'Custom Board'}</strong>
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Sensors List */}
      {sensors.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Cable className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No sensors configured</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first sensor to start collecting data
            </p>
            <AddSensorDrawer
              boardType={boardType}
              usedPins={usedPins}
              onSensorAdded={handleSensorAdded}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sensors.map((sensor) => (
            <ContextMenu key={sensor.id}>
              <ContextMenuTrigger>
                <Card className="cursor-context-menu">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{sensor.name}</CardTitle>
                        <CardDescription>{sensor.driver}</CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleEnabled(sensor.id, !sensor.enabled)}
                      >
                        {sensor.enabled ? (
                          <Power className="h-4 w-4 text-green-500" />
                        ) : (
                          <PowerOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Connection Info */}
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <Badge variant="outline">
                          {tSensors(`connectionTypes.${sensor.connectionType}`)}
                        </Badge>
                        {sensor.pin && (
                          <Badge variant="secondary">
                            {boardType === 'GPIO'
                              ? `GPIO ${sensor.pin}`
                              : `Channel ${sensor.pin}`}
                          </Badge>
                        )}
                        {sensor.enabled ? (
                          <Badge variant="default">Active</Badge>
                        ) : (
                          <Badge variant="secondary">Disabled</Badge>
                        )}
                      </div>

                      {/* Entities */}
                      {sensor.entities.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-muted-foreground mb-1">
                            Measurements:
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {sensor.entities.map((entity) => (
                              <Badge key={entity.id} variant="outline" className="text-xs">
                                {entity.name} ({entity.unit})
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem onClick={() => handleEdit(sensor)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  {tCommon('edit')}
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => handleDeleteClick(sensor)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {tCommon('delete')}
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))}
        </div>
      )}

      {/* Edit Sensor Drawer */}
      <EditSensorDrawer
        sensor={sensorToEdit}
        boardType={boardType}
        usedPins={usedPins}
        open={!!sensorToEdit}
        onOpenChange={(open) => !open && setSensorToEdit(null)}
        onSensorUpdated={handleSensorAdded}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!sensorToDelete} onOpenChange={() => !isDeleting && setSensorToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{tSensors('deleteSensorTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {tSensors('deleteSensorDescription', { name: sensorToDelete?.name || '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{tCommon('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? tCommon('loading') : tCommon('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
