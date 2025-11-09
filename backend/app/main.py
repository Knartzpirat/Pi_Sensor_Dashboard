"""
Pi Sensor Dashboard - FastAPI Backend

Main application entry point.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config.settings import settings
from app.api import sensors, measurements
from app.core.sensor_manager import SensorManager
from app.models.board_base import BoardConfig, VoltageLevel

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.

    Handles startup and shutdown events.
    """
    # Startup
    logger.info("Starting Pi Sensor Dashboard Backend")

    # Initialize sensor manager with board
    # Note: This may fail on non-Raspberry Pi platforms (Windows, macOS, etc.)
    # The new sensor API (/api/sensors/) works independently and doesn't require this
    try:
        board_config = BoardConfig(
            board_type=settings.board_type,
            name="Main Board",
            i2c_enabled=True,
            spi_enabled=False,
            i2c_bus=settings.i2c_bus,
            spi_bus=settings.spi_bus,
            spi_device=settings.spi_device,
            voltage_level=VoltageLevel.V3_3,
        )

        manager = SensorManager.get_instance()
        success = await manager.initialize(board_config)

        if not success:
            logger.warning("Sensor manager initialization failed - running in limited mode")
            logger.info("Sensor API endpoints will still work with USE_DUMMY_DRIVERS=true")
        else:
            logger.info("Sensor manager initialized successfully")
    except Exception as e:
        logger.warning(f"Could not initialize sensor manager: {e}")
        logger.info("Running in limited mode - sensor API endpoints will still work with dummy drivers")

    yield

    # Shutdown
    logger.info("Shutting down Pi Sensor Dashboard Backend")
    try:
        manager = SensorManager.get_instance()
        await manager.shutdown()
    except Exception as e:
        logger.warning(f"Error during shutdown: {e}")


# Create FastAPI app
app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(sensors.router)
app.include_router(measurements.router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": settings.api_title,
        "version": settings.api_version,
        "status": "running",
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    manager = SensorManager.get_instance()

    return {
        "status": "healthy",
        "sensors": len(await manager.list_sensors()),
        "sessions": len(await manager.list_sessions()),
    }


@app.get("/board")
async def board_info():
    """Get board information"""
    manager = SensorManager.get_instance()
    board = manager.get_board()

    if not board:
        return {"error": "Board not initialized"}

    try:
        self_test = await board.self_test()
        capabilities = [c.dict() for c in board.get_capabilities()]

        return {
            "board_type": board.config.board_type,
            "capabilities": capabilities,
            "self_test": self_test,
        }
    except Exception as e:
        return {"error": str(e)}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.api_reload,
    )
