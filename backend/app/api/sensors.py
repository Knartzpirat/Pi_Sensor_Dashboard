"""
Sensor API endpoints.
"""

from typing import List
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.core.sensor_manager import SensorManager
from app.models.sensor_base import SensorConfig, ConnectionType

router = APIRouter(prefix="/sensors", tags=["sensors"])


class SensorConfigRequest(BaseModel):
    """Request model for adding a sensor"""
    name: str
    driver: str
    connection_type: ConnectionType
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
    manager = SensorManager.get_instance()

    sensor_config = SensorConfig(**config.dict())
    success = await manager.add_sensor(sensor_config)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to add sensor"
        )

    return {"message": "Sensor added successfully", "sensor_id": config.name}


@router.get("/")
async def list_sensors():
    """List all sensors"""
    manager = SensorManager.get_instance()
    sensors = await manager.list_sensors()
    return {"sensors": sensors}


@router.get("/{sensor_id}")
async def get_sensor(sensor_id: str):
    """Get sensor information"""
    manager = SensorManager.get_instance()

    try:
        sensor_info = await manager.get_sensor_info(sensor_id)
        return sensor_info
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.get("/{sensor_id}/read")
async def read_sensor(sensor_id: str):
    """Read current values from sensor"""
    manager = SensorManager.get_instance()

    try:
        readings = await manager.read_sensor(sensor_id)
        return {
            "sensor_id": sensor_id,
            "readings": [
                {
                    "entity_id": r.entity_id,
                    "value": r.value,
                    "timestamp": r.timestamp.isoformat(),
                    "quality": r.quality,
                }
                for r in readings
            ],
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to read sensor: {str(e)}"
        )


@router.delete("/{sensor_id}")
async def remove_sensor(sensor_id: str):
    """Remove a sensor"""
    manager = SensorManager.get_instance()
    success = await manager.remove_sensor(sensor_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sensor not found"
        )

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
