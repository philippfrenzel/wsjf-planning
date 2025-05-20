import React from "react";
import { Inertia } from "@inertiajs/inertia";
import AppLayout from "@/layouts/app-layout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { Link } from "@inertiajs/react";

interface Project {
  id: number;
  project_number: string;
  name: string;
  project_leader?: { id: number; name: string }; // Leader-Objekt
  deputy_leader?: { id: number; name: string };  // Deputy-Objekt
  // Weitere Felder falls benötigt
}

interface IndexProps {
  projects: Project[];
}

export default function Index({ projects }: IndexProps) {
  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Projekte</h1>
        <Button asChild>
          <Link href={route("projects.create")}>
            <Plus className="w-4 h-4 mr-2" />
            Neues Projekt erstellen
          </Link>
        </Button>
      </div>
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Projektnummer</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Projektleiter</TableHead>
            <TableHead>Stellvertretung</TableHead>
            <TableHead>Aktionen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
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
              <TableCell className="flex gap-2">
                <Button asChild size="icon" variant="outline">
                  <Link href={route("projects.show", project)}>
                    <Eye className="w-4 h-4" />
                  </Link>
                </Button>
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </AppLayout>
  );
}