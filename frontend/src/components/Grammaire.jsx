import { useState } from "react";
import themes from "../grammaire.json";

const KEY = "toeic_grammaire";
const lire = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };

export default function Grammaire() {
  const [themeId, setThemeId] = useState(themes[0].id);
  const [maitrise, setMaitrise] = useState(lire);
  const [reponses, setReponses] = useState({});
  const [filtre, setFiltre] = useState("tous");
  const theme = themes.find(t => t.id === themeId);

  const cle = i => `${theme.id}:${i}`;
  const basculer = i => {
    const m = { ...maitrise, [cle(i)]: !maitrise[cle(i)] };
    setMaitrise(m);
    try { localStorage.setItem(KEY, JSON.stringify(m)); } catch { /* ignore */ }
  };
  const nbMaitrise = theme.exos.filter((_, i) => maitrise[cle(i)]).length;
  const liste = theme.exos.map((e, i) => ({ e, i })).filter(({ i }) =>
    filtre === "tous" || (filtre === "revoir" ? !maitrise[cle(i)] : maitrise[cle(i)]));

  return (
    <div className="grammaire-page">
      {themes.length > 1 && (
        <select className="gram-select" value={themeId} onChange={e => setThemeId(e.target.value)}>
          {[...new Set(themes.map(t => t.groupe))].map(g => (
            <optgroup key={g} label={g}>
              {themes.filter(t => t.groupe === g).map(t => <option key={t.id} value={t.id}>{t.titre}</option>)}
            </optgroup>
          ))}
        </select>
      )}
      <div className="card">
        <h2>📖 {theme.titre}</h2>
        {theme.fiche.map(bloc => (
          <div key={bloc.titre} className="gram-bloc">
            <h3>{bloc.titre}</h3>
            <ul>{bloc.regles.map(r => <li key={r}>{r}</li>)}</ul>
          </div>
        ))}
      </div>

      <div className="card">
        <h2>✏️ Exercices — {nbMaitrise}/{theme.exos.length} maîtrisés</h2>
        <div className="fiche-boutons">
          {[["tous", "Tous"], ["revoir", "À revoir"], ["maitrise", "Maîtrisés"]].map(([id, l]) => (
            <button key={id} className={`btn-fiche ${filtre === id ? "oui" : ""}`} onClick={() => setFiltre(id)}>{l}</button>
          ))}
        </div>
      </div>

      {liste.map(({ e, i }) => {
        const rep = reponses[cle(i)];
        const [avant, apres] = e.phrase.split("___");
        return (
          <div key={i} className="card">
            <p className="gram-phrase">{avant}<strong>{rep ? e.reponse : "_____"}</strong>{apres}</p>
            <div className="gram-options">
              {e.options.map(o => (
                <button
                  key={o}
                  disabled={!!rep}
                  className={`gram-opt ${rep && o === e.reponse ? "bonne" : ""} ${rep === o && o !== e.reponse ? "mauvaise" : ""}`}
                  onClick={() => setReponses(r => ({ ...r, [cle(i)]: o }))}
                >{o}</button>
              ))}
            </div>
            {rep && (
              <div className="phrase-complete">
                <p>{rep === e.reponse ? "✅ Bonne réponse" : `❌ Réponse : ${e.reponse}`}</p>
                <p>🇫🇷 {e.fr}</p>
                <p>💡 {e.pourquoi}</p>
              </div>
            )}
            <label className="gram-check">
              <input type="checkbox" checked={!!maitrise[cle(i)]} onChange={() => basculer(i)} /> Je maîtrise cette phrase
            </label>
            {rep && <button className="btn-fiche" onClick={() => setReponses(r => ({ ...r, [cle(i)]: undefined }))}>↺ Réessayer</button>}
          </div>
        );
      })}
      {liste.length === 0 && <div className="card"><p className="fiche-aide">Rien dans cette liste.</p></div>}
    </div>
  );
}
