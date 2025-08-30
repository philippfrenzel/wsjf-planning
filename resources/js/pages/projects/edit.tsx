import React, { useState } from "react";
import { Inertia } from "@inertiajs/inertia";
import AppLayout from "@/layouts/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePage } from "@inertiajs/react";

interface User {
  id: number;
  name: string;
}

interface Project {
  id: number;
  project_number: string;
  name: string;
  description: string;
  jira_base_uri: string;
  start_date: string;
  end_date: string;
  status: string;
  project_leader_id: string;
  deputy_leader_id: string;
}

interface StatusOption {
  value: string;
  label: string;
  color: string;
  current: boolean;
}

interface CurrentStatus {
  name: string;
  color: string;
}

interface EditProps {
  project: Project;
  users: User[];
  currentStatus: CurrentStatus;
  statusOptions: StatusOption[];
}

export default function Edit({ project, users, currentStatus, statusOptions }: EditProps) {
  const { errors } = usePage().props as { errors: Record<string, string> };
  
  // Breadcrumbs definieren
  const breadcrumbs = [
    { title: "Startseite", href: "/" },
    { title: "Projekte", href: route("projects.index") },
    { title: project.name, href: route("projects.show", project.id) },
    { title: "Bearbeiten", href: "#" },
  ];

  const [values, setValues] = useState({
    project_number: project.project_number || "",
    name: project.name || "",
    description: project.description || "",
    jira_base_uri: project.jira_base_uri || "",
    start_date: project.start_date || "",
    end_date: project.end_date || "",
    project_leader_id: project.project_leader_id ? String(project.project_leader_id) : "",
    deputy_leader_id: project.deputy_leader_id ? String(project.deputy_leader_id) : "",
    new_status: "",
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
    Inertia.put(route("projects.update", project.id), values);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Card className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
        <CardHeader>
          <CardTitle>Projekt bearbeiten</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
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
              </div>
              <div className="space-y-4">
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
                  <Label htmlFor="deputy_leader_id">Stellvertretung Projektleiter</Label>
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
                <div>
                  <Label htmlFor="currentStatus">Aktueller Status</Label>
                  <div className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium ${currentStatus.color} mt-1`}>
                    {currentStatus.name}
                  </div>
                  {statusOptions.length > 1 && (
                    <div className="mt-4">
                      <Label htmlFor="new_status">Status ändern zu</Label>
                      <Select
                        value={values.new_status}
                        onValueChange={(value) => handleSelectChange("new_status", value)}
                      >
                        <SelectTrigger id="new_status">
                          <SelectValue placeholder="Neuen Status wählen" />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.filter(option => !option.current).map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center">
                                <span className={`mr-2 inline-block h-2 w-2 rounded-full ${option.color.replace('text-', 'bg-')}`}></span>
                                {option.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.new_status && (
                        <p className="text-sm text-red-600 mt-1">{errors.new_status}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
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