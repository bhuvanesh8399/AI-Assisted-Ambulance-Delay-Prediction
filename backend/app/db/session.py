from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Fully open-source DB: PostgreSQL recommended, SQLite fallback for demo/dev
# Example:
# export DATABASE_URL="postgresql+psycopg2://user:pass@localhost:5432/ambulance"
# or:
# export DATABASE_URL="sqlite:///./app.db"

import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")

connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, echo=False, future=True, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
