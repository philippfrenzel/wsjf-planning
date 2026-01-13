import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';

interface VoteItem {
    id: number;
    value: number;
    type: 'BusinessValue' | 'TimeCriticality' | 'RiskOpportunity' | string;
    voted_at?: string;
    user?: { id: number; name: string };
    feature?: { id: number; jira_key: string; name: string };
    planning?: { id: number; title: string };
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

interface PageProps {
    votes: VoteItem[] | Paginated<VoteItem>;
}

const typeColor: Record<string, string> = {
    BusinessValue: 'bg-emerald-100 text-emerald-800',
    TimeCriticality: 'bg-amber-100 text-amber-800',
    RiskOpportunity: 'bg-sky-100 text-sky-800',
};

export default function Index({ votes }: PageProps) {
    const voteData = Array.isArray(votes) ? votes : votes.data;
    const pagination = Array.isArray(votes) ? undefined : votes.meta;

    return (
        <AppLayout breadcrumbs={[{ title: 'Votes', href: '/votes' }]}>
            <div className="p-6">
                <Card>
                    <CardHeader className="bg-muted">
                        <CardTitle>Alle Votes im Tenant ({pagination?.total ?? voteData.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {voteData.length === 0 ? (
                            <div className="text-muted-foreground py-12 text-center">Keine Votes gefunden.</div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Planning</TableHead>
                                        <TableHead>Feature</TableHead>
                                        <TableHead>Typ</TableHead>
                                        <TableHead>Wert</TableHead>
                                        <TableHead>Benutzer</TableHead>
                                        <TableHead>Datum</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {voteData.map((v) => (
                                        <TableRow key={v.id}>
                                            <TableCell className="font-medium">{v.planning?.title ?? '-'}</TableCell>
                                            <TableCell>
                                                {v.feature ? (
                                                    <span className="text-foreground">
                                                        <Badge variant="outline" className="mr-2">
                                                            {v.feature.jira_key}
                                                        </Badge>
                                                        {v.feature.name}
                                                    </span>
                                                ) : (
                                                    '-'
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={typeColor[v.type] ?? 'bg-muted text-muted-foreground'}>{v.type}</Badge>
                                            </TableCell>
                                            <TableCell className="font-mono">{v.value}</TableCell>
                                            <TableCell>{v.user?.name ?? '-'}</TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                {v.voted_at ? new Date(v.voted_at).toLocaleString() : '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                        {pagination && pagination.last_page > 1 && (
                            <div className="text-muted-foreground mt-4 flex justify-end gap-4 text-sm">
                                <span>
                                    Seite {pagination.current_page} / {pagination.last_page}
                                </span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
