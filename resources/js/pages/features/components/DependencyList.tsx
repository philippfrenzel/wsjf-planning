import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from '@inertiajs/react';

interface DependencyItem {
    id: number;
    type: 'ermoeglicht' | 'verhindert' | 'bedingt' | 'ersetzt' | string;
    related?: { id: number; jira_key: string; name: string } | null;
    feature?: { id: number; jira_key: string; name: string } | null;
}

interface DependencyListProps {
    dependencies?: DependencyItem[];
    dependents?: DependencyItem[];
}

function translateDepType(t: string): string {
    switch (t) {
        case 'ermoeglicht':
            return 'ermöglicht';
        case 'verhindert':
            return 'verhindert';
        case 'bedingt':
            return 'bedingt';
        case 'ersetzt':
            return 'ersetzt';
        default:
            return t;
    }
}

function typeBadgeClass(t: string): string {
    switch (t) {
        case 'ermoeglicht':
            return 'bg-green-100 text-green-800';
        case 'verhindert':
            return 'bg-red-100 text-red-800';
        case 'bedingt':
            return 'bg-amber-100 text-amber-800';
        case 'ersetzt':
            return 'bg-purple-100 text-purple-800';
        default:
            return 'bg-muted text-foreground';
    }
}

export default function DependencyList({ dependencies, dependents }: DependencyListProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Abhängigkeiten</CardTitle>
            </CardHeader>
            <CardContent>
                {dependencies && dependencies.length > 0 ? (
                    <ul className="space-y-2">
                        {dependencies.map((dep) => (
                            <li key={dep.id} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Badge className={typeBadgeClass(dep.type)}>{translateDepType(dep.type)}</Badge>
                                    {dep.related ? (
                                        <Link href={route('features.show', { feature: dep.related.id })} className="text-blue-600 hover:underline">
                                            {dep.related.jira_key} – {dep.related.name}
                                        </Link>
                                    ) : (
                                        <span>-</span>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-muted-foreground">Keine Abhängigkeiten erfasst.</p>
                )}

                {dependents && dependents.length > 0 && (
                    <div className="mt-4">
                        <h4 className="mb-2 text-sm font-medium">Wird referenziert von</h4>
                        <ul className="space-y-2">
                            {dependents.map((dep) => (
                                <li key={`dep-${dep.id}`} className="flex items-center gap-2">
                                    <Badge variant="outline">{translateDepType(dep.type)}</Badge>
                                    {dep.feature ? (
                                        <Link href={route('features.show', { feature: dep.feature.id })} className="text-blue-600 hover:underline">
                                            {dep.feature.jira_key} – {dep.feature.name}
                                        </Link>
                                    ) : (
                                        <span>-</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
