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

  // Breadcrumbs definieren
  const breadcrumbs = [
    { title: "Startseite", href: "/" },
    { title: "Plannings", href: "/plannings" },
    { title: planning?.title || "Abstimmung", href: null },
  ];

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

  // Erweiterte Logik zum Behandeln von Duplikaten und Lücken in den Voting-Werten
  const handleChange = (featureId: number, type: string, value: string) => {
    setVotes((prevVotes) => {
      // Neuen Wert eintragen
      const newVotes = { ...prevVotes };
      
      // Wenn der Wert leer ist, einfach entfernen und zurückgeben
      const featureKey = `${featureId}_${type}`;
      if (value === "") {
        delete newVotes[featureKey];
        return ensureUniqueValues(newVotes, type, features.length);
      }

      // Numerischer Wert für den Vergleich
      let numValue = parseFloat(value);
      const featureCount = features.length;
      
      // Ungültigen Wert korrigieren (max = Anzahl der Features)
      if (numValue > featureCount) {
        numValue = featureCount;
        value = featureCount.toString();
      }
      
      // Alten Wert des aktuellen Features finden (falls vorhanden)
      const oldValue = parseFloat(prevVotes[featureKey]);
      const hasOldValue = !isNaN(oldValue);
      
      // Neuen Wert eintragen
      newVotes[featureKey] = value;
      
      // Maximalwert-Szenario: Wenn der neue Wert dem Maximum entspricht
      if (numValue === featureCount && hasOldValue) {
        // Verringere alle Werte zwischen dem alten Wert und dem Maximum um 1
        const currentTypeVotes = getTypeVotes(prevVotes, type, featureKey);
        
        currentTypeVotes
          .filter(vote => vote.value > oldValue && vote.value <= featureCount)
          .sort((a, b) => a.value - b.value) // Aufsteigend sortieren
          .forEach(vote => {
            newVotes[vote.key] = (vote.value - 1).toString();
          });
      }
      
      // Nach allen Anpassungen die Eindeutigkeit aller Werte sicherstellen
      // und dabei den aktuellen Vote als festen Ankerpunkt behandeln
      return ensureUniqueValues(newVotes, type, featureCount, featureKey, numValue);
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
    <AppLayout breadcrumbs={breadcrumbs}>
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
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedFeature?.jira_key}: {selectedFeature?.name}
            </DialogTitle>
          </DialogHeader>
          
          {/* Hier die Änderung: Verwenden von dangerouslySetInnerHTML */}
          <div className="prose prose-sm max-w-none overflow-auto">
            {selectedFeature?.description ? (
              <div dangerouslySetInnerHTML={{ __html: selectedFeature.description }} />
            ) : (
              <p>Keine Beschreibung vorhanden.</p>
            )}
          </div>
          
          <DialogFooter>
            <Button onClick={() => setSelectedFeature(null)}>Schließen</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="w-full mx-auto mt-8 px-10">
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

// Hilfsfunktion zum Extrahieren aller Werte für einen bestimmten Typ
const getTypeVotes = (votes: VoteValue, type: string, excludeKey?: string) => {
  return Object.entries(votes)
    .filter(([key]) => key.endsWith(`_${type}`))
    .filter(([key]) => !excludeKey || key !== excludeKey)
    .map(([key, val]) => ({
      key,
      value: parseFloat(val)
    }))
    .filter(vote => !isNaN(vote.value));
};

// Ursprüngliche Funktion beibehalten für den Fall, dass kein fester Wert gesetzt ist
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const ensureUniqueValuesStandard = (votes: VoteValue, _unusedType: string, _unusedMaxValue: number) => {
  return { ...votes };
};

// Erweiterte Hilfsfunktion zur Sicherstellung eindeutiger, fortlaufender Werte
// mit Berücksichtigung eines festen Ankerpunkts
const ensureUniqueValues = (
  votes: VoteValue, 
  type: string, 
  maxValue: number, 
  fixedKey?: string, 
  fixedValue?: number
) => {
  const result = { ...votes };
  
  // Wenn kein fester Wert definiert ist, Standard-Verhalten beibehalten
  if (!fixedKey || fixedValue === undefined) {
    return ensureUniqueValuesStandard(result, type, maxValue);
  }

  // Sammle alle Werte für diesen Typ
  const typeVotes = getTypeVotes(result, type)
    .filter(vote => vote.key !== fixedKey) // Festen Vote ausschließen
    .sort((a, b) => a.value - b.value); // Sortiere aufsteigend nach Wert
  
  if (typeVotes.length === 0) return result; // Nur der feste Vote existiert

  // Duplikat des festen Werts behandeln
  const fixedValueDuplicates = typeVotes.filter(vote => vote.value === fixedValue);
  
  if (fixedValueDuplicates.length > 0) {
    // Wenn der feste Wert bereits verwendet wird, müssen andere Votes angepasst werden
    // Erhöhe alle Werte >= dem fixedValue (außer dem fixedKey selbst)
    typeVotes
      .filter(vote => vote.value >= fixedValue)
      .sort((a, b) => b.value - a.value) // Absteigend sortieren für Konfliktfreiheit
      .forEach(vote => {
        // Erhöhe den Wert, aber begrenzt auf das Maximum
        const newValue = Math.min(vote.value + 1, maxValue);
        result[vote.key] = newValue.toString();
      });
  }
  
  // Teile die Votes in "vor dem festen Wert" und "nach dem festen Wert" auf
  let lowerVotes = typeVotes.filter(vote => 
    parseFloat(result[vote.key]) < fixedValue
  );
  
  let higherVotes = typeVotes.filter(vote => 
    parseFloat(result[vote.key]) > fixedValue
  );
  
  // Prüfen, ob genügend Platz im höheren Bereich vorhanden ist
  const higherSlotsAvailable = maxValue - fixedValue;
  
  // Wenn nicht genügend Platz im höheren Bereich vorhanden ist,
  // verschiebe die niedrigsten Werte in den unteren Bereich
  if (higherVotes.length > higherSlotsAvailable) {
    // Sortiere higherVotes nach Wert (aufsteigend)
    higherVotes.sort((a, b) => parseFloat(result[a.key]) - parseFloat(result[b.key]));
    
    // Bestimme, wie viele Werte verschoben werden müssen
    const valuesToMove = Math.min(
      higherVotes.length - higherSlotsAvailable,
      fixedValue - 1 - lowerVotes.length // Verfügbare Plätze im unteren Bereich
    );
    
    if (valuesToMove > 0) {
      // Verschiebe die niedrigsten Werte in den unteren Bereich
      const movingVotes = higherVotes.slice(0, valuesToMove);
      higherVotes = higherVotes.slice(valuesToMove);
      
      // Weise diesen Werten vorübergehend Werte zu, die unter dem fixedValue liegen
      movingVotes.forEach((vote, index) => {
        // Beginne mit dem höchsten verfügbaren Wert unter fixedValue und arbeite rückwärts
        const newValue = fixedValue - 1 - index;
        if (newValue > 0) { // Stell sicher, dass wir nicht unter 1 fallen
          result[vote.key] = newValue.toString();
        } else {
          // Falls kein Platz mehr, setze auf den kleinsten möglichen Wert (1)
          result[vote.key] = "1";
        }
      });
      
      // Aktualisiere lowerVotes mit den verschobenen Votes
      lowerVotes = typeVotes.filter(vote => 
        parseFloat(result[vote.key]) < fixedValue
      );
    }
  }
  
  // Reorganisiere niedrigere Werte (1 bis fixedValue-1)
  reorganizeVotes(result, lowerVotes, 1, fixedValue - 1);
  
  // Reorganisiere höhere Werte (fixedValue+1 bis maxValue)
  reorganizeVotes(result, higherVotes, fixedValue + 1, maxValue);
  
  return result;
};

// Hilfsfunktion zur Reorganisation einer Gruppe von Votes in einem bestimmten Bereich
const reorganizeVotes = (
  result: VoteValue, 
  votes: Array<{key: string, value: number}>,
  minValue: number,
  maxValue: number
) => {
  if (votes.length === 0 || minValue > maxValue) return;
  
  // Sortiere Votes nach aktuellem Wert
  const sortedVotes = [...votes].sort((a, b) => {
    // Aktuelle Werte aus dem result-Objekt nehmen (könnten sich geändert haben)
    const aValue = parseFloat(result[a.key]);
    const bValue = parseFloat(result[b.key]);
    return aValue - bValue;
  });
  
  // Verteile die Votes gleichmäßig im verfügbaren Bereich
  const availableSlots = maxValue - minValue + 1;
  
  if (sortedVotes.length <= availableSlots) {
    // Es gibt genug Platz für alle Votes
    sortedVotes.forEach((vote, index) => {
      result[vote.key] = (minValue + index).toString();
    });
  } else {
    // Es gibt mehr Votes als verfügbare Slots
    // In diesem Fall packen wir überschüssige Votes auf den maxValue
    sortedVotes.forEach((vote, index) => {
      if (index < availableSlots - 1) {
        result[vote.key] = (minValue + index).toString();
      } else {
        // Überschüssige Votes bekommen den Maximalwert
        result[vote.key] = maxValue.toString();
      }
    });
  }
};