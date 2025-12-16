from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.db import models
from app.schemas import HospitalCreate, HospitalOut

router = APIRouter(tags=["hospital"])


@router.post("/hospital", response_model=HospitalOut)
def create_hospital(payload: HospitalCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Hospital).filter(models.Hospital.id == payload.id).first()
    if existing:
        # upsert-ish behavior (safe for dev/demo)
        existing.name = payload.name
        existing.lat = payload.lat
        existing.lon = payload.lon
        db.commit()
        db.refresh(existing)
        return existing

    h = models.Hospital(id=payload.id, name=payload.name, lat=payload.lat, lon=payload.lon)
    db.add(h)
    db.commit()
    db.refresh(h)
    return h


@router.get("/hospital/{hospital_id}", response_model=HospitalOut)
def get_hospital(hospital_id: str, db: Session = Depends(get_db)):
    h = db.query(models.Hospital).filter(models.Hospital.id == hospital_id).first()
    if not h:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return h
