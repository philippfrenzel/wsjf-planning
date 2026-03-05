import { Head, Link, usePage } from '@inertiajs/react';
import { BarChart3, Briefcase, Building2, CalendarCheck2, CheckCircle2, ClipboardCheck, Columns3, Gauge, GitBranch, Globe, Grid3X3, Lock, Map, Shield, Users, Zap } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { type SharedData } from '@/types';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;
    const { t, locale, setLocale } = useTranslation();

    const trustBadges = ['trust_safe', 'trust_scrum', 'trust_kanban', 'trust_pi'] as const;

    const features = [
        { icon: <Gauge className="h-8 w-8 text-indigo-500" />, title: t('feat_wsjf_title'), text: t('feat_wsjf_text') },
        { icon: <Users className="h-8 w-8 text-indigo-500" />, title: t('feat_voting_title'), text: t('feat_voting_text') },
        { icon: <CalendarCheck2 className="h-8 w-8 text-indigo-500" />, title: t('feat_pi_title'), text: t('feat_pi_text') },
        { icon: <Columns3 className="h-8 w-8 text-indigo-500" />, title: t('feat_board_title'), text: t('feat_board_text') },
        { icon: <Map className="h-8 w-8 text-indigo-500" />, title: t('feat_roadmap_title'), text: t('feat_roadmap_text') },
        { icon: <Briefcase className="h-8 w-8 text-indigo-500" />, title: t('feat_projects_title'), text: t('feat_projects_text') },
        { icon: <Zap className="h-8 w-8 text-indigo-500" />, title: t('feat_skills_title'), text: t('feat_skills_text') },
        { icon: <Grid3X3 className="h-8 w-8 text-indigo-500" />, title: t('feat_skillmatrix_title'), text: t('feat_skillmatrix_text') },
        { icon: <GitBranch className="h-8 w-8 text-indigo-500" />, title: t('feat_dependencies_title'), text: t('feat_dependencies_text') },
        { icon: <ClipboardCheck className="h-8 w-8 text-indigo-500" />, title: t('feat_dordod_title'), text: t('feat_dordod_text') },
        { icon: <Building2 className="h-8 w-8 text-indigo-500" />, title: t('feat_enterprise_title'), text: t('feat_enterprise_text') },
        { icon: <BarChart3 className="h-8 w-8 text-indigo-500" />, title: t('feat_reporting_title'), text: t('feat_reporting_text') },
    ];

    const steps = [
        { num: 1, title: t('step1_title'), text: t('step1_text') },
        { num: 2, title: t('step2_title'), text: t('step2_text') },
        { num: 3, title: t('step3_title'), text: t('step3_text') },
        { num: 4, title: t('step4_title'), text: t('step4_text') },
        { num: 5, title: t('step5_title'), text: t('step5_text') },
    ];

    const securityItems = [
        { icon: <Shield className="h-8 w-8 text-indigo-400" />, title: t('security_isolation_title'), text: t('security_isolation_text') },
        { icon: <Lock className="h-8 w-8 text-indigo-400" />, title: t('security_rbac_title'), text: t('security_rbac_text') },
        { icon: <Globe className="h-8 w-8 text-indigo-400" />, title: t('security_privacy_title'), text: t('security_privacy_text') },
    ];

    const year = new Date().getFullYear();
    const copyright = (t('footer_copyright') as string).replace('{year}', String(year));

    return (
        <>
            <Head title="WSJF Planning — PI Planning for SAFe Teams">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700,800&display=swap" rel="stylesheet" />
            </Head>

            {/* NAV */}
            <header className="sticky top-0 z-50 bg-[#0f172a] border-b border-slate-800">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-xl font-bold text-white">WSJF Planning</span>
                            <span className="hidden sm:inline text-xs text-slate-400 border border-slate-700 rounded-full px-2 py-0.5">
                                {t('nav_tagline')}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <select
                                value={locale}
                                onChange={(e) => setLocale(e.target.value as 'en' | 'de')}
                                className="bg-transparent text-slate-400 text-sm border-none outline-none cursor-pointer hover:text-white transition-colors"
                                aria-label="Language"
                            >
                                <option value="en">EN</option>
                                <option value="de">DE</option>
                            </select>
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                                >
                                    {t('hero_dashboard')}
                                </Link>
                            ) : (
                                <>
                                    <Link href={route('login')} className="text-sm text-slate-300 hover:text-white transition-colors">
                                        {t('login')}
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
                                    >
                                        {t('register')}
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* HERO */}
            <section className="bg-gradient-to-b from-[#0f172a] to-[#1e293b] py-24 lg:py-32">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
                    <span className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-300 mb-8">
                        <CheckCircle2 className="h-4 w-4" />
                        {t('hero_social_proof')}
                    </span>
                    <h1 className="text-5xl lg:text-6xl font-bold tracking-tight text-white max-w-4xl mx-auto leading-tight">
                        {t('hero_title')}
                    </h1>
                    <p className="mt-6 text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed">
                        {t('hero_subtitle')}
                    </p>
                    <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                        {auth.user ? (
                            <Link
                                href={route('dashboard')}
                                className="rounded-lg bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25"
                            >
                                {t('hero_dashboard')}
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={route('register')}
                                    className="rounded-lg bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25"
                                >
                                    {t('hero_cta')}
                                </Link>
                                <a
                                    href="#how-it-works"
                                    className="rounded-lg border border-white/20 px-8 py-3.5 text-base font-semibold text-white hover:bg-white/10 transition-colors"
                                >
                                    {t('hero_cta_secondary')}
                                </a>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* TRUST BAR */}
            <section className="bg-[#1e293b] border-t border-slate-700/50 py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-slate-400 text-sm mb-4">{t('trust_label')}</p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        {trustBadges.map((key) => (
                            <span
                                key={key}
                                className="rounded-full bg-slate-700 text-slate-200 px-4 py-1 text-sm font-medium"
                            >
                                {t(key)}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* PROBLEM / SOLUTION */}
            <section className="bg-white py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
                        <div className="rounded-2xl bg-rose-50 border border-rose-100 p-8">
                            <span className="text-xs font-semibold uppercase tracking-widest text-rose-500">{t('problem_eyebrow')}</span>
                            <h2 className="mt-3 text-2xl font-bold text-slate-900">{t('problem_title')}</h2>
                            <p className="mt-4 text-slate-600 leading-relaxed">{t('problem_text')}</p>
                        </div>
                        <div className="rounded-2xl bg-indigo-50 border border-indigo-100 p-8">
                            <span className="text-xs font-semibold uppercase tracking-widest text-indigo-600">{t('solution_eyebrow')}</span>
                            <h2 className="mt-3 text-2xl font-bold text-slate-900">{t('solution_title')}</h2>
                            <p className="mt-4 text-slate-600 leading-relaxed">{t('solution_text')}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CORE FEATURES */}
            <section className="bg-slate-50 py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <span className="text-xs font-semibold uppercase tracking-widest text-indigo-600">{t('features_eyebrow')}</span>
                        <h2 className="mt-3 text-3xl lg:text-4xl font-bold text-slate-900">{t('features_title')}</h2>
                        <p className="mt-4 text-lg text-slate-500 max-w-2xl mx-auto">{t('features_subtitle')}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((f, i) => (
                            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                                <div className="mb-4">{f.icon}</div>
                                <h3 className="text-lg font-semibold text-slate-900 mb-2">{f.title}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed">{f.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section id="how-it-works" className="bg-white py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <span className="text-xs font-semibold uppercase tracking-widest text-indigo-600">{t('steps_eyebrow')}</span>
                        <h2 className="mt-3 text-3xl lg:text-4xl font-bold text-slate-900">{t('steps_title')}</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
                        {steps.map((s) => (
                            <div key={s.num} className="flex flex-col items-start lg:items-center lg:text-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white text-lg font-bold mb-4 shrink-0">
                                    {s.num}
                                </div>
                                <h3 className="font-semibold text-slate-900 mb-1">{s.title}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">{s.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* PRICING TEASER */}
            <section className="bg-[#0f172a] py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
                    <span className="text-xs font-semibold uppercase tracking-widest text-indigo-400">{t('pricing_eyebrow')}</span>
                    <h2 className="mt-3 text-3xl lg:text-4xl font-bold text-white">{t('pricing_title')}</h2>
                    <p className="mt-4 text-lg text-slate-300 max-w-xl mx-auto">{t('pricing_text')}</p>
                    <Link
                        href={route('register')}
                        className="mt-8 inline-block rounded-lg bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/25"
                    >
                        {t('pricing_cta')}
                    </Link>
                    <p className="mt-4 text-sm text-slate-500">{t('pricing_note')}</p>
                </div>
            </section>

            {/* SECURITY */}
            <section className="bg-slate-50 py-20">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <span className="text-xs font-semibold uppercase tracking-widest text-indigo-600">{t('security_eyebrow')}</span>
                        <h2 className="mt-3 text-3xl lg:text-4xl font-bold text-slate-900">{t('security_title')}</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {securityItems.map((item, i) => (
                            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 text-center">
                                <div className="flex justify-center mb-4">{item.icon}</div>
                                <h3 className="font-semibold text-slate-900 mb-2">{item.title}</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">{item.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="bg-[#0f172a] border-t border-slate-800 py-10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <span className="text-lg font-bold text-white">WSJF Planning</span>
                            <p className="text-sm text-slate-400 mt-1">{t('footer_tagline')}</p>
                        </div>
                        <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-400">
                            <Link href={route('login')} className="hover:text-white transition-colors">{t('login')}</Link>
                            <Link href={route('register')} className="hover:text-white transition-colors">{t('register')}</Link>
                            <Link href={route('imprint')} className="hover:text-white transition-colors">{t('imprint_link')}</Link>
                        </nav>
                    </div>
                    <div className="mt-8 border-t border-slate-800 pt-6 text-center text-sm text-slate-500">
                        {copyright}
                    </div>
                </div>
            </footer>
        </>
    );
}
