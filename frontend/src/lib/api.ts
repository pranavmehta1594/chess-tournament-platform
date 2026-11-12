import { BACKEND_URL } from './config';

const API_BASE_URL = BACKEND_URL;

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public data?: any,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function fetchApi<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}/api/v1${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: 'include', // sends and receives httpOnly cookies
  };

  const response = await fetch(url, config);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg =
      data?.message ||
      (Array.isArray(data?.message) ? data.message.join(', ') : null) ||
      data?.error ||
      'Request failed';
    throw new ApiError(response.status, errorMsg, data);
  }

  // Handle standard envelope { success: true, data: ... }
  if (data && typeof data === 'object' && 'data' in data) {
    return data.data as T;
  }

  return data as T;
}

