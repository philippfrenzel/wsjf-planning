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
interface Feature {
  id: number;
  jira_key: string;
  name: string;
  description: string;
  requester_id: string | null;
  project_id: string;
}
interface EditProps {
  feature: Feature;
  projects: Project[];
  users: User[];
}

export default function Edit({ feature, projects, users }: EditProps) {
  const { errors } = usePage().props as { errors: Record<string, string> };
  const [values, setValues] = useState({
    jira_key: feature.jira_key || "",
    name: feature.name || "",
    description: feature.description || "",
    requester_id: feature.requester_id ? String(feature.requester_id) : "",
    project_id: feature.project_id ? String(feature.project_id) : "",
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
    Inertia.put(route("features.update", feature.id), values);
  };

  return (
    <AppLayout>
      <Card className="max-w-2xl mx-auto mt-8">
        <CardHeader>
          <CardTitle>Feature bearbeiten</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="jira_key">Jira Key</Label>
              <Input
                id="jira_key"
                name="jira_key"
                value={values.jira_key}
                onChange={handleChange}
                required
              />
              {errors.jira_key && (
                <p className="text-sm text-red-600 mt-1">{errors.jira_key}</p>
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
              <Label htmlFor="requester_id">Anforderer (optional)</Label>
              <Select
                value={values.requester_id || "none"}
                onValueChange={(value) =>
                  handleSelectChange("requester_id", value === "none" ? "" : value)
                }
              >
                <SelectTrigger id="requester_id">
                  <SelectValue placeholder="Anforderer wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.requester_id && (
                <p className="text-sm text-red-600 mt-1">{errors.requester_id}</p>
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