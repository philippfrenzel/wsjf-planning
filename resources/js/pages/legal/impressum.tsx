import { Head, Link } from '@inertiajs/react';

export default function Impressum() {
    return (
        <>
            <Head title="Impressum" />
            <div className="min-h-screen bg-[#f5f5f4] text-[#1b1b18] dark:bg-[#1e1e1e] dark:text-[#EDEDEC]">
                <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-8 px-6 py-12">
                    <header className="space-y-2">
                        <h1 className="text-3xl font-semibold">Impressum</h1>
                        <p className="text-sm text-[#706f6c] dark:text-[#A1A09A]">
                            Angaben gemäß § 5 TMG sowie Art. 13 DSGVO.
                        </p>
                    </header>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold">Betreiber der Webseite</h2>
                        <div className="space-y-1 text-sm text-[#1b1b18] dark:text-[#EDEDEC]">
                            <p>Philipp Frenzel</p>
                            <p>9244 Niederuzwil</p>
                            <p>
                                E-Mail:{' '}
                                <a
                                    href="mailto:philipp@frenzel.net"
                                    className="font-medium text-primary underline-offset-4 hover:underline"
                                >
                                    philipp@frenzel.net
                                </a>
                            </p>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold">Haftung für Inhalte</h2>
                        <p className="text-sm leading-relaxed text-[#3f3e3a] dark:text-[#C7C6C0]">
                            Als Diensteanbieter bin ich gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den
                            allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG bin ich jedoch nicht verpflichtet,
                            übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu
                            forschen, die auf eine rechtswidrige Tätigkeit hinweisen. Verpflichtungen zur Entfernung oder
                            Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon
                            unberührt.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold">Haftung für Links</h2>
                        <p className="text-sm leading-relaxed text-[#3f3e3a] dark:text-[#C7C6C0]">
                            Mein Angebot enthält Links zu externen Webseiten Dritter, auf deren Inhalte ich keinen Einfluss
                            habe. Deshalb kann ich für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte
                            der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
                            Bei Bekanntwerden von Rechtsverletzungen werde ich derartige Links umgehend entfernen.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold">Urheberrecht</h2>
                        <p className="text-sm leading-relaxed text-[#3f3e3a] dark:text-[#C7C6C0]">
                            Die durch den Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem
                            deutschen Urheberrecht. Beiträge Dritter sind als solche gekennzeichnet. Die Vervielfältigung,
                            Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes
                            bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold">Datenschutz</h2>
                        <p className="text-sm leading-relaxed text-[#3f3e3a] dark:text-[#C7C6C0]">
                            Die Nutzung dieser Website ist in der Regel ohne Angabe personenbezogener Daten möglich.
                            Soweit auf meinen Seiten personenbezogene Daten (beispielsweise Name oder E-Mail-Adresse) erhoben
                            werden, erfolgt dies stets auf freiwilliger Basis. Die Daten werden ohne Ihre ausdrückliche
                            Zustimmung nicht an Dritte weitergegeben. Es gelten die Informationspflichten nach Art. 13 DSGVO.
                        </p>
                    </section>

                    <section className="space-y-3">
                        <h2 className="text-xl font-semibold">Kontakt zum Datenschutz</h2>
                        <p className="text-sm leading-relaxed text-[#3f3e3a] dark:text-[#C7C6C0]">
                            Bei Fragen zum Datenschutz oder zur Wahrnehmung Ihrer Rechte (Auskunft, Löschung, Widerruf) wenden
                            Sie sich bitte an die oben genannte Kontaktadresse.
                        </p>
                    </section>

                    <footer className="mt-auto flex flex-col gap-2 border-t border-[#d4d4d4] pt-6 text-sm text-[#706f6c] dark:border-[#2f2f2f] dark:text-[#A1A09A]">
                        <Link href={route('home')} className="text-primary font-medium underline-offset-4 hover:underline">
                            Zur Startseite
                        </Link>
                        <p>Stand: {new Date().toLocaleDateString('de-DE')}</p>
                    </footer>
                </div>
            </div>
        </>
    );
}
