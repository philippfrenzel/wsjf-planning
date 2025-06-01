import React, { useState } from "react";
import { router } from '@inertiajs/react';
import AppLayout from "@/layouts/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArchiveIcon, RefreshCwIcon, EyeIcon, EyeOffIcon, PencilIcon } from "lucide-react";

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

interface Feature {
  id: number;
  jira_key: string;
  name: string;
  description: string;
  requester?: { id: number; name: string } | null;
  project?: { id: number; name: string } | null;
  estimation_components: EstimationComponent[];
}

interface ShowProps {
  feature: Feature;
  auth: { user: { id: number; name: string } };
}

export default function Show({ feature, auth }: ShowProps) {
  const [showComponentForm, setShowComponentForm] = useState(false);
  const [componentData, setComponentData] = useState({
    name: "",
    description: "",
  });
  
  const [estimationDialogOpen, setEstimationDialogOpen] = useState(false);
  const [selectedComponentId, setSelectedComponentId] = useState<number | null>(null);
  const [estimationData, setEstimationData] = useState({
    best_case: 0,
    most_likely: 0,
    worst_case: 0,
    unit: "hours",
    notes: "",
  });

  const [showArchived, setShowArchived] = useState<boolean>(false);

  // State für Komponenten-Bearbeitung
  const [editComponentDialogOpen, setEditComponentDialogOpen] = useState(false);
  const [editingComponent, setEditingComponent] = useState<EstimationComponent | null>(null);
  const [editComponentData, setEditComponentData] = useState({
    name: "",
    description: "",
  });

  const handleComponentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    router.post(route("estimation-components.store"), {
      feature_id: feature.id,
      name: componentData.name,
      description: componentData.description,
      // Parameter hinzufügen, um zur Feature-Seite zurückzukehren
      redirect_to_feature: feature.id
    }, {
      onSuccess: () => {
        setComponentData({ name: "", description: "" });
        setShowComponentForm(false);
        
        // Optional: Seite neu laden, um die neue Komponente anzuzeigen
        // Wenn der Controller korrekt zur Feature-Seite zurückkehrt,
        // ist dies nicht notwendig
        // router.reload();
      },
      onError: (errors) => {
        console.error("Fehler beim Speichern der Komponente:", errors);
        alert("Beim Speichern der Komponente ist ein Fehler aufgetreten.");
      }
    });
  };

  const handleEstimationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    router.post(route("estimations.store"), {
      component_id: selectedComponentId,
      best_case: estimationData.best_case,
      most_likely: estimationData.most_likely,
      worst_case: estimationData.worst_case,
      unit: estimationData.unit,
      notes: estimationData.notes,
      // Parameter hinzufügen, um zur Feature-Seite zurückzukehren
      redirect_to_feature: feature.id
    }, {
      onSuccess: () => {
        // Dialog schließen und Formular zurücksetzen
        setEstimationDialogOpen(false);
        setEstimationData({
          best_case: 0,
          most_likely: 0,
          worst_case: 0,
          unit: "hours",
          notes: "",
        });
      },
      // Bei Fehler Meldung anzeigen
      onError: (errors) => {
        console.error("Fehler beim Speichern:", errors);
        alert("Beim Speichern der Schätzung ist ein Fehler aufgetreten.");
      }
    });
  };

  const openEstimationDialog = (componentId: number) => {
    setSelectedComponentId(componentId);
    setEstimationDialogOpen(true);
  };

  const archiveComponent = (componentId: number) => {
    if (confirm('Möchten Sie diese Komponente wirklich archivieren?')) {
      router.put(route('estimation-components.archive', componentId), {}, {
        onSuccess: () => {
          // Optional: Meldung anzeigen
        }
      });
    }
  };

  const activateComponent = (componentId: number) => {
    router.put(route('estimation-components.activate', componentId), {}, {
      onSuccess: () => {
        // Optional: Meldung anzeigen
      }
    });
  };

  const toggleArchivedVisibility = () => {
    const newValue = !showArchived;
    setShowArchived(newValue);
    router.get(route('features.show', feature.id), {
      show_archived: newValue
    }, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const openEditComponentDialog = (component: EstimationComponent) => {
    setEditingComponent(component);
    setEditComponentData({
      name: component.name,
      description: component.description || "",
    });
    setEditComponentDialogOpen(true);
  };

  const handleEditComponentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingComponent) return;
    
    router.put(route("estimation-components.update", editingComponent.id), {
      name: editComponentData.name,
      description: editComponentData.description,
      redirect_to_feature: feature.id
    }, {
      onSuccess: () => {
        setEditComponentDialogOpen(false);
        setEditingComponent(null);
      },
      onError: (errors) => {
        console.error("Fehler beim Aktualisieren der Komponente:", errors);
        alert("Beim Aktualisieren der Komponente ist ein Fehler aufgetreten.");
      }
    });
  };

  return (
    <AppLayout>
      <Card className="max-w-4xl mx-auto mt-8">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>{feature.name}</span>
            <Button onClick={() => setShowComponentForm(!showComponentForm)}>
              {showComponentForm ? "Abbrechen" : "Komponente hinzufügen"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 mb-6">
            <div>
              <strong>Jira Key:</strong> {feature.jira_key}
            </div>
            <div>
              <strong>Projekt:</strong> {feature.project?.name ?? "-"}
            </div>
            <div>
              <strong>Anforderer:</strong> {feature.requester?.name ?? "-"}
            </div>
            <div>
              <strong>Beschreibung:</strong> {feature.description ?? "-"}
            </div>
          </div>

          {showComponentForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Neue Schätzungskomponente</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleComponentSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={componentData.name}
                      onChange={(e) =>
                        setComponentData({ ...componentData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Beschreibung</Label>
                    <Textarea
                      id="description"
                      value={componentData.description}
                      onChange={(e) =>
                        setComponentData({ ...componentData, description: e.target.value })
                      }
                      rows={3}
                    />
                  </div>
                  <Button type="submit">Komponente erstellen</Button>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end mb-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={toggleArchivedVisibility}
              className="text-gray-600"
            >
              {showArchived ? (
                <>
                  <EyeOffIcon className="h-4 w-4 mr-1" />
                  Archivierte ausblenden
                </>
              ) : (
                <>
                  <EyeIcon className="h-4 w-4 mr-1" />
                  Archivierte anzeigen
                </>
              )}
            </Button>
          </div>

          <h3 className="text-lg font-medium my-4">Schätzungskomponenten</h3>
          
          {feature.estimation_components && feature.estimation_components.length > 0 ? (
            <div className="space-y-4">
              {feature.estimation_components
                .filter(component => showArchived || component.status === 'active')
                .map((component) => (
                  <Card key={component.id}>
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
                                onClick={() => openEditComponentDialog(component)}
                                className="text-blue-600 border-blue-600 hover:bg-blue-50"
                              >
                                <PencilIcon className="h-4 w-4 mr-1" />
                                Bearbeiten
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => archiveComponent(component.id)}
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
                              onClick={() => activateComponent(component.id)}
                              className="text-green-600 border-green-600 hover:bg-green-50"
                            >
                              <RefreshCwIcon className="h-4 w-4 mr-1" />
                              Wiederherstellen
                            </Button>
                          )}
                          <Button onClick={() => openEstimationDialog(component.id)}>
                            Schätzung hinzufügen
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="mb-4">{component.description}</p>
                      
                      {component.estimations && component.estimations.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full">
                          <AccordionItem value="estimations">
                            <AccordionTrigger>
                              Schätzungen ({component.estimations.length})
                            </AccordionTrigger>
                            <AccordionContent>
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Best Case</TableHead>
                                    <TableHead>Most Likely</TableHead>
                                    <TableHead>Worst Case</TableHead>
                                    <TableHead>Gewichtet</TableHead>
                                    <TableHead>Einheit</TableHead>
                                    <TableHead>Erstellt von</TableHead>
                                    <TableHead>Datum</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {component.estimations.map((estimation) => (
                                    <TableRow key={estimation.id}>
                                      <TableCell>{estimation.best_case}</TableCell>
                                      <TableCell>{estimation.most_likely}</TableCell>
                                      <TableCell>{estimation.worst_case}</TableCell>
                                      <TableCell>{estimation.weighted_estimate?.toFixed(2) || '-'}</TableCell>
                                      <TableCell>{estimation.unit}</TableCell>
                                      <TableCell>{estimation.creator.name}</TableCell>
                                      <TableCell>
                                        {new Date(estimation.created_at).toLocaleDateString()}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      ) : (
                        <p className="text-gray-500">Noch keine Schätzungen vorhanden.</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          ) : (
            <p className="text-gray-500">Noch keine Komponenten vorhanden.</p>
          )}
        </CardContent>
      </Card>

      <Dialog 
        open={estimationDialogOpen} 
        onOpenChange={(open) => {
          setEstimationDialogOpen(open);
          if (!open) {
            // Beim Schließen Formular zurücksetzen
            setEstimationData({
              best_case: 0,
              most_likely: 0,
              worst_case: 0,
              unit: "hours",
              notes: "",
            });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neue Schätzung</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEstimationSubmit} className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="best_case">Best Case</Label>
                <Input
                  id="best_case"
                  type="number"
                  step="0.1"
                  min="0"
                  value={estimationData.best_case}
                  onChange={(e) =>
                    setEstimationData({ ...estimationData, best_case: parseFloat(e.target.value) })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="most_likely">Most Likely</Label>
                <Input
                  id="most_likely"
                  type="number"
                  step="0.1"
                  min="0"
                  value={estimationData.most_likely}
                  onChange={(e) =>
                    setEstimationData({ ...estimationData, most_likely: parseFloat(e.target.value) })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="worst_case">Worst Case</Label>
                <Input
                  id="worst_case"
                  type="number"
                  step="0.1"
                  min="0"
                  value={estimationData.worst_case}
                  onChange={(e) =>
                    setEstimationData({ ...estimationData, worst_case: parseFloat(e.target.value) })
                  }
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="unit">Einheit</Label>
              <Select 
                value={estimationData.unit} 
                onValueChange={(value) => setEstimationData({...estimationData, unit: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Einheit wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hours">Stunden</SelectItem>
                  <SelectItem value="days">Tage</SelectItem>
                  <SelectItem value="story_points">Story Points</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="notes">Notizen</Label>
              <Textarea
                id="notes"
                value={estimationData.notes}
                onChange={(e) =>
                  setEstimationData({ ...estimationData, notes: e.target.value })
                }
                rows={3}
              />
            </div>
            
            <Button type="submit" className="w-full">Schätzung speichern</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog 
        open={editComponentDialogOpen} 
        onOpenChange={(open) => {
          setEditComponentDialogOpen(open);
          if (!open) {
            setEditingComponent(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Komponente bearbeiten</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditComponentSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={editComponentData.name}
                onChange={(e) =>
                  setEditComponentData({ ...editComponentData, name: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Beschreibung</Label>
              <Textarea
                id="edit-description"
                value={editComponentData.description}
                onChange={(e) =>
                  setEditComponentData({ ...editComponentData, description: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setEditComponentDialogOpen(false)}
              >
                Abbrechen
              </Button>
              <Button type="submit">Änderungen speichern</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}