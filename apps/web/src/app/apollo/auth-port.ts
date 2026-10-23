export type AuthPort = {
  getAccessToken: () => string | null;
  refreshAccessToken: () => Promise<string>;
  clearSession: () => void | Promise<void>;
  subscribeAccessToken?: (listener: () => void) => () => void;
};

export const anonymousAuthPort: AuthPort = {
  getAccessToken: () => null,
  refreshAccessToken: () => Promise.reject(new Error("No authenticated session.")),
  clearSession: () => undefined,
};
