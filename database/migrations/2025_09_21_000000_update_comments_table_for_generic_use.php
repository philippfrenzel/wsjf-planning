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
        Schema::table('comments', function (Blueprint $table) {
            // Drop old commenter morphs if they exist
            if (Schema::hasColumn('comments', 'commenter_type')) {
                $table->dropMorphs('commenter');
            }
            
            // Drop old reply morphs if they exist
            if (Schema::hasColumn('comments', 'reply_type')) {
                $table->dropMorphs('reply');
            }
            
            // Add user_id for the comment author
            if (!Schema::hasColumn('comments', 'user_id')) {
                $table->foreignId('user_id')->after('id')->constrained()->cascadeOnDelete();
            }
            
            // Add tenant_id for multi-tenancy
            if (!Schema::hasColumn('comments', 'tenant_id')) {
                $table->foreignId('tenant_id')->after('user_id')->constrained()->cascadeOnDelete();
            }
            
            // Add parent_id for threaded comments (replies)
            if (!Schema::hasColumn('comments', 'parent_id')) {
                $table->foreignId('parent_id')->after('tenant_id')->nullable()->constrained('comments')->cascadeOnDelete();
            }
            
            // Remove approved column as we'll handle moderation differently
            if (Schema::hasColumn('comments', 'approved')) {
                $table->dropColumn('approved');
            }
            
            // Rename text to body for consistency
            if (Schema::hasColumn('comments', 'text') && !Schema::hasColumn('comments', 'body')) {
                $table->renameColumn('text', 'body');
            }
        });
        
        // Add indexes for performance
        Schema::table('comments', function (Blueprint $table) {
            $table->index(['commentable_type', 'commentable_id']);
            $table->index('tenant_id');
            $table->index('parent_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('comments', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropForeign(['tenant_id']);
            $table->dropForeign(['parent_id']);
            
            $table->dropIndex(['commentable_type', 'commentable_id']);
            $table->dropIndex(['tenant_id']);
            $table->dropIndex(['parent_id']);
            
            $table->dropColumn(['user_id', 'tenant_id', 'parent_id']);
            
            // Restore old structure
            $table->nullableMorphs('commenter');
            $table->nullableMorphs('reply');
            $table->boolean('approved')->default(false)->index();
            
            if (Schema::hasColumn('comments', 'body')) {
                $table->renameColumn('body', 'text');
            }
        });
    }
};
