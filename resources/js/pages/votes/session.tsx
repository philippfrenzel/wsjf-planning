import React, { useState } from "react";
import AppLayout from "@/layouts/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Inertia } from "@inertiajs/inertia";
import { usePage } from "@inertiajs/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface Feature {
  id: number;
  jira_key: string;
  name: string;
  description?: string; // Beschreibung ergänzen
}

interface Planning {
  id: number;
  title: string;
  project_id: number;
}

interface VoteValue {
  [key: string]: string; // key: featureId_type, value: string (number)
}

interface SessionProps {
  planning: Planning;
  plannings: Planning[];
  features: Feature[];
  types: string[];
  existingVotes: Record<string, { value: number }>;
  user: { id: number; name: string };
}

export default function VoteSession({ planning, plannings, features, types, existingVotes, user }: SessionProps) {
  const { props } = usePage();
  const [votes, setVotes] = useState<VoteValue>(() => {
    const initial: VoteValue = {};
    Object.entries(existingVotes).forEach(([key, vote]) => {
      initial[key] = vote.value.toString();
    });
    return initial;
  });

  const [selectedPlanning, setSelectedPlanning] = useState<string>(
    planning && planning.id ? planning.id.toString() : (plannings[0]?.id?.toString() ?? "")
  );

  // Modal-Status, wenn success-Message vorhanden
  const [open, setOpen] = useState(!!props.success);

  // State für das aktuell gehoverte Feature
  const [hoveredFeature, setHoveredFeature] = useState<Feature | null>(null);

  const handleChange = (featureId: number, type: string, value: string) => {
    setVotes((prev) => ({
      ...prev,
      [`${featureId}_${type}`]: value,
    }));
  };

  const handlePlanningChange = (planningId: string) => {
    setSelectedPlanning(planningId);
    Inertia.get(route("votes.session", planningId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    Inertia.post(route("votes.session.store", planning.id), {
      votes,
    });
  };

  // Modal schließen
  const handleCloseModal = () => setOpen(false);

  return (
    <AppLayout>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Erfolg</DialogTitle>
          </DialogHeader>
          <div>{props.success}</div>
          <DialogFooter>
            <Button onClick={handleCloseModal}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Feature-Beschreibung-Dialog */}
      <Dialog open={!!hoveredFeature} onOpenChange={() => setHoveredFeature(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {hoveredFeature?.jira_key}: {hoveredFeature?.name}
            </DialogTitle>
          </DialogHeader>
          <div>
            {hoveredFeature?.description
              ? hoveredFeature.description
              : "Keine Beschreibung vorhanden."}
          </div>
          <DialogFooter>
            <Button onClick={() => setHoveredFeature(null)}>Schließen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="max-w-5xl mx-auto mt-8">
        <Card>
          <CardHeader>
            <CardTitle>
              Abstimmung für Planning:
              <span className="font-semibold ml-2">
                <Select value={selectedPlanning} onValueChange={handlePlanningChange}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Planning wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {plannings.map((p) => (
                      <SelectItem key={p.id} value={p.id.toString()}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </span>
            </CardTitle>
            <div className="text-sm text-muted-foreground">
              Angemeldet als: {user.name}
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Feature</TableHead>
                    {types.map((type) => (
                      <TableHead key={type}>{type}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {features.map((feature) => (
                    <TableRow key={feature.id}>
                      <TableCell>
                        <div>
                          <span
                            className="font-medium cursor-pointer underline decoration-dotted"
                            onMouseEnter={() => setHoveredFeature(feature)}
                            onMouseLeave={() => setHoveredFeature(null)}
                            onClick={() => setHoveredFeature(feature)}
                          >
                            {feature.jira_key}
                          </span>
                          <div className="text-xs text-muted-foreground">{feature.name}</div>
                        </div>
                      </TableCell>
                      {types.map((type) => (
                        <TableCell key={type}>
                          <Input
                            type="number"
                            step="any"
                            min="0"
                            name={`vote_${feature.id}_${type}`}
                            value={votes[`${feature.id}_${type}`] || ""}
                            onChange={(e) =>
                              handleChange(feature.id, type, e.target.value)
                            }
                            placeholder="Wert"
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-6 flex justify-end">
                <Button type="submit">Abstimmung speichern</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}