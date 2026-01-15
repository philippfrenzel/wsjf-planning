import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { Link, useForm } from '@inertiajs/react';
import { Save, X } from 'lucide-react';
import React, { useState } from 'react';

interface PageProps {
    project: { id: number; name: string };
}

function detectDelimiter(sample: string): string {
    const slice = sample.split(/\r?\n/).slice(0, 5).join('\n');
    const comma = (slice.match(/,/g) || []).length;
    const semi = (slice.match(/;/g) || []).length;
    return semi > comma ? ';' : ',';
}

function parsePreview(text: string, delimiter: string, maxRows = 10): string[][] {
    const rows: string[][] = [];
    let current: string[] = [];
    let field = '';
    let inQuotes = false;
    let i = 0;
    while (i < text.length && rows.length < maxRows) {
        const ch = text[i];
        if (inQuotes) {
            if (ch === '"') {
                if (text[i + 1] === '"') {
                    field += '"';
                    i += 2;
                    continue;
                }
                inQuotes = false;
                i++;
                continue;
            }
            field += ch;
            i++;
            continue;
        } else {
            if (ch === '"') {
                inQuotes = true;
                i++;
                continue;
            }
            if (ch === delimiter) {
                current.push(field);
                field = '';
                i++;
                continue;
            }
            if (ch === '\n') {
                current.push(field);
                rows.push(current);
                current = [];
                field = '';
                i++;
                continue;
            }
            if (ch === '\r') {
                i++;
                continue;
            }
            field += ch;
            i++;
            continue;
        }
    }
    if (rows.length < maxRows) {
        current.push(field);
        if (current.length > 1 || current[0] !== '') rows.push(current);
    }
    return rows;
}

type MappingTarget = 'ignore' | 'jira_key' | 'name' | 'description';

