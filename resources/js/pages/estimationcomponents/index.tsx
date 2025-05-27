import React from "react";
import { router } from '@inertiajs/react';
import AppLayout from "@/layouts/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";

interface Estimation {
  id: number;
  weighted_estimate: number;
  unit: string;
}

interface Component {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  creator: { id: number; name: string };
  feature: { id: number; name: string, jira_key: string };
  latest_estimation?: Estimation;
}

interface IndexProps {
  components: {
    data: Component[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
  };
}

export default function Index({ components }: IndexProps) {
  return (
    <AppLayout>
      <Card className="max-w-6xl mx-auto mt-8">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Schätzungskomponenten</span>
            <Button onClick={() => router.visit(route('estimation-components.create'))}>
              Neue Komponente
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {components.data.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Feature</TableHead>
                    <TableHead>Beschreibung</TableHead>
                    <TableHead>Erstelldatum</TableHead>
                    <TableHead>Ersteller</TableHead>
                    <TableHead>Aktuelle Schätzung</TableHead>
                    <TableHead>Aktionen</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {components.data.map((component) => (
                    <TableRow key={component.id}>
                      <TableCell className="font-medium">{component.name}</TableCell>
                      <TableCell>
                        {component.feature ? (
                          <a 
                            href={route('features.show', component.feature.id)}
                            className="text-blue-500 hover:underline"
                          >
                            {component.feature.jira_key} - {component.feature.name}
                          </a>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {component.description || "-"}
                      </TableCell>
                      <TableCell>
                        {new Date(component.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{component.creator.name}</TableCell>
                      <TableCell>
                        {component.latest_estimation ? (
                          <>
                            {component.latest_estimation.weighted_estimate.toFixed(2)}{" "}
                            {component.latest_estimation.unit === "hours" ? "Stunden" : 
                              component.latest_estimation.unit === "days" ? "Tage" : 
                              "Story Points"}
                          </>
                        ) : (
                          "Keine"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.visit(route('estimation-components.show', component.id))}
                          >
                            Details
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => router.visit(route('estimation-components.edit', component.id))}
                          >
                            Bearbeiten
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="mt-4">
                <Pagination>
                  {components.links.map((link, index) => (
                    <Button
                      key={index}
                      variant={link.active ? "default" : "outline"}
                      disabled={!link.url}
                      onClick={() => link.url && router.visit(link.url)}
                      className="mx-1"
                      dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                  ))}
                </Pagination>
              </div>
            </>
          ) : (
            <p className="text-center py-8">Keine Schätzungskomponenten gefunden.</p>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}