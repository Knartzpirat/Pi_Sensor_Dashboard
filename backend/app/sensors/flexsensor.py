"""
Flex Sensor Driver

Resistive flex sensor for bend detection and angle measurement via ADC.
"""

from typing import Dict, Any
from .base import BaseSensorDriver, SensorMetadata, EntityMetadata


class FlexSensorDriver(BaseSensorDriver):
    """Short Flex Sensor driver"""

    @classmethod
    def get_metadata(cls) -> SensorMetadata:
        return SensorMetadata(
            driver_name="FlexSensor",
            display_name="Short Flex Sensor",
            description="Resistive flex sensor for bend detection and angle measurement",
            category="analog",
            connection_types=["adc"],
            entities=[
                EntityMetadata(
                    name="Bend Angle",
                    unit="V",
                    type="analog",
                    precision=3
                )
            ],
            min_poll_interval=0.1,
            supports_boards=["CUSTOM"],  # Only Custom Board has built-in ADC
        )

    async def read(self) -> Dict[str, Any]:
        """
        Read bend angle from flex sensor.

        Returns:
            Dictionary with bend angle voltage
        """
        if self.use_dummy:
            metadata = self.get_metadata()
            entity = metadata.entities[0]
            # Voltage range: 0.8V (flat) to 3.5V (90° bend)
            value = self._generate_dummy_value(entity, value_range=(0.8, 3.5))
            return {entity.name: value}

        # Real hardware implementation would go here
        raise NotImplementedError("Real hardware support not yet implemented")
