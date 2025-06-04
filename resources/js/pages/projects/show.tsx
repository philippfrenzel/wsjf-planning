import React from "react";
import { PageProps } from "@inertiajs/inertia";
import { Head, usePage } from "@inertiajs/react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import AppLayout from "@/layouts/app-layout";

type Project = {
  id: number;
  project_number: string;
  name: string;
  description?: string;
  start_date: string;
  project_leader?: { id: number; name: string };
  deputy_leader?: { id: number; name: string };
  created_by?: number;
};

export default function ProjectShow() {
  const { project } = usePage<PageProps & { project: Project }>().props;

  return (
    <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-5">
      <Head title={`Projekt: ${project.name}`} />
      <Card>
        <CardHeader>
          <CardTitle>{project.name}</CardTitle>
          <CardDescription>
            Projektnummer: {project.project_number}
          </CardDescription>
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

ProjectShow.layout = (page: React.ReactNode) => <AppLayout children={page} />;