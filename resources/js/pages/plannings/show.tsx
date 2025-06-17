import React, { useState } from "react";
import AppLayout from "@/layouts/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
// StakeholderTable Komponente importieren
import StakeholderTable from "./components/StakeholderTable";
import PlanningDetailsCard from "./components/PlanningDetailsCard";

// Interface für Stakeholder anpassen (mit votes_count)
interface Stakeholder {
  id: number;
  name: string;
  email?: string;
  votes_count: number;  // Hinzugefügt für die Stimmenzählung
}

interface User {
  id: number;
  name: string;
}

interface Project {
  id: number;
  name: string;
}

interface Vote {
  user_id: number;
  user: User;
  type: string; // "BusinessValue", "TimeCriticality", "RiskOpportunity"
  value: number;
}

interface Feature {
  id: number;
  jira_key: string;
  name: string;
  project_id: number;
  votes?: Vote[];
  commonvotes?: Vote[]; // Vom Controller dediziert geladene Common Votes
}

interface Planning {
  id: number;
  title: string;
  description: string;
  planned_at: string;
  executed_at: string;
  project?: Project;
  stakeholders: Stakeholder[];  // Geändert zu Stakeholder statt User
  features?: Feature[];
  creator?: User;  // Für Ersteller-Angabe
}

interface ShowProps {
  planning: Planning;
  stakeholders: Stakeholder[];  // Ergänzt: vom Controller direkt übergebene Stakeholder
}

function FeaturesTable({ features }: { features?: Feature[] }) {
  const [expandedFeature, setExpandedFeature] = useState<number | null>(null);
  
  if (!features || features.length === 0) {
    return <div className="mt-6">Keine Features verknüpft.</div>;
  }
  
  // Gruppiere Vote-Typen für Spaltenüberschriften
  const voteTypes = features
    .flatMap(feature => feature.votes || [])
    .map(vote => vote.type)
    .filter((value, index, self) => self.indexOf(value) === index)
    .sort();
  
  // Bestimme alle Benutzer, die Votes abgegeben haben
  const usersWithVotes = features
    .flatMap(feature => feature.votes || [])
    .map(vote => vote.user)
    .filter((user, index, self) => self.findIndex(u => u.id === user.id) === index)
    .sort((a, b) => a.name.localeCompare(b.name));
  
  const toggleFeatureExpand = (featureId: number) => {
    setExpandedFeature(expandedFeature === featureId ? null : featureId);
  };

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-2">Verknüpfte Features</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>Jira Key</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Votes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {features.map((feature) => (
            <React.Fragment key={feature.id}>
              <TableRow 
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => toggleFeatureExpand(feature.id)}
              >
                <TableCell>
                  <Button variant="ghost" size="sm">
                    {expandedFeature === feature.id ? 
                      <ChevronDown className="h-4 w-4" /> : 
                      <ChevronRight className="h-4 w-4" />}
                  </Button>
                </TableCell>
                <TableCell>{feature.jira_key}</TableCell>
                <TableCell>{feature.name}</TableCell>
                <TableCell>
                  {feature.votes && feature.votes.length > 0 ? (
                    <Badge variant="outline" className="bg-blue-50">
                      {feature.votes.length} Votes
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">Keine Votes</span>
                  )}
                </TableCell>
              </TableRow>
              
              {expandedFeature === feature.id && feature.votes && feature.votes.length > 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="p-0">
                    <div className="px-4 py-3 bg-muted/30">
                      <h3 className="text-sm font-medium mb-2">Abgegebene Votes:</h3>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Benutzer</TableHead>
                            {voteTypes.map(type => (
                              <TableHead key={type}>
                                {translateVoteType(type)}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {usersWithVotes.map(user => (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">{user.name}</TableCell>
                              {voteTypes.map(type => {
                                const vote = feature.votes?.find(v => 
                                  v.user_id === user.id && v.type === type
                                );
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
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Hilfsfunktion zur Übersetzung der Vote-Typen
function translateVoteType(type: string): string {
  const translations: {[key: string]: string} = {
    "BusinessValue": "Geschäftswert",
    "TimeCriticality": "Zeitkritikalität",
    "RiskOpportunity": "Risiko/Chance",
    "WSJF": "WSJF Score"
  };
  return translations[type] || type;
}

// Hilfsfunktion zur Bestimmung der Badge-Klasse basierend auf dem Score-Wert
function getScoreBadgeClass(value: number): string {
  if (value >= 8) return "bg-red-100 text-red-800";
  if (value >= 5) return "bg-orange-100 text-orange-800";
  if (value >= 3) return "bg-yellow-100 text-yellow-800";
  return "bg-green-100 text-green-800";
}

export default function Show({ planning, stakeholders }: ShowProps) {
  return (
    <AppLayout>
      <div className="w-full max-w-full px-10">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>{planning.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="details" className="w-full">
              <TabsList>
                <TabsTrigger value="details">Details & Common Vote</TabsTrigger>
                <TabsTrigger value="features">Features & Individual Votes</TabsTrigger>
              </TabsList>
              <TabsContent value="details">
                <PlanningDetailsCard planning={planning} stakeholders={stakeholders} />
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