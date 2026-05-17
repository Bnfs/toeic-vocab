from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import mots
import seed

Base.metadata.create_all(bind=engine)
seed.seed()

app = FastAPI(title="TOEIC Vocab")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(mots.router, prefix="/mots", tags=["Mots"])
