<?php

namespace App\Http\Requests;

use App\Models\Planning;
use Illuminate\Foundation\Http\FormRequest;

class StorePlanningRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Planning::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'project_id' => ['required', 'exists:projects,id'],
            'planned_at' => ['nullable', 'date'],
            'executed_at' => ['nullable', 'date'],
            'owner_id' => ['nullable', 'exists:users,id'],
            'deputy_id' => ['nullable', 'exists:users,id'],
            'stakeholder_ids' => ['sometimes', 'array'],
            'stakeholder_ids.*' => ['integer', 'exists:users,id'],
            'feature_ids' => ['sometimes', 'array'],
            'feature_ids.*' => ['integer', 'exists:features,id'],
        ];
    }
}
