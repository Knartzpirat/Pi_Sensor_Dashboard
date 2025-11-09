"""
Test script for dummy drivers on Windows

Run this to verify that dummy drivers work correctly.
"""

import asyncio
import sys
from app.core.driver_factory import DriverFactory
from app.models.sensor_base import SensorConfig, ConnectionType
from app.models.board_base import BoardConfig, VoltageLevel


async def test_sensors():
    """Test dummy sensor drivers"""
    print("\n" + "=" * 60)
    print("TESTING SENSOR DRIVERS")
    print("=" * 60)

    # Test DHT22
    print("\n--- DHT22 Sensor (Temperature + Humidity) ---")
    dht_config = SensorConfig(
        name="Living Room",
        driver="DHT22",
        connection_type=ConnectionType.GPIO,
        connection_params={"pin": 4, "sensor_model": "DHT22"},
        poll_interval=2.0,
        enabled=True,
    )

    dht_sensor = DriverFactory.create_sensor(dht_config)
    await dht_sensor.initialize()
    await dht_sensor.connect()

    print(f"Entities: {[e.name for e in dht_sensor.get_entities()]}")

    print("\nReading 5 samples...")
    for i in range(5):
        readings = await dht_sensor.read()
        for reading in readings:
            entity_name = reading.entity_id.split("_")[-1].capitalize()
            print(f"  {entity_name}: {reading.value:.2f} (quality: {reading.quality:.2f})")
        await asyncio.sleep(0.5)

    await dht_sensor.disconnect()

    # Test BMP280
    print("\n--- BMP280 Sensor (Temperature + Pressure) ---")
    bmp_config = SensorConfig(
        name="Weather Station",
        driver="BMP280",
        connection_type=ConnectionType.I2C,
        connection_params={"address": 0x76, "sensor_model": "BMP280"},
        poll_interval=1.0,
        enabled=True,
    )

    bmp_sensor = DriverFactory.create_sensor(bmp_config)
    await bmp_sensor.initialize()
    await bmp_sensor.connect()

    print(f"Entities: {[e.name for e in bmp_sensor.get_entities()]}")

    print("\nReading 3 samples...")
    for i in range(3):
        readings = await bmp_sensor.read()
        for reading in readings:
            entity_name = reading.entity_id.split("_")[-1].capitalize()
            print(f"  {entity_name}: {reading.value:.2f} (quality: {reading.quality:.2f})")
        await asyncio.sleep(0.5)

    await bmp_sensor.disconnect()

    # Test BME280
    print("\n--- BME280 Sensor (Temp + Pressure + Humidity) ---")
    bme_config = SensorConfig(
        name="Environment",
        driver="BME280",
        connection_type=ConnectionType.I2C,
        connection_params={"address": 0x77, "sensor_model": "BME280"},
        poll_interval=1.0,
        enabled=True,
    )

    bme_sensor = DriverFactory.create_sensor(bme_config)
    await bme_sensor.initialize()
    await bme_sensor.connect()

    print(f"Entities: {[e.name for e in bme_sensor.get_entities()]}")

    print("\nReading 3 samples...")
    for i in range(3):
        readings = await bme_sensor.read()
        for reading in readings:
            entity_name = reading.entity_id.split("_")[-1].capitalize()
            print(f"  {entity_name}: {reading.value:.2f} (quality: {reading.quality:.2f})")
        await asyncio.sleep(0.5)

    await bme_sensor.disconnect()


