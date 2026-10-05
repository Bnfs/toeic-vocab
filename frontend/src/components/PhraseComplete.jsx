// Phrase complète avec la bonne réponse, sa traduction française et l'explication
export default function PhraseComplete({ q }) {
  if (!q.complete) return null;
  return (
    <div className="phrase-complete">
      <p>📖 {q.complete}</p>
      {q.fr && <p>🇫🇷 {q.fr}</p>}
      {q.traduction && <p className="fiche-aide">💡 {q.traduction}</p>}
    </div>
  );
}
