# Installation et démarrage

Ce projet est une application Laravel + React (Inertia). La configuration par défaut utilise SQLite pour un démarrage local rapide.

Prérequis
- PHP >= 8.2, Composer
- Node.js >= 18 (recommandé : 20) et npm
- Optionnel : Imagick ou GD pour le traitement des images d'avatar

Démarrage rapide
1) Cloner le dépôt et installer les dépendances
   - PHP : `composer install`
   - JS : `npm install`

2) Créer le fichier d'environnement et générer la clé de l'application
   - `cp .env.example .env`
   - `php artisan key:generate`

3) Préparer la base de données (par défaut : SQLite)
   - Assurez-vous que `DB_CONNECTION=sqlite` est défini dans `.env`
   - Créez si nécessaire `database/database.sqlite` : `mkdir -p database && touch database/database.sqlite`
   - Exécuter les migrations : `php artisan migrate`

4) Démarrer le serveur de développement
   - Backend : `php artisan serve`
   - Frontend (Vite) : `npm run dev`

5) Accès
   - Ouvrir : http://localhost:8000 (sauf configuration différente)
   - Inscrivez un utilisateur. Un Tenant (locataire) propre est automatiquement créé.

Étapes supplémentaires recommandées
- Lien de stockage (pour les fichiers publics) : `php artisan storage:link`
- Session et file d'attente : par défaut `database` (voir `.env.example`).
- Messagerie : pour la vérification par e‑mail, configurer `MAIL_MAILER` (par défaut, les e‑mails sont journalisés).

Scripts utiles
- Tests PHP : `composer test`
- Tests E2E (Cypress) : `npm run test:e2e`

Remarques
- Les valeurs d'exemple de `.env` se trouvent dans `.env.example` (par ex. `SESSION_DRIVER=database`, `QUEUE_CONNECTION=database`).
- Pour les uploads d'avatars, Imagick est préféré, sinon GD. Sans support JPEG, veuillez utiliser PNG/WebP.
