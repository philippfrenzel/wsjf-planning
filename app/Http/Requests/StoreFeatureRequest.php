<?php

namespace App\Http\Requests;

use App\Models\Feature;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFeatureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Feature::class) ?? false;
    }

    public function rules(): array
    {
        $tenantId = $this->user()?->current_tenant_id;

        return [
            'jira_key' => ['required', 'string', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
            'type' => ['nullable', 'string', 'in:business,enabler,tech_debt,nfr'],
            'description' => ['nullable', 'string'],
            'requester_id' => ['nullable', 'exists:users,id'],
            'project_id' => ['required', Rule::exists('projects', 'id')->where('tenant_id', $tenantId)],
            'skill_requirements' => ['sometimes', 'array'],
            'skill_requirements.*.skill_id' => ['required', 'exists:skills,id'],
            'skill_requirements.*.level' => ['required', 'in:basic,intermediate,expert'],
        ];
    }
}
