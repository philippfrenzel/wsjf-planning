import React from "react";
import AppLayout from "@/layouts/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Feature {
  id: number;
  jira_key: string;
  name: string;
  description: string;
  requester?: { id: number; name: string } | null;
  project?: { id: number; name: string } | null;
}

interface ShowProps {
  feature: Feature;
}

export default function Show({ feature }: ShowProps) {
  return (
    <AppLayout>
      <Card className="max-w-2xl mx-auto mt-8">
        <CardHeader>
          <CardTitle>{feature.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-2">
            <strong>Jira Key:</strong> {feature.jira_key}
          </div>
          <div className="mb-2">
            <strong>Projekt:</strong> {feature.project?.name ?? "-"}
          </div>
          <div className="mb-2">
            <strong>Anforderer:</strong> {feature.requester?.name ?? "-"}
          </div>
          <div className="mb-2">
            <strong>Beschreibung:</strong> {feature.description ?? "-"}
          </div>
        </CardContent>
      </Card>
    </AppLayout>
  );
}