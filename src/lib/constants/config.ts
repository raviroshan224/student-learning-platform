export const CONFIG = {
  API_BASE_URL: "/api/proxy",
  APP_NAME: "ScholarGyan",
  APP_DESCRIPTION: "Your ultimate student learning platform",
  TOKEN_KEY: "access_token",
  REFRESH_TOKEN_KEY: "refresh_token",
  STALE_TIME: 1000 * 60 * 5, // 5 minutes
  RETRY_COUNT: 2,
} as const;

