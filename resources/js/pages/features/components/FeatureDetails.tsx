import FeatureDescription from "./FeatureDescription";

interface FeatureDetailsProps {
  jiraKey: string;
  projectName?: string;
  requesterName?: string;
  description?: string;
}

export default function FeatureDetails({
  jiraKey,
  projectName,
  requesterName,
  description,
}: FeatureDetailsProps) {
  // FeatureDescription Editor importieren
  // ...existing code...
  return (
    <div className="grid gap-4 mb-6">
      <div>
        <strong>Jira Key:</strong> {jiraKey}
      </div>
      <div>
        <strong>Projekt:</strong> {projectName ?? "-"}
      </div>
      <div>
        <strong>Anforderer:</strong> {requesterName ?? "-"}
      </div>
      <div>
        <strong>Beschreibung:</strong>
        {description ? (
          <div className="mt-2">
            {/* Read-only Editor für die Beschreibung */}
            <FeatureDescription content={description} />
          </div>
        ) : (
          "-"
        )}
      </div>
    </div>
  );
}