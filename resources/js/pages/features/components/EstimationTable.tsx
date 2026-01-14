import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PencilIcon, TrashIcon } from 'lucide-react';
import React from 'react';

interface Estimation {
    id: number;
    best_case: number;
    most_likely: number;
    worst_case: number;
    unit: string;
    notes?: string;
    weighted_estimate?: number;
    weighted_case?: number; // Für Abwärtskompatibilität
    creator: { id: number; name: string };
    created_at: string;
}

interface EstimationTableProps {
    estimations: Estimation[];
    onEdit?: (estimation: Estimation) => void;
    onDelete?: (estimationId: number) => void;
}

export default function EstimationTable({ estimations, onEdit, onDelete }: EstimationTableProps) {
    // Hilfsfunktion zum Umwandeln von Zeilenumbrüchen in React-Elemente
    const renderMultilineText = (text: string) => {
        if (!text) return null;
        return text.split('\n').map((line, index) => (
            <React.Fragment key={index}>
                {index > 0 && <br />}
                {line}
            </React.Fragment>
        ));
    };

    // Hilfsfunktion zum sicheren Konvertieren von Werten in Zahlen
    const safeNumberDisplay = (value: unknown, decimals: number = 0): string => {
        if (value === 0 || value === '0') return decimals > 0 ? '0.00' : '0';

        // Versuche den Wert zu parsen
        const parsedValue = typeof value === 'string' ? parseFloat(value) : typeof value === 'number' ? value : NaN;

        if (isNaN(parsedValue)) return '-';

        return decimals > 0 ? parsedValue.toFixed(decimals) : parsedValue.toString();
    };

    return (
        <div>
            <h4 className="text-md mb-3 font-medium">Erfasste Schätzungen ({estimations.length})</h4>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Best Case</TableHead>
                        <TableHead>Most Likely</TableHead>
                        <TableHead>Worst Case</TableHead>
                        <TableHead>Gewichtet</TableHead>
                        <TableHead>Einheit</TableHead>
                        <TableHead>Erstellt von</TableHead>
                        <TableHead>Datum</TableHead>
                        <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {estimations.map((estimation) => (
                        <React.Fragment key={estimation.id}>
                            <TableRow>
                                <TableCell>{safeNumberDisplay(estimation.best_case)}</TableCell>
                                <TableCell>{safeNumberDisplay(estimation.most_likely)}</TableCell>
                                <TableCell>{safeNumberDisplay(estimation.worst_case)}</TableCell>
                                <TableCell>
                                    {safeNumberDisplay(estimation.weighted_estimate, 2) !== '-'
                                        ? safeNumberDisplay(estimation.weighted_estimate, 2)
                                        : safeNumberDisplay(estimation.weighted_case, 2)}
                                </TableCell>
                                <TableCell>{estimation.unit}</TableCell>
                                <TableCell>{estimation.creator.name}</TableCell>
                                <TableCell>{new Date(estimation.created_at).toLocaleDateString()}</TableCell>
                                <TableCell className="space-x-2 text-right">
                                    {onEdit && (
                                        <Button variant="outline" size="icon" onClick={() => onEdit(estimation)} className="size-8">
                                            <span className="sr-only">Bearbeiten</span>
                                            <PencilIcon className="h-4 w-4" />
                                        </Button>
                                    )}
                                    {onDelete && (
                                        <Button variant="destructive" size="icon" onClick={() => onDelete(estimation.id)} className="size-8">
                                            <span className="sr-only">Löschen</span>
                                            <TrashIcon className="h-4 w-4" />
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                            {estimation.notes && (
                                <TableRow>
                                    <TableCell colSpan={8} className="bg-muted">
                                        <div className="p-2 text-sm text-foreground">
                                            <strong>Notiz:</strong> {renderMultilineText(estimation.notes)}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </React.Fragment>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
