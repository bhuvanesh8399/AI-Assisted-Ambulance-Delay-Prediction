import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Float, DateTime, ForeignKey, Integer, Index
)
from sqlalchemy.orm import relationship
from .session import Base

class Trip(Base):
    __tablename__ = "trips"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    ambulance_id = Column(String, nullable=False)
    hospital_id = Column(String, nullable=False)

    start_lat = Column(Float, nullable=False)
    start_lon = Column(Float, nullable=False)

    status = Column(String, nullable=False, default="active")  # "active" | "stopped"
    started_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    stopped_at = Column(DateTime, nullable=True)

    last_lat = Column(Float, nullable=True)
    last_lon = Column(Float, nullable=True)
    last_ts = Column(DateTime, nullable=True)

    gps_points = relationship("GPSPoint", back_populates="trip", cascade="all, delete-orphan")


class GPSPoint(Base):
    __tablename__ = "gps_points"

    id = Column(Integer, primary_key=True, autoincrement=True)
    trip_id = Column(String, ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)

    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    timestamp = Column(DateTime, nullable=False)
    seq = Column(Integer, nullable=True)

    trip = relationship("Trip", back_populates="gps_points")

# Indexes for O(1)-ish latest queries and fast trip filtering
Index("ix_gps_trip_ts_desc", GPSPoint.trip_id, GPSPoint.timestamp.desc())
Index("ix_gps_trip_seq", GPSPoint.trip_id, GPSPoint.seq)
