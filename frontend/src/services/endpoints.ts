export const ENDPOINTS = {
  auth: {
    me: '/auth/me',
    login: '/auth/login',
    logout: '/auth/logout',
  },
  tournaments: {
    all: '/tournaments',
    byId: (id: string) => `/tournaments/${id}`,
    leaderboard: (id: string) => `/tournaments/${id}/leaderboard`,
    matches: (id: string) => `/tournaments/${id}/matches`,
    join: (id: string) => `/tournaments/${id}/join`,
  },
  matches: {
    byId: (id: string) => `/matches/${id}`,
    history: '/matches/my-history',
  },
} as const;

