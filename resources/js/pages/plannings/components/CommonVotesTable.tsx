import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface User {
  id: number;
  name: string;
}

interface Vote {
  user_id: number;
  user: User;
  type: string;
  value: number;
}

interface Feature {
  id: number;
  jira_key: string;
  name: string;
  project_id: number;
  commonvotes?: Vote[];
}

function translateVoteType(type: string): string {
  const translations: {[key: string]: string} = {
    "BusinessValue": "Geschäftswert",
    "TimeCriticality": "Zeitkritikalität",
    "RiskOpportunity": "Risiko/Chance",
    "WSJF": "WSJF Score"
  };
  return translations[type] || type;
}

function getScoreBadgeClass(value: number): string {
  if (value >= 8) return "bg-red-100 text-red-800";
  if (value >= 5) return "bg-orange-100 text-orange-800";
  if (value >= 3) return "bg-yellow-100 text-yellow-800";
  return "bg-green-100 text-green-800";
}

interface CommonVotesTableProps {
  features?: Feature[];
}

const CommonVotesTable: React.FC<CommonVotesTableProps> = ({ features }) => {
  const [open, setOpen] = useState(true);
  if (!features || features.length === 0) {
    return <div className="mt-6">Keine Features verknüpft.</div>;
  }

  const featuresWithCommonVotes = features.filter(feature => feature.commonvotes && feature.commonvotes.length > 0);

  if (featuresWithCommonVotes.length === 0) {
    return <div className="mt-6">Keine Common Votes vorhanden.</div>;
  }

  const voteTypes = ["BusinessValue", "TimeCriticality", "RiskOpportunity"];

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Common Votes</CardTitle>
        <button
          type="button"
          className="text-sm text-blue-600 hover:underline focus:outline-none"
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? 'Weniger anzeigen' : 'Mehr anzeigen'}
        </button>
      </CardHeader>
      {open && (
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Jira Key</TableHead>
                <TableHead>Name</TableHead>
                {voteTypes.map(type => (
                  <TableHead key={type}>{translateVoteType(type)}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {featuresWithCommonVotes.map((feature) => (
                <TableRow key={feature.id}>
                  <TableCell>{feature.jira_key}</TableCell>
                  <TableCell>{feature.name}</TableCell>
                  {voteTypes.map(type => {
                    const vote = feature.commonvotes?.find(v => v.type === type);
                    return (
                      <TableCell key={type}>
                        {vote ? (
                          <Badge className={getScoreBadgeClass(vote.value)}>
                            {vote.value}
                          </Badge>
                        ) : "-"}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      )}
    </Card>
  );
};

export default CommonVotesTable;
