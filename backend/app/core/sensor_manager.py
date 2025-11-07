"""
Sensor Manager - Central management for all sensors and boards.

Handles:
- Sensor lifecycle (initialization, connection, reading)
- Board management
- Measurement sessions
- Real-time data streaming
"""

import asyncio
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from enum import Enum

from app.models.sensor_base import BaseSensor, SensorConfig, SensorReading
from app.models.board_base import BaseBoard, BoardConfig

logger = logging.getLogger(__name__)


class MeasurementStatus(str, Enum):
    """Measurement session status"""
    IDLE = "idle"
    STARTING = "starting"
    RUNNING = "running"
    PAUSED = "paused"
    STOPPING = "stopping"
    COMPLETED = "completed"
    ERROR = "error"


class MeasurementSession:
    """Represents an active measurement session"""

    def __init__(
        self,
        session_id: str,
        sensor_ids: List[str],
        interval: float = 1.0,
        duration: Optional[float] = None,
    ):
        self.session_id = session_id
        self.sensor_ids = sensor_ids
        self.interval = interval
        self.duration = duration
        self.status = MeasurementStatus.IDLE
        self.start_time: Optional[datetime] = None
        self.end_time: Optional[datetime] = None
        self.readings_count = 0
        self.error_count = 0
        self._task: Optional[asyncio.Task] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert session to dictionary"""
        return {
            "session_id": self.session_id,
            "sensor_ids": self.sensor_ids,
            "interval": self.interval,
            "duration": self.duration,
            "status": self.status.value,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "readings_count": self.readings_count,
            "error_count": self.error_count,
        }


class SensorManager:
    """
    Central manager for all sensors and boards.

    Singleton pattern - use get_instance() to access.
    """

    _instance: Optional["SensorManager"] = None

    def __init__(self):
        self._board: Optional[BaseBoard] = None
        self._sensors: Dict[str, BaseSensor] = {}
        self._sessions: Dict[str, MeasurementSession] = {}
        self._is_initialized = False
        self._lock = asyncio.Lock()

    @classmethod
    def get_instance(cls) -> "SensorManager":
        """Get singleton instance"""
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    async def initialize(self, board_config: BoardConfig) -> bool:
        """
        Initialize the sensor manager with a board.

        Args:
            board_config: Board configuration

        Returns:
            True if successful
        """
        async with self._lock:
            try:
                # Import board based on type
                if board_config.board_type == "GPIO":
                    from app.boards.gpio_board import GPIOBoard
                    self._board = GPIOBoard(board_config)
                elif board_config.board_type == "CUSTOM":
                    from app.boards.custom_board import CustomBoard
                    self._board = CustomBoard(board_config)
                else:
                    logger.error(f"Unknown board type: {board_config.board_type}")
                    return False

                # Initialize board
                if not await self._board.initialize():
                    logger.error("Failed to initialize board")
                    return False

                self._is_initialized = True
                logger.info(f"Sensor manager initialized with {board_config.board_type} board")
                return True

            except Exception as e:
                logger.error(f"Failed to initialize sensor manager: {e}")
                return False

    async def shutdown(self) -> bool:
        """Shutdown sensor manager and cleanup resources"""
        async with self._lock:
            try:
                # Stop all measurement sessions
                for session_id in list(self._sessions.keys()):
                    await self.stop_measurement(session_id)

                # Disconnect all sensors
                for sensor_id in list(self._sensors.keys()):
                    await self.remove_sensor(sensor_id)

                # Cleanup board
                if self._board:
                    await self._board.cleanup()

                self._is_initialized = False
                logger.info("Sensor manager shut down")
                return True

            except Exception as e:
                logger.error(f"Failed to shutdown sensor manager: {e}")
                return False

    async def add_sensor(self, config: SensorConfig) -> bool:
        """
        Add and initialize a sensor.

        Args:
            config: Sensor configuration

        Returns:
            True if successful
        """
        async with self._lock:
            try:
                if not self._is_initialized:
                    logger.error("Sensor manager not initialized")
                    return False

                sensor_id = config.name

                if sensor_id in self._sensors:
                    logger.warning(f"Sensor {sensor_id} already exists")
                    return False

                # Import sensor driver
                driver_map = {
                    "DHT22Driver": "app.sensors.dht22_driver.DHT22Driver",
                    "BMP280Driver": "app.sensors.bmp280_driver.BMP280Driver",
                }

                if config.driver not in driver_map:
                    logger.error(f"Unknown sensor driver: {config.driver}")
                    return False

                # Dynamically import driver
                module_path, class_name = driver_map[config.driver].rsplit(".", 1)
                module = __import__(module_path, fromlist=[class_name])
                driver_class = getattr(module, class_name)

                # Create sensor instance
                sensor = driver_class(config)

                # Initialize and connect
                if not await sensor.initialize():
                    logger.error(f"Failed to initialize sensor {sensor_id}")
                    return False

                if not await sensor.connect():
                    logger.error(f"Failed to connect sensor {sensor_id}")
                    return False

                self._sensors[sensor_id] = sensor
                logger.info(f"Sensor {sensor_id} added successfully")
                return True

            except Exception as e:
                logger.error(f"Failed to add sensor: {e}")
                return False

    async def remove_sensor(self, sensor_id: str) -> bool:
        """
        Remove and disconnect a sensor.

        Args:
            sensor_id: Sensor identifier

        Returns:
            True if successful
        """
        async with self._lock:
            try:
                if sensor_id not in self._sensors:
                    logger.warning(f"Sensor {sensor_id} not found")
                    return False

                sensor = self._sensors[sensor_id]

                # Disconnect sensor
                await sensor.disconnect()

                # Remove from registry
                del self._sensors[sensor_id]

                logger.info(f"Sensor {sensor_id} removed")
                return True

            except Exception as e:
                logger.error(f"Failed to remove sensor {sensor_id}: {e}")
                return False

    async def read_sensor(self, sensor_id: str) -> List[SensorReading]:
        """
        Read current values from a sensor.

        Args:
            sensor_id: Sensor identifier

        Returns:
            List of sensor readings
        """
        if sensor_id not in self._sensors:
            raise ValueError(f"Sensor {sensor_id} not found")

        sensor = self._sensors[sensor_id]
        return await sensor.read()

    async def get_sensor_info(self, sensor_id: str) -> Dict[str, Any]:
        """Get sensor information"""
        if sensor_id not in self._sensors:
            raise ValueError(f"Sensor {sensor_id} not found")

        sensor = self._sensors[sensor_id]
        return {
            "id": sensor_id,
            "driver": sensor.config.driver,
            "connection_type": sensor.config.connection_type.value,
            "is_connected": sensor.is_connected,
            "entities": [e.dict() for e in sensor.get_entities()],
            "poll_interval": sensor.config.poll_interval,
            "enabled": sensor.config.enabled,
        }

    async def list_sensors(self) -> List[Dict[str, Any]]:
        """List all registered sensors"""
        return [
            await self.get_sensor_info(sensor_id)
            for sensor_id in self._sensors.keys()
        ]

    async def start_measurement(
        self,
        session_id: str,
        sensor_ids: List[str],
        interval: float = 1.0,
        duration: Optional[float] = None,
    ) -> MeasurementSession:
        """
        Start a measurement session.

        Args:
            session_id: Unique session identifier
            sensor_ids: List of sensor IDs to measure
            interval: Reading interval in seconds
            duration: Optional duration in seconds (None = infinite)

        Returns:
            MeasurementSession object
        """
        async with self._lock:
            if session_id in self._sessions:
                raise ValueError(f"Session {session_id} already exists")

            # Validate sensors
            for sensor_id in sensor_ids:
                if sensor_id not in self._sensors:
                    raise ValueError(f"Sensor {sensor_id} not found")

            # Create session
            session = MeasurementSession(
                session_id=session_id,
                sensor_ids=sensor_ids,
                interval=interval,
                duration=duration,
            )

            self._sessions[session_id] = session

            # Start measurement task
            session._task = asyncio.create_task(
                self._measurement_loop(session)
            )

            logger.info(f"Measurement session {session_id} started")
            return session

    async def _measurement_loop(self, session: MeasurementSession):
        """Internal measurement loop"""
        try:
            session.status = MeasurementStatus.STARTING
            session.start_time = datetime.utcnow()
            session.status = MeasurementStatus.RUNNING

            start_time = asyncio.get_event_loop().time()

            while session.status == MeasurementStatus.RUNNING:
                try:
                    # Read all sensors
                    all_readings = []
                    for sensor_id in session.sensor_ids:
                        readings = await self.read_sensor(sensor_id)
                        all_readings.extend(readings)

                    session.readings_count += len(all_readings)

                    # Broadcast readings via WebSocket
                    # This will be handled by the WebSocket endpoint
                    await self._broadcast_readings(session.session_id, all_readings)

                except Exception as e:
                    logger.error(f"Error reading sensors in session {session.session_id}: {e}")
                    session.error_count += 1

                # Check duration
                if session.duration:
                    elapsed = asyncio.get_event_loop().time() - start_time
                    if elapsed >= session.duration:
                        break

                # Wait for next interval
                await asyncio.sleep(session.interval)

            session.status = MeasurementStatus.COMPLETED
            session.end_time = datetime.utcnow()

        except asyncio.CancelledError:
            session.status = MeasurementStatus.STOPPING
            session.end_time = datetime.utcnow()
            logger.info(f"Measurement session {session.session_id} cancelled")

        except Exception as e:
            session.status = MeasurementStatus.ERROR
            session.end_time = datetime.utcnow()
            logger.error(f"Measurement session {session.session_id} failed: {e}")

    async def _broadcast_readings(self, session_id: str, readings: List[SensorReading]):
        """Broadcast readings to WebSocket clients (placeholder)"""
        # This will be implemented in the WebSocket manager
        pass

    async def stop_measurement(self, session_id: str) -> bool:
        """
        Stop a measurement session.

        Args:
            session_id: Session identifier

        Returns:
            True if successful
        """
        async with self._lock:
            if session_id not in self._sessions:
                logger.warning(f"Session {session_id} not found")
                return False

            session = self._sessions[session_id]

            if session._task:
                session._task.cancel()
                try:
                    await session._task
                except asyncio.CancelledError:
                    pass

            logger.info(f"Measurement session {session_id} stopped")
            return True

    async def get_session_info(self, session_id: str) -> Dict[str, Any]:
        """Get measurement session information"""
        if session_id not in self._sessions:
            raise ValueError(f"Session {session_id} not found")

        return self._sessions[session_id].to_dict()

    async def list_sessions(self) -> List[Dict[str, Any]]:
        """List all measurement sessions"""
        return [
            session.to_dict()
            for session in self._sessions.values()
        ]

    def get_board(self) -> Optional[BaseBoard]:
        """Get the board instance"""
        return self._board
