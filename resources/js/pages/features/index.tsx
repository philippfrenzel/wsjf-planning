import React, { useState, useEffect, useMemo } from "react";
import AppLayout from "@/layouts/app-layout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Eye, Pencil, Trash2, ArrowUp, ArrowDown, Search, X, Check } from "lucide-react";
import { Link } from "@inertiajs/react";
import { Inertia } from "@inertiajs/inertia";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Feature {
  id: number;
  jira_key: string;
  name: string;
  description: string;
  requester?: { id: number; name: string } | null;
  project?: { id: number; name: string } | null;
}

interface IndexProps {
  features: Feature[];
}

type SortField = "jira_key" | "name" | "project" | "requester";
type SortDirection = "asc" | "desc";

export default function Index({ features }: IndexProps) {
  // Filter-Zustände
  const [filters, setFilters] = useState({
    jira_key: "",
    name: "",
    project: "",
    requester: "",
  });

  // Zustände für Popover
  const [projectPopoverOpen, setProjectPopoverOpen] = useState(false);
  const [requesterPopoverOpen, setRequesterPopoverOpen] = useState(false);

  // Sortierungs-Zustände
  const [sortField, setSortField] = useState<SortField>("jira_key");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Extrahiere alle eindeutigen Projekte und Anforderer für die Autovervollständigung
  const uniqueProjects = useMemo(() => {
    const projectSet = new Set<string>();
    features.forEach((feature) => {
      if (feature.project?.name) {
        projectSet.add(feature.project.name);
      }
    });
    return Array.from(projectSet).sort();
  }, [features]);

  const uniqueRequesters = useMemo(() => {
    const requesterSet = new Set<string>();
    features.forEach((feature) => {
      if (feature.requester?.name) {
        requesterSet.add(feature.requester.name);
      }
    });
    return Array.from(requesterSet).sort();
  }, [features]);

  // Handling für Filter-Änderungen
  const handleFilterChange = (field: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1); // Bei Filteränderung zurück zur ersten Seite
  };

  // Handling für Sortierungs-Änderungen
  const handleSortChange = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Filter zurücksetzen
  const resetFilters = () => {
    setFilters({
      jira_key: "",
      name: "",
      project: "",
      requester: "",
    });
  };

  // Gibt das richtige Sortierungssymbol zurück
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? <ArrowUp className="w-4 h-4 ml-1" /> : <ArrowDown className="w-4 h-4 ml-1" />;
  };

  // Gefilterte und sortierte Features
  const filteredAndSortedFeatures = useMemo(() => {
    // Filtern
    let result = features.filter(feature => {
      return (
        feature.jira_key.toLowerCase().includes(filters.jira_key.toLowerCase()) &&
        feature.name.toLowerCase().includes(filters.name.toLowerCase()) &&
        (filters.project === "" || feature.project?.name?.toLowerCase().includes(filters.project.toLowerCase())) &&
        (filters.requester === "" || feature.requester?.name?.toLowerCase().includes(filters.requester.toLowerCase()))
      );
    });

    // Sortieren
    return result.sort((a, b) => {
      let aValue, bValue;

      // Extrahiere die zu vergleichenden Werte basierend auf dem Sortierfeld
      switch (sortField) {
        case "jira_key":
          aValue = a.jira_key;
          bValue = b.jira_key;
          break;
        case "name":
          aValue = a.name;
          bValue = b.name;
          break;
        case "project":
          aValue = a.project?.name || "";
          bValue = b.project?.name || "";
          break;
        case "requester":
          aValue = a.requester?.name || "";
          bValue = b.requester?.name || "";
          break;
      }

      // Vergleiche die Werte in der richtigen Reihenfolge
      if (sortDirection === "asc") {
        return aValue.localeCompare(bValue);
      } else {
        return bValue.localeCompare(aValue);
      }
    });
  }, [features, filters, sortField, sortDirection]);

  // Für Pagination: Berechne die anzuzeigenden Features
  const paginatedFeatures = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredAndSortedFeatures.slice(start, end);
  }, [filteredAndSortedFeatures, currentPage, itemsPerPage]);

  // Berechne die Gesamtzahl der Seiten
  const totalPages = Math.ceil(filteredAndSortedFeatures.length / itemsPerPage);

  return (
    <AppLayout>
      <div className="p-5 flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Features</h1>
        <Button asChild>
          <Link href={route("features.create")}>
            <Plus className="w-4 h-4 mr-2" />
            Neues Feature
          </Link>
        </Button>
      </div>
      
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-5">
      <Card className="mb-6">
        <CardContent className="pt-5 px-5 pb-5">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Jira Key</label>
              <div className="relative">
                <Input
                  placeholder="Jira Key filtern..."
                  value={filters.jira_key}
                  onChange={(e) => handleFilterChange("jira_key", e.target.value)}
                />
                {filters.jira_key && (
                  <button 
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => handleFilterChange("jira_key", "")}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Feature Name</label>
              <div className="relative">
                <Input
                  placeholder="Name filtern..."
                  value={filters.name}
                  onChange={(e) => handleFilterChange("name", e.target.value)}
                />
                {filters.name && (
                  <button 
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => handleFilterChange("name", "")}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Projekt mit Type-Ahead */}
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
            
            {/* Anforderer mit Type-Ahead */}
            <div>
              <label className="block text-sm font-medium mb-1">Anforderer</label>
              <div>
                <Popover open={requesterPopoverOpen} onOpenChange={setRequesterPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={requesterPopoverOpen}
                      className="w-full justify-between"
                    >
                      {filters.requester || "Anforderer wählen..."}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Anforderer suchen..." className="h-9" />
                      <CommandEmpty>Kein Anforderer gefunden.</CommandEmpty>
                      <CommandGroup className="max-h-64 overflow-y-auto">
                        <CommandItem
                          onSelect={() => {
                            handleFilterChange("requester", "");
                            setRequesterPopoverOpen(false);
                          }}
                          className="text-sm"
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              filters.requester === "" ? "opacity-100" : "opacity-0"
                            )}
                          />
                          Alle anzeigen
                        </CommandItem>
                        {uniqueRequesters.map((requester) => (
                          <CommandItem
                            key={requester}
                            value={requester}
                            onSelect={() => {
                              handleFilterChange("requester", requester);
                              setRequesterPopoverOpen(false);
                            }}
                            className="text-sm"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                filters.requester === requester ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {requester}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                {filters.requester && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1 h-auto p-0 text-xs text-muted-foreground"
                    onClick={() => handleFilterChange("requester", "")}
                  >
                    <X className="mr-1 h-3 w-3" />
                    Filter zurücksetzen
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={resetFilters}
                className="text-sm"
              >
                Alle Filter zurücksetzen
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                {filteredAndSortedFeatures.length} {filteredAndSortedFeatures.length === 1 ? 'Feature' : 'Features'}
              </span>
              
              <Select
                value={itemsPerPage.toString()}
                onValueChange={(value) => {
                  setItemsPerPage(parseInt(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[110px]">
                  <SelectValue placeholder="10" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 / Seite</SelectItem>
                  <SelectItem value="10">10 / Seite</SelectItem>
                  <SelectItem value="25">25 / Seite</SelectItem>
                  <SelectItem value="50">50 / Seite</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>

      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-5">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50" 
                onClick={() => handleSortChange("jira_key")}
              >
                <span className="flex items-center">
                  Jira Key
                  {getSortIcon("jira_key")}
                </span>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50" 
                onClick={() => handleSortChange("name")}
              >
                <span className="flex items-center">
                  Name
                  {getSortIcon("name")}
                </span>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50" 
                onClick={() => handleSortChange("project")}
              >
                <span className="flex items-center">
                  Projekt
                  {getSortIcon("project")}
                </span>
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-gray-50" 
                onClick={() => handleSortChange("requester")}
              >
                <span className="flex items-center">
                  Anforderer
                  {getSortIcon("requester")}
                </span>
              </TableHead>
              <TableHead>Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedFeatures.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center">
                    <Search className="w-8 h-8 text-gray-300 mb-2" />
                    <p className="text-gray-500">Keine Features gefunden</p>
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
              paginatedFeatures.map((feature) => (
                <TableRow key={feature.id}>
                  <TableCell className="font-medium">{feature.jira_key}</TableCell>
                  <TableCell>{feature.name}</TableCell>
                  <TableCell>
                    {feature.project ? (
                      <Badge variant="outline">{feature.project.name}</Badge>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell>{feature.requester?.name ?? "-"}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button asChild size="icon" variant="outline">
                      <Link href={route("features.show", feature)}>
                        <Eye className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button asChild size="icon" variant="outline">
                      <Link href={route("features.edit", feature)}>
                        <Pencil className="w-4 h-4" />
                      </Link>
                    </Button>
                    <form
                      onSubmit={e => {
                        e.preventDefault();
                        if (confirm('Sind Sie sicher, dass Sie dieses Feature löschen möchten?')) {
                          Inertia.delete(route("features.destroy", feature));
                        }
                      }}
                    >
                      <Button type="submit" size="icon" variant="destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        {/* Pagination UI */}
        {filteredAndSortedFeatures.length > 0 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500">
              Zeige {Math.min(filteredAndSortedFeatures.length, (currentPage - 1) * itemsPerPage + 1)} bis{" "}
              {Math.min(filteredAndSortedFeatures.length, currentPage * itemsPerPage)} von{" "}
              {filteredAndSortedFeatures.length} Einträgen
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Zurück
              </Button>
              
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNumber: number;
                
                if (totalPages <= 5) {
                  // Wenn wir 5 oder weniger Seiten haben, zeige alle
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  // Wenn wir auf den ersten 3 Seiten sind
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  // Wenn wir auf den letzten 3 Seiten sind
                  pageNumber = totalPages - 4 + i;
                } else {
                  // Sonst zeige die aktuelle Seite in der Mitte an
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
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Weiter
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}