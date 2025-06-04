import React, { useState, useCallback, useMemo } from "react";
import AppLayout from "@/layouts/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePage } from "@inertiajs/react";
import { Inertia } from "@inertiajs/inertia";
// Slate Imports
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

// Slate Editor Custom Types
type CustomElement = {
  type: 'paragraph' | 'heading-one' | 'heading-two' | 'bulleted-list' | 'numbered-list' | 'list-item' | 'link';
  children: CustomText[];
  url?: string;
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

// Hilfsfunktionen für die Konvertierung zwischen HTML und Slate-Format
const deserializeHtml = (html: string): Descendant[] => {
  if (!html) return [{ type: 'paragraph', children: [{ text: '' }] }];
  
  const domParser = new DOMParser();
  const doc = domParser.parseFromString(html, 'text/html');
  
  return Array.from(doc.body.children).map(node => deserializeNode(node)) as Descendant[];
};

const deserializeNode = (node: Node): any => {
  if (node.nodeType === Node.TEXT_NODE) {
    return { text: node.textContent || '' };
  }
  
  const children = Array.from(node.childNodes).map(node => deserializeNode(node));
  
  if (node.nodeName === 'BR') {
    return { text: '\n' };
  }
  
  if (node.nodeName === 'P') {
    return { type: 'paragraph', children: children.length ? children : [{ text: '' }] };
  }
  
  if (node.nodeName === 'H1') {
    return { type: 'heading-one', children };
  }
  
  if (node.nodeName === 'H2') {
    return { type: 'heading-two', children };
  }
  
  if (node.nodeName === 'UL') {
    return { type: 'bulleted-list', children };
  }
  
  if (node.nodeName === 'OL') {
    return { type: 'numbered-list', children };
  }
  
  if (node.nodeName === 'LI') {
    return { type: 'list-item', children };
  }
  
  if (node.nodeName === 'A') {
    const href = (node as Element).getAttribute('href');
    return { type: 'link', url: href, children };
  }
  
  if (node.nodeName === 'STRONG' || node.nodeName === 'B') {
    return children.map(child => ({ ...child, bold: true }));
  }
  
  if (node.nodeName === 'EM' || node.nodeName === 'I') {
    return children.map(child => ({ ...child, italic: true }));
  }
  
  if (node.nodeName === 'U') {
    return children.map(child => ({ ...child, underline: true }));
  }
  
  return children;
};

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
    case 'link':
      return `<a href="${element.url}">${children}</a>`;
    default:
      return children;
  }
};

// Toolbar-Komponenten
const ToolbarButton = ({ format, icon, onClick }) => {
  const editor = useSlate();
  const isActive = isFormatActive(editor, format);
  
  return (
    <Button 
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

// Toolbar Komponente
const Toolbar = () => {
  const editor = useSlate();
  
  const addLink = () => {
    const url = prompt('Link URL eingeben:');
    if (!url) return;
    
    const { selection } = editor;
    if (selection) {
      const isLink = isBlockActive(editor, 'link');
      
      if (isLink) {
        unwrapLink(editor);
      }
      
      wrapLink(editor, url);
    }
  };
  
  const wrapLink = (editor, url) => {
    const isCollapsed = editor.selection && Range.isCollapsed(editor.selection);
    
    if (isCollapsed) {
      const text = prompt('Link-Text eingeben:') || url;
      Transforms.insertNodes(editor, {
        type: 'link',
        url,
        children: [{ text }],
      });
    } else {
      Transforms.wrapNodes(editor, {
        type: 'link',
        url,
        children: [],
      }, { split: true });
    }
  };
  
  const unwrapLink = (editor) => {
    Transforms.unwrapNodes(editor, {
      match: n => 
        !Editor.isEditor(n) && 
        SlateElement.isElement(n) && 
        n.type === 'link',
    });
  };
  
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
      <Button 
        variant="outline" 
        size="sm"
        onClick={addLink}
        className="px-2 py-1"
      >
        Link
      </Button>
    </div>
  );
};

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
    case 'link':
      return <a {...attributes} href={element.url} className="text-primary underline">{children}</a>;
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

export default function Edit({ feature, projects, users }: EditProps) {
  const { errors } = usePage().props as { errors: Record<string, string> };
  const [values, setValues] = useState({
    jira_key: feature.jira_key || "",
    name: feature.name || "",
    description: feature.description || "",
    requester_id: feature.requester_id ? String(feature.requester_id) : "",
    project_id: feature.project_id ? String(feature.project_id) : "",
  });

  // Slate Editor erstellen
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);

  // Initiale Slate-Werte aus der HTML-Beschreibung
  const initialValue = useMemo(() => 
    deserializeHtml(feature.description), [feature.description]
  );

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
                <Slate 
                  editor={editor} 
                  value={initialValue}
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
                          toggleFormat(editor, HOTKEYS[hotkey]);
                        }
                      }
                    }}
                  />
                </Slate>
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