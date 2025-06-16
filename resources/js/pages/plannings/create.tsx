import React, { useState } from "react";
import AppLayout from "@/layouts/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePage } from "@inertiajs/react";
import { Inertia } from "@inertiajs/inertia";

interface Project {
  id: number;
  name: string;
}

interface User {
  id: number;
  name: string;
}

interface CreateProps {
  projects: Project[];
  users: User[];
}

export default function Create({ projects, users }: CreateProps) {
  const { errors } = usePage().props as { errors: Record<string, string> };
  const [values, setValues] = useState({
    project_id: "",
    title: "",
    description: "",
    planned_at: "",
    executed_at: "",
    owner_id: "", // Neu: Owner-ID
    deputy_id: "", // Neu: Deputy-ID
    stakeholder_ids: [] as string[],
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (field: string, value: string) => {
    setValues({ ...values, [field]: value });
  };

  const handleStakeholderChange = (id: string) => {
    setValues((prev) => ({
      ...prev,
      stakeholder_ids: prev.stakeholder_ids.includes(id)
        ? prev.stakeholder_ids.filter((sid) => sid !== id)
        : [...prev.stakeholder_ids, id],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    Inertia.post(route("plannings.store"), {
      ...values,
      stakeholder_ids: values.stakeholder_ids ?? [],
    });
  };

  return (
    <AppLayout>
      <Card className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
        <CardHeader>
          <CardTitle>Neues Planning erstellen</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="project_id">Projekt</Label>
              <Select
                value={values.project_id}
                onValueChange={(value) => handleSelectChange("project_id", value)}
              >
                <SelectTrigger id="project_id">
                  <SelectValue placeholder="Projekt wählen" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.project_id && (
                <p className="text-sm text-red-600 mt-1">{errors.project_id}</p>
              )}
            </div>
            <div>
              <Label htmlFor="title">Titel</Label>
              <Input
                id="title"
                name="title"
                value={values.title}
                onChange={handleChange}
                required
              />
              {errors.title && (
                <p className="text-sm text-red-600 mt-1">{errors.title}</p>
              )}
            </div>
            <div>
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                name="description"
                value={values.description}
                onChange={handleChange}
              />
              {errors.description && (
                <p className="text-sm text-red-600 mt-1">{errors.description}</p>
              )}
            </div>
            
            {/* Neue Felder für Owner und Deputy */}
            <div>
              <Label htmlFor="owner_id">Hauptverantwortlicher</Label>
              <Select
                value={values.owner_id}
                onValueChange={(value) => handleSelectChange("owner_id", value)}
              >
                <SelectTrigger id="owner_id">
                  <SelectValue placeholder="Hauptverantwortlichen wählen" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.owner_id && (
                <p className="text-sm text-red-600 mt-1">{errors.owner_id}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="deputy_id">Stellvertreter</Label>
              <Select
                value={values.deputy_id}
                onValueChange={(value) => handleSelectChange("deputy_id", value)}
              >
                <SelectTrigger id="deputy_id">
                  <SelectValue placeholder="Stellvertreter wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Keinen Stellvertreter</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.deputy_id && (
                <p className="text-sm text-red-600 mt-1">{errors.deputy_id}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="planned_at">Geplant am</Label>
              <Input
                id="planned_at"
                name="planned_at"
                type="date"
                value={values.planned_at}
                onChange={handleChange}
              />
              {errors.planned_at && (
                <p className="text-sm text-red-600 mt-1">{errors.planned_at}</p>
              )}
            </div>
            <div>
              <Label htmlFor="executed_at">Durchgeführt am</Label>
              <Input
                id="executed_at"
                name="executed_at"
                type="date"
                value={values.executed_at}
                onChange={handleChange}
              />
              {errors.executed_at && (
                <p className="text-sm text-red-600 mt-1">{errors.executed_at}</p>
              )}
            </div>
            <div>
              <Label>Stakeholder</Label>
              <div className="flex flex-wrap gap-2">
                {users.map((user) => (
                  <label key={user.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={values.stakeholder_ids.includes(user.id.toString())}
                      onChange={() => handleStakeholderChange(user.id.toString())}
                    />
                    {user.name}
                  </label>
                ))}
              </div>
              {errors.stakeholder_ids && (
                <p className="text-sm text-red-600 mt-1">{errors.stakeholder_ids}</p>
              )}
            </div>
            <Button type="submit" className="w-full">
              Speichern
            </Button>
          </form>
        </CardContent>
      </Card>
    </AppLayout>
  );
}