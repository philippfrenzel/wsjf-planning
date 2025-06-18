import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";
import StakeholderTable from "./StakeholderTable";
import CommonVotesTable from "./CommonVotesTable";

interface Stakeholder {
  id: number;
  name: string;
  email?: string;
  votes_count: number;
}

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
  commonvotes?: any[];
}

interface Planning {
  id: number;
  title: string;
  description: string;
  planned_at: string;
  executed_at: string;
  project?: Project;
  stakeholders: Stakeholder[];
  features?: Feature[];
  creator?: User;
}

interface PlanningDetailsCardProps {
  planning: Planning;
  stakeholders: Stakeholder[];
}

const PlanningDetailsCard: React.FC<PlanningDetailsCardProps> = ({ planning, stakeholders }) => {
  const [open, setOpen] = useState(true);

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Details & Common Vote</CardTitle>
      </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              <TableRow>
                <TableHead className="w-1/4">Projekt</TableHead>
                <TableCell>{planning.project?.name ?? "-"}</TableCell>
                <TableHead className="w-1/4">Geplant am</TableHead>
                <TableCell>{planning.planned_at ?? "-"}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="w-1/4">Durchgeführt am</TableHead>
                <TableCell>{planning.executed_at ?? "-"}</TableCell>
                <TableHead className="w-1/4">Beschreibung</TableHead>
                <TableCell>{planning.description ?? "-"}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="w-1/4">Erstellt von</TableHead>
                <TableCell>{planning.creator?.name ?? "-"}</TableCell>
                <TableHead className="w-1/4">Titel</TableHead>
                <TableCell>{planning.title ?? "-"}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          {/* Accordion für StakeholderTable */}
          <div className="mt-6">
            <StakeholderTable stakeholders={stakeholders} />
          </div>
          {/* Accordion für CommonVotesTable */}
          {planning.features && (
            <div className="mt-6">
              <CommonVotesTable features={planning.features} planningId={planning.id} />
            </div>
          )}
        </CardContent>
    </Card>
  );
};

export default PlanningDetailsCard;
