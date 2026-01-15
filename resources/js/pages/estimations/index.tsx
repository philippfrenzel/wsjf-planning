import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { router } from '@inertiajs/react';

interface Estimation {
    id: number;
    best_case: number;
    most_likely: number;
    worst_case: number;
    weighted_estimate: number;
    standard_deviation: number;
    unit: string;
    notes?: string;
    created_at: string;
    creator: {
        id: number;
        name: string;
    };
    component: {
        id: number;
        name: string;
        feature: {
            id: number;
            name: string;
            jira_key: string;
        };
    };
}

interface PageProps {
    estimations: {
        data: Estimation[];
        links: { url: string | null; label: string; active: boolean }[];
        current_page: number;
        last_page: number;
        total: number;
        from: number;
        to: number;
    };
}

export default function Index({ estimations }: PageProps) {
    const formatUnit = (unit: string): string => {
        switch (unit) {
            case 'hours':
                return 'Stunden';
            case 'days':
                return 'Tage';
            case 'story_points':
                return 'Story Points';
            default:
                return unit;
        }
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    return (
        <AppLayout>
            <div className="p-6">
                <Card>
                    <CardHeader className="bg-muted">
                        <CardTitle className="flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold">Schätzungen</h2>
                                <p className="text-muted-foreground text-sm">
                                    {estimations.total} {estimations.total === 1 ? 'Schätzung' : 'Schätzungen'} insgesamt
                                </p>
                            </div>
                            <Button onClick={() => router.visit(route('estimations.create'))} className="bg-primary hover:bg-primary/90">
                                Neue Schätzung
                            </Button>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {estimations.data.length > 0 ? (
                            <>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-[200px]">Komponente/Feature</TableHead>
                                                <TableHead className="text-right">Best Case</TableHead>
                                                <TableHead className="text-right">Most Likely</TableHead>
                                                <TableHead className="text-right">Worst Case</TableHead>
                                                <TableHead className="text-right">Gewichtet</TableHead>
                                                <TableHead>Einheit</TableHead>
                                                <TableHead>Erstellt von</TableHead>
                                                <TableHead>Datum</TableHead>
                                                <TableHead className="text-right">Aktionen</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {estimations.data.map((estimation) => (
                                                <TableRow key={estimation.id} className="hover:bg-muted/50">
                                                    <TableCell>
                                                        <div className="font-medium">
                                                            <a
                                                                href={route('estimation-components.show', estimation.component.id)}
                                                                className="text-blue-600 hover:underline"
                                                            >
                                                                {estimation.component.name}
                                                            </a>
                                                        </div>
                                                        <div className="text-muted-foreground text-sm">
                                                            {estimation.component.feature && (
                                                                <a
                                                                    href={route('features.show', estimation.component.feature.id)}
                                                                    className="flex items-center gap-1 hover:underline"
                                                                >
                                                                    <Badge variant="outline" className="rounded-sm">
                                                                        {estimation.component.feature.jira_key}
                                                                    </Badge>
                                                                    {estimation.component.feature.name}
                                                                </a>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right font-mono">{estimation.best_case.toFixed(1)}</TableCell>
                                                    <TableCell className="text-right font-mono">{estimation.most_likely.toFixed(1)}</TableCell>
                                                    <TableCell className="text-right font-mono">{estimation.worst_case.toFixed(1)}</TableCell>
                                                    <TableCell className="text-right font-mono font-medium">
                                                        {estimation.weighted_estimate?.toFixed(2) || '-'}
                                                    </TableCell>
                                                    <TableCell>{formatUnit(estimation.unit)}</TableCell>
                                                    <TableCell>{estimation.creator.name}</TableCell>
                                                    <TableCell className="whitespace-nowrap">{formatDate(estimation.created_at)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => router.visit(route('estimations.show', estimation.id))}
                                                            >
                                                                Details
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => router.visit(route('estimations.edit', estimation.id))}
                                                            >
                                                                Bearbeiten
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                <div className="border-t p-4">
                                    <Pagination>
                                        <PaginationContent>
                                            {estimations.links.map((link, i) => {
                                                // Ignoriere die erste und letzte Seite in den Links (prev/next)
                                                if (i === 0) {
                                                    return (
                                                        <PaginationItem key="prev">
                                                            <PaginationPrevious
                                                                href={link.url || '#'}
                                                                onClick={(e) => {
                                                                    if (link.url) {
                                                                        e.preventDefault();
                                                                        router.visit(link.url);
                                                                    }
                                                                }}
                                                                className={!link.url ? 'pointer-events-none opacity-50' : ''}
                                                            />
                                                        </PaginationItem>
                                                    );
                                                }

                                                if (i === estimations.links.length - 1) {
                                                    return (
                                                        <PaginationItem key="next">
                                                            <PaginationNext
                                                                href={link.url || '#'}
                                                                onClick={(e) => {
                                                                    if (link.url) {
                                                                        e.preventDefault();
                                                                        router.visit(link.url);
                                                                    }
                                                                }}
                                                                className={!link.url ? 'pointer-events-none opacity-50' : ''}
                                                            />
                                                        </PaginationItem>
                                                    );
                                                }

                                                // Rendere Ellipsis für die "..."
                                                if (link.label === '...') {
                                                    return <PaginationEllipsis key={`ellipsis-${i}`} />;
                                                }

                                                // Standard-Seitenzahlen
                                                return (
                                                    <PaginationItem key={i}>
                                                        <PaginationLink
                                                            href={link.url || '#'}
                                                            onClick={(e) => {
                                                                if (link.url) {
                                                                    e.preventDefault();
                                                                    router.visit(link.url);
                                                                }
                                                            }}
                                                            isActive={link.active}
                                                            className={!link.url ? 'pointer-events-none opacity-50' : ''}
                                                        >
                                                            {link.label}
                                                        </PaginationLink>
                                                    </PaginationItem>
                                                );
                                            })}
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
                                <div className="bg-muted mb-3 rounded-full p-4">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="text-muted-foreground h-8 w-8"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                        />
                                    </svg>
                                </div>
                                <h3 className="mb-1 text-lg font-medium">Keine Schätzungen vorhanden</h3>
                                <p className="text-muted-foreground mb-4">Erstellen Sie eine neue Schätzung, um loszulegen.</p>
                                <Button onClick={() => router.visit(route('estimations.create'))}>Erste Schätzung erstellen</Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
