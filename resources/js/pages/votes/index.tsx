import React from "react";
import AppLayout from "@/layouts/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface VoteItem {
  id: number;
  value: number;
  type: "BusinessValue" | "TimeCriticality" | "RiskOpportunity" | string;
  voted_at?: string;
  user?: { id: number; name: string };
  feature?: { id: number; jira_key: string; name: string };
  planning?: { id: number; title: string };
}

interface PageProps {
  votes: VoteItem[];
}

const typeColor: Record<string, string> = {
  BusinessValue: "bg-emerald-100 text-emerald-800",
  TimeCriticality: "bg-amber-100 text-amber-800",
  RiskOpportunity: "bg-sky-100 text-sky-800",
};

export default function Index({ votes }: PageProps) {
  return (
    <AppLayout breadcrumbs={[{ title: "Votes", href: "/votes" }]}>
      <div className="p-6">
        <Card>
          <CardHeader className="bg-gray-50">
            <CardTitle>Alle Votes im Tenant ({votes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {votes.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">Keine Votes gefunden.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Planning</TableHead>
                    <TableHead>Feature</TableHead>
                    <TableHead>Typ</TableHead>
                    <TableHead>Wert</TableHead>
                    <TableHead>Benutzer</TableHead>
                    <TableHead>Datum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {votes.map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="font-medium">{v.planning?.title ?? "-"}</TableCell>
                      <TableCell>
                        {v.feature ? (
                          <span className="text-gray-900">
                            <Badge variant="outline" className="mr-2">{v.feature.jira_key}</Badge>
                            {v.feature.name}
                          </span>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={typeColor[v.type] ?? "bg-gray-100 text-gray-800"}>{v.type}</Badge>
                      </TableCell>
                      <TableCell className="font-mono">{v.value}</TableCell>
                      <TableCell>{v.user?.name ?? "-"}</TableCell>
                      <TableCell className="whitespace-nowrap">
                        {v.voted_at ? new Date(v.voted_at).toLocaleString() : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

