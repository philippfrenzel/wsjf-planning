import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WorkflowStateBadge } from '@/components/workflow-state-badge';
import AppLayout from '@/layouts/app-layout';
import { Link, router } from '@inertiajs/react';

import ArchiveToggle from './components/ArchiveToggle';
import ComponentForm from './components/ComponentForm';
import ComponentItem from './components/ComponentItem';
import DependencyList from './components/DependencyList';
import EditComponentDialog from './components/EditComponentDialog';
import EstimationDialog from './components/EstimationDialog';
import MarkdownViewer from '@/components/markdown-viewer';
import MarkdownEditor from '@/components/markdown-editor';
import AiChatPanel from '@/components/ai-chat-panel';
import FeatureDetails from './components/FeatureDetails';
import { Comments } from '@/components/comments';
import { useConfirm } from '@/components/confirm-dialog-provider';
import { useComponentManagement } from '@/hooks/useComponentManagement';
import { useEstimationManagement } from '@/hooks/useEstimationManagement';
import { Edit2, LoaderCircle, MessageSquareText, FileText, Layers } from 'lucide-react';

interface EstimationHistory {
    id: number;
    field_name: string;
    old_value: number;
    new_value: number;
    changed_at: string;
    changer: { id: number; name: string };
}

interface Estimation {
    id: number;
    best_case: number;
    most_likely: number;
    worst_case: number;
    unit: string;
    notes?: string;
    creator: { id: number; name: string };
    created_at: string;
    weighted_estimate: number;
    standard_deviation: number;
    history: EstimationHistory[];
}

interface EstimationComponent {
    id: number;
    name: string;
    description?: string;
    created_at: string;
    creator: { id: number; name: string };
    estimations: Estimation[];
    latest_estimation?: Estimation;
    status: 'active' | 'archived';
}

interface FeaturePlanItem {
    id: number;
    title: string;
    description: string;
    status: 'open' | 'implemented' | 'obsolete';
    sort_order: number;
    creator?: { id: number; name: string };
    estimation_component?: {
        id: number;
        name: string;
        latest_estimation?: {
            best_case: number;
            most_likely: number;
            worst_case: number;
            unit: string;
            weighted_estimate: number;
        };
    };
}

interface DependencyItem {
    id: number;
    type: 'ermoeglicht' | 'verhindert' | 'bedingt' | 'ersetzt' | string;
    related?: { id: number; jira_key: string; name: string } | null;
    feature?: { id: number; jira_key: string; name: string } | null;
}

interface Feature {
    id: number;
    jira_key: string;
    name: string;
    description: string;
    requester?: { id: number; name: string } | null;
    project?: { id: number; name: string; jira_base_uri?: string } | null;
    estimation_components: EstimationComponent[];
    dependencies?: DependencyItem[];
    dependents?: DependencyItem[];
    type?: string;
    status_details?: {
        value: string;
        name: string;
        color: string;
    };
    specification?: {
        id: number;
        content: string;
        created_at: string;
    } | null;
    plans?: FeaturePlanItem[];
}

interface ShowProps {
    feature: Feature;
    auth: { user: { id: number; name: string } };
}

