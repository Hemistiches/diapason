# Diapason, par Hémistiches

Site de diagnostic de conformité RGPD des données de santé : https://diapason.hemistiches.com

Site d'une seule page : le test, les formules, les mentions légales et la politique de confidentialité sont dans `index.html`. Aucune compilation ni dépendance : ce que contient ce dépôt est exactement ce qui est publié.

## Contenu

| Fichier | Rôle |
|---|---|
| `index.html` | Le site complet (textes, test, calcul, mentions légales et confidentialité) |
| `netlify.toml` | Configuration de publication Netlify |
| `robots.txt` | Autorise l'indexation |
| `favicon.ico`, `favicon-32.png`, `apple-touch-icon.png` | Icônes reprises de hemistiches.com |

## Publication

Toute modification enregistrée sur la branche `main` est publiée automatiquement par Netlify (projet `diapason-site`), en une minute environ.

Le formulaire `rapport-diapason` est reçu par Netlify Forms ; une notification est envoyée à chaque demande.

© 2026 Hémistiches. Tous droits réservés. Les textes, la structure du test et les éléments graphiques de ce site sont protégés ; leur reproduction sans autorisation écrite préalable est interdite.
