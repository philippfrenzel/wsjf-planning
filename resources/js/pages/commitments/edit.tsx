import React from "react";
import { useForm } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import AppLayout from "@/layouts/app-layout";

interface Planning {
  id: number;
  title: string;
}

interface User {
  id: number;
  name: string;
}

interface Feature {
  id: number;
  jira_key: string;
  name: string;
}

interface CommitmentType {
  value: string;
  label: string;
}

interface StatusOption {
  value: string;
  label: string;
  color: string;
}

interface Commitment {
  id: number;
  planning: Planning;
  feature_id: number;
  user_id: number;
  commitment_type: string;
  status_details?: {
    value: string;
    name: string;
    color: string;
  };
}

interface EditCommitmentProps {
  commitment: Commitment;
  features: Feature[];
  users: User[];
  commitmentTypes: CommitmentType[];
  statusOptions: StatusOption[];
  currentStatus: string;
  possibleTransitions: StatusOption[];
}

export default function EditCommitment({ commitment, features, users, commitmentTypes, statusOptions, currentStatus, possibleTransitions }: EditCommitmentProps) {
  const { data, setData, put, processing, errors } = useForm({
    feature_id: String(commitment.feature_id),
    user_id: String(commitment.user_id),
    commitment_type: commitment.commitment_type,
    status: commitment.status_details?.value || currentStatus,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    put(route("commitments.update", commitment.id));
  };

  return (
    <AppLayout breadcrumbs={[
      { title: "Commitments", href: route("commitments.index") },
      { title: "Commitment bearbeiten", href: route("commitments.edit", commitment.id) }
    ]}>
      <div className="py-6">
        <h1 className="text-2xl font-bold mb-6">Commitment bearbeiten</h1>

        <Card>
          <CardHeader>
            <CardTitle>
              Commitment für Planning: {commitment.planning.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Feature */}
              <div>
                <Label htmlFor="feature_id">Feature</Label>
                <Select 
                  value={data.feature_id} 
                  onValueChange={(value) => setData("feature_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Feature auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {features.map((feature) => (
                      <SelectItem key={feature.id} value={String(feature.id)}>
                        {feature.jira_key}: {feature.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.feature_id && (
                  <p className="text-sm text-red-600 mt-1">{errors.feature_id}</p>
                )}
              </div>

              {/* User */}
              <div>
                <Label htmlFor="user_id">Benutzer</Label>
                <Select 
                  value={data.user_id} 
                  onValueChange={(value) => setData("user_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Benutzer auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={String(user.id)}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.user_id && (
                  <p className="text-sm text-red-600 mt-1">{errors.user_id}</p>
                )}
              </div>

              {/* Commitment-Type */}
              <div>
                <Label htmlFor="commitment_type">Commitment-Typ</Label>
                <Select 
                  value={data.commitment_type} 
                  onValueChange={(value) => setData("commitment_type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Commitment-Typ wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {commitmentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.commitment_type && (
                  <p className="text-sm text-red-600 mt-1">{errors.commitment_type}</p>
                )}
              </div>



              {/* Status */}
              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={data.status} 
                  onValueChange={(value) => setData("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {possibleTransitions.length > 0 ? (
                      possibleTransitions.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          <div className="flex items-center">
                            <span className={`inline-block w-3 h-3 rounded-full mr-2 ${status.color.replace('bg-', 'bg-').replace('text-', '')}`} />
                            {status.label}
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      // Wenn keine Übergänge möglich sind, zeige nur den aktuellen Status an
                      <SelectItem value={data.status}>
                        <div className="flex items-center">
                          <span className={`inline-block w-3 h-3 rounded-full mr-2 ${commitment.status_details?.color || ''}`} />
                          {commitment.status_details?.name || "Status nicht gesetzt"}
                        </div>
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-sm text-red-600 mt-1">{errors.status}</p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => window.history.back()}>
                  Abbrechen
                </Button>
                <Button type="submit" disabled={processing}>
                  {processing ? "Wird gespeichert..." : "Änderungen speichern"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
