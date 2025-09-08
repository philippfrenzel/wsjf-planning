<?php

namespace App\Models\Concerns;

use App\Models\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;

trait BelongsToTenant
{
    public static function bootBelongsToTenant(): void
    {
        static::addGlobalScope(new TenantScope);

        static::creating(function (Model $model) {
            // Wenn tenant_id nicht gesetzt ist, vom eingeloggten User übernehmen
            if (empty($model->tenant_id)) {
                $user = Auth::user();
                if ($user) {
                    $tenantId = $user->current_tenant_id ?? $user->tenant_id;
                    if ($tenantId) {
                        $model->tenant_id = $tenantId;
                    }
                }
            }
        });
    }

    public function tenant()
    {
        return $this->belongsTo(\App\Models\Tenant::class);
    }
}
