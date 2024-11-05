import { env } from './env';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
}

async function request(endpoint: string, options: ApiOptions = {}) {
  const { method = 'GET', body, headers = {} } = options;

  const response = await fetch(`${env.API_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  get: (endpoint: string, options?: Omit<ApiOptions, 'method' | 'body'>) =>
    request(endpoint, { ...options, method: 'GET' }),

  post: (endpoint: string, body: any, options?: Omit<ApiOptions, 'method'>) =>
    request(endpoint, { ...options, method: 'POST', body }),

  put: (endpoint: string, body: any, options?: Omit<ApiOptions, 'method'>) =>
    request(endpoint, { ...options, method: 'PUT', body }),

  delete: (endpoint: string, options?: Omit<ApiOptions, 'method'>) =>
    request(endpoint, { ...options, method: 'DELETE' }),
};