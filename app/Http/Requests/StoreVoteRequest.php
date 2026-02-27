<?php

namespace App\Http\Requests;

use App\Models\Vote;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreVoteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Vote::class) ?? false;
    }

    public function rules(): array
    {
        $tenantId = $this->user()?->current_tenant_id;

        return [
            'user_id' => ['required', Rule::exists('tenant_user', 'user_id')->where('tenant_id', $tenantId)],
            'feature_id' => ['required', Rule::exists('features', 'id')->where('tenant_id', $tenantId)],
            'planning_id' => ['required', Rule::exists('plannings', 'id')->where('tenant_id', $tenantId)],
            'type' => ['required', 'in:BusinessValue,TimeCriticality,RiskOpportunity,JobSize'],
            'value' => [
                'required',
                'numeric',
                Rule::when(
                    $this->input('type') === 'JobSize',
                    [Rule::in([1, 2, 3, 5, 8, 13, 20])]
                ),
            ],
            'voted_at' => ['required', 'date'],
        ];
    }
}
