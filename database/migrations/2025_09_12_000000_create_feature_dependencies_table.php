<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('feature_dependencies', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('feature_id')->constrained('features')->cascadeOnDelete();
            $table->foreignId('related_feature_id')->constrained('features')->cascadeOnDelete();
            $table->string('type'); // ermoeglicht | verhindert | bedingt | ersetzt
            $table->timestamps();

            $table->unique(['tenant_id','feature_id','related_feature_id','type'], 'feat_dep_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feature_dependencies');
    }
};

