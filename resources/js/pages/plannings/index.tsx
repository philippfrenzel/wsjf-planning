import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { Inertia } from '@inertiajs/inertia';
import { Link, usePage } from '@inertiajs/react';
import { Check, ChevronLeft, ChevronRight, Eye, LayoutGrid, LayoutList, Pencil, Plus, Search, Trash2, Vote, X } from 'lucide-react';
import { useMemo, useState } from 'react';

interface Planning {
    id: number;
    title: string;
    planned_at: string;
    executed_at: string;
    project?: { id: number; name: string };
    created_by: number; // ID des Erstellers
    owner_id?: number; // ID des Hauptverantwortlichen
    deputy_id?: number; // ID des Stellvertreters
    features_count?: number; // Number of features
    stakeholders_count?: number; // Number of users/stakeholders
}

type Paginated<T> = {
    data: T[];
    meta?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    links?: { url: string | null; label: string; active: boolean }[];
};

interface IndexProps {
    plannings: Planning[] | Paginated<Planning>;
    auth: {
        user: {
            id: number;
        };
    };
}

export default function Index({ plannings }: IndexProps) {
    // Breadcrumbs definieren
    const breadcrumbs = [
        { title: 'Startseite', href: '/' },
        { title: 'Plannings', href: null },
    ];

    // Aktuellen Benutzer aus dem Page-Props holen
    const { auth } = usePage().props as unknown as IndexProps;

    // Filter-Zustände
    const [filters, setFilters] = useState({
        title: '',
        project: '',
    });

    // Zustand für Projekt-Popover
    const [projectPopoverOpen, setProjectPopoverOpen] = useState(false);

    // Paginierung (mit persistenter Seitengröße pro Nutzer/Ansicht)
    const [currentPage, setCurrentPage] = useState(1);
    const userId = (usePage().props as any)?.auth?.user?.id ?? 'guest';
    const [itemsPerPage, setItemsPerPage] = useLocalStorage<number>(`tablePrefs:${userId}:plannings.index:itemsPerPage`, 10);

    // View mode state (table or card) with persistence
    const [viewMode, setViewMode] = useLocalStorage<'table' | 'card'>(`viewPrefs:${userId}:plannings.index:viewMode`, 'table');

    // Extrahiere alle eindeutigen Projekte für die Autovervollständigung
    const planningData = Array.isArray(plannings) ? plannings : plannings.data;
    const pagination = Array.isArray(plannings) ? undefined : plannings.meta;

    const uniqueProjects = useMemo(() => {
        const projectSet = new Set<string>();
        planningData.forEach((planning) => {
            if (planning.project?.name) {
                projectSet.add(planning.project.name);
            }
        });
        return Array.from(projectSet).sort();
    }, [planningData]);

    // Handling für Filter-Änderungen
    const handleFilterChange = (field: keyof typeof filters, value: string) => {
        setFilters((prev) => ({ ...prev, [field]: value }));
        setCurrentPage(1); // Bei Filteränderung zurück zur ersten Seite
    };

    // Filter zurücksetzen
    const resetFilters = () => {
        setFilters({
            title: '',
            project: '',
        });
    };

    // Hilfsfunktion zur Datumsformatierung für die Anzeige
    const formatDate = (dateString: string | null | undefined) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString();
    };

    // Hilfsfunktion zum Prüfen, ob der Benutzer Bearbeitungsrechte hat
    const canEditPlanning = (planning: Planning) => {
        return planning.created_by === auth.user.id || planning.owner_id === auth.user.id || planning.deputy_id === auth.user.id;
    };

    // Gefilterte Plannings
    const filteredPlannings = useMemo(() => {
        return planningData.filter((planning) => {
            return (
                planning.title.toLowerCase().includes(filters.title.toLowerCase()) &&
                (filters.project === '' || planning.project?.name === filters.project)
            );
        });
    }, [planningData, filters]);

    // Für Pagination: Berechne die anzuzeigenden Plannings
    const paginatedPlannings = useMemo(() => {
        if (pagination?.last_page && pagination.last_page > 1) {
            return filteredPlannings; // Serverseitig paginiert
        }
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        return filteredPlannings.slice(start, end);
    }, [filteredPlannings, currentPage, itemsPerPage, pagination]);

    // Berechne die Gesamtzahl der Seiten
    const totalPages = pagination?.last_page ?? Math.ceil(filteredPlannings.length / itemsPerPage);

    // Pagination-Handler wie im Projekt-Index
    const goToPreviousPage = () => {
        setCurrentPage((prev) => Math.max(prev - 1, 1));
    };
    const goToNextPage = () => {
        setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    };
    // Bereich für Anzeige
    const effectivePage = pagination?.current_page ?? currentPage;
    const perPage = pagination?.per_page ?? itemsPerPage;
    const totalItems = pagination?.total ?? filteredPlannings.length;
    const startItem = (effectivePage - 1) * perPage + 1;
    const endItem = Math.min(startItem + perPage - 1, totalItems);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="mb-6 flex items-center justify-between p-5">
                <h1 className="text-2xl font-bold">Plannings</h1>
                <div className="flex items-center gap-2">
                    <ToggleGroup type="single" value={viewMode} onValueChange={(value) => value && setViewMode(value as 'table' | 'card')}>
                        <ToggleGroupItem value="table" aria-label="Tabellenansicht">
                            <LayoutList className="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="card" aria-label="Kartenansicht">
                            <LayoutGrid className="h-4 w-4" />
                        </ToggleGroupItem>
                    </ToggleGroup>
                    <Button asChild>
                        <Link href={route('plannings.create')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Neues Planning erstellen
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Filter-Bereich */}
            <div className="flex flex-col p-5">
                <Card className="border bg-muted">
                    <CardContent>
                        <div className="mb-4 flex items-center gap-2">
                            <Search className="h-4 w-4 text-muted-foreground" />
                            <h2 className="font-medium">Filter</h2>

                            {/* Dauerhaft sichtbarer Reset-Button */}
                            <Button variant="outline" size="sm" onClick={resetFilters} className="ml-auto">
                                <X className="mr-1 h-4 w-4" />
                                Filter zurücksetzen
                            </Button>
                        </div>

                        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                            {/* Titel Filter */}
                            <div>
                                <label className="mb-1 block text-sm font-medium">Titel</label>
                                <div className="relative">
                                    <Input
                                        placeholder="Titel filtern..."
                                        value={filters.title}
                                        onChange={(e) => handleFilterChange('title', e.target.value)}
                                    />
                                    {filters.title && (
                                        <button
                                            className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            onClick={() => handleFilterChange('title', '')}
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            {/* Projekt Filter mit Type-Ahead */}
                            <div>
                                <label className="mb-1 block text-sm font-medium">Projekt</label>
                                <div>
                                    <Popover open={projectPopoverOpen} onOpenChange={setProjectPopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={projectPopoverOpen}
                                                className="w-full justify-between"
                                            >
                                                {filters.project || 'Projekt wählen...'}
                                                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-full p-0" align="start">
                                            <Command>
                                                <CommandInput placeholder="Projekt suchen..." className="h-9" />
                                                <CommandEmpty>Kein Projekt gefunden.</CommandEmpty>
                                                <CommandGroup className="max-h-64 overflow-y-auto">
                                                    <CommandItem
                                                        onSelect={() => {
                                                            handleFilterChange('project', '');
                                                            setProjectPopoverOpen(false);
                                                        }}
                                                        className="text-sm"
                                                    >
                                                        <Check className={cn('mr-2 h-4 w-4', filters.project === '' ? 'opacity-100' : 'opacity-0')} />
                                                        Alle anzeigen
                                                    </CommandItem>
                                                    {uniqueProjects.map((project) => (
                                                        <CommandItem
                                                            key={project}
                                                            value={project}
                                                            onSelect={() => {
                                                                handleFilterChange('project', project);
                                                                setProjectPopoverOpen(false);
                                                            }}
                                                            className="text-sm"
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    'mr-2 h-4 w-4',
                                                                    filters.project === project ? 'opacity-100' : 'opacity-0',
                                                                )}
                                                            />
                                                            {project}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    {filters.project && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-muted-foreground mt-1 h-auto p-0 text-xs"
                                            onClick={() => handleFilterChange('project', '')}
                                        >
                                            <X className="mr-1 h-3 w-3" />
                                            Filter zurücksetzen
                                        </Button>
                                    )}
                                </div>
                            </div>
                            {/* Leer für Ausrichtung */}
                            <div></div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabellen-Bereich */}
                <div className="mt-4">
                    {/* Ergebnisanzeige with Paginierung */}
                    <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
                        <div className="text-sm text-muted-foreground">
                            {filteredPlannings.length > 0
                                ? `Zeige ${startItem} bis ${endItem} von ${filteredPlannings.length} Plannings`
                                : 'Keine Plannings gefunden'}
                        </div>
                        {/* Seitenauswahl */}
                        {filteredPlannings.length > 0 && (
                            <div className="flex items-center gap-2">
                                <select
                                    className="rounded border px-2 py-1"
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value));
                                        setCurrentPage(1); // Zurück zur ersten Seite
                                    }}
                                >
                                    <option value={5}>5 pro Seite</option>
                                    <option value={10}>10 pro Seite</option>
                                    <option value={25}>25 pro Seite</option>
                                    <option value={50}>50 pro Seite</option>
                                </select>
                            </div>
                        )}
                    </div>

                    {viewMode === 'table' ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Titel</TableHead>
                                    <TableHead>Projekt</TableHead>
                                    <TableHead>Features</TableHead>
                                    <TableHead>Benutzer</TableHead>
                                    <TableHead>Geplant am</TableHead>
                                    <TableHead>Durchgeführt am</TableHead>
                                    <TableHead className="text-right">Aktionen</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedPlannings.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="py-8 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <Search className="mb-2 h-8 w-8 text-muted-foreground" />
                                                <p className="text-muted-foreground">Keine Plannings gefunden</p>
                                                {Object.values(filters).some((f) => f !== '') && (
                                                    <Button variant="link" onClick={resetFilters} className="mt-2">
                                                        Filter zurücksetzen
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedPlannings.map((planning) => (
                                        <TableRow key={planning.id}>
                                            <TableCell>{planning.id}</TableCell>
                                            <TableCell>{planning.title}</TableCell>
                                            <TableCell>{planning.project?.name ?? '-'}</TableCell>
                                            <TableCell>{planning.features_count ?? 0}</TableCell>
                                            <TableCell>{planning.stakeholders_count ?? 0}</TableCell>
                                            <TableCell>{formatDate(planning.planned_at)}</TableCell>
                                            <TableCell>{formatDate(planning.executed_at)}</TableCell>
                                            <TableCell className="flex justify-end gap-2">
                                                {/* Ansichts-Button für alle Benutzer */}
                                                <Button asChild size="icon" variant="outline">
                                                    <Link href={route('plannings.show', planning)}>
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </Button>

                                                {/* Voting-Button für alle Benutzer */}
                                                <Button asChild size="icon" variant="outline">
                                                    <Link href={route('votes.session', { planning: planning.id })}>
                                                        <Vote className="h-4 w-4" />
                                                    </Link>
                                                </Button>

                                                {/* Bearbeitungs-Button für Ersteller, Owner und Deputy */}
                                                {canEditPlanning(planning) && (
                                                    <Button asChild size="icon" variant="outline">
                                                        <Link href={route('plannings.edit', planning)}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                )}

                                                {/* Lösch-Button für Ersteller, Owner und Deputy */}
                                                {canEditPlanning(planning) && (
                                                    <form
                                                        onSubmit={(e) => {
                                                            e.preventDefault();
                                                            if (confirm('Sind Sie sicher, dass Sie dieses Planning löschen möchten?')) {
                                                                Inertia.delete(route('plannings.destroy', planning));
                                                            }
                                                        }}
                                                    >
                                                        <Button type="submit" size="icon" variant="destructive">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </form>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {paginatedPlannings.length === 0 ? (
                                <div className="col-span-full py-8 text-center">
                                    <div className="flex flex-col items-center justify-center">
                                        <Search className="mb-2 h-8 w-8 text-muted-foreground" />
                                        <p className="text-muted-foreground">Keine Plannings gefunden</p>
                                        {Object.values(filters).some((f) => f !== '') && (
                                            <Button variant="link" onClick={resetFilters} className="mt-2">
                                                Filter zurücksetzen
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                paginatedPlannings.map((planning) => (
                                    <Card key={planning.id} className="flex flex-col">
                                        <CardHeader>
                                            <CardTitle className="text-lg">{planning.title}</CardTitle>
                                        </CardHeader>
                                        <CardContent className="flex flex-1 flex-col gap-3">
                                            <div className="space-y-2 text-sm">
                                                <div>
                                                    <span className="font-medium">Projekt:</span>{' '}
                                                    <span className="text-muted-foreground">{planning.project?.name ?? '-'}</span>
                                                </div>
                                                <div>
                                                    <span className="font-medium">Features:</span>{' '}
                                                    <span className="text-muted-foreground">{planning.features_count ?? 0}</span>
                                                </div>
                                                <div>
                                                    <span className="font-medium">Benutzer:</span>{' '}
                                                    <span className="text-muted-foreground">{planning.stakeholders_count ?? 0}</span>
                                                </div>
                                                <div>
                                                    <span className="font-medium">Geplant am:</span>{' '}
                                                    <span className="text-muted-foreground">{formatDate(planning.planned_at)}</span>
                                                </div>
                                                <div>
                                                    <span className="font-medium">Durchgeführt am:</span>{' '}
                                                    <span className="text-muted-foreground">{formatDate(planning.executed_at)}</span>
                                                </div>
                                            </div>
                                            <div className="mt-auto flex gap-2 pt-4">
                                                <Button asChild size="sm" variant="outline" className="flex-1">
                                                    <Link href={route('plannings.show', planning)}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        Ansehen
                                                    </Link>
                                                </Button>
                                                <Button asChild size="sm" variant="outline" className="flex-1">
                                                    <Link href={route('votes.session', { planning: planning.id })}>
                                                        <Vote className="mr-2 h-4 w-4" />
                                                        Voting
                                                    </Link>
                                                </Button>
                                                {canEditPlanning(planning) && (
                                                    <Button asChild size="sm" variant="outline">
                                                        <Link href={route('plannings.edit', planning)}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                )}
                                                {canEditPlanning(planning) && (
                                                    <form
                                                        onSubmit={(e) => {
                                                            e.preventDefault();
                                                            if (confirm('Sind Sie sicher, dass Sie dieses Planning löschen möchten?')) {
                                                                Inertia.delete(route('plannings.destroy', planning));
                                                            }
                                                        }}
                                                    >
                                                        <Button type="submit" size="sm" variant="destructive">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </form>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    )}

                    {/* Verbesserte Paginierungs-Navigation */}
                    {filteredPlannings.length > 0 && (
                        <div className="mt-4 flex items-center justify-between">
                            <div className="text-sm text-muted-foreground">
                                Zeige {Math.min(filteredPlannings.length, (currentPage - 1) * itemsPerPage + 1)} bis{' '}
                                {Math.min(filteredPlannings.length, currentPage * itemsPerPage)} von {filteredPlannings.length} Einträgen
                            </div>

                            <div className="flex items-center space-x-2">
                                <Button variant="outline" size="sm" onClick={goToPreviousPage} disabled={currentPage === 1}>
                                    <ChevronLeft className="mr-1 h-4 w-4" />
                                    Zurück
                                </Button>
                                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                    let pageNumber: number;
                                    if (totalPages <= 5) {
                                        pageNumber = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNumber = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNumber = totalPages - 4 + i;
                                    } else {
                                        pageNumber = currentPage - 2 + i;
                                    }
                                    return (
                                        <Button
                                            key={pageNumber}
                                            variant={currentPage === pageNumber ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setCurrentPage(pageNumber)}
                                        >
                                            {pageNumber}
                                        </Button>
                                    );
                                })}
                                <Button variant="outline" size="sm" onClick={goToNextPage} disabled={currentPage === totalPages || totalPages === 0}>
                                    Weiter
                                    <ChevronRight className="ml-1 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
