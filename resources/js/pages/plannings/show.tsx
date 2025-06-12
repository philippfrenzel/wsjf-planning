import React, { useState } from "react";
import AppLayout from "@/layouts/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";

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
  stakeholders: User[];
  features?: Feature[];
}

interface ShowProps {
  planning: Planning;
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

// Neue CommonVotesTable Komponente
function CommonVotesTable({ features }: { features?: Feature[] }) {
  if (!features || features.length === 0) {
    return <div className="mt-6">Keine Features verknüpft.</div>;
  }
  
  // console.log("Features für CommonVotesTable:", features);

  // Alle Features mit mindestens einem Common Vote filtern
  const featuresWithCommonVotes = features
    .filter(feature => feature.commonvotes && feature.commonvotes.length > 0);
  
  if (featuresWithCommonVotes.length === 0) {
    return <div className="mt-6">Keine Common Votes vorhanden.</div>;
  }
  
  // Die Vote-Typen, die wir anzeigen wollen
  const voteTypes = ["BusinessValue", "TimeCriticality", "RiskOpportunity"];
  
  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-2">Common Votes (Ersteller)</h2>
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

export default function Show({ planning }: ShowProps) {
  return (
    <AppLayout>
      <div className="w-full max-w-full px-0">
        <Card className="w-full">
          <CardHeader>
            <CardTitle>{planning.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="details" className="w-full">
              <TabsList>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="features">Features & Individual Votes</TabsTrigger>
              </TabsList>
              <TabsContent value="details">
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableHead className="w-1/4">Projekt</TableHead>
                      <TableCell>{planning.project?.name ?? "-"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableHead className="w-1/4">Geplant am</TableHead>
                      <TableCell>{planning.planned_at ?? "-"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableHead className="w-1/4">Durchgeführt am</TableHead>
                      <TableCell>{planning.executed_at ?? "-"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableHead className="w-1/4">Beschreibung</TableHead>
                      <TableCell>{planning.description ?? "-"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableHead className="w-1/4">Erstellt von</TableHead>
                      <TableCell>{planning.creator?.name ?? "-"}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableHead className="w-1/4">Stakeholder</TableHead>
                      <TableCell>
                        {planning.stakeholders.length > 0
                          ? planning.stakeholders.map((u) => u.name).join(", ")
                          : "-"}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
                
                {/* Common Votes Tabelle unter den Details einfügen */}
                {planning.creator && planning.features && (
                  <CommonVotesTable features={planning.features} />
                )}
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