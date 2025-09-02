import React, { useState } from "react";
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  DragEndEvent,
  DragOverlay,
  useDroppable,
  useDraggable,
  DragStartEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import axios from "axios";
import AppLayout from "@/layouts/app-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Feature {
  id: number;
  jira_key: string;
  name: string;
  project?: { id: number; name: string } | null;
}

interface Lane {
  key: string;
  name: string;
  color: string;
  features: Feature[];
}


interface BoardProps {
  lanes: Lane[];
}

function LaneColumn({ lane, children, highlight }: { lane: Lane; children: React.ReactNode; highlight: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: lane.key });
  
  // Kombination von externem highlight und internem isOver für deutlicheres visuelles Feedback
  const showHighlight = highlight || isOver;
  
  return (
    <div
      ref={setNodeRef}
      id={lane.key}
      className={`min-w-[250px] max-w-[300px] flex-1 transition-colors duration-150 ${
        showHighlight ? "bg-blue-100 border-2 border-dashed border-blue-400" : ""
      }`}
    >
      <h2 className={`mb-2 px-2 py-1 rounded text-sm font-semibold ${lane.color}`}>{lane.name}</h2>
      <div className="space-y-2 min-h-[60px] p-2">
        {children}
      </div>
    </div>
  );
}

function FeatureCard({ feature }: { feature: Feature }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: String(feature.id),
    data: feature,
  });
  
  // Verbesserte Stile für Feature-Card
  const cardStyle = isDragging
    ? { opacity: 0.4, cursor: "grabbing" } 
    : { cursor: "grab" };
  
  return (
    <div ref={setNodeRef} style={cardStyle} className="touch-manipulation w-full">
      <Card
        {...attributes}
        {...listeners}
        className={`shadow transition-all ${isDragging ? "opacity-50 border border-blue-400" : "hover:shadow-md"}`}
        id={String(feature.id)}
      >
        <CardHeader className="p-3 pb-2">
          <CardTitle className="text-sm truncate">
            {feature.jira_key} - {feature.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          {feature.project && (
            <p className="text-xs text-muted-foreground truncate">{feature.project.name}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
export default function Board({ lanes }: BoardProps) {
  const breadcrumbs = [
    { title: "Startseite", href: "/" },
    { title: "Board Features", href: "#" },
  ];

  // Lokaler State für die Lane-Features
  const [laneState, setLaneState] = useState(lanes);
  const [activeFeatureId, setActiveFeatureId] = useState<number | null>(null);
  const [overLaneKey, setOverLaneKey] = useState<string | null>(null);

  // Verbesserte Dnd-Kit Sensoren für zuverlässigere Drag-and-Drop-Erkennung
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Optimierte Einstellungen für Desktop und Touch-Geräte
      activationConstraint: { 
        distance: 5, // Aktivierungsdistanz für präziseres Starten des Drag
        tolerance: 3, // Reduzierte Toleranz für genauere Bewegungserkennung
        delay: 0 // Keine Verzögerung für unmittelbare Reaktion
      }
    })
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
    const sourceLaneIdx = laneState.findIndex((lane: Lane) => 
      lane.features.some((f: Feature) => f.id === Number(active.id))
    );
    
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
    axios.post(route("features.status.update", { feature: feature.id }), {
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

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="max-w-7xl mx-auto px-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
        >
          <div className="flex gap-4 overflow-x-auto pb-4 pt-2">
            {laneState.map((lane: Lane) => (
              <LaneColumn key={lane.key} lane={lane} highlight={overLaneKey === lane.key}>
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
            {activeFeatureId !== null && (() => {
              const feature = laneState.flatMap((l: Lane) => l.features).find((f: Feature) => f.id === activeFeatureId);
              if (!feature) return null;
              return (
                <div className="w-full min-w-[250px] max-w-[300px] pointer-events-none">
                  <Card className="shadow-lg border-2 border-blue-500">
                    <CardHeader className="p-3 pb-2">
                      <CardTitle className="text-sm">
                        {feature.jira_key} - {feature.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      {feature.project && (
                        <p className="text-xs text-muted-foreground">{feature.project.name}</p>
                      )}
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