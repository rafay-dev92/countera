import { logout } from './logout';

export const setupFetchInterceptor = () => {
  // Store the original fetch function, bound so detached calls stay legal
  const originalFetch = window.fetch.bind(window);

  // Override the global fetch function
  window.fetch = async function (...args: Parameters<typeof fetch>) {
    const response = await originalFetch(...args);

    // Check if response is 401 Unauthorized
    if (response.status === 401) {
      const url = args[0]?.toString() || '';
      const isAuthRequest =
        url.includes('/api/user/login') || url.includes('/api/user/refresh');

      if (!isAuthRequest) {
        console.warn('401 Unauthorized response detected. Logging out user...');
        // Clone the response before logging out (so it can still be read if needed)
        const clonedResponse = response.clone();
        // Use setTimeout to avoid blocking the response handling
        setTimeout(() => {
          logout();
        }, 0);
        return clonedResponse;
      }
    }

    return response;
  };
};
