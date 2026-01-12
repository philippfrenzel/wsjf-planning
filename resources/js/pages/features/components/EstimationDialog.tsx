import { FormEvent } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EstimationData {
  best_case: number;
  most_likely: number;
  worst_case: number;
  unit: string;
  notes: string;
}

interface EstimationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  estimationData: EstimationData;
  isEditing?: boolean;
  onBestCaseChange: (value: number) => void;
  onMostLikelyChange: (value: number) => void;
  onWorstCaseChange: (value: number) => void;
  onUnitChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
}

export default function EstimationDialog({
  open,
  onOpenChange,
  estimationData,
  isEditing = false,
  onBestCaseChange,
  onMostLikelyChange,
  onWorstCaseChange,
  onUnitChange,
  onNotesChange,
  onSubmit,
}: EstimationDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Schätzung bearbeiten' : 'Neue Schätzung'}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Bearbeiten Sie die Werte der ausgewählten Schätzung.'
              : 'Geben Sie die Werte für Ihre neue Schätzung ein.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="best_case">Best Case</Label>
              <Input
                id="best_case"
                type="number"
                step="0.1"
                min="0"
                value={estimationData.best_case || ""}
                onChange={(e) => {
                  const value = e.target.value === "" ? 0 : parseFloat(e.target.value);
                  onBestCaseChange(isNaN(value) ? 0 : value);
                }}
                required
              />
            </div>
            <div>
              <Label htmlFor="most_likely">Most Likely</Label>
              <Input
                id="most_likely"
                type="number"
                step="0.1"
                min="0"
                value={estimationData.most_likely || ""}
                onChange={(e) => {
                  const value = e.target.value === "" ? 0 : parseFloat(e.target.value);
                  onMostLikelyChange(isNaN(value) ? 0 : value);
                }}
                required
              />
            </div>
            <div>
              <Label htmlFor="worst_case">Worst Case</Label>
              <Input
                id="worst_case"
                type="number"
                step="0.1"
                min="0"
                value={estimationData.worst_case || ""}
                onChange={(e) => {
                  const value = e.target.value === "" ? 0 : parseFloat(e.target.value);
                  onWorstCaseChange(isNaN(value) ? 0 : value);
                }}
                required
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="unit">Einheit</Label>
            <Select 
              value={estimationData.unit} 
              onValueChange={onUnitChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Einheit wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hours">Stunden</SelectItem>
                <SelectItem value="days">Tage</SelectItem>
                <SelectItem value="story_points">Story Points</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="notes">Notizen</Label>
            <Textarea
              id="notes"
              value={estimationData.notes}
              onChange={(e) => onNotesChange(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="cancel"
              onClick={() => onOpenChange(false)}
            >
              Abbrechen
            </Button>
            <Button type="submit" variant="success">
              {isEditing ? 'Schätzung aktualisieren' : 'Schätzung speichern'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}