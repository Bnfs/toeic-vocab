import { useState } from "react";
import Vocabulaire from "./components/Vocabulaire";
import Quiz from "./components/Quiz";
import Fiches from "./components/Fiches";
import Stats from "./components/Stats";
import Examen from "./components/Examen";
import Erreurs from "./components/Erreurs";
import ObjectifJour from "./components/ObjectifJour";
import "./index.css";

const ONGLETS = [
  { id: "quiz", label: "🎯 Quiz" },
  { id: "examen", label: "⏱️ Examen" },
  { id: "erreurs", label: "❌ Erreurs" },
  { id: "fiches", label: "🃏 Fiches" },
  { id: "stats", label: "📊 Stats" },
  { id: "vocabulaire", label: "📚 Vocabulaire" },
];

export default function App() {
  const [onglet, setOnglet] = useState("quiz");
  const [cleQuiz, setCleQuiz] = useState(0); // force un nouveau Quiz quand on refait les erreurs
  const [modeQuiz, setModeQuiz] = useState("normal");

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-logo">📘 TOEIC Vocab</div>
        <nav className="app-nav">
          {ONGLETS.map(o => (
            <button
              key={o.id}
              className={`nav-btn ${onglet === o.id ? "active" : ""}`}
              onClick={() => { if (o.id === "quiz") setModeQuiz("normal"); setOnglet(o.id); }}
            >
              {o.label}
            </button>
          ))}
        </nav>
      </header>

      <ObjectifJour />

      <main className="app-main">
        {onglet === "quiz" && <Quiz key={cleQuiz} modeInitial={modeQuiz} />}
        {onglet === "erreurs" && <Erreurs onRefaire={() => { setModeQuiz("erreurs"); setCleQuiz(k => k + 1); setOnglet("quiz"); }} />}
        {onglet === "examen" && <Examen />}
        {onglet === "fiches" && <Fiches />}
        {onglet === "stats" && <Stats />}
        {onglet === "vocabulaire" && <Vocabulaire />}
      </main>
    </div>
  );
}
