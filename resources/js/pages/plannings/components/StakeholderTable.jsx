// StakeholderTable.jsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const StakeholderTable = ({ stakeholders }) => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Stakeholder</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableCaption>Übersicht der Stakeholder und ihrer abgegebenen Stimmen</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Abgegebene Stimmen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stakeholders.length > 0 ? (
              stakeholders.map((stakeholder) => (
                <TableRow key={stakeholder.id}>
                  <TableCell className="font-medium">{stakeholder.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{stakeholder.votes_count}</Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={2} className="text-center">
                  Keine Stakeholder gefunden.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default StakeholderTable;