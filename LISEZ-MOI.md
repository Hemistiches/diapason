# Diapason, par Hémistiches

Conformité RGPD des données de santé : présentation, tarifs et test d'orientation : https://diapason.hemistiches.com

Deux pages, française (`index.html`) et anglaise (`en/index.html`), reliées par le sélecteur FR | EN de l'en-tête. Chacune contient les besoins, les tarifs, la FAQ, le test, les mentions légales et la politique de confidentialité ; toute modification de texte se reporte dans les deux fichiers.

**Les prix, le questionnaire et les règles d'orientation sont centralisés dans `regles.js`**, chargé par les deux pages : tarifs, paliers d'abonnement (heures, report), taux de dépassement, structure des questions et embranchements, pondérations des indicateurs, règles d'orientation. Les montants affichés dans les pages (`data-p`) sont recalculés depuis ce fichier au chargement ; une modification de prix se fait donc là, et nulle part ailleurs. Aucune compilation ni dépendance : ce que contient ce dépôt est exactement ce qui est publié.

## Contenu

| Fichier | Rôle |
|---|---|
| `index.html` | La version française (textes, test, résultat, mentions légales et confidentialité) |
| `regles.js` | Tarifs, questionnaire, indicateurs et orientation, communs aux deux pages (dont la formule « données d'un dispositif intégrant de l'IA », depuis le 28 octobre 2026) |
| `en/index.html` | La version anglaise, même moteur et même formulaire ; les mentions indiquent que la version française prévaut |
| `netlify.toml` | Configuration de publication Netlify |
| `robots.txt` | Autorise l'indexation |
| `favicon.ico`, `favicon-32.png`, `apple-touch-icon.png` | Icônes reprises de hemistiches.com |

## Test d'orientation

Quatre temps : la situation (activité, entités, traitements à risque), le dispositif existant (délégué, registre, analyses d'impact, hébergement, transferts, incidents), les études (nombre, fondement, pays, état des documents) et le suivi récurrent (projets, demandes, relais interne), puis ce qui amène le visiteur. Le résultat sépare des indicateurs de situation (obligation, fragilité, exposition) et une orientation commerciale : échange prioritaire, consultation, diagnostic, mise en place, mission par étude, revue de la désignation, abonnement de délégué et son niveau, ou devis. Le niveau d'abonnement se déduit de la charge décrite, jamais du seul nombre d'études, de salariés ou de pays.

Champs transmis par le formulaire `rapport-diapason` (inchangés) : email, opposition, profil, score_obligation, score_fragilite, score_exposition, points_vigilance, offres_suggerees, horodatage, version_information (suffixe « -en » pour la page anglaise).

## Publication

Toute modification enregistrée sur la branche `main` est publiée automatiquement par Netlify (projet `diapason-site`), en une minute environ. Une branche ouverte en demande de fusion donne une prévisualisation, sans toucher au site en ligne.

Le formulaire `rapport-diapason` est reçu par Netlify Forms ; une notification est envoyée à chaque demande.

© 2026 Hémistiches. Tous droits réservés. Les textes, la structure du test et les éléments graphiques de ce site sont protégés ; leur reproduction sans autorisation écrite préalable est interdite.
