<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::rename('definition_checklists', 'definition_templates');

        Schema::table('definition_templates', function (Blueprint $table) {
            $table->text('body')->nullable()->after('description');
        });

        // Migrate existing checklist items into markdown body
        DB::table('definition_templates')->whereNotNull('items')->orderBy('id')->each(function ($row) {
            $items = json_decode($row->items, true);
            if (is_array($items) && count($items) > 0) {
                $lines = array_map(function ($item) {
                    $prefix = ($item['required'] ?? false) ? '- [x]' : '- [ ]';
                    return $prefix . ' ' . ($item['text'] ?? '');
                }, $items);
                $body = implode("\n", $lines);
                DB::table('definition_templates')->where('id', $row->id)->update(['body' => $body]);
            }
        });

        Schema::table('definition_templates', function (Blueprint $table) {
            $table->dropColumn('items');
        });

        // Change type column to string to support dor/dod/ust across all DB drivers
        Schema::table('definition_templates', function (Blueprint $table) {
            $table->string('type', 10)->change();
        });
    }

    public function down(): void
    {
        Schema::table('definition_templates', function (Blueprint $table) {
            $table->string('type', 10)->change();
        });

        Schema::table('definition_templates', function (Blueprint $table) {
            $table->json('items')->nullable()->after('description');
            $table->dropColumn('body');
        });

        Schema::rename('definition_templates', 'definition_checklists');
    }
};
