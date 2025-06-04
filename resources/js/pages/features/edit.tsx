import React, { useState } from "react";
import AppLayout from "@/layouts/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePage } from "@inertiajs/react";
import { Inertia } from "@inertiajs/inertia";
// React Simple WYSIWYG Import - EditorProvider hinzugefügt
import { Editor, EditorProvider } from "react-simple-wysiwyg";

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
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (field: string, value: string) => {
    setValues({ ...values, [field]: value });
  };
  
  // Handler für den WYSIWYG Editor
  const handleEditorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValues(prev => ({ ...prev, description: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    Inertia.put(route("features.update", feature.id), values);
  };

  return (
    <AppLayout>
      <Card className="w-full mt-8">
        <CardHeader>
          <CardTitle>Feature bearbeiten</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="jira_key">Jira Key</Label>
                <Input
                  id="jira_key"
                  name="jira_key"
                  value={values.jira_key}
                  onChange={handleChange}
                  className="w-full"
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
                  className="w-full"
                  required
                />
                {errors.name && (
                  <p className="text-sm text-red-600 mt-1">{errors.name}</p>
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Beschreibung</Label>
              <div className="border rounded overflow-hidden">
                <EditorProvider>
                  <Editor 
                    id="description"
                    name="description" 
                    value={values.description} 
                    onChange={handleEditorChange}
                    containerProps={{ className: 'min-h-[120px] bg-white' }}
                  />
                </EditorProvider>
              </div>
              {errors.description && (
                <p className="text-sm text-red-600 mt-1">{errors.description}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="project_id">Projekt</Label>
                <Select
                  value={values.project_id}
                  onValueChange={(value) => handleSelectChange("project_id", value)}
                >
                  <SelectTrigger id="project_id" className="w-full">
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
                  <SelectTrigger id="requester_id" className="w-full">
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
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => window.history.back()}>
                Abbrechen
              </Button>
              <Button type="submit">
                Änderungen speichern
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppLayout>
  );
}