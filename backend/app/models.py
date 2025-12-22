from __future__ import annotations

import enum
from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
)
from sqlalchemy.orm import relationship

from .db import Base


class TripStatus(str, enum.Enum):
    EN_ROUTE = "EN_ROUTE"
    NEAR_ARRIVAL = "NEAR_ARRIVAL"
    ARRIVED = "ARRIVED"
    STOPPED = "STOPPED"  # optional


class Trip(Base):
    __tablename__ = "trips"

    trip_id = Column(String, primary_key=True, index=True)  # UUID string
    ambulance_id = Column(String, nullable=False, index=True)
    destination_hospital_id = Column(String, nullable=False, index=True)

    status = Column(Enum(TripStatus), nullable=False, default=TripStatus.EN_ROUTE, index=True)

    started_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)
    arrived_at = Column(DateTime, nullable=True)

    # Optional: store destination coordinates if you have them (recommended if available)
    dest_lat = Column(Float, nullable=True)
    dest_lon = Column(Float, nullable=True)

    gps_points = relationship("GPSPoint", back_populates="trip", cascade="all, delete-orphan")
    acks = relationship("TripAck", back_populates="trip", cascade="all, delete-orphan")


Index("idx_trips_dest_status", Trip.destination_hospital_id, Trip.status)


class GPSPoint(Base):
    __tablename__ = "gps_points"

    id = Column(Integer, primary_key=True, autoincrement=True)
    trip_id = Column(String, ForeignKey("trips.trip_id", ondelete="CASCADE"), nullable=False, index=True)

    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    speed_mps = Column(Float, nullable=True)  # optional (if client provides)
    recorded_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)

    trip = relationship("Trip", back_populates="gps_points")


Index("idx_gps_trip_time", GPSPoint.trip_id, GPSPoint.recorded_at)


class TripAck(Base):
    __tablename__ = "trip_acks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    trip_id = Column(String, ForeignKey("trips.trip_id", ondelete="CASCADE"), nullable=False, index=True)
    hospital_id = Column(String, nullable=False, index=True)
    acked_at = Column(DateTime, nullable=False, default=datetime.utcnow, index=True)

    trip = relationship("Trip", back_populates="acks")


Index("idx_ack_trip_hosp", TripAck.trip_id, TripAck.hospital_id)
