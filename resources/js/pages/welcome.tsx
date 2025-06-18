import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    Gauge,
    CalendarCheck2,
    Users,
    BarChart3,
} from 'lucide-react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;
    
    return (
        <>
            <Head title="Welcome">
                <link rel="preconnect" href="https://fonts.bunny.net" />
                <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
            </Head>
            <div className="flex min-h-screen flex-col items-center bg-[#fff4e6] text-[#1b1b18] w-full lg:justify-start lg:p-8 dark:bg-[#2d1a06]">
                <header className="mb-6 w-full max-w-[335px] text-sm not-has-[nav]:hidden lg:max-w-4xl">
                    <nav className="flex items-center justify-end gap-4">
                        {auth.user ? (
                            <Link
                                href={route('dashboard')}
                                className="inline-block rounded-sm border border-[#19140035] px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={route('login')}
                                    className="inline-block rounded-sm border border-transparent px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#19140035] dark:text-[#EDEDEC] dark:hover:border-[#3E3E3A]"
                                >
                                    Log in
                                </Link>
                                <Link
                                    href={route('register')}
                                    className="inline-block rounded-sm border border-[#19140035] px-5 py-1.5 text-sm leading-normal text-[#1b1b18] hover:border-[#1915014a] dark:border-[#3E3E3A] dark:text-[#EDEDEC] dark:hover:border-[#62605b]"
                                >
                                    Register
                                </Link>
                            </>
                        )}
                    </nav>
                </header>

                <section
                    className="w-full py-12 flex flex-col items-center text-center mt-8 lg:mt-20 bg-white dark:bg-[#23201b] relative overflow-hidden"
                    style={{
                        backgroundImage: "url('/gfx/wsjf_planning_teaser.png')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                    }}
                >
                    <div className="absolute inset-0 bg-white/80 dark:bg-[#23201b]/80 pointer-events-none" />
                    <div className="relative z-10 flex flex-col items-center w-full">
                        <h1 className="text-4xl font-bold mb-4">WSJF Planning</h1>
                        <p className="mb-6 text-lg max-w-xl text-[#1b1b18] dark:text-[#EDEDEC]">
                            Planen und priorisieren Sie Ihre Projekte nach dem <strong>SAFe</strong>-Prinzip und schaffen Sie maximale Transparenz.
                        </p>
                        {auth.user ? (
                            <Link
                                href={route('dashboard')}
                                className="inline-flex items-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-white shadow hover:bg-primary/90"
                            >
                                Zum Dashboard
                            </Link>
                        ) : (
                            <Link
                                href={route('register')}
                                className="inline-flex items-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-white shadow hover:bg-primary/90"
                            >
                                Jetzt starten
                            </Link>
                        )}
                    </div>
                </section>

                <section className="mt-12 w-full max-w-4xl text-center text-[#1b1b18] dark:text-[#EDEDEC]">
                    <h2 className="text-2xl font-semibold mb-4">Hauptfunktionen</h2>
                    <ul className="mx-auto list-disc space-y-1 text-sm text-[#706f6c] dark:text-[#A1A09A] text-left max-w-xl">
                        <li>Planning-Verwaltung mit Owner- und Deputy-Rollen</li>
                        <li>Feature-Management inklusive Projektzuordnung</li>
                        <li>Schätzungen mit Best Case, Most Likely und Worst Case</li>
                        <li>Stakeholder-Integration im gesamten Prozess</li>
                        <li>Umfangreiche Filter- und Suchfunktionen</li>
                    </ul>
                </section>

                <section className="mt-16 grid w-full max-w-4xl grid-cols-1 gap-12 text-center md:grid-cols-4">
                    <div className="flex flex-col items-center">
                        <Gauge className="mb-4 h-10 w-10 text-orange-500" />
                        <h3 className="text-lg font-semibold">WSJF Priorisierung</h3>
                        <p className="text-sm text-[#706f6c] dark:text-[#A1A09A]">
                            Bewerten Sie Features anhand von geschäftlichem Nutzen und Aufwand.
                        </p>
                    </div>
                    <div className="flex flex-col items-center">
                        <CalendarCheck2 className="mb-4 h-10 w-10 text-orange-500" />
                        <h3 className="text-lg font-semibold">Sprint Planung</h3>
                        <p className="text-sm text-[#706f6c] dark:text-[#A1A09A]">
                            Integrieren Sie Prioritäten direkt in Ihre Release- und Sprintplanung.
                        </p>
                    </div>
                    <div className="flex flex-col items-center">
                        <Users className="mb-4 h-10 w-10 text-orange-500" />
                        <h3 className="text-lg font-semibold">Transparente Zusammenarbeit</h3>
                        <p className="text-sm text-[#706f6c] dark:text-[#A1A09A]">
                            Binden Sie Stakeholder mühelos in Entscheidungsprozesse ein.
                        </p>
                    </div>
                    <div className="flex flex-col items-center">
                        <BarChart3 className="mb-4 h-10 w-10 text-orange-500" />
                        <h3 className="text-lg font-semibold">Auswertungen</h3>
                        <p className="text-sm text-[#706f6c] dark:text-[#A1A09A]">
                            Behalten Sie Kennzahlen und Fortschritt immer im Blick.
                        </p>
                    </div>
                </section>

                <section className="mt-16 w-full max-w-4xl space-y-12 text-[#1b1b18] dark:text-[#EDEDEC]">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start">
                        <Gauge className="mx-auto h-12 w-12 text-orange-500 md:mx-0" />
                        <div>
                            <h2 className="text-2xl font-semibold">WSJF-Priorisierung</h2>
                            <p className="mb-2 text-sm text-[#706f6c] dark:text-[#A1A09A]">
                                Priorisieren Sie Features anhand des <strong>Weighted Shortest Job First</strong> Prinzips.
                            </p>
                            <ul className="list-disc pl-5 text-sm text-[#706f6c] dark:text-[#A1A09A] space-y-1">
                                <li>Individual Vote</li>
                                <li>Common Vote</li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 md:flex-row md:items-start">
                        <CalendarCheck2 className="mx-auto h-12 w-12 text-orange-500 md:mx-0" />
                        <div>
                            <h2 className="text-2xl font-semibold">Sprint Planung</h2>
                            <p className="mb-2 text-sm text-[#706f6c] dark:text-[#A1A09A]">
                                Nutzen Sie die Priorisierung direkt zur Planung Ihrer nächsten Sprints.
                            </p>
                            <ul className="list-disc pl-5 text-sm text-[#706f6c] dark:text-[#A1A09A] space-y-1">
                                <li>Job-Size Estimation als Basis für Sprint Umfang</li>
                                <li>Zerlegung von Epics in kleinere Komponenten</li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 md:flex-row md:items-start">
                        <Users className="mx-auto h-12 w-12 text-orange-500 md:mx-0" />
                        <div>
                            <h2 className="text-2xl font-semibold">Transparente Zusammenarbeit</h2>
                            <p className="mb-2 text-sm text-[#706f6c] dark:text-[#A1A09A]">
                                Beziehen Sie alle Stakeholder in den Bewertungsprozess mit ein.
                            </p>
                            <ul className="list-disc pl-5 text-sm text-[#706f6c] dark:text-[#A1A09A] space-y-1">
                                <li>Schätzung und Priorisierung pro Stakeholder</li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4 md:flex-row md:items-start">
                        <BarChart3 className="mx-auto h-12 w-12 text-orange-500 md:mx-0" />
                        <div>
                            <h2 className="text-2xl font-semibold">Auswertung</h2>
                            <p className="mb-2 text-sm text-[#706f6c] dark:text-[#A1A09A]">
                                Verfolgen Sie den Erfolg Ihrer Planung mit klaren Kennzahlen.
                            </p>
                        <ul className="list-disc pl-5 text-sm text-[#706f6c] dark:text-[#A1A09A] space-y-1">
                            <li>KPIs zum Tracken aus Comitted zu Delivered</li>
                        </ul>
                    </div>
                </div>
            </section>

        <section className="mt-16 w-full max-w-4xl text-center text-[#1b1b18] dark:text-[#EDEDEC]">
            <h2 className="mb-4 text-2xl font-semibold">Getting started</h2>
            <p className="mx-auto mb-6 max-w-xl text-sm text-[#706f6c] dark:text-[#A1A09A]">
                In wenigen Schritten zu Ihrer ersten Planung:
            </p>
            <ol className="mx-auto list-decimal space-y-1 text-left text-sm text-[#706f6c] dark:text-[#A1A09A] max-w-xl">
                <li>Konto erstellen und anmelden</li>
                <li>Neue Planung anlegen und Teammitglieder einladen</li>
                <li>Features erfassen und Aufwand schätzen</li>
            </ol>
            <Link
                href={route('register')}
                className="mt-6 inline-flex items-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-white shadow hover:bg-primary/90"
            >
                Jetzt loslegen
            </Link>
        </section>

                <div className="hidden h-14.5 lg:block"></div>
            </div>
        </>
    );
}
