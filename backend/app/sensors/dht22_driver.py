"""
DHT22 Temperature and Humidity Sensor Driver

Supports DHT22 (AM2302) digital temperature and humidity sensor
connected via GPIO pin.
"""

import asyncio
from typing import List, Dict, Any
import logging

try:
    import adafruit_dht
    import board
    DHT_AVAILABLE = True
except ImportError:
    DHT_AVAILABLE = False

from app.models.sensor_base import (
    BaseSensor,
    SensorConfig,
    SensorEntity,
    SensorReading,
    SensorType,
)

logger = logging.getLogger(__name__)


class DHT22Driver(BaseSensor):
    """
    Driver for DHT22/AM2302 temperature and humidity sensor.

    Connection: Single GPIO pin (data line)
    Provides: Temperature (°C) and Humidity (%)

    Configuration example:
    {
        "name": "Room Sensor",
        "driver": "DHT22Driver",
        "connection_type": "gpio",
        "connection_params": {
            "pin": 4  # GPIO pin number (BCM numbering)
        },
        "poll_interval": 2.0  # DHT22 minimum 2 seconds between reads
    }
    """

    # DHT22 specifications
    TEMP_MIN = -40.0
    TEMP_MAX = 80.0
    HUMID_MIN = 0.0
    HUMID_MAX = 100.0

    def __init__(self, config: SensorConfig):
        super().__init__(config)
        self._dht_device = None
        self._gpio_pin = None
        self._last_read_time = 0
        self._min_read_interval = 2.0  # DHT22 limitation

    async def initialize(self) -> bool:
        """Initialize DHT22 sensor"""
        try:
            if not DHT_AVAILABLE:
                logger.error("DHT library not available. Install with: pip install adafruit-circuitpython-dht")
                return False

            # Get GPIO pin from config
            pin_number = self.config.connection_params.get("pin")
            if pin_number is None:
                logger.error("GPIO pin not specified in configuration")
                return False

            # Map pin number to board pin
            pin_map = {
                4: board.D4,
                17: board.D17,
                18: board.D18,
                27: board.D27,
                22: board.D22,
                23: board.D23,
                24: board.D24,
                25: board.D25,
            }

            self._gpio_pin = pin_map.get(pin_number)
            if self._gpio_pin is None:
                logger.error(f"Pin {pin_number} not supported. Supported pins: {list(pin_map.keys())}")
                return False

            # Initialize DHT device
            self._dht_device = adafruit_dht.DHT22(self._gpio_pin, use_pulseio=False)

            # Define sensor entities
            self._entities = [
                SensorEntity(
                    id=f"{self.config.name}_temperature",
                    name="Temperature",
                    unit="°C",
                    sensor_type=SensorType.TEMPERATURE,
                    min_value=self.TEMP_MIN,
                    max_value=self.TEMP_MAX,
                    precision=1,
                ),
                SensorEntity(
                    id=f"{self.config.name}_humidity",
                    name="Humidity",
                    unit="%",
                    sensor_type=SensorType.HUMIDITY,
                    min_value=self.HUMID_MIN,
                    max_value=self.HUMID_MAX,
                    precision=1,
                ),
            ]

            self._is_initialized = True
            logger.info(f"DHT22 sensor initialized on GPIO pin {pin_number}")
            return True

        except Exception as e:
            logger.error(f"Failed to initialize DHT22 sensor: {e}")
            return False

    async def connect(self) -> bool:
        """Connect to DHT22 sensor"""
        if not self._is_initialized:
            logger.error("Sensor not initialized")
            return False

        # DHT22 doesn't require explicit connection
        self._is_connected = True
        logger.info("DHT22 sensor connected")
        return True

    async def disconnect(self) -> bool:
        """Disconnect from DHT22 sensor"""
        try:
            if self._dht_device:
                self._dht_device.exit()
            self._is_connected = False
            logger.info("DHT22 sensor disconnected")
            return True
        except Exception as e:
            logger.error(f"Failed to disconnect DHT22 sensor: {e}")
            return False

    async def read(self) -> List[SensorReading]:
        """Read temperature and humidity from DHT22"""
        if not self._is_connected:
            raise RuntimeError("Sensor not connected")

        # Enforce minimum read interval
        current_time = asyncio.get_event_loop().time()
        if current_time - self._last_read_time < self._min_read_interval:
            await asyncio.sleep(self._min_read_interval - (current_time - self._last_read_time))

        try:
            # Read sensor
            temperature = self._dht_device.temperature
            humidity = self._dht_device.humidity

            self._last_read_time = asyncio.get_event_loop().time()

            if temperature is None or humidity is None:
                raise RuntimeError("Failed to read sensor data")

            # Apply calibration
            temperature = self.apply_calibration(temperature, f"{self.config.name}_temperature")
            humidity = self.apply_calibration(humidity, f"{self.config.name}_humidity")

            # Create readings
            readings = [
                SensorReading(
                    entity_id=f"{self.config.name}_temperature",
                    value=round(temperature, 1),
                    quality=1.0,
                ),
                SensorReading(
                    entity_id=f"{self.config.name}_humidity",
                    value=round(humidity, 1),
                    quality=1.0,
                ),
            ]

            # Validate readings
            readings = [r for r in readings if self.validate_reading(r)]

            return readings

        except RuntimeError as e:
            logger.warning(f"DHT22 read error: {e}")
            # Return readings with low quality on transient errors
            return [
                SensorReading(
                    entity_id=f"{self.config.name}_temperature",
                    value=0.0,
                    quality=0.0,
                ),
                SensorReading(
                    entity_id=f"{self.config.name}_humidity",
                    value=0.0,
                    quality=0.0,
                ),
            ]
        except Exception as e:
            logger.error(f"DHT22 read failed: {e}")
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
            "sensor": "DHT22",
            "initialized": self._is_initialized,
            "connected": self._is_connected,
            "pin": self.config.connection_params.get("pin"),
        }

        if self._is_connected:
            try:
                readings = await self.read()
                results["test_reading"] = {
                    "success": len(readings) == 2,
                    "temperature": readings[0].value if len(readings) > 0 else None,
                    "humidity": readings[1].value if len(readings) > 1 else None,
                }
            except Exception as e:
                results["test_reading"] = {
                    "success": False,
                    "error": str(e),
                }

        return results
