# La Chasse : outil de prédation (VTM V5, Gary)

## Mise en ligne
1. Crée un nouveau dépôt GitHub et dépose-y tout le contenu de ce dossier.
2. Sur Vercel : *Add New Project*, puis choisis ce dépôt. Vercel lit `vercel.json` tout seul, il n'y a rien à régler.
3. À chaque ajout sur GitHub, Vercel remet le site en ligne et refait la liste des images.

## Les dossiers
| Dossier | Contenu | Nommage |
|---|---|---|
| `joueurs/` | portraits des joueurs (.webm, .mp4 ou image) | `vito.webm`, `cassandre.webm`, `pavel.webm`, `willy.webm` |
| `lieux/` | une image par lieu | même nom que dans `data/lieux.json` : `bars.jpg`, `cimetieres.jpg`… |
| `pnj/` | portraits des PNJ, tous à plat | l'`id` du profil : `marcus_vance.jpg` |
| `pnj/morgue/` | images de corps (sans profil) | `homme_noye.jpg` → « Homme Noye » |
| `profils/` | lots JSON générés par l'IA | `lot1.json`, `lot2.json`, `lot3.json`… |

- Minuscules, pas d'accents, pas d'espaces. Formats : `.jpg`, `.png`, `.webp`.
- **Les lieux d'un PNJ viennent de son profil** (champ `lieux`). Pas besoin de copier l'image dans plusieurs dossiers.
- Une image **sans profil** peut quand même servir : range-la dans `pnj/<lieu>/` (ex. `pnj/bars/inconnu.jpg`), elle apparaîtra dans ce lieu avec un texte générique.
- Un profil **sans image** apparaît avec une silhouette.
- **Vito** : un PNJ lui convient si son profil a `"compatible_vito": true`, ou si l'image porte le tag `__vito` (`eric_perdue__vito.jpg`).

## Réglages (dossier `data/`)
- `lieux.json` : pour chaque lieu, les joueurs qui peuvent y chasser, la table de Résonance (sur 10, dans l'ordre flegmatique, atrabilaire, bilieuse, sanguine) et l'affluence selon l'heure (`["02:00", 2]` = 2 passants à partir de 2h).
  Un lieu ajouté seulement en image dans `lieux/` marche aussi, ouvert à tous les joueurs et avec la table du livre.
- `joueurs.json` : style de prédation, jet de chasse, filtre (Vito).
- `dyscrasies.json` : la liste des Dyscrasies tirées à l'activation.

## Sauvegarde
Les proies dorées, les Résonances actives et les PNJ tués sont gardés dans le navigateur du PC qui pilote. Avant de changer de PC ou de navigateur, utilise **Exporter la sauvegarde** sur l'écran d'accueil, puis **Importer** sur le nouveau.