async def test_gpio_board():
    """Test GPIO board (Raspberry Pi simulation)"""
    print("\n" + "=" * 60)
    print("TESTING GPIO BOARD")
    print("=" * 60)

    config = BoardConfig(
        board_type="GPIO",
        name="Raspberry Pi Simulator",
        i2c_enabled=True,
    )

    board = DriverFactory.create_board(config)
    await board.initialize()

    # Show capabilities
    print("\nCapabilities:")
    for cap in board.get_capabilities():
        status = "[YES]" if cap.available else "[NO]"
        print(f"  {status} {cap.name}: {cap.description}")

    # Test GPIO
    print("\n--- GPIO Test ---")
    test_pin = 4
    await board.write_digital(test_pin, True)
    value = await board.read_digital(test_pin)
    print(f"Pin {test_pin} state: {'HIGH' if value else 'LOW'}")

    # Test I2C scan
    print("\n--- I2C Scan ---")
    devices = await board.scan_i2c()
    print(f"Found {len(devices)} I2C devices: {[f'0x{addr:02x}' for addr in devices]}")

    # Self-test
    print("\n--- Board Self-Test ---")
    test_results = await board.self_test()
    print(f"Board: {test_results['board']}")
    print(f"Initialized: {test_results['initialized']}")
    print(f"Tests passed: {len(test_results['tests'])}")
    for test_name, test_result in test_results['tests'].items():
        status = "[PASS]" if test_result['success'] else "[FAIL]"
        print(f"  {status} {test_name}")

    await board.cleanup()


async def test_custom_board():
    """Test Custom board (8-channel board simulation)"""
    print("\n" + "=" * 60)
    print("TESTING CUSTOM BOARD")
    print("=" * 60)

    config = BoardConfig(
        board_type="CUSTOM",
        name="Custom 8-Channel Board",
        i2c_enabled=True,
        voltage_level=VoltageLevel.V3_3,
    )

    board = DriverFactory.create_board(config)
    await board.initialize()

    # Show capabilities
    print("\nCapabilities:")
    for cap in board.get_capabilities():
        status = "[YES]" if cap.available else "[NO]"
        print(f"  {status} {cap.name}: {cap.description}")
        if cap.metadata:
            for key, value in cap.metadata.items():
                print(f"      {key}: {value}")

    # Test voltage control
    print("\n--- Voltage Control Test ---")
    for channel in range(3):
        voltage = VoltageLevel.V3_3 if channel == 0 else VoltageLevel.V5
        await board.set_voltage_level(voltage, channel)
        print(f"Channel {channel} set to {voltage.value}")

    # Test ADC
    print("\n--- ADC Test ---")
    print("Reading analog values from 4 channels...")
    for i in range(4):
        value = await board.read_analog(i)
        print(f"  Channel {i}: {value:.3f}V")

    # Self-test
    print("\n--- Board Self-Test ---")
    test_results = await board.self_test()
    print(f"Board: {test_results['board']}")
    print(f"Initialized: {test_results['initialized']}")
    print(f"Tests passed: {len(test_results['tests'])}")
    for test_name, test_result in test_results['tests'].items():
        status = "[PASS]" if test_result['success'] else "[FAIL]"
        print(f"  {status} {test_name}")

    await board.cleanup()


async def show_available_drivers():
    """Show all available drivers"""
    print("\n" + "=" * 60)
    print("AVAILABLE DRIVERS")
    print("=" * 60)

    print("\nSensors:")
    sensors = DriverFactory.list_available_sensors()
    for name, info in sensors.items():
        real_status = "[YES]" if info['available'] else "[NO]"
        dummy_status = "[YES]" if info['dummy_available'] else "[NO]"
        print(f"  {name}:")
        print(f"    Real driver: {real_status}")
        print(f"    Dummy driver: {dummy_status}")

    print("\nBoards:")
    boards = DriverFactory.list_available_boards()
    for name, info in boards.items():
        real_status = "[YES]" if info['available'] else "[NO]"
        dummy_status = "[YES]" if info['dummy_available'] else "[NO]"
        print(f"  {name}:")
        print(f"    Real driver: {real_status}")
        print(f"    Dummy driver: {dummy_status}")


async def main():
    """Run all tests"""
    print("\n" + "=" * 60)
    print("DUMMY DRIVER TEST SUITE")
    print("Platform:", sys.platform)
    print("Using dummy drivers:", DriverFactory.should_use_dummy())
    print("=" * 60)

    await show_available_drivers()
    await test_sensors()
    await test_gpio_board()
    await test_custom_board()

    print("\n" + "=" * 60)
    print("ALL TESTS COMPLETED")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
