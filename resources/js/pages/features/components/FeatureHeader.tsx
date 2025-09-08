import { CardHeader, CardTitle } from "@/components/ui/card";

interface FeatureHeaderProps {
  featureName: string;
}

export default function FeatureHeader({
  featureName,
}: FeatureHeaderProps) {
  return (
    <CardHeader>
      <CardTitle className="flex justify-between items-center">
        <span>{featureName}</span>
      </CardTitle>
    </CardHeader>
  );
}