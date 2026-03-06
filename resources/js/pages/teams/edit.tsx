import InputError from '@/components/input-error';
import { MemberSkillsPicker } from '@/components/member-skills-picker';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import AppLayout from '@/layouts/app-layout';
import { router, useForm } from '@inertiajs/react';
import { LoaderCircle, Save, X, Zap } from 'lucide-react';
import type { BreadcrumbItem } from '@/types';
import { useState } from 'react';

interface User {
    id: number;
    name: string;
    email: string;
}

interface SkillOption {
    id: number;
    name: string;
    category: string | null;
}

interface MemberSkill {
    id: number;
    name: string;
    pivot: { level: string };
}

interface Member {
    id: number;
    name: string;
    email: string;
    skills?: MemberSkill[];
}

interface Team {
    id: number;
    name: string;
    description: string | null;
    members: Member[];
}

export default function Edit({ team, users, skills }: { team: Team; users: User[]; skills: SkillOption[] }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Startseite', href: '/' },
        { title: 'Teams', href: '/teams' },
        { title: team.name, href: '#' },
    ];

    const { data, setData, put, processing, errors } = useForm({
        name: team.name,
        description: team.description ?? '',
        members: team.members.map((m) => m.id),
    });

    // Track member skills locally: { [userId]: { [skillId]: level } }
    const [memberSkills, setMemberSkills] = useState<Record<number, Record<number, string>>>(() => {
        const init: Record<number, Record<number, string>> = {};
        for (const m of team.members) {
            init[m.id] = {};
            for (const s of m.skills ?? []) {
                init[m.id][s.id] = s.pivot.level;
            }
        }
        return init;
    });
    const [savingSkills, setSavingSkills] = useState(false);

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        put(route('teams.update', team.id));
    }

    function toggleMember(userId: number) {
        setData('members', data.members.includes(userId)
            ? data.members.filter((id) => id !== userId)
            : [...data.members, userId]);
    }

    function toggleSkill(userId: number, skillId: number) {
        setMemberSkills((prev) => {
            const userSkills = { ...prev[userId] };
            if (userSkills[skillId]) {
                delete userSkills[skillId];
            } else {
                userSkills[skillId] = 'basic';
            }
            return { ...prev, [userId]: userSkills };
        });
    }

    function setSkillLevel(userId: number, skillId: number, level: string) {
        setMemberSkills((prev) => ({
            ...prev,
            [userId]: { ...prev[userId], [skillId]: level },
        }));
    }

    function saveSkills() {
        setSavingSkills(true);
        const payload = {
            member_skills: data.members.map((userId) => ({
                user_id: userId,
                skill_ids: Object.keys(memberSkills[userId] ?? {}).map(Number),
                levels: memberSkills[userId] ?? {},
            })),
        };
        router.put(route('teams.member-skills.update', team.id), payload as never, {
            onFinish: () => setSavingSkills(false),
        });
    }

    const selectedMembers = users.filter((u) => data.members.includes(u.id));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="mx-auto w-full max-w-3xl space-y-6 p-5">
                <Card>
                    <CardHeader>
                        <CardTitle>Team bearbeiten</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                                <InputError message={errors.name} />
                            </div>
                            <div>
                                <Label htmlFor="description">Beschreibung</Label>
                                <Textarea id="description" value={data.description} onChange={(e) => setData('description', e.target.value)} rows={3} />
                                <InputError message={errors.description} />
                            </div>
                            <div>
                                <Label>Mitglieder</Label>
                                <div className="mt-2 max-h-60 space-y-2 overflow-y-auto rounded-md border p-3">
                                    {users.map((user) => (
                                        <label key={user.id} className="flex items-center gap-2 text-sm">
                                            <Checkbox
                                                checked={data.members.includes(user.id)}
                                                onCheckedChange={() => toggleMember(user.id)}
                                            />
                                            {user.name} <span className="text-muted-foreground">({user.email})</span>
                                        </label>
                                    ))}
                                </div>
                                <InputError message={errors.members} />
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" disabled={processing}>
                                    {processing ? <LoaderCircle className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
                                    Speichern
                                </Button>
                                <Button type="button" variant="outline" onClick={() => history.back()}>
                                    <X className="mr-1 h-4 w-4" /> Abbrechen
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* Skill assignment per member */}
                {skills.length > 0 && selectedMembers.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Zap className="h-5 w-5" /> Skills pro Mitglied
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {selectedMembers.map((member) => {
                                const userSkills = memberSkills[member.id] ?? {};
                                return (
                                    <div key={member.id}>
                                        <div className="mb-2 font-medium">{member.name}</div>
                                        <MemberSkillsPicker
                                            skills={skills}
                                            userSkills={userSkills}
                                            onToggle={(skillId) => toggleSkill(member.id, skillId)}
                                            onLevelChange={(skillId, level) => setSkillLevel(member.id, skillId, level)}
                                        />
                                    </div>
                                );
                            })}
                            <Button onClick={saveSkills} disabled={savingSkills}>
                                {savingSkills ? <LoaderCircle className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
                                Skills speichern
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}

