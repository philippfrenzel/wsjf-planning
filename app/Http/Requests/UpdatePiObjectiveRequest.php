<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePiObjectiveRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('pi_objective'));
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'business_value' => ['nullable', 'integer', 'min:1', 'max:10'],
            'is_committed' => ['boolean'],
            'status' => ['nullable', 'string', 'in:draft,committed,achieved,not_achieved'],
        ];
    }
}
