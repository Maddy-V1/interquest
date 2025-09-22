// Global fetch interceptor to handle API routing
const originalFetch = window.fetch;

// Override the global fetch function
window.fetch = function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    let url: string;

    if (typeof input === 'string') {
        url = input;
    } else if (input instanceof URL) {
        url = input.toString();
    } else {
        url = input.url;
    }

    // If it's an API call and we're in production, route to backend
    if (url.startsWith('/api') && import.meta.env.PROD) {
        const backendUrl = import.meta.env.VITE_API_URL || 'https://interquest.onrender.com';
        const newUrl = `${backendUrl}${url}`;
        console.log(`🔄 API Interceptor: ${url} → ${newUrl}`);
        url = newUrl;
    }

    // Call the original fetch with the modified URL
    return originalFetch(url, init);
};

export { }; // Make this a module