"""
Base classes for sensor implementations.

All sensor drivers should inherit from BaseSensor and implement
the required methods.
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any
from enum import Enum
from datetime import datetime
from pydantic import BaseModel, Field


class SensorType(str, Enum):
    """Supported sensor types"""
    TEMPERATURE = "temperature"
    HUMIDITY = "humidity"
    PRESSURE = "pressure"
    LIGHT = "light"
    ANALOG = "analog"
    DIGITAL = "digital"
    MOTION = "motion"
    DISTANCE = "distance"
    CUSTOM = "custom"


class ConnectionType(str, Enum):
    """Supported connection interfaces"""
    I2C = "i2c"
    SPI = "spi"
    GPIO = "gpio"
    ANALOG = "analog"
    UART = "uart"
    ONE_WIRE = "one_wire"


class SensorEntity(BaseModel):
    """Represents a single measurement entity from a sensor"""
    id: str = Field(..., description="Unique entity identifier")
    name: str = Field(..., description="Human-readable name")
    unit: str = Field(..., description="Measurement unit (e.g., °C, %, hPa)")
    sensor_type: SensorType = Field(..., description="Type of measurement")
    min_value: Optional[float] = Field(None, description="Minimum expected value")
    max_value: Optional[float] = Field(None, description="Maximum expected value")
    precision: int = Field(2, description="Decimal places for display")


class SensorReading(BaseModel):
    """Single sensor reading with timestamp"""
    entity_id: str = Field(..., description="Entity that produced this reading")
    value: float = Field(..., description="Measured value")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    quality: float = Field(1.0, ge=0.0, le=1.0, description="Reading quality (0-1)")


class SensorConfig(BaseModel):
    """Configuration for a sensor instance"""
    name: str = Field(..., description="Sensor instance name")
    driver: str = Field(..., description="Driver class name")
    connection_type: ConnectionType = Field(..., description="How sensor connects")
    connection_params: Dict[str, Any] = Field(
        default_factory=dict,
        description="Connection parameters (address, pin, bus, etc.)"
    )
    poll_interval: float = Field(1.0, gt=0, description="Polling interval in seconds")
    enabled: bool = Field(True, description="Whether sensor is enabled")
    calibration: Optional[Dict[str, float]] = Field(
        None,
        description="Calibration offsets/multipliers"
    )


class BaseSensor(ABC):
    """
    Abstract base class for all sensor implementations.

    Each sensor driver should:
    1. Inherit from this class
    2. Implement all abstract methods
    3. Be placed in the sensors/ directory
    4. Follow naming convention: <sensor_name>_driver.py
    """

    def __init__(self, config: SensorConfig):
        """
        Initialize sensor with configuration.

        Args:
            config: Sensor configuration object
        """
        self.config = config
        self._is_initialized = False
        self._is_connected = False
        self._entities: List[SensorEntity] = []

    @abstractmethod
    async def initialize(self) -> bool:
        """
        Initialize the sensor hardware.

        Returns:
            True if initialization successful, False otherwise
        """
        pass

    @abstractmethod
    async def connect(self) -> bool:
        """
        Establish connection to the sensor.

        Returns:
            True if connection successful, False otherwise
        """
        pass

    @abstractmethod
    async def disconnect(self) -> bool:
        """
        Close connection to the sensor.

        Returns:
            True if disconnection successful, False otherwise
        """
        pass

    @abstractmethod
    async def read(self) -> List[SensorReading]:
        """
        Read all values from the sensor.

        Returns:
            List of sensor readings for all entities
        """
        pass

    @abstractmethod
    def get_entities(self) -> List[SensorEntity]:
        """
        Get list of measurement entities this sensor provides.

        Returns:
            List of sensor entities
        """
        pass

    @abstractmethod
    async def calibrate(self, calibration_data: Dict[str, float]) -> bool:
        """
        Apply calibration to the sensor.

        Args:
            calibration_data: Calibration parameters

        Returns:
            True if calibration successful, False otherwise
        """
        pass

    @abstractmethod
    async def self_test(self) -> Dict[str, Any]:
        """
        Perform sensor self-test.

        Returns:
            Dictionary with test results
        """
        pass

    # Common helper methods

    @property
    def is_connected(self) -> bool:
        """Check if sensor is connected"""
        return self._is_connected

    @property
    def is_initialized(self) -> bool:
        """Check if sensor is initialized"""
        return self._is_initialized

    def apply_calibration(self, value: float, entity_id: str) -> float:
        """
        Apply calibration offset/multiplier to a reading.

        Args:
            value: Raw sensor value
            entity_id: Entity identifier

        Returns:
            Calibrated value
        """
        if not self.config.calibration:
            return value

        offset = self.config.calibration.get(f"{entity_id}_offset", 0.0)
        multiplier = self.config.calibration.get(f"{entity_id}_multiplier", 1.0)

        return (value * multiplier) + offset

    def validate_reading(self, reading: SensorReading) -> bool:
        """
        Validate a sensor reading against expected ranges.

        Args:
            reading: Sensor reading to validate

        Returns:
            True if reading is valid, False otherwise
        """
        entity = next(
            (e for e in self._entities if e.id == reading.entity_id),
            None
        )

        if not entity:
            return False

        if entity.min_value is not None and reading.value < entity.min_value:
            return False

        if entity.max_value is not None and reading.value > entity.max_value:
            return False

        return True
