"""
WebSocket Manager for real-time data streaming.

Handles:
- WebSocket connections
- Broadcasting sensor readings
- Session management
"""

import asyncio
import json
import logging
from typing import Dict, Set, Any, Optional
from datetime import datetime
from fastapi import WebSocket

from app.models.sensor_base import SensorReading

logger = logging.getLogger(__name__)


class WebSocketManager:
    """
    Manages WebSocket connections and broadcasts sensor data.

    Singleton pattern - use get_instance() to access.
    """

    _instance: Optional["WebSocketManager"] = None

    def __init__(self):
        # session_id -> set of WebSocket connections
        self._connections: Dict[str, Set[WebSocket]] = {}
        self._lock = asyncio.Lock()

    @classmethod
    def get_instance(cls) -> "WebSocketManager":
        """Get singleton instance"""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    async def connect(self, websocket: WebSocket, session_id: str):
        """
        Register a new WebSocket connection for a session.

        Args:
            websocket: WebSocket connection
            session_id: Measurement session ID
        """
        await websocket.accept()

        async with self._lock:
            if session_id not in self._connections:
                self._connections[session_id] = set()

            self._connections[session_id].add(websocket)

        logger.info(f"WebSocket connected to session {session_id}")

        # Send welcome message
        await self._send_message(
            websocket,
            {
                "type": "connected",
                "session_id": session_id,
                "timestamp": datetime.utcnow().isoformat(),
            },
        )

    async def disconnect(self, websocket: WebSocket, session_id: str):
        """
        Unregister a WebSocket connection.

        Args:
            websocket: WebSocket connection
            session_id: Measurement session ID
        """
        async with self._lock:
            if session_id in self._connections:
                self._connections[session_id].discard(websocket)

                # Remove session if no more connections
                if not self._connections[session_id]:
                    del self._connections[session_id]

        logger.info(f"WebSocket disconnected from session {session_id}")

    async def broadcast_readings(
        self,
        session_id: str,
        readings: list[SensorReading],
    ):
        """
        Broadcast sensor readings to all connected clients for a session.

        Args:
            session_id: Measurement session ID
            readings: List of sensor readings
        """
        if session_id not in self._connections:
            return

        # Prepare message
        message = {
            "type": "sensor_data",
            "session_id": session_id,
            "timestamp": datetime.utcnow().isoformat(),
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

        # Broadcast to all connections
        disconnected = set()

        async with self._lock:
            connections = self._connections.get(session_id, set()).copy()

        for websocket in connections:
            try:
                await self._send_message(websocket, message)
            except Exception as e:
                logger.warning(f"Failed to send to WebSocket: {e}")
                disconnected.add(websocket)

        # Remove disconnected clients
        if disconnected:
            async with self._lock:
                if session_id in self._connections:
                    self._connections[session_id] -= disconnected

    async def broadcast_status(
        self,
        session_id: str,
        status: str,
        metadata: Dict[str, Any] = None,
    ):
        """
        Broadcast status update to all connected clients.

        Args:
            session_id: Measurement session ID
            status: Status message
            metadata: Optional metadata
        """
        if session_id not in self._connections:
            return

        message = {
            "type": "status",
            "session_id": session_id,
            "timestamp": datetime.utcnow().isoformat(),
            "status": status,
            "metadata": metadata or {},
        }

        async with self._lock:
            connections = self._connections.get(session_id, set()).copy()

        for websocket in connections:
            try:
                await self._send_message(websocket, message)
            except Exception:
                pass

    async def broadcast_error(
        self,
        session_id: str,
        error: str,
        details: Dict[str, Any] = None,
    ):
        """
        Broadcast error message to all connected clients.

        Args:
            session_id: Measurement session ID
            error: Error message
            details: Optional error details
        """
        if session_id not in self._connections:
            return

        message = {
            "type": "error",
            "session_id": session_id,
            "timestamp": datetime.utcnow().isoformat(),
            "error": error,
            "details": details or {},
        }

        async with self._lock:
            connections = self._connections.get(session_id, set()).copy()

        for websocket in connections:
            try:
                await self._send_message(websocket, message)
            except Exception:
                pass

    async def _send_message(self, websocket: WebSocket, message: Dict[str, Any]):
        """Send JSON message to WebSocket"""
        await websocket.send_json(message)

    def get_connection_count(self, session_id: str) -> int:
        """Get number of connections for a session"""
        return len(self._connections.get(session_id, set()))

    def get_all_sessions(self) -> list[str]:
        """Get all active session IDs"""
        return list(self._connections.keys())
