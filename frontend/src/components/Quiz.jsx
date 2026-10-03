import { useState } from "react";
import { api } from "../api";

export default function Quiz() {
  const [etape, setEtape] = useState("config"); // config | quiz | resultat
  const [nbQuestions, setNbQuestions] = useState(10);
  const [categorie, setCategorie] = useState("");
  const [mode, setMode] = useState("normal"); // normal | difficiles | favoris
  const [type, setType] = useState("traduction"); // traduction | trou
  const [favoris, setFavoris] = useState({}); // mot_id -> bool
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [reponses, setReponses] = useState([]); // indexé par question : { mot_id, choix, correct }
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");

  // Le choix de la question courante est dérivé des réponses déjà données
  const choix = reponses[index]?.choix ?? null;

  const categories = [
    "", "faux amis", "emploi", "finance", "communication", "voyage",
    "marketing", "informatique", "environnement", "industrie",
    "divertissement", "objets", "métiers", "lieux", "vêtements", "transport", "verbes", "général"
  ];

  const demarrer = async () => {
    setChargement(true);
    setErreur("");
    try {
      const q = await api.getQuiz(nbQuestions, categorie || undefined, mode, type);
      setQuestions(q);
      setFavoris(Object.fromEntries(q.map(x => [x.mot_id, x.favori])));
      setIndex(0);
      setReponses([]);
      setEtape("quiz");
    } catch (e) {
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  };

  const selectionner = (option) => {
    if (choix !== null) return; // déjà répondu : on ne change pas la réponse
    setReponses(prev => {
      const copie = [...prev];
      copie[index] = { mot_id: questions[index].mot_id, choix: option, correct: option === questions[index].correct };
      return copie;
    });
  };

  const suivant = async () => {
    if (index + 1 >= questions.length) {
      // Marquer tous les mots du quiz comme vus
      await api.enregistrerResultats(questions.map((q, i) => ({ mot_id: q.mot_id, correct: !!reponses[i]?.correct }))).catch(() => {});
      setEtape("resultat");
    } else {
      setIndex(i => i + 1);
    }
  };

  const precedent = () => {
    if (index > 0) setIndex(i => i - 1);
  };

  const quitter = () => {
    setQuestions([]);
    setReponses([]);
    setIndex(0);
    setEtape("config");
  };

  const basculerFavori = async (id) => {
    const etat = await api.toggleFavori(id);
    setFavoris(prev => ({ ...prev, [id]: etat }));
  };

  const score = reponses.filter(r => r?.correct).length;

  if (etape === "config") return (
    <div className="quiz-config card">
      <h2>Configurer le quiz</h2>
      {erreur && <p className="erreur">{erreur}</p>}
      <div className="config-ligne">
        <label>Type de question</label>
        <div className="nb-select">
          <button className={`nb-btn ${type === "traduction" ? "active" : ""}`} onClick={() => setType("traduction")}>🔤 Traduction</button>
          <button className={`nb-btn ${type === "trou" ? "active" : ""}`} onClick={() => setType("trou")}>✏️ Phrase à trous</button>
        </div>
      </div>
      <div className="config-ligne">
        <label>Mode</label>
        <div className="nb-select">
          <button className={`nb-btn ${mode === "normal" ? "active" : ""}`} onClick={() => setMode("normal")}>🧠 Révision intelligente</button>
          <button className={`nb-btn ${mode === "difficiles" ? "active" : ""}`} onClick={() => setMode("difficiles")}>🔥 Mots difficiles</button>
          <button className={`nb-btn ${mode === "favoris" ? "active" : ""}`} onClick={() => setMode("favoris")}>⭐ Favoris</button>
        </div>
      </div>
      <div className="config-ligne">
        <label>Nombre de questions</label>
        <div className="nb-select">
          {[5, 10, 20, 30, 50].map(n => (
            <button
              key={n}
              className={`nb-btn ${nbQuestions === n ? "active" : ""}`}
              onClick={() => setNbQuestions(n)}
            >{n}</button>
          ))}
        </div>
      </div>
      <div className="config-ligne">
        <label>Thème (optionnel)</label>
        <select value={categorie} onChange={e => setCategorie(e.target.value)}>
          {categories.map(c => (
            <option key={c} value={c}>{c || "Tous les thèmes"}</option>
          ))}
        </select>
      </div>
      <button className="btn-start" onClick={demarrer} disabled={chargement}>
        {chargement ? "Chargement..." : "🚀 Commencer"}
      </button>
    </div>
  );

  if (etape === "resultat") {
    const pct = Math.round((score / questions.length) * 100);
    const emoji = pct >= 80 ? "🏆" : pct >= 60 ? "👍" : "📖";
    return (
      <div className="resultat card">
        <div className="resultat-emoji">{emoji}</div>
        <h2>Résultat</h2>
        <div className="score-cercle">
          <span className="score-nb">{score}/{questions.length}</span>
          <span className="score-pct">{pct}%</span>
        </div>
        <p className="score-msg">
          {pct >= 80 ? "Excellent ! Continue comme ça !" : pct >= 60 ? "Bon travail, encore un effort !" : "Revois ces mots et retente !"}
        </p>
        <div className="recap-liste">
          {questions.map((q, i) => {
            const rep = reponses[i];
            return (
              <div key={q.mot_id} className={`recap-item ${rep?.correct ? "correct" : "faux"}`}>
                <span className="recap-icon">{rep?.correct ? "✅" : "❌"}</span>
                <span className="recap-mot">{q.type === "trou" ? q.correct : q.anglais}</span>
                <span className="recap-trad">→ {q.traduction}</span>
              </div>
            );
          })}
        </div>
        <button className="btn-start" onClick={() => setEtape("config")}>🔄 Nouveau quiz</button>
      </div>
    );
  }

  const question = questions[index];
  const progression = ((index + 1) / questions.length) * 100;

  return (
    <div className="quiz-actif">
      <div className="quiz-topbar">
        <button className="btn-quitter" onClick={quitter}>← Quitter</button>
        <div className="quiz-compteur">{index + 1} / {questions.length}</div>
      </div>
      <div className="quiz-progress-bar">
        <div className="quiz-progress-fill" style={{ width: `${progression}%` }} />
      </div>

      <div className="card question-card">
        <button className="btn-etoile" onClick={() => basculerFavori(question.mot_id)} title="Favori">
          {favoris[question.mot_id] ? "⭐" : "☆"}
        </button>
        <p className="question-label">
          {question.type === "trou" ? "Complète la phrase" : "Quelle est la traduction ?"}
        </p>
        <h2 className={question.type === "trou" ? "question-phrase" : "question-mot"}>{question.anglais}</h2>
        <div className="options">
          {question.options.map(opt => {
            let cls = "option-btn";
            if (choix !== null) {
              if (opt === question.correct) cls += " correct";
              else if (opt === choix) cls += " faux";
              else cls += " grise";
            }
            return (
              <button key={opt} className={cls} onClick={() => selectionner(opt)}>
                {opt}
              </button>
            );
          })}
        </div>
        {choix !== null && question.type === "trou" && (
          <p className="fiche-aide" style={{ marginTop: 12 }}>💡 {question.traduction}</p>
        )}
        <div className="quiz-nav">
          <button className="btn-precedent" onClick={precedent} disabled={index === 0}>
            ← Précédent
          </button>
          {choix !== null && (
            <button className="btn-suivant" onClick={suivant}>
              {index + 1 >= questions.length ? "Voir les résultats →" : "Suivant →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
