<?php

namespace App\Http\Requests;

use App\Models\Planning;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePlanningRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Planning::class) ?? false;
    }

    public function rules(): array
    {
        $tenantId = $this->user()?->current_tenant_id;

        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'project_id' => ['required', Rule::exists('projects', 'id')->where('tenant_id', $tenantId)],
            'planned_at' => ['nullable', 'date'],
            'executed_at' => ['nullable', 'date'],
            'owner_id' => ['nullable', Rule::exists('tenant_user', 'user_id')->where('tenant_id', $tenantId)],
            'deputy_id' => ['nullable', Rule::exists('tenant_user', 'user_id')->where('tenant_id', $tenantId)],
            'stakeholder_ids' => ['sometimes', 'array'],
            'stakeholder_ids.*' => ['integer', Rule::exists('tenant_user', 'user_id')->where('tenant_id', $tenantId)],
            'feature_ids' => ['sometimes', 'array'],
            'feature_ids.*' => ['integer', Rule::exists('features', 'id')->where('tenant_id', $tenantId)],
        ];
    }
}
