"""
BMP280 Barometric Pressure and Temperature Sensor Driver

Supports BMP280 digital barometric pressure and temperature sensor
connected via I2C or SPI.
"""

import asyncio
from typing import List, Dict, Any
import logging

try:
    import board
    import adafruit_bmp280
    BMP280_AVAILABLE = True
except ImportError:
    BMP280_AVAILABLE = False

from app.models.sensor_base import (
    BaseSensor,
    SensorConfig,
    SensorEntity,
    SensorReading,
    SensorType,
    ConnectionType,
)

logger = logging.getLogger(__name__)


class BMP280Driver(BaseSensor):
    """
    Driver for BMP280 barometric pressure and temperature sensor.

    Connection: I2C or SPI
    Provides: Temperature (°C) and Pressure (hPa)

    Configuration example (I2C):
    {
        "name": "Pressure Sensor",
        "driver": "BMP280Driver",
        "connection_type": "i2c",
        "connection_params": {
            "address": 0x77,  # Or 0x76
            "bus": 1
        },
        "poll_interval": 1.0
    }
    """

    # BMP280 specifications
    TEMP_MIN = -40.0
    TEMP_MAX = 85.0
    PRESSURE_MIN = 300.0
    PRESSURE_MAX = 1100.0

    # I2C addresses
    ADDRESS_PRIMARY = 0x77
    ADDRESS_SECONDARY = 0x76

    def __init__(self, config: SensorConfig):
        super().__init__(config)
        self._bmp_device = None
        self._i2c_bus = None

    async def initialize(self) -> bool:
        """Initialize BMP280 sensor"""
        try:
            if not BMP280_AVAILABLE:
                logger.error("BMP280 library not available. Install with: pip install adafruit-circuitpython-bmp280")
                return False

            # Get I2C address from config
            i2c_address = self.config.connection_params.get("address", self.ADDRESS_PRIMARY)

            # Initialize I2C bus
            self._i2c_bus = board.I2C()

            # Initialize BMP280 device
            self._bmp_device = adafruit_bmp280.Adafruit_BMP280_I2C(
                self._i2c_bus,
                address=i2c_address
            )

            # Configure sensor
            # Set sea level pressure for altitude calculations
            self._bmp_device.sea_level_pressure = 1013.25

            # Define sensor entities
            self._entities = [
                SensorEntity(
                    id=f"{self.config.name}_temperature",
                    name="Temperature",
                    unit="°C",
                    sensor_type=SensorType.TEMPERATURE,
                    min_value=self.TEMP_MIN,
                    max_value=self.TEMP_MAX,
                    precision=2,
                ),
                SensorEntity(
                    id=f"{self.config.name}_pressure",
                    name="Pressure",
                    unit="hPa",
                    sensor_type=SensorType.PRESSURE,
                    min_value=self.PRESSURE_MIN,
                    max_value=self.PRESSURE_MAX,
                    precision=1,
                ),
                SensorEntity(
                    id=f"{self.config.name}_altitude",
                    name="Altitude",
                    unit="m",
                    sensor_type=SensorType.CUSTOM,
                    min_value=-500.0,
                    max_value=9000.0,
                    precision=1,
                ),
            ]

            self._is_initialized = True
            logger.info(f"BMP280 sensor initialized at I2C address 0x{i2c_address:02x}")
            return True

        except Exception as e:
            logger.error(f"Failed to initialize BMP280 sensor: {e}")
            return False

    async def connect(self) -> bool:
        """Connect to BMP280 sensor"""
        if not self._is_initialized:
            logger.error("Sensor not initialized")
            return False

        # BMP280 doesn't require explicit connection
        self._is_connected = True
        logger.info("BMP280 sensor connected")
        return True

    async def disconnect(self) -> bool:
        """Disconnect from BMP280 sensor"""
        try:
            if self._i2c_bus:
                self._i2c_bus.deinit()
            self._is_connected = False
            logger.info("BMP280 sensor disconnected")
            return True
        except Exception as e:
            logger.error(f"Failed to disconnect BMP280 sensor: {e}")
            return False

    async def read(self) -> List[SensorReading]:
        """Read temperature, pressure, and altitude from BMP280"""
        if not self._is_connected:
            raise RuntimeError("Sensor not connected")

        try:
            # Read sensor
            temperature = self._bmp_device.temperature
            pressure = self._bmp_device.pressure
            altitude = self._bmp_device.altitude

            # Apply calibration
            temperature = self.apply_calibration(temperature, f"{self.config.name}_temperature")
            pressure = self.apply_calibration(pressure, f"{self.config.name}_pressure")
            altitude = self.apply_calibration(altitude, f"{self.config.name}_altitude")

            # Create readings
            readings = [
                SensorReading(
                    entity_id=f"{self.config.name}_temperature",
                    value=round(temperature, 2),
                    quality=1.0,
                ),
                SensorReading(
                    entity_id=f"{self.config.name}_pressure",
                    value=round(pressure, 1),
                    quality=1.0,
                ),
                SensorReading(
                    entity_id=f"{self.config.name}_altitude",
                    value=round(altitude, 1),
                    quality=1.0,
                ),
            ]

            # Validate readings
            readings = [r for r in readings if self.validate_reading(r)]

            return readings

        except Exception as e:
            logger.error(f"BMP280 read failed: {e}")
            raise

    def get_entities(self) -> List[SensorEntity]:
        """Get sensor entities"""
        return self._entities

    async def calibrate(self, calibration_data: Dict[str, float]) -> bool:
        """Apply calibration to sensor"""
        try:
            self.config.calibration = calibration_data

            # Update sea level pressure if provided
            if "sea_level_pressure" in calibration_data:
                self._bmp_device.sea_level_pressure = calibration_data["sea_level_pressure"]

            logger.info(f"Calibration applied: {calibration_data}")
            return True
        except Exception as e:
            logger.error(f"Calibration failed: {e}")
            return False

    async def self_test(self) -> Dict[str, Any]:
        """Perform sensor self-test"""
        results = {
            "sensor": "BMP280",
            "initialized": self._is_initialized,
            "connected": self._is_connected,
            "i2c_address": f"0x{self.config.connection_params.get('address', self.ADDRESS_PRIMARY):02x}",
        }

        if self._is_connected:
            try:
                readings = await self.read()
                results["test_reading"] = {
                    "success": len(readings) == 3,
                    "temperature": readings[0].value if len(readings) > 0 else None,
                    "pressure": readings[1].value if len(readings) > 1 else None,
                    "altitude": readings[2].value if len(readings) > 2 else None,
                }
            except Exception as e:
                results["test_reading"] = {
                    "success": False,
                    "error": str(e),
                }

        return results

    async def set_sampling_mode(self, mode: str) -> bool:
        """
        Set sampling mode for better accuracy or power consumption.

        Args:
            mode: One of "low_power", "normal", "high_res", "ultra_high_res"

        Returns:
            True if successful
        """
        try:
            mode_map = {
                "low_power": (
                    adafruit_bmp280.MODE_NORMAL,
                    adafruit_bmp280.OVERSCAN_X1,
                    adafruit_bmp280.OVERSCAN_X1,
                ),
                "normal": (
                    adafruit_bmp280.MODE_NORMAL,
                    adafruit_bmp280.OVERSCAN_X2,
                    adafruit_bmp280.OVERSCAN_X16,
                ),
                "high_res": (
                    adafruit_bmp280.MODE_NORMAL,
                    adafruit_bmp280.OVERSCAN_X4,
                    adafruit_bmp280.OVERSCAN_X16,
                ),
                "ultra_high_res": (
                    adafruit_bmp280.MODE_NORMAL,
                    adafruit_bmp280.OVERSCAN_X8,
                    adafruit_bmp280.OVERSCAN_X16,
                ),
            }

            if mode not in mode_map:
                logger.error(f"Invalid mode: {mode}")
                return False

            mode_config, temp_overscan, pressure_overscan = mode_map[mode]
            self._bmp_device.mode = mode_config
            self._bmp_device.overscan_temperature = temp_overscan
            self._bmp_device.overscan_pressure = pressure_overscan

            logger.info(f"Sampling mode set to: {mode}")
            return True

        except Exception as e:
            logger.error(f"Failed to set sampling mode: {e}")
            return False
