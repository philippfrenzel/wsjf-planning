# Generic Commenting Component

This document describes the generic commenting system that allows users to add comments to various entities (models) throughout the application with support for threaded discussions (replies to comments).

## Features

- **Generic/Polymorphic**: Can be attached to any model using the `HasComments` trait
- **Threaded Comments**: Support for replies (comments on comments)
- **Multi-Tenant**: Fully integrated with the application's tenant system
- **User Context**: Comments are always associated with the authenticated user
- **Authorization**: Users can only edit/delete their own comments
- **Soft Deletes**: Comments are soft-deleted, preserving data integrity

## Database Structure

The `comments` table includes:
- `id`: Primary key
- `user_id`: Foreign key to users table (comment author)
- `tenant_id`: Foreign key to tenants table (multi-tenancy support)
- `commentable_type`: Polymorphic type (e.g., 'App\Models\Feature')
- `commentable_id`: Polymorphic ID (the entity being commented on)
- `parent_id`: Foreign key to comments table (for threaded replies)
- `body`: The comment text content
- `timestamps`: created_at, updated_at
- `soft deletes`: deleted_at, deleted_by

## Backend Usage

### 1. Add the HasComments Trait to Your Model

To enable comments on any model, simply add the `HasComments` trait:

```php
<?php

namespace App\Models;

use App\Models\Concerns\HasComments;
use Illuminate\Database\Eloquent\Model;

class Feature extends Model
{
    use HasComments;
    
    // ... rest of your model code
}
```

### 2. Access Comments in Your Code

Once the trait is added, you can access comments like any other relationship:

```php
// Get all top-level comments for a feature
$feature = Feature::find(1);
$comments = $feature->comments; // Returns top-level comments with nested replies

// Get all comments (including replies) for counting
$totalComments = $feature->allComments()->count();

// Or use the attribute
$totalComments = $feature->total_comments_count;

// Create a new comment
$feature->comments()->create([
    'user_id' => auth()->id(),
    'body' => 'This is my comment',
]);
```

## API Endpoints

All comment endpoints require authentication (`auth` and `verified` middleware).

### GET /comments

Get all comments for a specific entity.

**Query Parameters:**
- `commentable_type` (required): The model class name (e.g., 'App\Models\Feature')
- `commentable_id` (required): The ID of the entity

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "body": "This is a comment",
      "user": {
        "id": 1,
        "name": "John Doe",
        "avatar": "https://..."
      },
      "parent_id": null,
      "replies": [],
      "created_at": "2025-01-12T10:00:00.000000Z",
      "updated_at": "2025-01-12T10:00:00.000000Z",
      "is_owner": true
    }
  ]
}
```

### POST /comments

Create a new comment.

**Request Body:**
```json
{
  "body": "This is my comment",
  "commentable_type": "App\\Models\\Feature",
  "commentable_id": 1,
  "parent_id": null
}
```

For a reply, set `parent_id` to the ID of the parent comment:
```json
{
  "body": "This is a reply",
  "commentable_type": "App\\Models\\Feature",
  "commentable_id": 1,
  "parent_id": 5
}
```

**Response:** (201 Created)
```json
{
  "data": {
    "id": 2,
    "body": "This is my comment",
    "user": {...},
    "parent_id": null,
    "replies": [],
    "created_at": "2025-01-12T10:00:00.000000Z",
    "updated_at": "2025-01-12T10:00:00.000000Z",
    "is_owner": true
  },
  "message": "Kommentar erfolgreich erstellt."
}
```

### PUT /comments/{comment}

Update an existing comment (only the author can update).

**Request Body:**
```json
{
  "body": "Updated comment text"
}
```

**Response:** (200 OK)
```json
{
  "data": {...},
  "message": "Kommentar erfolgreich aktualisiert."
}
```

### DELETE /comments/{comment}

Delete a comment (only the author can delete).

**Response:** (200 OK)
```json
{
  "message": "Kommentar erfolgreich gelöscht."
}
```

## Validation Rules

### Creating/Updating Comments
- `body`: Required, string, minimum 1 character, maximum 5000 characters
- `commentable_type`: Required for creation
- `commentable_id`: Required for creation
- `parent_id`: Optional, must exist in comments table if provided

## Authorization

- **Creating comments**: Any authenticated user can create comments
- **Updating comments**: Users can only update their own comments
- **Deleting comments**: Users can only delete their own comments
- **Viewing comments**: All authenticated users can view comments (filtered by tenant automatically)

## Multi-Tenancy

The comment system is fully integrated with the application's multi-tenancy:
- Comments are automatically scoped to the current tenant
- The `BelongsToTenant` trait ensures tenant_id is set automatically
- Users can only see and interact with comments in their current tenant

## Example: Using Comments with Features

```php
// In a controller
public function show(Feature $feature)
{
    // Load the feature with its comments
    $feature->load('comments.user', 'comments.replies.user');
    
    return Inertia::render('Features/Show', [
        'feature' => $feature,
        'comments' => $feature->comments,
        'commentsCount' => $feature->total_comments_count,
    ]);
}

// Create a comment via API
public function storeComment(Request $request, Feature $feature)
{
    $comment = $feature->comments()->create([
        'user_id' => auth()->id(),
        'body' => $request->body,
    ]);
    
    return response()->json([
        'data' => new CommentResource($comment),
    ], 201);
}
```

## Frontend Integration

The backend provides a JSON API that can be consumed by any frontend. For React/Inertia.js, you would:

1. Create a Comments component that fetches comments for an entity
2. Display comments in a threaded view with nested replies
3. Provide forms for adding new comments and replies
4. Handle edit/delete actions with appropriate authorization checks

Example API calls from frontend:

```typescript
// Fetch comments
const response = await fetch('/comments?commentable_type=App\\Models\\Feature&commentable_id=1');
const { data: comments } = await response.json();

// Create a comment
const response = await fetch('/comments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    body: 'My comment',
    commentable_type: 'App\\Models\\Feature',
    commentable_id: 1,
    parent_id: null,
  }),
});
```

## Testing

The comment system includes comprehensive tests in `tests/Feature/CommentTest.php`:

- Creating comments
- Replying to comments (threaded)
- Updating own comments
- Deleting own comments
- Authorization checks (cannot edit/delete others' comments)
- Validation
- Loading threaded replies

Run the tests with:
```bash
php artisan test --filter CommentTest
```

## Migration

To apply the comment system to your database:

```bash
php artisan migrate
```

This will:
1. Create the base `comments` table (if it doesn't exist)
2. Update the structure to support the generic commenting system
3. Add necessary foreign keys and indexes

## Future Enhancements

Potential improvements for the future:
- Mention system (@username)
- Rich text/markdown support
- Comment reactions (likes, upvotes)
- Comment moderation workflow
- Notifications for replies
- Comment pinning
- Comment history/edit tracking
