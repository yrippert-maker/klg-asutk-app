from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Float, Boolean, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base

class Aircraft(Base):
    __tablename__ = "aircraft"

    id = Column(String(36), primary_key=True, default=lambda: str(__import__("uuid").uuid4()))
    registration_number = Column(String(20), unique=True, nullable=False, index=True)
    serial_number = Column(String(100))
    aircraft_type_id = Column(String(36), ForeignKey("aircraft_types.id"), nullable=True)
    operator_id = Column(String(50), ForeignKey("organizations.id"))
    year_of_manufacture = Column(Integer)
    max_takeoff_weight = Column(Float)
    status = Column(String(50), default="active")
    is_active = Column(Boolean, default=True)
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    aircraft_type = relationship("AircraftType", backref="aircraft", lazy="joined")
    operator = relationship("Organization", backref="aircraft", lazy="joined")
