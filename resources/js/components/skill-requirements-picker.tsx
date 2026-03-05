import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Zap } from 'lucide-react';
import { useState } from 'react';

export interface SkillOption {
    id: number;
    name: string;
    category: string | null;
}

export interface SkillRequirement {
    skill_id: number;
    level: string;
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
    requirements: SkillRequirement[];
    onToggle: (skillId: number) => void;
    onLevelChange: (skillId: number, level: string) => void;
}

export function SkillRequirementsPicker({ skills, requirements, onToggle, onLevelChange }: Props) {
    const grouped = skills.reduce<Record<string, SkillOption[]>>((acc, s) => {
        const cat = s.category || 'Allgemein';
        (acc[cat] ??= []).push(s);
        return acc;
    }, {});

    const categories = Object.keys(grouped).sort();
    const [activeTab, setActiveTab] = useState(categories[0] ?? '');

    if (skills.length === 0) return null;

    const selectedCount = requirements.length;

    return (
        <div className="rounded-md border">
            <div className="flex items-center gap-2 border-b px-4 py-3">
                <Zap className="h-4 w-4" />
                <span className="text-base font-semibold">Benötigte Skills</span>
                {selectedCount > 0 && (
                    <Badge variant="secondary" className="ml-1">{selectedCount} ausgewählt</Badge>
                )}
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="border-b px-4 pt-2">
                    <TabsList className="h-auto flex-wrap gap-1">
                        {categories.map((cat) => {
                            const catReqs = grouped[cat].filter((s) => requirements.some((r) => r.skill_id === s.id));
                            return (
                                <TabsTrigger key={cat} value={cat} className="text-xs px-2.5 py-1.5">
                                    {cat}
                                    {catReqs.length > 0 && (
                                        <Badge variant="secondary" className="ml-1.5 h-4 min-w-4 px-1 text-[10px]">
                                            {catReqs.length}
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
                                        <th className="w-10 px-4 py-2"></th>
                                        <th className="px-4 py-2 text-left font-medium">Skill</th>
                                        <th className="w-40 px-4 py-2 text-left font-medium">Level</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {catSkills.map((skill) => {
                                        const req = requirements.find((r) => r.skill_id === skill.id);
                                        return (
                                            <tr
                                                key={skill.id}
                                                className={`border-b last:border-0 cursor-pointer transition-colors ${req ? 'bg-primary/5' : 'hover:bg-muted/30'}`}
                                                onClick={() => onToggle(skill.id)}
                                            >
                                                <td className="px-4 py-2 text-center">
                                                    <Checkbox
                                                        checked={!!req}
                                                        onCheckedChange={() => onToggle(skill.id)}
                                                        onClick={(e) => e.stopPropagation()}
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <span className={`text-sm ${req ? 'font-medium' : ''}`}>{skill.name}</span>
                                                </td>
                                                <td className="px-4 py-2" onClick={(e) => e.stopPropagation()}>
                                                    {req ? (
                                                        <Select value={req.level} onValueChange={(v) => onLevelChange(skill.id, v)}>
                                                            <SelectTrigger className="h-7 w-full text-xs">
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
