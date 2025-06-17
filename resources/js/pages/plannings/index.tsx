import React, { useState, useEffect, useMemo } from "react";
import AppLayout from "@/layouts/app-layout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Check } from "lucide-react";
import { Plus, Eye, Pencil, Trash2, Vote, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Link, usePage } from "@inertiajs/react";
import { Inertia } from "@inertiajs/inertia";
import { cn } from "@/lib/utils";

interface Planning {
  id: number;
  title: string;
  planned_at: string;
  executed_at: string;
  project?: { id: number; name: string };
  created_by: number; // ID des Erstellers
  owner_id?: number; // ID des Hauptverantwortlichen
  deputy_id?: number; // ID des Stellvertreters
}

interface IndexProps {
  plannings: Planning[];
  auth: {
    user: {
      id: number;
    }
  };
}

export default function Index({ plannings }: IndexProps) {
  // Breadcrumbs definieren
  const breadcrumbs = [
    { title: "Startseite", href: "/" },
    { title: "Plannings", href: null },
  ];

  // Aktuellen Benutzer aus dem Page-Props holen
  const { auth } = (usePage().props as unknown as IndexProps);
  
  // Filter-Zustände
  const [filters, setFilters] = useState({
    title: "",
    project: ""
  });

  // Zustand für Projekt-Popover
  const [projectPopoverOpen, setProjectPopoverOpen] = useState(false);

  // Paginierung
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Extrahiere alle eindeutigen Projekte für die Autovervollständigung
  const uniqueProjects = useMemo(() => {
    const projectSet = new Set<string>();
    plannings.forEach((planning) => {
      if (planning.project?.name) {
        projectSet.add(planning.project.name);
      }
    });
    return Array.from(projectSet).sort();
  }, [plannings]);

  // Handling für Filter-Änderungen
  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1); // Bei Filteränderung zurück zur ersten Seite
  };

  // Filter zurücksetzen
  const resetFilters = () => {
    setFilters({
      title: "",
      project: ""
    });
  };

  // Hilfsfunktion zur Datumsformatierung für die Anzeige
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString();
  };
  
  // Hilfsfunktion zum Prüfen, ob der Benutzer Bearbeitungsrechte hat
  const canEditPlanning = (planning: Planning) => {
    return (
      planning.created_by === auth.user.id || 
      planning.owner_id === auth.user.id || 
      planning.deputy_id === auth.user.id
    );
  };

  // Gefilterte Plannings
  const filteredPlannings = useMemo(() => {
    return plannings.filter(planning => {
      return (
        planning.title.toLowerCase().includes(filters.title.toLowerCase()) &&
        (filters.project === "" || planning.project?.name === filters.project)
      );
    });
  }, [plannings, filters]);

  // Für Pagination: Berechne die anzuzeigenden Plannings
  const paginatedPlannings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredPlannings.slice(start, end);
  }, [filteredPlannings, currentPage, itemsPerPage]);

  // Berechne die Gesamtzahl der Seiten
  const totalPages = Math.ceil(filteredPlannings.length / itemsPerPage);

  // Pagination-Handler wie im Projekt-Index
  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };
  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };
  // Bereich für Anzeige
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(startItem + itemsPerPage - 1, filteredPlannings.length);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="p-5 flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Plannings</h1>
        <Button asChild>
          <Link href={route("plannings.create")}>
            <Plus className="w-4 h-4 mr-2" />
            Neues Planning erstellen
          </Link>
        </Button>
      </div>
      
      {/* Filter-Bereich */}
      <div className="flex flex-col p-5">
        <Card className="bg-gray-50 border border-gray-200">
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <Search className="w-4 h-4 text-gray-500" />
              <h2 className="font-medium">Filter</h2>
              
              {/* Dauerhaft sichtbarer Reset-Button */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetFilters}
                className="ml-auto"
              >
                <X className="w-4 h-4 mr-1" />
                Filter zurücksetzen
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Titel Filter */}
              <div>
                <label className="block text-sm font-medium mb-1">Titel</label>
                <div className="relative">
                  <Input
                    placeholder="Titel filtern..."
                    value={filters.title}
                    onChange={(e) => handleFilterChange("title", e.target.value)}
                  />
                  {filters.title && (
                    <button 
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() => handleFilterChange("title", "")}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              {/* Projekt Filter mit Type-Ahead */}
              <div>
                <label className="block text-sm font-medium mb-1">Projekt</label>
                <div>
                  <Popover open={projectPopoverOpen} onOpenChange={setProjectPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={projectPopoverOpen}
                        className="w-full justify-between"
                      >
                        {filters.project || "Projekt wählen..."}
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Projekt suchen..." className="h-9" />
                        <CommandEmpty>Kein Projekt gefunden.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-y-auto">
                          <CommandItem
                            onSelect={() => {
                              handleFilterChange("project", "");
                              setProjectPopoverOpen(false);
                            }}
                            className="text-sm"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                filters.project === "" ? "opacity-100" : "opacity-0"
                              )}
                            />
                            Alle anzeigen
                          </CommandItem>
                          {uniqueProjects.map((project) => (
                            <CommandItem
                              key={project}
                              value={project}
                              onSelect={() => {
                                handleFilterChange("project", project);
                                setProjectPopoverOpen(false);
                              }}
                              className="text-sm"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  filters.project === project ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {project}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {filters.project && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1 h-auto p-0 text-xs text-muted-foreground"
                      onClick={() => handleFilterChange("project", "")}
                    >
                      <X className="mr-1 h-3 w-3" />
                      Filter zurücksetzen
                    </Button>
                  )}
                </div>
              </div>
              {/* Leer für Ausrichtung */}
              <div></div>
            </div>
          </CardContent>
        </Card>
        
        {/* Tabellen-Bereich */}
        <div className="mt-4">
          {/* Ergebnisanzeige with Paginierung */}
          <div className="flex justify-between items-center text-sm text-gray-500 mb-2">
            <div className="text-sm text-gray-500">
              {filteredPlannings.length > 0 ? (
                `Zeige ${startItem} bis ${endItem} von ${filteredPlannings.length} Plannings`
              ) : "Keine Plannings gefunden"}
            </div>
            {/* Seitenauswahl */}
            {filteredPlannings.length > 0 && (
              <div className="flex items-center gap-2">
                <select 
                  className="border rounded px-2 py-1"
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1); // Zurück zur ersten Seite
                  }}
                >
                  <option value={5}>5 pro Seite</option>
                  <option value={10}>10 pro Seite</option>
                  <option value={25}>25 pro Seite</option>
                  <option value={50}>50 pro Seite</option>
                </select>
              </div>
            )}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Titel</TableHead>
                <TableHead>Projekt</TableHead>
                <TableHead>Geplant am</TableHead>
                <TableHead>Durchgeführt am</TableHead>
                <TableHead>Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedPlannings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex flex-col items-center justify-center">
                      <Search className="w-8 h-8 text-gray-300 mb-2" />
                      <p className="text-gray-500">Keine Plannings gefunden</p>
                      {Object.values(filters).some(f => f !== "") && (
                        <Button 
                          variant="link"
                          onClick={resetFilters}
                          className="mt-2"
                        >
                          Filter zurücksetzen
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedPlannings.map((planning) => (
                  <TableRow key={planning.id}>
                    <TableCell>{planning.id}</TableCell>
                    <TableCell>{planning.title}</TableCell>
                    <TableCell>{planning.project?.name ?? "-"}</TableCell>
                    <TableCell>{formatDate(planning.planned_at)}</TableCell>
                    <TableCell>{formatDate(planning.executed_at)}</TableCell>
                    <TableCell className="flex gap-2">
                      {/* Ansichts-Button für alle Benutzer */}
                      <Button asChild size="icon" variant="outline">
                        <Link href={route("plannings.show", planning)}>
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                      
                      {/* Voting-Button für alle Benutzer */}
                      <Button asChild size="icon" variant="outline">
                        <Link href={route("votes.session", { planning: planning.id })}>
                          <Vote className="w-4 h-4" />
                        </Link>
                      </Button>
                      
                      {/* Bearbeitungs-Button für Ersteller, Owner und Deputy */}
                      {canEditPlanning(planning) && (
                        <Button asChild size="icon" variant="outline">
                          <Link href={route("plannings.edit", planning)}>
                            <Pencil className="w-4 h-4" />
                          </Link>
                        </Button>
                      )}
                      
                      {/* Lösch-Button für Ersteller, Owner und Deputy */}
                      {canEditPlanning(planning) && (
                        <form
                          onSubmit={e => {
                            e.preventDefault();
                            if (confirm("Sind Sie sicher, dass Sie dieses Planning löschen möchten?")) {
                              Inertia.delete(route("plannings.destroy", planning));
                            }
                          }}
                        >
                          <Button type="submit" size="icon" variant="destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </form>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          
           {/* Verbesserte Paginierungs-Navigation */}
          {filteredPlannings.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Zeige {Math.min(filteredPlannings.length, (currentPage - 1) * itemsPerPage + 1)} bis{" "}
                {Math.min(filteredPlannings.length, currentPage * itemsPerPage)} von{" "}
                {filteredPlannings.length} Einträgen
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Zurück
                </Button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNumber: number;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNumber}
                      variant={currentPage === pageNumber ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNumber)}
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages || totalPages === 0}
                >
                  Weiter
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}