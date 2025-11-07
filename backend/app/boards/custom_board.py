"""
Custom Board Implementation with Voltage Selection

Custom HAT with:
- Voltage selection (3.3V, 5V, 12V) per channel
- Integrated I2C support
- Analog input via integrated ADC
- Digital I/O
- GPIO extension

This is a template for your custom board design.
Adjust the implementation according to your actual hardware specifications.
"""

import asyncio
from typing import Dict, List, Optional, Any
import logging

try:
    import RPi.GPIO as GPIO
    import smbus2
    import spidev
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


class CustomBoard(BaseBoard):
    """
    Custom board implementation with voltage selection and integrated ADC.

    Features:
    - Per-channel voltage selection (3.3V, 5V, 12V)
    - Integrated 16-bit ADC (e.g., ADS1115)
    - I2C and SPI support
    - Digital I/O
    - Overcurrent protection

    Hardware assumptions (adjust to your design):
    - Voltage control via GPIO pins + relays/MOSFETs
    - ADC connected via I2C (address 0x48)
    - Status LEDs on GPIO pins
    """

    # Hardware configuration (adjust to your design)
    ADC_I2C_ADDRESS = 0x48
    ADC_CHANNELS = 4
    ADC_VOLTAGE_RANGE = 6.144  # ±6.144V

    # Voltage control pins (example mapping)
    VOLTAGE_CONTROL_PINS = {
        VoltageLevel.V3_3: {
            "channel_1": 5,
            "channel_2": 6,
            "channel_3": 13,
            "channel_4": 19,
        },
        VoltageLevel.V5: {
            "channel_1": 12,
            "channel_2": 16,
            "channel_3": 20,
            "channel_4": 21,
        },
        VoltageLevel.V12: {
            "channel_1": 7,
            "channel_2": 8,
            "channel_3": 25,
            "channel_4": 24,
        },
    }

    # Status LED pins
    STATUS_LED_POWER = 17
    STATUS_LED_ERROR = 27
    STATUS_LED_ACTIVITY = 22

    def __init__(self, config: BoardConfig):
        super().__init__(config)
        self._i2c_bus = None
        self._spi_bus = None
        self._adc = None
        self._pwm_pins: Dict[int, Any] = {}
        self._configured_pins: Dict[int, PinConfig] = {}
        self._channel_voltages: Dict[str, VoltageLevel] = {}

    async def initialize(self) -> bool:
        """Initialize custom board"""
        try:
            if not GPIO_AVAILABLE:
                logger.error("RPi.GPIO not available")
                return False

            # Set GPIO mode
            GPIO.setmode(GPIO.BCM)
            GPIO.setwarnings(False)

            # Initialize voltage control pins
            await self._init_voltage_control()

            # Initialize status LEDs
            await self._init_status_leds()

            # Set power LED on
            GPIO.output(self.STATUS_LED_POWER, GPIO.HIGH)

            # Initialize I2C
            if self.config.i2c_enabled:
                self._i2c_bus = smbus2.SMBus(self.config.i2c_bus)
                logger.info(f"I2C bus {self.config.i2c_bus} initialized")

                # Initialize integrated ADC
                await self._init_adc()

            # Initialize SPI
            if self.config.spi_enabled:
                self._spi_bus = spidev.SpiDev()
                self._spi_bus.open(self.config.spi_bus, self.config.spi_device)
                self._spi_bus.max_speed_hz = 1000000
                logger.info(f"SPI bus initialized")

            # Define capabilities
            self._capabilities = [
                BoardCapability(
                    name="digital_io",
                    available=True,
                    description="Digital input/output"
                ),
                BoardCapability(
                    name="pwm",
                    available=True,
                    description="PWM output"
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
                    available=self._adc is not None,
                    description="16-bit ADC with 4 channels",
                    metadata={"channels": self.ADC_CHANNELS, "resolution": 16}
                ),
                BoardCapability(
                    name="voltage_control",
                    available=True,
                    description="Per-channel voltage selection (3.3V, 5V, 12V)",
                    metadata={"voltages": [v.value for v in VoltageLevel]}
                ),
                BoardCapability(
                    name="overcurrent_protection",
                    available=True,
                    description="Hardware overcurrent protection"
                ),
            ]

            self._is_initialized = True
            logger.info("Custom board initialized")
            return True

        except Exception as e:
            logger.error(f"Failed to initialize custom board: {e}")
            # Set error LED
            try:
                GPIO.output(self.STATUS_LED_ERROR, GPIO.HIGH)
            except:
                pass
            return False

    async def _init_voltage_control(self):
        """Initialize voltage control pins"""
        for voltage_level, channels in self.VOLTAGE_CONTROL_PINS.items():
            for channel, pin in channels.items():
                GPIO.setup(pin, GPIO.OUT, initial=GPIO.LOW)
                logger.debug(f"Voltage control pin {pin} ({voltage_level.value}/{channel}) initialized")

        # Set default voltage (3.3V) for all channels
        for i in range(1, 5):
            await self.set_voltage_level(VoltageLevel.V3_3, channel=i)

    async def _init_status_leds(self):
        """Initialize status LED pins"""
        GPIO.setup(self.STATUS_LED_POWER, GPIO.OUT, initial=GPIO.LOW)
        GPIO.setup(self.STATUS_LED_ERROR, GPIO.OUT, initial=GPIO.LOW)
        GPIO.setup(self.STATUS_LED_ACTIVITY, GPIO.OUT, initial=GPIO.LOW)
        logger.debug("Status LEDs initialized")

    async def _init_adc(self):
        """Initialize integrated ADC"""
        try:
            # Try to import ADS1115 library
            import adafruit_ads1x15.ads1115 as ADS
            from adafruit_ads1x15.analog_in import AnalogIn
            import board

            # Create ADC object
            i2c = board.I2C()
            self._adc = ADS.ADS1115(i2c, address=self.ADC_I2C_ADDRESS)

            # Configure gain (adjust based on your design)
            # ±6.144V range
            self._adc.gain = 2/3

            logger.info(f"ADC initialized at I2C address 0x{self.ADC_I2C_ADDRESS:02x}")

        except ImportError:
            logger.warning("ADS1x15 library not available. Install with: pip install adafruit-circuitpython-ads1x15")
            self._adc = None
        except Exception as e:
            logger.error(f"Failed to initialize ADC: {e}")
            self._adc = None

    async def cleanup(self) -> bool:
        """Cleanup board resources"""
        try:
            # Turn off all voltage outputs
            for i in range(1, 5):
                await self._set_all_voltages_off(i)

            # Turn off status LEDs
            GPIO.output(self.STATUS_LED_POWER, GPIO.LOW)
            GPIO.output(self.STATUS_LED_ERROR, GPIO.LOW)
            GPIO.output(self.STATUS_LED_ACTIVITY, GPIO.LOW)

            # Stop all PWM
            for pwm in self._pwm_pins.values():
                pwm.stop()

            # Close buses
            if self._i2c_bus:
                self._i2c_bus.close()
            if self._spi_bus:
                self._spi_bus.close()

            # Cleanup GPIO
            GPIO.cleanup()

            self._is_initialized = False
            logger.info("Custom board cleaned up")
            return True

        except Exception as e:
            logger.error(f"Failed to cleanup custom board: {e}")
            return False

    async def _set_all_voltages_off(self, channel: int):
        """Turn off all voltage levels for a channel"""
        channel_name = f"channel_{channel}"
        for voltage_level, channels in self.VOLTAGE_CONTROL_PINS.items():
            if channel_name in channels:
                GPIO.output(channels[channel_name], GPIO.LOW)

    async def setup_pin(self, config: PinConfig) -> bool:
        """Configure a pin"""
        try:
            pin = config.pin_number

            pull_map = {
                PinPull.NONE: GPIO.PUD_OFF,
                PinPull.PULL_UP: GPIO.PUD_UP,
                PinPull.PULL_DOWN: GPIO.PUD_DOWN,
            }

            if config.mode == PinMode.INPUT:
                GPIO.setup(pin, GPIO.IN, pull_up_down=pull_map[config.pull])
            elif config.mode == PinMode.OUTPUT:
                GPIO.setup(pin, GPIO.OUT)
                if config.initial_value is not None:
                    GPIO.output(pin, config.initial_value)
            elif config.mode == PinMode.PWM:
                GPIO.setup(pin, GPIO.OUT)
                frequency = config.pwm_frequency or 1000
                self._pwm_pins[pin] = GPIO.PWM(pin, frequency)
                self._pwm_pins[pin].start(0)

            self._configured_pins[pin] = config
            logger.info(f"Pin {pin} configured as {config.mode.value}")
            return True

        except Exception as e:
            logger.error(f"Failed to setup pin {config.pin_number}: {e}")
            return False

    async def read_digital(self, pin: int) -> bool:
        """Read digital value"""
        return GPIO.input(pin) == GPIO.HIGH

    async def write_digital(self, pin: int, value: bool) -> bool:
        """Write digital value"""
        try:
            GPIO.output(pin, GPIO.HIGH if value else GPIO.LOW)
            # Blink activity LED
            GPIO.output(self.STATUS_LED_ACTIVITY, GPIO.HIGH)
            await asyncio.sleep(0.01)
            GPIO.output(self.STATUS_LED_ACTIVITY, GPIO.LOW)
            return True
        except Exception as e:
            logger.error(f"Failed to write pin {pin}: {e}")
            return False

    async def read_analog(self, channel: int) -> float:
        """Read analog value from integrated ADC"""
        if not self._adc:
            raise RuntimeError("ADC not initialized")

        if channel < 0 or channel >= self.ADC_CHANNELS:
            raise ValueError(f"Invalid ADC channel: {channel}")

        try:
            # Read voltage from ADC channel
            import adafruit_ads1x15.ads1115 as ADS
            from adafruit_ads1x15.analog_in import AnalogIn

            # Create analog input
            channel_map = [ADS.P0, ADS.P1, ADS.P2, ADS.P3]
            analog_in = AnalogIn(self._adc, channel_map[channel])

            # Return voltage
            return analog_in.voltage

        except Exception as e:
            logger.error(f"Failed to read ADC channel {channel}: {e}")
            raise

    async def write_pwm(self, pin: int, duty_cycle: float) -> bool:
        """Write PWM signal"""
        try:
            if pin not in self._pwm_pins:
                return False

            duty_cycle = max(0.0, min(1.0, duty_cycle)) * 100
            self._pwm_pins[pin].ChangeDutyCycle(duty_cycle)
            return True

        except Exception as e:
            logger.error(f"Failed to write PWM to pin {pin}: {e}")
            return False

    async def set_voltage_level(self, level: VoltageLevel, channel: Optional[int] = None) -> bool:
        """Set voltage level for a channel"""
        try:
            channels = [channel] if channel else range(1, 5)

            for ch in channels:
                channel_name = f"channel_{ch}"

                # Turn off all voltages for this channel first
                await self._set_all_voltages_off(ch)

                # Turn on requested voltage
                if channel_name in self.VOLTAGE_CONTROL_PINS[level]:
                    pin = self.VOLTAGE_CONTROL_PINS[level][channel_name]
                    GPIO.output(pin, GPIO.HIGH)
                    self._channel_voltages[channel_name] = level
                    logger.info(f"Channel {ch} voltage set to {level.value}")

            return True

        except Exception as e:
            logger.error(f"Failed to set voltage level: {e}")
            GPIO.output(self.STATUS_LED_ERROR, GPIO.HIGH)
            return False

    def get_capabilities(self) -> List[BoardCapability]:
        """Get board capabilities"""
        return self._capabilities

    async def get_i2c_bus(self) -> Any:
        """Get I2C bus"""
        if not self._i2c_bus:
            raise RuntimeError("I2C not initialized")
        return self._i2c_bus

    async def get_spi_bus(self) -> Any:
        """Get SPI bus"""
        if not self._spi_bus:
            raise RuntimeError("SPI not initialized")
        return self._spi_bus

    async def scan_i2c(self) -> List[int]:
        """Scan I2C bus"""
        if not self._i2c_bus:
            return []

        devices = []
        for address in range(0x03, 0x78):
            try:
                self._i2c_bus.read_byte(address)
                devices.append(address)
            except:
                pass
        return devices

    async def self_test(self) -> Dict[str, Any]:
        """Perform board self-test"""
        results = {
            "board": "Custom",
            "initialized": self._is_initialized,
            "voltage_channels": len(self._channel_voltages),
            "channel_voltages": {k: v.value for k, v in self._channel_voltages.items()},
        }

        if self._adc:
            results["adc"] = {
                "available": True,
                "channels": self.ADC_CHANNELS,
                "address": f"0x{self.ADC_I2C_ADDRESS:02x}",
            }

        if self._i2c_bus:
            devices = await self.scan_i2c()
            results["i2c"] = {
                "enabled": True,
                "devices_found": len(devices),
                "addresses": [f"0x{d:02x}" for d in devices],
            }

        return results
