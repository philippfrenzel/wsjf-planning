import { type BreadcrumbItem } from '@/types';
import { Head, router, useForm } from '@inertiajs/react';
import { FormEventHandler, useState } from 'react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { Copy, Check, Trash2, Key } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'API Tokens',
        href: '/settings/tokens',
    },
];

interface Token {
    id: number;
    name: string;
    abilities: string[];
    last_used_at: string | null;
    created_at: string;
}

export default function Tokens({ tokens, newToken }: { tokens: Token[]; newToken?: string }) {
    const [copied, setCopied] = useState(false);

    const { data, setData, post, errors, processing, reset } = useForm({ name: '' });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('tokens.store'), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    const copyToken = () => {
        if (newToken) {
            navigator.clipboard.writeText(newToken);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const deleteToken = (id: number) => {
        if (confirm('Diesen Token wirklich löschen? Der Zugriff wird sofort widerrufen.')) {
            router.delete(route('tokens.destroy', id), { preserveScroll: true });
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="API Tokens" />

            <SettingsLayout>
                {newToken && (
                    <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                        <CardHeader>
                            <CardTitle className="text-green-800 dark:text-green-200">Token erstellt</CardTitle>
                            <CardDescription className="text-green-700 dark:text-green-300">
                                Kopiere diesen Token jetzt — er wird nicht erneut angezeigt.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2">
                                <code className="bg-green-100 dark:bg-green-900 text-green-900 dark:text-green-100 flex-1 rounded px-3 py-2 text-sm font-mono break-all">
                                    {newToken}
                                </code>
                                <Button size="icon" variant="outline" onClick={copyToken} title="Kopieren">
                                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card>
                    <CardHeader>
                        <CardTitle>Neuen API Token erstellen</CardTitle>
                        <CardDescription>
                            API Tokens ermöglichen die Authentifizierung gegenüber dem MCP-Server (z.B. aus VS Code, Claude Code oder Copilot CLI).
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Token-Name</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="z.B. VS Code, Claude Code, Copilot CLI …"
                                    required
                                />
                                <InputError message={errors.name} />
                            </div>
                            <Button disabled={processing}>Token erstellen</Button>
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Aktive Tokens</CardTitle>
                        <CardDescription>
                            Verwalte deine API Tokens. Lösche Tokens, die du nicht mehr benötigst.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {tokens.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
                                <Key className="h-8 w-8" />
                                <p>Noch keine API Tokens erstellt.</p>
                            </div>
                        ) : (
                            <div className="divide-y">
                                {tokens.map((token) => (
                                    <div key={token.id} className="flex items-center justify-between py-3">
                                        <div className="space-y-1">
                                            <p className="font-medium text-sm">{token.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Erstellt: {new Date(token.created_at).toLocaleDateString('de-CH')}
                                                {token.last_used_at && (
                                                    <> · Zuletzt verwendet: {new Date(token.last_used_at).toLocaleDateString('de-CH')}</>
                                                )}
                                            </p>
                                        </div>
                                        <Button size="icon" variant="destructive" onClick={() => deleteToken(token.id)} title="Token löschen">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </SettingsLayout>
        </AppLayout>
    );
}
