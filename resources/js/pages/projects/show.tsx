import { LoaderCircle, Pencil, Zap, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import type { SharedData } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import React from 'react';

interface SkillPivot {
    id: number;
    name: string;
    category: string | null;
    pivot: { level: string };
}

interface TeamMember {
    id: number;
    name: string;
    email: string;
    skills?: SkillPivot[];
}

interface ProjectTeam {
    id: number;
    name: string;
    members: TeamMember[];
}

type Project = {
    id: number;
    project_number: string;
    name: string;
    description?: string;
    jira_base_uri?: string;
    start_date: string;
    project_leader?: { id: number; name: string };
    deputy_leader?: { id: number; name: string };
    created_by?: number;
    teams?: ProjectTeam[];
    required_skills?: SkillPivot[];
};

export default function ProjectShow() {
    const { project } = usePage<{ project: Project } & SharedData>().props;
    const { auth } = usePage<SharedData>().props;
    const canManage = auth.currentRole === 'Admin' || auth.currentRole === 'Planner';

    // Quick-start form — POSTs to projects.quick-start-planning
    const quickStartForm = useForm({});
    const handleQuickStart = (e: React.FormEvent) => {
        e.preventDefault();
        quickStartForm.post(route('projects.quick-start-planning', project.id));
    };

    // Breadcrumbs definieren
    const breadcrumbs = [
        { title: 'Startseite', href: '/' },
        { title: 'Projekte', href: route('projects.index') },
        { title: project.name, href: '#' },
    ];

    // Build skill matrix data
    const requiredSkills = project.required_skills ?? [];
    const allMembers: TeamMember[] = [];
    const seenIds = new Set<number>();
    for (const team of project.teams ?? []) {
        for (const m of team.members) {
            if (!seenIds.has(m.id)) {
                seenIds.add(m.id);
                allMembers.push(m);
            }
        }
    }

    const LEVEL_ORDER: Record<string, number> = { basic: 1, intermediate: 2, expert: 3 };
    const LEVEL_LABEL: Record<string, string> = { basic: 'Grundkenntnisse', intermediate: 'Fortgeschritten', expert: 'Experte' };
    const LEVEL_COLOR: Record<string, string> = {
        basic: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        intermediate: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        expert: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    };

    function getMemberSkillLevel(member: TeamMember, skillId: number): string | null {
        const s = (member.skills ?? []).find((sk) => sk.id === skillId);
        return s ? s.pivot.level : null;
    }

    // Coverage summary per required skill
    const skillCoverage = requiredSkills.map((rs) => {
        const requiredLevel = LEVEL_ORDER[rs.pivot.level] ?? 1;
        const membersWithSkill = allMembers.filter((m) => {
            const level = getMemberSkillLevel(m, rs.id);
            return level && (LEVEL_ORDER[level] ?? 0) >= requiredLevel;
        });
        return {
            skill: rs,
            covered: membersWithSkill.length > 0,
            coverCount: membersWithSkill.length,
        };
    });
    const coveredCount = skillCoverage.filter((c) => c.covered).length;
    const totalRequired = skillCoverage.length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Projekt: ${project.name}`} />
            <Card className="rounded-xl shadow-sm">
                <CardHeader className="border-border flex flex-col gap-2 border-b sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <CardTitle className="text-xl font-semibold">{project.name}</CardTitle>
                        <CardDescription className="text-muted-foreground">Projektnummer: {project.project_number}</CardDescription>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        {canManage && (
                            <form onSubmit={handleQuickStart}>
                                <Button
                                    type="submit"
                                    disabled={quickStartForm.processing}
                                    variant="default"
                                >
                                    {quickStartForm.processing ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                                    {quickStartForm.processing ? 'Erstelle…' : 'Planungssession starten'}
                                </Button>
                            </form>
                        )}
                        <Button asChild variant="outline">
                            <Link href={route('projects.features.import', project.id)}>Feature-Import</Link>
                        </Button>
                        {canManage && (
                            <Button asChild variant="outline">
                                <Link href={route('projects.edit', project.id)}>
                                    <Pencil className="mr-1 h-4 w-4" /> Bearbeiten
                                </Link>
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Projektinformationen</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <dl className="divide-border divide-y">
                                <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[180px_1fr] sm:gap-2">
                                    <dt className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Startdatum</dt>
                                    <dd className="text-foreground text-sm">{project.start_date || '—'}</dd>
                                </div>
                                <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[180px_1fr] sm:gap-2">
                                    <dt className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Projektleiter</dt>
                                    <dd className="text-foreground text-sm">{project.project_leader?.name ?? '—'}</dd>
                                </div>
                                <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[180px_1fr] sm:gap-2">
                                    <dt className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">Stellvertretung</dt>
                                    <dd className="text-foreground text-sm">{project.deputy_leader?.name ?? '—'}</dd>
                                </div>
                                <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[180px_1fr] sm:gap-2">
                                    <dt className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">JIRA Base URI</dt>
                                    <dd className="text-foreground text-sm">
                                        {project.jira_base_uri ? (
                                            <a
                                                href={project.jira_base_uri}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-primary hover:underline"
                                            >
                                                {project.jira_base_uri}
                                            </a>
                                        ) : (
                                            '—'
                                        )}
                                    </dd>
                                </div>
                            </dl>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Beschreibung</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-foreground text-sm whitespace-pre-line">{project.description || 'Keine Beschreibung vorhanden.'}</p>
                        </CardContent>
                    </Card>

                    {/* Skill Matrix */}
                    {requiredSkills.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Zap className="h-5 w-5" /> Skill-Matrix
                                </CardTitle>
                                <CardDescription className="flex items-center gap-3">
                                    {totalRequired > 0 && (
                                        <>
                                            <span className="flex items-center gap-1">
                                                {coveredCount === totalRequired ? (
                                                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                ) : coveredCount > 0 ? (
                                                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                                ) : (
                                                    <XCircle className="h-4 w-4 text-red-600" />
                                                )}
                                                {coveredCount}/{totalRequired} Skills abgedeckt
                                            </span>
                                            {coveredCount < totalRequired && (
                                                <Badge variant="destructive" className="text-xs">
                                                    {totalRequired - coveredCount} Gap{totalRequired - coveredCount > 1 ? 's' : ''}
                                                </Badge>
                                            )}
                                        </>
                                    )}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {allMembers.length === 0 ? (
                                    <p className="text-muted-foreground text-sm">Keine Teammitglieder zugeordnet. Weisen Sie dem Projekt Teams zu, um die Skill-Matrix zu sehen.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <TooltipProvider>
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b">
                                                        <th className="py-2 pr-3 text-left font-medium">Skill</th>
                                                        <th className="px-2 py-2 text-left font-medium">Benötigt</th>
                                                        {allMembers.map((m) => (
                                                            <th key={m.id} className="px-2 py-2 text-center font-medium">
                                                                <div className="max-w-[80px] truncate" title={m.name}>
                                                                    {m.name.split(' ')[0]}
                                                                </div>
                                                            </th>
                                                        ))}
                                                        <th className="px-2 py-2 text-center font-medium">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {skillCoverage.map(({ skill, covered, coverCount }) => (
                                                        <tr key={skill.id} className={`border-b ${!covered ? 'bg-red-50/50 dark:bg-red-950/10' : ''}`}>
                                                            <td className="py-2 pr-3">
                                                                <div className="flex items-center gap-1.5">
                                                                    <span className="font-medium">{skill.name}</span>
                                                                    {skill.category && (
                                                                        <Badge variant="outline" className="px-1 text-[10px]">{skill.category}</Badge>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-2 py-2">
                                                                <Badge className={`text-xs ${LEVEL_COLOR[skill.pivot.level]}`}>
                                                                    {LEVEL_LABEL[skill.pivot.level] ?? skill.pivot.level}
                                                                </Badge>
                                                            </td>
                                                            {allMembers.map((member) => {
                                                                const memberLevel = getMemberSkillLevel(member, skill.id);
                                                                const requiredNum = LEVEL_ORDER[skill.pivot.level] ?? 1;
                                                                const memberNum = memberLevel ? (LEVEL_ORDER[memberLevel] ?? 0) : 0;
                                                                const meetsReq = memberNum >= requiredNum;

                                                                return (
                                                                    <td key={member.id} className="px-2 py-2 text-center">
                                                                        {memberLevel ? (
                                                                            <Tooltip>
                                                                                <TooltipTrigger>
                                                                                    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                                                                                        meetsReq
                                                                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                                                                                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'
                                                                                    }`}>
                                                                                        {memberLevel === 'expert' ? 'E' : memberLevel === 'intermediate' ? 'F' : 'G'}
                                                                                    </span>
                                                                                </TooltipTrigger>
                                                                                <TooltipContent>
                                                                                    {member.name}: {LEVEL_LABEL[memberLevel]}
                                                                                    {!meetsReq && ` (benötigt: ${LEVEL_LABEL[skill.pivot.level]})`}
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        ) : (
                                                                            <span className="text-muted-foreground">—</span>
                                                                        )}
                                                                    </td>
                                                                );
                                                            })}
                                                            <td className="px-2 py-2 text-center">
                                                                {covered ? (
                                                                    <Tooltip>
                                                                        <TooltipTrigger>
                                                                            <CheckCircle2 className="inline h-4 w-4 text-green-600" />
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>{coverCount}× abgedeckt</TooltipContent>
                                                                    </Tooltip>
                                                                ) : (
                                                                    <Tooltip>
                                                                        <TooltipTrigger>
                                                                            <XCircle className="inline h-4 w-4 text-red-600" />
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>Nicht abgedeckt!</TooltipContent>
                                                                    </Tooltip>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </TooltipProvider>
                                        <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1"><span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-[10px] font-bold text-green-700">E</span> Experte</span>
                                            <span className="flex items-center gap-1"><span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-[10px] font-bold text-green-700">F</span> Fortgeschritten</span>
                                            <span className="flex items-center gap-1"><span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-yellow-100 text-[10px] font-bold text-yellow-700">G</span> Grundkenntnisse</span>
                                            <span className="flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-green-600" /> Anforderung erfüllt</span>
                                            <span className="flex items-center gap-1"><XCircle className="h-4 w-4 text-red-600" /> Nicht abgedeckt</span>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </CardContent>
            </Card>
        </AppLayout>
    );
}
