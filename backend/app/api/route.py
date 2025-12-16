from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db import models
from app.schemas import RouteResponse
from app.services.osrm_service import get_route_driving, OSRMError
from app.utils.route_utils import classify_route_type

router = APIRouter(tags=["route"])


@router.get("/route", response_model=RouteResponse)
def get_route(trip_id: str = Query(...), db: Session = Depends(get_db)):
    # 1) Validate trip
    trip = db.query(models.Trip).filter(models.Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")

    if getattr(trip, "status", None) != "active":
        raise HTTPException(status_code=409, detail="Trip is not active")

    # 2) Latest GPS (O(1) query: order + limit 1)
    gps_q = db.query(models.GPSPoint).filter(models.GPSPoint.trip_id == trip_id)

    # Prefer a timestamp field if exists; fallback to id desc
    if hasattr(models.GPSPoint, "timestamp"):
        latest_gps = gps_q.order_by(models.GPSPoint.timestamp.desc()).first()
    elif hasattr(models.GPSPoint, "recorded_at"):
        latest_gps = gps_q.order_by(models.GPSPoint.recorded_at.desc()).first()
    else:
        latest_gps = gps_q.order_by(models.GPSPoint.id.desc()).first()

    if not latest_gps:
        raise HTTPException(status_code=400, detail="No GPS data for this trip")

    # 3) Hospital destination
    hospital_id = getattr(trip, "hospital_id", None)
    if not hospital_id:
        raise HTTPException(status_code=400, detail="Trip missing hospital_id")

    hospital = db.query(models.Hospital).filter(models.Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=400, detail="Hospital not found for this trip")

    # 4) OSRM call (single request)
    try:
        data = get_route_driving(
            start_lat=latest_gps.lat,
            start_lon=latest_gps.lon,
            end_lat=hospital.lat,
            end_lon=hospital.lon,
        )
    except OSRMError as e:
        raise HTTPException(status_code=502, detail=str(e))

    route0 = data["routes"][0]
    dist_m = float(route0["distance"])
    dur_s = int(route0["duration"])
    geom = route0["geometry"]  # GeoJSON LineString
    dist_km = dist_m / 1000.0

    route_type = classify_route_type(dist_km, dur_s)

    return RouteResponse(
        trip_id=trip_id,
        distance_km=round(dist_km, 3),
        duration_sec=dur_s,
        polyline_geojson=geom,
        route_type=route_type,
    )
