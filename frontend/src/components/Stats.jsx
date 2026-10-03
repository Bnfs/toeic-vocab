import { useState, useEffect } from "react";
import { api } from "../api";

export default function Stats() {
  const [s, setS] = useState(null);
  useEffect(() => { api.getStats().then(setS); }, []);
  if (!s) return null;

  const tuiles = [
    ["🔥", `${s.serie} j`, "Série de jours"],
    ["📖", `${s.vus}/${s.total}`, "Mots vus"],
    ["🏅", s.maitrises, "Mots maîtrisés"],
    ["⚠️", s.difficiles, "Mots difficiles"],
    ["🔁", s.aReviser, "À réviser"],
    ["🎯", s.moyenne === null ? "–" : `${s.moyenne}%`, "Réussite moyenne"],
  ];

  return (
    <div className="stats-page">
      <div className="stats-tuiles">
        {tuiles.map(([ico, val, label]) => (
          <div key={label} className="card tuile">
            <div className="tuile-ico">{ico}</div>
            <div className="tuile-val">{val}</div>
            <div className="tuile-label">{label}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Derniers entraînements</h3>
        {s.derniers.length === 0 ? <p className="fiche-aide">Aucun entraînement pour l'instant.</p> : (
          <div className="stats-barres">
            {s.derniers.map((h, i) => {
              const pct = Math.round(100 * h.bonnes / h.total);
              return (
                <div key={i} className="stats-barre" title={`${h.bonnes}/${h.total} (${h.type})`}>
                  <span className="stats-barre-pct">{pct}%</span>
                  <div className="stats-barre-fill" style={{ height: `${Math.max(pct, 4)}%` }} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card">
        <h3>Progression par thème</h3>
        {s.parCategorie.map(([nom, c]) => (
          <div key={nom} className="cat-ligne">
            <div className="cat-nom">{nom} <span>{c.vus}/{c.total}</span></div>
            <div className="quiz-progress-bar cat-barre">
              <div className="cat-vus" style={{ width: `${100 * c.vus / c.total}%` }} />
              <div className="cat-maitrise" style={{ width: `${100 * c.maitrises / c.total}%` }} />
            </div>
          </div>
        ))}
        <p className="fiche-aide">Clair = vus · Foncé = maîtrisés</p>
      </div>
    </div>
  );
}
