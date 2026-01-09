<?php

namespace App\Http\Requests;

use App\Models\Vote;
use Illuminate\Foundation\Http\FormRequest;

class StoreVoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Vote::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'user_id' => ['required', 'exists:users,id'],
            'feature_id' => ['required', 'exists:features,id'],
            'planning_id' => ['required', 'exists:plannings,id'],
            'type' => ['required', 'in:BusinessValue,TimeCriticality,RiskOpportunity'],
            'value' => ['required', 'numeric'],
            'voted_at' => ['required', 'date'],
        ];
    }
}
