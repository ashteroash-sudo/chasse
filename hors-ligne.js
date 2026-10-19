/* =====================================================================
   MODE HORS LIGNE — fichier identique dans tous les projets.
   Active la copie hors ligne et affiche un petit voyant discret
   en bas à droite, quelques secondes seulement :
     ● prêt hors ligne   ● mise à jour 12/40   ● mode hors ligne   ● incomplet
   Raccourci : Ctrl+Alt+H = tout re-télécharger (au cas où).
   ===================================================================== */
(function () {
  if (!('serviceWorker' in navigator)) return;
  const balise = document.currentScript;
  const depot = balise && balise.dataset.depot;
  if (!depot) { console.warn('[hors ligne] data-depot manquant sur la balise script'); return; }

  const params = new URLSearchParams({ depot });
  if (balise.dataset.raw !== undefined) params.set('raw', '1');
  if (balise.dataset.proprio) params.set('proprio', balise.dataset.proprio);
  if (balise.dataset.branche) params.set('branche', balise.dataset.branche);
  const dossier = new URL('.', balise.src).href;

  /* ---------- voyant ---------- */
  let voyant, minuteur;
  function afficher(texte, couleur, duree) {
    if (!document.body) return document.addEventListener('DOMContentLoaded', () => afficher(texte, couleur, duree), { once: true });
    if (!voyant) {
      voyant = document.createElement('div');
      voyant.setAttribute('aria-live', 'polite');
      voyant.style.cssText = 'position:fixed;right:10px;bottom:10px;z-index:2147483647;pointer-events:none;' +
        'font:12px/1.2 system-ui,sans-serif;color:#ddd;background:rgba(0,0,0,.72);padding:5px 9px;' +
        'border-radius:999px;transition:opacity .6s;opacity:0;display:flex;gap:6px;align-items:center';
      voyant.innerHTML = '<span style="width:8px;height:8px;border-radius:50%"></span><span></span>';
      document.body.appendChild(voyant);
    }
    voyant.firstChild.style.background = couleur;
    voyant.lastChild.textContent = texte;
    voyant.style.opacity = '1';
    clearTimeout(minuteur);
    if (duree) minuteur = setTimeout(() => { voyant.style.opacity = '0'; }, duree);
  }

  navigator.serviceWorker.addEventListener('message', e => {
    const m = e.data || {};
    if (m.type !== 'etat') return;
    if (m.statut === 'sync') afficher(`Mise à jour hors ligne ${m.faits}/${m.total}`, '#d9a441', 0);
    else if (m.statut === 'pret') afficher('Prêt hors ligne', '#4caf6a', 3000);
    else if (m.statut === 'incomplet') afficher(`Hors ligne incomplet (${m.rates} manquant${m.rates > 1 ? 's' : ''})`, '#d9534f', 8000);
    else if (m.statut === 'erreur') afficher('Hors ligne : ' + (m.message || 'erreur'), '#d9534f', 6000);
  });

  async function demanderSync(forcer) {
    const reg = await navigator.serviceWorker.ready;
    // Polices Google utilisées par la page : à mettre de côté aussi
    const polices = [...document.querySelectorAll('link[rel="stylesheet"][href*="fonts.googleapis.com"]')].map(l => l.href);
    if (reg.active) reg.active.postMessage({ type: 'sync', forcer, polices });
  }

  window.addEventListener('load', async () => {
    try {
      await navigator.serviceWorker.register(dossier + 'sw.js?' + params, { scope: dossier });
    } catch (err) { console.warn('[hors ligne] échec', err); return; }

    // Éviter que le navigateur efface la copie quand il manque de place (demandé une seule fois)
    try {
      if (navigator.storage && navigator.storage.persist && !localStorage.getItem('hors-ligne-persist')) {
        localStorage.setItem('hors-ligne-persist', '1');
        navigator.storage.persist();
      }
    } catch {}

    if (navigator.onLine) demanderSync(false);
    else afficher('Mode hors ligne', '#6c8ebf', 4000);
  });

  window.addEventListener('offline', () => afficher('Connexion perdue : mode hors ligne', '#6c8ebf', 5000));
  window.addEventListener('online', () => demanderSync(false));
  window.addEventListener('keydown', e => {
    if (e.ctrlKey && e.altKey && (e.key === 'H' || e.key === 'h')) { e.preventDefault(); demanderSync(true); }
  });
})();
