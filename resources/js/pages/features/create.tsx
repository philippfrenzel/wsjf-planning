import React, { useState, useCallback, useMemo, useLayoutEffect, useRef } from "react";
import AppLayout from "@/layouts/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea"; // Textarea wird durch Slate ersetzt
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePage } from "@inertiajs/react";
import { Inertia } from "@inertiajs/inertia";
// Slate Importe
import { createEditor, Descendant, Editor, Transforms, Element as SlateElement, Text } from "slate";
import { Slate, Editable, withReact, useSlate } from "slate-react";
import { withHistory } from "slate-history";
import isHotkey from "is-hotkey";

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

// Slate Editor benutzerdefinierte Typen
type CustomElement = {
  type: 'paragraph' | 'heading-one' | 'heading-two' | 'bulleted-list' | 'numbered-list' | 'list-item';
  children: CustomText[];
};

type CustomText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
};

declare module 'slate' {
  interface CustomTypes {
    Editor: Editor;
    Element: CustomElement;
    Text: CustomText;
  }
}

// Konvertierung von Slate-Format zu HTML
const serializeToHtml = (nodes: Descendant[]): string => {
  return nodes.map(node => serializeNodeToHtml(node)).join('');
};

const serializeNodeToHtml = (node: Descendant): string => {
  if (Text.isText(node)) {
    let text = node.text;
    if (node.bold) {
      text = `<strong>${text}</strong>`;
    }
    if (node.italic) {
      text = `<em>${text}</em>`;
    }
    if (node.underline) {
      text = `<u>${text}</u>`;
    }
    return text;
  }
  
  const element = node as CustomElement;
  let children = element.children.map(n => serializeNodeToHtml(n)).join('');
  
  switch (element.type) {
    case 'paragraph':
      return `<p>${children}</p>`;
    case 'heading-one':
      return `<h1>${children}</h1>`;
    case 'heading-two':
      return `<h2>${children}</h2>`;
    case 'bulleted-list':
      return `<ul>${children}</ul>`;
    case 'numbered-list':
      return `<ol>${children}</ol>`;
    case 'list-item':
      return `<li>${children}</li>`;
    default:
      return children;
  }
};

// Toolbar-Button-Komponente
const ToolbarButton = ({ format, icon, onClick }) => {
  const editor = useSlate();
  const isActive = isFormatActive(editor, format);
  
  return (
    <Button 
      type="button"
      variant={isActive ? "secondary" : "outline"}
      size="sm"
      onClick={onClick}
      className="px-2 py-1"
    >
      {icon}
    </Button>
  );
};

const isFormatActive = (editor, format) => {
  const [match] = Editor.nodes(editor, {
    match: n => n[format] === true,
    mode: 'all',
  });
  return !!match;
};

const isBlockActive = (editor, format) => {
  const [match] = Editor.nodes(editor, {
    match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === format,
  });
  return !!match;
};

const toggleBlock = (editor, format) => {
  const isActive = isBlockActive(editor, format);
  const isList = ['bulleted-list', 'numbered-list'].includes(format);

  Transforms.unwrapNodes(editor, {
    match: n => 
      !Editor.isEditor(n) && 
      SlateElement.isElement(n) && 
      ['bulleted-list', 'numbered-list'].includes(n.type as string),
    split: true,
  });

  let newType = isActive ? 'paragraph' : format;
  if (isList) {
    if (!isActive) {
      const listType = format === 'bulleted-list' ? 'bulleted-list' : 'numbered-list';
      Transforms.wrapNodes(editor, { type: listType, children: [] });
      newType = 'list-item';
    } else {
      newType = 'paragraph';
    }
  }

  Transforms.setNodes(editor, {
    type: newType,
  });
};

const toggleFormat = (editor, format) => {
  const isActive = isFormatActive(editor, format);
  if (isActive) {
    Editor.removeMark(editor, format);
  } else {
    Editor.addMark(editor, format, true);
  }
};

