import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Estimation {
  id: number;
  best_case: number;
  most_likely: number;
  worst_case: number;
  unit: string;
  notes?: string;
  weighted_estimate?: number;
  weighted_case?: number; // Für Abwärtskompatibilität
  creator: { id: number; name: string };
  created_at: string;
}

interface EstimationTableProps {
  estimations: Estimation[];
}

export default function EstimationTable({ estimations }: EstimationTableProps) {
  return (
    <div>
      <h4 className="text-md font-medium mb-3">Erfasste Schätzungen ({estimations.length})</h4>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Best Case</TableHead>
            <TableHead>Most Likely</TableHead>
            <TableHead>Worst Case</TableHead>
            <TableHead>Gewichtet</TableHead>
            <TableHead>Einheit</TableHead>
            <TableHead>Erstellt von</TableHead>
            <TableHead>Datum</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {estimations.map((estimation) => (
            <React.Fragment key={estimation.id}>
              <TableRow>
                <TableCell>{estimation.best_case}</TableCell>
                <TableCell>{estimation.most_likely}</TableCell>
                <TableCell>{estimation.worst_case}</TableCell>
                <TableCell>{
                  typeof estimation.weighted_estimate === 'number' 
                    ? estimation.weighted_estimate.toFixed(2) 
                    : (typeof estimation.weighted_case === 'number' 
                        ? estimation.weighted_case.toFixed(2) 
                        : '-')
                }</TableCell>
                <TableCell>{estimation.unit}</TableCell>
                <TableCell>{estimation.creator.name}</TableCell>
                <TableCell>
                  {new Date(estimation.created_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
              {estimation.notes && (
                <TableRow>
                  <TableCell colSpan={7} className="bg-gray-50">
                    <div className="p-2 text-sm text-gray-700">
                      <strong>Notiz:</strong> {estimation.notes}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}