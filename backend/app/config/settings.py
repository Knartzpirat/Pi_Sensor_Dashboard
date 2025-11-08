"""
Application configuration and settings management.
"""

from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Environment
    environment: str = Field(default="development")
    debug: bool = Field(default=True)
    log_level: str = Field(default="INFO")

    # API Settings
    api_host: str = Field(default="0.0.0.0")
    api_port: int = Field(default=8000)
    api_reload: bool = Field(default=True)
    api_title: str = Field(default="Pi Sensor Dashboard API")
    api_version: str = Field(default="1.0.0")

    # Database
    database_url: str = Field(
        default="postgresql+asyncpg://user:password@localhost:5432/pi_sensor_dashboard"
    )

    # CORS
    cors_origins: str = Field(
        default="http://localhost:3000,http://192.168.1.100:3000"
    )

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from comma-separated string"""
        return [origin.strip() for origin in self.cors_origins.split(",")]

    # Hardware
    board_type: str = Field(default="GPIO")
    use_dummy_drivers: bool = Field(default=False)  # Use dummy sensors/boards for development
    i2c_bus: int = Field(default=1)
    spi_bus: int = Field(default=0)
    spi_device: int = Field(default=0)

    # Measurement Settings
    max_concurrent_measurements: int = Field(default=5)
    measurement_buffer_size: int = Field(default=1000)
    websocket_ping_interval: int = Field(default=30)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )


# Global settings instance
settings = Settings()
