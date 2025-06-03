import { Button } from "@/components/ui/button";
import { CardHeader, CardTitle } from "@/components/ui/card";

interface FeatureHeaderProps {
  featureName: string;
  showComponentForm: boolean;
  toggleComponentForm: () => void;
}

export default function FeatureHeader({
  featureName,
  showComponentForm,
  toggleComponentForm,
}: FeatureHeaderProps) {
  return (
    <CardHeader>
      <CardTitle className="flex justify-between items-center">
        <span>{featureName}</span>
        <Button onClick={toggleComponentForm}>
          {showComponentForm ? "Abbrechen" : "Komponente hinzufügen"}
        </Button>
      </CardTitle>
    </CardHeader>
  );
}