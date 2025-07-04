import React, { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { router, useForm } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import CommitmentModal from "./CommitmentModal";

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

interface StatusDetails {
  value: string;
  name: string;
  color: string;
}

interface Commitment {
  id: number;
  user_id: number;
  user: User;
  planning_id?: number;
  feature_id?: number;
  commitment_type: string; // A, B, C, D
  status_details?: StatusDetails;
}

interface Feature {
  id: number;
  jira_key: string;
  name: string;
  project_id: number;
  commonvotes?: Vote[];
  commitments?: Commitment[]; // Hinzugefügt: Commitments für dieses Feature
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

function getScoreBadgeClass(value: number, min: number, max: number): string {
  if (max === min) return "bg-green-100 text-green-800";
  const step = (max - min) / 4;
  if (value >= min + 3 * step) return "bg-red-100 text-red-800";
  if (value >= min + 2 * step) return "bg-orange-100 text-orange-800";
  if (value >= min + step) return "bg-yellow-100 text-yellow-800";
  return "bg-green-100 text-green-800";
}

function getCommitmentTypeBadgeClass(type: string): string {
  const classes: {[key: string]: string} = {
    'D': "bg-red-100 text-red-800",
    'C': "bg-blue-100 text-blue-800",
    'B': "bg-yellow-100 text-yellow-800",
    'A': "bg-green-100 text-green-800",
  };
  return classes[type] || "bg-gray-100 text-gray-800";
}

function getCommitmentTypeLabel(type: string): string {
  const labels: {[key: string]: string} = {
    'A': 'Typ A - Hohe Priorität & Dringlichkeit',
    'B': 'Typ B - Hohe Priorität, geringe Dringlichkeit',
    'C': 'Typ C - Geringe Priorität, hohe Dringlichkeit',
    'D': 'Typ D - Geringe Priorität & Dringlichkeit',
  };
  return labels[type] || type;
}

interface CommonVotesTableProps {
  features?: Feature[];
  planningId: number;
}

const CommonVotesTable: React.FC<CommonVotesTableProps> = ({ features, planningId }) => {
  const [open, setOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sort, setSort] = useState<{type: string, direction: 'asc'|'desc'} | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<Feature | null>(null);
  const [selectedCommitment, setSelectedCommitment] = useState<Commitment | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form für das neue oder zu bearbeitende Commitment
  const { data, setData, processing, errors, reset } = useForm({
    planning_id: planningId.toString(),
    feature_id: "",
    commitment_type: "",
    status: "suggested" // Default-Status ist "Vorschlag"
  });
  
  // Status-Optionen und mögliche Übergänge
  const [currentStatus, setCurrentStatus] = useState<string | null>(null);
  const [possibleTransitions, setPossibleTransitions] = useState<Array<{value: string, label: string, color: string}>>([]);

  function sortFeatures(features: Feature[], type: string, direction: 'asc'|'desc') {
    return [...features].sort((a, b) => {
      const aVote = a.commonvotes?.find(v => v.type === type)?.value;
      const bVote = b.commonvotes?.find(v => v.type === type)?.value;
      if (aVote == null && bVote == null) return 0;
      if (aVote == null) return 1;
      if (bVote == null) return -1;
      return direction === 'asc' ? aVote - bVote : bVote - aVote;
    });
  }
  
  // Handler zum Öffnen des Modals für ein neues Commitment
  const handleOpenCommitmentModal = (feature: Feature) => {
    setSelectedFeature(feature);
    setSelectedCommitment(null);
    setIsEditing(false);
    setCurrentStatus(null);
    setPossibleTransitions([]);
    setData({
      planning_id: planningId.toString(),
      feature_id: feature.id.toString(),
      commitment_type: "",
      status: "suggested"
    });
    setModalOpen(true);
  };
  
  // Handler zum Öffnen des Modals für die Bearbeitung eines Commitments
  const handleEditCommitmentModal = (feature: Feature, commitment: Commitment) => {
    setSelectedFeature(feature);
    setSelectedCommitment(commitment);
    setIsEditing(true);
    
    // Setze den aktuellen Status
    const statusValue = commitment.status_details?.value || "suggested";
    setCurrentStatus(statusValue);
    
    // Setze mögliche Status-Übergänge basierend auf dem aktuellen Status
    // Diese sollten idealerweise vom Backend kommen, aber für jetzt verwenden wir eine einfache Logik
    const transitions: Array<{value: string, label: string, color: string}> = [];
    
    if (statusValue === "suggested") {
      transitions.push(
        { value: "accepted", label: "Angenommen", color: "bg-yellow-100 text-yellow-800" },
        { value: "completed", label: "Erledigt", color: "bg-green-100 text-green-800" }
      );
    } else if (statusValue === "accepted") {
      transitions.push(
        { value: "completed", label: "Erledigt", color: "bg-green-100 text-green-800" }
      );
    }
    
    setPossibleTransitions(transitions);
    
    // Formular-Daten setzen
    setData({
      planning_id: planningId.toString(),
      feature_id: feature.id.toString(),
      commitment_type: commitment.commitment_type,
      status: statusValue
    });
    
    setModalOpen(true);
  };
  
  // Handler zum Schließen des Modals
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedFeature(null);
    setSelectedCommitment(null);
    setIsEditing(false);
    setCurrentStatus(null);
    setPossibleTransitions([]);
    reset();
  };
  
  // Handler zum Absenden des Formulars
  const handleSubmitCommitment = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditing && selectedCommitment) {
      // Update-Pfad für existierendes Commitment
      const updateData = {
        ...data,
        planning_id: planningId,
        user_id: selectedCommitment.user_id, // Wichtig: user_id muss für das Update mitgesendet werden
      };
      
      // Inertia-Router für das Update verwenden
      router.put(route("commitments.update", { commitment: selectedCommitment.id }), updateData, {
        preserveState: true,
        onSuccess: () => {
          handleCloseModal();
          // Direkt zur Planning-Show-Seite navigieren
          router.get(route("plannings.show", { planning: planningId }));
        },
        onError: (errors: object) => {
          console.error("Fehler beim Aktualisieren:", errors);
        }
      });
    } else {
      // Create-Pfad für neues Commitment
      // Inertia-Router für die Erstellung verwenden
      router.post(route("commitments.store"), data, {
        preserveState: true,
        onSuccess: () => {
          handleCloseModal();
          // Direkt zur Planning-Show-Seite navigieren
          router.get(route("plannings.show", { planning: planningId }));
        },
        onError: (errors: object) => {
          console.error("Fehler beim Erstellen:", errors);
        }
      });
    }
  };

  // Handler für manuelles Anstoßen der Common Votes Berechnung
  const handleRecalculate = async () => {
    setLoading(true);
    setSuccess(false);
    try {
      await router.post(route("plannings.recalculate-commonvotes", { planning: planningId }));
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch {
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
  
  // Commitments-Typen sind jetzt in der CommitmentModal-Komponente definiert
  const voteTypes = ["BusinessValue", "TimeCriticality", "RiskOpportunity"];

  // Min/Max für jeden Typ berechnen
  const minMax: Record<string, {min: number, max: number}> = {};
  voteTypes.forEach(type => {
    const values = featuresWithCommonVotes
      .map(f => f.commonvotes?.find(v => v.type === type)?.value)
      .filter((v): v is number => typeof v === 'number');
    minMax[type] = {
      min: values.length ? Math.min(...values) : 0,
      max: values.length ? Math.max(...values) : 0,
    };
  });

  const sortedFeatures = sort && sort.type ? sortFeatures(featuresWithCommonVotes, sort.type, sort.direction) : featuresWithCommonVotes;

  return (
    <>
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
                      <TableHead
                        key={type}
                        className="cursor-pointer select-none"
                        onClick={() => setSort(s => s && s.type === type ? {type, direction: s.direction === 'asc' ? 'desc' : 'asc'} : {type, direction: 'asc'})}
                      >
                        {translateVoteType(type)}
                        {sort?.type === type && (
                          <span className="ml-1">{sort.direction === 'asc' ? '▲' : '▼'}</span>
                        )}
                      </TableHead>
                    ))}
                    <TableHead>Commitment</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedFeatures.map((feature) => (
                    <TableRow key={feature.id}>
                      <TableCell>{feature.jira_key}</TableCell>
                      <TableCell>{feature.name}</TableCell>
                      {voteTypes.map(type => {
                        const vote = feature.commonvotes?.find(v => v.type === type);
                        return (
                          <TableCell key={type}>
                            {vote ? (
                              <Badge className={getScoreBadgeClass(vote.value, minMax[type].min, minMax[type].max)}>
                                {vote.value}
                              </Badge>
                            ) : "-"}
                          </TableCell>
                        );
                      })}
                      <TableCell>
                        {feature.commitments && feature.commitments.length > 0 ? (
                          <Badge 
                            className={`${getCommitmentTypeBadgeClass(feature.commitments[0].commitment_type)} cursor-pointer hover:opacity-80`} 
                            onClick={() => feature.commitments && handleEditCommitmentModal(feature, feature.commitments[0])}
                          >
                            {getCommitmentTypeLabel(feature.commitments[0].commitment_type)}
                          </Badge>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleOpenCommitmentModal(feature)}
                            className="p-1"
                          >
                            <PlusCircle className="h-4 w-4 text-blue-600" />
                            <span className="ml-1 text-xs text-blue-600">Commitment erstellen</span>
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        {feature.commitments && feature.commitments.length > 0 && feature.commitments[0].status_details ? (
                          <Badge 
                            className={`${feature.commitments[0].status_details.color} cursor-pointer hover:opacity-80`}
                            onClick={() => feature.commitments && handleEditCommitmentModal(feature, feature.commitments[0])}
                          >
                            {feature.commitments[0].status_details.name}
                          </Badge>
                        ) : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        )}
      </Card>
      
      {/* Modal für das Erstellen oder Bearbeiten eines Commitments */}
      <CommitmentModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitCommitment}
        selectedFeature={selectedFeature}
        selectedCommitment={selectedCommitment}
        isEditing={isEditing}
        data={data}
        setData={(newData) => setData({...data, ...newData})}
        processing={processing}
        errors={errors}
        currentStatus={currentStatus || undefined}
        possibleTransitions={possibleTransitions}
      />
    </>
  );
};

export default CommonVotesTable;
