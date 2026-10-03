import { useState, useEffect } from "react";
import { api } from "../api";

const CHOIX = [10, 20, 30, 50, 100];

export default function ObjectifJour() {
  const [d, setD] = useState(null);

  useEffect(() => {
    const maj = () => api.getObjectif().then(setD);
    maj();
    window.addEventListener("toeic-update", maj);
    return () => window.removeEventListener("toeic-update", maj);
  }, []);

  if (!d) return null;
  const pct = Math.min(100, Math.round(100 * d.fait / d.objectif));
  const atteint = d.fait >= d.objectif;

  return (
    <div className={`objectif ${atteint ? "atteint" : ""}`}>
      <div className="objectif-texte">
        {atteint ? "🎉 Objectif du jour atteint !" : "🎯 Objectif du jour"}
        <strong> {d.fait} / {d.objectif} mots</strong>
      </div>
      <select value={d.objectif} onChange={e => api.setObjectif(Number(e.target.value))} title="Changer l'objectif">
        {CHOIX.map(n => <option key={n} value={n}>{n} mots</option>)}
      </select>
      <div className="objectif-barre"><div className="objectif-fill" style={{ width: `${pct}%` }} /></div>
    </div>
  );
}
