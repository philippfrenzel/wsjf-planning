import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { BarChart3, CalendarCheck2, FolderKanban } from 'lucide-react';
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

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dashboard', href: '/dashboard' }];

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

const COLORS = ['#6366f1', '#22c55e', '#a855f7', '#f59e0b', '#6b7280', '#ef4444', '#94a3b8'];

function Card({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4 text-sm font-semibold text-slate-700">{title}</div>
            <div className="p-5">{children}</div>
        </div>
    );
}

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

    const wsjfCoverage = ((usePage().props as any).wsjfCoverage ?? []) as {
        planning: string; planning_id: number; rated: number; open: number; total: number;
    }[];

    const kpis = [
        { label: 'Meine Projekte', value: myProjectsCount, icon: FolderKanban, href: '/projects', color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { label: 'Aktive Plannings', value: activePlanningsCount, icon: CalendarCheck2, href: '/plannings', color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Sichtbare Features', value: visibleFeatureCount, icon: BarChart3, href: '/features', color: 'text-violet-600', bg: 'bg-violet-50' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />

            {/* KPI row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {kpis.map((kpi) => (
                    <Link key={kpi.label} href={kpi.href} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-center gap-4 hover:shadow-md transition-shadow group">
                        <div className={`${kpi.bg} ${kpi.color} rounded-xl p-3 shrink-0`}>
                            <kpi.icon className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="text-3xl font-bold text-slate-900">{kpi.value}</div>
                            <div className="text-sm text-slate-500 mt-0.5">{kpi.label}</div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Feature Status Pie */}
                <Card title="Features nach Status">
                    <div className="h-[240px]">
                        {featureStatus.length === 0 ? (
                            <p className="text-sm text-slate-400">Keine Daten</p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={featureStatus}
                                        dataKey="count"
                                        nameKey="status"
                                        innerRadius={55}
                                        outerRadius={80}
                                        paddingAngle={2}
                                        label={(entry: any) => {
                                            const total = featureStatus.reduce((a, x) => a + (x.count ?? 0), 0);
                                            const pct = total ? Math.round(((entry?.count ?? 0) / total) * 100) : 0;
                                            return pct >= 5 ? `${pct}%` : '';
                                        }}
                                        labelLine={false}
                                    >
                                        {featureStatus.map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]}
                                                onClick={() => { window.location.href = route('features.index') + `?status=${encodeURIComponent(featureStatus[i].status)}`; }}
                                                style={{ cursor: 'pointer' }} />
                                        ))}
                                    </Pie>
                                    <Legend formatter={(v) => STATUS_LABELS[v as string] ?? v} />
                                    <ReTooltip formatter={(value: any, _n, p: any) => {
                                        const total = featureStatus.reduce((a, x) => a + (x.count ?? 0), 0);
                                        const pct = total ? Math.round((Number(value) / total) * 100) : 0;
                                        return [`${value} (${pct}%)`, STATUS_LABELS[p?.payload?.status] ?? p?.payload?.status];
                                    }} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </Card>

                {/* Commitments Bar */}
                <Card title="Commitments je Planning">
                    <div className="h-[240px]">
                        {committedByPlanning.length === 0 ? (
                            <p className="text-sm text-slate-400">Keine Daten</p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={committedByPlanning}>
                                    <XAxis dataKey="planning" hide />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                                    <ReTooltip />
                                    <Bar dataKey="committed" fill="#6366f1" radius={[4, 4, 0, 0]}>
                                        {committedByPlanning.map((d, i) => (
                                            <Cell key={i} onClick={() => { window.location.href = route('commitments.index') + `?planning_id=${d.planning_id}`; }} style={{ cursor: 'pointer' }} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </Card>

                {/* Feature Aging Area */}
                <Card title="Feature Aging (offene Features)">
                    <div className="h-[240px]">
                        {featureAging.length === 0 ? (
                            <p className="text-sm text-slate-400">Keine Daten</p>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={featureAging}>
                                    <XAxis dataKey="day" hide />
                                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                                    <ReTooltip />
                                    <Area dataKey="open_count" stroke="#6366f1" fill="#e0e7ff" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </Card>
            </div>

            {/* WSJF Coverage */}
            <Card title="WSJF‑Abdeckung pro Planning">
                <div className="h-[260px]">
                    {wsjfCoverage.length === 0 ? (
                        <p className="text-sm text-slate-400">Keine Daten</p>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={wsjfCoverage}>
                                <XAxis dataKey="planning" hide />
                                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                                <ReTooltip formatter={(value: any, name: any, props: any) => {
                                    const p = props?.payload;
                                    if (name === 'Bewertet' && p?.total) {
                                        return [`${value} (${Math.round((p.rated / p.total) * 100)}%)`, name];
                                    }
                                    return [value, name];
                                }} />
                                <Bar dataKey="rated" stackId="a" fill="#6366f1" name="Bewertet" radius={[4, 4, 0, 0]}>
                                    {wsjfCoverage.map((d, i) => (
                                        <Cell key={i} onClick={() => { window.location.href = route('votes.session', { planning: d.planning_id }); }} style={{ cursor: 'pointer' }} />
                                    ))}
                                    <LabelList dataKey="rated" position="top" formatter={(value: any, entry: any) => {
                                        const total = Number(entry?.total || 0);
                                        if (!total) return '';
                                        return `${Math.round((Number(value) / total) * 100)}%`;
                                    }} style={{ fontSize: 11, fill: '#6366f1' }} />
                                </Bar>
                                <Bar dataKey="open" stackId="a" fill="#e0e7ff" name="Offen" />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </Card>

            {/* Plannings list */}
            <Card title="Meine gültigen Plannings">
                {validPlannings.length === 0 ? (
                    <p className="text-sm text-slate-400">Keine gültigen Plannings</p>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {validPlannings.map((planning) => (
                            <div key={planning.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                                <span className="text-sm font-medium text-slate-700">{planning.title}</span>
                                <Link
                                    href={route('votes.session', { planning: planning.id })}
                                    className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 transition-colors"
                                >
                                    Zur Session
                                </Link>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </AppLayout>
    );
}

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

