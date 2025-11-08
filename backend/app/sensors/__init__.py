"""
Sensor Drivers Package

Provides access to all sensor drivers and the sensor registry.
"""

from .base import BaseSensorDriver, SensorMetadata, EntityMetadata
from .registry import (
    DRIVER_REGISTRY,
    get_driver_class,
    get_sensor_metadata,
    list_all_sensors,
    list_sensors_by_board,
    list_sensors_by_category,
    list_sensors_by_connection_type,
    create_sensor_instance,
)

# Import all drivers for convenience
from .photocell import PhotoCellDriver
from .bme280 import BME280Driver
from .scd41 import SCD41Driver
from .ds18b20 import DS18B20Driver
from .flexsensor import FlexSensorDriver
from .etape import ETapeDriver

__all__ = [
    # Base classes
    "BaseSensorDriver",
    "SensorMetadata",
    "EntityMetadata",
    # Registry functions
    "DRIVER_REGISTRY",
    "get_driver_class",
    "get_sensor_metadata",
    "list_all_sensors",
    "list_sensors_by_board",
    "list_sensors_by_category",
    "list_sensors_by_connection_type",
    "create_sensor_instance",
    # Driver classes
    "PhotoCellDriver",
    "BME280Driver",
    "SCD41Driver",
    "DS18B20Driver",
    "FlexSensorDriver",
    "ETapeDriver",
]
