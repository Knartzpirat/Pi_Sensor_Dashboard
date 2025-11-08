"""
Sensor Registry

Central registry of all supported sensors with metadata for the frontend.
"""

from typing import Dict, List, Any
from enum import Enum


class SensorCategory(str, Enum):
    """Sensor categories for grouping"""
    ENVIRONMENTAL = "environmental"
    MOTION = "motion"
    LIGHT = "light"
    ANALOG = "analog"
    CUSTOM = "custom"


class SensorMetadata:
    """Metadata for a sensor type"""

    def __init__(
        self,
        driver_name: str,
        display_name: str,
        description: str,
        category: SensorCategory,
        connection_types: List[str],
        entities: List[Dict[str, Any]],
        image_url: str = None,
        datasheet_url: str = None,
        requires_calibration: bool = False,
        min_poll_interval: float = 0.5,
        supports_boards: List[str] = None,
    ):
        self.driver_name = driver_name
        self.display_name = display_name
        self.description = description
        self.category = category
        self.connection_types = connection_types
        self.entities = entities
        self.image_url = image_url
        self.datasheet_url = datasheet_url
        self.requires_calibration = requires_calibration
        self.min_poll_interval = min_poll_interval
        self.supports_boards = supports_boards or ["GPIO", "CUSTOM"]

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            "driverName": self.driver_name,
            "displayName": self.display_name,
            "description": self.description,
            "category": self.category.value,
            "connectionTypes": self.connection_types,
            "entities": self.entities,
            "imageUrl": self.image_url,
            "datasheetUrl": self.datasheet_url,
            "requiresCalibration": self.requires_calibration,
            "minPollInterval": self.min_poll_interval,
            "supportsBoards": self.supports_boards,
        }


# Registry of all supported sensors
SENSOR_REGISTRY: Dict[str, SensorMetadata] = {
    "DHT22": SensorMetadata(
        driver_name="DHT22",
        display_name="DHT22 / AM2302",
        description="Digital temperature and humidity sensor with high accuracy",
        category=SensorCategory.ENVIRONMENTAL,
        connection_types=["io"],
        entities=[
            {"name": "Temperature", "unit": "°C", "type": "temperature", "precision": 1},
            {"name": "Humidity", "unit": "%", "type": "humidity", "precision": 1},
        ],
        min_poll_interval=2.0,  # DHT22 requires 2s between reads
        datasheet_url="https://www.sparkfun.com/datasheets/Sensors/Temperature/DHT22.pdf",
    ),
    "DHT11": SensorMetadata(
        driver_name="DHT11",
        display_name="DHT11",
        description="Basic digital temperature and humidity sensor",
        category=SensorCategory.ENVIRONMENTAL,
        connection_types=["io"],
        entities=[
            {"name": "Temperature", "unit": "°C", "type": "temperature", "precision": 0},
            {"name": "Humidity", "unit": "%", "type": "humidity", "precision": 0},
        ],
        min_poll_interval=2.0,
    ),
    "BMP280": SensorMetadata(
        driver_name="BMP280",
        display_name="BMP280",
        description="Digital barometric pressure and temperature sensor",
        category=SensorCategory.ENVIRONMENTAL,
        connection_types=["i2c"],
        entities=[
            {"name": "Temperature", "unit": "°C", "type": "temperature", "precision": 2},
            {"name": "Pressure", "unit": "hPa", "type": "pressure", "precision": 1},
        ],
        min_poll_interval=0.5,
        requires_calibration=True,  # Sea level pressure calibration
        datasheet_url="https://www.bosch-sensortec.com/media/boschsensortec/downloads/datasheets/bst-bmp280-ds001.pdf",
    ),
    "BME280": SensorMetadata(
        driver_name="BME280",
        display_name="BME280",
        description="Digital temperature, humidity and pressure sensor",
        category=SensorCategory.ENVIRONMENTAL,
        connection_types=["i2c"],
        entities=[
            {"name": "Temperature", "unit": "°C", "type": "temperature", "precision": 2},
            {"name": "Pressure", "unit": "hPa", "type": "pressure", "precision": 1},
            {"name": "Humidity", "unit": "%", "type": "humidity", "precision": 1},
        ],
        min_poll_interval=0.5,
        requires_calibration=True,
        datasheet_url="https://www.bosch-sensortec.com/media/boschsensortec/downloads/datasheets/bst-bme280-ds002.pdf",
    ),
    "ADS1115": SensorMetadata(
        driver_name="ADS1115",
        display_name="ADS1115 ADC",
        description="16-bit ADC with 4 channels and programmable gain amplifier",
        category=SensorCategory.ANALOG,
        connection_types=["i2c"],
        entities=[
            {"name": "Channel 0", "unit": "V", "type": "analog", "precision": 3},
            {"name": "Channel 1", "unit": "V", "type": "analog", "precision": 3},
            {"name": "Channel 2", "unit": "V", "type": "analog", "precision": 3},
            {"name": "Channel 3", "unit": "V", "type": "analog", "precision": 3},
        ],
        min_poll_interval=0.1,
        supports_boards=["GPIO", "CUSTOM"],
        datasheet_url="https://www.ti.com/lit/ds/symlink/ads1115.pdf",
    ),
    "Analog": SensorMetadata(
        driver_name="Analog",
        display_name="Generic Analog Sensor",
        description="Generic analog sensor connected to ADC (Custom Board only)",
        category=SensorCategory.ANALOG,
        connection_types=["adc"],
        entities=[
            {"name": "Voltage", "unit": "V", "type": "analog", "precision": 3},
        ],
        min_poll_interval=0.1,
        supports_boards=["CUSTOM"],  # Only Custom Board has built-in ADC
    ),
}


def get_sensor_metadata(driver_name: str) -> SensorMetadata:
    """
    Get metadata for a sensor driver.

    Args:
        driver_name: Name of the driver

    Returns:
        SensorMetadata object

    Raises:
        KeyError: If driver not found
    """
    return SENSOR_REGISTRY[driver_name]


def list_all_sensors() -> List[Dict[str, Any]]:
    """
    List all registered sensors with metadata.

    Returns:
        List of sensor metadata dictionaries
    """
    return [metadata.to_dict() for metadata in SENSOR_REGISTRY.values()]


def list_sensors_by_category(category: SensorCategory) -> List[Dict[str, Any]]:
    """
    List sensors filtered by category.

    Args:
        category: Sensor category

    Returns:
        List of sensor metadata dictionaries
    """
    return [
        metadata.to_dict()
        for metadata in SENSOR_REGISTRY.values()
        if metadata.category == category
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
        metadata.to_dict()
        for metadata in SENSOR_REGISTRY.values()
        if board_type in metadata.supports_boards
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
        metadata.to_dict()
        for metadata in SENSOR_REGISTRY.values()
        if connection_type in metadata.connection_types
    ]
