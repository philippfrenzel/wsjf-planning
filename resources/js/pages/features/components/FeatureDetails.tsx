import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface FeatureDetailsProps {
    jiraKey: string;
    projectName?: string;
    requesterName?: string;
    description?: string;
}

export default function FeatureDetails({ jiraKey, projectName, requesterName }: FeatureDetailsProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Feature Details</CardTitle>
            </CardHeader>
            <CardContent>
                <dl className="divide-y divide-slate-200">
                    <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[180px_1fr] sm:gap-2">
                        <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Jira Key</dt>
                        <dd className="text-sm font-semibold text-slate-900">{jiraKey || '-'}</dd>
                    </div>
                    <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[180px_1fr] sm:gap-2">
                        <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Projekt</dt>
                        <dd className="text-sm text-slate-900">{projectName ?? '-'}</dd>
                    </div>
                    <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[180px_1fr] sm:gap-2">
                        <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Anforderer</dt>
                        <dd className="text-sm text-slate-900">{requesterName ?? '-'}</dd>
                    </div>
                </dl>
            </CardContent>
        </Card>
    );
}
