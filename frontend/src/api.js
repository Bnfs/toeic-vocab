const BASE = "http://127.0.0.1:8003";

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Erreur serveur");
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  getMots: (categorie) => req(`/mots/${categorie ? `?categorie=${encodeURIComponent(categorie)}` : ""}`),
  ajouterMot: (data) => req("/mots/", { method: "POST", body: JSON.stringify(data) }),
  supprimerMot: (id) => req(`/mots/${id}`, { method: "DELETE" }),
  getCategories: () => req("/mots/categories"),
  getQuiz: (n, categorie) => req(`/mots/quiz?n=${n}${categorie ? `&categorie=${encodeURIComponent(categorie)}` : ""}`),
};
