# Pi Sensor Dashboard - FastAPI Backend

Python FastAPI backend für Sensor-Management und Echtzeit-Datenstreaming.

## Features

- **Modular Sensor Drivers**: Individual driver files for each sensor type
- **Dummy Mode**: Test without hardware using realistic dummy data
- **Sensor Registry**: Automatic discovery and registration of sensors
- **REST API**: Full CRUD operations for sensors
- **Real-time Readings**: Poll sensor data at configurable intervals
- **Metadata System**: Each driver includes connection types, entities, calibration info

## Available Sensors

| Sensor | Connection | Board Support | Entities |
|--------|-----------|---------------|----------|
| **PhotoCell** | ADC | Custom | Light Level (V) |
| **BME280** | I2C | GPIO, Custom | Temperature (°C), Pressure (hPa), Humidity (%) |
| **SCD-41** | I2C | GPIO, Custom | CO2 (ppm), Temperature (°C), Humidity (%) |
| **DS18B20** | 1-Wire (IO) | GPIO, Custom | Temperature (°C) |
| **FlexSensor** | ADC | Custom | Bend Angle (V) |
| **eTape** | ADC | Custom | Liquid Level (V) |

See [app/sensors/README.md](app/sensors/README.md) for detailed sensor documentation.

## Architecture

```
backend/
├── app/
│   ├── sensors/          # Sensor drivers (PhotoCell, BME280, SCD41, etc.)
│   │   ├── base.py      # Base classes (BaseSensorDriver, SensorMetadata)
│   │   ├── registry.py  # Central registry and factory functions
│   │   └── *.py         # Individual sensor driver files
│   ├── models/           # Data models (Pydantic)
│   ├── core/             # Sensor-Manager, WebSocket-Manager
│   ├── api/              # REST API endpoints
│   ├── config/           # Configuration
│   └── main.py           # FastAPI application
├── requirements.txt
└── .env
```

## Installation

### 1. Virtuelle Umgebung erstellen

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Linux/Mac
# oder
venv\Scripts\activate     # Windows
```

### 2. Abhängigkeiten installieren

**Für Windows-Entwicklung (ohne Hardware):**

```bash
pip install -r requirements.txt
```

**Für Raspberry Pi (mit Hardware):**

```bash
pip install -r requirements-rpi.txt
```

### 3. Umgebungsvariablen konfigurieren

```bash
cp .env.example .env
# .env bearbeiten und anpassen
```

**Windows-Entwicklung:** Setze in `.env`:
```env
USE_DUMMY_DRIVERS=true
BOARD_TYPE=GPIO
```

**Raspberry Pi:** Setze in `.env`:
```env
USE_DUMMY_DRIVERS=false
BOARD_TYPE=GPIO  # oder CUSTOM
```

### 4. Datenbank migrieren (Next.js Dashboard)

```bash
cd ../dashboard
pnpm prisma generate
pnpm prisma db push
```

## Verwendung

### Development-Server starten

```bash
cd backend
source venv/bin/activate
python -m app.main
```

Oder mit uvicorn direkt:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### API-Dokumentation

Nach dem Start verfügbar unter:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API-Endpunkte

### Sensoren

- `POST /sensors/` - Sensor hinzufügen
- `GET /sensors/` - Alle Sensoren auflisten
- `GET /sensors/{sensor_id}` - Sensor-Info abrufen
- `GET /sensors/{sensor_id}/read` - Aktuellen Wert lesen
- `DELETE /sensors/{sensor_id}` - Sensor entfernen
- `POST /sensors/{sensor_id}/calibrate` - Sensor kalibrieren

### Messungen

- `POST /measurements/` - Messung starten
- `GET /measurements/` - Alle Messungen auflisten
- `GET /measurements/{session_id}` - Messungs-Info abrufen
- `POST /measurements/{session_id}/stop` - Messung stoppen
- `WS /measurements/ws/{session_id}` - WebSocket für Echtzeit-Daten

### System

- `GET /` - API-Info
- `GET /health` - Health-Check
- `GET /board` - Board-Informationen

## Sensor hinzufügen

### Beispiel: DHT22 über GPIO Pin 4

```bash
curl -X POST http://localhost:8000/sensors/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "room_sensor",
    "driver": "DHT22Driver",
    "connection_type": "gpio",
    "connection_params": {
      "pin": 4
    },
    "poll_interval": 2.0,
    "enabled": true
  }'
