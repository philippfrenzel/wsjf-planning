import React from "react";
import AppLayout from "@/layouts/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface User {
  id: number;
  name: string;
}

interface Project {
  id: number;
  name: string;
}

interface Feature {
  id: number;
  jira_key: string;
  name: string;
  project_id: number;
}

interface Planning {
  id: number;
  title: string;
  description: string;
  planned_at: string;
  executed_at: string;
  project?: Project;
  stakeholders: User[];
  features?: Feature[];
}

interface ShowProps {
  planning: Planning;
}

function FeaturesTable({ features }: { features?: Feature[] }) {
  if (!features || features.length === 0) {
    return <div className="mt-6">Keine Features verknüpft.</div>;
  }

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-2">Verknüpfte Features</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Jira Key</TableHead>
            <TableHead>Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {features.map((feature) => (
            <TableRow key={feature.id}>
              <TableCell>{feature.jira_key}</TableCell>
              <TableCell>{feature.name}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function Show({ planning }: ShowProps) {
  return (
    <AppLayout>
      <div className="w-full max-w-full px-0">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>{planning.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="details" className="w-full">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="features">Features</TabsTrigger>
              </TabsList>
              <TabsContent value="details">
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
              </TabsContent>
              <TabsContent value="features">
                <FeaturesTable features={planning.features} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}