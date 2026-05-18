from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from database import Base

class Mot(Base):
    __tablename__ = "mots"

    id = Column(Integer, primary_key=True, index=True)
    anglais = Column(String, nullable=False)
    francais = Column(String, nullable=False)
    categorie = Column(String, default="général")
    date_ajout = Column(DateTime, default=datetime.utcnow)
    nb_vus = Column(Integer, default=0)
