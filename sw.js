/* =====================================================================
   MODE HORS LIGNE — fichier identique dans tous les projets.
   Ne rien modifier ici : le nom du dépôt est donné par la ligne
   <script src="hors-ligne.js" data-depot="..."> de chaque index.html.

   Principe :
   - Pages, .json et .txt : on essaie Internet d'abord (pour avoir les
     mises à jour), et si ça ne répond pas, on sert la copie enregistrée.
   - Images, sons, vidéos, polices : on sert la copie enregistrée
     directement (plus rapide), sinon Internet.
   - À chaque ouverture avec Internet, on compare avec GitHub et on
     télécharge seulement ce qui a été ajouté ou modifié.
   ===================================================================== */

const PARAMS = new URL(self.location).searchParams;
const DEPOT = PARAMS.get('depot') || '';
const PROPRIO = PARAMS.get('proprio') || 'ashteroash-sudo';
const BRANCHE = PARAMS.get('branche') || 'main';
const RAW = PARAMS.get('raw') === '1';      // l'outil charge ses images depuis GitHub

const CACHE = 'hors-ligne-v1';
const ETAT = new URL('__hors-ligne/etat.json', self.registration.scope).href;
const DELAI_RESEAU = 3500;                   // ms avant de se rabattre sur la copie
const ENTRE_DEUX_VERIFS = 2 * 60 * 1000;     // pas plus d'une vérif GitHub toutes les 2 min
const IGNORER = /(^|\/)\.|^(README\.md|build\.js|vercel\.json|package(-lock)?\.json|sw\.js)$/i;
const FRAIS = /\.(html?|json|txt|js|css)$/i; // contenus qui peuvent changer souvent

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

/* ---------- utilitaires ---------- */

// Même clé quelle que soit la façon dont les accents ont été encodés.
function cle(url) {
  try {
    const u = new URL(url);
    const chemin = u.pathname.split('/').map(s => {
      try { return encodeURIComponent(decodeURIComponent(s).normalize('NFC')); }
      catch { return s; }
    }).join('/');
    return u.origin + chemin + u.search;
  } catch { return url; }
}
const cleSansParam = url => { const u = new URL(cle(url)); u.search = ''; return u.href; };

async function lireCache(url) {
  const c = await caches.open(CACHE);
  return (await c.match(cle(url))) || (await c.match(cleSansParam(url)));
}
async function ecrireCache(url, rep) {
  if (!rep || !(rep.ok || rep.type === 'opaque')) return;
  const c = await caches.open(CACHE);
  await c.put(cle(url), rep);
}

function avecDelai(promesse, ms) {
  return new Promise((ok, ko) => {
    const t = setTimeout(() => ko(new Error('délai dépassé')), ms);
    promesse.then(v => { clearTimeout(t); ok(v); }, err => { clearTimeout(t); ko(err); });
  });
}

