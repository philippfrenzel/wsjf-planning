import React, { useState } from "react";
import AppLayout from "@/layouts/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePage } from "@inertiajs/react";
import { Inertia } from "@inertiajs/inertia";
// Lexical Imports
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin";
import { ToolbarPlugin } from "@lexical/react/LexicalToolbarPlugin";
import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { LinkNode } from "@lexical/link";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { EditorState, LexicalEditor } from "lexical";

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

// Einfaches Toolbar-Plugin, das man separat definieren kann
function ToolbarPlugin() {
  const formatParagraph = () => {
    // Hier kommen die Formatierungsaktionen
  };

  return (
    <div className="flex gap-2 p-2 bg-muted border-b mb-2">
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => {
          document.execCommand('bold');
        }}
      >
        Fett
      </Button>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => {
          document.execCommand('italic');
        }}
      >
        Kursiv
      </Button>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => {
          document.execCommand('insertUnorderedList');
        }}
      >
        Liste
      </Button>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => {
          document.execCommand('createLink', false, prompt('URL eingeben:'));
        }}
      >
        Link
      </Button>
    </div>
  );
}

export default function Create({ projects, users }: CreateProps) {
  const { errors } = usePage().props as { errors: Record<string, string> };
  const [values, setValues] = useState({
    jira_key: "",
    name: "",
    description: "",
    requester_id: "",
    project_id: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (field: string, value: string) => {
    setValues({ ...values, [field]: value });
  };

  // Lexical OnChange Handler
  const handleDescriptionChange = (editorState: EditorState, editor: LexicalEditor) => {
    editorState.read(() => {
      const htmlString = $generateHtmlFromNodes(editor, null);
      setValues((prev) => ({ ...prev, description: htmlString }));
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    Inertia.post(route("features.store"), values);
  };

  const lexicalConfig = {
    namespace: "FeatureDescriptionEditor",
    theme: {
      paragraph: "mb-2",
      heading: {
        h1: "text-2xl font-bold mb-2",
        h2: "text-xl font-bold mb-2",
        h3: "text-lg font-bold mb-2",
      },
      list: {
        ul: "list-disc ml-4 mb-2",
        ol: "list-decimal ml-4 mb-2",
      },
      link: "text-primary underline",
    },
    onError(error: Error) {
      console.error(error);
    },
    nodes: [
      HeadingNode,
      QuoteNode,
      ListNode,
      ListItemNode,
      LinkNode
    ]
  };

  return (
    <AppLayout>
      <Card className="w-full mt-8">
        <CardHeader>
          <CardTitle>Neues Feature anlegen</CardTitle>
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
                <LexicalComposer initialConfig={lexicalConfig}>
                  <ToolbarPlugin />
                  <RichTextPlugin
                    contentEditable={
                      <ContentEditable
                        id="description"
                        name="description"
                        className="min-h-[120px] bg-white p-2 outline-none"
                      />
                    }
                    placeholder={<div className="absolute text-muted-foreground p-2 pointer-events-none">Beschreibung eingeben…</div>}
                  />
                  <HistoryPlugin />
                  <ListPlugin />
                  <LinkPlugin />
                  <OnChangePlugin onChange={handleDescriptionChange} />
                </LexicalComposer>
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
                Feature speichern
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppLayout>
  );
}