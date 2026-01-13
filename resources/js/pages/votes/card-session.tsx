import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { closestCenter, DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import React, { useEffect, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Inertia } from '@inertiajs/inertia';
import { usePage } from '@inertiajs/react';
import { ArrowDownCircle, CheckCircle2, HelpCircle, MoveHorizontal } from 'lucide-react';

// Typdefinitionen
interface Feature {
    id: number;
    jira_key: string;
    name: string;
    description?: string;
    project?: {
        jira_base_uri?: string | null;
    } | null;
}

interface Planning {
    id: number;
    title: string;
    project_id: number;
}

interface VoteValue {
    [key: string]: string; // key: featureId_type, value: string (number)
}

interface SessionProps {
    planning: Planning;
    features: Feature[];
    types: string[];
    existingVotes: Record<string, { value: number }>;
    user: { id: number; name: string };
}

// Erweiterte Typen können hier bei Bedarf hinzugefügt werden

// Hilfsfunktion zum Übersetzen der Kategorie-Namen
const getCategoryLabel = (category: string): string => {
    switch (category) {
        case 'BusinessValue':
            return 'Business Value';
        case 'TimeCriticality':
            return 'Zeitkritikalität';
        case 'RiskOpportunity':
            return 'Risiko/Chance';
        default:
            return category;
    }
};

// Feature Karte (ohne Sortierbarkeit)
const FeatureCard: React.FC<{
    feature: Feature;
    position: number | null;
}> = ({ feature, position }) => {
    const [showDetails, setShowDetails] = useState(false);

    return (
        <>
            <Card className="relative mb-4 transition-shadow hover:shadow-md">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <div className="cursor-pointer text-sm font-medium text-blue-600" onClick={() => setShowDetails(true)}>
                            {feature.jira_key}
                        </div>
                        {position !== null && (
                            <Badge variant="secondary" className="ml-2">
                                Position {position}
                            </Badge>
                        )}
                    </div>
                    <CardTitle className="mt-1 text-base leading-tight">{feature.name}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-2">
                    <div className="text-muted-foreground line-clamp-2 text-sm">
                        {feature.description ? (
                            <div dangerouslySetInnerHTML={{ __html: feature.description.substring(0, 100) + '...' }} />
                        ) : (
                            <p>Keine Beschreibung vorhanden.</p>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between pt-0">
                    <Button variant="ghost" size="sm" className="text-xs" onClick={() => setShowDetails(true)}>
                        <HelpCircle className="mr-1 h-3 w-3" />
                        Details
                    </Button>
                </CardFooter>
            </Card>

            {/* Details-Dialog */}
            <Dialog open={showDetails} onOpenChange={setShowDetails}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="space-y-1">
                            <span>
                                {feature.project?.jira_base_uri ? (
                                    <a
                                        href={`${feature.project.jira_base_uri}${feature.jira_key}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                        {feature.jira_key}
                                    </a>
                                ) : (
                                    feature.jira_key
                                )}
                                {feature.name ? `: ${feature.name}` : ''}
                            </span>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="prose prose-sm max-w-none overflow-auto">
                        {feature.description ? (
                            <div dangerouslySetInnerHTML={{ __html: feature.description }} />
                        ) : (
                            <p>Keine Beschreibung vorhanden.</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button onClick={() => setShowDetails(false)}>Schließen</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

// Sortierbare Feature-Karte
const SortableFeatureCard: React.FC<{
    feature: Feature;
    position: number | null;
    id: string;
    onMoveToSorted?: () => void;
    inUnsortedStack?: boolean;
}> = ({ feature, position, id, onMoveToSorted, inUnsortedStack = false }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    const [showDetails, setShowDetails] = useState(false);

    const style = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        transition,
    };

    return (
        <>
            <div ref={setNodeRef} style={style} className="mb-4" {...attributes} {...listeners}>
                <Card className="relative transition-shadow hover:shadow-md">
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div className="cursor-pointer text-sm font-medium text-blue-600" onClick={() => setShowDetails(true)}>
                                {feature.jira_key}
                            </div>
                            {position !== null && (
                                <Badge variant="secondary" className="ml-2">
                                    Position {position}
                                </Badge>
                            )}
                        </div>
                        <CardTitle className="mt-1 text-base leading-tight">{feature.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0 pb-2">
                        <div className="text-muted-foreground line-clamp-2 text-sm">
                            {feature.description ? (
                                <div dangerouslySetInnerHTML={{ __html: feature.description.substring(0, 100) + '...' }} />
                            ) : (
                                <p>Keine Beschreibung vorhanden.</p>
                            )}
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between pt-0">
                        <Button variant="ghost" size="sm" className="text-xs" onClick={() => setShowDetails(true)}>
                            <HelpCircle className="mr-1 h-3 w-3" />
                            Details
                        </Button>

                        {inUnsortedStack && onMoveToSorted && (
                            <Button variant="outline" size="sm" className="ml-2 text-xs" onClick={onMoveToSorted}>
                                <ArrowDownCircle className="mr-1 h-3 w-3" />
                                Zur Liste hinzufügen
                            </Button>
                        )}
                    </CardFooter>
                </Card>
            </div>

            {/* Details-Dialog */}
            <Dialog open={showDetails} onOpenChange={setShowDetails}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="space-y-1">
                            <span>
                                {feature.project?.jira_base_uri ? (
                                    <a
                                        href={`${feature.project.jira_base_uri}${feature.jira_key}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800 hover:underline"
                                    >
                                        {feature.jira_key}
                                    </a>
                                ) : (
                                    feature.jira_key
                                )}
                                {feature.name ? `: ${feature.name}` : ''}
                            </span>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="prose prose-sm max-w-none overflow-auto">
                        {feature.description ? (
                            <div dangerouslySetInnerHTML={{ __html: feature.description }} />
                        ) : (
                            <p>Keine Beschreibung vorhanden.</p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button onClick={() => setShowDetails(false)}>Schließen</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

// Tab-Inhalt Komponente für jede Kategorie
const CategoryTabContent: React.FC<{
    type: string;
    categorizedFeatures: {
        [category: string]: {
            unsorted: Feature[];
            sorted: Feature[];
        };
    };
    onDragStart: (event: DragStartEvent) => void;
    onDragEnd: (event: DragEndEvent) => void;
    draggingFeature: Feature | null;
}> = ({ type, categorizedFeatures, onDragStart, onDragEnd, draggingFeature }) => {
    // Wir verwenden die sensors von der übergeordneten Komponente

    // Zustand für die Detailanzeige
    const [showDetails, setShowDetails] = useState<number | null>(null);

    const detailFeature = showDetails !== null ? (categorizedFeatures[type]?.unsorted.find((f) => f.id === showDetails) ?? null) : null;

    // State nicht nötig, da wir direkt die onDragEnd-Funktion aufrufen
    const handleMoveToSorted = (featureId: number) => {
        // Feature aus der unsorted-Liste finden
        const feature = categorizedFeatures[type]?.unsorted.find((f) => f.id === featureId);

        if (!feature) return;

        // Event simulieren für die DragEnd-Funktion
        const moveEvent = {
            active: { id: `feature-${featureId}` },
            over: { id: 'sorted' },
        } as unknown as DragEndEvent;

        // DragEnd-Funktion mit simuliertem Event aufrufen
        onDragEnd(moveEvent);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <span>Bewertung: {getCategoryLabel(type)}</span>
                    {categorizedFeatures[type]?.unsorted.length > 0 && (
                        <Badge variant="outline" className="ml-2 border-amber-200 bg-amber-50 text-amber-800">
                            {categorizedFeatures[type]?.unsorted.length} unbewertete Features
                        </Badge>
                    )}
                    {categorizedFeatures[type]?.unsorted.length === 0 && categorizedFeatures[type]?.sorted.length > 0 && (
                        <Badge variant="outline" className="ml-2 border-green-200 bg-green-50 text-green-800">
                            Alle Features bewertet
                        </Badge>
                    )}
                </CardTitle>
                <CardDescription>Fügen Sie Features vom Stapel in die Bewertungsreihe hinzu und ordnen Sie sie nach Priorität an.</CardDescription>
            </CardHeader>
            <CardContent>
                <DndContext collisionDetection={closestCenter} onDragStart={onDragStart} onDragEnd={onDragEnd} modifiers={[restrictToVerticalAxis]}>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <h3 className="mb-2 text-lg font-medium">Unbewertete Features</h3>
                            <div
                                id="unsorted"
                                data-droppable-id="unsorted"
                                className={`min-h-[300px] rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 ${
                                    (categorizedFeatures[type]?.unsorted || []).length === 0 ? 'flex items-center justify-center' : ''
                                }`}
                            >
                                {(categorizedFeatures[type]?.unsorted || []).length > 0 ? (
                                    (categorizedFeatures[type]?.unsorted || []).map((feature) => (
                                        <div key={feature.id} className="mb-4">
                                            <Card className="relative transition-shadow hover:shadow-md">
                                                <CardHeader className="pb-2">
                                                    <div className="flex items-center justify-between">
                                                        <div
                                                            className="cursor-pointer text-sm font-medium text-blue-600"
                                                            onClick={() => (setShowDetails ? setShowDetails(feature.id) : null)}
                                                        >
                                                            {feature.jira_key}
                                                        </div>
                                                    </div>
                                                    <CardTitle className="mt-1 text-base leading-tight">{feature.name}</CardTitle>
                                                </CardHeader>
                                                <CardContent className="pt-0 pb-2">
                                                    <div className="text-muted-foreground line-clamp-2 text-sm">
                                                        {feature.description ? (
                                                            <div
                                                                dangerouslySetInnerHTML={{ __html: feature.description.substring(0, 100) + '...' }}
                                                            />
                                                        ) : (
                                                            <p>Keine Beschreibung vorhanden.</p>
                                                        )}
                                                    </div>
                                                </CardContent>
                                                <CardFooter className="flex justify-between pt-0">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-xs"
                                                        onClick={() => (setShowDetails ? setShowDetails(feature.id) : null)}
                                                    >
                                                        <HelpCircle className="mr-1 h-3 w-3" />
                                                        Details
                                                    </Button>

                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="ml-2 text-xs"
                                                        onClick={() => handleMoveToSorted(feature.id)}
                                                    >
                                                        <ArrowDownCircle className="mr-1 h-3 w-3" />
                                                        Zur Liste hinzufügen
                                                    </Button>
                                                </CardFooter>
                                            </Card>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-muted-foreground">
                                        <CheckCircle2 className="mx-auto mb-2 h-12 w-12 text-green-500" />
                                        <p>Alle Features wurden bewertet</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div>
                            <h3 className="mb-2 text-lg font-medium">Prioritätsreihenfolge</h3>
                            <SortableContext
                                items={(categorizedFeatures[type]?.sorted || []).map((f) => `feature-${f.id}`)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div
                                    id="sorted"
                                    data-droppable-id="sorted"
                                    className={`min-h-[300px] rounded-lg border border-slate-200 bg-slate-50 p-4 ${
                                        (categorizedFeatures[type]?.sorted || []).length === 0 ? 'flex items-center justify-center' : ''
                                    }`}
                                >
                                    {(categorizedFeatures[type]?.sorted || []).length > 0 ? (
                                        (categorizedFeatures[type]?.sorted || []).map((feature, index) => (
                                            <SortableFeatureCard
                                                key={feature.id}
                                                feature={feature}
                                                id={`feature-${feature.id}`}
                                                position={index + 1}
                                            />
                                        ))
                                    ) : (
                                        <div className="text-center text-muted-foreground">
                                            <ArrowDownCircle className="mx-auto mb-2 h-12 w-12 text-blue-500" />
                                            <p>Fügen Sie Features hinzu, um sie zu bewerten</p>
                                        </div>
                                    )}
                                </div>
                            </SortableContext>
                        </div>
                    </div>

                    <DragOverlay>
                        {draggingFeature ? (
                            <div className="transform-origin-top-left opacity-80 shadow-lg">
                                <FeatureCard feature={draggingFeature} position={null} />
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>

                {/* Details-Dialog für unbewertete Features */}
                {showDetails && detailFeature && (
                    <Dialog open={showDetails !== null} onOpenChange={() => setShowDetails(null)}>
                        <DialogContent className="max-w-3xl">
                            <DialogHeader>
                                <DialogTitle className="space-y-1">
                                    <span>
                                        {detailFeature.project?.jira_base_uri ? (
                                            <a
                                                href={`${detailFeature.project.jira_base_uri}${detailFeature.jira_key}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 hover:underline"
                                            >
                                                {detailFeature.jira_key}
                                            </a>
                                        ) : (
                                            detailFeature.jira_key
                                        )}
                                        {detailFeature.name ? `: ${detailFeature.name}` : ''}
                                    </span>
                                </DialogTitle>
                            </DialogHeader>

                            <div className="prose prose-sm max-w-none overflow-auto">
                                {detailFeature.description ? (
                                    <div dangerouslySetInnerHTML={{ __html: detailFeature.description }} />
                                ) : (
                                    <p>Keine Beschreibung vorhanden.</p>
                                )}
                            </div>

                            <DialogFooter>
                                <Button onClick={() => setShowDetails(null)}>Schließen</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </CardContent>
        </Card>
    );
};

export default function CardVoteSession({ planning, features, types, existingVotes, user }: SessionProps) {
    const { props } = usePage();
    const [draggingFeature, setDraggingFeature] = useState<Feature | null>(null);

    // Breadcrumbs definieren
    const breadcrumbs = [
        { title: 'Startseite', href: route('home') },
        { title: 'Plannings', href: route('plannings.index') },
        { title: planning?.title || 'Abstimmung', href: route('votes.session', planning.id) },
        { title: 'Karten-Ansicht', href: route('votes.card-session', planning.id) },
    ];

    // Zustand für die Votes
    const [votes, setVotes] = useState<VoteValue>(() => {
        const initial: VoteValue = {};
        Object.entries(existingVotes).forEach(([key, vote]) => {
            initial[key] = vote.value.toString();
        });
        return initial;
    });

    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const initialLoad = useRef(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    // Zustand für die aktuelle Kategorie
    const [activeCategory, setActiveCategory] = useState<string>(types[0]);

    // Modal-Status für Erfolgsmeldungen
    const [open, setOpen] = useState<boolean>(props.success !== undefined && props.success !== null);

    // Kategorisierte Features
    const [categorizedFeatures, setCategorizedFeatures] = useState<{
        [category: string]: {
            unsorted: Feature[];
            sorted: Feature[];
        };
    }>(() => {
        const initial: { [category: string]: { unsorted: Feature[]; sorted: Feature[] } } = {};
        types.forEach((type) => {
            initial[type] = { unsorted: [], sorted: [] };
        });
        return initial;
    });

    // Initialisiert die kategorisierten Features
    useEffect(() => {
        const categorized: {
            [category: string]: {
                unsorted: Feature[];
                sorted: Feature[];
            };
        } = {};

        // Für jede Kategorie, Feature als unsorted oder sorted klassifizieren
        types.forEach((type) => {
            const unsortedFeatures: Feature[] = [];
            const sortedFeatures: Feature[] = [];

            features.forEach((feature) => {
                const voteKey = `${feature.id}_${type}`;
                const hasVote = votes[voteKey] !== undefined;

                if (hasVote) {
                    // Bereits bewertet
                    sortedFeatures.push(feature);
                } else {
                    // Noch nicht bewertet
                    unsortedFeatures.push(feature);
                }
            });

            // Sortierte Features nach Wert sortieren
            sortedFeatures.sort((a, b) => {
                const aValue = parseInt(votes[`${a.id}_${type}`] || '0');
                const bValue = parseInt(votes[`${b.id}_${type}`] || '0');
                return aValue - bValue; // Aufsteigend sortieren
            });

            categorized[type] = {
                unsorted: unsortedFeatures,
                sorted: sortedFeatures,
            };
        });

        setCategorizedFeatures(categorized);
    }, [features, types, votes]);

    // Handling für Drag-Start
    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        if (!active) return;

        console.log('Drag Start:', active);

        const idStr = active.id.toString();
        if (idStr.startsWith('feature-')) {
            const featureId = parseInt(idStr.replace('feature-', ''));
            const feature = features.find((f) => f.id === featureId);

            if (feature) {
                setDraggingFeature(feature);
            }
        }
    };

    // Handling für Drag-End
    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setDraggingFeature(null);

        if (!active) return;
        if (!over && typeof event.over === 'undefined') {
            // Wenn kein over-Wert vorhanden ist, könnte dies ein Button-Click sein
            // Wir behandeln es als Verschiebung zum sorted-Container
            const featureId = parseInt(active.id.toString().replace('feature-', ''));
            const feature = features.find((f) => f.id === featureId);
            if (!feature) return;

            // Prüfen, ob das Feature bereits sortiert ist
            const inSortedList = categorizedFeatures[activeCategory]?.sorted.some((f) => f.id === featureId);
            if (inSortedList) return; // Bereits sortiert, nichts tun

            // Feature vom unsorted zum sorted Container verschieben
            const updatedCategories = { ...categorizedFeatures };
            const currentCategory = updatedCategories[activeCategory];

            // Feature aus unsorted entfernen
            const newUnsorted = currentCategory.unsorted.filter((f) => f.id !== featureId);

            // Feature am Ende der sortierten Liste hinzufügen
            const newSorted = [...currentCategory.sorted, feature];

            // Votes aktualisieren
            const updatedVotes = { ...votes };
            newSorted.forEach((f, index) => {
                const voteKey = `${f.id}_${activeCategory}`;
                updatedVotes[voteKey] = (index + 1).toString();
            });

            setVotes(updatedVotes);
            updatedCategories[activeCategory] = {
                unsorted: newUnsorted,
                sorted: newSorted,
            };

            setCategorizedFeatures(updatedCategories);
            return;
        }

        if (!over) return;

        console.log('Drag End:', { active, over });

        // Feature-ID aus der aktiven ID extrahieren
        const featureId = parseInt(active.id.toString().replace('feature-', ''));
        const feature = features.find((f) => f.id === featureId);
        if (!feature) return;

        // Bestimmen der Container-IDs (sorted oder unsorted)
        let sourceContainerId: string = 'unsorted';
        let destContainerId: string = 'unsorted';

        // Überprüfen, ob das Feature aktuell sortiert oder unsortiert ist
        const inSortedList = categorizedFeatures[activeCategory]?.sorted.some((f) => f.id === featureId);
        if (inSortedList) {
            sourceContainerId = 'sorted';
        }

        // Bestimmen des Ziel-Containers über data-droppable-id
        const getContainerFromNode = (node: HTMLElement | null): string | null => {
            if (!node) return null;

            // Prüfen, ob das Element selbst ein Container ist
            if (node.dataset && node.dataset.droppableId) {
                return node.dataset.droppableId;
            }

            // Prüfen, ob ein Elternelement ein Container ist
            let parent = node.parentElement;
            while (parent) {
                if (parent.dataset && parent.dataset.droppableId) {
                    return parent.dataset.droppableId;
                }
                parent = parent.parentElement;
            }

            return null;
        };

        // Bestimmen des Ziel-Containers
        if (over.data?.current?.droppableContainer) {
            destContainerId = over.data.current.droppableContainer.id.toString();
        } else if (over.id === 'sorted' || over.id === 'unsorted') {
            // Direkt auf Container fallen gelassen
            destContainerId = over.id.toString();
        } else {
            // Fallback: DOM-Element inspizieren
            const overNode = over.data?.current?.node;
            const containerType = getContainerFromNode(overNode);
            if (containerType) {
                destContainerId = containerType;
            } else if (typeof over.id === 'string' && over.id.startsWith('feature-')) {
                // Wenn über einem Feature, prüfen, in welchem Container dieses ist
                const overFeatureId = parseInt(over.id.toString().replace('feature-', ''));
                const overFeatureInSorted = categorizedFeatures[activeCategory]?.sorted.some((f) => f.id === overFeatureId);
                destContainerId = overFeatureInSorted ? 'sorted' : 'unsorted';
            }
        }

        // Wenn Quelle und Ziel unterschiedlich sind (Container-Wechsel)
        if (sourceContainerId !== destContainerId) {
            const updatedCategories = { ...categorizedFeatures };
            const currentCategory = updatedCategories[activeCategory];

            if (destContainerId === 'sorted' && sourceContainerId === 'unsorted') {
                // Feature von unsorted nach sorted bewegen
                const newUnsorted = currentCategory.unsorted.filter((f) => f.id !== featureId);
                const newSorted = [...currentCategory.sorted];

                // Am Ende der sortierten Liste hinzufügen
                newSorted.push(feature);

                // Aktualisieren der Votes für alle sortierten Features
                const updatedVotes = { ...votes };
                newSorted.forEach((f, index) => {
                    const voteKey = `${f.id}_${activeCategory}`;
                    updatedVotes[voteKey] = (index + 1).toString();
                });

                setVotes(updatedVotes);
                updatedCategories[activeCategory] = {
                    unsorted: newUnsorted,
                    sorted: newSorted,
                };
            } else if (destContainerId === 'unsorted' && sourceContainerId === 'sorted') {
                // Feature von sorted nach unsorted bewegen
                const newSorted = currentCategory.sorted.filter((f) => f.id !== featureId);
                const newUnsorted = [...currentCategory.unsorted, feature];

                // Vote für das Feature entfernen
                const updatedVotes = { ...votes };
                delete updatedVotes[`${featureId}_${activeCategory}`];

                // Neu nummerieren der sortierten Features
                newSorted.forEach((f, index) => {
                    const voteKey = `${f.id}_${activeCategory}`;
                    updatedVotes[voteKey] = (index + 1).toString();
                });

                setVotes(updatedVotes);
                updatedCategories[activeCategory] = {
                    unsorted: newUnsorted,
                    sorted: newSorted,
                };
            }

            setCategorizedFeatures(updatedCategories);
        }
        // Umordnung innerhalb der sortierten Liste
        else if (
            sourceContainerId === 'sorted' &&
            destContainerId === 'sorted' &&
            typeof over.id === 'string' &&
            over.id.startsWith('feature-') &&
            over.id !== active.id
        ) {
            const overFeatureId = parseInt(over.id.toString().replace('feature-', ''));
            const updatedCategories = { ...categorizedFeatures };
            const currentCategory = updatedCategories[activeCategory];

            const oldIndex = currentCategory.sorted.findIndex((f) => f.id === featureId);
            const newIndex = currentCategory.sorted.findIndex((f) => f.id === overFeatureId);

            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
                // Feature in der sortierten Liste umordnen
                const newSorted = [...currentCategory.sorted];
                const [movedItem] = newSorted.splice(oldIndex, 1);
                newSorted.splice(newIndex, 0, movedItem);

                // Votes aktualisieren
                const updatedVotes = { ...votes };
                newSorted.forEach((f, index) => {
                    const voteKey = `${f.id}_${activeCategory}`;
                    updatedVotes[voteKey] = (index + 1).toString();
                });

                setVotes(updatedVotes);
                updatedCategories[activeCategory].sorted = newSorted;
                setCategorizedFeatures(updatedCategories);
            }
        }
    };

    // Form-Submission
    const saveVotes = (next?: () => void) => {
        setIsSaving(true);
        setSaveError(null);

        Inertia.post(
            route('votes.session.store', planning.id),
            { votes },
            {
                preserveScroll: true,
                preserveState: true,
                replace: true,
                onFinish: () => {
                    setIsSaving(false);
                    next?.();
                },
                onError: () => {
                    setIsSaving(false);
                    setSaveError('Speichern fehlgeschlagen – bitte erneut versuchen.');
                },
            },
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (saveTimer.current) {
            clearTimeout(saveTimer.current);
            saveTimer.current = null;
        }
        saveVotes();
    };

    // Modal schließen
    const handleCloseModal = () => setOpen(false);

    // Wechsel zwischen Kategorien
    const handleCategoryChange = (category: string) => {
        setActiveCategory(category);
    };

    // Wechsel zur Standard-Tabellen-Ansicht
    const switchToStandardView = () => {
        if (saveTimer.current) {
            clearTimeout(saveTimer.current);
            saveTimer.current = null;
        }
        saveVotes(() => Inertia.get(route('votes.session', planning.id)));
    };

    useEffect(() => {
        if (initialLoad.current) {
            initialLoad.current = false;
            return;
        }

        if (saveTimer.current) {
            clearTimeout(saveTimer.current);
        }

        saveTimer.current = setTimeout(() => saveVotes(), 1000);

        return () => {
            if (saveTimer.current) {
                clearTimeout(saveTimer.current);
            }
        };
    }, [votes]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            {/* Erfolgsmeldung */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Erfolg</DialogTitle>
                    </DialogHeader>
                    <div>{props.success ? String(props.success) : 'Änderungen gespeichert'}</div>
                    <DialogFooter>
                        <Button onClick={handleCloseModal}>OK</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="mx-auto mt-8 w-full px-4 md:px-10">
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                            <div className="mb-4 md:mb-0">
                                <CardTitle className="text-xl">
                                    <span>Abstimmung für Planning: {planning.title}</span>
                                </CardTitle>
                                <CardDescription>Angemeldet als: {user.name}</CardDescription>
                            </div>
                            <div className="flex space-x-2">
                                <div className="text-muted-foreground flex items-center px-2 text-xs">
                                    {isSaving ? 'Speichern...' : saveError || 'Autosave aktiv'}
                                </div>
                                <Button variant="outline" onClick={switchToStandardView}>
                                    <MoveHorizontal className="mr-2 h-4 w-4" />
                                    Zur Tabellen-Ansicht
                                </Button>
                                <Button onClick={handleSubmit}>
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Abstimmung speichern
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                <div className="mb-6">
                    <Tabs value={activeCategory} onValueChange={handleCategoryChange}>
                        <TabsList className="mb-4">
                            {types.map((type) => (
                                <TabsTrigger key={type} value={type} className="px-4 py-2">
                                    {getCategoryLabel(type)}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {types.map((type) => (
                            <TabsContent key={type} value={type} className="mt-0">
                                <CategoryTabContent
                                    type={type}
                                    categorizedFeatures={categorizedFeatures}
                                    onDragStart={handleDragStart}
                                    onDragEnd={handleDragEnd}
                                    draggingFeature={draggingFeature}
                                />
                            </TabsContent>
                        ))}
                    </Tabs>
                </div>
            </div>
        </AppLayout>
    );
}
