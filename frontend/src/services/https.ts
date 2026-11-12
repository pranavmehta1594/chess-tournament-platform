import axios from 'axios';
import { BACKEND_URL } from '../lib/config';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const https = axios.create({
  baseURL: `${BACKEND_URL}/api/v1`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// The API also returns the JWT in the login response. Re-send that token on
// every client-side request so authentication does not depend on a
// cross-origin cookie being accepted by the browser (some mobile browsers
// block or omit those cookies even when the login request succeeds).
https.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('chess_token');

    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

https.interceptors.response.use(
  (response) => {
    const payload = response.data;

    if (payload && typeof payload === 'object' && 'data' in payload) {
      response.data = payload.data;
    }

    return response;
  },
  (error) => {
    const responseData = error.response?.data;
    const message = Array.isArray(responseData?.message)
      ? responseData.message.join(', ')
      : responseData?.message || responseData?.error || error.message || 'Request failed';

    return Promise.reject(
      new ApiError(error.response?.status ?? 0, message, responseData),
    );
  },
);

