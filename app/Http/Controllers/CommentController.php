<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCommentRequest;
use App\Http\Requests\UpdateCommentRequest;
use App\Http\Resources\CommentResource;
use App\Models\Comment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    /**
     * Display a listing of comments for a specific entity.
     */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'commentable_type' => ['required', 'string'],
            'commentable_id' => ['required', 'integer'],
        ]);

        $comments = Comment::where('commentable_type', $request->commentable_type)
            ->where('commentable_id', $request->commentable_id)
            ->topLevel()
            ->withRelations()
            ->latest()
            ->get();

        return response()->json([
            'data' => CommentResource::collection($comments),
        ]);
    }

    /**
     * Store a newly created comment.
     */
    public function store(StoreCommentRequest $request): JsonResponse
    {
        $user = auth()->user();
        $tenantId = $user->current_tenant_id ?? $user->tenant_id;

        $comment = Comment::create([
            'user_id' => $user->id,
            'tenant_id' => $tenantId,
            'body' => $request->body,
            'commentable_type' => $request->commentable_type,
            'commentable_id' => $request->commentable_id,
            'parent_id' => $request->parent_id,
        ]);

        $comment->load(['user', 'replies.user']);

        cache()->increment('app.data.version', 1);

        return response()->json([
            'data' => new CommentResource($comment),
            'message' => 'Kommentar erfolgreich erstellt.',
        ], 201);
    }

    /**
     * Display the specified comment.
     */
    public function show(Comment $comment): JsonResponse
    {
        $comment->load(['user', 'replies.user']);

        return response()->json([
            'data' => new CommentResource($comment),
        ]);
    }

    /**
     * Update the specified comment.
     */
    public function update(UpdateCommentRequest $request, Comment $comment): JsonResponse
    {
        $comment->update([
            'body' => $request->body,
        ]);

        $comment->load(['user', 'replies.user']);

        cache()->increment('app.data.version', 1);

        return response()->json([
            'data' => new CommentResource($comment),
            'message' => 'Kommentar erfolgreich aktualisiert.',
        ]);
    }

    /**
     * Remove the specified comment.
     */
    public function destroy(Comment $comment): JsonResponse
    {
        // Check if user is the owner of the comment
        if ($comment->user_id !== auth()->id()) {
            return response()->json([
                'message' => 'Sie sind nicht berechtigt, diesen Kommentar zu löschen.',
            ], 403);
        }

        $comment->delete();

        cache()->increment('app.data.version', 1);

        return response()->json([
            'message' => 'Kommentar erfolgreich gelöscht.',
        ]);
    }
}
