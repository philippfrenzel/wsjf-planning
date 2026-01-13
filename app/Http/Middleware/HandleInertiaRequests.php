<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;
use Tighten\Ziggy\Ziggy;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        // Use a combination of parent version (for asset changes) and data version (for data changes)
        $assetVersion = parent::version($request);
        $dataVersion = cache()->get('app.data.version', '1');

        return $assetVersion.'.'.$dataVersion;
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user(),
                'tenants' => fn () => $request->user()?->tenants()->get(['tenants.id', 'tenants.name']) ?? [],
                'currentTenant' => fn () => $request->user()?->currentTenant()->first(['id', 'name']),
            ],
            'locale' => app()->getLocale(),
            'ziggy' => fn (): array => [
                ...(new Ziggy)->toArray(),
                'location' => $request->url(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'appVersion' => $this->getAppVersion(),
        ];
    }

    /**
     * Get application version information.
     */
    protected function getAppVersion(): array
    {
        $version = config('app.version', '1.0.0');
        $commit = $this->getGitCommit();
        $commitDate = $this->getGitCommitDate();

        return [
            'version' => $version,
            'commit' => $commit,
            'commitShort' => $commit ? substr($commit, 0, 7) : null,
            'commitDate' => $commitDate,
        ];
    }

    /**
     * Get the current git commit hash.
     */
    protected function getGitCommit(): ?string
    {
        try {
            $gitPath = base_path('.git/HEAD');
            if (! file_exists($gitPath)) {
                return null;
            }

            $head = file_get_contents($gitPath);
            if (str_starts_with($head, 'ref:')) {
                $ref = trim(substr($head, 5));
                $refPath = base_path('.git/'.$ref);
                if (file_exists($refPath)) {
                    return trim(file_get_contents($refPath));
                }
            } else {
                return trim($head);
            }
        } catch (\Exception $e) {
            return null;
        }

        return null;
    }

    /**
     * Get the git commit date.
     */
    protected function getGitCommitDate(): ?string
    {
        try {
            $commit = $this->getGitCommit();
            if (! $commit) {
                return null;
            }

            if (function_exists('exec')) {
                $output = [];
                exec("git show -s --format=%ci {$commit} 2>/dev/null", $output);
                if (! empty($output[0])) {
                    return $output[0];
                }
            }
        } catch (\Exception $e) {
            return null;
        }

        return null;
    }
