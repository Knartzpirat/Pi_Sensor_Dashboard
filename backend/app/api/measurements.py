"""
Measurement API endpoints.
"""

from typing import List, Optional
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, status
from pydantic import BaseModel

from app.core.sensor_manager import SensorManager
from app.core.websocket_manager import WebSocketManager

router = APIRouter(prefix="/measurements", tags=["measurements"])


class StartMeasurementRequest(BaseModel):
    """Request model for starting a measurement"""
    session_id: str
    sensor_ids: List[str]
    interval: float = 1.0
    duration: Optional[float] = None  # None = infinite


@router.post("/", status_code=status.HTTP_201_CREATED)
async def start_measurement(request: StartMeasurementRequest):
    """Start a new measurement session"""
    manager = SensorManager.get_instance()

    try:
        session = await manager.start_measurement(
            session_id=request.session_id,
            sensor_ids=request.sensor_ids,
            interval=request.interval,
            duration=request.duration,
        )

        return {
            "message": "Measurement started",
            "session": session.to_dict(),
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start measurement: {str(e)}"
        )


@router.get("/")
async def list_measurements():
    """List all measurement sessions"""
    manager = SensorManager.get_instance()
    sessions = await manager.list_sessions()
    return {"sessions": sessions}


@router.get("/{session_id}")
async def get_measurement(session_id: str):
    """Get measurement session information"""
    manager = SensorManager.get_instance()

    try:
        session_info = await manager.get_session_info(session_id)
        return session_info
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.post("/{session_id}/stop")
async def stop_measurement(session_id: str):
    """Stop a measurement session"""
    manager = SensorManager.get_instance()
    success = await manager.stop_measurement(session_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Measurement session not found"
        )

    return {"message": "Measurement stopped", "session_id": session_id}


@router.websocket("/ws/{session_id}")
async def measurement_websocket(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for real-time measurement data streaming.

    The Next.js frontend connects here to receive sensor data in real-time.
    The frontend is responsible for storing the data in the database.

    Message format:
    {
        "type": "sensor_data",
        "session_id": "...",
        "timestamp": "...",
        "readings": [
            {
                "entity_id": "...",
                "value": 23.5,
                "timestamp": "...",
                "quality": 1.0
            }
        ]
    }
    """
    ws_manager = WebSocketManager.get_instance()

    await ws_manager.connect(websocket, session_id)

    try:
        # Keep connection alive and handle incoming messages
        while True:
            # Wait for messages from client (e.g., ping/pong)
            data = await websocket.receive_json()

            # Handle client messages if needed
            if data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket, session_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        await ws_manager.disconnect(websocket, session_id)
