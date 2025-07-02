import React, { useState, useEffect } from "react";
import { useForm } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import AppLayout from "@/layouts/app-layout";
import axios from "axios";

interface Planning {
  id: number;
  title: string;
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

interface CreateCommitmentProps {
  plannings: Planning[];
  features: Feature[];
  commitmentTypes: CommitmentType[];
  statusOptions: StatusOption[];
  selectedPlanning?: number;
  selectedFeature?: number;
}

export default function CreateCommitment({ 
  plannings, 
  features: initialFeatures,
  commitmentTypes,
  statusOptions,
  selectedPlanning,
  selectedFeature
}: CreateCommitmentProps) {
  const { data, setData, post, processing, errors } = useForm({
    planning_id: selectedPlanning ? String(selectedPlanning) : "",
    feature_id: selectedFeature ? String(selectedFeature) : "",
    commitment_type: "",
    status: "suggested", // Default-Status ist "Vorschlag"
  });
  
  // State für allgemeine Fehlermeldungen
  const [generalError, setGeneralError] = useState<string | null>(null);

  const [availableFeatures, setAvailableFeatures] = useState<Feature[]>(initialFeatures);
  const [isLoadingFeatures, setIsLoadingFeatures] = useState(false);

  // Wenn sich das ausgewählte Planning ändert, Features neu laden
  useEffect(() => {
    if (data.planning_id) {
      setIsLoadingFeatures(true);
      setGeneralError(null);

      // Features für das ausgewählte Planning laden
      axios.post(route('api.planning-features'), {
        planning_id: data.planning_id
      })
        .then(response => {
          console.log("API-Antwort für Features:", response.data);
          setAvailableFeatures(response.data);
          setIsLoadingFeatures(false);
        })
        .catch(error => {
          console.error("Fehler beim Laden der Features:", error);
          setAvailableFeatures([]);
          setIsLoadingFeatures(false);
          setGeneralError("Features konnten nicht geladen werden. Bitte versuchen Sie es erneut.");
        });

      // Feature zurücksetzen, wenn sich das Planning ändert
      setData("feature_id", "");
    } else {
      setAvailableFeatures([]);
    }
  }, [data.planning_id, setData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    post(route("commitments.store"), {
      onError: (errors) => {
        if (errors.commitment) {
          setGeneralError(errors.commitment);
        }
      }
    });
  };

  return (
    <AppLayout breadcrumbs={[
      { title: "Commitments", href: route("commitments.index") },
      { title: "Neues Commitment", href: "" }
    ]}>
      <div className="py-6">
        <h1 className="text-2xl font-bold mb-6">Neues Commitment erstellen</h1>

        <Card>
          <CardHeader>
            <CardTitle>Commitment-Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Planning */}
              <div>
                <Label htmlFor="planning_id">Planning</Label>
                <Select 
                  value={data.planning_id} 
                  onValueChange={(value) => setData("planning_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Planning auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {plannings.map((planning) => (
                      <SelectItem key={planning.id} value={String(planning.id)}>
                        {planning.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.planning_id && (
                  <p className="text-sm text-red-600 mt-1">{errors.planning_id}</p>
                )}
              </div>

              {/* Feature */}
              <div>
                <Label htmlFor="feature_id">Feature</Label>
                <Select 
                  value={data.feature_id} 
                  onValueChange={(value) => setData("feature_id", value)}
                  disabled={!data.planning_id || isLoadingFeatures}
                >
                  <SelectTrigger>
                    <SelectValue 
                      placeholder={
                        isLoadingFeatures 
                          ? "Features werden geladen..." 
                          : !data.planning_id 
                            ? "Erst Planning wählen" 
                            : availableFeatures.length === 0 
                              ? "Keine Features verfügbar" 
                              : "Feature auswählen"
                      } 
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFeatures.map((feature) => (
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

              {/* Angemeldeter Benutzer wird automatisch im Backend verwendet */}

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
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        <div className="flex items-center">
                          <span className={`inline-block w-3 h-3 rounded-full mr-2 ${status.color.replace('bg-', 'bg-').replace('text-', '')}`} />
                          {status.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-sm text-red-600 mt-1">{errors.status}</p>
                )}
              </div>

              {/* Genereller Fehler */}
              {generalError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
                  <p className="text-red-700">{generalError}</p>
                </div>
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={processing}>
                  {processing ? "Wird gespeichert..." : "Commitment erstellen"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
