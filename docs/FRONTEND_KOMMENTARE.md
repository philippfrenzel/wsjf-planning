# Frontend-Komponenten für Kommentare

## Überblick

Die Kommentar-Funktionalität wurde vollständig in das Frontend integriert. Die Komponenten sind in React/TypeScript geschrieben und nutzen die vorhandenen UI-Komponenten des Projekts (shadcn/ui, Tailwind CSS).

## Neue Dateien

### React-Komponenten

1. **`resources/js/components/comments/Comments.tsx`**
   - Haupt-Komponente für das Kommentar-System
   - Zeigt alle Kommentare an
   - Formular zum Erstellen neuer Kommentare
   - Lädt Kommentare automatisch beim Mounten

2. **`resources/js/components/comments/CommentItem.tsx`**
   - Zeigt einen einzelnen Kommentar an
   - Unterstützt verschachtelte Antworten (bis zu 3 Ebenen)
   - Bearbeiten- und Löschen-Funktionen für eigene Kommentare
   - Antwort-Funktion mit Inline-Formular
   - Avatar-Anzeige und Zeitstempel

3. **`resources/js/components/comments/index.ts`**
   - Export-Datei für einfache Imports

### TypeScript-Typen

4. **`resources/js/types/comment.d.ts`**
   - TypeScript-Typdefinitionen für Kommentare
   - `Comment`, `CommentUser`, `CommentableEntity` Interfaces

## Integration in Feature Edit

Die Kommentar-Komponente wurde wie gewünscht in die Feature-Bearbeitungsseite integriert, **unterhalb der Abhängigkeiten**.

### Geänderte Datei

**`resources/js/pages/features/edit.tsx`**

Die Komponente wurde in der rechten Spalte hinzugefügt, direkt nach der "Abhängigkeiten"-Card:

```tsx
import { Comments } from '@/components/comments';

// In der rechten Spalte, nach Dependencies
<Comments
    entity={{
        type: 'App\\Models\\Feature',
        id: feature.id,
    }}
/>
```

## UI-Features

### Kommentar-Box

- **Card-Layout** mit Titel und Icon
- **Zähler** zeigt Anzahl der Kommentare
- **Textarea** zum Schreiben neuer Kommentare
- **"Kommentar abschicken"** Button mit Send-Icon

### Einzelner Kommentar

- **Avatar** des Benutzers (mit Fallback auf Initialen)
- **Benutzername** und **Zeitstempel**
  - Relative Zeit: "gerade eben", "vor 2 Minuten", "vor 3 Stunden", etc.
  - Bei bearbeiteten Kommentaren: "(bearbeitet)" Marker
- **Kommentar-Text** mit Zeilenumbrüchen
- **Aktions-Buttons** (nur für eigene Kommentare):
  - Edit-Icon zum Bearbeiten
  - Trash-Icon zum Löschen (mit Bestätigung)
- **"Antworten"** Button zum Erstellen von Threads

### Antwort-Funktion

- Click auf "Antworten" öffnet ein Inline-Formular
- **Einrückung** für verschachtelte Antworten (max. 3 Ebenen)
- **Vertikale Linie** links zeigt Thread-Hierarchie
- "Abbrechen" Button zum Schließen ohne Speichern

### Bearbeiten-Modus

- Click auf Edit-Icon öffnet Textarea mit aktuellem Text
- "Speichern" und "Abbrechen" Buttons
- Ersetzt Kommentar-Anzeige inline

## Verwendung auf anderen Seiten

Die Komponente kann einfach auf anderen Seiten verwendet werden:

```tsx
import { Comments } from '@/components/comments';

// Für Planning
<Comments
    entity={{
        type: 'App\\Models\\Planning',
        id: planning.id,
    }}
/>

// Für Project
<Comments
    entity={{
        type: 'App\\Models\\Project',
        id: project.id,
    }}
/>
```

## Technische Details

### State Management

- **Local State** mit React Hooks (useState)
- Automatisches Neuladen nach Änderungen
- Optimistische Updates für bessere UX

### API-Integration

- Verwendet Axios für HTTP-Requests
- Automatische CSRF-Token-Handhabung
- Fehlerbehandlung mit Alert-Dialogen

### Styling

- **Tailwind CSS** für alle Styles
- **shadcn/ui** Komponenten:
  - Card, CardHeader, CardTitle, CardContent
  - Button (verschiedene Varianten)
  - Textarea
  - Avatar, AvatarImage, AvatarFallback
- **lucide-react** Icons:
  - MessageSquare (Kommentar-Icon)
  - Send (Senden-Icon)
  - MessageCircle (Antworten-Icon)
  - Edit2 (Bearbeiten-Icon)
  - Trash2 (Löschen-Icon)
  - X (Abbrechen-Icon)

### Responsive Design

- Mobile-freundlich durch Tailwind-Breakpoints
- Kommentare stapeln sich vertikal
- Einrückungen passen sich an Bildschirmgröße an

## Anpassungsmöglichkeiten

### UI-Texte ändern

Alle deutschen Texte sind direkt in den Komponenten:
- "Kommentare"
- "Schreiben Sie einen Kommentar..."
- "Kommentar abschicken"
- "Antworten"
- "Speichern"
- "Abbrechen"
- "gerade eben", "vor X Minuten", etc.

### Styling anpassen

Ändern Sie Tailwind-Klassen in den Komponenten:
- Farben: `text-gray-500`, `bg-gray-50`, etc.
- Abstände: `space-y-4`, `gap-2`, `p-4`, etc.
- Größen: `h-8`, `w-8`, `text-sm`, etc.

### Thread-Tiefe anpassen

In `CommentItem.tsx` ändern:
```tsx
const maxDepth = 3; // Ändern Sie diese Zahl
```

### Zeitformat anpassen

In `CommentItem.tsx` die `formatDate` Funktion ändern.

## Vorschau der UI-Struktur

```
┌─────────────────────────────────────────┐
│  💬 Kommentare (3)                      │
├─────────────────────────────────────────┤
│  [Textarea für neuen Kommentar]         │
│                    [Kommentar abschicken]│
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │ [Avatar] Max Mustermann · vor 2h │   │
│  │ ✎ 🗑                             │   │
│  │ Das ist ein Kommentar...         │   │
│  │ [↩ Antworten]                    │   │
│  └─────────────────────────────────┘   │
│    ┌──────────────────────────────┐    │
│    │ [Avatar] Anna · vor 1h       │    │
│    │ Das ist eine Antwort...      │    │
│    │ [↩ Antworten]                │    │
│    └──────────────────────────────┘    │
│  ┌─────────────────────────────────┐   │
│  │ [Avatar] Peter · vor 30 Min     │   │
│  │ Ein weiterer Kommentar...       │   │
│  │ [↩ Antworten]                   │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

## Nächste Schritte

Die Kommentar-Komponente ist vollständig funktionsfähig und einsatzbereit:

1. ✅ Backend-API implementiert
2. ✅ Frontend-Komponenten erstellt
3. ✅ In Feature Edit-Seite integriert
4. ✅ Dokumentation erstellt

Sie können die Komponente jetzt auf weiteren Seiten verwenden (z.B. Planning Edit, Project Show, etc.).

## Support

Bei Fragen oder Anpassungswünschen:
- Siehe `docs/COMMENTS.md` für vollständige API-Dokumentation
- Siehe `docs/COMMENTS_EXAMPLE.md` für Backend-Beispiele
- Frontend-Code in `resources/js/components/comments/`
