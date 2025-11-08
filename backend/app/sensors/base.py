"""
Base Sensor Driver

Abstract base class for all sensor drivers with metadata and dummy mode support.
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
import random
import os


@dataclass
class EntityMetadata:
    """Metadata for a sensor entity (measurement value)"""
    name: str
    unit: str
    type: str
    precision: int


@dataclass
class SensorMetadata:
    """Metadata for a sensor driver"""
    driver_name: str
    display_name: str
    description: str
    category: str  # environmental, light, analog, motion
    connection_types: List[str]  # i2c, adc, io
    entities: List[EntityMetadata]
    min_poll_interval: float = 0.5
    requires_calibration: bool = False
    supports_boards: List[str] = None
    datasheet_url: Optional[str] = None

    def __post_init__(self):
        if self.supports_boards is None:
            self.supports_boards = ["GPIO", "CUSTOM"]

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        return {
            "driverName": self.driver_name,
            "displayName": self.display_name,
            "description": self.description,
            "category": self.category,
            "connectionTypes": self.connection_types,
            "entities": [asdict(e) for e in self.entities],
            "minPollInterval": self.min_poll_interval,
            "requiresCalibration": self.requires_calibration,
            "supportsBoards": self.supports_boards,
            "datasheetUrl": self.datasheet_url,
        }


class BaseSensorDriver(ABC):
    """
    Abstract base class for all sensor drivers.

    Each driver must implement:
    - get_metadata(): Return sensor metadata
    - read(): Read sensor values (real or dummy)
    """

    def __init__(self, sensor_id: str, config: Dict[str, Any]):
        """
        Initialize sensor driver.

        Args:
            sensor_id: Unique identifier for this sensor instance
            config: Configuration dictionary with connection params
        """
        self.sensor_id = sensor_id
        self.config = config
        self.use_dummy = os.getenv("USE_DUMMY_DRIVERS", "true").lower() == "true"

    @classmethod
    @abstractmethod
    def get_metadata(cls) -> SensorMetadata:
        """
        Get sensor metadata.

        Returns:
            SensorMetadata object with driver information
        """
        pass

    @abstractmethod
    async def read(self) -> Dict[str, Any]:
        """
        Read sensor values.

        Returns:
            Dictionary mapping entity names to values
        """
        pass

    async def initialize(self):
        """
        Initialize sensor hardware (if needed).
        Override in subclass if hardware initialization is required.
        """
        pass

    async def cleanup(self):
        """
        Cleanup sensor resources (if needed).
        Override in subclass if cleanup is required.
        """
        pass

    def _generate_dummy_value(self, entity: EntityMetadata, value_range: tuple = None) -> float:
        """
        Generate a dummy value for testing.

        Args:
            entity: Entity metadata
            value_range: Optional (min, max) tuple for value range

        Returns:
            Random value within range, rounded to entity precision
        """
        if value_range is None:
            # Default ranges based on entity type
            ranges = {
                "temperature": (15.0, 30.0),
                "humidity": (30.0, 70.0),
                "pressure": (980.0, 1030.0),
                "co2": (400.0, 1000.0),
                "analog": (0.0, 5.0),
            }
            value_range = ranges.get(entity.type, (0.0, 100.0))

        min_val, max_val = value_range
        value = random.uniform(min_val, max_val)
        return round(value, entity.precision)
