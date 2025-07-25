import React, { useState } from "react";
import { Inertia } from "@inertiajs/inertia";
import AppLayout from "@/layouts/app-layout";
import { usePage } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Beispiel: users als Prop (Inertia muss die User-Liste mitgeben)
interface User {
  id: number;
  name: string;
}

interface CreateProps {
  users: User[];
}

export default function Create({ users }: CreateProps) {
  const { errors } = usePage().props as { errors: Record<string, string> };
  
  // Breadcrumbs definieren
  const breadcrumbs = [
    { title: "Startseite", href: "/" },
    { title: "Projekte", href: route("projects.index") },
    { title: "Neues Projekt", href: "#" },
  ];
  
  const [values, setValues] = useState({
    project_number: "",
    name: "",
    description: "",
    jira_base_uri: "",
    start_date: "",
    end_date: "",
    project_leader_id: "",
    deputy_leader_id: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (field: string, value: string) => {
    setValues({ ...values, [field]: value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    Inertia.post(route("projects.store"), values);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Card className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
        <CardHeader>
          <CardTitle>Neues Projekt erstellen</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="project_number">Projektnummer</Label>
              <Input
                id="project_number"
                name="project_number"
                value={values.project_number}
                onChange={handleChange}
                required
              />
              {errors.project_number && (
                <p className="text-sm text-red-600 mt-1">{errors.project_number}</p>
              )}
            </div>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={values.name}
                onChange={handleChange}
                required
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">{errors.name}</p>
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
            <div>
              <Label htmlFor="jira_base_uri">JIRA Base URI</Label>
              <Input
                id="jira_base_uri"
                name="jira_base_uri"
                value={values.jira_base_uri}
                onChange={handleChange}
                placeholder="https://your-company.atlassian.net/browse/"
              />
              {errors.jira_base_uri && (
                <p className="text-sm text-red-600 mt-1">{errors.jira_base_uri}</p>
              )}
            </div>
            <div>
              <Label htmlFor="project_leader_id">Projektleiter</Label>
              <Select
                value={values.project_leader_id}
                onValueChange={(value) => handleSelectChange("project_leader_id", value)}
              >
                <SelectTrigger id="project_leader_id">
                  <SelectValue placeholder="Projektleiter wählen" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.project_leader_id && (
                <p className="text-sm text-red-600 mt-1">{errors.project_leader_id}</p>
              )}
            </div>
            <div>
              <Label htmlFor="deputy_leader_id">
                Stellvertretung Projektleiter
              </Label>
              <Select
                value={values.deputy_leader_id}
                onValueChange={(value) => handleSelectChange("deputy_leader_id", value)}
              >
                <SelectTrigger id="deputy_leader_id">
                  <SelectValue placeholder="Stellvertretung wählen" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.deputy_leader_id && (
                <p className="text-sm text-red-600 mt-1">{errors.deputy_leader_id}</p>
              )}
            </div>
            <div>
              <Label htmlFor="start_date">Startdatum</Label>
              <Input
                id="start_date"
                name="start_date"
                type="date"
                value={values.start_date}
                onChange={handleChange}
              />
              {errors.start_date && (
                <p className="text-sm text-red-600 mt-1">{errors.start_date}</p>
              )}
            </div>
            <div>
              <Label htmlFor="end_date">Enddatum</Label>
              <Input
                id="end_date"
                name="end_date"
                type="date"
                value={values.end_date}
                onChange={handleChange}
              />
              {errors.end_date && (
                <p className="text-sm text-red-600 mt-1">{errors.end_date}</p>
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