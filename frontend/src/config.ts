/**
 * Application Configuration
 * 
 * VITE_API_URL should be set in your .env file or deployment platform variables.
 * If not set, it falls back to localhost for development.
 * 
 * Example .env:
 * VITE_API_URL=https://your-backend-url.onrender.com
 */

export const config = {
    // Use VITE_ prefix for client-side env vars in Vite
    API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8000'
};
