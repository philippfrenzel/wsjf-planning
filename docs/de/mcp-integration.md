# MCP-Server Integration

Das WSJF Planning Tool stellt einen [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) Server bereit. Damit können KI-Assistenten wie GitHub Copilot CLI, VS Code Copilot oder andere MCP-fähige Clients direkt auf Projekte, Features, Teams und Planungen zugreifen.

## Endpunkt und Authentifizierung

| Eigenschaft | Wert |
|---|---|
| **URL** | `https://<ihre-domain>/mcp/wsjf` |
| **Transport** | HTTP Streamable (Laravel MCP SDK) |
| **Authentifizierung** | Bearer Token (Laravel Sanctum) |

Der Zugriff erfolgt über einen persönlichen API-Token, den Sie in Ihrem Benutzerprofil unter **Settings → API Tokens** erstellen können. Alle Daten sind automatisch auf Ihren Mandanten (Tenant) begrenzt.

## Client-Konfiguration

### GitHub Copilot CLI

> **Wichtig:** Die Copilot CLI versucht bei `type: "http"` automatisch eine OAuth-Authentifizierung. Um stattdessen einen statischen Bearer Token zu verwenden, nutzen Sie `type: "sse"`.

Erstellen oder bearbeiten Sie `~/.copilot/mcp-config.json`:

```json
{
  "mcpServers": {
    "wsjf-planning": {
      "type": "sse",
      "url": "https://<ihre-domain>/mcp/wsjf",
      "headers": {
        "Authorization": "Bearer <ihr-api-token>"
      }
    }
  }
}
```

> **Wichtig:** Verwenden Sie `type: "sse"` statt `"http"`. Bei `type: "http"` versucht die Copilot CLI automatisch eine OAuth-Authentifizierung, die fehlschlägt. Mit `"sse"` wird der Bearer Token direkt verwendet.

Alternativ können Sie den Server innerhalb der CLI hinzufügen:

```
/mcp add
```

Anschließend die CLI neu starten, damit die Konfiguration geladen wird.

### VS Code (GitHub Copilot)

Erstellen oder bearbeiten Sie `.copilot/mcp.json` im Projekt-Root:

```json
{
  "mcpServers": {
    "wsjf-planning": {
      "type": "http",
      "url": "https://<ihre-domain>/mcp/wsjf",
      "headers": {
        "Authorization": "Bearer <ihr-api-token>"
      }
    }
  }
}
```

> **Hinweis:** VS Code unterstützt `type: "http"` mit Bearer Token direkt – hier ist kein Umweg über `sse` nötig.

### Andere MCP-Clients

Jeder MCP-kompatible Client kann sich verbinden. Stellen Sie sicher, dass:

1. Die URL auf `/mcp/wsjf` zeigt
2. Der `Authorization: Bearer <token>` Header bei jeder Anfrage mitgesendet wird
3. Der Client HTTP Streamable Transport oder SSE unterstützt

## Verfügbare Tools

Der MCP-Server stellt folgende Tools bereit:

### Projekte

| Tool | Beschreibung | Pflichtparameter | Optionale Parameter |
|---|---|---|---|
| `list-projects` | Alle Projekte des Mandanten mit Leitern und Teamanzahl | — | `status` |
| `get-project` | Projektdetails mit Teams, Skills und Feature-Anzahl | `project_id` | — |

### Features

| Tool | Beschreibung | Pflichtparameter | Optionale Parameter |
|---|---|---|---|
| `list-features` | Features mit WSJF-Scores, filterbar | — | `project_id`, `status`, `type`, `limit` |
| `get-feature` | Vollständige Feature-Details: WSJF, Abhängigkeiten, Skills, Historie | `feature_id` | — |
| `create-feature` | Neues Feature anlegen | `name`, `project_id` | `jira_key`, `type`, `description`, `requester_id`, `team_id` |
| `update-feature` | Feature teilweise aktualisieren | `feature_id` | `name`, `jira_key`, `type`, `description`, `requester_id`, `project_id`, `team_id` |
| `delete-feature` | Feature löschen (Soft Delete) | `feature_id` | — |

Unterstützte Feature-Typen: `business`, `enabler`, `tech_debt`, `nfr`

### Teams und Skills

| Tool | Beschreibung | Pflichtparameter | Optionale Parameter |
|---|---|---|---|
| `list-teams` | Alle Teams mit Mitgliederanzahl | — | — |
| `get-team` | Teamdetails mit Mitgliedern und deren Skills | `team_id` | — |
| `list-skills` | Skills gruppiert nach Kategorie | — | `category` |

### Planungen

| Tool | Beschreibung | Pflichtparameter | Optionale Parameter |
|---|---|---|---|
| `list-plannings` | PI-Planungen mit Status, Feature- und Iterationsanzahl | — | `project_id` |

## Ressourcen

Neben Tools stellt der Server eine MCP-Ressource bereit:

| Ressource | URI | Beschreibung |
|---|---|---|
| `dashboard-summary` | `wsjf://dashboard/summary` | Mandanten-Übersicht: Anzahl Projekte, Features, Teams, Skills, Planungen sowie die 5 neuesten Features |

## Beispiel-Prompts

Nach erfolgreicher Verbindung können Sie z. B. folgende Anfragen an den KI-Assistenten stellen:

- *„Zeige mir alle Projekte mit ihren WSJF-Scores"*
- *„Erstelle ein neues Feature ‚Login-Optimierung' im Projekt 3"*
- *„Welches Team hat die meisten offenen Features?"*
- *„Gib mir eine Zusammenfassung des Dashboards"*

## Fehlerbehebung

| Problem | Lösung |
|---|---|
| `MCPOAuthError: Failed to discover authorization server metadata` | Copilot CLI versucht OAuth. Ändern Sie `type` von `"http"` auf `"sse"` in der Konfiguration. |
| `401 Unauthorized` | Token ungültig oder abgelaufen. Erstellen Sie einen neuen Token im Benutzerprofil. |
| Keine Tools sichtbar | CLI neu starten. Prüfen Sie die Konfiguration mit `/mcp` in der Copilot CLI. |
| Daten fehlen / leer | Der Token ist mandantengebunden. Stellen Sie sicher, dass Sie im richtigen Tenant arbeiten. |
