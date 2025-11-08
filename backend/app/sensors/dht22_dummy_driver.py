"""
DHT22 Dummy Driver for Windows Development

Simulates DHT22 temperature and humidity sensor.
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


class DHT22DummyDriver(BaseSensor):
    """
    Dummy driver for DHT22 temperature and humidity sensor.

    Simulates realistic sensor readings for development without hardware.
    """

    def __init__(self, config: SensorConfig):
        super().__init__(config)
        self._time_offset = random.uniform(0, 100)
        self._noise_level = 0.5

    async def initialize(self) -> bool:
        """Initialize dummy DHT22 sensor"""
        try:
            logger.info(f"Initializing dummy DHT22 sensor: {self.config.name}")

            self._entities = [
                SensorEntity(
                    id=f"{self.config.name}_temperature",
                    name="Temperature",
                    unit="°C",
                    sensor_type=SensorType.TEMPERATURE,
                    min_value=-40.0,
                    max_value=80.0,
                    precision=1,
                ),
                SensorEntity(
                    id=f"{self.config.name}_humidity",
                    name="Humidity",
                    unit="%",
                    sensor_type=SensorType.HUMIDITY,
                    min_value=0.0,
                    max_value=100.0,
                    precision=1,
                ),
            ]

            self._is_initialized = True
            logger.info(f"Dummy DHT22 sensor initialized")
            return True

        except Exception as e:
            logger.error(f"Failed to initialize dummy DHT22 sensor: {e}")
            return False

    async def connect(self) -> bool:
        """Connect to dummy sensor"""
        if not self._is_initialized:
            logger.error("Sensor not initialized")
            return False

        self._is_connected = True
        logger.info("Dummy DHT22 sensor connected")
        return True

    async def disconnect(self) -> bool:
        """Disconnect from dummy sensor"""
        self._is_connected = False
        logger.info("Dummy DHT22 sensor disconnected")
        return True

    async def read(self) -> List[SensorReading]:
        """Read simulated temperature and humidity"""
        if not self._is_connected:
            raise RuntimeError("Sensor not connected")

        try:
            time_factor = datetime.now().timestamp()

            # Temperature: 20-25°C with slow daily cycle
            temp_base = 22.5
            temp_range = 2.5
            temp_daily = math.sin(time_factor * 0.1 + self._time_offset) * temp_range * 0.5
            temp_variation = math.sin(time_factor * 2.0 + self._time_offset) * temp_range * 0.1
            temp_noise = random.gauss(0, self._noise_level)
            temperature = temp_base + temp_daily + temp_variation + temp_noise
            temperature = max(-40.0, min(80.0, temperature))

            # Humidity: 40-60% with inverse correlation to temperature
            humid_base = 50.0
            humid_range = 10.0
            humid_daily = -math.sin(time_factor * 0.1 + self._time_offset) * humid_range * 0.3
            humid_variation = math.sin(time_factor * 1.5 + self._time_offset) * humid_range * 0.2
            humid_noise = random.gauss(0, self._noise_level)
            humidity = humid_base + humid_daily + humid_variation + humid_noise
            humidity = max(0.0, min(100.0, humidity))

            # Apply calibration
            temperature = self.apply_calibration(temperature, f"{self.config.name}_temperature")
            humidity = self.apply_calibration(humidity, f"{self.config.name}_humidity")

            # Occasionally simulate quality issues (5% chance)
            quality = 1.0
            if random.random() < 0.05:
                quality = random.uniform(0.7, 0.9)

            readings = [
                SensorReading(
                    entity_id=f"{self.config.name}_temperature",
                    value=round(temperature, 1),
                    quality=quality,
                ),
                SensorReading(
                    entity_id=f"{self.config.name}_humidity",
                    value=round(humidity, 1),
                    quality=quality,
                ),
            ]

            return readings

        except Exception as e:
            logger.error(f"Dummy DHT22 read failed: {e}")
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
            "sensor": "DHT22 (Dummy)",
            "initialized": self._is_initialized,
            "connected": self._is_connected,
            "pin": self.config.connection_params.get("pin"),
        }

        if self._is_connected:
            try:
                readings = await self.read()
                results["test_reading"] = {
                    "success": True,
                    "temperature": readings[0].value,
                    "humidity": readings[1].value,
                }
            except Exception as e:
                results["test_reading"] = {
                    "success": False,
                    "error": str(e),
                }

        return results
