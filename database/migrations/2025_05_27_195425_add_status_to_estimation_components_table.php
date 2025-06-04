<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\EstimationComponent;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('estimation_components', function (Blueprint $table) {
            $table->string('status')->default(EstimationComponent::STATUS_ACTIVE)->after('description');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('estimation_components', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }
};
