import React from "react";
import { Link } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AppLayout from "@/layouts/app-layout";

interface User {
  id: number;
  name: string;
}

interface Commitment {
  id: number;
  user: User;
  commitment_type: string;
  status_details?: {
    value: string;
    name: string;
    color: string;
  };
}

interface Feature {
  id: number;
  jira_key: string;
  name: string;
  commitments: Commitment[];
}

interface Planning {
  id: number;
  title: string;
  features: Feature[];
}

interface CommitmentType {
  value: string;
  label: string;
}

interface PlanningCommitmentsProps {
  planning: Planning;
  commitmentTypes: CommitmentType[];
}

function getCommitmentTypeBadge(type: string) {
  const classes = {
    A: "bg-red-100 text-red-800",
    B: "bg-blue-100 text-blue-800",
    C: "bg-yellow-100 text-yellow-800",
    D: "bg-green-100 text-green-800",
  };
  
  return classes[type as keyof typeof classes] || "bg-gray-100 text-gray-800";
}

function getStatusBadge(status: Commitment['status_details']) {
  if (!status) {
    return <Badge variant="outline">Nicht gesetzt</Badge>;
  }
  return <Badge className={status.color}>{status.name}</Badge>;
}

export default function PlanningCommitments({ planning, commitmentTypes }: PlanningCommitmentsProps) {
  // Gruppiere die Commitments nach Typ für eine bessere Übersicht
  const getTypeLabel = (type: string) => {
    return commitmentTypes.find(t => t.value === type)?.label || type;
  };
  
  return (
    <AppLayout breadcrumbs={[
      { title: "Plannings", href: route("plannings.index") },
      { title: planning.title, href: route("plannings.show", planning.id) },
      { title: "Commitments", href: route("plannings.commitments", planning.id) }
    ]}>
      <div className="py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Commitments für {planning.title}</h1>
          <Link href={route("commitments.create", { planning_id: planning.id })}>
            <Button>Neues Commitment</Button>
          </Link>
        </div>

        {planning.features.length === 0 ? (
          <Card>
            <CardContent className="py-6">
              <p className="text-center text-gray-500">Dieses Planning enthält keine Features.</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Legende für Commitment-Typen */}
            <div className="mb-6">
              <h2 className="text-lg font-medium mb-2">Commitment-Typen:</h2>
              <div className="flex flex-wrap gap-2">
                {commitmentTypes.map((type) => (
                  <Badge key={type.value} className={getCommitmentTypeBadge(type.value)}>
                    {type.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Feature-Liste mit Commitments */}
            {planning.features.map(feature => (
              <Card key={feature.id} className="mb-6">
                <CardHeader>
                  <CardTitle>
                    {feature.jira_key}: {feature.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {feature.commitments.length === 0 ? (
                    <div className="text-center py-2 text-gray-500">
                      Keine Commitments für dieses Feature.
                      <div className="mt-2">
                        <Link href={route("commitments.create", { planning_id: planning.id, feature_id: feature.id })}>
                          <Button size="sm" variant="outline">Commitment erstellen</Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Benutzer</TableHead>
                          <TableHead>Commitment-Typ</TableHead>
                          <TableHead>Status</TableHead>

                          <TableHead>Aktionen</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {feature.commitments.map(commitment => (
                          <TableRow key={commitment.id}>
                            <TableCell>{commitment.user.name}</TableCell>
                            <TableCell>
                              <Badge className={getCommitmentTypeBadge(commitment.commitment_type)}>
                                {getTypeLabel(commitment.commitment_type)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(commitment.status_details)}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Link href={route("commitments.show", commitment.id)}>
                                  <Button size="sm" variant="outline">Details</Button>
                                </Link>
                                <Link href={route("commitments.edit", commitment.id)}>
                                  <Button size="sm" variant="outline">Bearbeiten</Button>
                                </Link>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>
    </AppLayout>
  );
}
