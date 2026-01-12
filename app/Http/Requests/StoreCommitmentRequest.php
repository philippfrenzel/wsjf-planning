<?php

namespace App\Http\Requests;

use App\Models\Commitment;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCommitmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Commitment::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'planning_id' => ['required', 'exists:plannings,id'],
            'feature_id' => [
                'required',
                'exists:features,id',
                Rule::exists('feature_planning', 'feature_id')->where(fn($q) => $q->where('planning_id', $this->input('planning_id'))),
            ],
            'commitment_type' => ['required', 'in:A,B,C,D'],
            'status' => ['nullable', 'string', 'in:suggested,accepted,completed'],
        ];
    }
}
