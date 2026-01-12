<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use App\Models\Concerns\BelongsToTenant;
use App\Models\Concerns\SoftDeletesWithUser;

class Comment extends Model
{
    use HasFactory, BelongsToTenant, SoftDeletesWithUser;

    protected $fillable = [
        'user_id',
        'tenant_id',
        'commentable_type',
        'commentable_id',
        'parent_id',
        'body',
    ];

    /**
     * Get the commentable entity (polymorphic).
     */
    public function commentable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Get the user who created the comment.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the parent comment (for threaded comments).
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Comment::class, 'parent_id');
    }

    /**
     * Get all replies to this comment.
     */
    public function replies(): HasMany
    {
        return $this->hasMany(Comment::class, 'parent_id')->with('user', 'replies');
    }

    /**
     * Scope to get only top-level comments (no parent).
     */
    public function scopeTopLevel($query)
    {
        return $query->whereNull('parent_id');
    }

    /**
     * Scope to get comments with their user and replies eagerly loaded.
     */
    public function scopeWithRelations($query)
    {
        return $query->with(['user', 'replies.user']);
    }
}
