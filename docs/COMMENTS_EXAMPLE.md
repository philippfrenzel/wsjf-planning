# Generic Commenting Component - Usage Examples

This document provides practical examples of using the generic commenting system with different models in the application.

## Quick Start

The commenting system has been enabled on the following models:
- **Feature** - For discussing feature requirements and implementations
- **Planning** - For planning session discussions
- **Project** - For project-level discussions

## Example 1: Adding Comments to a Feature

```php
use App\Models\Feature;

// Get a feature
$feature = Feature::find(1);

// Add a comment
$comment = $feature->comments()->create([
    'user_id' => auth()->id(),
    'body' => 'This feature looks great! When can we start implementation?',
]);

// Get all comments for the feature
$comments = $feature->comments;

// Get comment count
$count = $feature->total_comments_count;
```

## Example 2: Adding Comments to a Planning Session

```php
use App\Models\Planning;

$planning = Planning::find(1);

// Add a comment to the planning session
$comment = $planning->comments()->create([
    'user_id' => auth()->id(),
    'body' => 'Great planning session! I suggest we focus on high-priority items first.',
]);
```

## Example 3: Adding Comments to a Project

```php
use App\Models\Project;

$project = Project::find(1);

// Add a comment to the project
$comment = $project->comments()->create([
    'user_id' => auth()->id(),
    'body' => 'Project milestone reached! Moving to next phase.',
]);
```

## Example 4: Threaded Comments (Replies)

```php
use App\Models\Feature;
use App\Models\Comment;

$feature = Feature::find(1);

// Create a parent comment
$parentComment = $feature->comments()->create([
    'user_id' => auth()->id(),
    'body' => 'What is the estimated timeline for this feature?',
]);

// Create a reply to the comment
$reply = Comment::create([
    'user_id' => auth()->id(),
    'body' => 'Based on our analysis, approximately 2 weeks.',
    'commentable_type' => Feature::class,
    'commentable_id' => $feature->id,
    'parent_id' => $parentComment->id,
]);

// Get all replies for a comment
$replies = $parentComment->replies;
```

## Example 5: Loading Comments with User Information

```php
use App\Models\Feature;

$feature = Feature::with(['comments.user', 'comments.replies.user'])->find(1);

// Now you can access user information directly
foreach ($feature->comments as $comment) {
    echo $comment->user->name . ': ' . $comment->body . "\n";
    
    foreach ($comment->replies as $reply) {
        echo '  └─ ' . $reply->user->name . ': ' . $reply->body . "\n";
    }
}
```

## Example 6: In a Controller - Inertia.js Integration

```php
use App\Http\Controllers\Controller;
use App\Models\Feature;
use Inertia\Inertia;

class FeatureController extends Controller
{
    public function show(Feature $feature)
    {
        $feature->load(['comments.user', 'comments.replies.user']);
        
        return Inertia::render('Features/Show', [
            'feature' => $feature,
            'comments' => $feature->comments,
            'commentsCount' => $feature->total_comments_count,
        ]);
    }
}
```

## Example 7: Using the Comments API

### Get Comments for an Entity

```bash
curl -X GET "https://your-app.com/comments?commentable_type=App\Models\Feature&commentable_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Create a Comment

```bash
curl -X POST "https://your-app.com/comments" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "body": "This is my comment",
    "commentable_type": "App\\Models\\Feature",
    "commentable_id": 1
  }'
```

### Create a Reply

```bash
curl -X POST "https://your-app.com/comments" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "body": "This is a reply",
    "commentable_type": "App\\Models\\Feature",
    "commentable_id": 1,
    "parent_id": 5
  }'
```

### Update a Comment

```bash
curl -X PUT "https://your-app.com/comments/1" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "body": "Updated comment text"
  }'
```

### Delete a Comment

```bash
curl -X DELETE "https://your-app.com/comments/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Example 8: Adding Comments to Custom Models

To enable comments on any other model in your application:

1. Add the `HasComments` trait to your model:

```php
<?php

namespace App\Models;

use App\Models\Concerns\HasComments;
use Illuminate\Database\Eloquent\Model;

class YourModel extends Model
{
    use HasComments;
    
    // ... rest of your model code
}
```

2. That's it! Your model now has the `comments` relationship:

```php
$yourModel = YourModel::find(1);
$yourModel->comments()->create([
    'user_id' => auth()->id(),
    'body' => 'Your comment here',
]);
```

## Example 9: Filtering and Querying Comments

```php
use App\Models\Feature;
use App\Models\Comment;

$feature = Feature::find(1);

// Get only top-level comments (no replies)
$topLevelComments = $feature->comments()->topLevel()->get();

// Get all comments including replies
$allComments = $feature->allComments;

// Get comments by a specific user
$userComments = $feature->comments()
    ->where('user_id', $userId)
    ->get();

// Get recent comments
$recentComments = $feature->comments()
    ->latest()
    ->take(5)
    ->get();

// Count comments
$commentCount = $feature->comments()->count();
$totalCount = $feature->allComments()->count(); // includes replies
```

## Example 10: Comment Authorization in Controller

```php
use App\Models\Comment;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function update(Request $request, Comment $comment)
    {
        // Authorization check (already handled in UpdateCommentRequest)
        if ($comment->user_id !== auth()->id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        
        $comment->update([
            'body' => $request->validated()['body'],
        ]);
        
        return response()->json(['data' => $comment]);
    }
}
```

## Tips and Best Practices

1. **Always eager load relationships** when displaying comments to avoid N+1 queries:
   ```php
   $feature->load(['comments.user', 'comments.replies.user']);
   ```

2. **Use scopes** for common queries:
   ```php
   Comment::topLevel()->withRelations()->get();
   ```

3. **Check ownership** before allowing edits/deletes (handled automatically by the UpdateCommentRequest)

4. **Consider pagination** for entities with many comments:
   ```php
   $comments = $feature->comments()->paginate(10);
   ```

5. **Cache comment counts** for performance on high-traffic pages:
   ```php
   $count = Cache::remember("feature.{$feature->id}.comments", 3600, function() use ($feature) {
       return $feature->total_comments_count;
   });
   ```

## Frontend Integration Example (React/TypeScript)

```typescript
// Fetch comments
const fetchComments = async (type: string, id: number) => {
  const response = await fetch(`/comments?commentable_type=${type}&commentable_id=${id}`);
  const data = await response.json();
  return data.data;
};

// Create comment
const createComment = async (body: string, type: string, id: number, parentId?: number) => {
  const response = await fetch('/comments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      body,
      commentable_type: type,
      commentable_id: id,
      parent_id: parentId || null,
    }),
  });
  return await response.json();
};

// Usage in a React component
const FeatureComments = ({ featureId }: { featureId: number }) => {
  const [comments, setComments] = useState([]);
  
  useEffect(() => {
    fetchComments('App\\Models\\Feature', featureId).then(setComments);
  }, [featureId]);
  
  return (
    <div>
      {comments.map(comment => (
        <div key={comment.id}>
          <p>{comment.user.name}: {comment.body}</p>
          {comment.replies?.map(reply => (
            <div key={reply.id} style={{ marginLeft: '20px' }}>
              <p>{reply.user.name}: {reply.body}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
```

For complete API documentation, see [COMMENTS.md](./COMMENTS.md).
