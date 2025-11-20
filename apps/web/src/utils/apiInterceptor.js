import { logout } from './logout';

export const setupFetchInterceptor = () => {
  // Store the original fetch function
  const originalFetch = window.fetch;

  // Override the global fetch function
  window.fetch = async function (...args) {
    try {
      // Call the original fetch
      const response = await originalFetch.apply(this, args);

      // Check if response is 401 Unauthorized
      if (response.status === 401) {
        const url = args[0]?.toString() || '';
        const isAuthRequest = url.includes('/api/user/login') || url.includes('/api/user/refresh');
        
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
    } catch (error) {
      throw error;
    }
  };
};

