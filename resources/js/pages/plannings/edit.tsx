import React, { useState } from "react";
import AppLayout from "@/layouts/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
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
  project_id: number;
}

interface Planning {
  id: number;
  project_id: number;
  title: string;
  description: string;
  planned_at: string;
  executed_at: string;
  stakeholders: User[];
  features?: Feature[];
  //hier fehlen die datumsfelder
  planned_at?: string; // Geplant am
  executed_at?: string; // Durchgeführt am
  // Neu: Felder für Owner und Deputy
  owner_id?: number;    // Neu: Owner ID
  deputy_id?: number;   // Neu: Deputy ID
  owner?: User;         // Neu: Owner-Beziehung
  deputy?: User;        // Neu: Deputy-Beziehung
}

interface EditProps {
  planning: Planning;
  projects: Project[];
  users: User[];
  features: Feature[]; // Features aus dem gleichen Projekt
}

export default function Edit({ 
  planning, 
  projects, 
  users, 
  features = [] // Standardwert als leeres Array
}: EditProps) {
  const { errors } = usePage().props as { errors: Record<string, string> };
  const [values, setValues] = useState({
    project_id: planning.project_id ? String(planning.project_id) : "",
    title: planning.title || "",
    description: planning.description || "",
    planned_at: planning.planned_at || "",
    executed_at: planning.executed_at || "",
    owner_id: planning.owner_id ? String(planning.owner_id) : "",     // Neu: Owner-ID
    deputy_id: planning.deputy_id ? String(planning.deputy_id) : "",  // Neu: Deputy-ID
    stakeholder_ids: planning.stakeholders
      ? planning.stakeholders.map((u) => String(u.id))
      : [],
    feature_ids: planning.features
      ? planning.features.map((f) => String(f.id))
      : [],
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

  const handleFeatureChange = (id: string) => {
    setValues((prev) => ({
      ...prev,
      feature_ids: prev.feature_ids.includes(id)
        ? prev.feature_ids.filter((fid) => fid !== id)
        : [...prev.feature_ids, id],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    Inertia.put(route("plannings.update", planning.id), {
      ...values,
      // Konvertiere "none" zu null für das Backend
      deputy_id: values.deputy_id === "none" ? null : values.deputy_id,
    });
  };

  return (
    <AppLayout>
      <Card className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
        <CardHeader>
          <CardTitle>Planning bearbeiten</CardTitle>
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
                  <SelectItem value="none">Keinen Stellvertreter</SelectItem>
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
                {users.length === 0 && (
                  <span className="text-sm text-gray-500">Keine Benutzer vorhanden.</span>
                )}
                {users.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24">Auswählen</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>E-Mail</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="text-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4"
                              checked={values.stakeholder_ids.includes(user.id.toString())}
                              onChange={() => handleStakeholderChange(user.id.toString())}
                            />
                          </TableCell>
                          <TableCell>{user.name}</TableCell>
                          <TableCell>{user.email}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
              {errors.stakeholder_ids && (
                <p className="text-sm text-red-600 mt-1">{errors.stakeholder_ids}</p>
              )}
            </div>
            <div>
              <Label>Features aus dem gleichen Projekt</Label>
              <div className="flex flex-wrap gap-2">
                {features.length === 0 && (
                  <span className="text-sm text-gray-500">Keine Features im Projekt vorhanden.</span>
                )}
                {features.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-24">Auswählen</TableHead>
                        <TableHead>Jira Key</TableHead>
                        <TableHead>Name</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {features.map((feature) => (
                        <TableRow key={feature.id}>
                          <TableCell className="text-center">
                            <input
                              type="checkbox"
                              className="h-4 w-4"
                              checked={values.feature_ids.includes(feature.id.toString())}
                              onChange={() => handleFeatureChange(feature.id.toString())}
                            />
                          </TableCell>
                          <TableCell>{feature.jira_key}</TableCell>
                          <TableCell>{feature.name}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
              {errors.feature_ids && (
                <p className="text-sm text-red-600 mt-1">{errors.feature_ids}</p>
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