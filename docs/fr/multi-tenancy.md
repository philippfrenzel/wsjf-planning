# Multi‑Tenancy (Gestion multi-locataires)

Modèle
- Approche base de données unique avec colonne `tenant_id` par table liée au locataire
- La table `tenants` gère les locataires et les invitations
- Lors de l'inscription, un Tenant est automatiquement créé et attribué à l'utilisateur

Utilisation
- Changement de Tenant : Menu « Tenants » → Tenants listés → « Changer »
- Membres : Affichage des membres du Tenant actuel
- Invitations : Les propriétaires d'un Tenant peuvent inviter par e‑mail ; les utilisateurs invités acceptent l'invitation et deviennent membres

Page d'interface
- Vue d'ensemble des Tenants, changement et invitations : `GET /tenants` (voir `routes/web.php:100`)

Visibilité
- Toutes les requêtes pertinentes sont limitées par un scope global au Tenant actuel de l'utilisateur connecté (les utilisateurs anonymes ne voient aucune donnée de Tenant).