// Toolbar-Komponente
const Toolbar = () => {
  const editor = useSlate();
  
  return (
    <div className="flex gap-2 p-2 bg-muted border-b mb-2">
      <ToolbarButton 
        format="bold" 
        icon="Fett" 
        onClick={() => toggleFormat(editor, 'bold')} 
      />
      <ToolbarButton 
        format="italic" 
        icon="Kursiv" 
        onClick={() => toggleFormat(editor, 'italic')}
      />
      <ToolbarButton 
        format="underline" 
        icon="Unterstrichen" 
        onClick={() => toggleFormat(editor, 'underline')}
      />
      <ToolbarButton 
        format="bulleted-list" 
        icon="Liste" 
        onClick={() => toggleBlock(editor, 'bulleted-list')}
      />
    </div>
  );
};

// Hotkeys für Tastaturkürzel
const HOTKEYS = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
};

// Element-Renderer
const Element = ({ attributes, children, element }) => {
  switch (element.type) {
    case 'paragraph':
      return <p {...attributes} className="mb-2">{children}</p>;
    case 'heading-one':
      return <h1 {...attributes} className="text-2xl font-bold mb-2">{children}</h1>;
    case 'heading-two':
      return <h2 {...attributes} className="text-xl font-bold mb-2">{children}</h2>;
    case 'bulleted-list':
      return <ul {...attributes} className="list-disc ml-5 mb-2">{children}</ul>;
    case 'numbered-list':
      return <ol {...attributes} className="list-decimal ml-5 mb-2">{children}</ol>;
    case 'list-item':
      return <li {...attributes}>{children}</li>;
    default:
      return <p {...attributes}>{children}</p>;
  }
};

// Leaf-Renderer (für Textformatierungen)
const Leaf = ({ attributes, children, leaf }) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>;
  }
  if (leaf.italic) {
    children = <em>{children}</em>;
  }
  if (leaf.underline) {
    children = <u>{children}</u>;
  }
  return <span {...attributes}>{children}</span>;
};

export default function Create({ projects, users }: CreateProps) {
  const { errors } = usePage().props as { errors: Record<string, string> };
  const [values, setValues] = useState({
    jira_key: "",
    name: "",
    description: "",
    requester_id: "",
    project_id: "",
  });
  
  // Editor mit useRef erstellen, um Stabilität zu gewährleisten
  const editorRef = useRef<Editor | null>(null);
  if (!editorRef.current) {
    editorRef.current = withHistory(withReact(createEditor()));
  }
  
  // Sicherer initialValue mit useRef für Stabilität
  const initialValueRef = useRef<Descendant[]>([
    {
      type: 'paragraph',
      children: [{ text: '' }],
    },
  ]);
  
  // State für die verzögerte Anzeige des Editors
  const [editorReady, setEditorReady] = useState(false);
  
  // useLayoutEffect wird vor dem Browser-Painting ausgeführt
  useLayoutEffect(() => {
    // Editor wird erst angezeigt, wenn er vollständig initialisiert ist
    setEditorReady(true);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (field: string, value: string) => {
    setValues({ ...values, [field]: value });
  };

  // Handler für Slate Editor Changes
  const handleDescriptionChange = useCallback((value: Descendant[]) => {
    const html = serializeToHtml(value);
    setValues(prev => ({ ...prev, description: html }));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    Inertia.post(route("features.store"), values);
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
                {editorReady && (
                  <Slate 
                    editor={editorRef.current} 
                    value={initialValueRef.current}
                    onChange={handleDescriptionChange}
                  >
                    <Toolbar />
                    <Editable
                      id="description"
                      name="description"
                      className="min-h-[120px] bg-white p-2 outline-none"
                      renderElement={props => <Element {...props} />}
                      renderLeaf={props => <Leaf {...props} />}
                      placeholder="Beschreibung eingeben..."
                      onKeyDown={event => {
                        for (const hotkey in HOTKEYS) {
                          if (isHotkey(hotkey, event as any)) {
                            event.preventDefault();
                            toggleFormat(editorRef.current, HOTKEYS[hotkey]);
                          }
                        }
                      }}
                    />
                  </Slate>
                )}
                {!editorReady && (
                  <div className="min-h-[120px] bg-white p-2 flex items-center justify-center text-muted-foreground">
                    Editor wird geladen...
                  </div>
                )}
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