<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->timestamp('sponsored_until')->nullable()->after('trial_ends_at');
            $table->string('sponsor_note', 500)->nullable()->after('sponsored_until');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn(['sponsored_until', 'sponsor_note']);
        });
    }
};
