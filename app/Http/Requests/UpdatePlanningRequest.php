<?php

namespace App\Http\Requests;

use App\Models\Planning;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePlanningRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('planning')) ?? false;
    }

    public function rules(): array
    {
        $tenantId = $this->user()?->current_tenant_id;

        return [
            'project_id' => ['required', Rule::exists('projects', 'id')->where('tenant_id', $tenantId)],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'planned_at' => ['nullable', 'date'],
            'executed_at' => ['nullable', 'date'],
            'owner_id' => ['nullable', Rule::exists('tenant_user', 'user_id')->where('tenant_id', $tenantId)],
            'deputy_id' => ['nullable', Rule::exists('tenant_user', 'user_id')->where('tenant_id', $tenantId)],
            'stakeholder_ids' => ['sometimes', 'array'],
            'stakeholder_ids.*' => ['integer', Rule::exists('tenant_user', 'user_id')->where('tenant_id', $tenantId)],
            'feature_ids' => ['sometimes', 'array'],
            'feature_ids.*' => ['integer', Rule::exists('features', 'id')->where('tenant_id', $tenantId)],
            'status' => ['required', 'string', 'in:in-planning,in-execution,completed'],
        ];
    }
}
