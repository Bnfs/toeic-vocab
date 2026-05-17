import { useState } from "react";
import Vocabulaire from "./components/Vocabulaire";
import Quiz from "./components/Quiz";
import "./index.css";

const ONGLETS = [
  { id: "quiz", label: "🎯 Quiz" },
  { id: "vocabulaire", label: "📚 Vocabulaire" },
];

export default function App() {
  const [onglet, setOnglet] = useState("quiz");

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-logo">📘 TOEIC Vocab</div>
        <nav className="app-nav">
          {ONGLETS.map(o => (
            <button
              key={o.id}
              className={`nav-btn ${onglet === o.id ? "active" : ""}`}
              onClick={() => setOnglet(o.id)}
            >
              {o.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="app-main">
        {onglet === "quiz" && <Quiz />}
        {onglet === "vocabulaire" && <Vocabulaire />}
      </main>
    </div>
  );
}
