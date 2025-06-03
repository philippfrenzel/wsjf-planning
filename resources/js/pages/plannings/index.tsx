import React from "react";
import AppLayout from "@/layouts/app-layout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Eye, Pencil, Trash2, Vote } from "lucide-react";
import { Link } from "@inertiajs/react";

interface Planning {
  id: number;
  title: string;
  planned_at: string;
  executed_at: string;
  project?: { id: number; name: string };
}

interface IndexProps {
  plannings: Planning[];
}

export default function Index({ plannings }: IndexProps) {
  return (
    <AppLayout>
      <div className="p-5 flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Plannings</h1>
        <Button asChild>
          <Link href={route("plannings.create")}>
            <Plus className="w-4 h-4 mr-2" />
            Neues Planning erstellen
          </Link>
        </Button>
      </div>
      <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Titel</TableHead>
            <TableHead>Projekt</TableHead>
            <TableHead>Geplant am</TableHead>
            <TableHead>Durchgeführt am</TableHead>
            <TableHead>Aktionen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plannings.map((planning) => (
            <TableRow key={planning.id}>
              <TableCell>{planning.id}</TableCell>
              <TableCell>{planning.title}</TableCell>
              <TableCell>{planning.project?.name ?? "-"}</TableCell>
              <TableCell>{planning.planned_at ?? "-"}</TableCell>
              <TableCell>{planning.executed_at ?? "-"}</TableCell>
              <TableCell className="flex gap-2">
                <Button asChild size="icon" variant="outline">
                  <Link href={route("plannings.show", planning)}>
                    <Eye className="w-4 h-4" />
                  </Link>
                </Button>
                {/* Voting-Button */}
                <Button asChild size="icon" variant="outline">
                  <Link href={route("votes.session", { planning: planning.id })}>
                    <Vote className="w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild size="icon" variant="outline">
                  <Link href={route("plannings.edit", planning)}>
                    <Pencil className="w-4 h-4" />
                  </Link>
                </Button>
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    Inertia.delete(route("plannings.destroy", planning));
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