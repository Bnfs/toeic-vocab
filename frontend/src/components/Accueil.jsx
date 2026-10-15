import { useState, useEffect } from "react";
import { api } from "../api";

export default function Accueil({ aller }) {
  const [nbErreurs, setNbErreurs] = useState(0);
  useEffect(() => { api.getErreurs().then(l => setNbErreurs(l.length)); }, []);

  return (
    <div className="accueil">
      <div className="card">
        <h2>👋 Bienvenue</h2>
        <p className="fiche-aide">Choisis par où commencer.</p>
        <button className="btn-start" onClick={() => aller("entrainer", "quiz")}>🚀 Continuer mes révisions</button>
      </div>
      <div className="accueil-grille">
        <button className="card accueil-tuile" onClick={() => aller("entrainer", "erreurs")}>
          <span className="accueil-emoji">❌</span>
          <strong>{nbErreurs} erreur{nbErreurs > 1 ? "s" : ""} à revoir</strong>
        </button>
        <button className="card accueil-tuile" onClick={() => aller("entrainer", "examen")}>
          <span className="accueil-emoji">⏱️</span>
          <strong>Examen blanc</strong>
        </button>
        <button className="card accueil-tuile" onClick={() => aller("apprendre", "fiches")}>
          <span className="accueil-emoji">🃏</span>
          <strong>Fiches</strong>
        </button>
        <button className="card accueil-tuile" onClick={() => aller("apprendre", "grammaire")}>
          <span className="accueil-emoji">📖</span>
          <strong>Grammaire</strong>
        </button>
      </div>
    </div>
  );
}
