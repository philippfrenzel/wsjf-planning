<?php

namespace App\Http\Requests;

use App\Models\PiObjective;
use Illuminate\Foundation\Http\FormRequest;

class StorePiObjectiveRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', PiObjective::class);
    }

    public function rules(): array
    {
        return [
            'planning_id' => ['required', 'exists:plannings,id'],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'business_value' => ['nullable', 'integer', 'min:1', 'max:10'],
            'is_committed' => ['boolean'],
            'status' => ['nullable', 'string', 'in:draft,committed,achieved,not_achieved'],
        ];
    }
}
