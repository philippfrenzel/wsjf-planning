# Version Information

## Overview

The WSJF Planning application now includes version information displayed in the sidebar footer. This helps with debugging and issue tracking by providing clear version and commit references.

## Version Display

The version information is displayed in the sidebar footer (when expanded) and includes:

- **Application Version**: The semantic version (e.g., 1.0.0)
- **Git Commit Hash**: The short commit hash (7 characters) for precise version identification
- **Commit Date**: The date when the commit was made

## Configuration

### Setting the Version

The application version can be configured in multiple ways:

1. **Environment Variable** (Recommended for deployments):
   ```bash
   APP_VERSION=1.0.0
   ```

2. **Config File** (`config/app.php`):
   ```php
   'version' => env('APP_VERSION', '1.0.0'),
   ```

3. **Package.json** (for reference):
   ```json
   {
     "version": "1.0.0"
   }
   ```

### Version Display Location

The version information is displayed in:
- **Sidebar Footer**: Visible when the sidebar is expanded
- **Hidden on Icon Mode**: Not displayed when sidebar is collapsed to icon-only mode

## Technical Implementation

### Backend (PHP)

The version information is shared globally via Inertia.js in `HandleInertiaRequests` middleware:

```php
'appVersion' => $this->getAppVersion()
```

The `getAppVersion()` method:
- Reads the version from `config('app.version')`
- Extracts the current Git commit hash from `.git/HEAD`
- Retrieves the commit date using Git commands
- Returns all information as an array

### Frontend (TypeScript/React)

The version is accessible in all pages through Inertia's shared props:

```typescript
import { usePage } from '@inertiajs/react';

const { appVersion } = usePage().props;
// appVersion.version: string
// appVersion.commit: string | null
// appVersion.commitShort: string | null
// appVersion.commitDate: string | null
```

The `VersionInfo` component displays this information in the sidebar.

## Usage for Issue Reporting

When reporting issues, users can now reference:
1. The **version number** (e.g., 1.0.0)
2. The **commit hash** (e.g., 09bfb06) - This is the most precise identifier

Example issue report:
```
Version: 1.0.0 (09bfb06)
Date: 13. Jan. 2026
Issue: Comment component not loading...
```

This allows developers to:
- Check out the exact code version: `git checkout 09bfb06`
- Review changes since that version: `git log 09bfb06..HEAD`
- Identify if the issue was already fixed in a newer version

## Git Commit Hash

The commit hash is automatically extracted from the Git repository:
- In development: Always shows the current commit
- In production: Shows the commit that was deployed
- If Git is not available: Returns null (version still shown)

## Caching Considerations

For performance in production:
- Consider caching the version information
- The Git commit lookup happens on every request (lightweight operation)
- Can be optimized by caching in production environments

## Updating the Version

To update the application version:

1. Update `package.json`:
   ```bash
   npm version 1.1.0
   ```

2. Update `.env` or `.env.production`:
   ```bash
   APP_VERSION=1.1.0
   ```

3. Commit and deploy:
   ```bash
   git add package.json .env
   git commit -m "Bump version to 1.1.0"
   git push
   ```

The commit hash will automatically update to reflect the new commit.

## Troubleshooting

### Version not showing

Check that:
1. `APP_VERSION` is set in `.env`
2. Config cache is cleared: `php artisan config:clear`
3. Assets are rebuilt: `npm run build`

### Commit hash not showing

This can happen if:
- The `.git` directory is not present (e.g., in Docker without git)
- Git is not installed on the server
- File permissions prevent reading `.git/HEAD`

This is normal in some production environments. The version number will still be displayed.

### Commit date not showing

Requires:
- Git to be installed
- `exec()` function to be enabled in PHP
- The git repository to be present

Again, this is optional - the version and commit hash are the most important identifiers.
