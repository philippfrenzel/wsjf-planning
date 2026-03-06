import { Head, Link, usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { useTranslation } from '@/hooks/use-translation';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { useState } from 'react';

function CodeBlock({ code, title, copyTooltip }: { code: string; title?: string; copyTooltip?: string }) {
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
                title={copyTooltip}
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
      "type": "sse",
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
        { name: 'list-projects', descKey: 'mcp_tool_list_projects', rw: 'read' },
        { name: 'get-project', descKey: 'mcp_tool_get_project', rw: 'read' },
        { name: 'create-project', descKey: 'mcp_tool_create_project', rw: 'write' },
        { name: 'update-project', descKey: 'mcp_tool_update_project', rw: 'write' },
        { name: 'list-features', descKey: 'mcp_tool_list_features', rw: 'read' },
        { name: 'get-feature', descKey: 'mcp_tool_get_feature', rw: 'read' },
        { name: 'create-feature', descKey: 'mcp_tool_create_feature', rw: 'write' },
        { name: 'update-feature', descKey: 'mcp_tool_update_feature', rw: 'write' },
        { name: 'delete-feature', descKey: 'mcp_tool_delete_feature', rw: 'write' },
        { name: 'list-teams', descKey: 'mcp_tool_list_teams', rw: 'read' },
        { name: 'get-team', descKey: 'mcp_tool_get_team', rw: 'read' },
        { name: 'list-skills', descKey: 'mcp_tool_list_skills', rw: 'read' },
        { name: 'list-plannings', descKey: 'mcp_tool_list_plannings', rw: 'read' },
    ];

    return (
        <>
            <Head title={t('mcp_meta_og_title')}>
                <meta name="description" content={t('mcp_meta_description')} />
                <meta property="og:title" content={t('mcp_meta_og_title')} />
                <meta property="og:description" content={t('mcp_meta_og_description')} />
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
                                        {t('nav_login')}
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                                    >
                                        {t('nav_register')}
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
                            {t('mcp_hero_title')}
                        </h1>
                        <p className="mt-4 text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
                            {t('mcp_hero_description')}
                        </p>
                    </div>
                </section>

                {/* Content */}
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-20 space-y-16">

                    {/* What is MCP */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">{t('mcp_what_is_title')}</h2>
                        <p className="text-slate-300 leading-relaxed">
                            {t('mcp_what_is_text')}{' '}
                            <a href="https://modelcontextprotocol.io" target="_blank" rel="noopener" className="text-indigo-400 hover:text-indigo-300 underline">modelcontextprotocol.io</a>
                        </p>
                    </section>

                    {/* Authentication */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">{t('mcp_auth_title')}</h2>
                        <div className="space-y-4 text-slate-300 leading-relaxed">
                            <p>
                                {t('mcp_auth_text')}
                            </p>
                            <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-4">
                                <h3 className="text-sm font-semibold text-indigo-300 mb-2">{t('mcp_auth_create_title')}</h3>
                                <ol className="text-sm space-y-1 text-indigo-200 list-decimal list-inside">
                                    <li>{t('mcp_auth_step1')}</li>
                                    <li>{t('mcp_auth_step2')}{auth.user && (
                                        <> (<Link href={route('tokens.index')} className="underline hover:text-white">→</Link>)</>
                                    )}</li>
                                    <li>{t('mcp_auth_step3')}</li>
                                    <li>{t('mcp_auth_step4')}</li>
                                </ol>
                            </div>
                            <p className="text-sm text-slate-400">
                                {t('mcp_auth_warning')}
                            </p>
                        </div>
                    </section>

                    {/* VS Code */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                            {t('mcp_vscode_title')}
                        </h2>
                        <div className="space-y-4 text-slate-300 leading-relaxed">
                            <p>
                                {t('mcp_vscode_text')}
                            </p>
                            <CodeBlock
                                title=".vscode/mcp.json"
                                code={vsCodeConfig}
                                copyTooltip={t('mcp_copy_tooltip')}
                            />
                            <p className="text-sm text-slate-400">
                                {t('mcp_vscode_hint')}
                            </p>
                        </div>
                    </section>

                    {/* Claude Code */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">{t('mcp_claude_title')}</h2>
                        <div className="space-y-4 text-slate-300 leading-relaxed">
                            <p>
                                {t('mcp_claude_text')}
                            </p>
                            <CodeBlock
                                title="~/.claude/claude_desktop_config.json"
                                code={claudeCodeConfig}
                                copyTooltip={t('mcp_copy_tooltip')}
                            />
                            <p className="text-sm text-slate-400">
                                {t('mcp_claude_hint')}
                            </p>
                        </div>
                    </section>

                    {/* Copilot CLI */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">{t('mcp_copilot_cli_title')}</h2>
                        <div className="space-y-4 text-slate-300 leading-relaxed">
                            <p>
                                {t('mcp_copilot_cli_text')}
                            </p>
                            <CodeBlock
                                title="~/.copilot/mcp-config.json"
                                code={copilotCliConfig}
                                copyTooltip={t('mcp_copy_tooltip')}
                            />
                            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                                <p className="text-sm text-amber-200">
                                    {t('mcp_copilot_cli_hint')}
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Test with curl */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">{t('mcp_test_title')}</h2>
                        <div className="space-y-4 text-slate-300 leading-relaxed">
                            <p>
                                {t('mcp_test_text')}
                            </p>
                            <CodeBlock
                                title="Terminal"
                                code={curlTest}
                                copyTooltip={t('mcp_copy_tooltip')}
                            />
                            <p className="text-sm text-slate-400">
                                {t('mcp_test_success')}
                            </p>
                        </div>
                    </section>

                    {/* Available Tools */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-6">{t('mcp_tools_title')}</h2>
                        <div className="grid gap-3">
                            {tools.map((tool) => (
                                <div key={tool.name} className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 flex items-start justify-between gap-3">
                                    <div>
                                        <code className="text-sm font-bold text-indigo-400">{tool.name}</code>
                                        <p className="mt-1 text-sm text-slate-300">{t(tool.descKey)}</p>
                                    </div>
                                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                                        tool.rw === 'write'
                                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                            : 'bg-slate-700 text-slate-400'
                                    }`}>
                                        {tool.rw === 'write' ? 'write' : 'read'}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <p className="mt-4 text-sm text-slate-400">
                            {t('mcp_tools_resource_text')}
                        </p>
                    </section>

                    {/* Security */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">{t('mcp_security_title')}</h2>
                        <div className="space-y-3 text-slate-300 leading-relaxed">
                            <ul className="space-y-2 text-sm">
                                <li className="flex gap-2">
                                    <span className="text-indigo-400">•</span>
                                    <span>{t('mcp_security_tenant')}</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-indigo-400">•</span>
                                    <span>{t('mcp_security_rw')}</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-indigo-400">•</span>
                                    <span>{t('mcp_security_token')}</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="text-indigo-400">•</span>
                                    <span>{t('mcp_security_https')}</span>
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
                                {t('mcp_cta_create_token')}
                                <ExternalLink className="h-4 w-4" />
                            </Link>
                        ) : (
                            <Link
                                href={route('register')}
                                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                            >
                                {t('mcp_cta_register')}
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
                            <Link href="/" className="hover:text-white transition-colors">{t('nav_home')}</Link>
                            <Link href={route('docs.mcp')} className="text-white font-medium">MCP Docs</Link>
                            <Link href={route('login')} className="hover:text-white transition-colors">{t('nav_login')}</Link>
                            <Link href={route('register')} className="hover:text-white transition-colors">{t('nav_register')}</Link>
                            <Link href={route('imprint')} className="hover:text-white transition-colors">{t('nav_imprint')}</Link>
                        </nav>
                    </div>
                    <div className="mt-8 border-t border-slate-800 pt-6 text-center text-sm text-slate-500">
                        © {year} WSJF Planning. {t('mcp_footer_rights')}
                    </div>
                </div>
            </footer>
        </>
    );
}
