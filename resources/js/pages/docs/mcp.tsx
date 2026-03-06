import { Head, Link, usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { useTranslation } from '@/hooks/use-translation';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { useState } from 'react';

function CodeBlock({ code, title }: { code: string; title?: string }) {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <div className="relative group rounded-lg border border-slate-700 bg-slate-900 overflow-hidden">
            {title && (
                <div className="border-b border-slate-700 px-4 py-2 text-xs font-medium text-slate-400">{title}</div>
            )}
            <pre className="overflow-x-auto p-4 text-sm text-slate-300 leading-relaxed"><code>{code}</code></pre>
            <button
                onClick={copy}
                className="absolute top-2 right-2 p-1.5 rounded bg-slate-800 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-white transition-all"
                title="Kopieren"
            >
                {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
            </button>
        </div>
    );
}

export default function McpDocs() {
    const { auth } = usePage<SharedData>().props;
    const { t, locale, setLocale } = useTranslation();
    const year = new Date().getFullYear();

    const baseUrl = 'https://safenavigator.online';

    const vsCodeConfig = `{
  "mcpServers": {
    "wsjf-planning": {
      "type": "http",
      "url": "${baseUrl}/mcp/wsjf",
      "headers": {
        "Authorization": "Bearer YOUR_API_TOKEN"
      }
    }
  }
}`;

    const claudeCodeConfig = `{
  "mcpServers": {
    "wsjf-planning": {
      "type": "http",
      "url": "${baseUrl}/mcp/wsjf",
      "headers": {
        "Authorization": "Bearer YOUR_API_TOKEN"
      }
    }
  }
}`;

    const copilotCliConfig = `{
  "mcpServers": {
    "wsjf-planning": {
      "type": "http",
      "url": "${baseUrl}/mcp/wsjf",
      "headers": {
        "Authorization": "Bearer YOUR_API_TOKEN"
      }
    }
  }
}`;

    const curlTest = `curl -X POST ${baseUrl}/mcp/wsjf \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json, text/event-stream" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-03-26",
      "capabilities": {},
      "clientInfo": { "name": "test", "version": "1.0" }
    }
  }'`;

    const tools = [
        { name: 'list-projects', desc: 'Alle Projekte mit Projektleitern und Team-Anzahl auflisten' },
        { name: 'get-project', desc: 'Detailinformationen zu einem Projekt inkl. Teams, Skills, Beschreibung' },
        { name: 'list-features', desc: 'Features filtern nach Projekt, Status oder Typ — sortiert nach WSJF-Score' },
        { name: 'get-feature', desc: 'Feature-Details inkl. WSJF-Scores, Abhängigkeiten, Skill-Anforderungen' },
        { name: 'list-teams', desc: 'Alle Teams mit Mitgliederanzahl' },
        { name: 'get-team', desc: 'Team-Details mit Mitgliedern und deren Skills' },
        { name: 'list-skills', desc: 'Alle Skills gruppiert nach Kategorie' },
        { name: 'list-plannings', desc: 'PI-Planungen mit Projekt, Owner, Feature-/Iterations-Anzahl' },
    ];

    return (
        <>
            <Head title="MCP Integration — WSJF Planning Docs">
                <meta name="description" content="Dokumentation zur MCP-Integration (Model Context Protocol) für WSJF Planning. Verbinde VS Code, Claude Code oder Copilot CLI mit deinen PI-Planungsdaten." />
                <meta property="og:title" content="MCP Integration — WSJF Planning" />
                <meta property="og:description" content="Verbinde deine AI-Tools direkt mit deinen SAFe PI-Planungsdaten über das Model Context Protocol." />
            </Head>

            {/* NAV — same as landing page */}
            <header className="sticky top-0 z-50 bg-[#0f172a] border-b border-slate-800">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link href="/" className="text-xl font-bold text-white hover:text-indigo-300 transition-colors">
                                WSJF Planning
                            </Link>
                            <span className="hidden sm:inline text-xs text-slate-400 border border-slate-700 rounded-full px-2 py-0.5">
                                Docs
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <select
                                value={locale}
                                onChange={(e) => setLocale(e.target.value as 'en' | 'de' | 'fr' | 'it')}
                                className="bg-transparent text-slate-400 text-sm border-none outline-none cursor-pointer hover:text-white transition-colors"
                                aria-label="Language"
                            >
                                <option value="en">EN</option>
                                <option value="de">DE</option>
                                <option value="fr">FR</option>
                                <option value="it">IT</option>
                            </select>
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link href={route('login')} className="text-sm text-slate-300 hover:text-white transition-colors">
                                        Login
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                                    >
                                        Registrieren
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="bg-[#0f172a] min-h-screen">
                {/* Hero */}
                <section className="bg-gradient-to-b from-[#0f172a] to-[#1e293b] py-16 lg:py-20">
                    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
                        <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-300 mb-6">
                            Model Context Protocol
                        </span>
                        <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
                            MCP Integration
                        </h1>
                        <p className="mt-4 text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
                            Verbinde deine AI-Tools direkt mit deinen SAFe PI-Planungsdaten.
                            Greife aus VS Code, Claude Code oder Copilot CLI auf Projekte, Features, Teams und Skills zu.
                        </p>
                    </div>
                </section>

                {/* Content */}
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-20 space-y-16">

                    {/* What is MCP */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">Was ist MCP?</h2>
                        <p className="text-slate-300 leading-relaxed">
                            Das <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener" className="text-indigo-400 hover:text-indigo-300 underline">Model Context Protocol (MCP)</a> ist
                            ein offener Standard, der es AI-Anwendungen ermöglicht, sicher auf externe Datenquellen und Tools zuzugreifen.
                            WSJF Planning stellt einen MCP-Server bereit, über den deine AI-Tools deine PI-Planungsdaten lesen können —
                            alles innerhalb deines Tenant-Kontexts und mit deinen Berechtigungen.
                        </p>
                    </section>

                    {/* Authentication */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">Authentifizierung</h2>
                        <div className="space-y-4 text-slate-300 leading-relaxed">
                            <p>
                                Der MCP-Server verwendet <strong className="text-white">API Tokens</strong> (Bearer Authentication) zur Identifikation.
                                Jeder Token ist an deinen Benutzer und Tenant gebunden — alle Daten werden automatisch auf deinen Tenant eingeschränkt.
                            </p>
                            <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-4">
                                <h3 className="text-sm font-semibold text-indigo-300 mb-2">Token erstellen</h3>
                                <ol className="text-sm space-y-1 text-indigo-200 list-decimal list-inside">
                                    <li>Melde dich bei WSJF Planning an</li>
                                    <li>Gehe zu <strong>Settings → API Tokens</strong>{auth.user && (
                                        <> (<Link href={route('tokens.index')} className="underline hover:text-white">direkt öffnen</Link>)</>
                                    )}</li>
                                    <li>Vergib einen beschreibenden Namen (z.B. „VS Code", „Claude Code")</li>
                                    <li>Kopiere den Token — er wird nur einmal angezeigt!</li>
                                </ol>
                            </div>
                            <p className="text-sm text-slate-400">
                                ⚠️ Behandle deinen API Token wie ein Passwort. Teile ihn nicht und speichere ihn nicht in öffentlichen Repositories.
                            </p>
                        </div>
                    </section>

                    {/* VS Code */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                            VS Code / GitHub Copilot
                        </h2>
                        <div className="space-y-4 text-slate-300 leading-relaxed">
                            <p>
                                VS Code unterstützt MCP-Server nativ über die <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm">settings.json</code> oder
                                eine <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm">.vscode/mcp.json</code> Datei im Projektverzeichnis.
                            </p>
                            <CodeBlock
                                title=".vscode/mcp.json"
                                code={vsCodeConfig}
                            />
                            <p className="text-sm text-slate-400">
                                Ersetze <code className="bg-slate-800 px-1 rounded">YOUR_API_TOKEN</code> durch deinen persönlichen Token aus den Settings.
                                Nach dem Speichern erkennt VS Code den MCP-Server automatisch und die Tools stehen im Copilot Chat zur Verfügung.
                            </p>
                        </div>
                    </section>

                    {/* Claude Code */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">Claude Code</h2>
                        <div className="space-y-4 text-slate-300 leading-relaxed">
                            <p>
                                Claude Code (Anthropic CLI) unterstützt MCP-Server über eine JSON-Konfiguration.
                                Erstelle oder ergänze die Datei <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm">~/.claude/claude_desktop_config.json</code>:
                            </p>
                            <CodeBlock
                                title="~/.claude/claude_desktop_config.json"
                                code={claudeCodeConfig}
                            />
                            <p className="text-sm text-slate-400">
                                Nach dem Neustart von Claude Code stehen die WSJF-Planning-Tools im Kontext zur Verfügung.
                                Du kannst dann z.B. fragen: „Zeige mir alle Features im Projekt X sortiert nach WSJF-Score."
                            </p>
                        </div>
                    </section>

                    {/* Copilot CLI */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">GitHub Copilot CLI</h2>
                        <div className="space-y-4 text-slate-300 leading-relaxed">
                            <p>
                                Der GitHub Copilot CLI Agent unterstützt ebenfalls MCP-Server.
                                Ergänze die Datei <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm">.copilot/config.json</code> oder
                                nutze die globale Konfiguration:
                            </p>
                            <CodeBlock
                                title=".copilot/config.json"
                                code={copilotCliConfig}
                            />
                        </div>
                    </section>

                    {/* Test with curl */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">Verbindung testen</h2>
                        <div className="space-y-4 text-slate-300 leading-relaxed">
                            <p>
                                Du kannst die Verbindung vorab mit <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sm">curl</code> testen:
                            </p>
                            <CodeBlock
                                title="Terminal"
                                code={curlTest}
                            />
                            <p className="text-sm text-slate-400">
                                Eine erfolgreiche Antwort enthält ein JSON-RPC-Ergebnis mit Server-Capabilities und der Tool-Liste.
                            </p>
                        </div>
                    </section>

                    {/* Available Tools */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-6">Verfügbare Tools</h2>
                        <div className="grid gap-3">
                            {tools.map((tool) => (
                                <div key={tool.name} className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                                    <code className="text-sm font-bold text-indigo-400">{tool.name}</code>
                                    <p className="mt-1 text-sm text-slate-300">{tool.desc}</p>
                                </div>
                            ))}
                        </div>
                        <p className="mt-4 text-sm text-slate-400">
                            Zusätzlich steht die Resource <code className="bg-slate-800 px-1 rounded text-indigo-400">dashboard-summary</code> zur Verfügung,
                            die eine Übersicht deiner Tenant-Daten liefert (Projekt-, Feature-, Team-, Skill- und Planungsanzahl).
                        </p>
                    </section>

                    {/* Security */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">Sicherheit & Datenschutz</h2>
                        <div className="space-y-3 text-slate-300 leading-relaxed">
                            <ul className="space-y-2 text-sm">
                                <li className="flex gap-2">
                                    <span className="text-indigo-400">•</span>
                                    <span><strong className="text-white">Tenant-Isolation:</strong> Alle Abfragen sind auf deinen Tenant beschränkt. Du siehst ausschliesslich die Daten deiner Organisation.</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-indigo-400">•</span>
                                    <span><strong className="text-white">Read-Only:</strong> Der MCP-Server bietet ausschliesslich Lesezugriff. Es können keine Daten verändert, erstellt oder gelöscht werden.</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-indigo-400">•</span>
                                    <span><strong className="text-white">Token-basiert:</strong> Jeder Token kann jederzeit in den Settings widerrufen werden. Token sind an deinen Benutzer gebunden.</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-indigo-400">•</span>
                                    <span><strong className="text-white">HTTPS:</strong> Alle Kommunikation erfolgt verschlüsselt über HTTPS.</span>
                                </li>
                            </ul>
                        </div>
                    </section>

                    {/* CTA */}
                    <section className="text-center py-8">
                        {auth.user ? (
                            <Link
                                href={route('tokens.index')}
                                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                            >
                                API Token erstellen
                                <ExternalLink className="h-4 w-4" />
                            </Link>
                        ) : (
                            <Link
                                href={route('register')}
                                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                            >
                                Jetzt registrieren
                                <ExternalLink className="h-4 w-4" />
                            </Link>
                        )}
                    </section>
                </div>
            </main>

            {/* FOOTER */}
            <footer className="bg-[#0f172a] border-t border-slate-800 py-10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <span className="text-lg font-bold text-white">WSJF Planning</span>
                            <p className="text-sm text-slate-400 mt-1">SAFe PI-Planning Tool</p>
                        </div>
                        <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
                            <Link href="/" className="hover:text-white transition-colors">Home</Link>
                            <Link href={route('docs.mcp')} className="text-white font-medium">MCP Docs</Link>
                            <Link href={route('login')} className="hover:text-white transition-colors">Login</Link>
                            <Link href={route('register')} className="hover:text-white transition-colors">Registrieren</Link>
                            <Link href={route('imprint')} className="hover:text-white transition-colors">Impressum</Link>
                        </nav>
                    </div>
                    <div className="mt-8 border-t border-slate-800 pt-6 text-center text-sm text-slate-500">
                        © {year} WSJF Planning. Alle Rechte vorbehalten.
                    </div>
                </div>
            </footer>
        </>
    );
}
