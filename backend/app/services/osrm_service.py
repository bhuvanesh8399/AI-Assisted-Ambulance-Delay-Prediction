import os
import requests
from typing import Any, Dict

DEFAULT_OSRM_BASE_URL = os.getenv("OSRM_BASE_URL", "http://localhost:5000")


class OSRMError(RuntimeError):
    pass


def get_route_driving(
    start_lat: float,
    start_lon: float,
    end_lat: float,
    end_lon: float,
    *,
    timeout_sec: float = 3.5,
) -> Dict[str, Any]:
    """
    Calls OSRM:
    /route/v1/driving/{lon1},{lat1};{lon2},{lat2}?overview=full&geometries=geojson&steps=true
    Returns parsed OSRM JSON dict, or raises OSRMError.
    """
    url = (
        f"{DEFAULT_OSRM_BASE_URL}/route/v1/driving/"
        f"{start_lon},{start_lat};{end_lon},{end_lat}"
    )
    params = {
        "overview": "full",
        "geometries": "geojson",
        "steps": "true",
    }

    try:
        resp = requests.get(url, params=params, timeout=timeout_sec)
    except requests.RequestException as e:
        raise OSRMError(f"OSRM request failed: {e}") from e

    if resp.status_code != 200:
        raise OSRMError(f"OSRM returned HTTP {resp.status_code}: {resp.text}")

    data = resp.json()
    if data.get("code") != "Ok" or not data.get("routes"):
        raise OSRMError(f"OSRM bad response: {data}")

    return data
