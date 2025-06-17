// StakeholderTable.jsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

// Interface für die Props
interface Stakeholder {
  id: number;
  name: string;
  votes_count: number;
}

interface StakeholderTableProps {
  stakeholders: Stakeholder[];
}

const StakeholderTable = ({ stakeholders }: StakeholderTableProps) => {
  // Prüfen, ob Stakeholder-Daten vorhanden sind
  if (!stakeholders || stakeholders.length === 0) {
    return <div className="py-2">Keine Stakeholder vorhanden.</div>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Stakeholder</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Abgegebene Stimmen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stakeholders.map((stakeholder) => (
              <TableRow key={stakeholder.id}>
                <TableCell className="font-medium">{stakeholder.name}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={stakeholder.votes_count > 0 ? "default" : "outline"}>
                    {stakeholder.votes_count}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default StakeholderTable;