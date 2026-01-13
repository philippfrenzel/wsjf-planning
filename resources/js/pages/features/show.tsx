import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { Link } from '@inertiajs/react';

import ArchiveToggle from './components/ArchiveToggle';
import ComponentForm from './components/ComponentForm';
import ComponentItem from './components/ComponentItem';
import EditComponentDialog from './components/EditComponentDialog';
import EstimationDialog from './components/EstimationDialog';
import FeatureDescription from './components/FeatureDescription';
import FeatureDetails from './components/FeatureDetails';
import FeatureHeader from './components/FeatureHeader';

import { Comments } from '@/components/comments';
import { useComponentManagement } from '@/hooks/useComponentManagement';
import { useEstimationManagement } from '@/hooks/useEstimationManagement';
import { Edit2 } from 'lucide-react';

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
    project?: { id: number; name: string } | null;
    estimation_components: EstimationComponent[];
    dependencies?: DependencyItem[];
    dependents?: DependencyItem[];
    status_details?: {
        value: string;
        name: string;
        color: string;
    };
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
    } = useEstimationManagement(feature.id);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-5">
                <Card className="flex h-full flex-1 flex-col gap-4 rounded-xl p-5">
                    <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <FeatureHeader featureName={feature.name} />
                        </div>
                        <Link href={route('features.edit', feature.id)} className="shrink-0">
                            <Button size="sm" variant="outline" className="inline-flex items-center gap-2 whitespace-nowrap">
                                <Edit2 className="h-4 w-4" />
                                Bearbeiten
                            </Button>
                        </Link>
                    </div>

                    <CardContent>
                        <Tabs defaultValue="stammdaten" className="space-y-6">
                            <TabsList className="w-full">
                                <TabsTrigger value="stammdaten">Stammdaten</TabsTrigger>
                                <TabsTrigger value="schaetzungen">Schätzungskomponenten</TabsTrigger>
                            </TabsList>

                            <TabsContent value="stammdaten" className="space-y-6">
                                {/* Two-column layout: 60% left, 40% right */}
                                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[60%_1fr]">
                                    {/* Left Column - Main Content */}
                                    <div className="space-y-6">
                                        {/* Feature-Details anzeigen */}
                                        <FeatureDetails
                                            jiraKey={feature.jira_key}
                                            projectName={feature.project?.name}
                                            requesterName={feature.requester?.name}
                                        />

                                        {/* Abhängigkeiten anzeigen */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Abhängigkeiten</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                {feature.dependencies && feature.dependencies.length > 0 ? (
                                                    <ul className="space-y-2">
                                                        {feature.dependencies.map((dep) => (
                                                            <li key={dep.id} className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <Badge className={typeBadgeClass(dep.type)}>{translateDepType(dep.type)}</Badge>
                                                                    {dep.related ? (
                                                                        <Link
                                                                            href={route('features.show', { feature: dep.related.id })}
                                                                            className="text-blue-600 hover:underline"
                                                                        >
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

                                                {feature.dependents && feature.dependents.length > 0 && (
                                                    <div className="mt-4">
                                                        <h4 className="mb-2 text-sm font-medium">Wird referenziert von</h4>
                                                        <ul className="space-y-2">
                                                            {feature.dependents.map((dep) => (
                                                                <li key={`dep-${dep.id}`} className="flex items-center gap-2">
                                                                    <Badge variant="outline">{translateDepType(dep.type)}</Badge>
                                                                    {dep.feature ? (
                                                                        <Link
                                                                            href={route('features.show', { feature: dep.feature.id })}
                                                                            className="text-blue-600 hover:underline"
                                                                        >
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

                                        {/* Feature Beschreibung */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Beschreibung</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                {feature.description ? (
                                                    <div className="prose prose-sm max-w-none">
                                                        <FeatureDescription content={feature.description} />
                                                    </div>
                                                ) : (
                                                    <p className="text-muted-foreground">Keine Beschreibung vorhanden.</p>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Right Column - Status and Comments */}
                                    <div className="space-y-6">
                                        {/* Status anzeigen */}
                                        {feature.status_details && (
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Status</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="flex items-center">
                                                        <span
                                                            className={`inline-block rounded-md px-3 py-1.5 text-sm font-medium ${feature.status_details.color}`}
                                                        >
                                                            {feature.status_details.name}
                                                        </span>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )}

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
                                {/* Formular zum Erstellen einer neuen Komponente */}
                                {showComponentForm && (
                                    <ComponentForm
                                        componentData={componentData}
                                        onNameChange={(name) => setComponentData({ ...componentData, name })}
                                        onDescriptionChange={(description) => setComponentData({ ...componentData, description })}
                                        onSubmit={handleComponentSubmit}
                                    />
                                )}

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

                                    {feature.estimation_components && feature.estimation_components.length > 0 ? (
                                        <div className="space-y-4">
                                            {feature.estimation_components
                                                .filter((component) => showArchived || component.status === 'active')
                                                .map((component) => (
                                                    <ComponentItem
                                                        key={component.id}
                                                        component={component}
                                                        onEdit={openEditComponentDialog}
                                                        onArchive={archiveComponent}
                                                        onActivate={activateComponent}
                                                        onAddEstimation={openEstimationDialog}
                                                        onEditEstimation={openEditEstimationDialog}
                                                        onDeleteEstimation={handleDeleteEstimation}
                                                    />
                                                ))}
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground">Noch keine Komponenten vorhanden.</p>
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
                />

                {/* Dialog zum Bearbeiten einer Komponente */}
                <EditComponentDialog
                    open={editComponentDialogOpen}
                    onOpenChange={setEditComponentDialogOpen}
                    componentData={editComponentData}
                    onNameChange={(name) => setEditComponentData({ ...editComponentData, name })}
                    onDescriptionChange={(description) => setEditComponentData({ ...editComponentData, description })}
                    onSubmit={handleEditComponentSubmit}
                />
            </div>
        </AppLayout>
    );
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
