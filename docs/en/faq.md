# FAQ & Troubleshooting

General
- Problem: "Avatar upload fails / JPEG not supported"
  - Solution: Enable the Imagick or GD server extension with JPEG support, or alternatively upload PNG/WebP (Settings › Profile shows a hint)

- Problem: No emails for verification
  - Solution: The default mailer is `log`. For real emails, configure SMTP in `.env` (`MAIL_MAILER=smtp`, set host/port/user/pass)

- Problem: No data visible
  - Solution: Check whether the correct tenant is active (page "Tenants") and whether you are a member of the tenant

Installation Questions
- Error during migrations
  - Check whether the DB is correctly configured and accessible (is the SQLite file created?)

Voting/WSJF
- Value entry in table view
  - Values are numeric per category per feature; in card view, the position corresponds to the value

Performance/Development
- Dev mode: `APP_DEBUG=true`, Vite with `npm run dev`
- Production build: `npm run build` (depending on deployment)


## Feature Import from Jira CSV

- Question: Are Jira formatting styles preserved during CSV import?
  - Answer: Yes! When importing features from Jira CSV exports, Jira Wiki formatting is automatically converted to HTML. Supported formatting:
    - Headings: `h1.`, `h2.`, `h3.`, etc.
    - Bold: `*text*` or `**text**`
    - Italic: `_text_`
    - Underline: `+text+`
    - Strikethrough: `-text-`
    - Lists: `*` for unordered and `#` for numbered lists
    - Links: `[URL]` or `[Text|URL]`
    - Code: `{{inline code}}` and `{code}...{code}` for code blocks
    - Quotes: `bq. quote text`
    - Tables: Jira table syntax with `||` for headers and `|` for rows
  - The formatting is automatically converted during import and is correctly displayed in the feature description.
