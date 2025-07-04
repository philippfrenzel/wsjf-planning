import React, { useState } from "react";
import { Link } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/layouts/app-layout";

interface Planning {
  id: number;
  title: string;
}

interface User {
  id: number;
  name: string;
}

interface Feature {
  id: number;
  jira_key: string;
  name: string;
}

interface Commitment {
  id: number;
  planning: Planning;
  feature: Feature;
  user: User;
  commitment_type: string;
  status_details?: {
    value: string;
    name: string;
    color: string;
  };
}

interface CommitmentsIndexProps {
  commitments: Commitment[];
  plannings: Planning[];
  selectedPlanning?: number;
}

function getCommitmentTypeBadge(type: string) {
  const classes = {
    D: "bg-red-100 text-red-800",
    C: "bg-blue-100 text-blue-800",
    B: "bg-yellow-100 text-yellow-800",
    A: "bg-green-100 text-green-800",
  };
  const labels = {
    A: "Typ A - Hohe P & D",
    B: "Typ B - Hohe P, geringe D",
    C: "Typ C - Geringe P, hohe D",
    D: "Typ D - Geringe P & D",
  };

  return <Badge className={classes[type as keyof typeof classes]}>{labels[type as keyof typeof labels]}</Badge>;
}

function getStatusBadge(statusDetails: Commitment['status_details']) {
  if (!statusDetails) {
    return <Badge variant="outline">Nicht gesetzt</Badge>;
  }
  return <Badge className={statusDetails.color}>{statusDetails.name}</Badge>;
}

export default function CommitmentsIndex({ commitments, plannings, selectedPlanning }: CommitmentsIndexProps) {
  const [planningFilter, setPlanningFilter] = useState<string>(selectedPlanning ? String(selectedPlanning) : "all");

  const handlePlanningChange = (value: string) => {
    setPlanningFilter(value);
    // Bei Änderung des Filters auf die entsprechende URL umleiten
    if (value === "all") {
      window.location.href = route("commitments.index");
    } else {
      window.location.href = route("commitments.index") + "?planning_id=" + value;
    }
  };

  return (
    <AppLayout breadcrumbs={[{ title: "Commitments", href: route("commitments.index") }]}>
      <div className="flex justify-between items-center my-6">
        <h1 className="text-2xl font-bold">Commitments</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">Planning:</span>
            <Select value={planningFilter} onValueChange={handlePlanningChange}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Planning auswählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Plannings</SelectItem>
                {plannings.map((planning) => (
                  <SelectItem key={planning.id} value={String(planning.id)}>
                    {planning.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Link href={route("commitments.create", selectedPlanning ? { planning_id: selectedPlanning } : {})}>
            <Button>Neues Commitment</Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Alle Commitments</CardTitle>
        </CardHeader>
        <CardContent>
          {commitments.length === 0 ? (
            <div className="text-center py-4 text-gray-500">Keine Commitments gefunden.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Planning</TableHead>
                  <TableHead>Feature</TableHead>
                  <TableHead>Commitment-Typ</TableHead>
                  <TableHead>Benutzer</TableHead>
                  <TableHead>Status</TableHead>

                  <TableHead>Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commitments.map((commitment) => (
                  <TableRow key={commitment.id}>
                    <TableCell>{commitment.planning.title}</TableCell>
                    <TableCell>
                      {commitment.feature.jira_key}: {commitment.feature.name}
                    </TableCell>
                    <TableCell>{getCommitmentTypeBadge(commitment.commitment_type)}</TableCell>
                    <TableCell>{commitment.user.name}</TableCell>
                    <TableCell>{getStatusBadge(commitment.status_details)}</TableCell>
                    <TableCell className="space-x-2">
                      <Link href={route("commitments.show", commitment.id)}>
                        <Button size="sm" variant="outline">
                          Anzeigen
                        </Button>
                      </Link>
                      <Link href={route("commitments.edit", commitment.id)}>
                        <Button size="sm" variant="outline">
                          Bearbeiten
                        </Button>
                      </Link>
                      <Link
                        href={route("commitments.destroy", commitment.id)}
                        method="delete"
                        as="button"
                        className="btn-sm btn-outline-danger"
                      >
                        <Button size="sm" variant="destructive">
                          Löschen
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
