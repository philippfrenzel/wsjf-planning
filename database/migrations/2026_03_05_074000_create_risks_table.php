<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('risks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('planning_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('roam_status')->default('identified')->comment('identified, resolved, owned, accepted, mitigated');
            $table->string('category')->nullable()->comment('technical, business, schedule, resource, dependency');
            $table->string('impact')->default('medium')->comment('low, medium, high');
            $table->timestamps();
            $table->softDeletes();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('risks');
    }
};
