import { useState, useEffect } from "react";
import { api } from "../api";

export default function Vocabulaire() {
  const [mots, setMots] = useState([]);
  const [filtreCategorie, setFiltreCategorie] = useState("");
  const [recherche, setRecherche] = useState("");
  const [anglais, setAnglais] = useState("");
  const [francais, setFrancais] = useState("");
  const [categorie, setCategorie] = useState("général");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);

  const categories = [
    "général", "faux amis", "emploi", "finance", "communication", "travel",
    "RH", "marketing", "informatique", "environnement", "industrie",
    "divertissement", "objets", "métiers", "lieux", "vêtements", "transport", "verbes"
  ];

  useEffect(() => {
    charger();
  }, [filtreCategorie]);

  const charger = async () => {
    const data = await api.getMots(filtreCategorie || undefined);
    setMots(data);
  };

  const ajouter = async (e) => {
    e.preventDefault();
    setErreur("");
    setChargement(true);
    try {
      await api.ajouterMot({ anglais: anglais.trim(), francais: francais.trim(), categorie });
      setAnglais("");
      setFrancais("");
      await charger();
    } catch (e) {
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  };

  const supprimer = async (id) => {
    await api.supprimerMot(id);
    setMots(prev => prev.filter(m => m.id !== id));
  };

  const motsFiltres = mots.filter(m =>
    m.anglais.toLowerCase().includes(recherche.toLowerCase()) ||
    m.francais.toLowerCase().includes(recherche.toLowerCase())
  );

  return (
    <div className="vocab-page">
      <div className="vocab-sidebar">
        <div className="card">
          <h3>Ajouter un mot</h3>
          {erreur && <p className="erreur">{erreur}</p>}
          <form onSubmit={ajouter} className="form-ajout">
            <input
              placeholder="Anglais *"
              value={anglais}
              onChange={e => setAnglais(e.target.value)}
              required
            />
            <input
              placeholder="Français *"
              value={francais}
              onChange={e => setFrancais(e.target.value)}
              required
            />
            <select value={categorie} onChange={e => setCategorie(e.target.value)}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <button type="submit" className="btn-primary" disabled={chargement}>
              {chargement ? "..." : "+ Ajouter"}
            </button>
          </form>
        </div>
      </div>

      <div className="vocab-liste">
        <div className="vocab-filtres">
          <input
            className="recherche"
            placeholder="🔍 Rechercher..."
            value={recherche}
            onChange={e => setRecherche(e.target.value)}
          />
          <select value={filtreCategorie} onChange={e => setFiltreCategorie(e.target.value)}>
            <option value="">Tous les thèmes</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <span className="nb-mots">{motsFiltres.length} mots</span>
        </div>

        <div className="mots-grid">
          {motsFiltres.map(m => (
            <div key={m.id} className="mot-card">
              <div className="mot-contenu">
                <span className="mot-anglais">{m.anglais}</span>
                <span className="mot-fleche">→</span>
                <span className="mot-francais">{m.francais}</span>
              </div>
              <div className="mot-footer">
                <span className="badge-categorie">{m.categorie}</span>
                <button className="btn-suppr" onClick={() => supprimer(m.id)}>✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
