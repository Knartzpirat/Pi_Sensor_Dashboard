"""
eTape Liquid Level Sensor Driver

Resistive liquid level sensor with continuous output via ADC.
"""

from typing import Dict, Any
from .base import BaseSensorDriver, SensorMetadata, EntityMetadata


class ETapeDriver(BaseSensorDriver):
    """5" eTape Liquid Level Sensor driver"""

    @classmethod
    def get_metadata(cls) -> SensorMetadata:
        return SensorMetadata(
            driver_name="eTape",
            display_name="5\" eTape Liquid Level Sensor",
            description="Resistive liquid level sensor with continuous output",
            category="analog",
            connection_types=["adc"],
            entities=[
                EntityMetadata(
                    name="Liquid Level",
                    unit="V",
                    type="analog",
                    precision=3
                )
            ],
            min_poll_interval=0.1,
            requires_calibration=True,  # Needs calibration for volume/height
            supports_boards=["CUSTOM"],  # Only Custom Board has built-in ADC
        )

    async def read(self) -> Dict[str, Any]:
        """
        Read liquid level from eTape sensor.

        Returns:
            Dictionary with liquid level voltage
        """
        if self.use_dummy:
            metadata = self.get_metadata()
            entity = metadata.entities[0]
            # Voltage range: 0.5V (empty) to 4.0V (full)
            value = self._generate_dummy_value(entity, value_range=(0.5, 4.0))
            return {entity.name: value}

        # Real hardware implementation would go here
        raise NotImplementedError("Real hardware support not yet implemented")
