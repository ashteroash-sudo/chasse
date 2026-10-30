# La Chasse : outil de prédation (VTM V5, Gary)

## Mise en ligne
1. Crée un nouveau dépôt GitHub et dépose-y tout le contenu de ce dossier.
2. Sur Vercel : *Add New Project*, puis choisis ce dépôt. Vercel lit `vercel.json` tout seul, il n'y a rien à régler.
3. À chaque ajout sur GitHub, Vercel remet le site en ligne et refait la liste des images.

## Les dossiers
| Dossier | Contenu | Nommage |
|---|---|---|
| `joueurs/` | portraits des joueurs (.webm, .mp4 ou image) | `vito.webm`, `cassandre.webm`, `pavel.webm`, `willy.webm` |
| `lieux/` | une ou plusieurs images par lieu | même nom que dans `data/lieux.json` : `bars.jpg`, `cimetieres.jpg`… Variantes : `bars_2.jpg`, `bars_3.jpg` (une tirée au hasard à chaque entrée) |
| `pnj/` | portraits des PNJ, tous à plat | l'`id` du profil : `marcus_vance.jpg` |
| `pnj/morgue/` | images de corps (sans profil) | `homme_noye.jpg` → « Homme Noye » |
| `profils/` | lots JSON générés par l'IA | `lot1.json`, `lot2.json`, `lot3.json`… |
| `musique/` | une musique par lieu (.mp3, .ogg, .m4a) | même nom que le lieu : `bars.mp3`… Variantes : `bars_2.mp3` |

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

## À la table
- Chaque carte se dévoile par couches : **Observer** (humeur et signes), **Aborder** (réplique, nom, métier), **Le faire parler** (« ce soir… »). Le jet se fait à table : tu cliques ✓ s'il est réussi, ✗ s'il est raté (le PNJ s'en va). Chaque tentative fait avancer l'horloge (5 / 10 / 10 min, réglable en haut du script : `TEMPS`).
- **Mordre** est possible à tout moment, même à l'aveugle.
- Vito : si la proie ne lui convient pas, le fléau s'affiche à la première gorgée (texte réglable dans `data/joueurs.json`, champ `fleau`).
- Retour sur la proie dorée : un d10 d'événement (absent, accompagné, méfiant, normal). Le risque monte à chaque visite, et au bout de 3 visites l'outil rappelle l'Historique Troupeau. Une absence rompt la série de nuits d'un caillot.

- **Dose** : à la fin du repas, 1 Soif (rien) ou 2 Soif (proie anémiée, absente pendant deux semaines réelles, tous joueurs confondus ; casse aussi une série de nuits de caillot).
- **Le Cercle** (Vito, Calista, Cassandre) : les membres actifs et le personnel embauché du cercle de Vito, lus en direct dans la base du cercle. Les autres (vivier, candidats, partis, personnel disponible) chassent dans les lieux de Gary ; les membres donnés à Vance disparaissent. Profils dans `profils/cercle.json`, portraits et photos du local pris sur le site du cercle. Pas d'imprévus génériques ni de propriétaire de territoire.
  Un repas sur une personne du cercle est transmis au cercle : 2 Soif = anémie (2 semaines du cercle) ; au Cercle même, risque Mascarade (moitié à 1 Soif, quart pour Calista et Cassandre). Un employé anémié ouvre l'incident « Un employé souffrant ». Sans Internet, le repas est transmis au lancement suivant.
- **Imprévus** : 15 % de chances à l'arrivée dans un lieu et à chaque « Attendre 1 h » (attendre peut aussi dissiper l'imprévu en cours). Observer (+5 min) propose 3 approches (type + jet, ex. « Social · Charisme + Persuasion ») ; une fois l'approche choisie et le jet réussi, la raison est dévoilée. « Passé » direct possible pour une idée des joueurs. Raté : le lieu est grillé pour tout le monde jusqu'à la fin de la nuit.
- **Territoires** : chaque lieu appartient à un vampire de Gary (`data/territoires.json`). Une jauge de pression invisible par joueur et par propriétaire (jamais partagée) : +8 à chaque entrée sur son territoire, −2 à chaque chasse du joueur. Présage (bandeau discret, sans nom) : 25 % + pression/4. Rencontre physique : pression/220, puis la jauge est divisée par deux. Étapes mémorisées par joueur jusqu'à « Réglé » : avertissement, ton qui monte, tension (jet très difficile ou combat).

- **Familiarité** (Cassandre) : +1 à chaque « Aborder » ou « Le faire parler » réussi, +1 à chaque repas sur le PNJ. Affichée sur la carte une fois abordé : 10 Connaissance, 20 Familier, 30 Pote, 40 Proche.
- **Musique** : démarre en fondu à l'entrée dans un lieu, bouton ♪ pour couper.

## Sauvegarde
Les proies dorées, les Résonances actives et les PNJ tués sont gardés dans le navigateur du PC qui pilote. Avant de changer de PC ou de navigateur, utilise **Exporter la sauvegarde** sur l'écran d'accueil, puis **Importer** sur le nouveau.
