# MCP Server Integration

The WSJF Planning Tool provides a [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server. This allows AI assistants such as GitHub Copilot CLI, VS Code Copilot, or other MCP-compatible clients to directly access projects, features, teams, and plannings.

## Endpoint and Authentication

| Property | Value |
|---|---|
| **URL** | `https://<your-domain>/mcp/wsjf` |
| **Transport** | HTTP Streamable (Laravel MCP SDK) |
| **Authentication** | Bearer Token (Laravel Sanctum) |

Access is provided via a personal API token, which you can create in your user profile under **Settings → API Tokens**. All data is automatically scoped to your tenant.

## Client Configuration

### GitHub Copilot CLI

> **Important:** The Copilot CLI attempts OAuth authentication automatically when using `type: "http"`. To use a static Bearer token instead, set `type: "sse"`.

Create or edit `~/.copilot/mcp-config.json`:

```json
{
  "mcpServers": {
    "wsjf-planning": {
      "type": "sse",
      "url": "https://<your-domain>/mcp/wsjf",
      "headers": {
        "Authorization": "Bearer <your-api-token>"
      }
    }
  }
}
```

Alternatively, you can add the server from within the CLI:

```
/mcp add
```

Then restart the CLI so that the configuration is loaded.

### VS Code (GitHub Copilot)

Create or edit `.copilot/mcp.json` in the project root:

```json
{
  "mcpServers": {
    "wsjf-planning": {
      "type": "http",
      "url": "https://<your-domain>/mcp/wsjf",
      "headers": {
        "Authorization": "Bearer <your-api-token>"
      }
    }
  }
}
```

> **Note:** VS Code supports `type: "http"` with Bearer token directly – no workaround via `sse` is needed here.

### Other MCP Clients

Any MCP-compatible client can connect. Ensure that:

1. The URL points to `/mcp/wsjf`
2. The `Authorization: Bearer <token>` header is sent with every request
3. The client supports HTTP Streamable Transport or SSE

## Available Tools

The MCP server provides the following tools:

### Projects

| Tool | Description | Required Parameters | Optional Parameters |
|---|---|---|---|
| `list-projects` | All projects of the tenant with managers and team count | — | `status` |
| `get-project` | Project details with teams, skills, and feature count | `project_id` | — |

### Features

| Tool | Description | Required Parameters | Optional Parameters |
|---|---|---|---|
| `list-features` | Features with WSJF scores, filterable | — | `project_id`, `status`, `type`, `limit` |
| `get-feature` | Full feature details: WSJF, dependencies, skills, history | `feature_id` | — |
| `create-feature` | Create a new feature | `name`, `project_id` | `jira_key`, `type`, `description`, `requester_id`, `team_id` |
| `update-feature` | Partially update a feature | `feature_id` | `name`, `jira_key`, `type`, `description`, `requester_id`, `project_id`, `team_id` |
| `delete-feature` | Delete a feature (soft delete) | `feature_id` | — |

Supported feature types: `business`, `enabler`, `tech_debt`, `nfr`

### Teams and Skills

| Tool | Description | Required Parameters | Optional Parameters |
|---|---|---|---|
| `list-teams` | All teams with member count | — | — |
| `get-team` | Team details with members and their skills | `team_id` | — |
| `list-skills` | Skills grouped by category | — | `category` |

### Plannings

| Tool | Description | Required Parameters | Optional Parameters |
|---|---|---|---|
| `list-plannings` | PI plannings with status, feature count, and iteration count | — | `project_id` |

## Resources

In addition to tools, the server provides an MCP resource:

| Resource | URI | Description |
|---|---|---|
| `dashboard-summary` | `wsjf://dashboard/summary` | Tenant overview: number of projects, features, teams, skills, plannings, and the 5 most recent features |

## Example Prompts

After a successful connection, you can send prompts like the following to the AI assistant:

- *"Show me all projects with their WSJF scores"*
- *"Create a new feature 'Login Optimization' in project 3"*
- *"Which team has the most open features?"*
- *"Give me a summary of the dashboard"*

## Troubleshooting

| Problem | Solution |
|---|---|
| `MCPOAuthError: Failed to discover authorization server metadata` | Copilot CLI is attempting OAuth. Change `type` from `"http"` to `"sse"` in the configuration. |
| `401 Unauthorized` | Token is invalid or expired. Create a new token in your user profile. |
| No tools visible | Restart the CLI. Check the configuration with `/mcp` in the Copilot CLI. |
| Data missing / empty | The token is tenant-scoped. Make sure you are working in the correct tenant. |
| `Failed to read configuration` / `mcpServers: Required` | The top-level key in `mcp-config.json` must be `"mcpServers"` (not `"servers"`). |
