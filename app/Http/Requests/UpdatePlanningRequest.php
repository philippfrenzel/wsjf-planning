<?php

namespace App\Http\Requests;

use App\Models\Planning;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePlanningRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('planning')) ?? false;
    }

    public function rules(): array
    {
        return [
            'project_id' => ['required', 'exists:projects,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'planned_at' => ['nullable', 'date'],
            'executed_at' => ['nullable', 'date'],
            'owner_id' => ['nullable', 'exists:users,id'],
            'deputy_id' => ['nullable', 'exists:users,id'],
            'stakeholder_ids' => ['sometimes', 'array'],
            'stakeholder_ids.*' => ['integer', 'exists:users,id'],
            'feature_ids' => ['sometimes', 'array'],
            'feature_ids.*' => ['integer', 'exists:features,id'],
            'status' => ['required', 'string', 'in:in-planning,in-execution,completed'],
        ];
    }
}
