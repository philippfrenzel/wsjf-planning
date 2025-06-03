import React from "react";
import { Head, usePage } from "@inertiajs/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Estimation {
    id: number;
    title: string;
    description: string;
    amount: number;
    status: string;
    created_at: string;
    updated_at: string;
    // Füge hier weitere Felder hinzu, falls deine Estimation mehr Werte hat
}

export default function EstimationShow() {
    const { estimation } = usePage().props as { estimation: Estimation };

    return (
        <>
            <Head title={`Estimation: ${estimation.title}`} />
            <div className="max-w-xl mx-auto mt-10">
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {estimation.title}
                            <Badge className="ml-2" variant="outline">
                                {estimation.status}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <strong>ID:</strong> {estimation.id}
                            </div>
                            <div>
                                <strong>Beschreibung:</strong> {estimation.description}
                            </div>
                            <div>
                                <strong>Betrag:</strong> {estimation.amount} €
                            </div>
                            <div>
                                <strong>Status:</strong> {estimation.status}
                            </div>
                            <div>
                                <strong>Erstellt am:</strong> {new Date(estimation.created_at).toLocaleString()}
                            </div>
                            <div>
                                <strong>Zuletzt aktualisiert:</strong> {new Date(estimation.updated_at).toLocaleString()}
                            </div>
                        </div>
                        <div className="mt-6 flex gap-2">
                            <Button variant="outline" asChild>
                                <a href={route("estimations.index")}>Zurück zur Übersicht</a>
                            </Button>
                            <Button asChild>
                                <a href={route("estimations.edit", estimation.id)}>Bearbeiten</a>
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}