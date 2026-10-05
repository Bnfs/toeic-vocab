import { useState, useEffect } from "react";
import { api } from "../api";
import PhraseComplete from "./PhraseComplete";

export default function Erreurs({ onRefaire }) {
  const [liste, setListe] = useState(null);
  useEffect(() => { api.getErreurs().then(setListe); }, []);
  if (!liste) return null;

  const effacer = async () => {
    if (!window.confirm("Effacer toute la liste d'erreurs ?")) return;
    await api.effacerErreurs();
    setListe([]);
  };

  if (liste.length === 0) return (
    <div className="card resultat">
      <div className="resultat-emoji">🎉</div>
      <h2>Aucune erreur à revoir</h2>
      <p className="fiche-aide">Les questions que tu rates dans les quiz et les examens apparaîtront ici pour les refaire.</p>
    </div>
  );

  return (
    <div className="erreurs-page">
      <div className="card">
        <h2>❌ {liste.length} question{liste.length > 1 ? "s" : ""} à revoir</h2>
        <p className="fiche-aide">Une bonne réponse dans « Mes erreurs » retire la question de la liste.</p>
        <div className="fiche-boutons">
          <button className="btn-fiche oui" onClick={onRefaire}>🔁 Refaire mes erreurs</button>
          <button className="btn-fiche non" onClick={effacer}>🗑️ Tout effacer</button>
        </div>
      </div>
      {liste.map(q => (
        <div key={`${q.type}|${q.anglais}`} className="card">
          {q.type === "traduction" || q.type === "inverse"
            ? <p><strong>{q.anglais}</strong> → {q.correct}</p>
            : <PhraseComplete q={q} />}
          {(q.type === "traduction" || q.type === "inverse") && q.traduction && (
            <p className="fiche-aide">💡 {q.traduction}</p>
          )}
        </div>
      ))}
    </div>
  );
}
