"""
Photo Cell Sensor Driver

Light dependent resistor (LDR) for ambient light sensing via ADC.
"""

from typing import Dict, Any
from .base import BaseSensorDriver, SensorMetadata, EntityMetadata


class PhotoCellDriver(BaseSensorDriver):
    """Photo Cell / LDR sensor driver"""

    @classmethod
    def get_metadata(cls) -> SensorMetadata:
        return SensorMetadata(
            driver_name="PhotoCell",
            display_name="Photo Cell",
            description="Light dependent resistor (LDR) for ambient light sensing",
            category="light",
            connection_types=["adc"],
            entities=[
                EntityMetadata(
                    name="Light Level",
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
        Read light level from photo cell.

        Returns:
            Dictionary with light level voltage
        """
        if self.use_dummy:
            metadata = self.get_metadata()
            entity = metadata.entities[0]
            # Light level range: 0.5V (dark) to 4.5V (bright)
            value = self._generate_dummy_value(entity, value_range=(0.5, 4.5))
            return {entity.name: value}

        # Real hardware implementation would go here
        raise NotImplementedError("Real hardware support not yet implemented")
