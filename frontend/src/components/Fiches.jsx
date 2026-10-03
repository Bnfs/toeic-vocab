import { useState, useEffect } from "react";
import { api } from "../api";

export default function Fiches() {
  const [categories, setCategories] = useState([]);
  const [categorie, setCategorie] = useState("");
  const [mode, setMode] = useState("normal");
  const [cartes, setCartes] = useState(null); // null = écran de config
  const [index, setIndex] = useState(0);
  const [retournee, setRetournee] = useState(false);
  const [resultats, setResultats] = useState([]);
  const [erreur, setErreur] = useState("");
  const [favoris, setFavoris] = useState({});

  useEffect(() => { api.getCategories().then(setCategories); }, []);

  const demarrer = async () => {
    setErreur("");
    const liste = await api.getFiches(20, categorie || undefined, mode);
    if (liste.length === 0) {
      setErreur("Aucune fiche à réviser pour ce choix.");
      return;
    }
    setFavoris(Object.fromEntries(liste.map(c => [c.id, c.favori])));
    setCartes(liste);
    setIndex(0);
    setRetournee(false);
    setResultats([]);
  };

  const basculerFavori = async (e, id) => {
    e.stopPropagation();
    const etat = await api.toggleFavori(id);
    setFavoris(prev => ({ ...prev, [id]: etat }));
  };

  const repondre = async (correct) => {
    const nouveaux = [...resultats, { mot_id: cartes[index].id, correct }];
    setResultats(nouveaux);
    setRetournee(false);
    if (index + 1 >= cartes.length) {
      await api.enregistrerResultats(nouveaux, "fiches");
    }
    setIndex(index + 1);
  };

  if (!cartes) return (
    <div className="quiz-config card">
      <h2>Fiches de révision</h2>
      <p className="fiche-aide">Lis le mot, essaie de te souvenir de la traduction, retourne la fiche puis dis si tu le savais.</p>
      {erreur && <p className="erreur">{erreur}</p>}
      <div className="config-ligne">
        <label>Mode</label>
        <div className="nb-select">
          <button className={`nb-btn ${mode === "normal" ? "active" : ""}`} onClick={() => setMode("normal")}>🧠 Révision intelligente</button>
          <button className={`nb-btn ${mode === "difficiles" ? "active" : ""}`} onClick={() => setMode("difficiles")}>🔥 Mots difficiles</button>
          <button className={`nb-btn ${mode === "favoris" ? "active" : ""}`} onClick={() => setMode("favoris")}>⭐ Favoris</button>
        </div>
      </div>
      <div className="config-ligne">
        <label>Thème (optionnel)</label>
        <select value={categorie} onChange={e => setCategorie(e.target.value)}>
          <option value="">Tous les thèmes</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <button className="btn-start" onClick={demarrer}>🃏 Commencer (20 fiches)</button>
    </div>
  );

  if (index >= cartes.length) {
    const sues = resultats.filter(r => r.correct).length;
    return (
      <div className="resultat card">
        <div className="resultat-emoji">🎉</div>
        <h2>Série terminée</h2>
        <p className="score-msg">{sues} / {cartes.length} fiches sues</p>
        <button className="btn-start" onClick={() => setCartes(null)}>🔄 Nouvelle série</button>
      </div>
    );
  }

  const carte = cartes[index];
  return (
    <div className="quiz-actif">
      <div className="quiz-topbar">
        <button className="btn-quitter" onClick={() => setCartes(null)}>← Quitter</button>
        <div className="quiz-compteur">{index + 1} / {cartes.length}</div>
      </div>
      <div className="quiz-progress-bar">
        <div className="quiz-progress-fill" style={{ width: `${((index + 1) / cartes.length) * 100}%` }} />
      </div>
      <div className="card fiche" onClick={() => setRetournee(true)}>
        <button className="btn-etoile" onClick={e => basculerFavori(e, carte.id)} title="Favori">
          {favoris[carte.id] ? "⭐" : "☆"}
        </button>
        <span className="badge-categorie">{carte.categorie}</span>
        <h2 className="question-mot">{carte.anglais}</h2>
        {retournee
          ? <p className="fiche-reponse">{carte.francais}</p>
          : <p className="fiche-aide">Touche la fiche pour voir la traduction</p>}
      </div>
      {retournee && (
        <div className="fiche-boutons">
          <button className="btn-fiche non" onClick={() => repondre(false)}>❌ À revoir</button>
          <button className="btn-fiche oui" onClick={() => repondre(true)}>✅ Je savais</button>
        </div>
      )}
    </div>
  );
}
