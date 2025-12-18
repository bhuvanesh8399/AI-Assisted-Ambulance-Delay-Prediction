from fastapi import APIRouter, HTTPException

from app.schemas.corridor import CorridorPlanRequest, CorridorPlanResponse
from app.services.corridor_planner import plan_corridor

router = APIRouter(prefix="/api/corridor", tags=["corridor"])


@router.post("/plan", response_model=CorridorPlanResponse)
def generate_corridor_plan(payload: CorridorPlanRequest):
    if len(payload.route_geometry) < 2:
        raise HTTPException(status_code=400, detail="route_geometry must contain at least 2 points")
    if payload.final_eta_seconds <= 0:
        raise HTTPException(status_code=400, detail="final_eta_seconds must be > 0")

    return plan_corridor(payload)
