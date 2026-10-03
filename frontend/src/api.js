// Version 100 % locale : les mots sont dans vocab.json, la progression et les
// mots ajoutés/supprimés sont gardés dans le localStorage de l'appareil.
import VOCAB from "./vocab.json";

const KEY = "toeic-vocab-state";

function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s) return { vus: {}, ajoutes: [], supprimes: [], ...s };
  } catch { /* stockage indisponible */ }
  return { vus: {}, ajoutes: [], supprimes: [] };
}

function save(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

function motsActuels(state, categorie) {
  const supprimes = new Set(state.supprimes);
  return [...VOCAB, ...state.ajoutes]
    .filter(m => !supprimes.has(m.id) && (!categorie || m.categorie === categorie))
    .map(m => ({ ...m, nb_vus: state.vus[m.id] || 0 }));
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

  getQuiz: (n, categorie) => reponse(() => {
    const tous = motsActuels(load(), categorie);
    if (tous.length < 4) throw new Error("Il faut au moins 4 mots pour générer un quiz");
    melanger(tous).sort((a, b) => a.nb_vus - b.nb_vus);
    const selection = melanger(tous.slice(0, Math.min(n, tous.length)));
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

  marquerVus: (ids) => reponse(() => {
    const state = load();
    ids.forEach(id => { state.vus[id] = (state.vus[id] || 0) + 1; });
    save(state);
    return { ok: true };
  }),
};
