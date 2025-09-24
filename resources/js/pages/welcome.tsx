import { useTranslation } from '@/hooks/use-translation';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { BarChart3, CalendarCheck2, Gauge, Users } from 'lucide-react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;
    const { t, locale, setLocale } = useTranslation();

    return (
        <>
            <Head title={t('hero_title')}>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet" />
            </Head>
            <div className="flex min-h-screen w-full flex-col items-center bg-[#bff04b] text-[#1b1b18] dark:bg-[#1e1e1e]">
                {/* Schwarze Navigationsleiste */}
                <header className="w-full bg-black text-white py-4">
                    <div className="max-w-[335px] mx-auto lg:max-w-4xl px-4">
                        <nav className="flex items-center justify-end gap-4 text-sm">
                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="inline-block rounded-sm border border-[#ffffff35] px-5 py-1.5 text-sm leading-normal text-white hover:border-[#ffffff4a] hover:bg-[#ffffff10]"
                                >
                                    {t('dashboard')}
                                </Link>
                            ) : (
                                <>
                                    <Link
                                        href={route('login')}
                                        className="inline-block rounded-sm border border-transparent px-5 py-1.5 text-sm leading-normal text-white hover:border-[#ffffff35] hover:bg-[#ffffff10]"
                                    >
                                        {t('login')}
                                    </Link>
                                    <Link
                                        href={route('register')}
                                        className="inline-block rounded-sm border border-[#ffffff35] px-5 py-1.5 text-sm leading-normal text-white hover:border-[#ffffff4a] hover:bg-[#ffffff10]"
                                    >
                                        {t('register')}
                                    </Link>
                                </>
                            )}
                            <select
                                value={locale}
                                onChange={(e) => setLocale(e.target.value as 'en' | 'de')}
                                className="ml-4 rounded-sm border border-[#ffffff35] px-2 py-1 text-sm bg-black text-white"
                            >
                                <option value="en">EN</option>
                                <option value="de">DE</option>
                            </select>
                        </nav>
                    </div>
                </header>

                {/* Hero-Section - volle Breite, direkt unter der Navigationsleiste */}
                <section
                    className="relative flex w-full flex-col items-center overflow-hidden bg-white py-16 text-center"
                    style={{
                        backgroundImage: "url('/gfx/wsjf_planning_teaser.png')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-orange-100/80 via-white/90 to-white/80 dark:from-[#23201b] dark:via-[#23201b]/90 dark:to-[#23201b]/80" />
                    <div className="relative z-10 flex w-full flex-col items-center">
                        <h1 className="mb-4 text-5xl font-bold" dangerouslySetInnerHTML={{ __html: t('hero_title') }} />
                        <p
                            className="mb-6 max-w-xl text-lg text-[#1b1b18] dark:text-[#EDEDEC]"
                            dangerouslySetInnerHTML={{ __html: t('hero_subtitle') }}
                        />
                        {auth.user ? (
                            <Link
                                href={route('dashboard')}
                                className="bg-primary hover:bg-primary/90 inline-flex items-center rounded-md px-6 py-2 text-sm font-medium text-white shadow"
                            >
                                {t('hero_dashboard')}
                            </Link>
                        ) : (
                            <Link
                                href={route('register')}
                                className="bg-primary hover:bg-primary/90 inline-flex items-center rounded-md px-6 py-2 text-sm font-medium text-white shadow"
                            >
                                {t('hero_cta')}
                            </Link>
                        )}
                    </div>
                </section>
                  
                {/* Container für den restlichen Inhalt mit begrenzter Breite */}
                <div className="w-full max-w-[335px] mx-auto lg:max-w-4xl px-4 py-8">
                   {/* Features-Liste */}
                <section className="w-full text-center text-[#1b1b18] dark:text-[#EDEDEC]">
                    <h2 className="mb-4 text-2xl font-semibold">{t('features_title')}</h2>
                    <ul className="mx-auto max-w-xl list-disc space-y-1 text-left text-sm text-[#706f6c] dark:text-[#A1A09A]">
                        {(t('features') as string[]).map((item) => (
                            <li key={item}>{item}</li>
                        ))}
                    </ul>
                </section>
                </div>

                {/* 4-Spalten Feature-Grid über die ganze Breite */}
                <section className="mt-16 w-full">
                    <div className="grid grid-cols-1 md:grid-cols-4 w-full">
                        <div className="flex flex-col items-center py-12 px-6 bg-[#a1d933] dark:bg-[#283618] text-center transition-all hover:shadow-lg hover:translate-y-[-4px]">
                            <Gauge className="mb-4 h-14 w-14 text-orange-500" />
                            <h3 className="text-xl font-semibold text-[#1b1b18] dark:text-[#EDEDEC] mb-2">{t('grid_wsjf_title')}</h3>
                            <p className="text-sm text-[#2b3313] dark:text-[#BFC8A1] max-w-xs mx-auto">{t('grid_wsjf_text')}</p>
                        </div>
                        <div className="flex flex-col items-center py-12 px-6 bg-[#b9e45a] dark:bg-[#3a4a1c] text-center transition-all hover:shadow-lg hover:translate-y-[-4px]">
                            <CalendarCheck2 className="mb-4 h-14 w-14 text-orange-500" />
                            <h3 className="text-xl font-semibold text-[#1b1b18] dark:text-[#EDEDEC] mb-2">{t('grid_sprint_title')}</h3>
                            <p className="text-sm text-[#2b3313] dark:text-[#BFC8A1] max-w-xs mx-auto">{t('grid_sprint_text')}</p>
                        </div>
                        <div className="flex flex-col items-center py-12 px-6 bg-[#d1ee85] dark:bg-[#4c5e26] text-center transition-all hover:shadow-lg hover:translate-y-[-4px]">
                            <Users className="mb-4 h-14 w-14 text-orange-500" />
                            <h3 className="text-xl font-semibold text-[#1b1b18] dark:text-[#EDEDEC] mb-2">{t('grid_collab_title')}</h3>
                            <p className="text-sm text-[#2b3313] dark:text-[#BFC8A1] max-w-xs mx-auto">{t('grid_collab_text')}</p>
                        </div>
                        <div className="flex flex-col items-center py-12 px-6 bg-[#e9f7b7] dark:bg-[#5e7230] text-center transition-all hover:shadow-lg hover:translate-y-[-4px]">
                            <BarChart3 className="mb-4 h-14 w-14 text-orange-500" />
                            <h3 className="text-xl font-semibold text-[#1b1b18] dark:text-[#EDEDEC] mb-2">{t('grid_reports_title')}</h3>
                            <p className="text-sm text-[#2b3313] dark:text-[#BFC8A1] max-w-xs mx-auto">{t('grid_reports_text')}</p>
                        </div>
                    </div>
                </section>
                
                <div className="w-full max-w-[335px] mx-auto lg:max-w-4xl px-4 py-8">

                {/* Detaillierte Funktionsbeschreibungen */}
                <section className="mt-16 w-full text-[#1b1b18] dark:text-[#EDEDEC]">
                    {/* WSJF Planning - Linke Spalte farbig */}
                    <div className="w-full flex flex-col md:flex-row">
                        <div className="w-full md:w-1/2 bg-[#a1d933] dark:bg-[#283618] p-8 flex flex-col justify-center items-center md:items-end">
                            <div className="max-w-md">
                                <Gauge className="mb-6 h-16 w-16 text-orange-500" />
                                <h2 className="text-3xl font-semibold mb-4">{t('section_wsjf_title')}</h2>
                                <p
                                    className="mb-4 text-base text-[#2b3313] dark:text-[#BFC8A1]"
                                    dangerouslySetInnerHTML={{ __html: t('section_wsjf_text') }}
                                />
                            </div>
                        </div>
                        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center items-center md:items-start">
                            <div className="max-w-md">
                                <h3 className="text-xl font-semibold mb-3">{t('Key Features')}</h3>
                                <ul className="list-disc space-y-2 pl-5 text-base text-[#706f6c] dark:text-[#A1A09A]">
                                    {(t('section_wsjf_points') as string[]).map((p) => (
                                        <li key={p}>{p}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Sprint Planning - Rechte Spalte farbig */}
                    <div className="w-full flex flex-col md:flex-row">
                        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center items-center md:items-end order-1 md:order-none">
                            <div className="max-w-md">
                                <h3 className="text-xl font-semibold mb-3">{t('Key Features')}</h3>
                                <ul className="list-disc space-y-2 pl-5 text-base text-[#706f6c] dark:text-[#A1A09A]">
                                    {(t('section_sprint_points') as string[]).map((p) => (
                                        <li key={p}>{p}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <div className="w-full md:w-1/2 bg-[#b9e45a] dark:bg-[#3a4a1c] p-8 flex flex-col justify-center items-center md:items-start order-none md:order-1">
                            <div className="max-w-md">
                                <CalendarCheck2 className="mb-6 h-16 w-16 text-orange-500" />
                                <h2 className="text-3xl font-semibold mb-4">{t('section_sprint_title')}</h2>
                                <p className="mb-4 text-base text-[#2b3313] dark:text-[#BFC8A1]">{t('section_sprint_text')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Collaboration - Linke Spalte farbig */}
                    <div className="w-full flex flex-col md:flex-row">
                        <div className="w-full md:w-1/2 bg-[#d1ee85] dark:bg-[#4c5e26] p-8 flex flex-col justify-center items-center md:items-end">
                            <div className="max-w-md">
                                <Users className="mb-6 h-16 w-16 text-orange-500" />
                                <h2 className="text-3xl font-semibold mb-4">{t('section_collab_title')}</h2>
                                <p className="mb-4 text-base text-[#2b3313] dark:text-[#BFC8A1]">{t('section_collab_text')}</p>
                            </div>
                        </div>
                        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center items-center md:items-start">
                            <div className="max-w-md">
                                <h3 className="text-xl font-semibold mb-3">{t('Key Features')}</h3>
                                <ul className="list-disc space-y-2 pl-5 text-base text-[#706f6c] dark:text-[#A1A09A]">
                                    {(t('section_collab_points') as string[]).map((p) => (
                                        <li key={p}>{p}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Reports - Rechte Spalte farbig */}
                    <div className="w-full flex flex-col md:flex-row">
                        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center items-center md:items-end order-1 md:order-none">
                            <div className="max-w-md">
                                <h3 className="text-xl font-semibold mb-3">{t('Key Features')}</h3>
                                <ul className="list-disc space-y-2 pl-5 text-base text-[#706f6c] dark:text-[#A1A09A]">
                                    {(t('section_report_points') as string[]).map((p) => (
                                        <li key={p}>{p}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        <div className="w-full md:w-1/2 bg-[#e9f7b7] dark:bg-[#5e7230] p-8 flex flex-col justify-center items-center md:items-start order-none md:order-1">
                            <div className="max-w-md">
                                <BarChart3 className="mb-6 h-16 w-16 text-orange-500" />
                                <h2 className="text-3xl font-semibold mb-4">{t('section_report_title')}</h2>
                                <p className="mb-4 text-base text-[#2b3313] dark:text-[#BFC8A1]">{t('section_report_text')}</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Getting Started */}
                <section className="mt-16 w-full text-center text-[#1b1b18] dark:text-[#EDEDEC]">
                    <h2 className="mb-4 text-2xl font-semibold">{t('getting_started_title')}</h2>
                    <p className="mx-auto mb-6 max-w-xl text-sm text-[#706f6c] dark:text-[#A1A09A]">{t('getting_started_subtitle')}</p>
                    <ol className="mx-auto max-w-xl list-decimal space-y-1 text-left text-sm text-[#706f6c] dark:text-[#A1A09A]">
                        {(t('getting_started_steps') as string[]).map((s) => (
                            <li key={s}>{s}</li>
                        ))}
                    </ol>
                    <Link
                        href={route('register')}
                        className="bg-primary hover:bg-primary/90 mt-6 inline-flex items-center rounded-md px-6 py-2 text-sm font-medium text-white shadow"
                    >
                        {t('getting_started_cta')}
                    </Link>
                </section>
                </div>
                
                {/* Footer-Bereich */}
                <div className="w-full bg-black text-white py-8 mt-auto">
                    <div className="max-w-[335px] mx-auto lg:max-w-4xl px-4 text-center text-xs space-y-2">
                        <Link
                            href={route('imprint')}
                            className="text-white underline-offset-4 hover:underline"
                        >
                            {t('imprint_link')}
                        </Link>
                        <p>© {new Date().getFullYear()} WSJF Planning Tool</p>
                    </div>
                </div>
            </div>
        </>
    );
}
