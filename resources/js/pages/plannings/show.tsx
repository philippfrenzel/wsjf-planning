import React from "react";
import AppLayout from "@/layouts/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface User {
  id: number;
  name: string;
}

interface Project {
  id: number;
  name: string;
}

interface Planning {
  id: number;
  title: string;
  description: string;
  planned_at: string;
  executed_at: string;
  project?: Project;
  stakeholders: User[];
}

interface ShowProps {
  planning: Planning;
}

export default function Show({ planning }: ShowProps) {
  return (
    <AppLayout>
      <Card className="max-w-3xl mx-auto mt-8">
        <CardHeader>
          <CardTitle>{planning.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2">
            <strong>Projekt:</strong> {planning.project?.name ?? "-"}
          </div>
          <div className="mb-2">
            <strong>Geplant am:</strong> {planning.planned_at ?? "-"}
          </div>
          <div className="mb-2">
            <strong>Durchgeführt am:</strong> {planning.executed_at ?? "-"}
          </div>
          <div className="mb-2">
            <strong>Beschreibung:</strong> {planning.description ?? "-"}
          </div>
          <div className="mb-2">
            <strong>Stakeholder:</strong>{" "}
            {planning.stakeholders.length > 0
              ? planning.stakeholders.map((u) => u.name).join(", ")
              : "-"}
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}