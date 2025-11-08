"""
BME280 Sensor Driver

Digital temperature, humidity and pressure sensor via I2C.
"""

from typing import Dict, Any
from .base import BaseSensorDriver, SensorMetadata, EntityMetadata


class BME280Driver(BaseSensorDriver):
    """BME280 environmental sensor driver"""

    @classmethod
    def get_metadata(cls) -> SensorMetadata:
        return SensorMetadata(
            driver_name="BME280",
            display_name="BME280",
            description="Digital temperature, humidity and pressure sensor",
            category="environmental",
            connection_types=["i2c"],
            entities=[
                EntityMetadata(
                    name="Temperature",
                    unit="°C",
                    type="temperature",
                    precision=2
                ),
                EntityMetadata(
                    name="Pressure",
                    unit="hPa",
                    type="pressure",
                    precision=1
                ),
                EntityMetadata(
                    name="Humidity",
                    unit="%",
                    type="humidity",
                    precision=1
                ),
            ],
            min_poll_interval=0.5,
            requires_calibration=True,  # Sea level pressure calibration
            supports_boards=["GPIO", "CUSTOM"],
            datasheet_url="https://www.bosch-sensortec.com/media/boschsensortec/downloads/datasheets/bst-bme280-ds002.pdf",
        )

    async def read(self) -> Dict[str, Any]:
        """
        Read temperature, humidity, and pressure from BME280.

        Returns:
            Dictionary with temperature, humidity, and pressure values
        """
        if self.use_dummy:
            metadata = self.get_metadata()
            entities = metadata.entities

            return {
                entities[0].name: self._generate_dummy_value(entities[0], value_range=(18.0, 26.0)),  # Temperature
                entities[1].name: self._generate_dummy_value(entities[1], value_range=(980.0, 1030.0)),  # Pressure
                entities[2].name: self._generate_dummy_value(entities[2], value_range=(35.0, 65.0)),  # Humidity
            }

        # Real hardware implementation would go here
        raise NotImplementedError("Real hardware support not yet implemented")
