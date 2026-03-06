# Guide utilisateur – Workflows

Ce chapitre décrit les principaux domaines et workflows de l'application.

Connexion et démarrage
- Page d'accueil : Bienvenue/Landing, Connexion/Inscription
- Après connexion : Tableau de bord avec KPIs et « Mes plannings valides » (`resources/js/pages/dashboard.tsx:1`)

Projets
- Affichage : Liste des projets, Détails, Créer/Modifier/Supprimer (`routes/web.php:62`)
- Champs : Numéro de projet, Nom, Description, Date de début, Chef de projet, Suppléant, URL de base Jira
- Statut : En planification → En réalisation → En recette → Terminé (changement de statut dans la boîte de dialogue de modification)
- Navigation : Projets → « Nouveau » pour créer

Features
- Liste : Filtre (Clé Jira, Nom, Projet, Demandeur, Statut), Tri, Pagination (`resources/js/pages/features/index.tsx:1`)
- Créer/Modifier : Clé Jira, Nom, Description (texte enrichi possible), Projet, Demandeur
- Board : Tableau Kanban avec glisser-déposer pour le changement de statut (En planification, Approuvé, Implémenté, Rejeté, Obsolète, Archivé) (`resources/js/pages/features/board.tsx:1`)
- Page de détail : Détails du feature, Dépendances, Composants d'estimation, Estimations, Description (`resources/js/pages/features/show.tsx:1`)

Estimations (Estimation Components)
- Composants : aspects métier/techniques d'un feature
- Estimations : Best Case, Most Likely, Worst Case, Unité (Heures/Jours/Story Points), Notes
- Automatique : la moyenne pondérée et l'écart-type sont calculés (`app/Models/Estimation.php:1`)
- Archivage/Réactivation des composants possible

Plannings
- Sessions de planification par projet avec titre, description, dates
- Responsables : Owner et Deputy, ajout de parties prenantes par sélection (`app/Http/Controllers/PlanningController.php:1`)
- Attribuer des features : lors de la création/modification ou ultérieurement
- Affichage : Onglets « Détails & Common Vote » et « Features & Individual Votes » (`resources/js/pages/plannings/show.tsx:1`)

Voting (Catégories WSJF)
- Catégories : Business Value, Time Criticality, Risk/Opportunity
- Vue tableau : Saisir une valeur numérique par feature pour chaque catégorie (`resources/js/pages/votes/session.tsx:1`)
- Vue cartes : Classer les features par catégorie via glisser-déposer (positions 1..n) (`resources/js/pages/votes/card-session.tsx:1`)
- Enregistrer : Bouton « Enregistrer le vote »
- Common Votes : Les valeurs moyennes sont automatiquement calculées pour le créateur du planning (`app/Http/Controllers/VoteController.php:1`)

Commitments
- Objectif : Attribution engageante « Qui fait quoi ? » par planning et feature
- Types : A/B/C/D (combinaison de priorité/urgence), Statut : Proposition/Accepté/Terminé
- Vues liste et détail, Modification avec transitions de statut (`app/Http/Controllers/CommitmentController.php:1`)
- Synthèse par planning : Résumé de tous les commitments (`resources/js/pages/commitments/planning.tsx`)

Dépendances entre features
- Sur la page de détail du feature, vue des dépendances (permet, empêche, conditionne, remplace)
- Liens vers les features référencés disponibles (`resources/js/pages/features/show.tsx:120`)

Abonnements/Plans
- Choisir un abonnement : Plans avec nom/prix/intervalle, la sélection active un abonnement (`resources/js/pages/plans/select.tsx:1`)

Paramètres
- Profil : Modifier nom/e‑mail, télécharger un avatar (optimisé en WebP 256×256) (`resources/js/pages/settings/profile.tsx:1`)
- Changer le mot de passe : mot de passe actuel/nouveau avec confirmation (`resources/js/pages/settings/password.tsx:1`)
- Apparence : Page d'apparence disponible (`routes/settings.php:19`)

Tenants (Locataires)
- Vue d'ensemble : Vos Tenants, Tenant actuel, Membres, Invitations (`resources/js/pages/tenants/index.tsx:1`)
- Actions : Changer de Tenant, Inviter des membres (Token), Accepter des invitations

Navigation et remarques
- Les fils d'Ariane sur toutes les pages principales facilitent l'orientation
- Les messages de succès/erreur apparaissent sous forme de dialogues/toasts
- Les tableaux supportent le filtrage, le tri et la pagination

Captures d'écran (Exemples – Créer le fichier et le lier)
- Tableau de bord : `![Dashboard](images/dashboard.png)`
- Liste des features : `![Features Liste](images/features-list.png)`
- Board des features : `![Feature Board](images/feature-board.png)`
- Détails du planning : `![Planning Details](images/planning-details.png)`
- Voting (Tableau) : `![Voting Tabelle](images/vote-session-table.png)`
- Voting (Cartes) : `![Voting Karten](images/vote-session-cards.png)`
- Synthèse des commitments : `![Commitments](images/commitments.png)`
- Tenants : `![Tenants](images/tenants.png)`
