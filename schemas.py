from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class MotCreate(BaseModel):
    anglais: str
    francais: str
    categorie: str = "général"

class MotOut(BaseModel):
    id: int
    anglais: str
    francais: str
    categorie: str
    date_ajout: datetime
    model_config = {"from_attributes": True}

class QuizQuestion(BaseModel):
    mot_id: int
    anglais: str
    options: list[str]
    correct: str

class QuizReponse(BaseModel):
    mot_id: int
    reponse: str

class MarquerVus(BaseModel):
    ids: list[int]
