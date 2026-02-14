from datetime import datetime, date
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from app.db.base import Base


class AircraftType(Base):
    __tablename__ = "aircraft_types"

    id = Column(String(36), primary_key=True, default=lambda: str(__import__("uuid").uuid4()))
    manufacturer = Column(String(200), nullable=False)
    model = Column(String(200), nullable=False)
    icao_code = Column(String(10))
    engine_type = Column(String(50))
    engine_count = Column(Integer, default=2)
    max_passengers = Column(Integer)
    max_range_km = Column(Integer)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
