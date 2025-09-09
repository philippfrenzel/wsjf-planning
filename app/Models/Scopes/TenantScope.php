<?php

namespace App\Models\Scopes;

use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Auth;

class TenantScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        // Qualifizierter Spaltenname
        $column = $model->getTable() . '.tenant_id';

        // Ohne Auth oder ohne Tenant: keine Einschränkung (z. B. in CLI/Tests)
        /** @var Authenticatable|null $user */
        $user = Auth::user();
        if (!$user) {
            // Ohne Tenant gibt es keine Datenzugriffe (Sicherheitsmaßnahme)
            $builder->whereRaw('1 = 0');
            return;
        }

        $tenantId = $user->current_tenant_id ?? $user->tenant_id ?? null;
        if (!$tenantId) {
            $builder->whereRaw('1 = 0');
            return;
        }

        $builder->where($column, '=', $tenantId);
    }
}
