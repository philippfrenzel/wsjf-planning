import axios from '@/bootstrap';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import {
    DndContext,
    DragEndEvent,
    DragOverEvent,
    DragOverlay,
    DragStartEvent,
    PointerSensor,
    closestCenter,
    useDraggable,
    useDroppable,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { Link } from '@inertiajs/react';
import React, { useState } from 'react';

interface Feature {
    id: number;
    jira_key: string;
    name: string;
    project?: { id: number; name: string } | null;
    estimation_components_count?: number;
    total_weighted_case?: number;
    estimation_units?: string[];
}

interface Lane {
    key: string;
    name: string;
    color: string;
    features: Feature[];
}

interface Project {
    id: number;
    name: string;
}

interface BoardProps {
    lanes: Lane[];
    projects: Project[];
    filters: {
        project_id?: number | null;
        planning_id?: number | null;
        status?: string | null;
        closed_status_days?: string | null;
    };
    plannings: { id: number; title: string }[];
}

function LaneColumn({ lane, children, highlight }: { lane: Lane; children: React.ReactNode; highlight: boolean }) {
    const { setNodeRef, isOver } = useDroppable({ id: lane.key });

    // Kombination von externem highlight und internem isOver für deutlicheres visuelles Feedback
    const showHighlight = highlight || isOver;

    return (
        <div
            ref={setNodeRef}
            id={lane.key}
            className={`max-w-[300px] min-w-[250px] flex-1 transition-colors duration-150 ${
                showHighlight ? 'border-2 border-dashed border-blue-400 bg-blue-100' : ''
            }`}
        >
            <div className={`mb-2 rounded px-2 py-1 text-sm font-semibold ${lane.color} flex items-center justify-between`}>
                <span>{lane.name}</span>
                <span className="bg-opacity-80 rounded-full bg-white px-1.5 py-0.5 text-xs">{lane.features.length}</span>
            </div>
            <div className="min-h-[60px] space-y-2 p-2">{children}</div>
        </div>
    );
}

function FeatureCard({ feature }: { feature: Feature }) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: String(feature.id),
        data: feature,
    });

    // Verbesserte Stile für Feature-Card
    const cardStyle = isDragging ? { opacity: 0.4, cursor: 'grabbing' } : { cursor: 'grab' };

    return (
        <div ref={setNodeRef} style={cardStyle} className="w-full touch-manipulation">
            <Card
                {...attributes}
                {...listeners}
                className={`shadow transition-all ${isDragging ? 'border border-blue-400 opacity-50' : 'hover:shadow-md'}`}
                id={String(feature.id)}
            >
                <CardHeader className="p-3 pb-2">
                    <CardTitle className="text-sm leading-snug break-words whitespace-normal">
                        {feature.jira_key} - {feature.name}
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                    {feature.project && <p className="text-muted-foreground truncate text-xs">{feature.project.name}</p>}

                    {/* Schätzungsinformationen */}
                    {typeof feature.estimation_components_count === 'number' && (
                        <div className="mt-2 flex items-center justify-between">
                            <div className="flex items-center">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="mr-1 h-4 w-4 text-slate-400"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 5a3 3 0 01-3 3h-.5a.5.5 0 000 1H10a1 1 0 011 1v1a1 1 0 11-2 0v-.5a.5.5 0 00-.5-.5.5.5 0 01-.5-.5.5.5 0 01.5-.5.5.5 0 00.5-.5V7a.5.5 0 00-.5-.5H8a.5.5 0 010-1h.5A1.5 1.5 0 0010 4z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <span className="text-xs font-medium text-slate-600">{feature.estimation_components_count}</span>
                            </div>

                            {feature.total_weighted_case !== undefined && feature.total_weighted_case > 0 && (
                                <div className="flex items-center rounded-full bg-blue-50 px-2 py-0.5">
                                    <span className="text-xs font-semibold text-blue-700">
                                        {feature.total_weighted_case}
                                        {feature.estimation_units && feature.estimation_units.length > 0 && (
                                            <span className="ml-0.5 text-xs text-blue-500">{feature.estimation_units[0]}</span>
                                        )}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="mt-3 flex justify-end" onPointerDown={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                        <Link href={route('features.show', feature.id)}>
                            <Button size="sm" variant="outline">
                                Details
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
export default function Board({ lanes, projects, plannings, filters }: BoardProps) {
    const breadcrumbs = [
        { title: 'Startseite', href: '/' },
        { title: 'Board Features', href: '#' },
    ];

    // Lokaler State für die Lane-Features
    const [laneState, setLaneState] = useState(lanes);
    const [activeFeatureId, setActiveFeatureId] = useState<number | null>(null);
    const [overLaneKey, setOverLaneKey] = useState<string | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string | null>(filters.status || null);
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(filters.project_id || null);
    const [selectedPlanningId, setSelectedPlanningId] = useState<number | null>(filters.planning_id || null);
    const [selectedClosedStatusDays, setSelectedClosedStatusDays] = useState<string>(filters.closed_status_days || '90');

    // Verbesserte Dnd-Kit Sensoren für zuverlässigere Drag-and-Drop-Erkennung
    const sensors = useSensors(
        useSensor(PointerSensor, {
            // Optimierte Einstellungen für Desktop und Touch-Geräte
            activationConstraint: {
                distance: 5, // Aktivierungsdistanz für präziseres Starten des Drag
                tolerance: 3, // Reduzierte Toleranz für genauere Bewegungserkennung
                delay: 0, // Keine Verzögerung für unmittelbare Reaktion
            },
        }),
    );

    // Drag-End-Handler
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        // Reset lokale States
        setActiveFeatureId(null);
        setOverLaneKey(null);

        // Prüfe, ob die Drag-Operation über einer Lane beendet wurde
        if (!over || !active) return;

        // Finde die Lane, in der das Feature jetzt liegt
        const sourceLaneIdx = laneState.findIndex((lane: Lane) => lane.features.some((f: Feature) => f.id === Number(active.id)));

        // Finde die Ziel-Lane anhand der Drop-ID
        const targetLaneIdx = laneState.findIndex((lane: Lane) => lane.key === over.id);

        // Überprüfe, ob die Operation gültig ist (Feature wird in eine andere Lane bewegt)
        if (sourceLaneIdx === -1 || targetLaneIdx === -1 || sourceLaneIdx === targetLaneIdx) return;

        // Finde das zu bewegende Feature
        const feature = laneState[sourceLaneIdx].features.find((f: Feature) => f.id === Number(active.id));
        if (!feature) return;

        // Erstelle neuen State mit dem aktualisierten Feature-Standort
        const newLaneState = [...laneState];

        // Entferne Feature aus Quell-Lane
        newLaneState[sourceLaneIdx] = {
            ...newLaneState[sourceLaneIdx],
            features: newLaneState[sourceLaneIdx].features.filter((f: Feature) => f.id !== feature.id),
        };

        // Füge Feature zur Ziel-Lane hinzu
        newLaneState[targetLaneIdx] = {
            ...newLaneState[targetLaneIdx],
            features: [...newLaneState[targetLaneIdx].features, feature],
        };

        // Aktualisiere lokalen State sofort für responsive UI
        setLaneState(newLaneState);

        // Status-Update an Backend senden - verwende den neuen Status aus newLaneState
        // Verwende axios statt Inertia für API-Anfragen
        axios
            .post(`/features/${feature.id}/status`, {
                status: newLaneState[targetLaneIdx].key,
            })
            .then(() => {
                // Erfolgreiche Aktualisierung - nichts zu tun, State ist bereits aktualisiert
            })
            .catch(() => {
                // Bei Fehler den State zurücksetzen
                setLaneState(laneState);
            });
    };

    // Drag-Start-Handler
    const handleDragStart = (event: DragStartEvent) => {
        setActiveFeatureId(Number(event.active.id));
    };

    // Drag-Over-Handler
    const handleDragOver = (event: DragOverEvent) => {
        // Sichere Typkonvertierung, da unsere Lane-Keys Strings sind
        setOverLaneKey(event.over?.id ? String(event.over.id) : null);
    };

    // Handler für die Änderung des Projekts
    const handleProjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newProjectId = e.target.value ? Number(e.target.value) : null;
        setSelectedProjectId(newProjectId);
        // Reset Planning Filter wenn Projekt wechselt
        setSelectedPlanningId(null);

        // Zum Board mit Projektfilter navigieren
        const params = new URLSearchParams();
        if (newProjectId) params.set('project_id', String(newProjectId));
        if (selectedClosedStatusDays) params.set('closed_status_days', selectedClosedStatusDays);
        const qs = params.toString();

        window.location.href = qs ? `/features/board?${qs}` : '/features/board';
    };

    const handlePlanningChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPlanningId = e.target.value ? Number(e.target.value) : null;
        setSelectedPlanningId(newPlanningId);
        const params = new URLSearchParams();
        if (selectedProjectId) params.set('project_id', String(selectedProjectId));
        if (newPlanningId) params.set('planning_id', String(newPlanningId));
        if (selectedClosedStatusDays) params.set('closed_status_days', selectedClosedStatusDays);
        const qs = params.toString();
        window.location.href = qs ? `/features/board?${qs}` : '/features/board';
    };

    const handleClosedStatusDaysChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newDays = e.target.value;
        setSelectedClosedStatusDays(newDays);
        const params = new URLSearchParams();
        if (selectedProjectId) params.set('project_id', String(selectedProjectId));
        if (selectedPlanningId) params.set('planning_id', String(selectedPlanningId));
        params.set('closed_status_days', newDays);
        const qs = params.toString();
        window.location.href = `/features/board?${qs}`;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="mx-auto max-w-7xl px-4">
                {/* Filterbereich */}
                <div className="mt-2 mb-6">
                    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="w-64">
                                <label htmlFor="projectFilter" className="mb-1 block text-sm font-medium text-gray-700">
                                    Projekt
                                </label>
                                <select
                                    id="projectFilter"
                                    className="block w-full rounded-md border-gray-300 py-2 pr-10 pl-3 text-base focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
                                    value={selectedProjectId || ''}
                                    onChange={handleProjectChange}
                                >
                                    <option value="">Alle Projekte</option>
                                    {projects.map((project) => (
                                        <option key={project.id} value={project.id}>
                                            {project.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-64">
                                <label htmlFor="planningFilter" className="mb-1 block text-sm font-medium text-gray-700">
                                    Planning (optional)
                                </label>
                                <select
                                    id="planningFilter"
                                    className="block w-full rounded-md border-gray-300 py-2 pr-10 pl-3 text-base focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
                                    value={selectedPlanningId || ''}
                                    onChange={handlePlanningChange}
                                >
                                    <option value="">Alle Plannings</option>
                                    {plannings.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.title}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="w-64">
                                <label htmlFor="closedStatusFilter" className="mb-1 block text-sm font-medium text-gray-700">
                                    Abgeschlossene Features
                                </label>
                                <select
                                    id="closedStatusFilter"
                                    className="block w-full rounded-md border-gray-300 py-2 pr-10 pl-3 text-base focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
                                    value={selectedClosedStatusDays}
                                    onChange={handleClosedStatusDaysChange}
                                >
                                    <option value="10">Älter als 10 Tage ausblenden</option>
                                    <option value="30">Älter als 30 Tage ausblenden</option>
                                    <option value="90">Älter als 90 Tage ausblenden</option>
                                    <option value="180">Älter als 180 Tage ausblenden</option>
                                    <option value="360">Älter als 360 Tage ausblenden</option>
                                    <option value="all">Alle anzeigen</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                >
                    <div className="flex gap-4 overflow-x-auto pt-2 pb-4">
                        {laneState.map((lane: Lane) => (
                            <LaneColumn key={lane.key} lane={lane} highlight={overLaneKey === lane.key || selectedStatus === lane.key}>
                                {lane.features.map((feature: Feature) => (
                                    <div key={feature.id} className="mb-2">
                                        <FeatureCard feature={feature} />
                                    </div>
                                ))}
                            </LaneColumn>
                        ))}
                    </div>
                    {/* DragOverlay für verbessertes visuelles Feedback */}
                    <DragOverlay
                        adjustScale={false}
                        zIndex={1000}
                        dropAnimation={{
                            duration: 200,
                            easing: 'ease',
                        }}
                    >
                        {activeFeatureId !== null &&
                            (() => {
                                const feature = laneState.flatMap((l: Lane) => l.features).find((f: Feature) => f.id === activeFeatureId);
                                if (!feature) return null;
                                return (
                                    <div className="pointer-events-none w-full max-w-[300px] min-w-[250px]">
                                        <Card className="border-2 border-blue-500 shadow-lg">
                                            <CardHeader className="p-3 pb-2">
                                                <CardTitle className="text-sm">
                                                    {feature.jira_key} - {feature.name}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent className="p-3 pt-0">
                                                {feature.project && <p className="text-muted-foreground text-xs">{feature.project.name}</p>}
                                            </CardContent>
                                        </Card>
                                    </div>
                                );
                            })()}
                    </DragOverlay>
                </DndContext>
            </div>
        </AppLayout>
    );
}
