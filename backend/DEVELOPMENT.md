# Backend Development Guide

## Dummy-Treiber für Windows-Entwicklung

Dieses Projekt enthält Dummy-Treiber, die es ermöglichen, das Backend auf Windows zu entwickeln, ohne dass echte Hardware (Raspberry Pi, Sensoren) verfügbar sein muss.

### Features

Die Dummy-Treiber simulieren:

- **Sensoren**: DHT22, BMP280, BME280, ADS1115, Analog
- **Boards**: GPIO Board (Raspberry Pi), Custom Board (mit 8 Kanälen)
- **Verbindungstypen**: I2C, ADC, GPIO/IO
- **Realistische Messwerte**: Mit Sinus-Wellen, Rauschen und langsamen Drifts
- **Hardware-Funktionen**: Pin-Verwaltung, Spannungssteuerung, I2C-Multiplexer

### Konfiguration

#### Automatische Erkennung

Die Dummy-Treiber werden automatisch aktiviert wenn:
- Windows als Plattform erkannt wird
- `USE_DUMMY_DRIVERS=true` in der `.env` Datei gesetzt ist

#### Manuelle Konfiguration

1. Kopiere `.env.example` nach `.env`:
   ```bash
   cp .env.example .env
   ```

2. Setze `USE_DUMMY_DRIVERS=true` in der `.env` Datei:
   ```env
   USE_DUMMY_DRIVERS=true
   ```

3. Wähle Board-Typ:
   ```env
   BOARD_TYPE=GPIO    # für Raspberry Pi GPIO
   # oder
   BOARD_TYPE=CUSTOM  # für Custom Board mit 8 Kanälen
   ```

### Sensor-Konfiguration

#### DHT22 Dummy-Sensor (Temperatur + Luftfeuchtigkeit)

```json
{
  "name": "Wohnzimmer Sensor",
  "driver": "DHT22",
  "connection_type": "io",
  "connection_params": {
    "sensor_model": "DHT22",
    "pin": 4
  },
  "poll_interval": 2.0
}
```

Der Dummy-Treiber simuliert:
- Temperatur: 20-25°C mit langsamen Tageszyklen
- Luftfeuchtigkeit: 40-60% mit inverser Korrelation zur Temperatur
- Gelegentliche Qualitätsprobleme (5% Wahrscheinlichkeit)

#### BMP280 Dummy-Sensor (Temperatur + Druck)

```json
{
  "name": "Drucksensor",
  "driver": "BMP280",
  "connection_type": "i2c",
  "connection_params": {
    "sensor_model": "BMP280",
    "address": "0x76"
  },
  "poll_interval": 1.0
}
```

Der Dummy-Treiber simuliert:
- Temperatur: 20-25°C
- Luftdruck: 950-1050 hPa mit sehr langsamen Änderungen

#### BME280 Dummy-Sensor (Temperatur + Druck + Luftfeuchtigkeit)

```json
{
  "name": "Umweltsensor",
  "driver": "BME280",
  "connection_type": "i2c",
  "connection_params": {
    "sensor_model": "BME280",
    "address": "0x77"
  },
  "poll_interval": 1.0
}
```

#### Analog Dummy-Sensor (Custom Board)

```json
{
  "name": "Analog Kanal 1",
  "driver": "Analog",
  "connection_type": "adc",
  "connection_params": {
    "sensor_model": "Analog",
    "channel": 1
  },
  "poll_interval": 0.5
}
```

Der Dummy-Treiber simuliert:
- Analogwert: 0-3.3V mit mittleren Geschwindigkeitsänderungen
- Geringes Rauschen für realistische Werte

### Board-Funktionen

#### GPIO Board (Raspberry Pi Simulation)

- 28 GPIO Pins (BCM Nummerierung)
- I2C Bus (standardmäßig Bus 1)
- PWM auf ausgewählten Pins
- **Kein ADC** (wie echtes Raspberry Pi)

Beispiel-Pin-Konfiguration:
```python
pin_config = PinConfig(
    pin_number=4,
    mode=PinMode.INPUT,
    pull=PinPull.PULL_UP
)
await board.setup_pin(pin_config)
value = await board.read_digital(4)
```

#### Custom Board (8-Kanal Board Simulation)

- 8 Kanäle (1-8)
- I2C mit TCA9548A Multiplexer (isolierte Busse pro Kanal)
- 16-Bit ADC pro Kanal (0-5V)
- Spannungssteuerung pro Kanal (3.3V, 5V, 12V)

Beispiel-Spannungssteuerung:
```python
# Setze Kanal 1 auf 5V
await board.set_voltage_level(VoltageLevel.V5, channel=1)

# Lese Analogwert
voltage = await board.read_analog(channel=1)
print(f"Kanal 1: {voltage:.3f}V")
```

