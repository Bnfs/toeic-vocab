const GROUPES = [
  ["Travail", ["emploi", "vie de bureau", "métiers", "finance", "moyens de paiement", "marketing", "industrie", "communication", "commandes et expéditions", "appels téléphoniques", "informatique"]],
  ["Voyage et sorties", ["voyage", "transport", "conduite", "restaurants", "divertissement", "lieux"]],
  ["Vie quotidienne", ["achats", "la maison", "vêtements", "objets", "temps", "environnement", "urgences"]],
  ["Langue", ["général", "verbes", "verbes à particule", "prépositions", "faux amis", "expressions"]],
  ["Sources", ["fiche anglaisgratuit", "workbook"]],
];

// Range les catégories par famille ; ce qui n'est pas listé (catégories créées à la main) va dans « Autres »
function grouper(categories) {
  const reste = new Set(categories);
  const groupes = GROUPES.map(([nom, liste]) => {
    const cats = liste.filter(c => reste.delete(c));
    return [nom, cats];
  }).filter(([, cats]) => cats.length);
  if (reste.size) groupes.push(["Autres", [...reste].sort()]);
  return groupes;
}

export default function SelectCategorie({ value, onChange, categories, toutes }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}>
      {toutes && <option value="">{toutes}</option>}
      {grouper(categories.filter(Boolean)).map(([nom, cats]) => (
        <optgroup key={nom} label={nom}>
          {cats.map(c => <option key={c} value={c}>{c}</option>)}
        </optgroup>
      ))}
    </select>
  );
}
