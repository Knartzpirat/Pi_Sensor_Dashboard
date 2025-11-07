"""
Base classes for board/HAT implementations.

Boards handle the physical interface between the Raspberry Pi and sensors.
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any
from enum import Enum
from pydantic import BaseModel, Field


class VoltageLevel(str, Enum):
    """Supported voltage levels"""
    V3_3 = "3.3V"
    V5 = "5V"
    V12 = "12V"


class PinMode(str, Enum):
    """GPIO pin modes"""
    INPUT = "input"
    OUTPUT = "output"
    PWM = "pwm"
    I2C = "i2c"
    SPI = "spi"
    UART = "uart"


class PinPull(str, Enum):
    """Pull-up/down resistor configuration"""
    NONE = "none"
    PULL_UP = "pull_up"
    PULL_DOWN = "pull_down"


class BoardCapability(BaseModel):
    """Describes a board capability"""
    name: str = Field(..., description="Capability name")
    available: bool = Field(..., description="Whether capability is available")
    description: Optional[str] = Field(None, description="Capability description")
    metadata: Dict[str, Any] = Field(default_factory=dict)


class PinConfig(BaseModel):
    """Configuration for a single pin"""
    pin_number: int = Field(..., description="Physical pin number")
    mode: PinMode = Field(..., description="Pin mode")
    pull: PinPull = Field(PinPull.NONE, description="Pull-up/down configuration")
    initial_value: Optional[int] = Field(None, description="Initial value for outputs")
    pwm_frequency: Optional[int] = Field(None, description="PWM frequency in Hz")


class BoardConfig(BaseModel):
    """Configuration for a board instance"""
    board_type: str = Field(..., description="Board type identifier")
    name: str = Field(..., description="Board instance name")
    i2c_enabled: bool = Field(True, description="Enable I2C bus")
    spi_enabled: bool = Field(False, description="Enable SPI bus")
    i2c_bus: int = Field(1, description="I2C bus number")
    spi_bus: int = Field(0, description="SPI bus number")
    spi_device: int = Field(0, description="SPI device number")
    voltage_level: VoltageLevel = Field(
        VoltageLevel.V3_3,
        description="Default voltage level"
    )


class BaseBoard(ABC):
    """
    Abstract base class for all board implementations.

    Boards handle:
    - GPIO pin management
    - I2C/SPI bus initialization
    - Voltage level control (for custom boards)
    - Pin multiplexing
    - Power management
    """

    def __init__(self, config: BoardConfig):
        """
        Initialize board with configuration.

        Args:
            config: Board configuration object
        """
        self.config = config
        self._is_initialized = False
        self._capabilities: List[BoardCapability] = []

    @abstractmethod
    async def initialize(self) -> bool:
        """
        Initialize the board hardware.

        Returns:
            True if initialization successful, False otherwise
        """
        pass

    @abstractmethod
    async def cleanup(self) -> bool:
        """
        Cleanup board resources (called on shutdown).

        Returns:
            True if cleanup successful, False otherwise
        """
        pass

    @abstractmethod
    async def setup_pin(self, config: PinConfig) -> bool:
        """
        Configure a single GPIO pin.

        Args:
            config: Pin configuration

        Returns:
            True if setup successful, False otherwise
        """
        pass

    @abstractmethod
    async def read_digital(self, pin: int) -> bool:
        """
        Read digital value from a pin.

        Args:
            pin: Pin number

        Returns:
            Pin state (True=HIGH, False=LOW)
        """
        pass

    @abstractmethod
    async def write_digital(self, pin: int, value: bool) -> bool:
        """
        Write digital value to a pin.

        Args:
            pin: Pin number
            value: Value to write (True=HIGH, False=LOW)

        Returns:
            True if write successful, False otherwise
        """
        pass

    @abstractmethod
    async def read_analog(self, channel: int) -> float:
        """
        Read analog value from a channel.

        Args:
            channel: Analog channel number

        Returns:
            Analog value (implementation-specific range)
        """
        pass

    @abstractmethod
    async def write_pwm(self, pin: int, duty_cycle: float) -> bool:
        """
        Write PWM signal to a pin.

        Args:
            pin: Pin number
            duty_cycle: Duty cycle (0.0 to 1.0)

        Returns:
            True if write successful, False otherwise
        """
        pass

    @abstractmethod
    async def set_voltage_level(self, level: VoltageLevel, channel: Optional[int] = None) -> bool:
        """
        Set voltage level for a channel (custom boards only).

        Args:
            level: Voltage level to set
            channel: Optional channel number (None for all channels)

        Returns:
            True if successful, False otherwise
        """
        pass

    @abstractmethod
    def get_capabilities(self) -> List[BoardCapability]:
        """
        Get list of board capabilities.

        Returns:
            List of board capabilities
        """
        pass

    @abstractmethod
    async def get_i2c_bus(self) -> Any:
        """
        Get I2C bus object for sensor communication.

        Returns:
            I2C bus object (implementation-specific)
        """
        pass

    @abstractmethod
    async def get_spi_bus(self) -> Any:
        """
        Get SPI bus object for sensor communication.

        Returns:
            SPI bus object (implementation-specific)
        """
        pass

    @abstractmethod
    async def scan_i2c(self) -> List[int]:
        """
        Scan I2C bus for connected devices.

        Returns:
            List of I2C addresses
        """
        pass

    @abstractmethod
    async def self_test(self) -> Dict[str, Any]:
        """
        Perform board self-test.

        Returns:
            Dictionary with test results
        """
        pass

    # Common helper methods

    @property
    def is_initialized(self) -> bool:
        """Check if board is initialized"""
        return self._is_initialized

    def has_capability(self, capability_name: str) -> bool:
        """
        Check if board has a specific capability.

        Args:
            capability_name: Name of the capability

        Returns:
            True if capability exists and is available
        """
        cap = next(
            (c for c in self._capabilities if c.name == capability_name),
            None
        )
        return cap is not None and cap.available
