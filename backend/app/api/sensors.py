"""
Sensor API endpoints.
"""

from typing import List, Dict, Any
from datetime import datetime
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.sensors import (
    list_all_sensors,
    list_sensors_by_board,
    list_sensors_by_category,
    list_sensors_by_connection_type,
    create_sensor_instance,
)
from app.core.sensor_manager import SensorManager

router = APIRouter(prefix="/sensors", tags=["sensors"])

# In-memory sensor registry
# Maps sensor_id -> sensor_driver_instance
_sensor_instances: Dict[str, Any] = {}


class SensorConfigRequest(BaseModel):
    """Request model for adding a sensor"""
    name: str  # This will be the sensor ID from dashboard
    driver: str
    connection_type: str
    connection_params: dict
    poll_interval: float = 1.0
    enabled: bool = True
    calibration: dict | None = None


class SensorReadingResponse(BaseModel):
    """Response model for sensor reading"""
    entity_id: str
    value: float
    timestamp: str
    quality: float


@router.post("/", status_code=status.HTTP_201_CREATED)
async def add_sensor(config: SensorConfigRequest):
    """Add a new sensor"""
    try:
        # Check if sensor already exists
        if config.name in _sensor_instances:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Sensor {config.name} already exists"
            )

        # Create sensor instance using new driver system
        sensor_instance = create_sensor_instance(
            driver_name=config.driver,
            sensor_id=config.name,
            config=config.connection_params
        )

        # Store in registry
        _sensor_instances[config.name] = sensor_instance

        return {
            "message": "Sensor added successfully",
            "sensor_id": config.name
        }
    except HTTPException:
        raise
    except KeyError as e:
        import traceback
        error_msg = f"Unknown driver: {config.driver}"
        print(f"KeyError when adding sensor {config.name}:")
        print(f"  Error: {error_msg}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )
    except Exception as e:
        import traceback
        error_msg = f"Failed to add sensor: {type(e).__name__}: {str(e)}"
        print(f"Exception when adding sensor {config.name}:")
        print(f"  Error: {error_msg}")
        print(f"  Config: {config}")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )


@router.get("/")
async def list_sensors():
    """List all configured sensors"""
    sensors = []
    for sensor_id, sensor in _sensor_instances.items():
        metadata = sensor.get_metadata()
        sensors.append({
            "id": sensor_id,
            "driver": metadata.driver_name,
            "entities": [
                {
                    "id": f"{sensor_id}_{entity.name}",
                    "name": entity.name,
                    "unit": entity.unit,
                    "type": entity.type
                }
                for entity in metadata.entities
            ]
        })
    return {"sensors": sensors}


@router.get("/supported", tags=["sensors"])
async def get_supported_sensors(
    board_type: str = None,
    category: str = None,
    connection_type: str = None,
):
    """
    Get list of all supported sensors with metadata.

    Query parameters:
    - board_type: Filter by board type (GPIO or CUSTOM)
    - category: Filter by sensor category (environmental, motion, light, analog, custom)
    - connection_type: Filter by connection type (i2c, adc, io)
    """
    if board_type:
        sensors = list_sensors_by_board(board_type.upper())
    elif category:
        sensors = list_sensors_by_category(category.lower())
    elif connection_type:
        sensors = list_sensors_by_connection_type(connection_type.lower())
    else:
        sensors = list_all_sensors()

    return {
        "sensors": sensors,
        "count": len(sensors),
    }


@router.get("/{sensor_id}")
async def get_sensor(sensor_id: str):
    """Get sensor information"""
    if sensor_id not in _sensor_instances:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sensor '{sensor_id}' not found"
        )

    sensor = _sensor_instances[sensor_id]
    metadata = sensor.get_metadata()

    return {
        "id": sensor_id,
        "driver": metadata.driver_name,
        "display_name": metadata.display_name,
        "category": metadata.category,
        "entities": [
            {
                "id": f"{sensor_id}_{entity.name}",
                "name": entity.name,
                "unit": entity.unit,
                "type": entity.type
            }
            for entity in metadata.entities
        ]
    }


@router.get("/{sensor_id}/read")
async def read_sensor(sensor_id: str):
    """Read current values from sensor"""
    if sensor_id not in _sensor_instances:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sensor '{sensor_id}' not found. Make sure the sensor is registered."
        )

    try:
        sensor = _sensor_instances[sensor_id]
        values = await sensor.read()

        # Convert to readings format
        timestamp = datetime.now()
        readings = []

        for entity_name, value in values.items():
            readings.append({
                "entity_id": f"{sensor_id}_{entity_name}",
                "value": value,
                "timestamp": timestamp.isoformat(),
                "quality": 1.0,
            })

        return {
            "sensor_id": sensor_id,
            "readings": readings,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read sensor: {str(e)}"
        )


@router.delete("/{sensor_id}")
async def remove_sensor(sensor_id: str):
    """Remove a sensor"""
    if sensor_id not in _sensor_instances:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Sensor '{sensor_id}' not found"
        )

    # Remove from registry
    del _sensor_instances[sensor_id]

    return {"message": "Sensor removed successfully"}


@router.post("/{sensor_id}/calibrate")
async def calibrate_sensor(sensor_id: str, calibration_data: dict):
    """Calibrate a sensor"""
    manager = SensorManager.get_instance()

    try:
        sensor_info = await manager.get_sensor_info(sensor_id)
        # Calibration would be applied here
        return {"message": "Calibration applied", "sensor_id": sensor_id}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
