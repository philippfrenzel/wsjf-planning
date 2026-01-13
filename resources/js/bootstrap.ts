import axios from 'axios';

/**
 * Configure axios defaults for Laravel
 */
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
axios.defaults.headers.common['Accept'] = 'application/json';
// Let axios automatically set Content-Type based on the data being sent
// Setting it globally to 'application/json' can cause issues with data serialization

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
