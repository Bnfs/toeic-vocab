import random
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models import Mot
from schemas import MotCreate, MotOut, QuizQuestion, MarquerVus

router = APIRouter()


@router.get("/", response_model=List[MotOut])
def lister_mots(categorie: str = None, db: Session = Depends(get_db)):
    q = db.query(Mot)
    if categorie:
        q = q.filter(Mot.categorie == categorie)
    return q.order_by(Mot.anglais).all()


@router.post("/", response_model=MotOut, status_code=201)
def ajouter_mot(data: MotCreate, db: Session = Depends(get_db)):
    existant = db.query(Mot).filter(Mot.anglais == data.anglais).first()
    if existant:
        raise HTTPException(status_code=400, detail="Ce mot existe déjà")
    mot = Mot(**data.model_dump())
    db.add(mot)
    db.commit()
    db.refresh(mot)
    return mot


@router.delete("/{mot_id}", status_code=204)
def supprimer_mot(mot_id: int, db: Session = Depends(get_db)):
    mot = db.query(Mot).filter(Mot.id == mot_id).first()
    if not mot:
        raise HTTPException(status_code=404, detail="Mot introuvable")
    db.delete(mot)
    db.commit()


@router.get("/categories", response_model=List[str])
def lister_categories(db: Session = Depends(get_db)):
    rows = db.query(Mot.categorie).distinct().all()
    return sorted(r[0] for r in rows)


@router.get("/quiz", response_model=List[QuizQuestion])
def generer_quiz(n: int = 10, categorie: str = None, db: Session = Depends(get_db)):
    q = db.query(Mot)
    if categorie:
        q = q.filter(Mot.categorie == categorie)
    tous = q.order_by(Mot.nb_vus.asc()).all()

    if len(tous) < 4:
        raise HTTPException(status_code=400, detail="Il faut au moins 4 mots pour générer un quiz")

    n = min(n, len(tous))

    # Mélange aléatoire dans chaque groupe de même nb_vus, puis prend les N moins vus
    random.shuffle(tous)
    tous.sort(key=lambda m: m.nb_vus)
    selection = tous[:n]
    random.shuffle(selection)

    questions = []
    for mot in selection:
        mauvaises = random.sample([m for m in tous if m.id != mot.id], min(3, len(tous) - 1))
        options = [m.francais for m in mauvaises] + [mot.francais]
        random.shuffle(options)
        questions.append(QuizQuestion(
            mot_id=mot.id,
            anglais=mot.anglais,
            options=options,
            correct=mot.francais,
        ))

    return questions


@router.post("/marquer-vus", status_code=200)
def marquer_vus(data: MarquerVus, db: Session = Depends(get_db)):
    db.query(Mot).filter(Mot.id.in_(data.ids)).update(
        {Mot.nb_vus: Mot.nb_vus + 1}, synchronize_session=False
    )
    db.commit()
    return {"ok": True}
