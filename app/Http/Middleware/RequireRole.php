<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequireRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            abort(403, 'Unauthenticated.');
        }

        // SuperAdmin bypasses all role checks (ROLE-02)
        if ($user->isSuperAdmin()) {
            return $next($request);
        }

        $tenantId = $user->current_tenant_id;

        foreach ($roles as $role) {
            if ($user->hasRoleInTenant($role, $tenantId)) {
                return $next($request);
            }
        }

        abort(403, 'Insufficient role for this action.');
    }
}
