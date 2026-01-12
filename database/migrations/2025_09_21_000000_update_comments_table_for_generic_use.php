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
        // SQLite doesn't handle ALTER TABLE well with foreign keys, so we recreate the table
        Schema::dropIfExists('comments');
        
        Schema::create('comments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->morphs('commentable'); // This already creates an index
            $table->foreignId('parent_id')->nullable()->constrained('comments')->cascadeOnDelete();
            $table->text('body');
            $table->timestamps();
            $table->softDeletes();
            $table->foreignId('deleted_by')->nullable()->constrained('users')->nullOnDelete();
            
            // Additional indexes for performance
            $table->index('tenant_id');
            $table->index('parent_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('comments');
        
        // Recreate the old structure
        Schema::create('comments', function (Blueprint $table) {
            $table->id();
            $table->nullableMorphs('commentable');
            $table->nullableMorphs('commenter');
            $table->nullableMorphs('reply');
            $table->text('text');
            $table->boolean('approved')->default(false)->index();
            $table->timestamps();
        });

        Schema::table('comments', function (Blueprint $table) {
            $table->foreign('reply_id')->references('id')->on('comments')->cascadeOnDelete();
        });
    }
};
