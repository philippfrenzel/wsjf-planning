import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Table } from '@/components/ui/table';
import { Link, usePage } from '@inertiajs/react';
import { Pencil } from 'lucide-react';
import React from 'react';

// Beispiel für ein einfaches UI-Komponenten-Set

interface EstimationComponent {
    id: number;
    name: string;
    description: string;
    value: number;
    created_at: string;
    updated_at: string;
}

interface PageProps {
    estimationcomponent: EstimationComponent;
}

const EstimationComponentShow: React.FC = () => {
    const { props } = usePage<PageProps>();
    const { estimationcomponent } = props;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <h2 className="text-xl font-bold">Estimation Component Details</h2>
                <Button asChild variant="outline" size="sm">
                    <Link href={route('estimation-components.edit', estimationcomponent.id)}>
                        <Pencil className="mr-1 h-4 w-4" /> Bearbeiten
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                {estimationcomponent && estimationcomponent.id ? (
                    <Table>
                        <tbody>
                            <tr>
                                <th className="pr-4 text-left">ID</th>
                                <td>{estimationcomponent.id}</td>
                            </tr>
                            <tr>
                                <th className="pr-4 text-left">Name</th>
                                <td>{estimationcomponent.name}</td>
                            </tr>
                            <tr>
                                <th className="pr-4 text-left">Description</th>
                                <td>{estimationcomponent.description}</td>
                            </tr>
                            <tr>
                                <th className="pr-4 text-left">Value</th>
                                <td>{estimationcomponent.value}</td>
                            </tr>
                            <tr>
                                <th className="pr-4 text-left">Created At</th>
                                <td>{estimationcomponent.created_at}</td>
                            </tr>
                            <tr>
                                <th className="pr-4 text-left">Updated At</th>
                                <td>{estimationcomponent.updated_at}</td>
                            </tr>
                        </tbody>
                    </Table>
                ) : (
                    <p>Komponente wird geladen...</p>
                )}
            </CardContent>
        </Card>
    );
};

export default EstimationComponentShow;
