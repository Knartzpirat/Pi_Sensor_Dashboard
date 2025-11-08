"""
Sensor Registry

Centralized registry for all available sensor drivers and their metadata.
"""

from typing import Dict, List, Any, Type
from .base import BaseSensorDriver, SensorMetadata

# Import all sensor drivers
from .photocell import PhotoCellDriver
from .bme280 import BME280Driver
from .scd41 import SCD41Driver
from .ds18b20 import DS18B20Driver
from .flexsensor import FlexSensorDriver
from .etape import ETapeDriver


# Registry mapping driver names to driver classes
DRIVER_REGISTRY: Dict[str, Type[BaseSensorDriver]] = {
    "PhotoCell": PhotoCellDriver,
    "BME280": BME280Driver,
    "SCD41": SCD41Driver,
    "DS18B20": DS18B20Driver,
    "FlexSensor": FlexSensorDriver,
    "eTape": ETapeDriver,
}


def get_driver_class(driver_name: str) -> Type[BaseSensorDriver]:
    """
    Get driver class by name.

    Args:
        driver_name: Name of the driver

    Returns:
        Driver class

    Raises:
        KeyError: If driver not found
    """
    if driver_name not in DRIVER_REGISTRY:
        raise KeyError(f"Unknown driver: {driver_name}")
    return DRIVER_REGISTRY[driver_name]


def get_sensor_metadata(driver_name: str) -> SensorMetadata:
    """
    Get metadata for a specific driver.

    Args:
        driver_name: Name of the driver

    Returns:
        SensorMetadata object

    Raises:
        KeyError: If driver not found
    """
    driver_class = get_driver_class(driver_name)
    return driver_class.get_metadata()


def list_all_sensors() -> List[Dict[str, Any]]:
    """
    List all available sensors with their metadata.

    Returns:
        List of sensor metadata dictionaries
    """
    return [
        driver_class.get_metadata().to_dict()
        for driver_class in DRIVER_REGISTRY.values()
    ]


def list_sensors_by_board(board_type: str) -> List[Dict[str, Any]]:
    """
    List sensors that support a specific board type.

    Args:
        board_type: Board type (GPIO or CUSTOM)

    Returns:
        List of sensor metadata dictionaries
    """
    return [
        driver_class.get_metadata().to_dict()
        for driver_class in DRIVER_REGISTRY.values()
        if board_type in driver_class.get_metadata().supports_boards
    ]


def list_sensors_by_category(category: str) -> List[Dict[str, Any]]:
    """
    List sensors filtered by category.

    Args:
        category: Sensor category (environmental, light, analog, motion)

    Returns:
        List of sensor metadata dictionaries
    """
    return [
        driver_class.get_metadata().to_dict()
        for driver_class in DRIVER_REGISTRY.values()
        if driver_class.get_metadata().category == category
    ]


def list_sensors_by_connection_type(connection_type: str) -> List[Dict[str, Any]]:
    """
    List sensors that support a specific connection type.

    Args:
        connection_type: Connection type (i2c, adc, io)

    Returns:
        List of sensor metadata dictionaries
    """
    return [
        driver_class.get_metadata().to_dict()
        for driver_class in DRIVER_REGISTRY.values()
        if connection_type in driver_class.get_metadata().connection_types
    ]


def create_sensor_instance(
    driver_name: str,
    sensor_id: str,
    config: Dict[str, Any]
) -> BaseSensorDriver:
    """
    Create a sensor driver instance.

    Args:
        driver_name: Name of the driver
        sensor_id: Unique identifier for this sensor instance
        config: Configuration dictionary

    Returns:
        Sensor driver instance

    Raises:
        KeyError: If driver not found
    """
    driver_class = get_driver_class(driver_name)
    return driver_class(sensor_id=sensor_id, config=config)
