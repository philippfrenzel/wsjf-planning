# MCP-Server Integration

Il WSJF Planning Tool mette a disposizione un server [Model Context Protocol (MCP)](https://modelcontextprotocol.io/). In questo modo, assistenti IA come GitHub Copilot CLI, VS Code Copilot o altri client compatibili con MCP possono accedere direttamente a progetti, feature, team e pianificazioni.

## Endpoint e autenticazione

| Proprietà | Valore |
|---|---|
| **URL** | `https://<vostro-dominio>/mcp/wsjf` |
| **Trasporto** | HTTP Streamable (Laravel MCP SDK) |
| **Autenticazione** | Bearer Token (Laravel Sanctum) |

L'accesso avviene tramite un token API personale, che potete creare nel vostro profilo utente sotto **Settings → API Tokens**. Tutti i dati sono automaticamente limitati al vostro mandante (Tenant).

## Configurazione del client

### GitHub Copilot CLI

> **Importante:** La Copilot CLI tenta automaticamente un'autenticazione OAuth con `type: "http"`. Per utilizzare invece un Bearer Token statico, usate `type: "sse"`.

Creare o modificare `~/.copilot/mcp-config.json`:

```json
{
  "mcpServers": {
    "wsjf-planning": {
      "type": "sse",
      "url": "https://<vostro-dominio>/mcp/wsjf",
      "headers": {
        "Authorization": "Bearer <vostro-api-token>"
      }
    }
  }
}
```

In alternativa, potete aggiungere il server direttamente dalla CLI:

```
/mcp add
```

Successivamente, riavviare la CLI affinché la configurazione venga caricata.

### VS Code (GitHub Copilot)

Creare o modificare `.copilot/mcp.json` nella root del progetto:

```json
{
  "mcpServers": {
    "wsjf-planning": {
      "type": "http",
      "url": "https://<vostro-dominio>/mcp/wsjf",
      "headers": {
        "Authorization": "Bearer <vostro-api-token>"
      }
    }
  }
}
```

> **Nota:** VS Code supporta `type: "http"` con Bearer Token direttamente – qui non è necessario il workaround tramite `sse`.

### Altri client MCP

Qualsiasi client compatibile con MCP può connettersi. Assicurarsi che:

1. L'URL punti a `/mcp/wsjf`
2. L'header `Authorization: Bearer <token>` venga inviato con ogni richiesta
3. Il client supporti HTTP Streamable Transport o SSE

## Tool disponibili

Il server MCP mette a disposizione i seguenti tool:

### Progetti

| Tool | Descrizione | Parametri obbligatori | Parametri opzionali |
|---|---|---|---|
| `list-projects` | Tutti i progetti del mandante con responsabili e numero di team | — | `status` |
| `get-project` | Dettagli progetto con team, skill e numero di feature | `project_id` | — |

### Feature

| Tool | Descrizione | Parametri obbligatori | Parametri opzionali |
|---|---|---|---|
| `list-features` | Feature con punteggi WSJF, filtrabile | — | `project_id`, `status`, `type`, `limit` |
| `get-feature` | Dettagli completi della feature: WSJF, dipendenze, skill, cronologia | `feature_id` | — |
| `create-feature` | Creare una nuova feature | `name`, `project_id` | `jira_key`, `type`, `description`, `requester_id`, `team_id` |
| `update-feature` | Aggiornare parzialmente una feature | `feature_id` | `name`, `jira_key`, `type`, `description`, `requester_id`, `project_id`, `team_id` |
| `delete-feature` | Eliminare una feature (Soft Delete) | `feature_id` | — |

Tipi di feature supportati: `business`, `enabler`, `tech_debt`, `nfr`

### Team e skill

| Tool | Descrizione | Parametri obbligatori | Parametri opzionali |
|---|---|---|---|
| `list-teams` | Tutti i team con numero di membri | — | — |
| `get-team` | Dettagli del team con membri e relative skill | `team_id` | — |
| `list-skills` | Skill raggruppate per categoria | — | `category` |

### Pianificazioni

| Tool | Descrizione | Parametri obbligatori | Parametri opzionali |
|---|---|---|---|
| `list-plannings` | Pianificazioni PI con stato, numero di feature e iterazioni | — | `project_id` |

## Risorse

Oltre ai tool, il server mette a disposizione una risorsa MCP:

| Risorsa | URI | Descrizione |
|---|---|---|
| `dashboard-summary` | `wsjf://dashboard/summary` | Panoramica del mandante: numero di progetti, feature, team, skill, pianificazioni e le 5 feature più recenti |

## Prompt di esempio

Dopo una connessione riuscita, potete ad esempio inviare le seguenti richieste all'assistente IA:

- *"Mostrami tutti i progetti con i loro punteggi WSJF"*
- *"Crea una nuova feature 'Ottimizzazione Login' nel progetto 3"*
- *"Quale team ha il maggior numero di feature aperte?"*
- *"Dammi un riepilogo della dashboard"*

## Risoluzione dei problemi

| Problema | Soluzione |
|---|---|
| `MCPOAuthError: Failed to discover authorization server metadata` | La Copilot CLI tenta OAuth. Modificare `type` da `"http"` a `"sse"` nella configurazione. |
| `401 Unauthorized` | Token non valido o scaduto. Creare un nuovo token nel profilo utente. |
| Nessun tool visibile | Riavviare la CLI. Verificare la configurazione con `/mcp` nella Copilot CLI. |
| Dati mancanti / vuoti | Il token è legato al mandante. Assicurarsi di lavorare nel Tenant corretto. |
