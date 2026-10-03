import { useState, useEffect, useRef } from "react";
import { api } from "../api";

export default function Stats() {
  const [s, setS] = useState(null);
  const [message, setMessage] = useState("");
  const fichier = useRef(null);
  useEffect(() => { api.getStats().then(setS); }, []);

  const exporter = async () => {
    const texte = await api.exporterSauvegarde();
    const lien = document.createElement("a");
    lien.href = URL.createObjectURL(new Blob([texte], { type: "application/json" }));
    lien.download = `toeic-vocab-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
    lien.click();
    URL.revokeObjectURL(lien.href);
    setMessage("✅ Sauvegarde téléchargée. Garde ce fichier précieusement.");
  };

  const importer = async (e) => {
    const f = e.target.files[0];
    e.target.value = "";
    if (!f) return;
    if (!window.confirm("Remplacer ta progression actuelle par celle de ce fichier ?")) return;
    try {
      await api.importerSauvegarde(await f.text());
      setS(await api.getStats());
      setMessage("✅ Sauvegarde restaurée.");
    } catch (err) {
      setMessage(`❌ ${err.message}`);
    }
  };
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

      <div className="card">
        <h3>💾 Sauvegarde</h3>
        <p className="fiche-aide">
          Ta progression, tes favoris et tes mots ajoutés sont gardés dans ce navigateur.
          Exporte-les pour ne rien perdre ou pour les passer d'un appareil à l'autre.
        </p>
        <div className="fiche-boutons">
          <button className="btn-fiche oui" onClick={exporter}>⬇️ Exporter</button>
          <button className="btn-fiche non" onClick={() => fichier.current.click()}>⬆️ Importer</button>
        </div>
        <input ref={fichier} type="file" accept="application/json,.json" onChange={importer} hidden />
        {message && <p className="fiche-aide" style={{ marginTop: 10 }}>{message}</p>}
      </div>
    </div>
  );
}
