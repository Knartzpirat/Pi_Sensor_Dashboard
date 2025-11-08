"""
BMP280 Dummy Driver for Windows Development

Simulates BMP280 pressure and temperature sensor.
"""

import random
import math
from typing import List, Dict, Any
from datetime import datetime
import logging

from app.models.sensor_base import (
    BaseSensor,
    SensorConfig,
    SensorEntity,
    SensorReading,
    SensorType,
)

logger = logging.getLogger(__name__)


class BMP280DummyDriver(BaseSensor):
    """
    Dummy driver for BMP280 barometric pressure and temperature sensor.

    Simulates realistic sensor readings for development without hardware.
    """

    def __init__(self, config: SensorConfig):
        super().__init__(config)
        self._time_offset = random.uniform(0, 100)
        self._noise_level = 0.5

    async def initialize(self) -> bool:
        """Initialize dummy BMP280 sensor"""
        try:
            logger.info(f"Initializing dummy BMP280 sensor: {self.config.name}")

            self._entities = [
                SensorEntity(
                    id=f"{self.config.name}_temperature",
                    name="Temperature",
                    unit="°C",
                    sensor_type=SensorType.TEMPERATURE,
                    min_value=-40.0,
                    max_value=85.0,
                    precision=2,
                ),
                SensorEntity(
                    id=f"{self.config.name}_pressure",
                    name="Pressure",
                    unit="hPa",
                    sensor_type=SensorType.PRESSURE,
                    min_value=300.0,
                    max_value=1100.0,
                    precision=1,
                ),
            ]

            self._is_initialized = True
            logger.info(f"Dummy BMP280 sensor initialized")
            return True

        except Exception as e:
            logger.error(f"Failed to initialize dummy BMP280 sensor: {e}")
            return False

    async def connect(self) -> bool:
        """Connect to dummy sensor"""
        if not self._is_initialized:
            logger.error("Sensor not initialized")
            return False

        self._is_connected = True
        logger.info("Dummy BMP280 sensor connected")
        return True

    async def disconnect(self) -> bool:
        """Disconnect from dummy sensor"""
        self._is_connected = False
        logger.info("Dummy BMP280 sensor disconnected")
        return True

    async def read(self) -> List[SensorReading]:
        """Read simulated temperature and pressure"""
        if not self._is_connected:
            raise RuntimeError("Sensor not connected")

        try:
            time_factor = datetime.now().timestamp()

            # Temperature: 20-25°C
            temp_base = 22.5
            temp_range = 2.5
            temp_daily = math.sin(time_factor * 0.1 + self._time_offset) * temp_range * 0.5
            temp_variation = math.sin(time_factor * 2.0 + self._time_offset) * temp_range * 0.1
            temp_noise = random.gauss(0, self._noise_level)
            temperature = temp_base + temp_daily + temp_variation + temp_noise
            temperature = max(-40.0, min(85.0, temperature))

            # Pressure: 950-1050 hPa with very slow changes
            pressure_base = 1013.25
            pressure_range = 50.0
            pressure_drift = math.sin(time_factor * 0.05 + self._time_offset) * pressure_range * 0.2
            pressure_variation = math.sin(time_factor * 0.8 + self._time_offset) * pressure_range * 0.05
            pressure_noise = random.gauss(0, self._noise_level * 0.5)
            pressure = pressure_base + pressure_drift + pressure_variation + pressure_noise
            pressure = max(300.0, min(1100.0, pressure))

            # Apply calibration
            temperature = self.apply_calibration(temperature, f"{self.config.name}_temperature")
            pressure = self.apply_calibration(pressure, f"{self.config.name}_pressure")

            # Occasionally simulate quality issues (5% chance)
            quality = 1.0
            if random.random() < 0.05:
                quality = random.uniform(0.7, 0.9)

            readings = [
                SensorReading(
                    entity_id=f"{self.config.name}_temperature",
                    value=round(temperature, 2),
                    quality=quality,
                ),
                SensorReading(
                    entity_id=f"{self.config.name}_pressure",
                    value=round(pressure, 1),
                    quality=quality,
                ),
            ]

            return readings

        except Exception as e:
            logger.error(f"Dummy BMP280 read failed: {e}")
            raise

    def get_entities(self) -> List[SensorEntity]:
        """Get sensor entities"""
        return self._entities

    async def calibrate(self, calibration_data: Dict[str, float]) -> bool:
        """Apply calibration to sensor"""
        try:
            self.config.calibration = calibration_data
            logger.info(f"Calibration applied: {calibration_data}")
            return True
        except Exception as e:
            logger.error(f"Calibration failed: {e}")
            return False

    async def self_test(self) -> Dict[str, Any]:
        """Perform sensor self-test"""
        results = {
            "sensor": "BMP280 (Dummy)",
            "initialized": self._is_initialized,
            "connected": self._is_connected,
            "i2c_address": self.config.connection_params.get("address", "0x76"),
        }

        if self._is_connected:
            try:
                readings = await self.read()
                results["test_reading"] = {
                    "success": True,
                    "temperature": readings[0].value,
                    "pressure": readings[1].value,
                }
            except Exception as e:
                results["test_reading"] = {
                    "success": False,
                    "error": str(e),
                }

        return results
