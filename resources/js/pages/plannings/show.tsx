import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import type { SharedData } from '@/types';
import { router, usePage } from '@inertiajs/react';
import { ChevronDown, ChevronRight, Plus, Pencil, Trash2, Target } from 'lucide-react';
import React, { useState } from 'react';
import { useConfirm } from '@/components/confirm-dialog-provider';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { VoteProgressCard } from '@/components/VoteProgressCard';
import PlanningDetailsCard from './components/PlanningDetailsCard';

// Interface für Stakeholder anpassen (mit votes_count)
interface Stakeholder {
    id: number;
    name: string;
    email?: string;
    votes_count: number; // Hinzugefügt für die Stimmenzählung
}

interface User {
    id: number;
    name: string;
}

interface Project {
    id: number;
    name: string;
}

interface Vote {
    user_id: number;
    user: User;
    type: string; // "BusinessValue", "TimeCriticality", "RiskOpportunity"
    value: number;
}

interface Feature {
    id: number;
    jira_key: string;
    name: string;
    project_id: number;
    team_id?: number | null;
    iteration_id?: number | null;
    team?: { id: number; name: string } | null;
    iteration?: { id: number; name: string; number: number } | null;
    dependencies?: {
        id: number;
        feature_id: number;
        related_feature_id: number | null;
        type: string;
        is_external: boolean;
        external_description: string | null;
        related?: { id: number; jira_key: string; name: string } | null;
    }[];
    project?: {
        id: number;
        name: string;
        jira_base_uri?: string;
    };
    votes?: Vote[];
    commonvotes?: Vote[];
    commitments?: {
        id: number;
        commitment_type: string;
        user_id: number;
        user: User;
        status_details?: {
            value: string;
            name: string;
            color: string;
        };
    }[];
}

interface Planning {
    id: number;
    title: string;
    description: string;
    vision?: string | null;
    planned_at: string;
    executed_at: string;
    project?: Project;
    stakeholders: Stakeholder[];
    features?: Feature[];
    creator?: User;
}

// WSJF score computed on-the-fly from commonvotes
function computeWsjfScore(commonvotes?: Vote[]): number | null {
    if (!commonvotes) return null;
    const bv = commonvotes.find((v) => v.type === 'BusinessValue')?.value;
    const tc = commonvotes.find((v) => v.type === 'TimeCriticality')?.value;
    const rr = commonvotes.find((v) => v.type === 'RiskOpportunity')?.value;
    const js = commonvotes.find((v) => v.type === 'JobSize')?.value;
    if (!bv || !tc || !rr || !js || js === 0) return null;
    return (bv + tc + rr) / js;
}

interface PiObjective {
    id: number;
    planning_id: number;
    user_id: number;
    user?: { id: number; name: string };
    title: string;
    description: string | null;
    business_value: number | null;
    is_committed: boolean;
    status: 'draft' | 'committed' | 'achieved' | 'not_achieved';
}

interface IterationData {
    id: number;
    planning_id: number;
    number: number;
    name: string;
    start_date: string;
    end_date: string;
    is_ip: boolean;
}

interface RiskData {
    id: number;
    planning_id: number;
    owner_id: number | null;
    owner?: { id: number; name: string } | null;
    title: string;
    description: string | null;
    roam_status: string;
    category: string | null;
    impact: string;
}

interface TeamData {
    id: number;
    name: string;
}

interface ShowProps {
    planning: Planning;
    stakeholders: Stakeholder[];
    piObjectives: PiObjective[];
    iterations: IterationData[];
    risks: RiskData[];
    teams: TeamData[];
}

