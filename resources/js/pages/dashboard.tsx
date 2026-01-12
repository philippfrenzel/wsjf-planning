import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    Cell,
    LabelList,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip as ReTooltip,
    XAxis,
    YAxis,
} from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

type FeatureStatusDatum = { status: string; count: number };
type CommittedDatum = { planning_id: number; planning: string; committed: number };
type FeatureAgingDatum = { day: string; open_count: number };

const STATUS_LABELS: Record<string, string> = {
    'in-planning': 'In Planung',
    approved: 'Genehmigt',
    implemented: 'Implementiert',
    rejected: 'Abgelehnt',
    obsolete: 'Obsolet',
    archived: 'Archiviert',
    deleted: 'Gelöscht',
};

const COLORS = ['#3b82f6', '#22c55e', '#a855f7', '#ef4444', '#6b7280', '#f59e0b', '#94a3b8'];

export default function Dashboard() {
    const {
        myProjectsCount,
        activePlanningsCount,
        visibleFeatureCount,
        validPlannings,
        featureStatus = [],
        committedByPlanning = [],
        featureAging = [],
    } = usePage().props as {
        myProjectsCount: number;
        activePlanningsCount: number;
        visibleFeatureCount: number;
        validPlannings: { id: number; title: string }[];
        featureStatus: FeatureStatusDatum[];
        committedByPlanning: CommittedDatum[];
        featureAging: FeatureAgingDatum[];
        wsjfCoverage: { planning: string; planning_id: number; rated: number; open: number; total: number }[];
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    {/* KPI: Meine Projekte */}
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative flex aspect-video flex-col items-center justify-center overflow-hidden rounded-xl border bg-white dark:bg-neutral-900">
                        <div className="text-4xl font-bold">{myProjectsCount}</div>
                        <div className="text-muted-foreground text-lg">Meine Projekte</div>
                    </div>
                    {/* KPI: Aktive Plannings */}
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative flex aspect-video flex-col items-center justify-center overflow-hidden rounded-xl border bg-white dark:bg-neutral-900">
                        <div className="text-4xl font-bold">{activePlanningsCount}</div>
                        <div className="text-muted-foreground text-lg">Aktive Plannings</div>
                    </div>
                    {/* KPI: Sichtbare Features */}
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative flex aspect-video flex-col items-center justify-center overflow-hidden rounded-xl border bg-white dark:bg-neutral-900">
                        <div className="text-4xl font-bold">{visibleFeatureCount}</div>
                        <div className="text-muted-foreground text-lg">Sichtbare Features</div>
                    </div>
                </div>
                {/* Charts */}
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    {/* Features nach Status */}
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative overflow-hidden rounded-xl border bg-white dark:bg-neutral-900">
                        <div className="border-b p-4 font-semibold dark:border-neutral-800">Features nach Status</div>
                        <div className="h-[260px] p-4">
                            {featureStatus.length === 0 ? (
                                <div className="text-muted-foreground text-sm">Keine Daten</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={featureStatus}
                                            dataKey="count"
                                            nameKey="status"
                                            innerRadius={60}
                                            outerRadius={90}
                                            paddingAngle={2}
                                            label={(entry: any) => {
                                                const total = featureStatus.reduce((acc, x) => acc + (x.count ?? 0), 0);
                                                const pct = total ? Math.round(((entry?.count ?? 0) / total) * 100) : 0;
                                                return pct >= 5 ? `${pct}%` : '';
                                            }}
                                            labelLine={false}
                                        >
                                            {featureStatus.map((d, i) => (
                                                <Cell
                                                    key={i}
                                                    fill={COLORS[i % COLORS.length]}
                                                    onClick={() => {
                                                        const url = route('features.index') + `?status=${encodeURIComponent(d.status)}`;
                                                        window.location.href = url;
                                                    }}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                            ))}
                                        </Pie>
                                        <Legend formatter={(value) => STATUS_LABELS[value as string] ?? (value as string)} />
                                        <ReTooltip
                                            formatter={(value: any, _name, p: any) => {
                                                const total = featureStatus.reduce((acc, x) => acc + (x.count ?? 0), 0);
                                                const pct = total ? Math.round((Number(value) / total) * 100) : 0;
                                                const label = STATUS_LABELS[p?.payload?.status] ?? p?.payload?.status;
                                                return [`${value} (${pct}%)`, label];
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Commitments je Planning */}
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative overflow-hidden rounded-xl border bg-white dark:bg-neutral-900">
                        <div className="border-b p-4 font-semibold dark:border-neutral-800">Commitments je Planning</div>
                        <div className="h-[260px] p-4">
                            {committedByPlanning.length === 0 ? (
                                <div className="text-muted-foreground text-sm">Keine Daten</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={committedByPlanning}>
                                        <XAxis dataKey="planning" hide />
                                        <YAxis allowDecimals={false} />
                                        <ReTooltip />
                                        <Bar dataKey="committed" fill="#22c55e">
                                            {committedByPlanning.map((d, i) => (
                                                <Cell
                                                    key={i}
                                                    onClick={() => {
                                                        const url = route('commitments.index') + `?planning_id=${d.planning_id}`;
                                                        window.location.href = url;
                                                    }}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>

                    {/* Feature Aging: laufender Open-Count */}
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative overflow-hidden rounded-xl border bg-white dark:bg-neutral-900">
                        <div className="border-b p-4 font-semibold dark:border-neutral-800">Feature Aging (offene Features)</div>
                        <div className="h-[260px] p-4">
                            {featureAging.length === 0 ? (
                                <div className="text-muted-foreground text-sm">Keine Daten</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={featureAging}>
                                        <XAxis dataKey="day" hide />
                                        <YAxis allowDecimals={false} />
                                        <ReTooltip />
                                        <Area dataKey="open_count" stroke="#0ea5e9" fill="#bae6fd" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>

                {/* WSJF-Abdeckung pro Planning (Stacked Bar) */}
                <div className="grid auto-rows-min gap-4 md:grid-cols-1">
                    <div className="border-sidebar-border/70 dark:border-sidebar-border relative overflow-hidden rounded-xl border bg-white dark:bg-neutral-900">
                        <div className="border-b p-4 font-semibold dark:border-neutral-800">WSJF‑Abdeckung pro Planning</div>
                        <div className="h-[280px] p-4">
                            {((usePage().props as any).wsjfCoverage ?? []).length === 0 ? (
                                <div className="text-muted-foreground text-sm">Keine Daten</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={
                                            (usePage().props as any).wsjfCoverage as {
                                                planning: string;
                                                planning_id: number;
                                                rated: number;
                                                open: number;
                                                total: number;
                                            }[]
                                        }
                                    >
                                        <XAxis dataKey="planning" hide />
                                        <YAxis allowDecimals={false} />
                                        <ReTooltip
                                            formatter={(value: any, name: any, props: any) => {
                                                const p = props?.payload;
                                                if (!p) return [value, name];
                                                const total = Number(p.total || 0);
                                                if (name === 'Bewertet' && total > 0) {
                                                    const pct = Math.round((Number(p.rated || 0) / total) * 100);
                                                    return [`${value} (${pct}%)`, name];
                                                }
                                                return [value, name];
                                            }}
                                        />
                                        <Bar dataKey="rated" stackId="a" fill="#3b82f6" name="Bewertet">
                                            {((usePage().props as any).wsjfCoverage as any[]).map((d, i) => (
                                                <Cell
                                                    key={`rated-${i}`}
                                                    onClick={() => {
                                                        const url = route('votes.session', { planning: d.planning_id });
                                                        window.location.href = url;
                                                    }}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                            ))}
                                            <LabelList
                                                dataKey="rated"
                                                position="top"
                                                formatter={(value: any, entry: any) => {
                                                    const total = Number(entry?.total || 0);
                                                    if (!total) return '';
                                                    const pct = Math.round((Number(value || 0) / total) * 100);
                                                    return `${pct}%`;
                                                }}
                                            />
                                        </Bar>
                                        <Bar dataKey="open" stackId="a" fill="#e5e7eb" name="Offen" />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>
                {/* Liste gültiger Plannings */}
                <div className="border-sidebar-border/70 dark:border-sidebar-border relative mt-4 flex flex-col overflow-hidden rounded-xl border bg-white p-4 dark:bg-neutral-900">
                    <div className="mb-4 text-lg font-semibold">Meine gültigen Plannings</div>
                    {validPlannings.length === 0 ? (
                        <div className="text-muted-foreground text-sm">Keine gültigen Plannings</div>
                    ) : (
                        <div className="w-full overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b dark:border-gray-700">
                                        <th className="px-4 py-2 text-left">Titel</th>
                                        <th className="px-4 py-2 text-right">Aktion</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {validPlannings.map((planning) => (
                                        <tr key={planning.id} className="border-b last:border-0 dark:border-gray-700">
                                            <td className="px-4 py-3">{planning.title}</td>
                                            <td className="px-4 py-3 text-right">
                                                <Link
                                                    href={route('votes.session', { planning: planning.id })}
                                                    className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium shadow-sm"
                                                >
                                                    Zur Session
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                <div className="border-sidebar-border/70 dark:border-sidebar-border relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border md:min-h-min">
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                </div>
            </div>
        </AppLayout>
    );
}
