# Cache Versioning Solution

## Problem Statement
After bulk importing features, the local storage for the grid view in the browser wasn't being refreshed with the new data. The cached values (such as unique projects, requesters, and status values used in filters) remained stale until a feature was manually updated.

## Root Cause
Inertia.js performs partial page updates by default, reusing cached page props when navigating. Without detecting that server-side data had changed, the computed values in React components (derived from `useMemo` hooks) were not recalculated with fresh data from the server.

## Solution Overview
We implemented Inertia's asset versioning mechanism to force a full page reload when data changes on the server. This ensures that:
1. All cached client-side data is cleared
2. Fresh data is fetched from the server
3. All computed values are recalculated

## Implementation Details

### 1. Middleware Version Tracking
**File:** `app/Http/Middleware/HandleInertiaRequests.php`

Modified the `version()` method to combine:
- Asset version (for CSS/JS changes)
- Data version (for database changes)

```php
public function version(Request $request): ?string
{
    $assetVersion = parent::version($request);
    $dataVersion = cache()->get('app.data.version', '1');
    
    return $assetVersion.'.'.$dataVersion;
}
```

### 2. Version Increment on Data Changes
Added `cache()->increment('app.data.version', 1)` in all controllers that modify feature-related data:

#### Feature Operations
- `FeatureController::store()` - Creating new features
- `FeatureController::update()` - Updating existing features
- `FeatureController::destroy()` - Deleting features
- `FeatureController::updateStatus()` - Changing feature status
- `FeatureImportController::store()` - Bulk importing features

#### Estimation Components (affects feature counts)
- `EstimationComponentController::store()`
- `EstimationComponentController::update()`
- `EstimationComponentController::destroy()`
- `EstimationComponentController::archive()`
- `EstimationComponentController::activate()`

#### Estimations (affects weighted case totals)
- `EstimationController::store()`
- `EstimationController::update()`
- `EstimationController::destroy()`

#### Comments (affects feature comments)
- `CommentController::store()` - Creating new comments
- `CommentController::update()` - Updating existing comments
- `CommentController::destroy()` - Deleting comments

## How It Works

### Normal Flow (No Version Change)
1. User navigates to a page
2. Inertia checks if the version matches
3. If versions match, Inertia performs a partial update (swaps props only)
4. React components reuse computed values from `useMemo` hooks

### After Data Changes (Version Changed)
1. Data is modified (e.g., bulk import)
2. Data version in cache is incremented
3. User navigates to a page
4. Inertia detects version mismatch
5. Inertia performs a full page reload
6. Fresh data is fetched from server
7. All computed values are recalculated

## Benefits

✅ **Automatic Cache Invalidation** - No manual cache management needed
✅ **Works for All Data Changes** - Bulk imports, single updates, deletes all trigger refresh
✅ **Leverages Inertia Built-in** - Uses framework's native versioning mechanism
✅ **Minimal Performance Impact** - Cache operations are fast and lightweight
✅ **No Client-side Changes** - The fix is entirely server-side

## Testing

Run the version increment tests:
```bash
php artisan test --filter=VersionIncrementTest
```

Manual testing:
1. Navigate to Features index page
2. Note the available filter options (projects, requesters, statuses)
3. Import features with new projects/requesters via bulk import
4. Return to Features index page
5. Verify new projects/requesters appear in filter dropdowns immediately

## Cache Configuration

The solution uses Laravel's default cache driver. Ensure your cache is properly configured in `config/cache.php`.

For production environments, consider using:
- Redis (recommended for multi-server setups)
- Memcached
- Database (for simple setups)

Avoid using `file` or `array` drivers in production with multiple servers.

## Troubleshooting

### Version not incrementing
- Check cache configuration is working: `php artisan cache:clear && php artisan tinker`, then test `cache()->increment('test', 1)`
- Verify cache driver is not `array` (array driver is per-request only)

### Page still showing stale data
- Clear browser cache: Ctrl+Shift+R (hard refresh)
- Check browser console for Inertia errors
- Verify the version is changing in the response headers

### Performance concerns with frequent increments
- Cache operations are extremely fast (microseconds)
- Consider rate limiting if you have very high-frequency updates
- Monitor cache server if using Redis/Memcached

## Future Considerations

If you need more granular control:
- Implement per-model version tracking (e.g., `features.version`, `projects.version`)
- Use Laravel's model events to automatically increment versions
- Create a helper trait for automatic version management

## Related Files
- `app/Http/Middleware/HandleInertiaRequests.php`
- `app/Http/Controllers/FeatureController.php`
- `app/Http/Controllers/FeatureImportController.php`
- `app/Http/Controllers/EstimationComponentController.php`
- `app/Http/Controllers/EstimationController.php`
- `app/Http/Controllers/CommentController.php`
- `tests/Feature/VersionIncrementTest.php`
- `tests/Feature/CommentTest.php`
