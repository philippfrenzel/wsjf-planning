<?php

namespace App\Http\Controllers;

use App\Models\Feature;
use App\Models\Project;
use App\Services\JiraMarkupConverter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class FeatureImportController extends Controller
{
    protected JiraMarkupConverter $jiraConverter;

    public function __construct(JiraMarkupConverter $jiraConverter)
    {
        $this->middleware('auth');
        $this->jiraConverter = $jiraConverter;
    }

    /**
     * Parse a CSV line that may contain unescaped quotes (as exported by Jira).
     * This is more lenient than str_getcsv for malformed CSV.
     */
    private function parseCsvLine(string $line, string $delimiter): array
    {
        // For lines without quotes, use simple split
        if (strpos($line, '"') === false) {
            return array_map('trim', explode($delimiter, $line));
        }

        // Use str_getcsv but catch any issues
        try {
            $parsed = str_getcsv($line, $delimiter);
            
            // str_getcsv handles most cases including:
            // - "properly quoted" fields
            // - fields with escaped quotes ""
            // - unquoted fields with quotes inside
            
            return $parsed;
        } catch (\Exception $e) {
            // Fallback: simple split if str_getcsv fails
            return array_map('trim', explode($delimiter, $line));
        }
    }

    public function create(Project $project): Response
    {
        // Durch TenantScope ist $project bereits auf den aktuellen Tenant beschränkt
        return Inertia::render('features/import', [
            'project' => $project->only(['id', 'name']),
        ]);
    }

    public function store(Request $request, Project $project): RedirectResponse
    {
        $request->validate([
            'file' => 'required|file|mimetypes:text/plain,text/csv,application/vnd.ms-excel,application/csv,application/octet-stream',
            'has_header' => 'nullable|boolean',
            'mapping' => 'nullable|array',
            'mapping.*' => 'nullable|in:jira_key,name,description,ignore',
        ]);

        $file = $request->file('file');
        $path = $file->getRealPath();

        $handle = fopen($path, 'r');
        if (!$handle) {
            return back()->with('error', 'Datei konnte nicht geöffnet werden.');
        }

        $firstLine = fgets($handle);
        if ($firstLine === false) {
            fclose($handle);
            return back()->with('error', 'Leere CSV-Datei.');
        }

        // BOM entfernen und Delimiter erkennen
        $firstLine = ltrim($firstLine, "\xEF\xBB\xBF");
        $delimiter = substr_count($firstLine, ';') > substr_count($firstLine, ',') ? ';' : ',';

        $hasHeader = (bool) $request->boolean('has_header', true);

        $normalize = static function (string $h): string {
            return strtolower(str_replace([' ', '-', '_'], '', trim($h)));
        };

        // Spaltenindizes bestimmen, Priorität: Mapping > Header > Fallback (0=jira,1=name,2=desc)
        $index = ['jira_key' => null, 'name' => null, 'description' => null];
        $mapping = $request->input('mapping');
        if (is_array($mapping)) {
            foreach ($mapping as $i => $target) {
                if (in_array($target, ['jira_key','name','description'], true) && $index[$target] === null) {
                    $index[$target] = (int) $i;
                }
            }
        }
        if ($hasHeader) {
            $headers = str_getcsv(trim($firstLine), $delimiter);
            foreach ($headers as $i => $h) {
                $n = $normalize($h);
                if ($index['jira_key'] === null && in_array($n, ['jirakey', 'jira', 'key'], true)) {
                    $index['jira_key'] = $i;
                } elseif ($index['name'] === null && in_array($n, ['name', 'titel', 'title'], true)) {
                    $index['name'] = $i;
                } elseif ($index['description'] === null && in_array($n, ['description', 'beschreibung', 'desc'], true)) {
                    $index['description'] = $i;
                }
            }
        }
        // Fallback auf Positionsmapping (nur wenn kein explizites Mapping gesendet wurde)
        $mappingProvided = is_array($mapping) && count($mapping) > 0;
        if ($index['jira_key'] === null) $index['jira_key'] = 0; // Jira-Key ist Pflicht
        if (!$mappingProvided) {
            if ($index['name'] === null) $index['name'] = 1;
            if ($index['description'] === null) $index['description'] = 2;
        }
        // Jira-Key muss vorhanden sein
        if ($index['jira_key'] === null) {
            fclose($handle);
            return back()->with('error', 'Bitte ordnen Sie eine Spalte dem Jira-Key zu.');
        }

        $created = 0;
        $updated = 0;
        $skipped = 0;
        $rowNo = 1; // Header

        // Wenn erste Zeile Daten enthält (kein Header), verarbeite sie zuerst
        $pendingFirstDataRow = null;
        if (!$hasHeader) {
            $pendingFirstDataRow = $this->parseCsvLine(trim($firstLine), $delimiter);
        }

        $processRow = function(array $row) use (&$created, &$updated, &$skipped, $project, $index) {
            $jira = isset($row[$index['jira_key']]) ? trim((string)$row[$index['jira_key']]) : '';
            if ($jira === '') {
                $skipped++;
                return;
            }

            $name = $index['name'] !== null && array_key_exists($index['name'], $row)
                ? trim((string)$row[$index['name']])
                : null;
            $desc = $index['description'] !== null && array_key_exists($index['description'], $row)
                ? (string)$row[$index['description']]
                : null;

            // Convert Jira markup to HTML if description is present
            if ($desc !== null) {
                $desc = $this->jiraConverter->convertToHtml($desc);
            }

            // Upsert pro Projekt + jira_key
            $feature = Feature::where('project_id', $project->id)
                ->where('jira_key', $jira)
                ->first();

            if ($feature) {
                $data = [];
                if ($name !== null) $data['name'] = $name;
                if ($desc !== null) $data['description'] = $desc;
                if (!empty($data)) {
                    $feature->update($data);
                    $updated++;
                } else {
                    $skipped++;
                }
            } else {
                Feature::create([
                    'jira_key' => $jira,
                    'name' => $name ?? $jira,
                    'description' => $desc,
                    'project_id' => $project->id,
                ]);
                $created++;
            }
        };

        if (is_array($pendingFirstDataRow)) {
            $processRow($pendingFirstDataRow);
        }

        // Read line by line instead of using fgetcsv to avoid multiline quote issues
        while (($line = fgets($handle)) !== false) {
            $rowNo++;
            $line = trim($line);
            
            // Skip empty lines
            if ($line === '') {
                continue;
            }
            
            // Parse the line
            $row = $this->parseCsvLine($line, $delimiter);
            
            // Skip lines with only one empty field
            if (count($row) === 1 && trim((string)$row[0]) === '') {
                continue;
            }
            
            $processRow($row);
        }
        fclose($handle);

        // Increment data version to trigger Inertia page reload
        cache()->increment('app.data.version', 1);

        return redirect()
            ->route('features.index')
            ->with('success', "Import abgeschlossen: {$created} erstellt, {$updated} aktualisiert, {$skipped} übersprungen.");
    }
}
