import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FormEvent } from "react";

interface ComponentFormProps {
  componentData: {
    name: string;
    description: string;
  };
  onNameChange: (name: string) => void;
  onDescriptionChange: (description: string) => void;
  onSubmit: (e: FormEvent) => void;
}

export default function ComponentForm({
  componentData,
  onNameChange,
  onDescriptionChange,
  onSubmit,
}: ComponentFormProps) {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Neue Schätzungskomponente</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={componentData.name}
              onChange={(e) => onNameChange(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="description">Beschreibung</Label>
            <Textarea
              id="description"
              value={componentData.description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={3}
            />
          </div>
          <Button type="submit">Komponente erstellen</Button>
        </form>
      </CardContent>
    </Card>
  );
}