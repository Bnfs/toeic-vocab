// Version 100 % locale : les mots sont dans vocab.json, la progression et les
// mots ajoutés/supprimés sont gardés dans le localStorage de l'appareil.
import VOCAB from "./vocab.json";
import CLOZE from "./cloze.json";
import PART5 from "./part5.json";

const KEY = "toeic-vocab-state";

const vide = () => ({ vus: {}, ajoutes: [], supprimes: [], progres: {}, historique: [], jours: [], favoris: [], parJour: {}, objectif: 20 });

const JOUR = 86400000;
const INTERVALLES = [0, 1, 2, 4, 8, 16]; // jours avant la prochaine révision, par "boîte"
const aujourdhui = () => new Date().toISOString().slice(0, 10);

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s) return { ...vide(), ...s };
  } catch { /* stockage indisponible */ }
  return vide();
}

function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  if (typeof window !== "undefined") window.dispatchEvent(new Event("toeic-update"));
}

function motsActuels(state, categorie) {
  const supprimes = new Set(state.supprimes);
  const favoris = new Set(state.favoris);
  return [...VOCAB, ...state.ajoutes]
    .filter(m => !supprimes.has(m.id) && (!categorie || m.categorie === categorie))
    .map(m => ({ ...m, nb_vus: state.vus[m.id] || 0, favori: favoris.has(m.id), ...etat(state, m.id) }));
}

function etat(state, id) {
  const p = state.progres[id] || {};
  return { boite: p.boite || 0, echeance: p.echeance || 0, ok: p.ok || 0, ko: p.ko || 0 };
}

// Répétition espacée : les mots à réviser (jamais vus, ratés, ou échéance passée) d'abord,
// les moins maîtrisés en premier (les ratés avant les jamais vus) ; ensuite ceux dont l'échéance est la plus proche.
function prioriser(mots, mode) {
  const maintenant = Date.now();
  if (mode === "favoris") mots = mots.filter(m => m.favori);
  if (mode === "difficiles") {
    return melanger(mots.filter(m => m.ko > 0 && m.boite < 4)).sort((a, b) => (b.ko - b.ok) - (a.ko - a.ok));
  }
  melanger(mots);
  const dus = mots.filter(m => m.echeance <= maintenant).sort((a, b) => a.boite - b.boite || (b.ko > 0) - (a.ko > 0));
  const autres = mots.filter(m => m.echeance > maintenant).sort((a, b) => a.echeance - b.echeance);
  return [...dus, ...autres];
}

