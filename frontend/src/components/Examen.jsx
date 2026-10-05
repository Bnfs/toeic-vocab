import { useState, useEffect, useRef } from "react";
import { api } from "../api";
import PhraseComplete from "./PhraseComplete";

const SEC_PAR_QUESTION = 30;

const formater = (sec) => `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;

export default function Examen() {
  const [etape, setEtape] = useState("config"); // config | examen | resultat
  const [nb, setNb] = useState(50);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [reponses, setReponses] = useState({}); // index -> option choisie
  const [reste, setReste] = useState(0);
  const [duree, setDuree] = useState(0);
  const debut = useRef(0);
  const termine = useRef(false);

  const demarrer = async () => {
    const q = await api.getExamen(nb);
    setQuestions(q);
    setReponses({});
    setIndex(0);
    setReste(q.length * SEC_PAR_QUESTION);
    termine.current = false;
    debut.current = Date.now();
    setEtape("examen");
  };

  const finir = async (rep, qs) => {
    if (termine.current) return;
    termine.current = true;
    setDuree(Math.round((Date.now() - debut.current) / 1000));
    await api.enregistrerResultats(
      qs.map((q, i) => ({ mot_id: q.mot_id, correct: rep[i] === q.correct, question: q })), "examen"
    ).catch(() => {});
    setEtape("resultat");
  };

  // Le minuteur est basé sur l'horloge pour rester juste même si l'onglet est en arrière-plan
  useEffect(() => {
    if (etape !== "examen") return;
    const total = questions.length * SEC_PAR_QUESTION;
    const t = setInterval(() => {
      const r = total - Math.floor((Date.now() - debut.current) / 1000);
      setReste(Math.max(0, r));
      if (r <= 0) finir(reponses, questions);
    }, 500);
    return () => clearInterval(t);
  });

  if (etape === "config") return (
    <div className="quiz-config card">
      <h2>⏱️ Examen blanc</h2>
      <p className="fiche-aide">
        Conditions réelles : questions mélangées (vraies phrases TOEIC partie 5, phrases à trous, traductions), pas de correction
        pendant l'épreuve, {SEC_PAR_QUESTION} secondes par question. La correction s'affiche à la fin.
      </p>
      <div className="config-ligne">
        <label>Nombre de questions</label>
        <div className="nb-select">
          {[25, 50, 100].map(n => (
            <button key={n} className={`nb-btn ${nb === n ? "active" : ""}`} onClick={() => setNb(n)}>
              {n} <small>({formater(n * SEC_PAR_QUESTION)})</small>
            </button>
          ))}
        </div>
      </div>
      <button className="btn-start" onClick={demarrer}>🚀 Lancer l'examen</button>
    </div>
  );

  if (etape === "resultat") {
    const bonnes = questions.filter((q, i) => reponses[i] === q.correct).length;
    const pct = Math.round(100 * bonnes / questions.length);
    const sansReponse = questions.filter((_, i) => reponses[i] === undefined).length;
    return (
      <div className="resultat card">
        <div className="resultat-emoji">{pct >= 80 ? "🏆" : pct >= 60 ? "👍" : "📖"}</div>
        <h2>Résultat de l'examen</h2>
        <div className="score-cercle">
          <span className="score-nb">{bonnes}/{questions.length}</span>
          <span className="score-pct">{pct}%</span>
        </div>
        <p className="score-msg">
          Temps : {formater(duree)} / {formater(questions.length * SEC_PAR_QUESTION)}
          {sansReponse > 0 && ` · ${sansReponse} sans réponse`}
        </p>
        <div className="recap-liste">
          {questions.map((q, i) => {
            const ok = reponses[i] === q.correct;
            return (
              <div key={i} className={`recap-item ${ok ? "correct" : "faux"}`}>
                <span className="recap-icon">{ok ? "✅" : "❌"}</span>
                <span className="recap-mot">{q.type === "trou" || q.type === "part5" ? q.correct : q.anglais}</span>
                <span className="recap-trad">→ {q.traduction}{!ok && reponses[i] ? ` (tu as répondu : ${reponses[i]})` : ""}</span>
                {q.fr && <PhraseComplete q={q} />}
              </div>
            );
          })}
        </div>
        <button className="btn-start" onClick={() => setEtape("config")}>🔄 Nouvel examen</button>
      </div>
    );
  }

  const q = questions[index];
  const choisie = reponses[index];
  const urgent = reste <= 60;

  const choisir = (opt) => setReponses(prev => ({ ...prev, [index]: opt }));
  const suivant = () => {
    if (index + 1 >= questions.length) finir(reponses, questions);
    else setIndex(index + 1);
  };

  return (
    <div className="quiz-actif">
      <div className="quiz-topbar">
        <div className="quiz-compteur">{index + 1} / {questions.length}</div>
        <div className={`chrono ${urgent ? "urgent" : ""}`}>⏱️ {formater(reste)}</div>
      </div>
      <div className="quiz-progress-bar">
        <div className="quiz-progress-fill" style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
      </div>
      <div className="card question-card">
        <p className="question-label">{q.type === "trou" || q.type === "part5" ? "Complète la phrase" : "Quelle est la traduction ?"}</p>
        <h2 className={q.type === "trou" || q.type === "part5" ? "question-phrase" : "question-mot"}>{q.anglais}</h2>
        <div className="options">
          {q.options.map(opt => (
            <button key={opt} className={`option-btn ${choisie === opt ? "choisie" : ""}`} onClick={() => choisir(opt)}>
              {opt}
            </button>
          ))}
        </div>
        <div className="quiz-nav">
          <button className="btn-precedent" onClick={() => setIndex(index - 1)} disabled={index === 0}>← Précédent</button>
          <button className="btn-suivant" onClick={suivant}>
            {index + 1 >= questions.length ? "Terminer ✔" : "Suivant →"}
          </button>
        </div>
      </div>
    </div>
  );
}
