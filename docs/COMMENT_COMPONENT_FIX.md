# Comment Component Fix

## Issue

The comment component was not working properly due to missing Content-Type header in axios requests.

## Root Cause

The axios configuration in `resources/js/bootstrap.ts` had the `Content-Type` header commented out with a note:
```typescript
// Let axios automatically set Content-Type based on the data being sent
// Setting it globally to 'application/json' can cause issues with data serialization
```

However, axios does not always automatically set the Content-Type header correctly for JSON payloads when using `axios.post()` with JavaScript objects. This caused Laravel to not recognize the request body as JSON, leading to validation failures and empty request data.

## Solution

Set the `Content-Type` header explicitly to `application/json` in the axios defaults:

```typescript
axios.defaults.headers.common['Content-Type'] = 'application/json';
```

This ensures that all axios requests send the correct Content-Type header, allowing Laravel to properly parse JSON request bodies.

## Technical Details

### Axios Behavior

When you send data with axios:
```typescript
axios.post('/comments', {
    body: 'comment text',
    commentable_type: 'App\\Models\\Feature',
    commentable_id: 1
});
```

Without the Content-Type header:
- Axios may send data as `application/x-www-form-urlencoded`
- Or not set Content-Type at all
- Laravel cannot properly parse the request body
- Request validation fails

With the Content-Type header set:
- All requests explicitly use `application/json`
- Laravel's request handling recognizes JSON payloads
- Data is properly parsed and validation works

### Laravel Side

Laravel's request handling (`Illuminate\Http\Request`):
- Checks the `Content-Type` header to determine how to parse the request body
- For JSON: Parses the body as JSON and makes it available via `$request->all()`, `$request->input()`, etc.
- Without the header: May treat the request as form data or fail to parse

## Testing

To verify the fix works:

1. **Backend**: Check that comments API endpoints work:
   ```bash
   # Create a comment
   curl -X POST http://localhost/comments \
     -H "Content-Type: application/json" \
     -H "X-CSRF-TOKEN: ..." \
     -d '{"body":"Test","commentable_type":"App\\Models\\Feature","commentable_id":1}'
   ```

2. **Frontend**: Test the Comments component:
   - Navigate to a Feature edit page
   - Try creating a comment
   - Try replying to a comment
   - Try editing a comment
   - Try deleting a comment

## Related Files

- `resources/js/bootstrap.ts` - Axios configuration
- `resources/js/components/comments/Comments.tsx` - Main comments component
- `resources/js/components/comments/CommentItem.tsx` - Individual comment display
- `app/Http/Controllers/CommentController.php` - Backend API controller

## Prevention

To prevent similar issues in the future:

1. **Always set Content-Type** for APIs that expect JSON
2. **Test API endpoints** both via curl/Postman and frontend
3. **Check network tab** in browser DevTools to verify headers
4. **Use Laravel's API resources** to ensure consistent response format

## Additional Notes

### Why This Happened

The original comment that discouraged setting Content-Type globally was likely added due to issues with file uploads or form data submissions. However, for a JSON API (which this application primarily uses), setting `application/json` as the default is correct.

If the application needs to support file uploads in the future, those specific requests can override the Content-Type header:

```typescript
const formData = new FormData();
formData.append('file', file);

// Content-Type will be automatically set to multipart/form-data
axios.post('/upload', formData, {
    headers: {
        'Content-Type': 'multipart/form-data'
    }
});
```

### Alternative Solutions

Other solutions that were considered but not implemented:

1. **Set Content-Type per request**: Would require updating every axios call
2. **Use axios interceptors**: More complex, not needed for this use case
3. **Transform data in axios config**: Unnecessary complexity

The chosen solution (setting default Content-Type) is the simplest and most appropriate for a JSON API.
