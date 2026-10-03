// Version 100 % locale : les mots sont dans vocab.json, la progression et les
// mots ajoutés/supprimés sont gardés dans le localStorage de l'appareil.
import VOCAB from "./vocab.json";

const KEY = "toeic-vocab-state";

const vide = () => ({ vus: {}, ajoutes: [], supprimes: [], progres: {}, historique: [], jours: [] });

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
}

function motsActuels(state, categorie) {
  const supprimes = new Set(state.supprimes);
  return [...VOCAB, ...state.ajoutes]
    .filter(m => !supprimes.has(m.id) && (!categorie || m.categorie === categorie))
    .map(m => ({ ...m, nb_vus: state.vus[m.id] || 0, ...etat(state, m.id) }));
}

function etat(state, id) {
  const p = state.progres[id] || {};
  return { boite: p.boite || 0, echeance: p.echeance || 0, ok: p.ok || 0, ko: p.ko || 0 };
}

// Répétition espacée : les mots à réviser (jamais vus, ratés, ou échéance passée) d'abord,
// les moins maîtrisés en premier (les ratés avant les jamais vus) ; ensuite ceux dont l'échéance est la plus proche.
function prioriser(mots, mode) {
  const maintenant = Date.now();
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

  getQuiz: (n, categorie, mode = "normal") => reponse(() => {
    const tous = motsActuels(load(), categorie);
    if (tous.length < 4) throw new Error("Il faut au moins 4 mots pour générer un quiz");
    const candidats = prioriser([...tous], mode);
    if (candidats.length < 4 && mode === "difficiles") {
      throw new Error("Pas encore assez de mots difficiles : fais d'abord quelques quiz normaux.");
    }
    const selection = melanger(candidats.slice(0, Math.min(n, candidats.length)));
    return selection.map(mot => {
      const mauvaises = melanger(tous.filter(m => m.id !== mot.id)).slice(0, 3);
      return {
        mot_id: mot.id,
        anglais: mot.anglais,
        options: melanger([...mauvaises.map(m => m.francais), mot.francais]),
        correct: mot.francais,
      };
    });
  }),

  getFiches: (n, categorie, mode = "normal") => reponse(() =>
    prioriser(motsActuels(load(), categorie), mode).slice(0, n)),

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
