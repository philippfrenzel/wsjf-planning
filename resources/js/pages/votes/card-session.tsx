import React, { useState, useEffect } from "react";
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent, 
  DragOverlay, 
  DragStartEvent,
  Active,
  Over
} from "@dnd-kit/core";
import { 
  SortableContext, 
  sortableKeyboardCoordinates, 
  useSortable, 
  verticalListSortingStrategy 
} from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import AppLayout from "@/layouts/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { usePage } from "@inertiajs/react";
import { Inertia } from "@inertiajs/inertia";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, HelpCircle, AlertTriangle, Layers, MoveHorizontal, ArrowDownCircle } from "lucide-react";

// Typdefinitionen
interface Feature {
  id: number;
  jira_key: string;
  name: string;
  description?: string;
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
  plannings: Planning[];
  features: Feature[];
  types: string[];
  existingVotes: Record<string, { value: number }>;
  user: { id: number; name: string };
}

interface DropZoneItem {
  id: string; // Format: "feature-123"
  featureId: number;
  type: string; // "sorted" oder "unsorted"
}

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
      <Card className="relative mb-4 hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div className="text-sm text-blue-600 font-medium cursor-pointer" 
                onClick={() => setShowDetails(true)}>
              {feature.jira_key}
            </div>
            {position !== null && (
              <Badge variant="secondary" className="ml-2">
                Position {position}
              </Badge>
            )}
          </div>
          <CardTitle className="text-base leading-tight mt-1">
            {feature.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 pb-2">
          <div className="text-sm text-muted-foreground line-clamp-2">
            {feature.description ? (
              <div dangerouslySetInnerHTML={{ __html: feature.description.substring(0, 100) + '...' }} />
            ) : (
              <p>Keine Beschreibung vorhanden.</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="pt-0 flex justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs" 
            onClick={() => setShowDetails(true)}
          >
            <HelpCircle className="h-3 w-3 mr-1" />
            Details
          </Button>
        </CardFooter>
      </Card>

      {/* Details-Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {feature.jira_key}: {feature.name}
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
}> = ({ feature, position, id }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const [showDetails, setShowDetails] = useState(false);
  
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition
  };
  
  return (
    <>
      <div ref={setNodeRef} style={style} className="mb-4" {...attributes} {...listeners}>
        <Card className="relative hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div 
                className="text-sm text-blue-600 font-medium cursor-pointer" 
                onClick={() => setShowDetails(true)}
              >
                {feature.jira_key}
              </div>
              {position !== null && (
                <Badge variant="secondary" className="ml-2">
                  Position {position}
                </Badge>
              )}
            </div>
            <CardTitle className="text-base leading-tight mt-1">
              {feature.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 pb-2">
            <div className="text-sm text-muted-foreground line-clamp-2">
              {feature.description ? (
                <div dangerouslySetInnerHTML={{ __html: feature.description.substring(0, 100) + '...' }} />
              ) : (
                <p>Keine Beschreibung vorhanden.</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="pt-0 flex justify-between">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs" 
              onClick={() => setShowDetails(true)}
            >
              <HelpCircle className="h-3 w-3 mr-1" />
              Details
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Details-Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {feature.jira_key}: {feature.name}
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

// Container mit Droparea für unbewertet (unsorted) und bewertet (sorted)
const DroppableContainer: React.FC<{
  items: Feature[];
  id: "sorted" | "unsorted";
  emptyText: string;
  emptyIcon: React.ReactNode;
}> = ({ items, id, emptyText, emptyIcon }) => {
  return (
    <div 
      id={id}
      data-droppable-id={id}
      className={`bg-slate-50 border ${id === "unsorted" ? "border-dashed" : ""} border-slate-200 rounded-lg p-4 min-h-[300px] ${
        items.length === 0 ? 'flex items-center justify-center' : ''
      }`}
    >
      {items.length > 0 ? (
        items.map((feature, index) => (
          <SortableFeatureCard
            key={feature.id}
            feature={feature}
            id={`feature-${feature.id}`}
            position={id === "sorted" ? index + 1 : null}
          />
        ))
      ) : (
        <div className="text-center text-gray-500">
          {emptyIcon}
          <p>{emptyText}</p>
        </div>
      )}
    </div>
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
  // Sensoren für verschiedene Eingabemethoden
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <span>Bewertung: {getCategoryLabel(type)}</span>
          {categorizedFeatures[type]?.unsorted.length > 0 && (
            <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-800 border-amber-200">
              {categorizedFeatures[type]?.unsorted.length} unbewertete Features
            </Badge>
          )}
          {categorizedFeatures[type]?.unsorted.length === 0 && categorizedFeatures[type]?.sorted.length > 0 && (
            <Badge variant="outline" className="ml-2 bg-green-50 text-green-800 border-green-200">
              Alle Features bewertet
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Ziehen Sie Features vom Stapel in die Bewertungsreihe und ordnen Sie sie nach Priorität an.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Unbewertete Features</h3>
              <SortableContext 
                items={(categorizedFeatures[type]?.unsorted || []).map(f => `feature-${f.id}`)} 
                strategy={verticalListSortingStrategy}
              >
                <DroppableContainer 
                  id="unsorted" 
                  items={categorizedFeatures[type]?.unsorted || []} 
                  emptyText="Alle Features wurden bewertet"
                  emptyIcon={<CheckCircle2 className="h-12 w-12 mx-auto text-green-500 mb-2" />}
                />
              </SortableContext>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">Prioritätsreihenfolge</h3>
              <SortableContext 
                items={(categorizedFeatures[type]?.sorted || []).map(f => `feature-${f.id}`)}
                strategy={verticalListSortingStrategy}
              >
                <DroppableContainer 
                  id="sorted" 
                  items={categorizedFeatures[type]?.sorted || []} 
                  emptyText="Ziehen Sie Features hierher, um sie zu bewerten"
                  emptyIcon={<ArrowDownCircle className="h-12 w-12 mx-auto text-blue-500 mb-2" />}
                />
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
      </CardContent>
    </Card>
  );
};

export default function CardVoteSession({ planning, plannings, features, types, existingVotes, user }: SessionProps) {
  const { props } = usePage();
  const [draggingFeature, setDraggingFeature] = useState<Feature | null>(null);

  // Sensoren für verschiedene Eingabemethoden
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Breadcrumbs definieren
  const breadcrumbs = [
    { title: "Startseite", href: route("home") },
    { title: "Plannings", href: route("plannings.index") },
    { title: planning?.title || "Abstimmung", href: route("votes.session", planning.id) },
    { title: "Karten-Ansicht", href: route("votes.card-session", planning.id) },
  ];

  // Zustand für die Votes
  const [votes, setVotes] = useState<VoteValue>(() => {
    const initial: VoteValue = {};
    Object.entries(existingVotes).forEach(([key, vote]) => {
      initial[key] = vote.value.toString();
    });
    return initial;
  });

  // Zustand für die aktuelle Kategorie
  const [activeCategory, setActiveCategory] = useState<string>(types[0]);

  // Zustand für das ausgewählte Planning
  const [selectedPlanning, setSelectedPlanning] = useState<string>(
    planning && planning.id ? planning.id.toString() : (plannings[0]?.id?.toString() ?? "")
  );

  // Modal-Status für Erfolgsmeldungen
  const [open, setOpen] = useState<boolean>(props.success !== undefined && props.success !== null);

  // Kategorisierte Features
  const [categorizedFeatures, setCategorizedFeatures] = useState<{
    [category: string]: {
      unsorted: Feature[];
      sorted: Feature[];
    }
  }>(() => {
    const initial: { [category: string]: { unsorted: Feature[]; sorted: Feature[]; } } = {};
    types.forEach(type => {
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
      }
    } = {};

    // Für jede Kategorie, Feature als unsorted oder sorted klassifizieren
    types.forEach(type => {
      const unsortedFeatures: Feature[] = [];
      const sortedFeatures: Feature[] = [];

      features.forEach(feature => {
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
        const aValue = parseInt(votes[`${a.id}_${type}`] || "0");
        const bValue = parseInt(votes[`${b.id}_${type}`] || "0");
        return aValue - bValue; // Aufsteigend sortieren
      });

      categorized[type] = {
        unsorted: unsortedFeatures,
        sorted: sortedFeatures
      };
    });

    setCategorizedFeatures(categorized);
  }, [features, types, votes]);

  // Handling für Planning-Wechsel
  const handlePlanningChange = (planningId: string) => {
    setSelectedPlanning(planningId);
    Inertia.get(route("votes.card-session", planningId));
  };

  // Handling für Drag-Start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    if (!active) return;
    
    console.log("Drag Start:", active);
    
    const idStr = active.id.toString();
    if (idStr.startsWith('feature-')) {
      const featureId = parseInt(idStr.replace('feature-', ''));
      const feature = features.find(f => f.id === featureId);
      
      if (feature) {
        setDraggingFeature(feature);
      }
    }
  };

  // Handling für Drag-End
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setDraggingFeature(null);

    if (!over || !active) return;

    console.log("Drag End:", { active, over });

    // Feature-ID aus der aktiven ID extrahieren
    const featureId = parseInt(active.id.toString().replace('feature-', ''));
    const feature = features.find(f => f.id === featureId);
    if (!feature) return;

    // Bestimmen der Container-IDs (sorted oder unsorted)
    let sourceContainerId: string = "unsorted";
    let destContainerId: string = "unsorted";

    // Überprüfen, ob das Feature aktuell sortiert oder unsortiert ist
    const inSortedList = categorizedFeatures[activeCategory]?.sorted.some(f => f.id === featureId);
    if (inSortedList) {
      sourceContainerId = "sorted";
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
    if (over.data.current?.droppableContainer) {
      destContainerId = over.data.current.droppableContainer.id.toString();
    } else {
      // Fallback: DOM-Element inspizieren
      const overNode = over.data.current?.node;
      const containerType = getContainerFromNode(overNode);
      if (containerType) {
        destContainerId = containerType;
      } else if (typeof over.id === "string" && over.id.startsWith("feature-")) {
        // Wenn über einem Feature, prüfen, in welchem Container dieses ist
        const overFeatureId = parseInt(over.id.toString().replace('feature-', ''));
        const overFeatureInSorted = categorizedFeatures[activeCategory]?.sorted.some(f => f.id === overFeatureId);
        destContainerId = overFeatureInSorted ? "sorted" : "unsorted";
      }
    }

    // Wenn Quelle und Ziel unterschiedlich sind (Container-Wechsel)
    if (sourceContainerId !== destContainerId) {
      const updatedCategories = { ...categorizedFeatures };
      const currentCategory = updatedCategories[activeCategory];

      if (destContainerId === 'sorted' && sourceContainerId === 'unsorted') {
        // Feature von unsorted nach sorted bewegen
        const newUnsorted = currentCategory.unsorted.filter(f => f.id !== featureId);
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
          sorted: newSorted
        };
      } 
      else if (destContainerId === 'unsorted' && sourceContainerId === 'sorted') {
        // Feature von sorted nach unsorted bewegen
        const newSorted = currentCategory.sorted.filter(f => f.id !== featureId);
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
          sorted: newSorted
        };
      }

      setCategorizedFeatures(updatedCategories);
    } 
    // Umordnung innerhalb der sortierten Liste
    else if (sourceContainerId === 'sorted' && destContainerId === 'sorted' && 
             typeof over.id === "string" && over.id.startsWith("feature-") && 
             over.id !== active.id) {
      const overFeatureId = parseInt(over.id.toString().replace('feature-', ''));
      const updatedCategories = { ...categorizedFeatures };
      const currentCategory = updatedCategories[activeCategory];
      
      const oldIndex = currentCategory.sorted.findIndex(f => f.id === featureId);
      const newIndex = currentCategory.sorted.findIndex(f => f.id === overFeatureId);

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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Votes in ein Format konvertieren, das von FormData verstanden wird
    const formData = new FormData();
    
    // Votes als JSON-String hinzufügen
    formData.append('votes', JSON.stringify(votes));
    
    Inertia.post(route("votes.session.store", planning.id), formData);
  };

  // Modal schließen
  const handleCloseModal = () => setOpen(false);

  // Wechsel zwischen Kategorien
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
  };

  // Wechsel zur Standard-Tabellen-Ansicht
  const switchToStandardView = () => {
    Inertia.get(route("votes.session", selectedPlanning));
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      {/* Erfolgsmeldung */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Erfolg</DialogTitle>
          </DialogHeader>
          <div>{props.success ? String(props.success) : "Änderungen gespeichert"}</div>
          <DialogFooter>
            <Button onClick={handleCloseModal}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="w-full mx-auto mt-8 px-4 md:px-10">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center">
              <div className="mb-4 md:mb-0">
                <CardTitle className="flex items-center space-x-2 text-xl">
                  <span>Abstimmung für Planning:</span>
                  <Select value={selectedPlanning} onValueChange={handlePlanningChange}>
                    <SelectTrigger className="w-64">
                      <SelectValue placeholder="Planning wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {plannings.map((p) => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardTitle>
                <CardDescription>
                  Angemeldet als: {user.name}
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={switchToStandardView}>
                  <MoveHorizontal className="h-4 w-4 mr-2" />
                  Zur Tabellen-Ansicht
                </Button>
                <Button onClick={handleSubmit}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
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

            {types.map((type) => {
              // Notwendige Sensoren für DnD
              return (
                <TabsContent key={type} value={type} className="mt-0">
                  <CategoryTabContent 
                    type={type}
                    categorizedFeatures={categorizedFeatures}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    draggingFeature={draggingFeature}
                  />
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
