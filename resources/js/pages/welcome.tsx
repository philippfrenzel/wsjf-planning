import { useTranslation } from '@/hooks/use-translation';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { BarChart3, CalendarCheck2, Gauge, Users } from 'lucide-react';

export default function Welcome() {
    const { auth, locale } = usePage<SharedData>().props;
    const { t, setLocale } = useTranslation();

    return (
        <>
            <Head title={t('hero_title')}>
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>
            <div className="flex min-h-screen w-full flex-col items-center bg-[#fff4e6] text-[#1b1b18] lg:justify-start lg:p-8 dark:bg-[#2d1a06]">
                <header className="mb-6 w-full max-w-[335px] text-sm not-has-[nav]:hidden lg:max-w-4xl">
                    <nav className="flex items-center justify-end gap-4">
                        {auth.user ? (
                            <Link
                                href={route('dashboard')}
                                className="inline-block rounded-sm border border-[#19140035] px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                            >
                                {t('dashboard')}
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={route('login')}
                                    className="inline-block rounded-sm border border-transparent px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#19140035] dark:text-[#EDEDEC] dark:hover:border-[#3E3E3A]"
                                >
                                    {t('login')}
                                </Link>
                                <Link
                                    href={route('register')}
                                    className="inline-block rounded-sm border border-[#19140035] px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                                >
                                    {t('register')}
                                </Link>
                            </>
                        )}
                        <select
                            value={locale}
                            onChange={(e) => setLocale(e.target.value as 'en' | 'de')}
                            className="ml-4 rounded-sm border border-[#19140035] px-2 py-1 text-sm dark:border-[#3E3E3A] dark:bg-transparent"
                        >
                            <option value="en">EN</option>
                            <option value="de">DE</option>
                        </select>
                    </nav>
                </header>

                <section
                    className="relative mt-8 flex w-full flex-col items-center overflow-hidden bg-white py-12 text-center lg:mt-20 dark:bg-[#23201b]"
                    style={{
                        backgroundImage: "url('/gfx/wsjf_planning_teaser.png')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    <div className="pointer-events-none absolute inset-0 bg-white/80 dark:bg-[#23201b]/80" />
                    <div className="relative z-10 flex w-full flex-col items-center">
                        <h1 className="mb-4 text-4xl font-bold" dangerouslySetInnerHTML={{ __html: t('hero_title') }} />
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

                <section className="mt-12 w-full max-w-4xl text-center text-[#1b1b18] dark:text-[#EDEDEC]">
                    <h2 className="mb-4 text-2xl font-semibold">{t('features_title')}</h2>
                    <ul className="mx-auto max-w-xl list-disc space-y-1 text-left text-sm text-[#706f6c] dark:text-[#A1A09A]">
                        {(t('features') as string[]).map((item) => (
                            <li key={item}>{item}</li>
                        ))}
                    </ul>
                </section>

                <section className="mt-16 grid w-full max-w-4xl grid-cols-1 gap-12 text-center md:grid-cols-4">
                    <div className="flex flex-col items-center">
                        <Gauge className="mb-4 h-10 w-10 text-orange-500" />
                        <h3 className="text-lg font-semibold">{t('grid_wsjf_title')}</h3>
                        <p className="text-sm text-[#706f6c] dark:text-[#A1A09A]">{t('grid_wsjf_text')}</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <CalendarCheck2 className="mb-4 h-10 w-10 text-orange-500" />
                        <h3 className="text-lg font-semibold">{t('grid_sprint_title')}</h3>
                        <p className="text-sm text-[#706f6c] dark:text-[#A1A09A]">{t('grid_sprint_text')}</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <Users className="mb-4 h-10 w-10 text-orange-500" />
                        <h3 className="text-lg font-semibold">{t('grid_collab_title')}</h3>
                        <p className="text-sm text-[#706f6c] dark:text-[#A1A09A]">{t('grid_collab_text')}</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <BarChart3 className="mb-4 h-10 w-10 text-orange-500" />
                        <h3 className="text-lg font-semibold">{t('grid_reports_title')}</h3>
                        <p className="text-sm text-[#706f6c] dark:text-[#A1A09A]">{t('grid_reports_text')}</p>
                    </div>
                </section>

                <section className="mt-16 w-full max-w-4xl space-y-12 text-[#1b1b18] dark:text-[#EDEDEC]">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start">
                        <Gauge className="mx-auto h-12 w-12 text-orange-500 md:mx-0" />
                        <div>
                            <h2 className="text-2xl font-semibold">{t('section_wsjf_title')}</h2>
                            <p
                                className="mb-2 text-sm text-[#706f6c] dark:text-[#A1A09A]"
                                dangerouslySetInnerHTML={{ __html: t('section_wsjf_text') }}
                            />
                            <ul className="list-disc space-y-1 pl-5 text-sm text-[#706f6c] dark:text-[#A1A09A]">
                                {(t('section_wsjf_points') as string[]).map((p) => (
                                    <li key={p}>{p}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 md:flex-row md:items-start">
                        <CalendarCheck2 className="mx-auto h-12 w-12 text-orange-500 md:mx-0" />
                        <div>
                            <h2 className="text-2xl font-semibold">{t('section_sprint_title')}</h2>
                            <p className="mb-2 text-sm text-[#706f6c] dark:text-[#A1A09A]">{t('section_sprint_text')}</p>
                            <ul className="list-disc space-y-1 pl-5 text-sm text-[#706f6c] dark:text-[#A1A09A]">
                                {(t('section_sprint_points') as string[]).map((p) => (
                                    <li key={p}>{p}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 md:flex-row md:items-start">
                        <Users className="mx-auto h-12 w-12 text-orange-500 md:mx-0" />
                        <div>
                            <h2 className="text-2xl font-semibold">{t('section_collab_title')}</h2>
                            <p className="mb-2 text-sm text-[#706f6c] dark:text-[#A1A09A]">{t('section_collab_text')}</p>
                            <ul className="list-disc space-y-1 pl-5 text-sm text-[#706f6c] dark:text-[#A1A09A]">
                                {(t('section_collab_points') as string[]).map((p) => (
                                    <li key={p}>{p}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 md:flex-row md:items-start">
                        <BarChart3 className="mx-auto h-12 w-12 text-orange-500 md:mx-0" />
                        <div>
                            <h2 className="text-2xl font-semibold">{t('section_report_title')}</h2>
                            <p className="mb-2 text-sm text-[#706f6c] dark:text-[#A1A09A]">{t('section_report_text')}</p>
                            <ul className="list-disc space-y-1 pl-5 text-sm text-[#706f6c] dark:text-[#A1A09A]">
                                {(t('section_report_points') as string[]).map((p) => (
                                    <li key={p}>{p}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>

                <section className="mt-16 w-full max-w-4xl text-center text-[#1b1b18] dark:text-[#EDEDEC]">
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

                <div className="hidden h-14.5 lg:block"></div>
            </div>
        </>
    );
}
