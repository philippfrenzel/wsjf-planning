<?php

namespace App\Http\Requests;

use App\Models\Commitment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCommitmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('commitment')) ?? false;
    }

    public function rules(): array
    {
        return [
            'feature_id' => [
                'required',
                'exists:features,id',
                Rule::exists('feature_planning', 'feature_id')->where(fn($q) => $q->where('planning_id', $this->route('commitment')?->planning_id)),
            ],
            'user_id' => ['required', 'exists:users,id'],
            'commitment_type' => ['required', 'in:A,B,C,D'],
            'status' => ['nullable', 'string', 'in:suggested,accepted,completed'],
        ];
    }
}
