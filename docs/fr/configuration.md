# Configuration et environnement

Les principaux paramètres sont définis via `.env`. Un modèle est disponible dans `.env.example`.

Variables principales
- `APP_URL` : URL de base publique de l'application
- `APP_DEBUG` : Mode débogage (true/false)
- `APP_LOCALE`, `APP_FALLBACK_LOCALE` : Paramètres de langue (de/en)
- `APP_KEY` : Clé de sécurité (à définir via `php artisan key:generate`)

Base de données / Cache / File d'attente
- `DB_CONNECTION` : Par défaut `sqlite` (sinon configurer MySQL/Postgres)
- `SESSION_DRIVER` : recommandé `database`
- `CACHE_STORE` : par ex. `database`
- `QUEUE_CONNECTION` : par ex. `database`

E‑mail
- `MAIL_MAILER` : par ex. `smtp`, `log` (par défaut : `log`)
- `MAIL_*` : Hôte/identifiants pour SMTP

Système de fichiers
- `FILESYSTEM_DISK` : Par défaut `local`
- Pour les fichiers publics, créer le lien : `php artisan storage:link`

Frontend (Vite)
- `VITE_APP_NAME` : Nom affiché dans le frontend

Traitement des images d'avatar
- Supporte Imagick (préféré) ou GD
- Si JPEG n'est pas disponible, veuillez utiliser PNG/WebP (voir Settings > Profil)

Multi‑Tenancy (Base de données unique)
- Les locataires sont représentés par une colonne `tenant_id` dans les tables.
- Lors de l'inscription, un Tenant est automatiquement créé et attribué à l'utilisateur.
- Le Tenant actuel de l'utilisateur contrôle la visibilité de toutes les données.