### Daten-Charakteristiken

#### Temperatur
- Basislinie: ~22°C
- Tageszyklen: ±2°C über 10 Minuten
- Kleine Schwankungen: ±0.2°C schnell
- Rauschen: ±0.5°C

#### Luftfeuchtigkeit
- Basislinie: ~50%
- Inverse Korrelation mit Temperatur
- Schwankungen: ±5%
- Rauschen: ±0.5%

#### Luftdruck
- Basislinie: ~1013 hPa
- Sehr langsame Änderungen: ±10 hPa über Stunden
- Minimal Rauschen: ±0.5 hPa

#### Analogwerte
- Basislinie: Mitte des Bereichs
- Mittlere Geschwindigkeit: ±20% Amplitude
- Geringes Rauschen: ±0.2V

### Testing

Der Dummy-Board hat einen Self-Test:
```python
board = DummyBoard(config)
await board.initialize()
results = await board.self_test()
print(results)
```

Ausgabe:
```json
{
  "board": "GPIO",
  "name": "Development Board",
  "initialized": true,
  "capabilities": 4,
  "tests": {
    "gpio": {
      "success": true,
      "test_pin": 4,
      "test_value": true
    },
    "i2c": {
      "success": true,
      "devices_found": 2,
      "addresses": ["0x76", "0x77"]
    }
  }
}
```

### Driver Factory

Der `DriverFactory` wählt automatisch zwischen echten und Dummy-Treibern:

```python
from app.core.driver_factory import DriverFactory
from app.models.sensor_base import SensorConfig

# Erstelle Sensor (automatisch dummy auf Windows)
config = SensorConfig(
    name="Test Sensor",
    driver="DHT22",
    connection_type="io",
    connection_params={"pin": 4},
    poll_interval=2.0
)

sensor = DriverFactory.create_sensor(config)
await sensor.initialize()
await sensor.connect()

readings = await sensor.read()
for reading in readings:
    print(f"{reading.entity_id}: {reading.value}")
```

### Umstieg auf echte Hardware

Wenn du auf den Raspberry Pi wechselst:

1. Setze in der `.env`:
   ```env
   USE_DUMMY_DRIVERS=false
   ```

2. Installiere echte Hardware-Bibliotheken:
   ```bash
   pip install adafruit-circuitpython-dht
   pip install adafruit-circuitpython-bmp280
   pip install RPi.GPIO
   ```

3. Der `DriverFactory` versucht automatisch echte Treiber zu laden
4. Bei Fehlern fällt er zurück auf Dummy-Treiber

### Verfügbare Treiber anzeigen

```python
from app.core.driver_factory import DriverFactory

sensors = DriverFactory.list_available_sensors()
boards = DriverFactory.list_available_boards()

print("Verfügbare Sensoren:", sensors)
print("Verfügbare Boards:", boards)
```

### Logging

Aktiviere DEBUG-Logging um zu sehen, welche Treiber verwendet werden:

```env
LOG_LEVEL=DEBUG
```

Ausgabe:
```
INFO: Using dummy drivers (Windows platform detected)
INFO: Creating dummy sensor driver: DHT22
INFO: Initializing dummy DHT22 sensor: Test Sensor
INFO: Dummy DHT22 sensor initialized with 2 entities
```

### Troubleshooting

**Problem**: Backend startet nicht
- Lösung: Überprüfe `.env` Datei, setze `USE_DUMMY_DRIVERS=true`

**Problem**: Keine Messwerte
- Lösung: Überprüfe, ob Sensor korrekt initialisiert wurde (`self_test()`)

**Problem**: Unrealistische Werte
- Lösung: Passe `_noise_level` in `DummySensorDriver` an

**Problem**: I2C Fehler auf Windows
- Lösung: Dummy-Treiber sollten automatisch aktiviert sein, überprüfe Logs

### Weitere Entwicklung

Du kannst eigene Dummy-Sensoren hinzufügen:

1. Füge Sensor-Modell in `DummySensorDriver.__init__()` hinzu
2. Definiere Entities in `initialize()`
3. Implementiere Werte-Generierung in `_generate_realistic_value()`
4. Registriere in `DriverFactory._SENSOR_DRIVERS`

Beispiel für neuen Sensor:
```python
elif self._sensor_model == "CustomSensor":
    self._entities = [
        SensorEntity(
            id=f"{self.config.name}_value",
            name="Custom Value",
            unit="units",
            sensor_type=SensorType.CUSTOM,
            min_value=0.0,
            max_value=100.0,
            precision=2,
        ),
    ]
```