function melanger(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const CATEGORIE_DE = new Map(VOCAB.map(m => [m.id, m.categorie]));
const TROUS = new Map();
CLOZE.forEach(c => TROUS.set(c.id, [...(TROUS.get(c.id) || []), c]));

// 3 distracteurs aux libellés tous différents (certains mots partagent la même traduction)
function distracteurs(candidats, champ) {
  const vus = new Set();
  return melanger(candidats).filter(m => !vus.has(m[champ]) && vus.add(m[champ])).slice(0, 3);
}

function questionTraduction(mot, tous) {
  const mauvaises = distracteurs(tous.filter(m => m.id !== mot.id && m.francais !== mot.francais), "francais");
  return {
    mot_id: mot.id,
    type: "traduction",
    anglais: mot.anglais,
    options: melanger([...mauvaises.map(m => m.francais), mot.francais]),
    correct: mot.francais,
    traduction: mot.francais,
    favori: mot.favori,
  };
}

// Sens inverse : on affiche le français, on cherche l'anglais
function questionInverse(mot, tous) {
  const mauvaises = distracteurs(tous.filter(m => m.id !== mot.id && m.anglais !== mot.anglais && m.francais !== mot.francais), "anglais");
  return {
    mot_id: mot.id,
    type: "inverse",
    anglais: mot.francais,
    options: melanger([...mauvaises.map(m => m.anglais), mot.anglais]),
    correct: mot.anglais,
    traduction: mot.anglais,
    favori: mot.favori,
  };
}

// Distracteurs : autres mots à trous de même nature grammaticale, de préférence du même thème
function questionTrou(mot) {
  const c = TROUS.get(mot.id)[Math.floor(Math.random() * TROUS.get(mot.id).length)];
  const pool = melanger(CLOZE.filter(x => x.tag === c.tag && x.id !== c.id && x.reponse !== c.reponse))
    .sort((a, b) => (CATEGORIE_DE.get(a.id) !== mot.categorie) - (CATEGORIE_DE.get(b.id) !== mot.categorie));
  const mauvaises = [...new Set(pool.map(x => x.reponse))].slice(0, 3);
  // Filet de sécurité : si peu de mots de même nature, on complète avec d'autres
  for (const x of melanger([...CLOZE])) {
    if (mauvaises.length >= 3) break;
    if (x.reponse !== c.reponse && !mauvaises.includes(x.reponse)) mauvaises.push(x.reponse);
  }
  return {
    mot_id: mot.id,
    type: "trou",
    anglais: c.phrase,
    options: melanger([...mauvaises, c.reponse]),
    correct: c.reponse,
    traduction: `${c.reponse} = ${mot.francais}`,
    favori: mot.favori,
  };
}

// Vraies questions de la partie 5 du TOEIC (grammaire et vocabulaire), 4 choix
function questionPart5(q) {
  return {
    mot_id: `p5:${q.id}`,
    type: "part5",
    anglais: q.phrase,
    options: melanger([...q.options]),
    correct: q.correct,
    traduction: q.explication,
  };
}

const reponse = async (fn) => fn();

export const api = {
  getMots: (categorie) => reponse(() =>
    motsActuels(load(), categorie).sort((a, b) => a.anglais.localeCompare(b.anglais))),

  ajouterMot: ({ anglais, francais, categorie = "général" }) => reponse(() => {
    const state = load();
    if (motsActuels(state).some(m => m.anglais === anglais)) throw new Error("Ce mot existe déjà");
    const id = Math.max(100000, ...state.ajoutes.map(m => m.id + 1));
    const mot = { id, anglais, francais, categorie, date_ajout: new Date().toISOString() };
    state.ajoutes.push(mot);
    save(state);
    return { ...mot, nb_vus: 0 };
  }),

  supprimerMot: (id) => reponse(() => {
    const state = load();
    state.supprimes.push(id);
    save(state);
    return null;
  }),

  getCategories: () => reponse(() =>
    [...new Set(motsActuels(load()).map(m => m.categorie))].sort()),

  getQuiz: (n, categorie, mode = "normal", type = "traduction") => reponse(() => {
    if (type === "part5") {
      const state = load();
      const items = PART5.map(q => ({ id: `p5:${q.id}`, favori: false, ...etat(state, `p5:${q.id}`), q }));
      return melanger(prioriser(items, "normal").slice(0, n)).map(x => questionPart5(x.q));
    }
    const tous = motsActuels(load(), categorie);
    if (tous.length < 4) throw new Error("Il faut au moins 4 mots pour générer un quiz");
    if (type === "trou") {
      const avecTrou = tous.filter(m => TROUS.has(m.id));
      const candidats = prioriser(avecTrou, mode);
      if (candidats.length < 1) throw new Error("Pas de phrase à trous pour ce choix.");
      return melanger(candidats.slice(0, n)).map(questionTrou);
    }
    const candidats = prioriser([...tous], mode);
    if (candidats.length < 4) {
      throw new Error(mode === "favoris"
        ? "Il faut au moins 4 mots favoris (⭐) pour ce mode."
        : "Pas encore assez de mots difficiles : fais d'abord quelques quiz normaux.");
    }
    return melanger(candidats.slice(0, Math.min(n, candidats.length)))
      .map(mot => (type === "inverse" ? questionInverse : questionTraduction)(mot, tous));
  }),

  // Examen blanc : mélange de phrases à trous et de traductions, tirés au hasard
  getExamen: (n) => reponse(() => {
    const tous = motsActuels(load());
    const avecTrou = melanger(tous.filter(m => TROUS.has(m.id)));
    const nbP5 = Math.min(Math.floor(n / 3), PART5.length);
    const part5 = melanger([...PART5]).slice(0, nbP5);
    const trous = avecTrou.slice(0, Math.min(Math.floor(n / 3), avecTrou.length));
    const utilises = new Set(trous.map(m => m.id));
    const trad = melanger(tous.filter(m => !utilises.has(m.id))).slice(0, n - trous.length - part5.length);
    return melanger([...part5.map(questionPart5), ...trous.map(questionTrou), ...trad.map(m => questionTraduction(m, tous))]);
  }),

  getFiches: (n, categorie, mode = "normal") => reponse(() => {
    const liste = prioriser(motsActuels(load(), categorie), mode).slice(0, n);
    return liste;
  }),

  toggleFavori: (id) => reponse(() => {
    const state = load();
    const i = state.favoris.indexOf(id);
    if (i >= 0) state.favoris.splice(i, 1); else state.favoris.push(id);
    save(state);
    return i < 0;
  }),

  exporterSauvegarde: () => reponse(() => JSON.stringify({ app: "toeic-vocab", version: 1, state: load() })),

  importerSauvegarde: (texte) => reponse(() => {
    let data;
    try { data = JSON.parse(texte); } catch { throw new Error("Fichier illisible."); }
    if (data?.app !== "toeic-vocab" || typeof data.state !== "object" || data.state === null) {
      throw new Error("Ce fichier n'est pas une sauvegarde TOEIC Vocab.");
    }
    save({ ...vide(), ...data.state });
    return true;
  }),

  getObjectif: () => reponse(() => {
    const state = load();
    return { objectif: state.objectif, fait: state.parJour[aujourdhui()] || 0 };
  }),

  setObjectif: (n) => reponse(() => {
    const state = load();
    state.objectif = n;
    save(state);
    return n;
  }),

  // resultats : [{ mot_id, correct }] — met à jour la répétition espacée et l'historique
  enregistrerResultats: (resultats, type = "quiz") => reponse(() => {
    const state = load();
    const maintenant = Date.now();
    resultats.forEach(({ mot_id, correct }) => {
      const p = etat(state, mot_id);
      const boite = correct ? Math.min(p.boite + 1, INTERVALLES.length - 1) : 0;
      state.progres[mot_id] = {
        boite,
        echeance: correct ? maintenant + INTERVALLES[boite] * JOUR : maintenant,
        ok: p.ok + (correct ? 1 : 0),
        ko: p.ko + (correct ? 0 : 1),
      };
      state.vus[mot_id] = (state.vus[mot_id] || 0) + 1;
    });
    const jour = aujourdhui();
    state.parJour[jour] = (state.parJour[jour] || 0) + resultats.length;
    if (!state.jours.includes(jour)) state.jours.push(jour);
    state.historique.push({
      date: new Date().toISOString(), type,
      total: resultats.length, bonnes: resultats.filter(r => r.correct).length,
    });
    state.historique = state.historique.slice(-200);
    save(state);
    return { ok: true };
  }),

  getStats: () => reponse(() => {
    const state = load();
    const mots = motsActuels(state);
    const parCategorie = {};
    mots.forEach(m => {
      const c = (parCategorie[m.categorie] ||= { total: 0, vus: 0, maitrises: 0 });
      c.total++;
      if (m.nb_vus > 0) c.vus++;
      if (m.boite >= 4) c.maitrises++;
    });
    const jours = new Set(state.jours);
    let serie = 0;
    const d = new Date();
    if (!jours.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1);
    while (jours.has(d.toISOString().slice(0, 10))) { serie++; d.setDate(d.getDate() - 1); }
    const h = state.historique;
    return {
      total: mots.length,
      vus: mots.filter(m => m.nb_vus > 0).length,
      maitrises: mots.filter(m => m.boite >= 4).length,
      difficiles: mots.filter(m => m.ko > 0 && m.boite < 4).length,
      aReviser: mots.filter(m => m.nb_vus > 0 && m.echeance <= Date.now()).length,
      serie,
      nbSessions: h.length,
      moyenne: h.length ? Math.round(100 * h.reduce((t, x) => t + x.bonnes, 0) / Math.max(1, h.reduce((t, x) => t + x.total, 0))) : null,
      derniers: h.slice(-10),
      parCategorie: Object.entries(parCategorie).sort((a, b) => a[0].localeCompare(b[0])),
    };
  }),

  marquerVus: (ids) => reponse(() => {
    const state = load();
    ids.forEach(id => { state.vus[id] = (state.vus[id] || 0) + 1; });
    save(state);
    return { ok: true };
  }),
};
