import React from "react";
import { Inertia } from "@inertiajs/inertia";
import { Link, usePage } from "@inertiajs/react";

export default function Index({ projects }) {
  const { csrf_token } = usePage().props;

  const handleDelete = (id) => {
    if (confirm("Möchtest du dieses Projekt wirklich löschen?")) {
      Inertia.delete(route("projects.destroy", id));
    }
  };

  return (
    <div>
      <h1>Projekte</h1>
      <Link href={route("projects.create")} className="btn btn-primary">
        Neues Projekt erstellen
      </Link>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Projektnummer</th>
            <th>Name</th>
            <th>Aktionen</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id}>
              <td>{project.id}</td>
              <td>{project.project_number}</td>
              <td>{project.name}</td>
              <td>
                <Link
                  href={route("projects.show", project.id)}
                  className="btn btn-info"
                >
                  Anzeigen
                </Link>{" "}
                <Link
                  href={route("projects.edit", project.id)}
                  className="btn btn-warning"
                >
                  Bearbeiten
                </Link>{" "}
                <button
                  onClick={() => handleDelete(project.id)}
                  className="btn btn-danger"
                >
                  Löschen
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}