// Les vidéos et sons sont demandés par morceaux : on découpe la copie.
async function morceau(requete, rep) {
  const plage = requete.headers.get('range');
  if (!plage || !rep || rep.status !== 200 || rep.type === 'opaque') return rep;
  const blob = await rep.blob();
  const m = /bytes=(\d*)-(\d*)/.exec(plage);
  if (!m) return new Response(blob, { status: 200, headers: rep.headers });
  let debut = m[1] === '' ? Math.max(0, blob.size - Number(m[2])) : Number(m[1]);
  let fin = m[1] !== '' && m[2] !== '' ? Number(m[2]) : blob.size - 1;
  fin = Math.min(fin, blob.size - 1);
  if (debut > fin) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${blob.size}` } });
  const entetes = new Headers(rep.headers);
  entetes.set('Content-Range', `bytes ${debut}-${fin}/${blob.size}`);
  entetes.set('Content-Length', String(fin - debut + 1));
  return new Response(blob.slice(debut, fin + 1), { status: 206, statusText: 'Partial Content', headers: entetes });
}

/* ---------- interception des demandes ---------- */

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.href.startsWith(ETAT)) return;
  const monSite = url.origin === self.location.origin;
  const github = url.hostname === 'api.github.com' || url.hostname === 'raw.githubusercontent.com';
  const polices = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!monSite && !github && !polices) return;
  if (monSite && url.pathname.endsWith('/sw.js')) return;

  const page = req.mode === 'navigate';
  const frais = page || url.hostname === 'api.github.com' || (monSite && FRAIS.test(url.pathname));
  e.respondWith(frais ? reseauDabord(req, page) : copieDabord(req));
});

async function reseauDabord(req, page) {
  try {
    const rep = await avecDelai(fetch(req), DELAI_RESEAU);
    if (rep.ok) {
      const cible = page ? new URL(req.url).origin + new URL(req.url).pathname : req.url;
      ecrireCache(cible, rep.clone());
    }
    return rep;
  } catch (err) {
    let copie = await lireCache(req.url);
    if (!copie && page) {
      const u = new URL(req.url);
      copie = await lireCache(u.origin + u.pathname) ||
              await lireCache(u.origin + u.pathname.replace(/\/?$/, '/') + 'index.html') ||
              await lireCache(self.registration.scope);
    }
    if (copie) return copie;
    throw err;
  }
}

async function copieDabord(req) {
  const copie = await lireCache(req.url);
  if (copie) return morceau(req, copie);
  const rep = await fetch(req);
  if (rep.status === 200 && !req.headers.get('range')) ecrireCache(req.url, rep.clone());
  return rep;
}

/* ---------- synchronisation avec GitHub ---------- */

let syncEnCours = null;

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'sync') {
    if (!syncEnCours) syncEnCours = synchroniser(!!e.data.forcer, e.data.polices || []).finally(() => { syncEnCours = null; });
    e.waitUntil(syncEnCours);
  }
});

async function annoncer(msg) {
  for (const c of await self.clients.matchAll({ includeUncontrolled: true })) c.postMessage(msg);
}

async function lireEtat() {
  const c = await caches.open(CACHE);
  const r = await c.match(ETAT);
  return r ? r.json() : { arbre: null, fichiers: {}, verif: 0 };
}
async function ecrireEtat(etat) {
  const c = await caches.open(CACHE);
  await c.put(ETAT, new Response(JSON.stringify(etat), { headers: { 'Content-Type': 'application/json' } }));
}

const encoder = chemin => chemin.split('/').map(encodeURIComponent).join('/');

async function telecharger(url) {
  const rep = await fetch(url, { cache: 'reload' });
  if (!rep.ok) throw new Error(rep.status);
  await ecrireCache(url, rep);
}

async function garderPolices(liens) {
  for (const css of liens) {
    try {
      if (await lireCache(css)) continue;
      const r = await fetch(css);
      if (!r.ok) continue;
      const texte = await r.clone().text();
      await ecrireCache(css, r);
      const fichiers = [...texte.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map(m => m[1]);
      await Promise.all(fichiers.map(f => telecharger(f).catch(() => {})));
    } catch {}
  }
}

async function synchroniser(forcer, polices) {
  garderPolices(polices);
  if (!DEPOT) return annoncer({ type: 'etat', statut: 'erreur', message: 'nom du dépôt manquant' });
  const etat = await lireEtat();
  const total = Object.keys(etat.fichiers).length;

  if (!forcer && Date.now() - etat.verif < ENTRE_DEUX_VERIFS && !etat.manquants) {
    return annoncer({ type: 'etat', statut: 'pret', total });
  }

  let arbre;
  try {
    const r = await avecDelai(fetch(`https://api.github.com/repos/${PROPRIO}/${DEPOT}/git/trees/${BRANCHE}?recursive=1`, { cache: 'no-store' }), 8000);
    if (!r.ok) throw new Error('GitHub ' + r.status);
    arbre = await r.json();
  } catch (err) {
    return annoncer({ type: 'etat', statut: total ? 'pret' : 'erreur', total, message: 'GitHub injoignable' });
  }

  if (!forcer && arbre.sha === etat.arbre && !etat.manquants) {
    etat.verif = Date.now(); await ecrireEtat(etat);
    return annoncer({ type: 'etat', statut: 'pret', total });
  }

  const base = self.registration.scope;
  const fichiers = arbre.tree.filter(f => f.type === 'blob' && !IGNORER.test(f.path));
  const dossiers = arbre.tree.filter(f => f.type === 'tree' && !IGNORER.test(f.path));

  // Ce qu'il faut (re)télécharger
  const travaux = [];
  const nouveauxSha = {};
  for (const f of fichiers) {
    nouveauxSha[f.path] = f.sha;
    if (!forcer && etat.fichiers[f.path] === f.sha) continue;
    travaux.push({ chemin: f.path, urls: [base + encoder(f.path)] });
    if (RAW) travaux[travaux.length - 1].urls.push(`https://raw.githubusercontent.com/${PROPRIO}/${DEPOT}/${BRANCHE}/${encoder(f.path)}`);
  }
  // Toujours rafraîchir la page d'accueil et la liste générée (outil La Chasse)
  travaux.push({ chemin: '', urls: [base], toujours: true });
  travaux.push({ chemin: 'manifest.json', urls: [base + 'manifest.json'], toujours: true, facultatif: true });
  // Listes de dossiers GitHub utilisées par certains outils (Table de combat, Visions)
  if (RAW) for (const d of dossiers) {
    const api = `https://api.github.com/repos/${PROPRIO}/${DEPOT}/contents/${encoder(d.path)}`;
    travaux.push({ chemin: '', urls: [api, api + '?ref=' + BRANCHE], toujours: true, facultatif: true });
  }

  let faits = 0, rates = 0;
  const aFaire = travaux.length;
  annoncer({ type: 'etat', statut: 'sync', faits, total: aFaire });

  const file = travaux.slice();
  async function ouvrier() {
    while (file.length) {
      const t = file.shift();
      let ok = true;
      for (const u of t.urls) {
        try { await telecharger(u); } catch { if (!t.facultatif) ok = false; }
      }
      if (ok && t.chemin && !t.toujours) etat.fichiers[t.chemin] = nouveauxSha[t.chemin];
      if (!ok) rates++;
      faits++;
      if (faits % 3 === 0 || faits === aFaire) annoncer({ type: 'etat', statut: 'sync', faits, total: aFaire });
    }
  }
  await Promise.all([ouvrier(), ouvrier(), ouvrier(), ouvrier()]);

  // Nettoyage : fichiers supprimés du dépôt
  const c = await caches.open(CACHE);
  for (const chemin of Object.keys(etat.fichiers)) {
    if (nouveauxSha[chemin]) continue;
    await c.delete(cle(base + encoder(chemin)));
    if (RAW) await c.delete(cle(`https://raw.githubusercontent.com/${PROPRIO}/${DEPOT}/${BRANCHE}/${encoder(chemin)}`));
    delete etat.fichiers[chemin];
  }

  etat.arbre = rates ? null : arbre.sha;
  etat.manquants = rates;
  etat.verif = Date.now();
  await ecrireEtat(etat);
  annoncer({ type: 'etat', statut: rates ? 'incomplet' : 'pret', total: Object.keys(etat.fichiers).length, rates });
}
