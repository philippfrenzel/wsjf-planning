// StakeholderTable.jsx
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useState } from 'react';

// Interface für die Props
interface Stakeholder {
    id: number;
    name: string;
    votes_count: number;
}

interface StakeholderTableProps {
    stakeholders: Stakeholder[];
}

const StakeholderTable = ({ stakeholders }: StakeholderTableProps) => {
    const [open, setOpen] = useState(false);
    // Prüfen, ob Stakeholder-Daten vorhanden sind
    if (!stakeholders || stakeholders.length === 0) {
        return <div className="py-2">Keine Stakeholder vorhanden.</div>;
    }

    return (
        <Card className="mt-6 w-full">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Stakeholder Voting Übersicht</CardTitle>
                <button type="button" className="text-sm text-blue-600 hover:underline focus:outline-none" onClick={() => setOpen((prev) => !prev)}>
                    {open ? 'Weniger anzeigen' : 'Mehr anzeigen'}
                </button>
            </CardHeader>
            {open && (
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead className="text-right">Abgegebene Stimmen</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stakeholders.map((stakeholder) => (
                                <TableRow key={stakeholder.id}>
                                    <TableCell className="font-medium">{stakeholder.name}</TableCell>
                                    <TableCell className="text-right">
                                        <Badge variant={stakeholder.votes_count > 0 ? 'default' : 'outline'}>{stakeholder.votes_count}</Badge>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            )}
        </Card>
    );
};

export default StakeholderTable;
