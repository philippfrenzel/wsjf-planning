import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Save, X } from 'lucide-react';
import { FormEvent } from 'react';

interface ComponentData {
    name: string;
    description: string;
}

interface EditComponentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    componentData: ComponentData;
    onNameChange: (name: string) => void;
    onDescriptionChange: (description: string) => void;
    onSubmit: (e: FormEvent) => void;
}

export default function EditComponentDialog({
    open,
    onOpenChange,
    componentData,
    onNameChange,
    onDescriptionChange,
    onSubmit,
}: EditComponentDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Komponente bearbeiten</DialogTitle>
                    <DialogDescription>Hier können Sie den Namen und die Beschreibung der Komponente ändern.</DialogDescription>
                </DialogHeader>
                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="edit-name">Name</Label>
                        <Input id="edit-name" value={componentData.name} onChange={(e) => onNameChange(e.target.value)} required />
                    </div>
                    <div>
                        <Label htmlFor="edit-description">Beschreibung</Label>
                        <Textarea
                            id="edit-description"
                            value={componentData.description}
                            onChange={(e) => onDescriptionChange(e.target.value)}
                            rows={3}
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="cancel" onClick={() => onOpenChange(false)}>
                            <X />
                            Abbrechen
                        </Button>
                        <Button type="submit" variant="success">
                            <Save />
                            Änderungen speichern
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
