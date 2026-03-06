<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" @class(['dark' => ($appearance ?? 'system') == 'dark'])>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        <meta name="api-base-url" content="{{ config('app.url') }}">
        <meta name="theme-color" content="#0f172a">
        <meta name="description" content="WSJF Planning — Das PI-Planning- und Priorisierungs-Tool für SAFe-Teams. Features bewerten, Kapazitäten planen, Abhängigkeiten visualisieren." inertia head-key="description">

        {{-- Open Graph --}}
        <meta property="og:type" content="website" inertia head-key="og:type">
        <meta property="og:site_name" content="WSJF Planning">
        <meta property="og:title" content="{{ config('app.name', 'WSJF Planning') }} — PI Planning for SAFe Teams" inertia head-key="og:title">
        <meta property="og:description" content="WSJF Planning — Das PI-Planning- und Priorisierungs-Tool für SAFe-Teams. Features bewerten, Kapazitäten planen, Abhängigkeiten visualisieren." inertia head-key="og:description">
        <meta property="og:image" content="{{ asset('gfx/wsjf_planning_teaser.png') }}" inertia head-key="og:image">
        <meta property="og:url" content="{{ url()->current() }}" inertia head-key="og:url">
        <meta property="og:locale" content="de_CH">
        <meta property="og:locale:alternate" content="de_DE">
        <meta property="og:locale:alternate" content="en_US">
        <meta property="og:locale:alternate" content="fr_CH">
        <meta property="og:locale:alternate" content="it_CH">

        {{-- Twitter Card --}}
        <meta name="twitter:card" content="summary_large_image" inertia head-key="twitter:card">
        <meta name="twitter:title" content="{{ config('app.name', 'WSJF Planning') }} — PI Planning for SAFe Teams" inertia head-key="twitter:title">
        <meta name="twitter:description" content="WSJF Planning — Das PI-Planning- und Priorisierungs-Tool für SAFe-Teams." inertia head-key="twitter:description">
        <meta name="twitter:image" content="{{ asset('gfx/wsjf_planning_teaser.png') }}" inertia head-key="twitter:image">

        {{-- Canonical --}}
        <link rel="canonical" href="{{ url()->current() }}" inertia head-key="canonical">

        {{-- Inline script to detect system dark mode preference and apply it immediately --}}
        <script>
            (function() {
                const appearance = '{{ $appearance ?? "system" }}';

                if (appearance === 'system') {
                    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                    if (prefersDark) {
                        document.documentElement.classList.add('dark');
                    }
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style>
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        <title inertia>{{ config('app.name', 'WSJF Planning') }}</title>

        <link rel="icon" href="/favicon.svg" type="image/svg+xml" sizes="any">
        <link rel="icon" href="/favicon.ico" type="image/x-icon">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

        @routes
        @unless(app()->environment('testing'))
            @viteReactRefresh
            @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @endunless
        @inertiaHead

        {{-- Umami Analytics --}}
        <script defer src="https://analytics.goldtaler.at/script.js" data-website-id="85e5d4a1-ed01-442a-aacb-6fdd25f400a5"></script>
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
