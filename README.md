# Site web Climativ

Site statique (HTML, CSS, JavaScript), prêt pour GitHub et Netlify. Aucune compilation n'est nécessaire.

## Aperçu sur ton ordinateur

Double-clique sur `index.html` : le site s'ouvre dans ton navigateur. Seul l'envoi du formulaire ne fonctionne pas en local (il a besoin de Netlify).

## Mettre en ligne

### 1. GitHub
1. Crée un nouveau dépôt (ex. : `climativ-site`).
2. Téléverse **le contenu** de ce dossier (pas le dossier lui-même) : `index.html` doit être à la racine du dépôt.

### 2. Netlify
1. *Add new site* → *Import an existing project* → choisis GitHub, puis le dépôt.
2. *Build command* : laisser vide. *Publish directory* : laisser vide (ou `.`).
3. Clique sur *Deploy*.

### 3. Activer le formulaire de soumission
1. Dans Netlify : *Site configuration* → *Forms* → **Enable form detection**.
2. Redéploie le site une fois (*Deploys* → *Trigger deploy*).
3. Pour recevoir les demandes par courriel : *Forms* → *Form notifications* → *Add notification* → *Email notification* → `climativ.service@gmail.com`.

Les demandes apparaissent aussi dans l'onglet *Forms* de Netlify. Le forfait gratuit inclut 100 envois par mois.

### 4. Nom de domaine
Le site utilise `https://climativ.ca` comme adresse. Si ton domaine est différent, remplace `https://climativ.ca` par le bon domaine dans :
- `index.html` (balises `canonical`, `og:` et données structurées)
- `politique-de-confidentialite.html`
- `robots.txt`
- `sitemap.xml`

Dans Netlify : *Domain management* → *Add a domain*.

## Structure

Tous les fichiers sont à la racine du dossier (pas de sous-dossiers). Ça permet de tout glisser d'un coup dans GitHub depuis Safari.

```
index.html                         Page d'accueil (tout le site)
merci.html                         Page de confirmation du formulaire (secours sans JavaScript)
politique-de-confidentialite.html  Exigée par la Loi 25 pour un formulaire
404.html                           Page introuvable
styles.css                         Styles (couleurs du logo en haut du fichier)
main.js                            Animations, menu, avant/après, galerie, formulaire
jakarta-latin-var.woff2            Police Plus Jakarta Sans (hébergée sur le site)
*.webp, *.svg, *.jpg, *.png        Photos optimisées, logos, icônes, image de partage
netlify.toml                       Configuration Netlify
```

## Modifier le contenu

- **Textes** : directement dans `index.html`, chaque section est identifiée par un commentaire (`<!-- ============ SERVICES ============ -->`, etc.).
- **Couleurs** : variables au début de `styles.css` (`--marine`, `--ciel`, `--braise`).
- **Police** : Plus Jakarta Sans, fichier `jakarta-latin-var.woff2` (aucune requête à Google).
- **Ajouter une photo à la galerie** : exporter en WebP en deux tailles (600 px et 1200 px de large) à la racine, puis copier un bloc `<li>` de la galerie dans `index.html`.

## Notes
- Les données GPS des photos ont été retirées.
- Le site n'utilise ni témoins (cookies) ni outil de statistiques, donc aucune bannière de consentement n'est requise.
