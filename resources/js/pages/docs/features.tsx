import { Head, Link, usePage } from '@inertiajs/react';
import { type SharedData } from '@/types';
import { useTranslation } from '@/hooks/use-translation';
import { ExternalLink, FileText, Sparkles, ListChecks, Rocket, ArrowRight } from 'lucide-react';

export default function FeaturesDocs() {
    const { auth } = usePage<SharedData>().props;
    const { t, locale, setLocale } = useTranslation();
    const year = new Date().getFullYear();

    const workflowSteps = [
        { num: '1', titleKey: 'feat_wf_step1_title', textKey: 'feat_wf_step1_text', Icon: FileText },
        { num: '2', titleKey: 'feat_wf_step2_title', textKey: 'feat_wf_step2_text', Icon: Sparkles },
        { num: '3', titleKey: 'feat_wf_step3_title', textKey: 'feat_wf_step3_text', Icon: ListChecks },
        { num: '4', titleKey: 'feat_wf_step4_title', textKey: 'feat_wf_step4_text', Icon: Rocket },
    ];

    const specCards = [
        { titleKey: 'feat_spec_ai_title', textKey: 'feat_spec_ai_text' },
        { titleKey: 'feat_spec_editor_title', textKey: 'feat_spec_editor_text' },
        { titleKey: 'feat_spec_chat_title', textKey: 'feat_spec_chat_text' },
        { titleKey: 'feat_spec_versions_title', textKey: 'feat_spec_versions_text' },
        { titleKey: 'feat_spec_reset_title', textKey: 'feat_spec_reset_text' },
    ];

    const planCards = [
        { titleKey: 'feat_plan_ai_title', textKey: 'feat_plan_ai_text' },
        { titleKey: 'feat_plan_priority_title', textKey: 'feat_plan_priority_text' },
        { titleKey: 'feat_plan_deps_title', textKey: 'feat_plan_deps_text' },
        { titleKey: 'feat_plan_status_title', textKey: 'feat_plan_status_text' },
        { titleKey: 'feat_plan_estimation_title', textKey: 'feat_plan_estimation_text' },
    ];

    const specKitItems = [
        { titleKey: 'feat_speckit_scenarios_title', textKey: 'feat_speckit_scenarios_text' },
        { titleKey: 'feat_speckit_requirements_title', textKey: 'feat_speckit_requirements_text' },
        { titleKey: 'feat_speckit_tasks_title', textKey: 'feat_speckit_tasks_text' },
    ];

    return (
        <>
            <Head title={t('feat_meta_og_title')}>
                <meta name="description" content={t('feat_meta_description')} />
                <meta property="og:title" content={t('feat_meta_og_title')} />
                <meta property="og:description" content={t('feat_meta_og_description')} />
            </Head>

            {/* NAV */}
            <header className="sticky top-0 z-50 bg-[#0f172a] border-b border-slate-800">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/" className="text-xl font-bold text-white hover:text-indigo-300 transition-colors">
                                WSJF Planning
                            </Link>
                            <span className="hidden sm:inline text-xs text-slate-400 border border-slate-700 rounded-full px-2 py-0.5">
                                Docs
                            </span>
                            <nav className="hidden sm:flex items-center gap-1 ml-2">
                                <Link
                                    href={route('docs.features')}
                                    className="px-3 py-1.5 text-sm font-medium rounded-md bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                                >
                                    {t('docs_nav_features')}
                                </Link>
                                <Link
                                    href={route('docs.mcp')}
                                    className="px-3 py-1.5 text-sm font-medium rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                                >
                                    {t('docs_nav_mcp')}
                                </Link>
                            </nav>
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
                            {t('feat_hero_badge')}
                        </span>
                        <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
                            {t('feat_hero_title')}
                        </h1>
                        <p className="mt-4 text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
                            {t('feat_hero_description')}
                        </p>
                    </div>
                </section>

                {/* Content */}
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 pb-20 space-y-16">

                    {/* Workflow Overview */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">{t('feat_wf_title')}</h2>
                        <p className="text-slate-300 leading-relaxed mb-8">{t('feat_wf_description')}</p>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {workflowSteps.map((step) => (
                                <div key={step.num} className="rounded-lg border border-slate-700 bg-slate-800/50 p-5 flex gap-4">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600/20 border border-indigo-500/30">
                                        <step.Icon className="h-5 w-5 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-white">
                                            <span className="text-indigo-400 mr-1">{step.num}.</span>
                                            {t(step.titleKey)}
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-300">{t(step.textKey)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Specifications */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">{t('feat_spec_title')}</h2>
                        <p className="text-slate-300 leading-relaxed mb-6">{t('feat_spec_description')}</p>
                        <div className="grid gap-3">
                            {specCards.map((card) => (
                                <div key={card.titleKey} className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                                    <h3 className="text-sm font-semibold text-indigo-400">{t(card.titleKey)}</h3>
                                    <p className="mt-1 text-sm text-slate-300">{t(card.textKey)}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Plan Components */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">{t('feat_plan_title')}</h2>
                        <p className="text-slate-300 leading-relaxed mb-6">{t('feat_plan_description')}</p>
                        <div className="grid gap-3">
                            {planCards.map((card) => (
                                <div key={card.titleKey} className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                                    <h3 className="text-sm font-semibold text-indigo-400">{t(card.titleKey)}</h3>
                                    <p className="mt-1 text-sm text-slate-300">{t(card.textKey)}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* MCP Integration */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">{t('feat_mcp_title')}</h2>
                        <div className="space-y-4 text-slate-300 leading-relaxed">
                            <p>{t('feat_mcp_text')}</p>
                            <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-4 flex items-center justify-between">
                                <p className="text-sm text-indigo-200">{t('feat_mcp_hint')}</p>
                                <Link
                                    href={route('docs.mcp')}
                                    className="shrink-0 ml-4 inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 transition-colors"
                                >
                                    {t('feat_mcp_link_text')}
                                    <ArrowRight className="h-3 w-3" />
                                </Link>
                            </div>
                        </div>
                    </section>

                    {/* spec-kit Alignment */}
                    <section>
                        <h2 className="text-2xl font-bold text-white mb-4">{t('feat_speckit_title')}</h2>
                        <p className="text-slate-300 leading-relaxed mb-6">{t('feat_speckit_description')}</p>
                        <div className="grid gap-3">
                            {specKitItems.map((item) => (
                                <div key={item.titleKey} className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 flex items-start gap-3">
                                    <span className="text-indigo-400 mt-0.5">•</span>
                                    <div>
                                        <h3 className="text-sm font-semibold text-white">{t(item.titleKey)}</h3>
                                        <p className="mt-1 text-sm text-slate-300">{t(item.textKey)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* CTA */}
                    <section className="text-center py-8">
                        {auth.user ? (
                            <Link
                                href={route('features.index')}
                                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                            >
                                {t('feat_cta_get_started')}
                                <ExternalLink className="h-4 w-4" />
                            </Link>
                        ) : (
                            <Link
                                href={route('register')}
                                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                            >
                                {t('feat_cta_register')}
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
                            <Link href={route('docs.features')} className="text-white font-medium">{t('docs_nav_features')}</Link>
                            <Link href={route('docs.mcp')} className="hover:text-white transition-colors">{t('docs_nav_mcp')}</Link>
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