function FeaturesTable({ features }: { features?: Feature[] }) {
    const [expandedFeature, setExpandedFeature] = useState<number | null>(null);

    if (!features || features.length === 0) {
        return <div className="mt-6">Keine Features verknüpft.</div>;
    }

    // Gruppiere Vote-Typen für Spaltenüberschriften
    const voteTypes = features
        .flatMap((feature) => feature.votes || [])
        .map((vote) => vote.type)
        .filter((value, index, self) => self.indexOf(value) === index)
        .sort();

    // Bestimme alle Benutzer, die Votes abgegeben haben
    const usersWithVotes = features
        .flatMap((feature) => feature.votes || [])
        .map((vote) => vote.user)
        .filter((user, index, self) => self.findIndex((u) => u.id === user.id) === index)
        .sort((a, b) => a.name.localeCompare(b.name));

    const toggleFeatureExpand = (featureId: number) => {
        setExpandedFeature(expandedFeature === featureId ? null : featureId);
    };

    return (
        <div className="mt-6">
            <h2 className="mb-2 text-lg font-semibold">Verknüpfte Features</h2>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead>Jira Key</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Votes</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {features.map((feature) => (
                        <React.Fragment key={feature.id}>
                            <TableRow className="hover:bg-muted/50 cursor-pointer" onClick={() => toggleFeatureExpand(feature.id)}>
                                <TableCell>
                                    <Button variant="ghost" size="sm">
                                        {expandedFeature === feature.id ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    </Button>
                                </TableCell>
                                <TableCell>{feature.jira_key}</TableCell>
                                <TableCell>
                                    {feature.name && feature.name.length > 50 ? (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span className="cursor-help">{feature.name.slice(0, 50)}&hellip;</span>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <span className="max-w-xl break-words whitespace-pre-line">{feature.name}</span>
                                            </TooltipContent>
                                        </Tooltip>
                                    ) : (
                                        feature.name
                                    )}
                                </TableCell>
                                <TableCell>
                                    {feature.votes && feature.votes.length > 0 ? (
                                        <Badge variant="outline" className="bg-blue-50">
                                            {feature.votes.length} Votes
                                        </Badge>
                                    ) : (
                                        <span className="text-muted-foreground text-sm">Keine Votes</span>
                                    )}
                                </TableCell>
                            </TableRow>

                            {expandedFeature === feature.id && feature.votes && feature.votes.length > 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="p-0">
                                        <div className="bg-muted/30 px-4 py-3">
                                            <h3 className="mb-2 text-sm font-medium">Abgegebene Votes:</h3>
                                            <Table>
                                                <TableHeader>
                                                    <TableRow>
                                                        <TableHead>Benutzer</TableHead>
                                                        {voteTypes.map((type) => (
                                                            <TableHead key={type}>{translateVoteType(type)}</TableHead>
                                                        ))}
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {usersWithVotes.map((user) => (
                                                        <TableRow key={user.id}>
                                                            <TableCell className="font-medium">{user.name}</TableCell>
                                                            {voteTypes.map((type) => {
                                                                const vote = feature.votes?.find((v) => v.user_id === user.id && v.type === type);
                                                                return (
                                                                    <TableCell key={type}>
                                                                        {vote ? (
                                                                            <Badge className={getScoreBadgeClass(vote.value)}>{vote.value}</Badge>
                                                                        ) : (
                                                                            '-'
                                                                        )}
                                                                    </TableCell>
                                                                );
                                                            })}
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
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

// Hilfsfunktion zur Übersetzung der Vote-Typen
function translateVoteType(type: string): string {
    const translations: { [key: string]: string } = {
        BusinessValue: 'Geschäftswert',
        TimeCriticality: 'Zeitkritikalität',
        RiskOpportunity: 'Risiko/Chance',
        WSJF: 'WSJF Score',
    };
    return translations[type] || type;
}

// Hilfsfunktion zur Bestimmung der Badge-Klasse basierend auf dem Score-Wert
function getScoreBadgeClass(value: number): string {
    if (value >= 8) return 'bg-red-100 text-red-800';
    if (value >= 5) return 'bg-orange-100 text-orange-800';
    if (value >= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
}

const STATUS_LABELS: Record<string, string> = {
    draft: 'Entwurf',
    committed: 'Committed',
    achieved: 'Erreicht',
    not_achieved: 'Nicht erreicht',
};

const STATUS_COLORS: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700',
    committed: 'bg-blue-100 text-blue-800',
    achieved: 'bg-green-100 text-green-800',
    not_achieved: 'bg-red-100 text-red-800',
};

function PiObjectivesPanel({
    planningId,
    piObjectives,
    canManage,
}: {
    planningId: number;
    piObjectives: PiObjective[];
    canManage: boolean;
}) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<PiObjective | null>(null);
    const [form, setForm] = useState({ title: '', description: '', business_value: '', is_committed: true, status: 'draft' });
    const [submitting, setSubmitting] = useState(false);
    const confirm = useConfirm();

    const committed = piObjectives.filter((o) => o.is_committed);
    const uncommitted = piObjectives.filter((o) => !o.is_committed);
    const totalBv = committed.reduce((sum, o) => sum + (o.business_value ?? 0), 0);
    const achievedBv = committed.filter((o) => o.status === 'achieved').reduce((sum, o) => sum + (o.business_value ?? 0), 0);

    function openCreate() {
        setEditing(null);
        setForm({ title: '', description: '', business_value: '', is_committed: true, status: 'draft' });
        setDialogOpen(true);
    }

    function openEdit(obj: PiObjective) {
        setEditing(obj);
        setForm({
            title: obj.title,
            description: obj.description ?? '',
            business_value: obj.business_value?.toString() ?? '',
            is_committed: obj.is_committed,
            status: obj.status,
        });
        setDialogOpen(true);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);

        const payload = {
            ...form,
            business_value: form.business_value ? parseInt(form.business_value) : null,
            planning_id: planningId,
        };

        if (editing) {
            router.put(route('pi-objectives.update', editing.id), payload, {
                preserveScroll: true,
                onFinish: () => { setSubmitting(false); setDialogOpen(false); },
            });
        } else {
            router.post(route('pi-objectives.store'), payload, {
                preserveScroll: true,
                onFinish: () => { setSubmitting(false); setDialogOpen(false); },
            });
        }
    }

    async function handleDelete(obj: PiObjective) {
        const ok = await confirm({
            title: 'PI Objective löschen',
            description: `Möchten Sie "${obj.title}" wirklich löschen?`,
            confirmLabel: 'Löschen',
            cancelLabel: 'Abbrechen',
        });
        if (!ok) return;
        router.delete(route('pi-objectives.destroy', obj.id), { preserveScroll: true });
    }

    function renderObjectiveRow(obj: PiObjective) {
        return (
            <TableRow key={obj.id}>
                <TableCell className="font-medium">{obj.title}</TableCell>
                <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">{obj.description}</TableCell>
                <TableCell>{obj.user?.name}</TableCell>
                <TableCell className="text-center">
                    {obj.business_value != null ? (
                        <Badge className={getScoreBadgeClass(obj.business_value)}>{obj.business_value}</Badge>
                    ) : (
                        <span className="text-muted-foreground">–</span>
                    )}
                </TableCell>
                <TableCell>
                    <Badge className={STATUS_COLORS[obj.status] ?? ''}>{STATUS_LABELS[obj.status] ?? obj.status}</Badge>
                </TableCell>
                {canManage && (
                    <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" onClick={() => openEdit(obj)}>
                                <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDelete(obj)}>
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </TableCell>
                )}
            </TableRow>
        );
    }

    function renderTable(items: PiObjective[], label: string) {
        if (items.length === 0) return null;
        return (
            <div className="mb-6">
                <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">{label}</h3>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Titel</TableHead>
                            <TableHead>Beschreibung</TableHead>
                            <TableHead>Verantwortlich</TableHead>
                            <TableHead className="text-center">BV (1–10)</TableHead>
                            <TableHead>Status</TableHead>
                            {canManage && <TableHead className="text-right">Aktionen</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>{items.map(renderObjectiveRow)}</TableBody>
                </Table>
            </div>
        );
    }

    return (
        <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-blue-600" />
                        <span className="text-sm font-medium">
                            {committed.length} Committed · {uncommitted.length} Uncommitted
                        </span>
                    </div>
                    {totalBv > 0 && (
                        <span className="text-sm text-muted-foreground">
                            BV: {achievedBv}/{totalBv} erreicht ({totalBv > 0 ? Math.round((achievedBv / totalBv) * 100) : 0}%)
                        </span>
                    )}
                </div>
                {canManage && (
                    <Button size="sm" onClick={openCreate}>
                        <Plus className="mr-1 h-4 w-4" /> PI Objective
                    </Button>
                )}
            </div>

            {piObjectives.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">Noch keine PI Objectives erfasst.</div>
            ) : (
                <>
                    {renderTable(committed, 'Committed Objectives')}
                    {renderTable(uncommitted, 'Uncommitted Objectives')}
                </>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editing ? 'PI Objective bearbeiten' : 'Neues PI Objective'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="obj-title">Titel</Label>
                            <Input id="obj-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                        </div>
                        <div>
                            <Label htmlFor="obj-desc">Beschreibung</Label>
                            <Textarea id="obj-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="obj-bv">Business Value (1–10)</Label>
                                <Input id="obj-bv" type="number" min={1} max={10} value={form.business_value} onChange={(e) => setForm({ ...form, business_value: e.target.value })} />
                            </div>
                            <div>
                                <Label htmlFor="obj-status">Status</Label>
                                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                                    <SelectTrigger id="obj-status"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Entwurf</SelectItem>
                                        <SelectItem value="committed">Committed</SelectItem>
                                        <SelectItem value="achieved">Erreicht</SelectItem>
                                        <SelectItem value="not_achieved">Nicht erreicht</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox id="obj-committed" checked={form.is_committed} onCheckedChange={(v) => setForm({ ...form, is_committed: !!v })} />
                            <Label htmlFor="obj-committed">Committed Objective</Label>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
                            <Button type="submit" disabled={submitting}>{editing ? 'Speichern' : 'Erstellen'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function IterationsPanel({
    planningId,
    iterations,
    canManage,
}: {
    planningId: number;
    iterations: IterationData[];
    canManage: boolean;
}) {
    const [showGenerator, setShowGenerator] = useState(false);
    const [genForm, setGenForm] = useState({ pi_start: '', pi_end: '', sprint_weeks: '2', ip_sprint: true });
    const [submitting, setSubmitting] = useState(false);
    const confirm = useConfirm();

    function handleGenerate(e: React.FormEvent) {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        router.post(route('plannings.iterations.generate', planningId), {
            ...genForm,
            sprint_weeks: parseInt(genForm.sprint_weeks),
        }, {
            preserveScroll: true,
            onFinish: () => { setSubmitting(false); setShowGenerator(false); },
        });
    }

    async function handleDelete(it: IterationData) {
        const ok = await confirm({
            title: 'Iteration löschen',
            description: `Möchten Sie "${it.name}" wirklich löschen?`,
            confirmLabel: 'Löschen',
            cancelLabel: 'Abbrechen',
        });
        if (ok) router.delete(route('iterations.destroy', it.id), { preserveScroll: true });
    }

    return (
        <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{iterations.length} Iterationen</span>
                {canManage && (
                    <Button size="sm" variant="outline" onClick={() => setShowGenerator(!showGenerator)}>
                        Iterationen generieren
                    </Button>
                )}
            </div>

            {showGenerator && (
                <Card>
                    <CardContent className="pt-4">
                        <form onSubmit={handleGenerate} className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                            <div>
                                <Label>PI Start</Label>
                                <Input type="date" value={genForm.pi_start} onChange={(e) => setGenForm({ ...genForm, pi_start: e.target.value })} required />
                            </div>
                            <div>
                                <Label>PI Ende</Label>
                                <Input type="date" value={genForm.pi_end} onChange={(e) => setGenForm({ ...genForm, pi_end: e.target.value })} required />
                            </div>
                            <div>
                                <Label>Sprint-Wochen</Label>
                                <Input type="number" min={1} max={6} value={genForm.sprint_weeks} onChange={(e) => setGenForm({ ...genForm, sprint_weeks: e.target.value })} required />
                            </div>
                            <div className="flex items-end gap-2">
                                <Button type="submit" disabled={submitting} size="sm">Generieren</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {iterations.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">Noch keine Iterationen definiert.</div>
            ) : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-16">#</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Start</TableHead>
                            <TableHead>Ende</TableHead>
                            <TableHead>Typ</TableHead>
                            {canManage && <TableHead className="text-right">Aktionen</TableHead>}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {iterations.map((it) => (
                            <TableRow key={it.id}>
                                <TableCell className="font-mono text-muted-foreground">{it.number}</TableCell>
                                <TableCell className="font-medium">{it.name}</TableCell>
                                <TableCell>{it.start_date}</TableCell>
                                <TableCell>{it.end_date}</TableCell>
                                <TableCell>
                                    {it.is_ip ? (
                                        <Badge variant="secondary">IP Sprint</Badge>
                                    ) : (
                                        <Badge variant="outline">Sprint</Badge>
                                    )}
                                </TableCell>
                                {canManage && (
                                    <TableCell className="text-right">
                                        <Button size="icon" variant="ghost" onClick={() => handleDelete(it)}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </TableCell>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </div>
    );
}

const ROAM_LABELS: Record<string, string> = { identified: 'Identifiziert', resolved: 'Resolved', owned: 'Owned', accepted: 'Accepted', mitigated: 'Mitigated' };
const ROAM_COLORS: Record<string, string> = { identified: 'bg-red-100 text-red-800', resolved: 'bg-green-100 text-green-800', owned: 'bg-blue-100 text-blue-800', accepted: 'bg-yellow-100 text-yellow-800', mitigated: 'bg-purple-100 text-purple-800' };
const IMPACT_LABELS: Record<string, string> = { low: 'Niedrig', medium: 'Mittel', high: 'Hoch' };
const IMPACT_COLORS: Record<string, string> = { low: 'bg-green-50 text-green-700', medium: 'bg-yellow-50 text-yellow-700', high: 'bg-red-50 text-red-700' };
const CATEGORY_LABELS: Record<string, string> = { technical: 'Technisch', business: 'Business', schedule: 'Zeitplan', resource: 'Ressourcen', dependency: 'Abhängigkeit' };

function RoamBoard({
    planningId,
    risks,
    canManage,
}: {
    planningId: number;
    risks: RiskData[];
    canManage: boolean;
}) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<RiskData | null>(null);
    const [form, setForm] = useState({ title: '', description: '', roam_status: 'identified', category: '', impact: 'medium', owner_id: '' });
    const [submitting, setSubmitting] = useState(false);
    const confirm = useConfirm();

    function openCreate() {
        setEditing(null);
        setForm({ title: '', description: '', roam_status: 'identified', category: '', impact: 'medium', owner_id: '' });
        setDialogOpen(true);
    }

    function openEdit(r: RiskData) {
        setEditing(r);
        setForm({
            title: r.title,
            description: r.description ?? '',
            roam_status: r.roam_status,
            category: r.category ?? '',
            impact: r.impact,
            owner_id: r.owner_id?.toString() ?? '',
        });
        setDialogOpen(true);
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        const payload = { ...form, planning_id: planningId, owner_id: form.owner_id ? parseInt(form.owner_id) : null };
        if (editing) {
            router.put(route('risks.update', editing.id), payload, { preserveScroll: true, onFinish: () => { setSubmitting(false); setDialogOpen(false); } });
        } else {
            router.post(route('risks.store'), payload, { preserveScroll: true, onFinish: () => { setSubmitting(false); setDialogOpen(false); } });
        }
    }

    async function handleDelete(r: RiskData) {
        const ok = await confirm({ title: 'Risiko löschen', description: `Möchten Sie "${r.title}" wirklich löschen?`, confirmLabel: 'Löschen', cancelLabel: 'Abbrechen' });
        if (ok) router.delete(route('risks.destroy', r.id), { preserveScroll: true });
    }

    // Group by ROAM status for board view
    const grouped = ['identified', 'owned', 'mitigated', 'accepted', 'resolved'].map((status) => ({
        status,
        label: ROAM_LABELS[status],
        color: ROAM_COLORS[status],
        items: risks.filter((r) => r.roam_status === status),
    }));

    return (
        <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{risks.length} Risiken</span>
                {canManage && <Button size="sm" onClick={openCreate}><Plus className="mr-1 h-4 w-4" /> Risiko</Button>}
            </div>

            {risks.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">Noch keine Risiken erfasst.</div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {grouped.map((col) => (
                        <div key={col.status} className="rounded-lg border p-3">
                            <div className="mb-2 flex items-center justify-between">
                                <Badge className={col.color}>{col.label}</Badge>
                                <span className="text-xs text-muted-foreground">{col.items.length}</span>
                            </div>
                            <div className="space-y-2">
                                {col.items.map((r) => (
                                    <Card key={r.id} className="cursor-pointer p-2" onClick={() => canManage && openEdit(r)}>
                                        <div className="text-sm font-medium">{r.title}</div>
                                        {r.description && <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.description}</div>}
                                        <div className="mt-2 flex items-center gap-1">
                                            <Badge variant="outline" className={`text-xs ${IMPACT_COLORS[r.impact]}`}>{IMPACT_LABELS[r.impact]}</Badge>
                                            {r.category && <Badge variant="outline" className="text-xs">{CATEGORY_LABELS[r.category] ?? r.category}</Badge>}
                                        </div>
                                        {r.owner && <div className="mt-1 text-xs text-muted-foreground">Owner: {r.owner.name}</div>}
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader><DialogTitle>{editing ? 'Risiko bearbeiten' : 'Neues Risiko'}</DialogTitle></DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="risk-title">Titel</Label>
                            <Input id="risk-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                        </div>
                        <div>
                            <Label htmlFor="risk-desc">Beschreibung</Label>
                            <Textarea id="risk-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>ROAM Status</Label>
                                <Select value={form.roam_status} onValueChange={(v) => setForm({ ...form, roam_status: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(ROAM_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Impact</Label>
                                <Select value={form.impact} onValueChange={(v) => setForm({ ...form, impact: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(IMPACT_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <Label>Kategorie</Label>
                            <Select value={form.category || '_none'} onValueChange={(v) => setForm({ ...form, category: v === '_none' ? '' : v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="_none">– Keine –</SelectItem>
                                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Abbrechen</Button>
                            {editing && canManage && (
                                <Button type="button" variant="destructive" onClick={() => { setDialogOpen(false); handleDelete(editing); }}>Löschen</Button>
                            )}
                            <Button type="submit" disabled={submitting}>{editing ? 'Speichern' : 'Erstellen'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ---- Program Board Component ----
function ProgramBoard({
    features,
    teams,
    iterations,
    planningId,
    canManage,
}: {
    features: Feature[];
    teams: TeamData[];
    iterations: IterationData[];
    planningId: number;
    canManage: boolean;
}) {
    const confirm = useConfirm();
    const [assignDialog, setAssignDialog] = useState<{ feature: Feature; open: boolean }>({ feature: {} as Feature, open: false });
    const [assignTeamId, setAssignTeamId] = useState('');
    const [assignIterationId, setAssignIterationId] = useState('');

    const sortedIterations = [...iterations].sort((a, b) => a.number - b.number);

    // Features grouped by team_id → iteration_id
    const getFeatures = (teamId: number | null, iterationId: number | null) =>
        features.filter((f) => {
            const matchTeam = teamId === null ? !f.team_id : f.team_id === teamId;
            const matchIter = iterationId === null ? !f.iteration_id : f.iteration_id === iterationId;
            return matchTeam && matchIter;
        });

    const unassignedFeatures = features.filter((f) => !f.team_id || !f.iteration_id);

    const openAssign = (feature: Feature) => {
        setAssignTeamId(feature.team_id ? String(feature.team_id) : '');
        setAssignIterationId(feature.iteration_id ? String(feature.iteration_id) : '');
        setAssignDialog({ feature, open: true });
    };

    const submitAssign = () => {
        router.put(
            route('plannings.assign-feature', { planning: planningId, feature: assignDialog.feature.id }),
            {
                team_id: assignTeamId || null,
                iteration_id: assignIterationId || null,
            },
            { preserveScroll: true, onSuccess: () => setAssignDialog({ feature: {} as Feature, open: false }) },
        );
    };

    // Dependency lines data: collect all cross-cell dependencies
    const depLines: { from: Feature; to: Feature; type: string }[] = [];
    features.forEach((f) => {
        f.dependencies?.forEach((dep) => {
            if (dep.related_feature_id) {
                const target = features.find((t) => t.id === dep.related_feature_id);
                if (target && (f.team_id !== target.team_id || f.iteration_id !== target.iteration_id)) {
                    depLines.push({ from: f, to: target, type: dep.type });
                }
            }
        });
    });

    if (iterations.length === 0 || teams.length === 0) {
        return (
            <div className="py-8 text-center text-muted-foreground">
                Bitte zuerst <strong>Teams</strong> und <strong>Iterationen</strong> anlegen, um das Program Board nutzen zu können.
            </div>
        );
    }

    const typeColors: Record<string, string> = {
        ermöglicht: 'border-green-500',
        verhindert: 'border-red-500',
        bedingt: 'border-yellow-500',
        ersetzt: 'border-gray-500',
    };

    return (
        <div className="space-y-4">
            {/* Unassigned features */}
            {unassignedFeatures.length > 0 && (
                <div className="rounded-lg border border-dashed border-orange-300 bg-orange-50 p-3 dark:border-orange-700 dark:bg-orange-950">
                    <div className="mb-2 text-xs font-semibold uppercase text-orange-600 dark:text-orange-400">
                        Nicht zugeordnete Features ({unassignedFeatures.length})
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {unassignedFeatures.map((f) => (
                            <button
                                key={f.id}
                                onClick={() => canManage && openAssign(f)}
                                className="rounded border bg-white px-2 py-1 text-xs shadow-sm hover:bg-gray-50 dark:bg-gray-900 dark:hover:bg-gray-800"
                            >
                                <span className="font-mono text-muted-foreground">{f.jira_key}</span>{' '}
                                <span className="font-medium">{f.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Board grid */}
            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr>
                            <th className="border bg-muted/50 p-2 text-left text-xs font-semibold">Team</th>
                            {sortedIterations.map((iter) => (
                                <th key={iter.id} className="border bg-muted/50 p-2 text-center text-xs font-semibold">
                                    {iter.name}
                                    {iter.is_ip && <Badge variant="outline" className="ml-1 text-[10px]">IP</Badge>}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {teams.map((team) => (
                            <tr key={team.id}>
                                <td className="border bg-muted/30 p-2 text-xs font-medium align-top whitespace-nowrap">
                                    {team.name}
                                </td>
                                {sortedIterations.map((iter) => {
                                    const cellFeatures = getFeatures(team.id, iter.id);
                                    return (
                                        <td key={iter.id} className="border p-1 align-top min-w-[140px]">
                                            <div className="flex flex-col gap-1">
                                                {cellFeatures.map((f) => (
                                                    <button
                                                        key={f.id}
                                                        onClick={() => canManage && openAssign(f)}
                                                        className={`rounded border px-2 py-1 text-left text-xs shadow-sm hover:bg-accent ${
                                                            f.dependencies && f.dependencies.length > 0
                                                                ? 'border-l-4 ' + (typeColors[f.dependencies[0]?.type] || 'border-blue-500')
                                                                : ''
                                                        }`}
                                                    >
                                                        <div className="font-mono text-[10px] text-muted-foreground">{f.jira_key}</div>
                                                        <div className="font-medium">{f.name}</div>
                                                        {f.dependencies && f.dependencies.length > 0 && (
                                                            <div className="mt-0.5 text-[10px] text-muted-foreground">
                                                                → {f.dependencies.map((d) => d.related?.jira_key || d.external_description || '?').join(', ')}
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Dependency legend */}
            {depLines.length > 0 && (
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="font-semibold">Abhängigkeiten:</span>
                    {depLines.map((d, i) => (
                        <span key={i}>
                            {d.from.jira_key} → {d.to.jira_key} ({d.type})
                        </span>
                    ))}
                </div>
            )}

            {/* Assign dialog */}
            <Dialog open={assignDialog.open} onOpenChange={(o) => setAssignDialog((prev) => ({ ...prev, open: o }))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Feature zuordnen: {assignDialog.feature.jira_key} — {assignDialog.feature.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label>Team</Label>
                            <Select value={assignTeamId} onValueChange={setAssignTeamId}>
                                <SelectTrigger><SelectValue placeholder="Team wählen" /></SelectTrigger>
                                <SelectContent>
                                    {teams.map((t) => (
                                        <SelectItem key={t.id} value={String(t.id)}>{t.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Iteration</Label>
                            <Select value={assignIterationId} onValueChange={setAssignIterationId}>
                                <SelectTrigger><SelectValue placeholder="Iteration wählen" /></SelectTrigger>
                                <SelectContent>
                                    {sortedIterations.map((it) => (
                                        <SelectItem key={it.id} value={String(it.id)}>
                                            {it.name} {it.is_ip ? '(IP)' : ''}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAssignDialog({ feature: {} as Feature, open: false })}>Abbrechen</Button>
                        <Button onClick={submitAssign}>Zuordnen</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default function Show({ planning, stakeholders, piObjectives, iterations, risks, teams }: ShowProps) {
    const { auth } = usePage<SharedData>().props;
    const canManage = auth.currentRole === 'Admin' || auth.currentRole === 'Planner';

    // Breadcrumbs für die Planungs-Detailseite
    const breadcrumbs = [
        { title: 'Startseite', href: '/' },
        { title: 'Plannings', href: '/plannings' },
        { title: planning.title, href: '#' }, // aktuelle Seite nicht klickbar
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="w-full max-w-full px-10">
                <Card className="w-full">
                    <CardHeader>
                        <CardTitle>{planning.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {planning.vision && (
                            <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
                                <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">PI Vision</div>
                                <div className="whitespace-pre-line text-sm">{planning.vision}</div>
                            </div>
                        )}
                        {canManage && (
                            <div className="mb-6">
                                <VoteProgressCard stakeholders={stakeholders} />
                            </div>
                        )}
                        <Tabs defaultValue="details" className="w-full">
                            <TabsList>
                                <TabsTrigger value="details">Details & Common Vote</TabsTrigger>
                                <TabsTrigger value="features">Features & Individual Votes</TabsTrigger>
                                <TabsTrigger value="wsjf-ranking">WSJF Ranking</TabsTrigger>
                                <TabsTrigger value="pi-objectives">PI Objectives</TabsTrigger>
                                <TabsTrigger value="iterations">Iterationen</TabsTrigger>
                                <TabsTrigger value="roam">ROAM Board</TabsTrigger>
                                <TabsTrigger value="program-board">Program Board</TabsTrigger>
                            </TabsList>
                            <TabsContent value="details">
                                <PlanningDetailsCard planning={planning} stakeholders={stakeholders} />
                            </TabsContent>
                            <TabsContent value="features">
                                <FeaturesTable features={planning.features} />
                            </TabsContent>
                            <TabsContent value="wsjf-ranking">
                                <div className="mb-3 flex justify-end">
                                    <a
                                        href={route('plannings.export-csv', planning.id)}
                                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                                    >
                                        ↓ Export CSV
                                    </a>
                                </div>
                                <div className="mt-1 rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-12">Rang</TableHead>
                                                <TableHead>Feature</TableHead>
                                                <TableHead className="w-16 text-center">BV</TableHead>
                                                <TableHead className="w-16 text-center">TC</TableHead>
                                                <TableHead className="w-16 text-center">RR</TableHead>
                                                <TableHead className="w-20 text-center">Job Size</TableHead>
                                                <TableHead className="w-24 text-center">WSJF Score</TableHead>
                                                <TableHead className="w-28">Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(planning.features ?? [])
                                                .slice()
                                                .sort((a, b) => {
                                                    const sa = computeWsjfScore(a.commonvotes) ?? -1;
                                                    const sb = computeWsjfScore(b.commonvotes) ?? -1;
                                                    return sb - sa;
                                                })
                                                .map((feature, index) => {
                                                    const score = computeWsjfScore(feature.commonvotes);
                                                    const bv = feature.commonvotes?.find((v) => v.type === 'BusinessValue')?.value;
                                                    const tc = feature.commonvotes?.find((v) => v.type === 'TimeCriticality')?.value;
                                                    const rr = feature.commonvotes?.find((v) => v.type === 'RiskOpportunity')?.value;
                                                    const js = feature.commonvotes?.find((v) => v.type === 'JobSize')?.value;
                                                    return (
                                                        <TableRow key={feature.id}>
                                                            <TableCell className="text-center font-medium">
                                                                {score !== null ? index + 1 : '—'}
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="font-medium">{feature.jira_key}</div>
                                                                <div className="text-muted-foreground text-xs">{feature.name}</div>
                                                            </TableCell>
                                                            <TableCell className="text-center">{bv ?? '—'}</TableCell>
                                                            <TableCell className="text-center">{tc ?? '—'}</TableCell>
                                                            <TableCell className="text-center">{rr ?? '—'}</TableCell>
                                                            <TableCell className="text-center">{js ?? '—'}</TableCell>
                                                            <TableCell className="text-center">
                                                                {score !== null ? (
                                                                    <Badge className="bg-indigo-100 text-indigo-800">{score.toFixed(2)}</Badge>
                                                                ) : (
                                                                    '—'
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                {score === null && (
                                                                    <Badge variant="secondary">Incomplete</Badge>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </TabsContent>
                            <TabsContent value="pi-objectives">
                                <PiObjectivesPanel planningId={planning.id} piObjectives={piObjectives ?? []} canManage={canManage} />
                            </TabsContent>
                            <TabsContent value="iterations">
                                <IterationsPanel planningId={planning.id} iterations={iterations ?? []} canManage={canManage} />
                            </TabsContent>
                            <TabsContent value="roam">
                                <RoamBoard planningId={planning.id} risks={risks ?? []} canManage={canManage} />
                            </TabsContent>
                            <TabsContent value="program-board">
                                <ProgramBoard
                                    features={planning.features ?? []}
                                    teams={teams ?? []}
                                    iterations={iterations ?? []}
                                    planningId={planning.id}
                                    canManage={canManage}
                                />
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
