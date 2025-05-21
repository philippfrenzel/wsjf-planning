import React from "react";
import AppLayout from "@/layouts/app-layout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { Link } from "@inertiajs/react";
import { Inertia } from "@inertiajs/inertia";

interface Feature {
  id: number;
  jira_key: string;
  name: string;
  description: string;
  requester?: { id: number; name: string } | null;
  project?: { id: number; name: string } | null;
}

interface IndexProps {
  features: Feature[];
}

export default function Index({ features }: IndexProps) {
  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Features</h1>
        <Button asChild>
          <Link href={route("features.create")}>
            <Plus className="w-4 h-4 mr-2" />
            Neues Feature
          </Link>
        </Button>
      </div>
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Jira Key</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Projekt</TableHead>
            <TableHead>Anforderer</TableHead>
            <TableHead>Aktionen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {features.map((feature) => (
            <TableRow key={feature.id}>
              <TableCell>{feature.jira_key}</TableCell>
              <TableCell>{feature.name}</TableCell>
              <TableCell>{feature.project?.name ?? "-"}</TableCell>
              <TableCell>{feature.requester?.name ?? "-"}</TableCell>
              <TableCell className="flex gap-2">
                <Button asChild size="icon" variant="outline">
                  <Link href={route("features.show", feature)}>
                    <Eye className="w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild size="icon" variant="outline">
                  <Link href={route("features.edit", feature)}>
                    <Pencil className="w-4 h-4" />
                  </Link>
                </Button>
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    Inertia.delete(route("features.destroy", feature));
                  }}
                >
                  <Button type="submit" size="icon" variant="destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </form>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </AppLayout>
  );
}