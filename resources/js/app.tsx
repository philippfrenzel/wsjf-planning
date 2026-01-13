import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import '../css/app.css';
import './bootstrap';
import '/resources/css/tiptap.css';

import { createInertiaApp, router } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initializeTheme } from './hooks/use-appearance';
import { initializeLocale } from './hooks/use-locale';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Fortschrittsbalken konfigurieren
router.on('start', () => {
    // Custom Ladeanimation starten (optional)
    NProgress.start();
});

router.on('finish', () => {
    // Ladeanimation beenden
    NProgress.done();
});

// NProgress-Konfiguration
NProgress.configure({
    showSpinner: false,
    minimum: 0.1,
    easing: 'ease',
    speed: 500,
    trickleSpeed: 200,
});

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) => resolvePageComponent(`./pages/${name}.tsx`, import.meta.glob('./pages/**/*.tsx')),
    setup({ el, App, props }) {
        const root = createRoot(el);

        root.render(<App {...props} />);
    },
    progress: {
        color: '#4B5563',
    },
});

// This will set light / dark mode on load...
initializeTheme();
// Set the current locale on load...
initializeLocale();
