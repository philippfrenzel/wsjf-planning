<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddNameToRolesTable extends Migration
{
    public function up(): void
    {
        if (!Schema::hasColumn('roles', 'name')) {
            Schema::table('roles', function (Blueprint $table) {
                $table->string('name')->after('id')->nullable();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('roles', 'name')) {
            Schema::table('roles', function (Blueprint $table) {
                $table->dropColumn('name');
            });
        }
    }
}
