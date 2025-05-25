<?php

namespace App\Observers;

use App\Models\Estimation;
use App\Models\EstimationHistory;
use Illuminate\Support\Facades\Auth;

class EstimationObserver
{
    /**
     * Protokolliert Änderungen an einer Schätzung.
     */
    public function updating(Estimation $estimation): void
    {
        $fields = ['best_case', 'most_likely', 'worst_case'];

        foreach ($fields as $field) {
            if ($estimation->isDirty($field)) {
                EstimationHistory::create([
                    'estimation_id' => $estimation->id,
                    'field_name' => $field,
                    'old_value' => $estimation->getOriginal($field),
                    'new_value' => $estimation->$field,
                    'changed_by' => Auth::id(),
                    'changed_at' => now(),
                ]);
            }
        }
    }
}
