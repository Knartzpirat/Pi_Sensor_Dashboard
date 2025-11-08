"""
Dummy Sensor Driver for Windows Development

This driver simulates sensor readings for development on Windows
where actual hardware is not available.
"""

import asyncio
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


class DummySensorDriver(BaseSensor):
    """
    Generic dummy sensor driver that simulates realistic sensor readings.

    Supports multiple sensor types based on configuration:
    - DHT22: Temperature + Humidity
    - BMP280/BME280: Temperature + Pressure (+ Humidity for BME280)
    - Analog: Generic analog value

    Configuration example:
    {
        "name": "Test Sensor",
        "driver": "DummySensorDriver",
        "connection_type": "io",  # or "i2c", "adc"
        "connection_params": {
            "sensor_model": "DHT22",  # or "BMP280", "BME280", "Analog"
            "pin": 4
        },
        "poll_interval": 1.0
    }
    """

    def __init__(self, config: SensorConfig):
        super().__init__(config)
        self._sensor_model = config.connection_params.get("sensor_model", "DHT22")
        self._time_offset = random.uniform(0, 100)  # Random offset for sine wave
        self._noise_level = 0.5  # Noise amplitude for realism

    async def initialize(self) -> bool:
        """Initialize dummy sensor"""
        try:
            logger.info(f"Initializing dummy {self._sensor_model} sensor: {self.config.name}")

            # Define entities based on sensor model
            if self._sensor_model in ["DHT22", "DHT11"]:
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

            elif self._sensor_model == "BMP280":
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

            elif self._sensor_model == "BME280":
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

            elif self._sensor_model == "ADS1115":
                # 4 analog input channels
                self._entities = [
                    SensorEntity(
                        id=f"{self.config.name}_channel_0",
                        name="Channel 0",
                        unit="V",
                        sensor_type=SensorType.ANALOG,
                        min_value=0.0,
                        max_value=5.0,
                        precision=3,
                    ),
                    SensorEntity(
                        id=f"{self.config.name}_channel_1",
                        name="Channel 1",
                        unit="V",
                        sensor_type=SensorType.ANALOG,
                        min_value=0.0,
                        max_value=5.0,
                        precision=3,
                    ),
                    SensorEntity(
                        id=f"{self.config.name}_channel_2",
                        name="Channel 2",
                        unit="V",
                        sensor_type=SensorType.ANALOG,
                        min_value=0.0,
                        max_value=5.0,
                        precision=3,
                    ),
                    SensorEntity(
                        id=f"{self.config.name}_channel_3",
                        name="Channel 3",
                        unit="V",
                        sensor_type=SensorType.ANALOG,
                        min_value=0.0,
                        max_value=5.0,
                        precision=3,
                    ),
                ]

            elif self._sensor_model == "Analog":
                self._entities = [
                    SensorEntity(
                        id=f"{self.config.name}_value",
                        name="Analog Value",
                        unit="V",
                        sensor_type=SensorType.ANALOG,
                        min_value=0.0,
                        max_value=3.3,
                        precision=3,
                    ),
                ]

            else:
                logger.warning(f"Unknown sensor model {self._sensor_model}, using generic sensor")
                self._entities = [
                    SensorEntity(
                        id=f"{self.config.name}_value",
                        name="Value",
                        unit="",
                        sensor_type=SensorType.CUSTOM,
                        min_value=0.0,
                        max_value=100.0,
                        precision=2,
                    ),
                ]

            self._is_initialized = True
            logger.info(f"Dummy {self._sensor_model} sensor initialized with {len(self._entities)} entities")
            return True

        except Exception as e:
            logger.error(f"Failed to initialize dummy sensor: {e}")
            return False

    async def connect(self) -> bool:
        """Connect to dummy sensor"""
        if not self._is_initialized:
            logger.error("Sensor not initialized")
            return False

        self._is_connected = True
        logger.info(f"Dummy {self._sensor_model} sensor connected")
        return True

    async def disconnect(self) -> bool:
        """Disconnect from dummy sensor"""
        self._is_connected = False
        logger.info(f"Dummy {self._sensor_model} sensor disconnected")
        return True

    def _generate_realistic_value(self, entity: SensorEntity, time_factor: float) -> float:
        """
        Generate realistic sensor values with smooth variations and noise.

        Uses sine waves + random noise to simulate natural sensor behavior.
        """
        # Base value in the middle of the range
        if entity.min_value is not None and entity.max_value is not None:
            mid_value = (entity.min_value + entity.max_value) / 2
            range_amplitude = (entity.max_value - entity.min_value) / 4
        else:
            mid_value = 50.0
            range_amplitude = 10.0

        # Different patterns based on sensor type
        if entity.sensor_type == SensorType.TEMPERATURE:
            # Slow daily cycle + small fluctuations
            daily_cycle = math.sin(time_factor * 0.1 + self._time_offset) * range_amplitude * 0.5
            small_variation = math.sin(time_factor * 2.0 + self._time_offset) * range_amplitude * 0.1
            noise = random.gauss(0, self._noise_level)
            value = mid_value + daily_cycle + small_variation + noise

        elif entity.sensor_type == SensorType.HUMIDITY:
            # Inverse correlation with temperature + variations
            daily_cycle = -math.sin(time_factor * 0.1 + self._time_offset) * range_amplitude * 0.3
            variation = math.sin(time_factor * 1.5 + self._time_offset) * range_amplitude * 0.2
            noise = random.gauss(0, self._noise_level)
            value = mid_value + daily_cycle + variation + noise

        elif entity.sensor_type == SensorType.PRESSURE:
            # Very slow changes + small fluctuations
            slow_drift = math.sin(time_factor * 0.05 + self._time_offset) * range_amplitude * 0.2
            small_variation = math.sin(time_factor * 0.8 + self._time_offset) * range_amplitude * 0.05
            noise = random.gauss(0, self._noise_level * 0.5)
            value = mid_value + slow_drift + small_variation + noise

        elif entity.sensor_type == SensorType.ANALOG:
            # Medium speed variations
            wave = math.sin(time_factor * 1.0 + self._time_offset) * range_amplitude * 0.4
            noise = random.gauss(0, self._noise_level * 0.2)
            value = mid_value + wave + noise

        else:
            # Generic pattern
            wave = math.sin(time_factor * 0.5 + self._time_offset) * range_amplitude * 0.3
            noise = random.gauss(0, self._noise_level)
            value = mid_value + wave + noise

        # Clamp to valid range
        if entity.min_value is not None:
            value = max(value, entity.min_value)
        if entity.max_value is not None:
            value = min(value, entity.max_value)

        return value

    async def read(self) -> List[SensorReading]:
        """Read simulated values from dummy sensor"""
        if not self._is_connected:
            raise RuntimeError("Sensor not connected")

        try:
            # Use time as factor for smooth progression
            time_factor = datetime.now().timestamp()

            readings = []
            for entity in self._entities:
                # Generate realistic value
                value = self._generate_realistic_value(entity, time_factor)

                # Apply calibration
                value = self.apply_calibration(value, entity.id)

                # Round to precision
                value = round(value, entity.precision)

                # Occasionally simulate sensor quality issues (5% chance)
                quality = 1.0
                if random.random() < 0.05:
                    quality = random.uniform(0.7, 0.9)
                    logger.debug(f"Simulating quality issue: {quality:.2f}")

                reading = SensorReading(
                    entity_id=entity.id,
                    value=value,
                    quality=quality,
                )

                readings.append(reading)

            return readings

        except Exception as e:
            logger.error(f"Dummy sensor read failed: {e}")
            raise

    def get_entities(self) -> List[SensorEntity]:
        """Get sensor entities"""
        return self._entities

    async def calibrate(self, calibration_data: Dict[str, float]) -> bool:
        """Apply calibration to sensor"""
        try:
            self.config.calibration = calibration_data
            logger.info(f"Calibration applied to dummy sensor: {calibration_data}")
            return True
        except Exception as e:
            logger.error(f"Calibration failed: {e}")
            return False

    async def self_test(self) -> Dict[str, Any]:
        """Perform sensor self-test"""
        results = {
            "sensor": f"Dummy {self._sensor_model}",
            "initialized": self._is_initialized,
            "connected": self._is_connected,
            "model": self._sensor_model,
            "pin": self.config.connection_params.get("pin"),
            "entities_count": len(self._entities),
        }

        if self._is_connected:
            try:
                readings = await self.read()
                results["test_reading"] = {
                    "success": True,
                    "readings": [
                        {
                            "entity": r.entity_id,
                            "value": r.value,
                            "quality": r.quality,
                        }
                        for r in readings
                    ],
                }
            except Exception as e:
                results["test_reading"] = {
                    "success": False,
                    "error": str(e),
                }

        return results
