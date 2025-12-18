from __future__ import annotations

from dataclasses import dataclass
from math import atan2, cos, radians, sin, sqrt, degrees
from typing import List, Tuple

from app.schemas.corridor import LatLon, CorridorPlanRequest, CorridorPlanResponse, CorridorJunctionOut


def haversine_m(a: LatLon, b: LatLon) -> float:
    # Earth radius (m)
    R = 6371000.0
    lat1, lon1 = radians(a.lat), radians(a.lon)
    lat2, lon2 = radians(b.lat), radians(b.lon)

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    h = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return 2 * R * atan2(sqrt(h), sqrt(1 - h))


def bearing_deg(a: LatLon, b: LatLon) -> float:
    lat1, lon1 = radians(a.lat), radians(a.lon)
    lat2, lon2 = radians(b.lat), radians(b.lon)

    dlon = lon2 - lon1
    x = sin(dlon) * cos(lat2)
    y = cos(lat1) * sin(lat2) - sin(lat1) * cos(lat2) * cos(dlon)
    brng = atan2(x, y)
    return (degrees(brng) + 360) % 360


def angle_change_deg(p1: LatLon, p2: LatLon, p3: LatLon) -> float:
    b1 = bearing_deg(p1, p2)
    b2 = bearing_deg(p2, p3)
    diff = abs(b2 - b1)
    return min(diff, 360 - diff)


@dataclass
class CandidateJunction:
    idx: int
    point: LatLon
    cumulative_m: float
    turn_angle: float


def compute_route_distances(route: List[LatLon]) -> Tuple[List[float], float]:
    cumulative = [0.0]
    total = 0.0
    for i in range(1, len(route)):
        seg = haversine_m(route[i - 1], route[i])
        total += seg
        cumulative.append(total)
    return cumulative, total


def classify_priority(turn_angle: float, progress_ratio: float) -> str:
    """
    Simple, explainable priority:
    - sharp turns or later-stage junctions get higher priority (closest to hospital).
    """
    score = 0
    if turn_angle >= 60:
        score += 2
    elif turn_angle >= 35:
        score += 1

    if progress_ratio >= 0.70:
        score += 2
    elif progress_ratio >= 0.40:
        score += 1

    if score >= 4:
        return "high"
    if score >= 2:
        return "medium"
    return "low"


def plan_corridor(req: CorridorPlanRequest) -> CorridorPlanResponse:
    route = req.route_geometry
    cumulative, total_m = compute_route_distances(route)

    # Candidate junctions based on turning angle
    candidates: List[CandidateJunction] = []
    for i in range(1, len(route) - 1):
        ang = angle_change_deg(route[i - 1], route[i], route[i + 1])
        if ang >= req.turn_angle_threshold_deg:
            candidates.append(
                CandidateJunction(
                    idx=i,
                    point=route[i],
                    cumulative_m=cumulative[i],
                    turn_angle=ang,
                )
            )

    # Always include a few key anchors: start-ish and near end
    anchor_idxs = {1, max(1, len(route) // 2), len(route) - 2}
    for i in anchor_idxs:
        # small angle marker for anchors
        candidates.append(CandidateJunction(i, route[i], cumulative[i], turn_angle=0.0))

    # Sort by route order
    candidates.sort(key=lambda c: c.cumulative_m)

    # Enforce spacing + cap junction count
    chosen: List[CandidateJunction] = []
    last_m = -1e18
    for c in candidates:
        if c.cumulative_m - last_m >= req.min_spacing_m:
            chosen.append(c)
            last_m = c.cumulative_m
        if len(chosen) >= req.max_junctions:
            break

    # Map distance -> time using final ETA
    # (assume average speed across route; simple + explainable)
    avg_speed_mps = total_m / max(1, req.final_eta_seconds)

    junctions_out: List[CorridorJunctionOut] = []
    for j_idx, c in enumerate(chosen, start=1):
        eta_sec = int(c.cumulative_m / max(0.1, avg_speed_mps))
        w = req.window_buffer_seconds
        start_w = max(0, eta_sec - w)
        end_w = eta_sec + w

        progress = c.cumulative_m / max(1.0, total_m)
        pr = classify_priority(c.turn_angle, progress)

        junctions_out.append(
            CorridorJunctionOut(
                index=j_idx,
                lat=c.point.lat,
                lon=c.point.lon,
                cumulative_distance_m=round(c.cumulative_m, 2),
                eta_seconds_from_now=eta_sec,
                window_start_seconds_from_now=start_w,
                window_end_seconds_from_now=end_w,
                priority=pr,
            )
        )

    return CorridorPlanResponse(
        trip_id=req.trip_id,
        total_distance_m=round(total_m, 2),
        final_eta_seconds=req.final_eta_seconds,
        junctions=junctions_out,
        meta={
            "avg_speed_mps": round(avg_speed_mps, 3),
            "turn_angle_threshold_deg": req.turn_angle_threshold_deg,
            "min_spacing_m": req.min_spacing_m,
            "max_junctions": req.max_junctions,
            "window_buffer_seconds": req.window_buffer_seconds,
            "explainability": "distance→time mapping via avg speed; junctions via turn-angle threshold + spacing",
        },
    )
