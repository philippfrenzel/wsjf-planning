<?php

namespace App\Models\Concerns;

use App\Models\Comment;
use Illuminate\Database\Eloquent\Relations\MorphMany;

trait HasComments
{
    /**
     * Get all comments for the model.
     */
    public function comments(): MorphMany
    {
        return $this->morphMany(Comment::class, 'commentable')
            ->whereNull('parent_id')
            ->with(['user', 'replies.user'])
            ->latest();
    }

    /**
     * Get all comments including replies.
     */
    public function allComments(): MorphMany
    {
        return $this->morphMany(Comment::class, 'commentable')
            ->with(['user'])
            ->latest();
    }

    /**
     * Get the total count of comments (including replies).
     */
    public function getTotalCommentsCountAttribute(): int
    {
        return $this->allComments()->count();
    }
}
