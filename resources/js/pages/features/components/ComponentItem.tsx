import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArchiveIcon, RefreshCwIcon, PencilIcon } from "lucide-react";
import EstimationTable from "./EstimationTable";

interface EstimationComponent {
  id: number;
  name: string;
  description?: string;
  status: 'active' | 'archived';
  estimations: any[];
}

interface ComponentItemProps {
  component: EstimationComponent;
  onEdit: (component: EstimationComponent) => void;
  onArchive: (id: number) => void;
  onActivate: (id: number) => void;
  onAddEstimation: (id: number) => void;
  onEditEstimation?: (componentId: number, estimation: any) => void;
  onDeleteEstimation?: (componentId: number, estimationId: number) => void;
}

export default function ComponentItem({
  component,
  onEdit,
  onArchive,
  onActivate,
  onAddEstimation,
  onEditEstimation,
  onDeleteEstimation
}: ComponentItemProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span>{component.name}</span>
            {component.status === 'archived' && (
              <Badge variant="outline" className="bg-gray-100">
                Archiviert
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            {component.status === 'active' ? (
              <>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => onEdit(component)}
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Bearbeiten
                </Button>
                <Button 
                  variant="info" 
                  size="sm" 
                  onClick={() => onArchive(component.id)}
                >
                  <ArchiveIcon className="h-4 w-4 mr-1" />
                  Archivieren
                </Button>
              </>
            ) : (
              <Button 
                variant="success" 
                size="sm" 
                onClick={() => onActivate(component.id)}
              >
                <RefreshCwIcon className="h-4 w-4 mr-1" />
                Wiederherstellen
              </Button>
            )}
            <Button
              onClick={() => onAddEstimation(component.id)}
              variant="success"
              size="sm"
            >
              Schätzung hinzufügen
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4">{component.description}</p>
        
        {component.estimations && component.estimations.length > 0 ? (
          <EstimationTable 
            estimations={component.estimations} 
            onEdit={onEditEstimation ? (estimation) => onEditEstimation(component.id, estimation) : undefined}
            onDelete={onDeleteEstimation ? (estimationId) => onDeleteEstimation(component.id, estimationId) : undefined}
          />
        ) : (
          <p className="text-gray-500">Noch keine Schätzungen vorhanden.</p>
        )}
      </CardContent>
    </Card>
  );
}