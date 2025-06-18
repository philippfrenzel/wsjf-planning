import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { router } from "@inertiajs/react";

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
  planningId: number;
}

const CommonVotesTable: React.FC<CommonVotesTableProps> = ({ features, planningId }) => {
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Handler für manuelles Anstoßen der Common Votes Berechnung
  const handleRecalculate = async () => {
    setLoading(true);
    setSuccess(false);
    try {
      await router.post(route("plannings.recalculate-commonvotes", { planning: planningId }));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (e) {
      // Fehlerbehandlung ggf. ergänzen
    } finally {
      setLoading(false);
    }
  };

  // Button immer anzeigen, unabhängig von Features/CommonVotes
  const recalcButton = (
    <button
      type="button"
      className={`text-sm px-2 py-1 rounded border border-blue-600 text-blue-600 hover:bg-blue-50 focus:outline-none ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={handleRecalculate}
      disabled={loading}
      title="Common Votes Berechnung manuell anstoßen"
    >
      {loading ? 'Berechne...' : 'Common Votes neu berechnen'}
    </button>
  );

  // Erfolgsmeldung ggf. anzeigen
  const successMsg = success && <span className="text-green-600 text-xs ml-2">Erfolgreich!</span>;

  // Wenn keine Features vorhanden
  if (!features || features.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>Common Votes</CardTitle>
          <div className="flex items-center gap-2">
            {recalcButton}
            {successMsg}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mt-6">Keine Features verknüpft.</div>
        </CardContent>
      </Card>
    );
  }

  const featuresWithCommonVotes = features.filter(feature => feature.commonvotes && feature.commonvotes.length > 0);
  const voteTypes = ["BusinessValue", "TimeCriticality", "RiskOpportunity"];

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>Common Votes</CardTitle>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="text-sm text-blue-600 hover:underline focus:outline-none"
            onClick={() => setOpen((prev) => !prev)}
          >
            {open ? 'Weniger anzeigen' : 'Mehr anzeigen'}
          </button>
          {recalcButton}
          {successMsg}
        </div>
      </CardHeader>
      {open && (
        <CardContent>
          {featuresWithCommonVotes.length === 0 ? (
            <div className="mt-6">Keine Common Votes vorhanden.</div>
          ) : (
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
          )}
        </CardContent>
      )}
    </Card>
  );
};

export default CommonVotesTable;