```

### Beispiel: BMP280 über I2C

```bash
curl -X POST http://localhost:8000/sensors/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "pressure_sensor",
    "driver": "BMP280Driver",
    "connection_type": "i2c",
    "connection_params": {
      "address": 119,
      "bus": 1
    },
    "poll_interval": 1.0,
    "enabled": true
  }'
```

## Messung starten

```bash
curl -X POST http://localhost:8000/measurements/ \
  -H "Content-Type: application/json" \
  -d '{
    "session_id": "measurement-123",
    "sensor_ids": ["room_sensor", "pressure_sensor"],
    "interval": 1.0,
    "duration": null
  }'
```

## WebSocket-Verbindung

Das Next.js Frontend verbindet sich mit dem WebSocket-Endpunkt:

```javascript
const ws = new WebSocket('ws://localhost:8000/measurements/ws/measurement-123');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);

  if (data.type === 'sensor_data') {
    // Daten in PostgreSQL speichern via Next.js API
    await fetch('/api/measurements/readings', {
      method: 'POST',
      body: JSON.stringify(data.readings),
    });
  }
};
```

## Neuen Sensor-Treiber erstellen

1. Erstelle eine neue Datei in `app/sensors/`:

```python
# app/sensors/my_sensor_driver.py

from app.models.sensor_base import BaseSensor, SensorConfig, SensorReading, SensorEntity

class MySensorDriver(BaseSensor):
    async def initialize(self) -> bool:
        # Sensor initialisieren
        pass

    async def connect(self) -> bool:
        # Verbindung herstellen
        pass

    async def read(self) -> List[SensorReading]:
        # Werte auslesen
        pass

    # ... weitere Methoden implementieren
```

2. Registriere den Treiber in `app/core/sensor_manager.py`:

```python
driver_map = {
    "DHT22Driver": "app.sensors.dht22_driver.DHT22Driver",
    "BMP280Driver": "app.sensors.bmp280_driver.BMP280Driver",
    "MySensorDriver": "app.sensors.my_sensor_driver.MySensorDriver",  # Neu
}
```

## Custom Board Konfiguration

Für das Custom Board mit Spannungswahl:

```python
# In .env
BOARD_TYPE=CUSTOM
```

Spannungslevel pro Kanal setzen:

```python
from app.models.board_base import VoltageLevel

board = manager.get_board()
await board.set_voltage_level(VoltageLevel.V5, channel=1)  # Kanal 1 auf 5V
await board.set_voltage_level(VoltageLevel.V12, channel=2)  # Kanal 2 auf 12V
```

## Entwicklung

### Dummy-Treiber (Windows-Entwicklung)

Das Backend unterstützt Dummy-Treiber für die Entwicklung ohne Hardware:

**Test-Script ausführen:**
```bash
python test_dummy_drivers.py
```

Dieses Script testet alle Sensor-Typen und zeigt realistische simulierte Messwerte.

**Automatische Plattformerkennung:**
- Windows: Verwendet automatisch Dummy-Treiber
- Linux: Versucht echte Hardware, fällt auf Dummy zurück

**Details:** Siehe [DEVELOPMENT.md](DEVELOPMENT.md) für vollständige Dokumentation.

### Logging

Logging-Level in `.env` anpassen:

```
LOG_LEVEL=DEBUG  # DEBUG, INFO, WARNING, ERROR
```

### Tests

```bash
pytest tests/
```

## Troubleshooting

### I2C-Probleme

```bash
# I2C-Bus aktivieren (Raspberry Pi)
sudo raspi-config
# Interface Options -> I2C -> Enable

# I2C-Geräte scannen
i2cdetect -y 1
```

### GPIO-Berechtigungen

```bash
# User zur gpio-Gruppe hinzufügen
sudo usermod -a -G gpio $USER
```

### SPI-Probleme

```bash
# SPI aktivieren
sudo raspi-config
# Interface Options -> SPI -> Enable
```

## Produktions-Deployment

### Mit systemd

```bash
# Erstelle Service-Datei
sudo nano /etc/systemd/system/pi-sensor-backend.service
```

```ini
[Unit]
Description=Pi Sensor Dashboard Backend
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/Pi_Sensor_Dashboard/backend
Environment="PATH=/home/pi/Pi_Sensor_Dashboard/backend/venv/bin"
ExecStart=/home/pi/Pi_Sensor_Dashboard/backend/venv/bin/python -m app.main

Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Service aktivieren und starten
sudo systemctl daemon-reload
sudo systemctl enable pi-sensor-backend
sudo systemctl start pi-sensor-backend
sudo systemctl status pi-sensor-backend
```

## Lizenz

[Lizenz hier einfügen]
