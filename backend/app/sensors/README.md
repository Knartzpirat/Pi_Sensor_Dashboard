# Sensor Drivers

Modular sensor driver system with metadata and dummy mode support.

## Structure

```
sensors/
├── base.py              # Base classes (BaseSensorDriver, SensorMetadata, EntityMetadata)
├── registry.py          # Central registry and factory functions
├── __init__.py          # Package exports
├── photocell.py         # Photo Cell (LDR) driver
├── bme280.py            # BME280 environmental sensor driver
├── scd41.py             # SCD-41 CO2 sensor driver
├── ds18b20.py           # DS18B20 temperature sensor driver
├── flexsensor.py        # Flex sensor driver
└── etape.py             # eTape liquid level sensor driver
```

## Available Sensors

### PhotoCell
- **Type**: Light sensor (LDR)
- **Connection**: ADC
- **Board Support**: Custom Board only
- **Measurements**: Light Level (V)

### BME280
- **Type**: Environmental sensor
- **Connection**: I2C
- **Board Support**: GPIO and Custom Board
- **Measurements**: Temperature (°C), Pressure (hPa), Humidity (%)
- **Requires Calibration**: Yes (sea level pressure)

### SCD-41
- **Type**: CO2 sensor
- **Connection**: I2C
- **Board Support**: GPIO and Custom Board
- **Measurements**: CO2 (ppm), Temperature (°C), Humidity (%)
- **Requires Calibration**: Yes (altitude/pressure)
- **Min Poll Interval**: 5.0s

### DS18B20
- **Type**: Temperature sensor
- **Connection**: 1-Wire (IO)
- **Board Support**: GPIO and Custom Board
- **Measurements**: Temperature (°C)

### FlexSensor
- **Type**: Bend sensor
- **Connection**: ADC
- **Board Support**: Custom Board only
- **Measurements**: Bend Angle (V)

### eTape
- **Type**: Liquid level sensor
- **Connection**: ADC
- **Board Support**: Custom Board only
- **Measurements**: Liquid Level (V)
- **Requires Calibration**: Yes (volume/height mapping)

## Dummy Mode

All drivers support dummy mode for development and testing without hardware.

**Configuration**: Set `USE_DUMMY_DRIVERS=true` in `.env` file (default on Windows)

In dummy mode, drivers generate realistic random values within appropriate ranges:
- Temperature: 15-30°C
- Humidity: 30-70%
- Pressure: 980-1030 hPa
- CO2: 400-1200 ppm
- Analog voltages: 0-5V (sensor-specific ranges)

## Creating a New Sensor Driver

1. Create a new file `newsensor.py` in this directory
2. Import base classes:
   ```python
   from .base import BaseSensorDriver, SensorMetadata, EntityMetadata
   ```

3. Define your driver class:
   ```python
   class NewSensorDriver(BaseSensorDriver):
       @classmethod
       def get_metadata(cls) -> SensorMetadata:
           return SensorMetadata(
               driver_name="NewSensor",
               display_name="New Sensor Name",
               description="Brief description",
               category="environmental",  # or light, analog, motion
               connection_types=["i2c"],  # or adc, io
               entities=[
                   EntityMetadata(
                       name="Measurement Name",
                       unit="unit",
                       type="type",
                       precision=2
                   )
               ],
               min_poll_interval=1.0,
               requires_calibration=False,
               supports_boards=["GPIO", "CUSTOM"],
           )

       async def read(self) -> Dict[str, Any]:
           if self.use_dummy:
               metadata = self.get_metadata()
               entity = metadata.entities[0]
               value = self._generate_dummy_value(entity)
               return {entity.name: value}

           # Real hardware implementation
           raise NotImplementedError("Real hardware support not yet implemented")
   ```

4. Register in `registry.py`:
   ```python
   from .newsensor import NewSensorDriver

   DRIVER_REGISTRY: Dict[str, Type[BaseSensorDriver]] = {
       # ... existing drivers ...
       "NewSensor": NewSensorDriver,
   }
   ```

5. Export in `__init__.py`:
   ```python
   from .newsensor import NewSensorDriver

   __all__ = [
       # ... existing exports ...
       "NewSensorDriver",
   ]
   ```

## API Usage

### List All Sensors
```python
from app.sensors import list_all_sensors

sensors = list_all_sensors()
```

### List by Board Type
```python
from app.sensors import list_sensors_by_board

gpio_sensors = list_sensors_by_board("GPIO")
custom_sensors = list_sensors_by_board("CUSTOM")
```

### List by Category
```python
from app.sensors import list_sensors_by_category

env_sensors = list_sensors_by_category("environmental")
```

### List by Connection Type
```python
from app.sensors import list_sensors_by_connection_type

i2c_sensors = list_sensors_by_connection_type("i2c")
adc_sensors = list_sensors_by_connection_type("adc")
```

### Create Sensor Instance
```python
from app.sensors import create_sensor_instance

sensor = create_sensor_instance(
    driver_name="BME280",
    sensor_id="sensor-123",
    config={
        "pin": 4,
        "i2c_address": "0x76"
    }
)

# Read values
values = await sensor.read()
# {'Temperature': 23.45, 'Pressure': 1013.2, 'Humidity': 55.5}
```

## Notes

- All drivers inherit from `BaseSensorDriver`
- Each driver defines its own metadata via `get_metadata()`
- Dummy mode is automatically enabled on Windows or when `USE_DUMMY_DRIVERS=true`
- Real hardware implementations should override `read()`, `initialize()`, and `cleanup()`
