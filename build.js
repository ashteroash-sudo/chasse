// Lancé automatiquement par Vercel à chaque mise en ligne.
// Copie le site dans public/ et fabrique manifest.json (la liste des images et profils).
const fs = require('fs');
const path = require('path');
const OUT = 'public';
const IGNORE = new Set(['.git', '.vercel', 'node_modules', OUT, 'build.js', 'vercel.json', 'README.md']);
const IMG = /\.(jpe?g|png|webp|gif)$/i;
const VID = /\.(webm|mp4)$/i;

function copy(src, dst) {
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    if (IGNORE.has(e.name) || e.name.startsWith('.')) continue;
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) { fs.mkdirSync(d, { recursive: true }); copy(s, d); }
    else fs.copyFileSync(s, d);
  }
}
function files(dir, re) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(e => e.isFile() && re.test(e.name)).map(e => e.name).sort();
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT);
copy('.', OUT);

const pnj = { '': files('pnj', IMG) };
if (fs.existsSync('pnj')) for (const e of fs.readdirSync('pnj', { withFileTypes: true }))
  if (e.isDirectory()) pnj[e.name] = files(path.join('pnj', e.name), IMG);

const manifest = {
  genere: new Date().toISOString(),
  joueurs: files('joueurs', new RegExp(IMG.source + '|' + VID.source, 'i')),
  lieux: files('lieux', IMG),
  pnj,
  profils: files('profils', /\.json$/i)
};
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 1));
console.log('manifest.json :', manifest.joueurs.length, 'joueurs,', manifest.lieux.length, 'lieux,',
  Object.values(pnj).flat().length, 'portraits,', manifest.profils.length, 'fichiers de profils');
