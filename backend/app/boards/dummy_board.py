"""
Dummy Board Implementation for Windows Development

This board simulates GPIO, I2C, and ADC functionality for development
on Windows where actual hardware is not available.
"""

import asyncio
import random
import logging
from typing import List, Dict, Any, Optional

from app.models.board_base import (
    BaseBoard,
    BoardConfig,
    BoardCapability,
    PinConfig,
    PinMode,
    VoltageLevel,
)

logger = logging.getLogger(__name__)


class DummyBoard(BaseBoard):
    """
    Dummy board implementation for development without Raspberry Pi hardware.

    Simulates:
    - GPIO pins (digital I/O)
    - I2C bus with virtual devices
    - ADC channels (for Custom Board mode)
    - Voltage level control
    - Pin configuration

    Works on any platform (Windows, Linux, macOS) for development.
    """

    def __init__(self, config: BoardConfig):
        super().__init__(config)
        self._pin_states: Dict[int, bool] = {}
        self._pin_configs: Dict[int, PinConfig] = {}
        self._pwm_values: Dict[int, float] = {}
        self._analog_values: Dict[int, float] = {}
        self._voltage_levels: Dict[int, VoltageLevel] = {}
        self._i2c_devices: List[int] = []  # Simulated I2C device addresses

        # Simulate some common I2C devices
        self._i2c_devices = [0x76, 0x77]  # Common BMP280 addresses

    async def initialize(self) -> bool:
        """Initialize dummy board"""
        try:
            logger.info(f"Initializing dummy board: {self.config.name} ({self.config.board_type})")

            # Define capabilities based on board type
            if self.config.board_type == "GPIO":
                self._capabilities = [
                    BoardCapability(
                        name="gpio",
                        available=True,
                        description="Digital GPIO pins",
                        metadata={"pin_count": 28}
                    ),
                    BoardCapability(
                        name="i2c",
                        available=self.config.i2c_enabled,
                        description="I2C communication bus",
                        metadata={"bus": self.config.i2c_bus}
                    ),
                    BoardCapability(
                        name="pwm",
                        available=True,
                        description="PWM output",
                        metadata={"channels": 2}
                    ),
                    BoardCapability(
                        name="adc",
                        available=False,
                        description="Analog input (not available on GPIO board)",
                    ),
                ]
            else:  # CUSTOM board
                self._capabilities = [
                    BoardCapability(
                        name="gpio",
                        available=True,
                        description="Digital GPIO pins",
                        metadata={"channels": 8}
                    ),
                    BoardCapability(
                        name="i2c",
                        available=self.config.i2c_enabled,
                        description="I2C communication bus with multiplexer",
                        metadata={
                            "bus": self.config.i2c_bus,
                            "multiplexer": "TCA9548A",
                            "channels": 8
                        }
                    ),
                    BoardCapability(
                        name="adc",
                        available=True,
                        description="16-bit ADC with voltage reference",
                        metadata={
                            "channels": 8,
                            "resolution": 16,
                            "max_voltage": 5.0
                        }
                    ),
                    BoardCapability(
                        name="voltage_control",
                        available=True,
                        description="Per-channel voltage control",
                        metadata={
                            "levels": ["3.3V", "5V", "12V"],
                            "channels": 8
                        }
                    ),
                ]

            # Initialize default states
            for i in range(1, 29):  # GPIO pins
                self._pin_states[i] = False
                self._voltage_levels[i] = VoltageLevel.V3_3

            for i in range(8):  # ADC channels
                self._analog_values[i] = random.uniform(0.5, 3.0)

            self._is_initialized = True
            logger.info(f"Dummy board initialized with {len(self._capabilities)} capabilities")
            return True

        except Exception as e:
            logger.error(f"Failed to initialize dummy board: {e}")
            return False

    async def cleanup(self) -> bool:
        """Cleanup board resources"""
        try:
            logger.info("Cleaning up dummy board")
            self._pin_states.clear()
            self._pin_configs.clear()
            self._pwm_values.clear()
            self._is_initialized = False
            return True
        except Exception as e:
            logger.error(f"Failed to cleanup dummy board: {e}")
            return False

    async def setup_pin(self, config: PinConfig) -> bool:
        """Configure a GPIO pin"""
        try:
            logger.debug(f"Setting up pin {config.pin_number} as {config.mode}")
            self._pin_configs[config.pin_number] = config

            if config.mode == PinMode.OUTPUT and config.initial_value is not None:
                self._pin_states[config.pin_number] = bool(config.initial_value)

            return True
        except Exception as e:
            logger.error(f"Failed to setup pin {config.pin_number}: {e}")
            return False

    async def read_digital(self, pin: int) -> bool:
        """Read digital value from pin"""
        # Simulate occasional pin changes for testing
        if random.random() < 0.1:  # 10% chance to toggle
            self._pin_states[pin] = not self._pin_states.get(pin, False)

        value = self._pin_states.get(pin, False)
        logger.debug(f"Read digital pin {pin}: {value}")
        return value

    async def write_digital(self, pin: int, value: bool) -> bool:
        """Write digital value to pin"""
        try:
            self._pin_states[pin] = value
            logger.debug(f"Write digital pin {pin}: {value}")
            return True
        except Exception as e:
            logger.error(f"Failed to write pin {pin}: {e}")
            return False

    async def read_analog(self, channel: int) -> float:
        """Read analog value from channel"""
        if not self.has_capability("adc"):
            raise RuntimeError("ADC not available on this board")

        # Simulate slowly changing analog values
        current_value = self._analog_values.get(channel, 1.65)

        # Add small random walk
        delta = random.gauss(0, 0.05)
        new_value = current_value + delta

        # Clamp to valid range
        new_value = max(0.0, min(5.0, new_value))

        self._analog_values[channel] = new_value

        logger.debug(f"Read analog channel {channel}: {new_value:.3f}V")
        return new_value

    async def write_pwm(self, pin: int, duty_cycle: float) -> bool:
        """Write PWM signal to pin"""
        try:
            duty_cycle = max(0.0, min(1.0, duty_cycle))
            self._pwm_values[pin] = duty_cycle
            logger.debug(f"Write PWM pin {pin}: {duty_cycle:.2%}")
            return True
        except Exception as e:
            logger.error(f"Failed to write PWM pin {pin}: {e}")
            return False

    async def set_voltage_level(self, level: VoltageLevel, channel: Optional[int] = None) -> bool:
        """Set voltage level for a channel"""
        try:
            if not self.has_capability("voltage_control"):
                logger.warning("Voltage control not available on this board")
                return False

            if channel is None:
                # Set all channels
                for ch in range(8):
                    self._voltage_levels[ch] = level
                logger.info(f"Set all channels to {level.value}")
            else:
                self._voltage_levels[channel] = level
                logger.info(f"Set channel {channel} to {level.value}")

            return True
        except Exception as e:
            logger.error(f"Failed to set voltage level: {e}")
            return False

    def get_capabilities(self) -> List[BoardCapability]:
        """Get board capabilities"""
        return self._capabilities

    async def get_i2c_bus(self) -> Any:
        """Get simulated I2C bus"""
        if not self.has_capability("i2c"):
            raise RuntimeError("I2C not enabled on this board")

        logger.debug("Returning simulated I2C bus")
        return "DummyI2CBus"  # Placeholder

    async def get_spi_bus(self) -> Any:
        """Get simulated SPI bus"""
        if not self.config.spi_enabled:
            raise RuntimeError("SPI not enabled on this board")

        logger.debug("Returning simulated SPI bus")
        return "DummySPIBus"  # Placeholder

    async def scan_i2c(self) -> List[int]:
        """Scan for I2C devices"""
        if not self.has_capability("i2c"):
            raise RuntimeError("I2C not enabled on this board")

        logger.info(f"I2C scan found devices: {[f'0x{addr:02x}' for addr in self._i2c_devices]}")
        return self._i2c_devices

    async def self_test(self) -> Dict[str, Any]:
        """Perform board self-test"""
        results = {
            "board": self.config.board_type,
            "name": self.config.name,
            "initialized": self._is_initialized,
            "capabilities": len(self._capabilities),
            "tests": {},
        }

        # Test GPIO
        test_pin = 4
        await self.write_digital(test_pin, True)
        gpio_value = await self.read_digital(test_pin)
        results["tests"]["gpio"] = {
            "success": True,
            "test_pin": test_pin,
            "test_value": gpio_value,
        }

        # Test I2C
        if self.has_capability("i2c"):
            devices = await self.scan_i2c()
            results["tests"]["i2c"] = {
                "success": True,
                "devices_found": len(devices),
                "addresses": [f"0x{addr:02x}" for addr in devices],
            }

        # Test ADC
        if self.has_capability("adc"):
            test_channel = 0
            adc_value = await self.read_analog(test_channel)
            results["tests"]["adc"] = {
                "success": True,
                "test_channel": test_channel,
                "test_value": f"{adc_value:.3f}V",
            }

        # Test voltage control
        if self.has_capability("voltage_control"):
            success = await self.set_voltage_level(VoltageLevel.V5, 0)
            results["tests"]["voltage_control"] = {
                "success": success,
                "test_channel": 0,
                "test_level": VoltageLevel.V5.value,
            }

        return results

    async def select_i2c_channel(self, channel: int) -> bool:
        """
        Select I2C multiplexer channel (Custom Board only).

        Args:
            channel: Channel number (0-7)

        Returns:
            True if successful
        """
        if self.config.board_type != "CUSTOM":
            logger.warning("I2C multiplexer only available on Custom Board")
            return False

        if not (0 <= channel <= 7):
            logger.error(f"Invalid I2C channel: {channel}")
            return False

        logger.info(f"Selected I2C multiplexer channel {channel}")
        return True
