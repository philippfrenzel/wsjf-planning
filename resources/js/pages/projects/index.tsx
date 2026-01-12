import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import AppLayout from '@/layouts/app-layout';
import { Inertia } from '@inertiajs/inertia';
import { Link, usePage } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, Eye, Pencil, Plus, Search, Trash2, Vote, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';

interface Project {
    id: number;
    project_number: string;
    name: string;
    project_leader?: { id: number; name: string };
    deputy_leader?: { id: number; name: string };
    created_by?: number;
    status?: string;
    status_details?: {
        value: string;
        name: string;
        color: string;
    };
}

interface IndexProps {
    projects: Project[] | Paginated<Project>;
    currentUserId: number;
}
type Paginated<T> = {
    data: T[];
    meta?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
};

export default function Index({ projects, currentUserId }: IndexProps) {
    // Breadcrumbs definieren
    const breadcrumbs = [
        { title: 'Startseite', href: '/' },
        { title: 'Projekte', href: '#' },
    ];

    // Filter-Zustand
    const [filters, setFilters] = useState({
        projectNumber: '',
        name: '',
        leader: '',
    });

    // Gefilterte Projekte
    const projectData = Array.isArray(projects) ? projects : projects.data;
    const pagination = Array.isArray(projects) ? undefined : projects.meta;
    const [filteredProjects, setFilteredProjects] = useState<Project[]>(projectData);

    // Paginierung (mit persistenter Seitengröße pro Nutzer/Ansicht)
    const [currentPage, setCurrentPage] = useState(1);
    const userId = (usePage().props as any)?.auth?.user?.id ?? 'guest';
    const [itemsPerPage, setItemsPerPage] = useLocalStorage<number>(`tablePrefs:${userId}:projects.index:itemsPerPage`, 10);
    const [paginatedProjects, setPaginatedProjects] = useState<Project[]>([]);
    const hasActiveFilters = Boolean(filters.projectNumber.trim() || filters.name.trim() || filters.leader.trim());
    const usesServerPagination = Boolean(!hasActiveFilters && pagination?.last_page && pagination.last_page > 1);

    // Filter anwenden
    useEffect(() => {
        const filtered = projectData.filter((project) => {
            // Filter für Projektnummer
            const matchesProjectNumber = project.project_number.toLowerCase().includes(filters.projectNumber.toLowerCase());

            // Filter für Namen
            const matchesName = project.name.toLowerCase().includes(filters.name.toLowerCase());

            // Filter für Projektleiter
            const matchesLeader = !filters.leader || project.project_leader?.name?.toLowerCase().includes(filters.leader.toLowerCase());

            return matchesProjectNumber && matchesName && matchesLeader;
        });

        setFilteredProjects(filtered);
        // Bei Filteränderung zur ersten Seite zurückkehren
        setCurrentPage(1);
    }, [projectData, filters]);

    // Paginierung anwenden
    useEffect(() => {
        if (usesServerPagination) {
            setPaginatedProjects(filteredProjects);
            return;
        }
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        setPaginatedProjects(filteredProjects.slice(startIndex, endIndex));
    }, [filteredProjects, currentPage, itemsPerPage, usesServerPagination]);

    const effectivePage = usesServerPagination ? (pagination?.current_page ?? 1) : currentPage;
    const perPage = usesServerPagination ? (pagination?.per_page ?? itemsPerPage) : itemsPerPage;
    const totalItems = usesServerPagination ? (pagination?.total ?? filteredProjects.length) : filteredProjects.length;
    const totalPages = usesServerPagination ? (pagination?.last_page ?? 1) : Math.ceil(filteredProjects.length / perPage);
    const startItem = totalItems === 0 ? 0 : (effectivePage - 1) * perPage + 1;
    const endItem = Math.min(startItem + perPage - 1, totalItems);

    // Filter zurücksetzen
    const resetFilters = () => {
        setFilters({
            projectNumber: '',
            name: '',
            leader: '',
        });
    };

    // Filter-Werte aktualisieren
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFilters((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const goToPage = (page: number) => {
        if (usesServerPagination && pagination?.current_page) {
            Inertia.get(route('projects.index'), { page }, { preserveScroll: true, preserveState: true });
            return;
        }
        setCurrentPage(page);
    };
    const goToPreviousPage = () => goToPage(Math.max(effectivePage - 1, 1));
    const goToNextPage = () => goToPage(Math.min(effectivePage + 1, totalPages));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="mb-6 flex items-center justify-between p-5">
                <h1 className="text-2xl font-bold">Projekte</h1>
                <Button asChild>
                    <Link href={route('projects.create')}>
                        <Plus className="mr-2 h-4 w-4" />
                        Neues Projekt erstellen
                    </Link>
                </Button>
            </div>

            {/* Filter-Box */}
            <div className="mx-4 mb-6 rounded-lg border bg-gray-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                    <Search className="h-4 w-4 text-gray-500" />
                    <h2 className="font-medium">Filter</h2>

                    {/* Dauerhaft sichtbarer Reset-Button */}
                    <Button variant="outline" size="sm" onClick={resetFilters} className="ml-auto">
                        <X className="mr-1 h-4 w-4" />
                        Filter zurücksetzen
                    </Button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                        <label htmlFor="projectNumber" className="mb-1 block text-sm font-medium text-gray-700">
                            Projektnummer
                        </label>
                        <Input
                            id="projectNumber"
                            name="projectNumber"
                            placeholder="Nach Projektnummer filtern..."
                            value={filters.projectNumber}
                            onChange={handleFilterChange}
                        />
                    </div>

                    <div>
                        <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
                            Projektname
                        </label>
                        <Input id="name" name="name" placeholder="Nach Projektname filtern..." value={filters.name} onChange={handleFilterChange} />
                    </div>

                    <div>
                        <label htmlFor="leader" className="mb-1 block text-sm font-medium text-gray-700">
                            Projektleiter
                        </label>
                        <Input
                            id="leader"
                            name="leader"
                            placeholder="Nach Projektleiter filtern..."
                            value={filters.leader}
                            onChange={handleFilterChange}
                        />
                    </div>
                </div>
            </div>

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Ergebnisanzeige mit Paginierung */}
                <div className="mb-2 flex items-center justify-between text-sm text-gray-500">
                    <div>{totalItems > 0 ? `Zeige ${startItem} bis ${endItem} von ${totalItems} Projekten` : 'Keine Projekte gefunden'}</div>

                    {/* Seitenauswahl */}
                    <div className="flex items-center gap-2">
                        <select
                            className="rounded border px-2 py-1"
                            value={perPage}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.target.value));
                                setCurrentPage(1); // Zurück zur ersten Seite
                            }}
                            disabled={usesServerPagination}
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
                            <TableHead>ID</TableHead>
                            <TableHead>Projektnummer</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Projektleiter</TableHead>
                            <TableHead>Stellvertretung</TableHead>
                            <TableHead className="text-right">Aktionen</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedProjects.map((project) => {
                            const canEdit =
                                project.created_by === currentUserId ||
                                project.project_leader?.id === currentUserId ||
                                project.deputy_leader?.id === currentUserId;

                            return (
                                <TableRow key={project.id}>
                                    <TableCell>{project.id}</TableCell>
                                    <TableCell>{project.project_number}</TableCell>
                                    <TableCell>{project.name}</TableCell>
                                    <TableCell>
                                        {project.status_details ? (
                                            <span className={`inline-block rounded-md px-2 py-1 text-xs ${project.status_details.color}`}>
                                                {project.status_details.name}
                                            </span>
                                        ) : (
                                            <span className="inline-block rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-800">In Planung</span>
                                        )}
                                    </TableCell>
                                    <TableCell>{project.project_leader ? project.project_leader.name : '-'}</TableCell>
                                    <TableCell>{project.deputy_leader ? project.deputy_leader.name : '-'}</TableCell>
                                    <TableCell className="flex justify-end gap-2">
                                        <Button asChild size="icon" variant="outline">
                                            <Link href={route('projects.show', project.id)}>
                                                <Eye className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        <Button asChild size="icon" variant="outline">
                                            <Link href={route('plannings.index', { project_id: project.id })}>
                                                <Vote className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                        {canEdit && (
                                            <>
                                                <Button asChild size="icon" variant="outline">
                                                    <Link href={route('projects.edit', project.id)}>
                                                        <Pencil className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                <form
                                                    onSubmit={(e) => {
                                                        e.preventDefault();
                                                        Inertia.delete(route('projects.destroy', project.id));
                                                    }}
                                                >
                                                    <Button type="submit" size="icon" variant="destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </form>
                                            </>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}

                        {/* Anzeigen, wenn keine Ergebnisse gefunden wurden */}
                        {filteredProjects.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={7} className="py-8 text-center text-gray-500">
                                    Keine Projekte gefunden, die den Filterkriterien entsprechen.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>

                {/* Verbesserte Paginierungs-Navigation */}
                {filteredProjects.length > 0 && (
                    <div className="mt-4 flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                            Zeige {totalItems === 0 ? 0 : startItem} bis {totalItems === 0 ? 0 : endItem} von {totalItems} Einträgen
                        </div>

                        <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm" onClick={goToPreviousPage} disabled={effectivePage === 1}>
                                <ChevronLeft className="mr-1 h-4 w-4" />
                                Zurück
                            </Button>

                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                let pageNumber: number;

                                if (totalPages <= 5) {
                                    pageNumber = i + 1;
                                } else if (effectivePage <= 3) {
                                    pageNumber = i + 1;
                                } else if (effectivePage >= totalPages - 2) {
                                    pageNumber = totalPages - 4 + i;
                                } else {
                                    pageNumber = effectivePage - 2 + i;
                                }

                                return (
                                    <Button
                                        key={pageNumber}
                                        variant={effectivePage === pageNumber ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => goToPage(pageNumber)}
                                    >
                                        {pageNumber}
                                    </Button>
                                );
                            })}

                            <Button variant="outline" size="sm" onClick={goToNextPage} disabled={effectivePage === totalPages || totalPages === 0}>
                                Weiter
                                <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
