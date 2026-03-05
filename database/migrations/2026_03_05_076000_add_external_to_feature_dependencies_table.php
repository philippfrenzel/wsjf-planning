<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('feature_dependencies', function (Blueprint $table) {
            $table->boolean('is_external')->default(false)->after('type');
            $table->string('external_description', 500)->nullable()->after('is_external');
            $table->foreignId('related_feature_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('feature_dependencies', function (Blueprint $table) {
            $table->dropColumn(['is_external', 'external_description']);
            $table->foreignId('related_feature_id')->nullable(false)->change();
        });
    }
};
