<?php

namespace App\Http\Requests;

use App\Models\Feature;
use Illuminate\Foundation\Http\FormRequest;

class StoreFeatureRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Feature::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'jira_key' => ['required', 'string', 'max:255'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'requester_id' => ['nullable', 'exists:users,id'],
            'project_id' => ['required', 'exists:projects,id'],
        ];
    }
}
