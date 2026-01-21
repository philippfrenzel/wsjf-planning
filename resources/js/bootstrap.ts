import axios from 'axios';

/**
 * Configure axios base URL
 */
const baseUrlMeta = document.head.querySelector<HTMLMetaElement>('meta[name="api-base-url"]');
if (baseUrlMeta) {
    axios.defaults.baseURL = baseUrlMeta.content;
}

/**
 * Configure axios defaults for Laravel
 */
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.headers.common['Content-Type'] = 'application/json';

/**
 * Configure CSRF token for all axios requests
 */
const token = document.head.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');

if (token) {
    axios.defaults.headers.common['X-CSRF-TOKEN'] = token.content;
} else {
    console.error('CSRF token not found: https://laravel.com/docs/csrf#csrf-x-csrf-token');
}

export default axios;
