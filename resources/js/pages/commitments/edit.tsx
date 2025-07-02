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
              {/* Feature - Read-Only */}
              <div>
                <Label htmlFor="feature_id">Feature</Label>
                <div className="flex items-center p-2 border rounded-md bg-gray-50">
                  {features.find(f => f.id === Number(data.feature_id))?.jira_key}: {features.find(f => f.id === Number(data.feature_id))?.name}
                </div>
                <input type="hidden" name="feature_id" value={data.feature_id} />
                {errors.feature_id && (
                  <p className="text-sm text-red-600 mt-1">{errors.feature_id}</p>
                )}
              </div>

              {/* User - Read-Only */}
              <div>
                <Label htmlFor="user_id">Benutzer</Label>
                <div className="flex items-center p-2 border rounded-md bg-gray-50">
                  {users.find(u => u.id === Number(data.user_id))?.name}
                </div>
                <input type="hidden" name="user_id" value={data.user_id} />
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



              {/* Status - Current Status Read-Only und Transitionen als Auswahlliste */}
              <div className="space-y-4">
                {/* Aktueller Status - Read-Only */}
                <div>
                  <Label>Aktueller Status</Label>
                  <div className="flex items-center p-2 border rounded-md bg-gray-50">
                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${commitment.status_details?.color || ''}`} />
                    {commitment.status_details?.name || "Status nicht gesetzt"}
                  </div>
                </div>

                {/* Status-Transitionen */}
                {possibleTransitions.length > 0 && (
                  <div>
                    <Label htmlFor="status">Status ändern zu</Label>
                    <Select 
                      value={data.status} 
                      onValueChange={(value) => setData("status", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Neuen Status wählen" />
                      </SelectTrigger>
                      <SelectContent>
                        {possibleTransitions.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            <div className="flex items-center">
                              <span className={`inline-block w-3 h-3 rounded-full mr-2 ${status.color}`} />
                              {status.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                {possibleTransitions.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Keine weiteren Status-Übergänge möglich.
                  </p>
                )}

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
