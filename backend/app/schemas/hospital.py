from pydantic import BaseModel


class HospitalCreate(BaseModel):
    id: str
    name: str
    lat: float
    lon: float


class HospitalOut(BaseModel):
    id: str
    name: str
    lat: float
    lon: float

    class Config:
        from_attributes = True
