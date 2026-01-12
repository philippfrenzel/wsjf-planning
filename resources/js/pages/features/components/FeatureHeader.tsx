import { CardHeader, CardTitle } from '@/components/ui/card';

interface FeatureHeaderProps {
    featureName: string;
}

export default function FeatureHeader({ featureName }: FeatureHeaderProps) {
    return (
        <CardHeader>
            <CardTitle className="flex items-center justify-between">
                <span>{featureName}</span>
            </CardTitle>
        </CardHeader>
    );
}
