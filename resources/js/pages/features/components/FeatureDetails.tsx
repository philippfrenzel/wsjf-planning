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
}: FeatureDetailsProps) {
  // Beschreibung wird jetzt separat dargestellt
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
    </div>
  );
}