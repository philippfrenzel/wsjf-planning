# FAQ et dépannage

Général
- Problème : « L'upload d'avatar échoue / JPEG non supporté »
  - Solution : Activer l'extension serveur Imagick ou GD avec JPEG, sinon uploader en PNG/WebP (Settings › Profil affiche un avertissement)

- Problème : Pas de mails de vérification
  - Solution : Le mailer par défaut est `log`. Pour de vrais e‑mails, configurer SMTP dans `.env` (`MAIL_MAILER=smtp`, définir Host/Port/User/Pass)

- Problème : Aucune donnée visible
  - Solution : Vérifier que le bon Tenant est actif (page « Tenants ») et que vous êtes membre du Tenant

Questions d'installation
- Erreur lors des migrations
  - Vérifier que la base de données est correctement configurée et accessible (fichier SQLite créé ?)

Voting/WSJF
- Saisie des valeurs en vue tableau
  - Les valeurs sont numériques par catégorie et par feature ; en vue cartes, la position correspond à la valeur

Performance/Développement
- Mode développement : `APP_DEBUG=true`, Vite avec `npm run dev`
- Build de production : `npm run build` (selon le déploiement)


## Import de features depuis un CSV Jira

- Question : Les formatages Jira sont-ils conservés lors de l'import CSV ?
  - Réponse : Oui ! Lors de l'import de features depuis des exports CSV Jira, les formatages wiki Jira sont automatiquement convertis en HTML. Formatages supportés :
    - Titres : `h1.`, `h2.`, `h3.`, etc.
    - Gras : `*text*` ou `**text**`
    - Italique : `_text_`
    - Souligné : `+text+`
    - Barré : `-text-`
    - Listes : `*` pour les listes non ordonnées et `#` pour les listes numérotées
    - Liens : `[URL]` ou `[Text|URL]`
    - Code : `{{inline code}}` et `{code}...{code}` pour les blocs de code
    - Citations : `bq. quote text`
    - Tableaux : Syntaxe de tableau Jira avec `||` pour les en-têtes et `|` pour les lignes
  - Les formatages sont automatiquement convertis lors de l'import et sont correctement visibles dans la description du feature.
