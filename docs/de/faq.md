# FAQ & Troubleshooting

Allgemein
- Problem: „Avatar‑Upload schlägt fehl / JPEG nicht unterstützt“
  - Lösung: Server‑Erweiterung Imagick oder GD mit JPEG aktivieren, alternativ PNG/WebP hochladen (Settings › Profil zeigt Hinweis)

- Problem: Keine Mails für Verifikation
  - Lösung: Standardmailer ist `log`. Für echte Mails SMTP in `.env` konfigurieren (`MAIL_MAILER=smtp`, Host/Port/User/Pass setzen)

- Problem: Keine Daten sichtbar
  - Lösung: Prüfen, ob der richtige Tenant aktiv ist (Seite „Tenants“) und ob Sie Mitglied des Tenants sind

Installationsfragen
- Fehler bei Migrationen
  - Prüfen, ob DB korrekt konfiguriert und zugreifbar ist (SQLite‑Datei angelegt?)

Voting/WSJF
- Werteingabe in Tabellenansicht
  - Werte sind je Kategorie pro Feature numerisch; in Kartenansicht entspricht die Position dem Wert

Leistung/Entwicklung
- Dev‑Modus: `APP_DEBUG=true`, Vite mit `npm run dev`
- Production‑Build: `npm run build` (je nach Deployment)


## Feature-Import aus Jira CSV

- Frage: Werden Jira-Formatierungen beim CSV-Import übernommen?
  - Antwort: Ja! Beim Import von Features aus Jira CSV-Exporten werden Jira Wiki-Formatierungen automatisch in HTML konvertiert. Unterstützte Formatierungen:
    - Überschriften: `h1.`, `h2.`, `h3.`, etc.
    - Fettdruck: `*text*` oder `**text**`
    - Kursiv: `_text_`
    - Unterstrichen: `+text+`
    - Durchgestrichen: `-text-`
    - Listen: `*` für ungeordnete und `#` für nummerierte Listen
    - Links: `[URL]` oder `[Text|URL]`
    - Code: `{{inline code}}` und `{code}...{code}` für Codeblöcke
    - Zitate: `bq. quote text`
    - Tabellen: Jira-Tabellensyntax mit `||` für Header und `|` für Zeilen
  - Die Formatierungen werden beim Import automatisch konvertiert und sind in der Feature-Beschreibung korrekt sichtbar.
