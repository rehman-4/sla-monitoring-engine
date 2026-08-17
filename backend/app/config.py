import os
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "ShopCloud Observability"
    API_V1_STR: str = "/api/v1"
    DATABASE_URL: str = "sqlite:///./shopcloud.db"
    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"]
    SIMULATION_INTERVAL_SEC: int = 5

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
