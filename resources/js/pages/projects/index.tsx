import React, { useState, useEffect } from "react";
import { Inertia } from "@inertiajs/inertia";
import AppLayout from "@/layouts/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Eye, Pencil, Trash2, Vote, Search, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "@inertiajs/react";

interface Project {
  id: number;
  project_number: string;
  name: string;
  project_leader?: { id: number; name: string };
  deputy_leader?: { id: number; name: string };
  created_by?: number;
}

interface IndexProps {
  projects: Project[];
  currentUserId: number;
}

export default function Index({ projects, currentUserId }: IndexProps) {
  // Breadcrumbs definieren
  const breadcrumbs = [
    { title: "Startseite", href: "/" },
    { title: "Projekte", href: "#" },
  ];

  // Filter-Zustand
  const [filters, setFilters] = useState({
    projectNumber: "",
    name: "",
    leader: "",
  });
  
  // Gefilterte Projekte
  const [filteredProjects, setFilteredProjects] = useState<Project[]>(projects);
  
  // Paginierung
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [paginatedProjects, setPaginatedProjects] = useState<Project[]>([]);
  
  // Filter anwenden
  useEffect(() => {
    const filtered = projects.filter(project => {
      // Filter für Projektnummer
      const matchesProjectNumber = project.project_number
        .toLowerCase()
        .includes(filters.projectNumber.toLowerCase());
      
      // Filter für Namen
      const matchesName = project.name
        .toLowerCase()
        .includes(filters.name.toLowerCase());
      
      // Filter für Projektleiter
      const matchesLeader = !filters.leader || (
        project.project_leader?.name
          ?.toLowerCase()
          .includes(filters.leader.toLowerCase())
      );
      
      return matchesProjectNumber && matchesName && matchesLeader;
    });
    
    setFilteredProjects(filtered);
    // Bei Filteränderung zur ersten Seite zurückkehren
    setCurrentPage(1);
  }, [projects, filters]);
  
  // Paginierung anwenden
  useEffect(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPaginatedProjects(filteredProjects.slice(startIndex, endIndex));
  }, [filteredProjects, currentPage, itemsPerPage]);

  // Filter zurücksetzen
  const resetFilters = () => {
    setFilters({
      projectNumber: "",
      name: "",
      leader: "",
    });
  };

  // Filter-Werte aktualisieren
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
  };
  
  // Wechsel zur vorherigen Seite
  const goToPreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };
  
  // Wechsel zur nächsten Seite
  const goToNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };
  
  // Berechnung der Gesamtseitenzahl
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  
  // Berechnung des aktuellen Bereichs für die Anzeige
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(startItem + itemsPerPage - 1, filteredProjects.length);

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="p-5 flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Projekte</h1>
        <Button asChild>
          <Link href={route("projects.create")}>
            <Plus className="w-4 h-4 mr-2" />
            Neues Projekt erstellen
          </Link>
        </Button>
      </div>
      
      {/* Filter-Box */}
      <div className="mx-4 mb-6 p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-center gap-2 mb-2">
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="projectNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Projektnummer
            </label>
            <Input
              id="projectNumber"
              name="projectNumber"
              placeholder="Nach Projektnummer filtern..."
              value={filters.projectNumber}
              onChange={handleFilterChange}
            />
          </div>
          
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Projektname
            </label>
            <Input
              id="name"
              name="name"
              placeholder="Nach Projektname filtern..."
              value={filters.name}
              onChange={handleFilterChange}
            />
          </div>
          
          <div>
            <label htmlFor="leader" className="block text-sm font-medium text-gray-700 mb-1">
              Projektleiter
            </label>
            <Input
              id="leader"
              name="leader"
              placeholder="Nach Projektleiter filtern..."
              value={filters.leader}
              onChange={handleFilterChange}
            />
          </div>
        </div>
      </div>
      
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
        {/* Ergebnisanzeige mit Paginierung */}
        <div className="flex justify-between items-center text-sm text-gray-500 mb-2">
          <div>
            {filteredProjects.length > 0 
              ? `Zeige ${startItem} bis ${endItem} von ${filteredProjects.length} Projekten` 
              : "Keine Projekte gefunden"}
          </div>
          
          {/* Seitenauswahl */}
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
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Projektnummer</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Projektleiter</TableHead>
              <TableHead>Stellvertretung</TableHead>
                <TableHead className="text-right">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProjects.map((project) => {
              const canEdit =
                project.created_by === currentUserId ||
                project.project_leader?.id === currentUserId ||
                project.deputy_leader?.id === currentUserId;

              return (
                <TableRow key={project.id}>
                  <TableCell>{project.id}</TableCell>
                  <TableCell>{project.project_number}</TableCell>
                  <TableCell>{project.name}</TableCell>
                  <TableCell>
                    {project.project_leader ? project.project_leader.name : "-"}
                  </TableCell>
                  <TableCell>
                    {project.deputy_leader ? project.deputy_leader.name : "-"}
                  </TableCell>
                  <TableCell className="flex gap-2 justify-end">
                    <Button asChild size="icon" variant="outline">
                      <Link href={route("projects.show", project)}>
                        <Eye className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button asChild size="icon" variant="outline">
                      <Link href={route("plannings.index", { project_id: project.id })}>
                        <Vote className="w-4 h-4" />
                      </Link>
                    </Button>
                    {canEdit && (
                      <>
                        <Button asChild size="icon" variant="outline">
                          <Link href={route("projects.edit", project)}>
                            <Pencil className="w-4 h-4" />
                          </Link>
                        </Button>
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            Inertia.delete(route("projects.destroy", project));
                          }}
                        >
                          <Button type="submit" size="icon" variant="destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </form>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            
            {/* Anzeigen, wenn keine Ergebnisse gefunden wurden */}
            {filteredProjects.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  Keine Projekte gefunden, die den Filterkriterien entsprechen.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        
        {/* Verbesserte Paginierungs-Navigation */}
        {filteredProjects.length > 0 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-500">
              Zeige {Math.min(filteredProjects.length, (currentPage - 1) * itemsPerPage + 1)} bis{" "}
              {Math.min(filteredProjects.length, currentPage * itemsPerPage)} von{" "}
              {filteredProjects.length} Einträgen
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
    </AppLayout>
  );
}