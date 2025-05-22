import React, { useState } from "react";
import AppLayout from "@/layouts/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Inertia } from "@inertiajs/inertia";

interface Feature {
  id: number;
  jira_key: string;
  name: string;
}

interface VoteValue {
  [key: string]: string; // key: featureId_type, value: string (number)
}

interface SessionProps {
  planning: { id: number; title: string; project_id: number };
  features: Feature[];
  types: string[];
  existingVotes: Record<string, { value: number }>;
  user: { id: number; name: string };
}

export default function VoteSession({ planning, features, types, existingVotes, user }: SessionProps) {
  // State für alle Votes (key: featureId_type)
  const [votes, setVotes] = useState<VoteValue>(() => {
    const initial: VoteValue = {};
    Object.entries(existingVotes).forEach(([key, vote]) => {
      initial[key] = vote.value.toString();
    });
    return initial;
  });

  const handleChange = (featureId: number, type: string, value: string) => {
    setVotes((prev) => ({
      ...prev,
      [`${featureId}_${type}`]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // votes: { "featureId_type": value }
    Inertia.post(route("votes.session.store", planning.id), {
      votes,
    });
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto mt-8">
        <Card>
          <CardHeader>
            <CardTitle>
              Abstimmung für Planning: <span className="font-semibold">{planning.title}</span>
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
                          <span className="font-medium">{feature.jira_key}</span>
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