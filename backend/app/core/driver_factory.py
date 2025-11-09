"""
Driver Factory

Automatically selects real or dummy drivers based on configuration
and platform availability.
"""

import sys
import logging
from typing import Type, Dict, Any

from app.models.sensor_base import BaseSensor, SensorConfig
from app.models.board_base import BaseBoard, BoardConfig
from app.config.settings import settings

logger = logging.getLogger(__name__)


class DriverFactory:
    """
    Factory for creating sensor and board drivers.

    Automatically switches between real and dummy drivers based on:
    - Configuration (USE_DUMMY_DRIVERS env var)
    - Platform (Windows = dummy, Linux = try real then dummy)
    - Hardware availability (if real driver fails, fall back to dummy)
    """

    # Mapping of driver names to real driver classes
    _SENSOR_DRIVERS: Dict[str, str] = {
        "DHT22": "app.sensors.dht22_driver.DHT22Driver",
        "DHT11": "app.sensors.dht22_driver.DHT22Driver",  # Same driver
        "BMP280": "app.sensors.bmp280_driver.BMP280Driver",
        "BME280": "app.sensors.bmp280_driver.BMP280Driver",  # Similar driver
        "ADS1115": "app.sensors.ads1115_driver.ADS1115Driver",  # TODO: implement
        "Analog": "app.sensors.analog_driver.AnalogDriver",  # TODO: implement
    }

    _BOARD_DRIVERS: Dict[str, str] = {
        "GPIO": "app.boards.gpio_board.GPIOBoard",
        "CUSTOM": "app.boards.custom_board.CustomBoard",
    }

    @staticmethod
    def should_use_dummy() -> bool:
        """
        Determine if dummy drivers should be used.

        Returns:
            True if dummy drivers should be used
        """
        # Explicit configuration
        if settings.use_dummy_drivers:
            logger.info("Using dummy drivers (configured via USE_DUMMY_DRIVERS=true)")
            return True

        # Platform detection
        if sys.platform == "win32":
            logger.info("Using dummy drivers (Windows platform detected)")
            return True

        # TODO: Add hardware detection on Linux
        # For now, use real drivers on Linux unless explicitly configured
        return False

    @classmethod
    def create_sensor(cls, config: SensorConfig) -> BaseSensor:
        """
        Create a sensor driver instance.

        Args:
            config: Sensor configuration

        Returns:
            Sensor driver instance (real or dummy)

        Raises:
            ValueError: If driver not found or creation failed
        """
        driver_name = config.driver

        # Force dummy mode if configured
        if cls.should_use_dummy():
            return cls._create_dummy_sensor(config)

        # Try to create real driver
        try:
            driver_class_path = cls._SENSOR_DRIVERS.get(driver_name)
            if not driver_class_path:
                logger.warning(f"Unknown sensor driver: {driver_name}, using dummy")
                return cls._create_dummy_sensor(config)

            # Import and instantiate real driver
            module_path, class_name = driver_class_path.rsplit(".", 1)
            module = __import__(module_path, fromlist=[class_name])
            driver_class: Type[BaseSensor] = getattr(module, class_name)

            logger.info(f"Creating real sensor driver: {driver_name}")
            return driver_class(config)

        except ImportError as e:
            logger.warning(f"Real driver not available ({e}), falling back to dummy")
            return cls._create_dummy_sensor(config)
        except Exception as e:
            logger.error(f"Failed to create real sensor driver: {e}, falling back to dummy")
            return cls._create_dummy_sensor(config)

    @classmethod
    def _create_dummy_sensor(cls, config: SensorConfig) -> BaseSensor:
        """
        Create a dummy sensor driver.

        Args:
            config: Sensor configuration

        Returns:
            Dummy sensor driver instance
        """
        driver_name = config.driver

        # Map to specific dummy drivers
        dummy_drivers = {
            "DHT22": "app.sensors.dht22_dummy_driver.DHT22DummyDriver",
            "DHT11": "app.sensors.dht22_dummy_driver.DHT22DummyDriver",  # Same as DHT22
            "BMP280": "app.sensors.bmp280_dummy_driver.BMP280DummyDriver",
            "BME280": "app.sensors.bmp280_dummy_driver.BMP280DummyDriver",  # Similar to BMP280
        }

        driver_path = dummy_drivers.get(driver_name)

        if driver_path:
            # Use specific dummy driver
            try:
                module_path, class_name = driver_path.rsplit(".", 1)
                module = __import__(module_path, fromlist=[class_name])
                driver_class: Type[BaseSensor] = getattr(module, class_name)
                logger.info(f"Creating specific dummy sensor driver: {driver_name}")
                return driver_class(config)
            except Exception as e:
                logger.warning(f"Failed to load specific dummy driver: {e}, using generic")

        # Fallback to generic dummy driver
        from app.sensors.dummy_sensor_driver import DummySensorDriver

        # Add sensor model to connection params if not present
        if "sensor_model" not in config.connection_params:
            config.connection_params["sensor_model"] = config.driver

        logger.info(f"Creating generic dummy sensor driver: {config.driver}")
        return DummySensorDriver(config)

    @classmethod
    def create_board(cls, config: BoardConfig) -> BaseBoard:
        """
        Create a board driver instance.

        Args:
            config: Board configuration

        Returns:
            Board driver instance (real or dummy)

        Raises:
            ValueError: If driver not found or creation failed
        """
        board_type = config.board_type

        # Force dummy mode if configured
        if cls.should_use_dummy():
            return cls._create_dummy_board(config)

        # Try to create real driver
        try:
            driver_class_path = cls._BOARD_DRIVERS.get(board_type)
            if not driver_class_path:
                logger.warning(f"Unknown board type: {board_type}, using dummy")
                return cls._create_dummy_board(config)

            # Import and instantiate real driver
            module_path, class_name = driver_class_path.rsplit(".", 1)
            module = __import__(module_path, fromlist=[class_name])
            driver_class: Type[BaseBoard] = getattr(module, class_name)

            logger.info(f"Creating real board driver: {board_type}")
            return driver_class(config)

        except ImportError as e:
            logger.warning(f"Real board driver not available ({e}), falling back to dummy")
            return cls._create_dummy_board(config)
        except Exception as e:
            logger.error(f"Failed to create real board driver: {e}, falling back to dummy")
            return cls._create_dummy_board(config)

    @classmethod
    def _create_dummy_board(cls, config: BoardConfig) -> BaseBoard:
        """
        Create a dummy board driver.

        Args:
            config: Board configuration

        Returns:
            Dummy board driver instance
        """
        from app.boards.dummy_board import DummyBoard

        logger.info(f"Creating dummy board driver: {config.board_type}")
        return DummyBoard(config)

    @classmethod
    def list_available_sensors(cls) -> Dict[str, Dict[str, Any]]:
        """
        List all available sensor drivers.

        Returns:
            Dictionary of sensor drivers with metadata
        """
        sensors = {}

        for driver_name, driver_path in cls._SENSOR_DRIVERS.items():
            sensors[driver_name] = {
                "name": driver_name,
                "available": not cls.should_use_dummy(),  # Dummy always available
                "dummy_available": True,
                "driver_path": driver_path,
            }

        return sensors

    @classmethod
    def list_available_boards(cls) -> Dict[str, Dict[str, Any]]:
        """
        List all available board drivers.

        Returns:
            Dictionary of board drivers with metadata
        """
        boards = {}

        for board_type, driver_path in cls._BOARD_DRIVERS.items():
            boards[board_type] = {
                "name": board_type,
                "available": not cls.should_use_dummy(),
                "dummy_available": True,
                "driver_path": driver_path,
            }

        return boards
