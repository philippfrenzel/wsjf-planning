import DependencyManager from './DependencyManager';

interface DependencyItem {
    id: number;
    type: 'ermoeglicht' | 'verhindert' | 'bedingt' | 'ersetzt' | string;
    related: { id: number; jira_key: string; name: string } | null;
}

interface DependenciesSectionProps {
    featureId: number;
    featureOptions: { id: number; jira_key: string; name: string }[];
    dependencies: DependencyItem[];
}

export default function DependenciesSection({ featureId, featureOptions, dependencies }: DependenciesSectionProps) {
    return <DependencyManager featureId={featureId} options={featureOptions} initialItems={dependencies} />;
}
