<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('feature_specification_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('specification_id')->constrained('feature_specifications')->cascadeOnDelete();
            $table->unsignedInteger('version_number');
            $table->longText('content');
            $table->string('change_summary')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('tenant_id')->nullable()->constrained('tenants')->nullOnDelete();
            $table->timestamps();

            $table->unique(['specification_id', 'version_number']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feature_specification_versions');
    }
};
