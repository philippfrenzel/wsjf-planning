import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import AppLayout from '@/layouts/app-layout';
import { Link, useForm } from '@inertiajs/react';
import { CheckCircle2, FileSpreadsheet, LoaderCircle, Save, X } from 'lucide-react';
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
    const [step, setStep] = useState(1);

    const steps = [
        { id: 1, title: 'Datei wählen', detail: 'CSV hochladen und Format prüfen' },
        { id: 2, title: 'Spalten zuordnen', detail: 'Felder mappen und Vorschau prüfen' },
        { id: 3, title: 'Import starten', detail: 'Zusammenfassung prüfen und ausführen' },
    ];

    const fileSelected = Boolean(data.file);
    const mappedTargets = new Set(data.mapping.filter((target) => target !== 'ignore'));
    const hasRequiredMapping = mappedTargets.has('jira_key') && mappedTargets.has('name');
    const previewDataRows = Math.max(preview.length - (data.has_header ? 1 : 0), 0);
    const progressValue = (step / steps.length) * 100;

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);
        post(route('projects.features.import.store', project.id), {
            onError: (errors) =>
                setMessage(
                    (errors.file as string) ||
                        (errors.mapping as string) ||
                        (errors.has_header as string) ||
                        'Upload fehlgeschlagen. Bitte CSV prüfen.',
                ),
            forceFormData: true,
        });
    };

    const onFileChange = (file: File | null) => {
        setData('file', file);
        setPreview([]);
        setData('mapping', []);
        if (!file) {
            setStep(1);
            return;
        }
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
            setStep(2);
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
            <div className="mx-auto w-full max-w-6xl p-6">
                <Card className="overflow-hidden border shadow-sm">
                    <CardHeader className="bg-muted/50 space-y-4 border-b">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <CardTitle className="text-2xl">Feature-Import Wizard</CardTitle>
                                <CardDescription className="mt-1">
                                    Projekt: <span className="text-foreground font-semibold">{project.name}</span>
                                </CardDescription>
                            </div>
                            <Badge variant="outline" className="text-xs">
                                Schritt {step} von {steps.length}
                            </Badge>
                        </div>
                        <Progress value={progressValue} className="h-2" />
                        <div className="grid gap-2 md:grid-cols-3">
                            {steps.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setStep(item.id)}
                                    className={`rounded-lg border p-3 text-left transition ${
                                        step === item.id
                                            ? 'border-primary bg-background ring-primary/20 ring-2'
                                            : 'border-border bg-background hover:border-primary/40'
                                    }`}
                                >
                                    <div className="text-muted-foreground mb-1 text-xs font-semibold tracking-wide uppercase">Schritt {item.id}</div>
                                    <div className="text-foreground text-sm font-semibold">{item.title}</div>
                                    <div className="text-muted-foreground mt-1 text-xs">{item.detail}</div>
                                </button>
                            ))}
                        </div>
                    </CardHeader>

                    <CardContent className="space-y-6 p-6">
                        <form onSubmit={onSubmit} className="space-y-6">
                            {step === 1 && (
                                <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
                                    <Card className="border-dashed">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-base">
                                                <FileSpreadsheet className="h-4 w-4" />
                                                CSV-Datei auswählen
                                            </CardTitle>
                                            <CardDescription>Unterstützt werden CSV-Dateien mit Trennzeichen Komma oder Semikolon.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <input
                                                className="file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 w-full rounded border p-2 text-sm file:mr-3 file:rounded file:border-0 file:px-3 file:py-1.5"
                                                type="file"
                                                accept=".csv,text/csv,text/plain"
                                                onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
                                            />
                                            <div className="text-muted-foreground text-xs">
                                                Erwartete Kernfelder: <span className="font-semibold">jira-key</span> und <span className="font-semibold">name</span>.
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-base">Workflow-Details</CardTitle>
                                        </CardHeader>
                                        <CardContent className="text-foreground space-y-2 text-sm">
                                            <p>1. CSV-Datei laden und Header prüfen.</p>
                                            <p>2. Spalten auf Jira-Key, Name und Beschreibung mappen.</p>
                                            <p>3. Import starten (bestehende Features werden via Jira-Key aktualisiert).</p>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-4">
                                    {!fileSelected || preview.length === 0 ? (
                                        <Alert>
                                            <AlertTitle>Keine Vorschau verfügbar</AlertTitle>
                                            <AlertDescription>Bitte im ersten Schritt eine CSV-Datei auswählen.</AlertDescription>
                                        </Alert>
                                    ) : (
                                        <>
                                            <div className="flex flex-wrap items-center gap-3">
                                                <label className="inline-flex items-center gap-2 text-sm">
                                                    <input type="checkbox" checked={data.has_header} onChange={(e) => setData('has_header', e.target.checked)} />
                                                    Erste Zeile ist Header
                                                </label>
                                                <Badge variant="secondary">Trenner: {delimiter === ';' ? 'Semikolon (;)' : 'Komma (,)'} </Badge>
                                                <Badge variant={hasRequiredMapping ? 'default' : 'destructive'}>
                                                    {hasRequiredMapping ? 'Pflichtfelder gemappt' : 'Pflichtfelder fehlen'}
                                                </Badge>
                                            </div>

                                            {data.mapping.length > 0 && (
                                                <Card>
                                                    <CardHeader>
                                                        <CardTitle className="text-base">Spaltenzuordnung</CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="overflow-x-auto">
                                                        <table className="min-w-full text-sm">
                                                            <thead>
                                                                <tr className="bg-muted/50">
                                                                    {data.mapping.map((_, i) => (
                                                                        <th key={`h-${i}`} className="border-b px-3 py-2 text-left font-semibold">
                                                                            Spalte {i + 1}
                                                                        </th>
                                                                    ))}
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                <tr>
                                                                    {data.mapping.map((value, i) => (
                                                                        <td key={`m-${i}`} className="border-b px-3 py-2">
                                                                            <select
                                                                                className="w-full rounded border px-2 py-1"
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
                                                                {[0, 1].map((rowIdx) =>
                                                                    preview[rowIdx] ? (
                                                                        <tr key={`ex-${rowIdx}`} className={rowIdx === 0 && data.has_header ? 'bg-muted/50 font-semibold' : ''}>
                                                                            {data.mapping.map((_, i) => (
                                                                                <td key={`ex-${rowIdx}-${i}`} className="border-b px-3 py-2 whitespace-pre-wrap">
                                                                                    {preview[rowIdx][i] ?? ''}
                                                                                </td>
                                                                            ))}
                                                                        </tr>
                                                                    ) : null,
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </CardContent>
                                                </Card>
                                            )}

                                            <Card>
                                                <CardHeader>
                                                    <CardTitle className="text-base">Datenvorschau</CardTitle>
                                                </CardHeader>
                                                <CardContent className="overflow-x-auto">
                                                    <table className="min-w-full text-sm">
                                                        <tbody>
                                                            {preview.map((row, idx) => (
                                                                <tr key={idx} className={idx === 0 && data.has_header ? 'bg-muted/50 font-semibold' : ''}>
                                                                    {row.map((cell, i) => (
                                                                        <td key={i} className="border-b px-3 py-2 whitespace-pre-wrap">
                                                                            {cell}
                                                                        </td>
                                                                    ))}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </CardContent>
                                            </Card>
                                        </>
                                    )}
                                </div>
                            )}

                            {step === 3 && (
                                <div className="grid gap-4 lg:grid-cols-2">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-base">Import-Zusammenfassung</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2 text-sm">
                                            <div className="flex items-center justify-between border-b pb-2">
                                                <span>Datei</span>
                                                <span className="font-medium">{data.file?.name ?? 'Keine Datei ausgewählt'}</span>
                                            </div>
                                            <div className="flex items-center justify-between border-b pb-2">
                                                <span>Zeilen (ohne Header)</span>
                                                <span className="font-medium">{previewDataRows}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span>Erkannter Trenner</span>
                                                <span className="font-medium">{delimiter === ';' ? 'Semikolon (;)' : 'Komma (,)'} </span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-base">Checkliste</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-2 text-sm">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className={`h-4 w-4 ${fileSelected ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                                                <span>CSV-Datei ausgewählt</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className={`h-4 w-4 ${preview.length > 0 ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                                                <span>Vorschau erfolgreich geladen</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <CheckCircle2 className={`h-4 w-4 ${hasRequiredMapping ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                                                <span>Pflichtfelder (Jira-Key, Name) zugeordnet</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {progress && <div className="text-muted-foreground text-sm">{progress.percentage}%</div>}
                            {message && <div className="text-sm text-red-600">{message}</div>}

                            <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4">
                                <div className="text-muted-foreground text-xs">
                                    Upsert-Logik: Features werden anhand des Jira-Keys im Projekt angelegt oder aktualisiert.
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button type="button" variant="cancel" asChild>
                                        <Link href={route('projects.show', project.id)}>
                                            <X />
                                            Zurück zum Projekt
                                        </Link>
                                    </Button>
                                    {step > 1 && (
                                        <Button type="button" variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))}>
                                            Zurück
                                        </Button>
                                    )}
                                    {step < 3 ? (
                                        <Button
                                            type="button"
                                            onClick={() => setStep((s) => Math.min(3, s + 1))}
                                            disabled={(step === 1 && !fileSelected) || (step === 2 && (!fileSelected || !hasRequiredMapping))}
                                        >
                                            Weiter
                                        </Button>
                                    ) : (
                                        <Button type="submit" variant="success" disabled={processing || !fileSelected || !hasRequiredMapping}>
                                            {processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Save />}
                                            Import starten
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
