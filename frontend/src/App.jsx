import { useState } from "react";
import Vocabulaire from "./components/Vocabulaire";
import Quiz from "./components/Quiz";
import Fiches from "./components/Fiches";
import Stats from "./components/Stats";
import Examen from "./components/Examen";
import Erreurs from "./components/Erreurs";
import Grammaire from "./components/Grammaire";
import Accueil from "./components/Accueil";
import ObjectifJour from "./components/ObjectifJour";
import "./index.css";

const SECTIONS = [
  { id: "accueil", label: "🏠 Accueil" },
  { id: "entrainer", label: "🎯 S'entraîner", sous: [["quiz", "Quiz"], ["examen", "Examen"], ["erreurs", "Erreurs"]] },
  { id: "apprendre", label: "📚 Apprendre", sous: [["fiches", "Fiches"], ["vocabulaire", "Vocabulaire"], ["grammaire", "Grammaire"]] },
  { id: "progres", label: "📊 Progrès" },
];

export default function App() {
  const [section, setSection] = useState("accueil");
  const [sous, setSous] = useState({ entrainer: "quiz", apprendre: "fiches" });
  const [cleQuiz, setCleQuiz] = useState(0); // force un nouveau Quiz quand on refait les erreurs
  const [modeQuiz, setModeQuiz] = useState("normal");

  const aller = (s, ss) => {
    if (ss) setSous(prev => ({ ...prev, [s]: ss }));
    if (s === "entrainer" && ss === "quiz") setModeQuiz("normal");
    setSection(s);
  };
  const courante = SECTIONS.find(s => s.id === section);
  const page = sous[section];

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-logo">📘 TOEIC Vocab</div>
        <nav className="app-nav">
          {SECTIONS.map(s => (
            <button key={s.id} className={`nav-btn ${section === s.id ? "active" : ""}`} onClick={() => aller(s.id)}>
              {s.label}
            </button>
          ))}
        </nav>
      </header>

      <ObjectifJour />

      <main className="app-main">
        {courante.sous && (
          <div className="sous-nav">
            {courante.sous.map(([id, label]) => (
              <button key={id} className={`sous-btn ${page === id ? "active" : ""}`} onClick={() => aller(section, id)}>{label}</button>
            ))}
          </div>
        )}
        {section === "accueil" && <Accueil aller={aller} />}
        {section === "entrainer" && page === "quiz" && <Quiz key={cleQuiz} modeInitial={modeQuiz} />}
        {section === "entrainer" && page === "erreurs" && <Erreurs onRefaire={() => { setCleQuiz(k => k + 1); setSous(p => ({ ...p, entrainer: "quiz" })); setModeQuiz("erreurs"); }} />}
        {section === "entrainer" && page === "examen" && <Examen />}
        {section === "apprendre" && page === "fiches" && <Fiches />}
        {section === "apprendre" && page === "vocabulaire" && <Vocabulaire />}
        {section === "apprendre" && page === "grammaire" && <Grammaire />}
        {section === "progres" && <Stats />}
      </main>
    </div>
  );
}
