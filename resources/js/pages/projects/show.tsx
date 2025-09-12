import React from "react";
import { PageProps } from "@inertiajs/inertia";
import { Head, usePage } from "@inertiajs/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "@inertiajs/react";
import AppLayout from "@/layouts/app-layout";

type Project = {
  id: number;
  project_number: string;
  name: string;
  description?: string;
  jira_base_uri?: string;
  start_date: string;
  project_leader?: { id: number; name: string };
  deputy_leader?: { id: number; name: string };
  created_by?: number;
};

export default function ProjectShow() {
  const { project } = usePage<PageProps & { project: Project }>().props;
  
  // Breadcrumbs definieren
  const breadcrumbs = [
    { title: "Startseite", href: "/" },
    { title: "Projekte", href: route("projects.index") },
    { title: project.name, href: "#" },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Projekt: ${project.name}`} />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{project.name}</CardTitle>
            <CardDescription>Projektnummer: {project.project_number}</CardDescription>
          </div>
          <div className="shrink-0">
            <Button asChild variant="outline">
              <Link href={route('projects.features.import', project.id)}>Feature-Import</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <span className="font-semibold">Startdatum:</span>{" "}
              {project.start_date}
            </div>
            <div>
              <span className="font-semibold">Projektleiter:</span>{" "}
              {project.project_leader?.name ?? "—"}
            </div>
            <div>
              <span className="font-semibold">Stellvertretung:</span>{" "}
              {project.deputy_leader?.name ?? "—"}
            </div>
            <div>
              <span className="font-semibold">Beschreibung:</span>{" "}
              {project.description || "—"}
            </div>
            <div>
              <span className="font-semibold">JIRA Base URI:</span>{" "}
              {project.jira_base_uri ? (
                <a 
                  href={project.jira_base_uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {project.jira_base_uri}
                </a>
              ) : "—"}
            </div>
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
