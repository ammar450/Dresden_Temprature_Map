from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import sensors
from app.core.config import settings

app = FastAPI(
    title="Temperature Sensor API",
    description="REST API for querying air temperature sensor data across Dresden.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(sensors.router, prefix="/api/v1")


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}
