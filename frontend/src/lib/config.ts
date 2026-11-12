const LIVE_API_URL = process.env.NEXT_LIVE_API_URL;

const environment = process.env.NEXT_PUBLIC_ENVIRONMENT || 'development';

export const BACKEND_URL =
  environment === 'production'
    ? LIVE_API_URL
    : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

