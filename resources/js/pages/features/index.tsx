import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { Inertia } from '@inertiajs/inertia';
import { Link, usePage } from '@inertiajs/react';
import { ArrowDown, ArrowUp, Check, Eye, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';

interface Feature {
    id: number;
    jira_key: string;
    name: string;
    description: string;
    requester?: { id: number; name: string } | null;
    project?: { id: number; name: string; jira_base_uri?: string } | null;
    status?: {
        name: string;
        color: string;
    };
    // Neue Eigenschaften für Schätzungen
    estimation_components_count?: number;
    total_weighted_case?: number;
    estimation_units?: string[]; // <--- NEU
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
    features: Feature[] | Paginated<Feature>;
}

type SortField = 'jira_key' | 'name' | 'project' | 'requester';
type SortDirection = 'asc' | 'desc';

export default function Index({ features }: IndexProps) {
    // Breadcrumbs definieren
    const breadcrumbs = [
        { title: 'Startseite', href: '/' },
        { title: 'Features', href: '#' },
    ];

    // Initiale Filter (z. B. Drilldown vom Dashboard)
    const pageProps = usePage().props as any;
    const initialFiltersProp = (pageProps?.initialFilters ?? {}) as Partial<{
        jira_key: string;
        name: string;
        project: string;
        requester: string;
        status: string;
    }>;

    // Filter-Zustände (mit Initialwerten aus Props)
    const [filters, setFilters] = useState({
        jira_key: '',
        name: '',
        project: '',
        requester: '',
        status: initialFiltersProp.status ?? '',
    });

    // Zustände für Popover
    const [projectPopoverOpen, setProjectPopoverOpen] = useState(false);
    const [requesterPopoverOpen, setRequesterPopoverOpen] = useState(false);

    // Sortierungs-Zustände
    const [sortField, setSortField] = useState<SortField>('jira_key');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    // Pagination (mit persistenter Seitengröße pro Nutzer/Ansicht)
    const [currentPage, setCurrentPage] = useState(1);
    const userId = (usePage().props as any)?.auth?.user?.id ?? 'guest';
    const [itemsPerPage, setItemsPerPage] = useLocalStorage<number>(`tablePrefs:${userId}:features.index:itemsPerPage`, 10);

    // Extrahiere alle eindeutigen Projekte, Anforderer und Status für die Autovervollständigung
    const featureData = Array.isArray(features) ? features : features.data;
    const pagination = Array.isArray(features) ? undefined : features.meta;

    const uniqueProjects = useMemo(() => {
        const projectSet = new Set<string>();
        featureData.forEach((feature) => {
            if (feature.project?.name) {
                projectSet.add(feature.project.name);
            }
        });
        return Array.from(projectSet).sort();
    }, [featureData]);

    const uniqueRequesters = useMemo(() => {
        const requesterSet = new Set<string>();
        featureData.forEach((feature) => {
            if (feature.requester?.name) {
                requesterSet.add(feature.requester.name);
            }
        });
        return Array.from(requesterSet).sort();
    }, [featureData]);

    const uniqueStatuses = useMemo(() => {
        const statusSet = new Set<string>();
        featureData.forEach((feature) => {
            if (feature.status?.name) {
                statusSet.add(feature.status.name);
            }
        });
        return Array.from(statusSet).sort();
    }, [featureData]);

    // Handling für Filter-Änderungen
    const handleFilterChange = (field: keyof typeof filters, value: string) => {
        setFilters((prev) => ({ ...prev, [field]: value }));
        setCurrentPage(1); // Bei Filteränderung zurück zur ersten Seite
    };

    // Handling für Sortierungs-Änderungen
    const handleSortChange = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Filter zurücksetzen
    const resetFilters = () => {
        setFilters({
            jira_key: '',
            name: '',
            project: '',
            requester: '',
            status: '',
        });
    };

    // Gibt das richtige Sortierungssymbol zurück
    const getSortIcon = (field: SortField) => {
        if (sortField !== field) return null;
        return sortDirection === 'asc' ? <ArrowUp className="ml-1 h-4 w-4" /> : <ArrowDown className="ml-1 h-4 w-4" />;
    };

    // Hilfsfunktion zur Formatierung der Einheit(en)
    function formatUnits(units?: string[]): string {
        if (!units || units.length === 0) return '';
        if (units.length === 1) {
            switch (units[0]) {
                case 'hours':
                    return 'Stunden';
                case 'days':
                    return 'Tage';
                case 'story_points':
                    return 'Story Points';
                default:
                    return units[0];
            }
        }
        return 'Gemischt';
    }

    // Gefilterte und sortierte Features
    const filteredAndSortedFeatures = useMemo(() => {
        // Filtern
        const result = featureData.filter((feature) => {
            return (
                feature.jira_key.toLowerCase().includes(filters.jira_key.toLowerCase()) &&
                feature.name.toLowerCase().includes(filters.name.toLowerCase()) &&
                (filters.project === '' || feature.project?.name?.toLowerCase().includes(filters.project.toLowerCase())) &&
                (filters.requester === '' || feature.requester?.name?.toLowerCase().includes(filters.requester.toLowerCase())) &&
                (filters.status === '' || feature.status?.name === filters.status)
            );
        });

        // Sortieren
        return result.sort((a, b) => {
            let aValue, bValue;

            // Extrahiere die zu vergleichenden Werte basierend auf dem Sortierfeld
            switch (sortField) {
                case 'jira_key':
                    aValue = a.jira_key;
                    bValue = b.jira_key;
                    break;
                case 'name':
                    aValue = a.name;
                    bValue = b.name;
                    break;
                case 'project':
                    aValue = a.project?.name || '';
                    bValue = b.project?.name || '';
                    break;
                case 'requester':
                    aValue = a.requester?.name || '';
                    bValue = b.requester?.name || '';
                    break;
            }

            // Vergleiche die Werte in der richtigen Reihenfolge
            if (sortDirection === 'asc') {
                return aValue.localeCompare(bValue);
            } else {
                return bValue.localeCompare(aValue);
            }
        });
    }, [featureData, filters, sortField, sortDirection]);

    // Für Pagination: Berechne die anzuzeigenden Features
    const paginatedFeatures = useMemo(() => {
        if (pagination?.last_page && pagination.last_page > 1) {
            return filteredAndSortedFeatures; // Serverseitig paginiert
        }
        const start = (currentPage - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        return filteredAndSortedFeatures.slice(start, end);
    }, [filteredAndSortedFeatures, currentPage, itemsPerPage, pagination]);

    // Berechne die Gesamtzahl der Seiten
    const totalPages = pagination?.last_page ?? Math.ceil(filteredAndSortedFeatures.length / itemsPerPage);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            {/* Titel-Bereich bleibt unverändert */}
            <div className="mb-6 flex items-center justify-between p-5">
                <h1 className="text-2xl font-bold">Features</h1>
                <div className="flex gap-2">
                    <Button asChild variant="success">
                        <Link href={route('features.create')}>
                            <Plus className="mr-2 h-4 w-4" />
                            Neues Feature
                        </Link>
                    </Button>
                    <Button variant="secondary" asChild>
                        <Link href={route('features.lineage')}>Lineage</Link>
                    </Button>
                </div>
            </div>

            {/* Gesamtcontainer für Filter und Tabelle */}
            <div className="flex flex-col gap-4 p-5">
                {/* Filter-Bereich */}
                <Card className="border border-gray-200 bg-gray-50">
                    <CardContent>
                        {/* Neue Position für den Filter-Button in der oberen Zeile */}
                        <div className="mb-4 flex items-center gap-2">
                            <Search className="h-4 w-4 text-gray-500" />
                            <h2 className="font-medium">Filter</h2>

                            {/* Dauerhaft sichtbarer Reset-Button */}
                            <Button variant="outline" size="sm" onClick={resetFilters} className="ml-auto">
                                <X className="mr-1 h-4 w-4" />
                                Filter zurücksetzen
                            </Button>
                        </div>

                        {/* Filter zweizeilig: Erste Zeile */}
                        <div className="mb-2 grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                                <label className="mb-1 block text-sm font-medium">Jira Key</label>
                                <div className="relative">
                                    <Input
                                        placeholder="Jira Key filtern..."
                                        value={filters.jira_key}
                                        onChange={(e) => handleFilterChange('jira_key', e.target.value)}
                                    />
                                    {filters.jira_key && (
                                        <button
                                            className="absolute top-1/2 right-2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                            onClick={() => handleFilterChange('jira_key', '')}
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">Feature Name</label>
                                <div className="relative">
                                    <Input
                                        placeholder="Name filtern..."
                                        value={filters.name}
                                        onChange={(e) => handleFilterChange('name', e.target.value)}
                                    />
                                    {filters.name && (
                                        <button
                                            className="absolute top-1/2 right-2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                            onClick={() => handleFilterChange('name', '')}
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            {/* Status mit Dropdown */}
                            <div>
                                <label className="mb-1 block text-sm font-medium">Status</label>
                                <select
                                    className="w-full rounded border px-2 py-1"
                                    value={filters.status}
                                    onChange={(e) => handleFilterChange('status', e.target.value)}
                                >
                                    <option value="">Alle anzeigen</option>
                                    {uniqueStatuses.map((status) => (
                                        <option key={status} value={status}>
                                            {status}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        {/* Filter zweizeilig: Zweite Zeile */}
                        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                            {/* Projekt mit Type-Ahead */}
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
                            {/* Anforderer mit Type-Ahead */}
                            <div>
                                <label className="mb-1 block text-sm font-medium">Anforderer</label>
                                <div>
                                    <Popover open={requesterPopoverOpen} onOpenChange={setRequesterPopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={requesterPopoverOpen}
                                                className="w-full justify-between"
                                            >
                                                {filters.requester || 'Anforderer wählen...'}
                                                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-full p-0" align="start">
                                            <Command>
                                                <CommandInput placeholder="Anforderer suchen..." className="h-9" />
                                                <CommandEmpty>Kein Anforderer gefunden.</CommandEmpty>
                                                <CommandGroup className="max-h-64 overflow-y-auto">
                                                    <CommandItem
                                                        onSelect={() => {
                                                            handleFilterChange('requester', '');
                                                            setRequesterPopoverOpen(false);
                                                        }}
                                                        className="text-sm"
                                                    >
                                                        <Check
                                                            className={cn('mr-2 h-4 w-4', filters.requester === '' ? 'opacity-100' : 'opacity-0')}
                                                        />
                                                        Alle anzeigen
                                                    </CommandItem>
                                                    {uniqueRequesters.map((requester) => (
                                                        <CommandItem
                                                            key={requester}
                                                            value={requester}
                                                            onSelect={() => {
                                                                handleFilterChange('requester', requester);
                                                                setRequesterPopoverOpen(false);
                                                            }}
                                                            className="text-sm"
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    'mr-2 h-4 w-4',
                                                                    filters.requester === requester ? 'opacity-100' : 'opacity-0',
                                                                )}
                                                            />
                                                            {requester}
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    {filters.requester && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-muted-foreground mt-1 h-auto p-0 text-xs"
                                            onClick={() => handleFilterChange('requester', '')}
                                        >
                                            <X className="mr-1 h-3 w-3" />
                                            Filter zurücksetzen
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabellen-Bereich ohne eigene Flexbox-Container-Eigenschaften */}
                <div className="mt-4">
                    {/* Ergebnisanzeige mit Paginierung */}
                    <div className="mb-2 flex items-center justify-between text-sm text-gray-500">
                        <div className="text-sm text-gray-500">
                            Zeige {Math.min(filteredAndSortedFeatures.length, (currentPage - 1) * itemsPerPage + 1)} bis{' '}
                            {Math.min(filteredAndSortedFeatures.length, currentPage * itemsPerPage)} von {filteredAndSortedFeatures.length} Einträgen
                        </div>
                        {/* Seitenauswahl */}
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
                    </div>

                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSortChange('jira_key')}>
                                    <span className="flex items-center">
                                        Jira Key
                                        {getSortIcon('jira_key')}
                                    </span>
                                </TableHead>
                                <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSortChange('name')}>
                                    <span className="flex items-center">
                                        Name
                                        {getSortIcon('name')}
                                    </span>
                                </TableHead>
                                {/* Status-Spalte hinzufügen */}
                                <TableHead>Status</TableHead>
                                {/* Neue Spalten für Schätzungsinformationen */}
                                <TableHead>Komponenten</TableHead>
                                <TableHead>Gesamtschätzung</TableHead>
                                <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSortChange('project')}>
                                    <span className="flex items-center">
                                        Projekt
                                        {getSortIcon('project')}
                                    </span>
                                </TableHead>
                                <TableHead className="cursor-pointer hover:bg-gray-50" onClick={() => handleSortChange('requester')}>
                                    <span className="flex items-center">
                                        Anforderer
                                        {getSortIcon('requester')}
                                    </span>
                                </TableHead>
                                <TableHead className="text-right">Aktionen</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedFeatures.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="py-8 text-center">
                                        {/* Erhöhe colSpan auf 6, da wir eine Spalte hinzugefügt haben */}
                                        <div className="flex flex-col items-center justify-center">
                                            <Search className="mb-2 h-8 w-8 text-gray-300" />
                                            <p className="text-gray-500">Keine Features gefunden</p>
                                            {Object.values(filters).some((f) => f !== '') && (
                                                <Button variant="link" onClick={resetFilters} className="mt-2">
                                                    Filter zurücksetzen
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedFeatures.map((feature) => (
                                    <TableRow key={feature.id}>
                                        <TableCell className="font-medium">
                                            {feature.project?.jira_base_uri && feature.jira_key ? (
                                                <a
                                                    href={`${feature.project.jira_base_uri}${feature.jira_key}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                                >
                                                    {feature.jira_key}
                                                </a>
                                            ) : (
                                                feature.jira_key
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {feature.name.length > 50 ? (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span className="cursor-help">{feature.name.slice(0, 50)}&hellip;</span>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <span className="max-w-xs break-words whitespace-pre-line">{feature.name}</span>
                                                    </TooltipContent>
                                                </Tooltip>
                                            ) : (
                                                feature.name
                                            )}
                                        </TableCell>
                                        {/* Status-Badge */}
                                        <TableCell>
                                            {feature.status ? (
                                                <span className={`inline-block rounded-md px-2 py-1 text-xs ${feature.status.color}`}>
                                                    {feature.status.name}
                                                </span>
                                            ) : (
                                                <Badge variant="outline">Unbekannt</Badge>
                                            )}
                                        </TableCell>
                                        {/* Anzahl der Schätzungskomponenten */}
                                        <TableCell>
                                            <Badge variant="outline" className="bg-blue-50">
                                                {feature.estimation_components_count || 0}
                                            </Badge>
                                        </TableCell>
                                        {/* Summe aller gewichteten Schätzungen */}
                                        <TableCell>
                                            {feature.total_weighted_case !== null &&
                                            feature.total_weighted_case !== undefined &&
                                            feature.estimation_components_count
                                                ? `${feature.total_weighted_case.toFixed(2)} ${formatUnits(feature.estimation_units)}`
                                                : '-'}
                                        </TableCell>
                                        {/* Projekt - Diese Zelle fehlt */}
                                        <TableCell>{feature.project?.name || '-'}</TableCell>
                                        {/* Anforderer - Diese Zelle fehlt */}
                                        <TableCell>{feature.requester?.name || '-'}</TableCell>
                                        {/* Aktionen */}
                                        <TableCell className="flex justify-end gap-2">
                                            <Button asChild size="icon" variant="secondary">
                                                <Link href={route('features.show', { feature: feature.id })}>
                                                    <Eye className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <Button asChild size="icon" variant="cancel">
                                                <Link href={route('features.edit', { feature: feature.id })}>
                                                    <Pencil className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <form
                                                onSubmit={(e) => {
                                                    e.preventDefault();
                                                    if (confirm('Sind Sie sicher, dass Sie dieses Feature löschen möchten?')) {
                                                        Inertia.delete(route('features.destroy', { feature: feature.id }));
                                                    }
                                                }}
                                            >
                                                <Button type="submit" size="icon" variant="destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </form>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>

                    {/* Pagination UI */}
                    {filteredAndSortedFeatures.length > 0 && (
                        <div className="mt-4 flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                Zeige {Math.min(filteredAndSortedFeatures.length, (currentPage - 1) * itemsPerPage + 1)} bis{' '}
                                {Math.min(filteredAndSortedFeatures.length, currentPage * itemsPerPage)} von {filteredAndSortedFeatures.length}{' '}
                                Einträgen
                            </div>

                            <div className="flex items-center space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    Zurück
                                </Button>

                                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                    let pageNumber: number;

                                    if (totalPages <= 5) {
                                        // Wenn wir 5 oder weniger Seiten haben, zeige alle
                                        pageNumber = i + 1;
                                    } else if (currentPage <= 3) {
                                        // Wenn wir auf den ersten 3 Seiten sind
                                        pageNumber = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        // Wenn wir auf den letzten 3 Seiten sind
                                        pageNumber = totalPages - 4 + i;
                                    } else {
                                        // Sonst zeige die aktuelle Seite in der Mitte an
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

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                    disabled={currentPage === totalPages || totalPages === 0}
                                >
                                    Weiter
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
