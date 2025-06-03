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
}

export default function ComponentItem({
  component,
  onEdit,
  onArchive,
  onActivate,
  onAddEstimation,
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
                  variant="outline" 
                  size="sm" 
                  onClick={() => onEdit(component)}
                  className="text-blue-600 border-blue-600 hover:bg-blue-50"
                >
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Bearbeiten
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onArchive(component.id)}
                  className="text-yellow-600 border-yellow-600 hover:bg-yellow-50"
                >
                  <ArchiveIcon className="h-4 w-4 mr-1" />
                  Archivieren
                </Button>
              </>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => onActivate(component.id)}
                className="text-green-600 border-green-600 hover:bg-green-50"
              >
                <RefreshCwIcon className="h-4 w-4 mr-1" />
                Wiederherstellen
              </Button>
            )}
            <Button onClick={() => onAddEstimation(component.id)}>
              Schätzung hinzufügen
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4">{component.description}</p>
        
        {component.estimations && component.estimations.length > 0 ? (
          <EstimationTable estimations={component.estimations} />
        ) : (
          <p className="text-gray-500">Noch keine Schätzungen vorhanden.</p>
        )}
      </CardContent>
    </Card>
  );
}