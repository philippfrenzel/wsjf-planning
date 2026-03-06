# Intégration du serveur MCP

Le WSJF Planning Tool fournit un serveur [Model Context Protocol (MCP)](https://modelcontextprotocol.io/). Cela permet aux assistants IA tels que GitHub Copilot CLI, VS Code Copilot ou d'autres clients compatibles MCP d'accéder directement aux projets, features, équipes et planifications.

## Point d'accès et authentification

| Propriété | Valeur |
|---|---|
| **URL** | `https://<votre-domaine>/mcp/wsjf` |
| **Transport** | HTTP Streamable (Laravel MCP SDK) |
| **Authentification** | Bearer Token (Laravel Sanctum) |

L'accès se fait via un jeton API personnel que vous pouvez créer dans votre profil utilisateur sous **Settings → API Tokens**. Toutes les données sont automatiquement limitées à votre locataire (Tenant).

## Configuration du client

### GitHub Copilot CLI

> **Important :** La Copilot CLI tente automatiquement une authentification OAuth avec `type: "http"`. Pour utiliser un Bearer Token statique à la place, utilisez `type: "sse"`.

Créez ou modifiez `~/.copilot/mcp-config.json` :

```json
{
  "mcpServers": {
    "wsjf-planning": {
      "type": "sse",
      "url": "https://<votre-domaine>/mcp/wsjf",
      "headers": {
        "Authorization": "Bearer <votre-jeton-api>"
      }
    }
  }
}
```

Vous pouvez également ajouter le serveur depuis la CLI :

```
/mcp add
```

Redémarrez ensuite la CLI pour que la configuration soit chargée.

### VS Code (GitHub Copilot)

Créez ou modifiez `.copilot/mcp.json` à la racine du projet :

```json
{
  "mcpServers": {
    "wsjf-planning": {
      "type": "http",
      "url": "https://<votre-domaine>/mcp/wsjf",
      "headers": {
        "Authorization": "Bearer <votre-jeton-api>"
      }
    }
  }
}
```

> **Remarque :** VS Code supporte directement `type: "http"` avec un Bearer Token – aucun détour par `sse` n'est nécessaire ici.

### Autres clients MCP

Tout client compatible MCP peut se connecter. Assurez-vous que :

1. L'URL pointe vers `/mcp/wsjf`
2. L'en-tête `Authorization: Bearer <token>` est envoyé avec chaque requête
3. Le client supporte le transport HTTP Streamable ou SSE

## Outils disponibles

Le serveur MCP fournit les outils suivants :

### Projets

| Outil | Description | Paramètres obligatoires | Paramètres optionnels |
|---|---|---|---|
| `list-projects` | Tous les projets du locataire avec responsables et nombre d'équipes | — | `status` |
| `get-project` | Détails du projet avec équipes, compétences et nombre de features | `project_id` | — |
| `create-project` | Créer un nouveau projet | `project_number`, `name`, `start_date`, `project_leader_id` | `description`, `jira_base_uri`, `deputy_leader_id` |
| `update-project` | Mettre à jour partiellement un projet (y compris transitions de statut) | `project_id` | `project_number`, `name`, `description`, `jira_base_uri`, `start_date`, `project_leader_id`, `deputy_leader_id`, `new_status` |

### Features

| Outil | Description | Paramètres obligatoires | Paramètres optionnels |
|---|---|---|---|
| `list-features` | Features avec scores WSJF, filtrables | — | `project_id`, `status`, `type`, `limit` |
| `get-feature` | Détails complets du feature : WSJF, dépendances, compétences, historique | `feature_id` | — |
| `create-feature` | Créer un nouveau feature | `name`, `project_id` | `jira_key`, `type`, `description`, `requester_id`, `team_id` |
| `update-feature` | Mettre à jour partiellement un feature | `feature_id` | `name`, `jira_key`, `type`, `description`, `requester_id`, `project_id`, `team_id` |
| `delete-feature` | Supprimer un feature (Soft Delete) | `feature_id` | — |

Types de features supportés : `business`, `enabler`, `tech_debt`, `nfr`

### Équipes et compétences

| Outil | Description | Paramètres obligatoires | Paramètres optionnels |
|---|---|---|---|
| `list-teams` | Toutes les équipes avec nombre de membres | — | — |
| `get-team` | Détails de l'équipe avec membres et leurs compétences | `team_id` | — |
| `list-skills` | Compétences groupées par catégorie | — | `category` |

### Planifications

| Outil | Description | Paramètres obligatoires | Paramètres optionnels |
|---|---|---|---|
| `list-plannings` | Planifications PI avec statut, nombre de features et d'itérations | — | `project_id` |

## Ressources

En plus des outils, le serveur fournit une ressource MCP :

| Ressource | URI | Description |
|---|---|---|
| `dashboard-summary` | `wsjf://dashboard/summary` | Vue d'ensemble du locataire : nombre de projets, features, équipes, compétences, planifications ainsi que les 5 features les plus récents |

## Exemples de prompts

Après une connexion réussie, vous pouvez par exemple adresser les requêtes suivantes à l'assistant IA :

- *« Montre-moi tous les projets avec leurs scores WSJF »*
- *« Crée un nouveau projet avec le numéro P-2026-01 appelé "Refonte Plateforme" »*
- *« Mets à jour le projet 5 pour passer au statut en réalisation »*
- *« Crée un nouveau feature "Optimisation de la connexion" dans le projet 3 »*
- *« Quelle équipe a le plus de features ouverts ? »*
- *« Donne-moi un résumé du tableau de bord »*

## Dépannage

| Problème | Solution |
|---|---|
| `MCPOAuthError: Failed to discover authorization server metadata` | La Copilot CLI tente OAuth. Changez `type` de `"http"` à `"sse"` dans la configuration. |
| `401 Unauthorized` | Jeton invalide ou expiré. Créez un nouveau jeton dans le profil utilisateur. |
| Aucun outil visible | Redémarrez la CLI. Vérifiez la configuration avec `/mcp` dans la Copilot CLI. |
| Données manquantes / vides | Le jeton est lié au locataire. Assurez-vous de travailler dans le bon Tenant. |
| `Failed to read configuration` / `mcpServers: Required` | La clé de premier niveau dans `mcp-config.json` doit être `"mcpServers"` (et non `"servers"`). |
