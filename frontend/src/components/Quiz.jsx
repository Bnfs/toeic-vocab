import { useState } from "react";
import { api } from "../api";

export default function Quiz() {
  const [etape, setEtape] = useState("config"); // config | quiz | resultat
  const [nbQuestions, setNbQuestions] = useState(10);
  const [categorie, setCategorie] = useState("");
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [reponses, setReponses] = useState([]);
  const [choix, setChoix] = useState(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");

  const categories = [
    "", "faux amis", "emploi", "finance", "communication", "travel",
    "RH", "marketing", "informatique", "environnement", "industrie",
    "divertissement", "objets", "métiers", "lieux", "vêtements", "transport", "verbes", "général"
  ];

  const demarrer = async () => {
    setChargement(true);
    setErreur("");
    try {
      const q = await api.getQuiz(nbQuestions, categorie || undefined);
      setQuestions(q);
      setIndex(0);
      setReponses([]);
      setChoix(null);
      setEtape("quiz");
    } catch (e) {
      setErreur(e.message);
    } finally {
      setChargement(false);
    }
  };

  const selectionner = (option) => {
    if (choix !== null) return;
    setChoix(option);
    setReponses(prev => [...prev, { mot_id: questions[index].mot_id, correct: option === questions[index].correct }]);
  };

  const suivant = () => {
    if (index + 1 >= questions.length) {
      setEtape("resultat");
    } else {
      setIndex(i => i + 1);
      setChoix(null);
    }
  };

  const score = reponses.filter(r => r.correct).length;

  if (etape === "config") return (
    <div className="quiz-config card">
      <h2>Configurer le quiz</h2>
      {erreur && <p className="erreur">{erreur}</p>}
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
                <span className="recap-mot">{q.anglais}</span>
                <span className="recap-trad">→ {q.correct}</span>
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
      <div className="quiz-progress-bar">
        <div className="quiz-progress-fill" style={{ width: `${progression}%` }} />
      </div>
      <div className="quiz-compteur">{index + 1} / {questions.length}</div>

      <div className="card question-card">
        <p className="question-label">Quelle est la traduction ?</p>
        <h2 className="question-mot">{question.anglais}</h2>
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
        {choix !== null && (
          <button className="btn-suivant" onClick={suivant}>
            {index + 1 >= questions.length ? "Voir les résultats →" : "Suivant →"}
          </button>
        )}
      </div>
    </div>
  );
}
