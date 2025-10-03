<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tabellen, die Soft Deletes und deleted_by erhalten sollen.
     *
     * @var array<int, string>
     */
    private array $tables = [
        'users',
        'projects',
        'plannings',
        'features',
        'estimation_components',
        'estimations',
        'estimation_histories',
        'votes',
        'commitments',
        'plans',
        'subscriptions',
        'roles',
        'tenants',
        'tenant_invitations',
        'feature_dependencies',
        'feature_state_histories',
    ];

    public function up(): void
    {
        foreach ($this->tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                if (! Schema::hasColumn($tableName, 'deleted_at')) {
                    $table->softDeletes();
                }

                if (! Schema::hasColumn($tableName, 'deleted_by')) {
                    $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
                }
            });
        }
    }

    public function down(): void
    {
        foreach ($this->tables as $tableName) {
            Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                if (Schema::hasColumn($tableName, 'deleted_by')) {
                    $table->dropConstrainedForeignId('deleted_by');
                }

                if (Schema::hasColumn($tableName, 'deleted_at')) {
                    $table->dropSoftDeletes();
                }
            });
        }
    }
};
