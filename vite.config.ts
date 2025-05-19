import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
        }),
        react(),
        tailwindcss(),
    ],
    esbuild: {
        jsx: 'automatic',
    },
    resolve: {
        alias: {
            'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
        },
    },
    server: {
        cors: {
            origin: (origin, _cb) => {
                // Erlaube alle *.github.dev Subdomains und localhost:8000
                if (
                    !origin ||
                    /^https:\/\/.*\.github\.dev$/.test(origin) ||
                    origin === 'http://localhost:8000' ||
                    origin === 'http://127.0.0.1:8000'
                ) {
                    return true;
                }
                return false;
            },
            credentials: true,
        },
        host: true, // wichtig für Codespaces
        https: {
            key: fs.readFileSync(path.resolve(__dirname, 'certs/localhost-key.pem')),
            cert: fs.readFileSync(path.resolve(__dirname, 'certs/localhost.pem')),
        },
        hmr: {
            host: process.env.CODESPACE_NAME ? process.env.CODESPACE_NAME + '-5173.' + process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN : null,
            clientPort: process.env.CODESPACE_NAME ? 443 : null,
            protocol: process.env.CODESPACE_NAME ? 'wss' : null
        },
    },
});
