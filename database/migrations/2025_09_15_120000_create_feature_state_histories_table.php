<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('feature_state_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('feature_id')->constrained()->onDelete('cascade');
            $table->foreignId('tenant_id')->nullable()->constrained()->nullOnDelete();
            $table->string('from_status')->nullable();
            $table->string('to_status');
            $table->timestamp('changed_at')->useCurrent();
            $table->timestamps();

            $table->index(['feature_id', 'changed_at']);
            $table->index('to_status');
        });

        DB::table('features')->select('id', 'tenant_id', 'status', 'created_at')->orderBy('id')->chunkById(500, function ($features) {
            $historyRows = [];

            foreach ($features as $feature) {
                $changedAt = $feature->created_at ?? now();

                $historyRows[] = [
                    'feature_id' => $feature->id,
                    'tenant_id' => $feature->tenant_id,
                    'from_status' => null,
                    'to_status' => $feature->status ?? 'in-planning',
                    'changed_at' => $changedAt,
                    'created_at' => $changedAt,
                    'updated_at' => $changedAt,
                ];
            }

            if (! empty($historyRows)) {
                DB::table('feature_state_histories')->insert($historyRows);
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feature_state_histories');
    }
};
