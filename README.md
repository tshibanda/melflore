# Melflore

Site vitrine de **Melflore**, studio de fidélisation email pour marques beauté sur Shopify.
En ligne sur [www.melflore.com](https://www.melflore.com).

## Contenu

| Fichier | Page |
|---|---|
| `index.html` | Accueil (offre, tarifs, FAQ) |
| `audit.html` | Formulaire de demande d'audit offert |
| `merci.html` | Confirmation après envoi du formulaire |
| `cgv.html` | Conditions générales de vente |
| `confidentialite.html` | Politique de confidentialité |
| `mentions-legales.html` | Mentions légales |
| `assets/` | Logo, icônes, polices Inter et Inter Tight (hébergées localement) |

Site 100 % statique : HTML et CSS, aucune étape de build.

## Hébergement : Netlify

- `netlify.toml` publie la racine du dépôt.
- Le formulaire d'audit utilise **Netlify Forms** (`data-netlify="true"`, piège à robots `site_web`).
  Les notifications se règlent dans Netlify : *Site configuration → Notifications → Form submission notifications → Email* vers `contact@melflore.com`.
- Le domaine `melflore.com` est enregistré chez IONOS ; ses DNS pointent vers Netlify.

## Modifier le site

Modifier les fichiers HTML puis pousser sur `main` : Netlify redéploie automatiquement.
Tester en local : `python3 -m http.server` à la racine, puis ouvrir http://localhost:8000.