export default function Show({ feature, auth }: ShowProps) {
    // Breadcrumbs für Navigation
    const breadcrumbs = [
        { title: 'Startseite', href: '/' },
        { title: 'Features', href: route('features.index') },
        { title: feature.name, href: '#' },
    ];
    // Verwaltung der Komponenten mit dem Custom Hook
    const {
        showComponentForm,
        componentData,
        editComponentDialogOpen,
        editingComponent,
        editComponentData,
        showArchived,
        toggleComponentForm,
        handleComponentSubmit,
        openEditComponentDialog,
        handleEditComponentSubmit,
        archiveComponent,
        activateComponent,
        toggleArchivedVisibility,
        setComponentData,
        setEditComponentData,
        setEditComponentDialogOpen,
        isSaving: componentIsSaving,
    } = useComponentManagement(feature.id);

    // Verwaltung der Schätzungen mit dem Custom Hook
    const {
        estimationDialogOpen,
        estimationData,
        isEditing,
        openEstimationDialog,
        openEditEstimationDialog,
        handleEstimationSubmit,
        handleDeleteEstimation,
        setEstimationDialogOpen,
        updateEstimationData,
        isSaving: estimationIsSaving,
    } = useEstimationManagement(feature.id);

    const confirm = useConfirm();

    // Spec-Driven Development States
    const [isGeneratingSpec, setIsGeneratingSpec] = useState(false);
    const [isGeneratingPlans, setIsGeneratingPlans] = useState(false);
    const [isEditingSpec, setIsEditingSpec] = useState(false);
    const [specContent, setSpecContent] = useState(feature.specification?.content || '');
    const [editingPlanId, setEditingPlanId] = useState<number | null>(null);
    const [planEditContent, setPlanEditContent] = useState('');
    const [specChatOpen, setSpecChatOpen] = useState(false);

    // Sync specContent when Inertia refreshes props after spec generation
    useEffect(() => {
        if (feature.specification?.content) {
            setSpecContent(feature.specification.content);
        }
    }, [feature.specification?.content]);

    const handleGenerateSpec = () => {
        setIsGeneratingSpec(true);
        router.post(route('features.specification.store', feature.id), {}, {
            onFinish: () => setIsGeneratingSpec(false),
        });
    };

    const handleSaveSpec = () => {
        router.put(route('features.specification.update', feature.id), {
            content: specContent,
        }, {
            onSuccess: () => setIsEditingSpec(false),
        });
    };

    const handleGeneratePlans = () => {
        setIsGeneratingPlans(true);
        router.post(route('features.plans.generate', feature.id), {}, {
            onFinish: () => setIsGeneratingPlans(false),
        });
    };

    const handlePlanStatusChange = (planId: number, status: string) => {
        router.post(route('feature-plans.status', planId), { status });
    };

    const savePlanContent = (planId: number) => {
        router.put(route('feature-plans.update', planId), {
            description: planEditContent,
        }, {
            onSuccess: () => setEditingPlanId(null),
        });
    };

    const startEditingPlan = (plan: FeaturePlanItem) => {
        setEditingPlanId(plan.id);
        setPlanEditContent(plan.description);
    };

    const handleArchiveWithConfirm = async (componentId: number) => {
        const ok = await confirm({
            title: 'Komponente archivieren',
            description: 'Möchten Sie diese Komponente wirklich archivieren? Sie können sie später wieder aktivieren.',
            confirmLabel: 'Archivieren',
            cancelLabel: 'Abbrechen',
        });
        if (!ok) return;
        archiveComponent(componentId);
    };

    const handleDeleteEstimationWithConfirm = async (componentId: number, estimationId: number) => {
        const ok = await confirm({
            title: 'Schätzung löschen',
            description: 'Sind Sie sicher, dass Sie diese Schätzung löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.',
            confirmLabel: 'Löschen',
            cancelLabel: 'Abbrechen',
        });
        if (!ok) return;
        handleDeleteEstimation(componentId, estimationId);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-5">
                <Card className="flex h-full flex-1 flex-col">
                    <div className="flex items-center justify-between gap-4 px-6 pt-6">
                        <div className="min-w-0 flex-1">
                            {feature.jira_key && (
                                <p className="text-muted-foreground mb-1 text-sm font-medium">{feature.jira_key}</p>
                            )}
                            <h1 className="text-2xl font-bold tracking-tight break-words">{feature.name}</h1>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                            {feature.status_details && (
                                <WorkflowStateBadge statusDetails={feature.status_details} />
                            )}
                            <Link href={route('features.edit', feature.id)}>
                                <Button size="sm" variant="outline" className="inline-flex items-center gap-2 whitespace-nowrap">
                                    <Edit2 className="h-4 w-4" />
                                    Bearbeiten
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <CardContent>
                        <Tabs defaultValue="stammdaten" className="space-y-6">
                            <TabsList>
                                <TabsTrigger value="stammdaten">Stammdaten</TabsTrigger>
                                <TabsTrigger value="schaetzungen">Schätzungskomponenten</TabsTrigger>
                                <TabsTrigger value="spezifikation">
                                    <FileText className="mr-1 h-4 w-4" />
                                    Spezifikation
                                </TabsTrigger>
                                <TabsTrigger value="plankomponenten" disabled={!feature.plans?.length}>
                                    <Layers className="mr-1 h-4 w-4" />
                                    Plankomponenten {feature.plans?.length ? `(${feature.plans.length})` : ''}
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="stammdaten" className="space-y-6">
                                {/* Two-column layout: 60% left, 40% right */}
                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[60%_1fr]">
                                    {/* Left Column - Main Content */}
                                    <div className="space-y-6">
                                        {/* Feature-Details anzeigen */}
                                        <FeatureDetails
                                            jiraKey={feature.jira_key}
                                            jiraBaseUri={feature.project?.jira_base_uri}
                                            projectName={feature.project?.name}
                                            requesterName={feature.requester?.name}
                                            type={feature.type}
                                        />

                                        {/* Abhängigkeiten anzeigen */}
                                        <DependencyList dependencies={feature.dependencies} dependents={feature.dependents} />

                                        {/* Feature Beschreibung */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Beschreibung</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                {feature.description ? (
                                                    <MarkdownViewer content={feature.description} className="prose prose-sm max-w-none" />
                                                ) : (
                                                    <p className="text-muted-foreground">Keine Beschreibung vorhanden.</p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Right Column - Status and Comments */}
                                    <div className="space-y-6">
                                        {/* Kommentare */}
                                        <Comments
                                            entity={{
                                                type: 'App\\Models\\Feature',
                                                id: feature.id,
                                            }}
                                        />
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="schaetzungen" className="space-y-6">
                                <div className="pt-2">
                                    <div className="mb-4 flex items-center justify-between">
                                        <h3 className="text-lg font-medium">Schätzungskomponenten</h3>

                                        <div className="flex items-center gap-3">
                                            <Button
                                                onClick={toggleComponentForm}
                                                variant={showComponentForm ? 'cancel' : 'success'}
                                                size="sm"
                                                className="whitespace-nowrap"
                                            >
                                                {showComponentForm ? 'Abbrechen' : 'Komponente hinzufügen'}
                                            </Button>

                                            <ArchiveToggle showArchived={showArchived} toggleArchived={toggleArchivedVisibility} />
                                        </div>
                                    </div>

                                    {/* Formular zum Erstellen einer neuen Komponente */}
                                    {showComponentForm && (
                                        <ComponentForm
                                            componentData={componentData}
                                            onNameChange={(name) => setComponentData({ ...componentData, name })}
                                            onDescriptionChange={(description) => setComponentData({ ...componentData, description })}
                                            onSubmit={handleComponentSubmit}
                                        />
                                    )}

                                    {feature.estimation_components && feature.estimation_components.length > 0 ? (
                                        <div className="space-y-4">
                                            {feature.estimation_components
                                                .filter((component) => showArchived || component.status === 'active')
                                                .map((component) => (
                                                    <ComponentItem
                                                        key={component.id}
                                                        component={component}
                                                        onEdit={openEditComponentDialog}
                                                        onArchive={handleArchiveWithConfirm}
                                                        onActivate={activateComponent}
                                                        onAddEstimation={openEstimationDialog}
                                                        onEditEstimation={openEditEstimationDialog}
                                                        onDeleteEstimation={handleDeleteEstimationWithConfirm}
                                                    />
                                                ))}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground">Noch keine Komponenten vorhanden.</p>
                                    )}
                                </div>
                            </TabsContent>

                            {/* Spezifikation Tab */}
                            <TabsContent value="spezifikation" className="space-y-6">
                                <div className="pt-2">
                                    {!feature.specification ? (
                                        <Card>
                                            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                                <FileText className="text-muted-foreground mb-4 h-12 w-12" />
                                                <h3 className="mb-2 text-lg font-medium">Keine Spezifikation vorhanden</h3>
                                                <p className="text-muted-foreground mb-6 max-w-md text-sm">
                                                    Erstellen Sie eine KI-gestützte Spezifikation auf Basis der Feature-Beschreibung.
                                                </p>
                                                <Button onClick={handleGenerateSpec} disabled={isGeneratingSpec}>
                                                    {isGeneratingSpec ? (
                                                        <>
                                                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                                            Wird generiert…
                                                        </>
                                                    ) : (
                                                        'Spezifikation erstellen'
                                                    )}
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ) : (
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <p className="text-muted-foreground text-sm">
                                                    Erstellt am {new Date(feature.specification.created_at).toLocaleDateString('de-DE')}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setSpecChatOpen(true)}
                                                    >
                                                        <MessageSquareText className="mr-1 h-4 w-4" />
                                                        KI-Chat
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant={isEditingSpec ? 'cancel' : 'outline'}
                                                        onClick={() => {
                                                            if (isEditingSpec) {
                                                                setSpecContent(feature.specification?.content || '');
                                                            }
                                                            setIsEditingSpec(!isEditingSpec);
                                                        }}
                                                    >
                                                        {isEditingSpec ? 'Abbrechen' : 'Bearbeiten'}
                                                    </Button>
                                                    {isEditingSpec && (
                                                        <Button size="sm" variant="success" onClick={handleSaveSpec}>
                                                            Speichern
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        onClick={handleGeneratePlans}
                                                        disabled={isGeneratingPlans}
                                                    >
                                                        {isGeneratingPlans ? (
                                                            <>
                                                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                                                Wird generiert…
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Layers className="mr-1 h-4 w-4" />
                                                                Plan erstellen
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>

                                            <Card>
                                                <CardContent className="pt-6">
                                                    {isEditingSpec ? (
                                                        <MarkdownEditor
                                                            value={specContent}
                                                            onChange={setSpecContent}
                                                            height={400}
                                                        />
                                                    ) : (
                                                        <MarkdownViewer content={specContent} className="prose prose-sm max-w-none" />
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </div>
                                    )}
                                </div>
                            </TabsContent>

                            {/* Plankomponenten Tab */}
                            <TabsContent value="plankomponenten" className="space-y-6">
                                <div className="pt-2">
                                    {feature.plans && feature.plans.length > 0 ? (
                                        <div className="space-y-4">
                                            {feature.plans.map((plan) => (
                                                <Card key={plan.id}>
                                                    <CardHeader>
                                                        <div className="flex items-center justify-between">
                                                            <CardTitle className="text-lg">{plan.title}</CardTitle>
                                                            <div className="flex items-center gap-2">
                                                                <Badge
                                                                    variant={plan.status === 'obsolete' ? 'secondary' : 'outline'}
                                                                    className={plan.status === 'implemented' ? 'border-emerald-500 text-emerald-700' : ''}
                                                                >
                                                                    {plan.status === 'open' ? 'Offen' : plan.status === 'implemented' ? 'Implementiert' : 'Obsolet'}
                                                                </Badge>
                                                                <Select value={plan.status} onValueChange={(value) => handlePlanStatusChange(plan.id, value)}>
                                                                    <SelectTrigger className="h-8 w-[140px]">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="open">Offen</SelectItem>
                                                                        <SelectItem value="implemented">Implementiert</SelectItem>
                                                                        <SelectItem value="obsolete">Obsolet</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent>
                                                        {editingPlanId === plan.id ? (
                                                            <div className="space-y-2">
                                                                <MarkdownEditor
                                                                    value={planEditContent}
                                                                    onChange={setPlanEditContent}
                                                                    height={200}
                                                                />
                                                                <div className="flex gap-2">
                                                                    <Button size="sm" onClick={() => savePlanContent(plan.id)}>Speichern</Button>
                                                                    <Button size="sm" variant="cancel" onClick={() => setEditingPlanId(null)}>Abbrechen</Button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div
                                                                className="cursor-pointer rounded-md p-2 transition-colors hover:bg-muted/50"
                                                                onClick={() => startEditingPlan(plan)}
                                                            >
                                                                <MarkdownViewer content={plan.description} className="prose prose-sm max-w-none" />
                                                            </div>
                                                        )}

                                                        {plan.estimation_component?.latest_estimation && (
                                                            <div className="mt-4 rounded-lg bg-muted/50 p-3">
                                                                <p className="mb-1 text-sm font-medium">
                                                                    Schätzung ({plan.estimation_component.latest_estimation.unit || 'Story Points'})
                                                                </p>
                                                                <div className="flex gap-4 text-sm">
                                                                    <span>Best: {plan.estimation_component.latest_estimation.best_case}</span>
                                                                    <span>Likely: {plan.estimation_component.latest_estimation.most_likely}</span>
                                                                    <span>Worst: {plan.estimation_component.latest_estimation.worst_case}</span>
                                                                    <span className="font-medium">
                                                                        Ø {plan.estimation_component.latest_estimation.weighted_estimate.toFixed(1)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : (
                                        <Card>
                                            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                                <Layers className="text-muted-foreground mb-4 h-12 w-12" />
                                                <h3 className="mb-2 text-lg font-medium">Keine Plankomponenten vorhanden</h3>
                                                <p className="text-muted-foreground max-w-md text-sm">
                                                    Erstellen Sie zuerst eine Spezifikation, um daraus Plankomponenten generieren zu können.
                                                </p>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

                {/* Dialog zum Erstellen oder Bearbeiten einer Schätzung */}
                <EstimationDialog
                    open={estimationDialogOpen}
                    onOpenChange={setEstimationDialogOpen}
                    estimationData={estimationData}
                    isEditing={isEditing}
                    onBestCaseChange={(value) => updateEstimationData('best_case', value)}
                    onMostLikelyChange={(value) => updateEstimationData('most_likely', value)}
                    onWorstCaseChange={(value) => updateEstimationData('worst_case', value)}
                    onUnitChange={(value) => updateEstimationData('unit', value)}
                    onNotesChange={(value) => updateEstimationData('notes', value)}
                    onSubmit={handleEstimationSubmit}
                    processing={estimationIsSaving}
                />

                {/* Dialog zum Bearbeiten einer Komponente */}
                <EditComponentDialog
                    open={editComponentDialogOpen}
                    onOpenChange={setEditComponentDialogOpen}
                    componentData={editComponentData}
                    onNameChange={(name) => setEditComponentData({ ...editComponentData, name })}
                    onDescriptionChange={(description) => setEditComponentData({ ...editComponentData, description })}
                    onSubmit={handleEditComponentSubmit}
                    processing={componentIsSaving}
                />

                {/* KI-Chat für Spezifikation */}
                <AiChatPanel
                    open={specChatOpen}
                    onOpenChange={setSpecChatOpen}
                    featureName={feature.name}
                    projectId={feature.project?.id?.toString() || ''}
                    currentDescription={specContent}
                    onApplyDescription={(md) => {
                        setSpecContent(md);
                        setIsEditingSpec(true);
                    }}
                />
            </div>
        </AppLayout>
    );
}
