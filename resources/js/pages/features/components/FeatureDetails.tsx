import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FeatureDetailsProps {
    jiraKey: string;
    projectName?: string;
    requesterName?: string;
    description?: string;
    type?: string;
}

export default function FeatureDetails({ jiraKey, projectName, requesterName, type }: FeatureDetailsProps) {
    const typeLabels: Record<string, string> = { business: 'Business', enabler: 'Enabler', tech_debt: 'Tech Debt', nfr: 'NFR' };
    const typeColors: Record<string, string> = { business: 'bg-blue-100 text-blue-800', enabler: 'bg-purple-100 text-purple-800', tech_debt: 'bg-orange-100 text-orange-800', nfr: 'bg-teal-100 text-teal-800' };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Feature Details</CardTitle>
            </CardHeader>
            <CardContent>
                <dl className="divide-y divide-border">
                    <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[180px_1fr] sm:gap-2">
                        <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Feature-Key</dt>
                        <dd className="text-sm font-semibold text-foreground">{jiraKey || '-'}</dd>
                    </div>
                    <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[180px_1fr] sm:gap-2">
                        <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Projekt</dt>
                        <dd className="text-sm text-foreground">{projectName ?? '-'}</dd>
                    </div>
                    <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[180px_1fr] sm:gap-2">
                        <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Anforderer</dt>
                        <dd className="text-sm text-foreground">{requesterName ?? '-'}</dd>
                    </div>
                    {type && (
                        <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[180px_1fr] sm:gap-2">
                            <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Typ</dt>
                            <dd>
                                <Badge className={typeColors[type] ?? ''}>
                                    {typeLabels[type] ?? type}
                                </Badge>
                            </dd>
                        </div>
                    )}
                </dl>
            </CardContent>
        </Card>
    );
}
