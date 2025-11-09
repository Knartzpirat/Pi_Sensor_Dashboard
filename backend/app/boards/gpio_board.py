"""
Standard Raspberry Pi GPIO Board Implementation

Direct GPIO access using RPi.GPIO library.
"""

import asyncio
from typing import Dict, List, Optional, Any
import logging

try:
    import RPi.GPIO as GPIO
    import smbus2
    GPIO_AVAILABLE = True
except ImportError:
    GPIO_AVAILABLE = False

from app.models.board_base import (
    BaseBoard,
    BoardConfig,
    BoardCapability,
    PinConfig,
    PinMode,
    PinPull,
    VoltageLevel,
)

logger = logging.getLogger(__name__)


class GPIOBoard(BaseBoard):
    """
    Standard Raspberry Pi GPIO board implementation.

    Provides:
    - Digital I/O via GPIO pins
    - PWM output
    - I2C communication (via smbus2)
    - SPI communication (via spidev)

    Note: Analog input requires external ADC (e.g., MCP3008, ADS1115)
    """

    def __init__(self, config: BoardConfig):
        super().__init__(config)
        self._i2c_bus = None
        self._spi_bus = None
        self._pwm_pins: Dict[int, Any] = {}
        self._configured_pins: Dict[int, PinConfig] = {}

    async def initialize(self) -> bool:
        """Initialize GPIO board"""
        try:
            if not GPIO_AVAILABLE:
                logger.error("RPi.GPIO not available. Install with: pip install RPi.GPIO")
                return False

            # Set GPIO mode to BCM (Broadcom SOC channel numbering)
            GPIO.setmode(GPIO.BCM)

            # Disable warnings (useful for development)
            GPIO.setwarnings(False)

            # Initialize I2C if enabled
            if self.config.i2c_enabled:
                try:
                    self._i2c_bus = smbus2.SMBus(self.config.i2c_bus)
                    logger.info(f"I2C bus {self.config.i2c_bus} initialized")
                except Exception as e:
                    logger.warning(f"Failed to initialize I2C: {e}")

            # Initialize SPI if enabled
            if self.config.spi_enabled:
                try:
                    import spidev
                    self._spi_bus = spidev.SpiDev()
                    self._spi_bus.open(self.config.spi_bus, self.config.spi_device)
                    self._spi_bus.max_speed_hz = 1000000
                    logger.info(f"SPI bus {self.config.spi_bus}.{self.config.spi_device} initialized")
                except Exception as e:
                    logger.warning(f"Failed to initialize SPI: {e}")

            # Define capabilities
            self._capabilities = [
                BoardCapability(
                    name="digital_io",
                    available=True,
                    description="Digital input/output on GPIO pins"
                ),
                BoardCapability(
                    name="pwm",
                    available=True,
                    description="Hardware and software PWM output"
                ),
                BoardCapability(
                    name="i2c",
                    available=self._i2c_bus is not None,
                    description="I2C communication"
                ),
                BoardCapability(
                    name="spi",
                    available=self._spi_bus is not None,
                    description="SPI communication"
                ),
                BoardCapability(
                    name="analog_input",
                    available=False,
                    description="Requires external ADC"
                ),
                BoardCapability(
                    name="voltage_control",
                    available=False,
                    description="Not available on standard GPIO"
                ),
            ]

            self._is_initialized = True
            logger.info("GPIO board initialized")
            return True

        except Exception as e:
            logger.error(f"Failed to initialize GPIO board: {e}")
            return False

    async def cleanup(self) -> bool:
        """Cleanup GPIO resources"""
        try:
            # Stop all PWM pins
            for pwm in self._pwm_pins.values():
                pwm.stop()
            self._pwm_pins.clear()

            # Close I2C bus
            if self._i2c_bus:
                self._i2c_bus.close()

            # Close SPI bus
            if self._spi_bus:
                self._spi_bus.close()

            # Cleanup GPIO
            GPIO.cleanup()

            self._is_initialized = False
            logger.info("GPIO board cleaned up")
            return True

        except Exception as e:
            logger.error(f"Failed to cleanup GPIO board: {e}")
            return False

    async def setup_pin(self, config: PinConfig) -> bool:
        """Configure a GPIO pin"""
        try:
            pin = config.pin_number

            # Setup pull-up/down resistor
            pull_map = {
                PinPull.NONE: GPIO.PUD_OFF,
                PinPull.PULL_UP: GPIO.PUD_UP,
                PinPull.PULL_DOWN: GPIO.PUD_DOWN,
            }

            if config.mode == PinMode.INPUT:
                GPIO.setup(pin, GPIO.IN, pull_up_down=pull_map[config.pull])
                logger.info(f"Pin {pin} configured as INPUT with pull={config.pull.value}")

            elif config.mode == PinMode.OUTPUT:
                GPIO.setup(pin, GPIO.OUT)
                if config.initial_value is not None:
                    GPIO.output(pin, config.initial_value)
                logger.info(f"Pin {pin} configured as OUTPUT with initial={config.initial_value}")

            elif config.mode == PinMode.PWM:
                GPIO.setup(pin, GPIO.OUT)
                frequency = config.pwm_frequency or 1000  # Default 1kHz
                self._pwm_pins[pin] = GPIO.PWM(pin, frequency)
                self._pwm_pins[pin].start(0)
                logger.info(f"Pin {pin} configured as PWM at {frequency}Hz")

            else:
                logger.error(f"Pin mode {config.mode.value} not supported for standard GPIO")
                return False

            self._configured_pins[pin] = config
            return True

        except Exception as e:
            logger.error(f"Failed to setup pin {config.pin_number}: {e}")
            return False

    async def read_digital(self, pin: int) -> bool:
        """Read digital value from pin"""
        try:
            return GPIO.input(pin) == GPIO.HIGH
        except Exception as e:
            logger.error(f"Failed to read pin {pin}: {e}")
            raise

    async def write_digital(self, pin: int, value: bool) -> bool:
        """Write digital value to pin"""
        try:
            GPIO.output(pin, GPIO.HIGH if value else GPIO.LOW)
            return True
        except Exception as e:
            logger.error(f"Failed to write pin {pin}: {e}")
            return False

    async def read_analog(self, channel: int) -> float:
        """Read analog value (requires external ADC)"""
        logger.error("Analog input not available on standard GPIO. Use external ADC.")
        raise NotImplementedError("Analog input requires external ADC")

    async def write_pwm(self, pin: int, duty_cycle: float) -> bool:
        """Write PWM signal to pin"""
        try:
            if pin not in self._pwm_pins:
                logger.error(f"Pin {pin} not configured for PWM")
                return False

            # Clamp duty cycle to 0-100
            duty_cycle = max(0.0, min(1.0, duty_cycle)) * 100
            self._pwm_pins[pin].ChangeDutyCycle(duty_cycle)
            return True

        except Exception as e:
            logger.error(f"Failed to write PWM to pin {pin}: {e}")
            return False

    async def set_voltage_level(self, level: VoltageLevel, channel: Optional[int] = None) -> bool:
        """Set voltage level (not available on standard GPIO)"""
        logger.warning("Voltage level control not available on standard GPIO board")
        return False

    def get_capabilities(self) -> List[BoardCapability]:
        """Get board capabilities"""
        return self._capabilities

    async def get_i2c_bus(self) -> Any:
        """Get I2C bus object"""
        if not self._i2c_bus:
            raise RuntimeError("I2C not initialized")
        return self._i2c_bus

    async def get_spi_bus(self) -> Any:
        """Get SPI bus object"""
        if not self._spi_bus:
            raise RuntimeError("SPI not initialized")
        return self._spi_bus

    async def scan_i2c(self) -> List[int]:
        """Scan I2C bus for connected devices"""
        if not self._i2c_bus:
            return []

        try:
            devices = []
            for address in range(0x03, 0x78):
                try:
                    self._i2c_bus.read_byte(address)
                    devices.append(address)
                except Exception:
                    pass
            logger.info(f"I2C scan found {len(devices)} devices: {[f'0x{d:02x}' for d in devices]}")
            return devices
        except Exception as e:
            logger.error(f"I2C scan failed: {e}")
            return []

    async def self_test(self) -> Dict[str, Any]:
        """Perform board self-test"""
        results = {
            "board": "GPIO",
            "initialized": self._is_initialized,
            "gpio_mode": "BCM",
            "configured_pins": len(self._configured_pins),
            "pwm_pins": len(self._pwm_pins),
        }

        if self._i2c_bus:
            devices = await self.scan_i2c()
            results["i2c"] = {
                "enabled": True,
                "bus": self.config.i2c_bus,
                "devices_found": len(devices),
                "addresses": [f"0x{d:02x}" for d in devices],
            }

        if self._spi_bus:
            results["spi"] = {
                "enabled": True,
                "bus": self.config.spi_bus,
                "device": self.config.spi_device,
            }

        return results
