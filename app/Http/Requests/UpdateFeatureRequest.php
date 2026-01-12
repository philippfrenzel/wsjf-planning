<?php

namespace App\Http\Requests;

use App\Models\Feature;
use Illuminate\Foundation\Http\FormRequest;

class UpdateFeatureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('feature')) ?? false;
    }

    public function rules(): array
    {
        return [
            'jira_key' => ['required', 'string', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'requester_id' => ['nullable', 'exists:users,id'],
            'project_id' => ['required', 'exists:projects,id'],
            'status' => ['nullable', 'string', 'in:in-planning,approved,rejected,implemented,obsolete,archived,deleted'],
        ];
    }
}
