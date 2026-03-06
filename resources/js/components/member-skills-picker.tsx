import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';

interface SkillOption {
    id: number;
    name: string;
    category: string | null;
}

const LEVELS = [
    { value: 'basic', label: 'Grundkenntnisse' },
    { value: 'intermediate', label: 'Fortgeschritten' },
    { value: 'expert', label: 'Experte' },
];

const LEVEL_COLORS: Record<string, string> = {
    basic: 'text-blue-600',
    intermediate: 'text-amber-600',
    expert: 'text-green-600',
};

interface Props {
    skills: SkillOption[];
    /** Current skills for this member: { skillId: level } */
    userSkills: Record<number, string>;
    onToggle: (skillId: number) => void;
    onLevelChange: (skillId: number, level: string) => void;
}

export function MemberSkillsPicker({ skills, userSkills, onToggle, onLevelChange }: Props) {
    const grouped = skills.reduce<Record<string, SkillOption[]>>((acc, s) => {
        const cat = s.category || 'Allgemein';
        (acc[cat] ??= []).push(s);
        return acc;
    }, {});

    const categories = Object.keys(grouped).sort();
    const [activeTab, setActiveTab] = useState(categories[0] ?? '');

    if (skills.length === 0) return null;

    const selectedCount = Object.keys(userSkills).length;

    return (
        <div className="rounded-md border">
            <div className="flex items-center gap-2 border-b px-3 py-2">
                {selectedCount > 0 && (
                    <Badge variant="secondary" className="text-[10px]">{selectedCount} Skills</Badge>
                )}
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="border-b px-3 pt-1">
                    <TabsList className="h-auto flex-wrap gap-1">
                        {categories.map((cat) => {
                            const catAssigned = grouped[cat].filter((s) => !!userSkills[s.id]).length;
                            return (
                                <TabsTrigger key={cat} value={cat} className="text-xs px-2 py-1">
                                    {cat}
                                    {catAssigned > 0 && (
                                        <Badge variant="secondary" className="ml-1 h-4 min-w-4 px-1 text-[10px]">
                                            {catAssigned}
                                        </Badge>
                                    )}
                                </TabsTrigger>
                            );
                        })}
                    </TabsList>
                </div>
                {categories.map((cat) => {
                    const catSkills = grouped[cat];
                    return (
                        <TabsContent key={cat} value={cat} className="m-0">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b bg-muted/50 text-xs text-muted-foreground">
                                        <th className="w-10 px-3 py-1.5"></th>
                                        <th className="px-3 py-1.5 text-left font-medium">Skill</th>
                                        <th className="w-40 px-3 py-1.5 text-right font-medium">Level</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {catSkills.map((skill) => {
                                        const assigned = !!userSkills[skill.id];
                                        return (
                                            <tr
                                                key={skill.id}
                                                className={`border-b last:border-0 transition-colors ${assigned ? 'bg-primary/5' : 'hover:bg-muted/30'}`}
                                            >
                                                <td className="px-3 py-1.5 text-center">
                                                    <Checkbox
                                                        checked={assigned}
                                                        onCheckedChange={() => onToggle(skill.id)}
                                                    />
                                                </td>
                                                <td className="px-3 py-1.5">
                                                    <span className={`text-sm ${assigned ? 'font-medium' : ''}`}>{skill.name}</span>
                                                </td>
                                                <td className="px-3 py-1.5 text-right">
                                                    {assigned ? (
                                                        <Select value={userSkills[skill.id]} onValueChange={(v) => onLevelChange(skill.id, v)}>
                                                            <SelectTrigger className="ml-auto h-7 w-[140px] text-xs">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {LEVELS.map((l) => (
                                                                    <SelectItem key={l.value} value={l.value} className="text-xs">
                                                                        <span className={LEVEL_COLORS[l.value]}>{l.label}</span>
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </TabsContent>
                    );
                })}
            </Tabs>
        </div>
    );
}
