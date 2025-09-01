import React from "react";
import AppLayout from "@/layouts/app-layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Feature {
  id: number;
  jira_key: string;
  name: string;
  project?: { id: number; name: string } | null;
}

interface Lane {
  key: string;
  name: string;
  color: string;
  features: Feature[];
}

interface BoardProps {
  lanes: Lane[];
}

export default function Board({ lanes }: BoardProps) {
  const breadcrumbs = [
    { title: "Startseite", href: "/" },
    { title: "Board Features", href: "#" },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {lanes.map((lane) => (
          <div key={lane.key} className="min-w-[250px] max-w-[300px] flex-1">
            <h2 className={`mb-2 px-2 py-1 rounded text-sm font-semibold ${lane.color}`}>{lane.name}</h2>
            <div className="space-y-2">
              {lane.features.map((feature) => (
                <Card key={feature.id} className="shadow">
                  <CardHeader className="p-3 pb-2">
                    <CardTitle className="text-sm">
                      {feature.jira_key} - {feature.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0">
                    {feature.project && (
                      <p className="text-xs text-muted-foreground">{feature.project.name}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
}

