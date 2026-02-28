import { Progress } from '@/components/ui/progress';
import { router } from '@inertiajs/react';
import { RefreshCw } from 'lucide-react';
import { useEffect } from 'react';

interface Stakeholder {
    id: number;
    name: string;
    votes_count: number;
}

interface Props {
    stakeholders: Stakeholder[];
}

export function VoteProgressCard({ stakeholders }: Props) {
    const total = stakeholders.length;
    const voted = stakeholders.filter((s) => s.votes_count > 0).length;
    const pct = total > 0 ? Math.round((voted / total) * 100) : 0;

    // Auto-refresh every 30 seconds via Inertia partial reload.
    // Key 'stakeholders' must match the top-level prop name in PlanningController::show()
    // (confirmed: `return Inertia::render('plannings/show', ['planning' => ..., 'stakeholders' => ...])`)
    useEffect(() => {
        const id = setInterval(() => {
            router.reload({ only: ['stakeholders'] });
        }, 30_000);
        return () => clearInterval(id);
    }, []);

    const handleManualRefresh = () => {
        router.reload({ only: ['stakeholders'] });
    };

    return (
        <div className="rounded-lg border bg-card p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Abstimmungsfortschritt</span>
                <button
                    onClick={handleManualRefresh}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    title="Jetzt aktualisieren"
                >
                    <RefreshCw className="h-3 w-3" />
                    Aktualisieren
                </button>
            </div>
            <Progress value={pct} className="h-2" />
            <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground">{voted}</span> von{' '}
                <span className="font-semibold text-foreground">{total}</span> Stakeholdern haben abgestimmt
                {total > 0 && <span className="ml-1 text-xs">({pct}%)</span>}
            </p>
        </div>
    );
}
