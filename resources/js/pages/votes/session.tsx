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
  description?: string;
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

  // State für das aktuell ausgewählte Feature im Dialog
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);

  // Logik zum Behandeln von Duplikaten in den Voting-Werten
  const handleChange = (featureId: number, type: string, value: string) => {
    setVotes((prevVotes) => {
      // Neuen Wert eintragen
      const newVotes = { ...prevVotes, [`${featureId}_${type}`]: value };
      
      // Wenn der Wert leer ist, keine weitere Prüfung durchführen
      if (value === "") {
        return newVotes;
      }

      // Numerischer Wert für den Vergleich
      const numValue = parseFloat(value);
      
      // Duplikate finden und behandeln
      // 1. Alle vorhandenen Werte für den gleichen Typ sammeln
      const typeVotes = Object.entries(newVotes)
        .filter(([key, _]) => key.endsWith(`_${type}`))
        .filter(([key, _]) => key !== `${featureId}_${type}`) // Aktuelles Feature ausschließen
        .map(([key, val]) => ({
          key,
          value: parseFloat(val)
        }))
        .filter(vote => !isNaN(vote.value)); // Nicht-numerische Werte ausschließen
      
      // 2. Prüfen, ob der neue Wert bereits für diesen Typ verwendet wird
      const duplicates = typeVotes.filter(vote => vote.value === numValue);
      
      if (duplicates.length > 0) {
        // 3. Alle Werte größer oder gleich dem duplizierten Wert um 1 erhöhen
        typeVotes
          .filter(vote => vote.value >= numValue)
          .forEach(vote => {
            const newValue = vote.value + 1;
            newVotes[vote.key] = newValue.toString();
          });
      }
      
      return newVotes;
    });
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
      <Dialog open={!!selectedFeature} onOpenChange={() => setSelectedFeature(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedFeature?.jira_key}: {selectedFeature?.name}
            </DialogTitle>
          </DialogHeader>
          <div>
            {selectedFeature?.description
              ? selectedFeature.description
              : "Keine Beschreibung vorhanden."}
          </div>
          <DialogFooter>
            <Button onClick={() => setSelectedFeature(null)}>Schließen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="w-full mx-auto mt-8">
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
                            onClick={() =>
                              setSelectedFeature(
                                selectedFeature?.id === feature.id ? null : feature
                              )
                            }
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