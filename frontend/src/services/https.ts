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

