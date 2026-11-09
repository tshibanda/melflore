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
| `ressources/` | Hub et articles de blog (SEO) |
| `404.html` | Page d'erreur |
| `assets/` | Logo, icônes, photo, polices Inter et Inter Tight (hébergées localement) |

Site 100 % statique : HTML et CSS, aucune étape de build.

## Hébergement : Netlify

- `netlify.toml` publie la racine du dépôt.
- Le formulaire d'audit utilise **Netlify Forms** (`data-netlify="true"`, piège à robots `site_web`).
  Les notifications se règlent dans Netlify : *Site configuration → Notifications → Form submission notifications → Email* vers `contact@melflore.com`.
- Le domaine `melflore.com` est enregistré chez IONOS ; ses DNS pointent vers Netlify.

## Modifier le site

Modifier les fichiers HTML puis pousser sur `main` : Netlify redéploie automatiquement.
Tester en local : `python3 -m http.server` à la racine, puis ouvrir http://localhost:8000.

## Newsletter (Klaviyo)

Les formulaires « La Lettre Melflore » (pied de page de toutes les pages et page `/newsletter`) envoient chaque inscription :
- à Netlify Forms (formulaire `newsletter`), toujours, en secours ;
- à Klaviyo dès que `companyId` (clé publique « Site ID ») et `listId` sont renseignés en haut de `assets/site.js`.

## Finitions communes

`assets/site.css` et `assets/site.js` gèrent l'en-tête collant, les apparitions au défilement, le bouton d'audit collant sur mobile, la barre de lecture des articles et la newsletter. Après une régénération des articles, relancer le script de finitions (`polish.py`) pour remettre le pied de page commun.
