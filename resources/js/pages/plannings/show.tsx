import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import type { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';
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
    project?: {
        id: number;
        name: string;
        jira_base_uri?: string;
    };
    votes?: Vote[];
    commonvotes?: Vote[]; // Vom Controller dediziert geladene Common Votes
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
    planned_at: string;
    executed_at: string;
    project?: Project;
    stakeholders: Stakeholder[]; // Geändert zu Stakeholder statt User
    features?: Feature[];
    creator?: User; // Für Ersteller-Angabe
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

interface ShowProps {
    planning: Planning;
    stakeholders: Stakeholder[]; // Ergänzt: vom Controller direkt übergebene Stakeholder
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

export default function Show({ planning, stakeholders }: ShowProps) {
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
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