export default function Import({ project }: PageProps) {
    const { data, setData, post, processing, progress } = useForm<{ file: File | null; has_header: boolean; mapping: MappingTarget[] }>({
        file: null,
        has_header: true,
        mapping: [],
    });
    const [message, setMessage] = useState<string | null>(null);
    const [preview, setPreview] = useState<string[][]>([]);
    const [delimiter, setDelimiter] = useState<string>(',');

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        post(route('projects.features.import.store', project.id), {
            onError: () => setMessage('Upload fehlgeschlagen. Bitte CSV prüfen.'),
            forceFormData: true,
        });
    };

    const onFileChange = (file: File | null) => {
        setData('file', file);
        setPreview([]);
        setData('mapping', []);
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const text = String(reader.result || '');
            const del = detectDelimiter(text);
            setDelimiter(del);
            const rows = parsePreview(text, del, 10);
            setPreview(rows);
            // Initiale Auto-Mapping-Vorschläge
            const colCount = rows.reduce((m, r) => Math.max(m, r.length), 0);
            const initial: MappingTarget[] = new Array(colCount).fill('ignore');
            if (colCount > 0) {
                if (true) {
                    // Versuche Header-basierte Zuordnung
                    const header = rows[0] || [];
                    const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
                    header.forEach((h, i) => {
                        const n = norm(h || '');
                        if (['jirakey', 'jira', 'key'].includes(n) && !initial.includes('jira_key')) initial[i] = 'jira_key';
                        else if (['name', 'titel', 'title'].includes(n) && !initial.includes('name')) initial[i] = 'name';
                        else if (['beschreibung', 'description', 'desc'].includes(n) && !initial.includes('description')) initial[i] = 'description';
                    });
                }
                // Falls noch nicht gesetzt, Standard 0,1,2
                if (!initial.includes('jira_key') && colCount >= 1) initial[0] = 'jira_key';
                if (!initial.includes('name') && colCount >= 2) initial[1] = 'name';
                if (!initial.includes('description') && colCount >= 3) initial[2] = 'description';
            }
            setData('mapping', initial);
        };
        reader.readAsText(file);
    };

    const breadcrumbs = [
        { title: 'Startseite', href: '/' },
        { title: 'Projekte', href: route('projects.index') },
        { title: project.name, href: route('projects.show', project.id) },
        { title: 'Feature-Import', href: '#' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="max-w-2xl p-6">
                <Card>
                    <CardHeader className="bg-muted">
                        <CardTitle>Features importieren</CardTitle>
                        <CardDescription>
                            Projekt: <span className="font-semibold">{project.name}</span>
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={onSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium">CSV-Datei</label>
                                <input type="file" accept=".csv,text/csv,text/plain" onChange={(e) => onFileChange(e.target.files?.[0] ?? null)} />
                                <p className="text-muted-foreground mt-1 text-xs">
                                    Erlaubte Spalten: jira-key, name, beschreibung (Delimiter , oder ;)
                                </p>
                            </div>

                            {preview.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-3">
                                        <label className="inline-flex items-center gap-2 text-sm">
                                            <input
                                                type="checkbox"
                                                checked={data.has_header}
                                                onChange={(e) => setData('has_header', e.target.checked)}
                                            />
                                            Erste Zeile ist Header
                                        </label>
                                        <span className="text-muted-foreground text-xs">
                                            Erkannter Trenner: {delimiter === ';' ? 'Semikolon (; )' : 'Komma (, )'}
                                        </span>
                                    </div>
                                    {/* Mapping-Zuordnung pro Spalte */}
                                    {data.mapping.length > 0 && (
                                        <div className="overflow-x-auto rounded border p-2">
                                            <div className="mb-2 text-sm font-medium">Spaltenzuordnung</div>
                                            <table className="min-w-full text-xs">
                                                <thead>
                                                    <tr>
                                                        {data.mapping.map((_, i) => (
                                                            <th key={`h-${i}`} className="border-t px-2 py-1 text-left">
                                                                Spalte {i + 1}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr>
                                                        {data.mapping.map((value, i) => (
                                                            <td key={`m-${i}`} className="border-t px-2 py-1">
                                                                <select
                                                                    className="rounded border px-1 py-0.5"
                                                                    value={value}
                                                                    onChange={(e) => {
                                                                        const next = [...data.mapping];
                                                                        next[i] = e.target.value as MappingTarget;
                                                                        setData('mapping', next);
                                                                    }}
                                                                >
                                                                    <option value="ignore">Nicht importieren</option>
                                                                    <option value="jira_key">Jira-Key</option>
                                                                    <option value="name">Name</option>
                                                                    <option value="description">Beschreibung</option>
                                                                </select>
                                                            </td>
                                                        ))}
                                                    </tr>
                                                    {/* Beispielwerte zeigen (erste 2 Zeilen) */}
                                                    {[0, 1].map((rowIdx) =>
                                                        preview[rowIdx] ? (
                                                            <tr
                                                                key={`ex-${rowIdx}`}
                                                                className={rowIdx === 0 && data.has_header ? 'bg-muted font-semibold' : ''}
                                                            >
                                                                {data.mapping.map((_, i) => (
                                                                    <td key={`ex-${rowIdx}-${i}`} className="border-t px-2 py-1 whitespace-pre-wrap">
                                                                        {preview[rowIdx][i] ?? ''}
                                                                    </td>
                                                                ))}
                                                            </tr>
                                                        ) : null,
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                    <div className="overflow-x-auto rounded border">
                                        <table className="min-w-full text-sm">
                                            <tbody>
                                                {preview.map((row, idx) => (
                                                    <tr key={idx} className={idx === 0 && data.has_header ? 'bg-muted font-semibold' : ''}>
                                                        {row.map((cell, i) => (
                                                            <td key={i} className="border-t px-2 py-1 whitespace-pre-wrap">
                                                                {cell}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {progress && <div className="text-muted-foreground text-sm">{progress.percentage}%</div>}

                            {message && <div className="text-sm text-red-600">{message}</div>}

                            <div className="flex items-center justify-end gap-2">
                                <Button type="button" variant="cancel" asChild>
                                    <Link href={route('projects.show', project.id)}>
                                        <X />
                                        Zurück zum Projekt
                                    </Link>
                                </Button>
                                <Button type="submit" variant="success" disabled={processing || !data.file}>
                                    <Save />
                                    Import starten
                                </Button>
                            </div>

                            <div className="text-muted-foreground mt-4 text-xs">
                                Upsert-Logik: Features werden anhand des Jira-Keys im Projekt angelegt oder aktualisiert.
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
