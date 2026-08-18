export const PWA_SENSITIVE_REQUEST_PATTERN =
  /^https?:\/\/.*(?:\/graphql(?:[/?]|$)|\/uploads(?:[/?]|$)|\/auth(?:[/?]|$)|\/email(?:[/?]|$))/i;
export const PWA_MAP_TILE_PATTERN = /^https?:\/\/(?:[a-c]\.)?tile\.openstreetmap\.org\//i;

export const PWA_RUNTIME_CACHING = [
  {
    urlPattern: PWA_SENSITIVE_REQUEST_PATTERN,
    handler: "NetworkOnly" as const,
    method: "GET" as const,
  },
  {
    urlPattern: PWA_SENSITIVE_REQUEST_PATTERN,
    handler: "NetworkOnly" as const,
    method: "POST" as const,
  },
  {
    urlPattern: PWA_MAP_TILE_PATTERN,
    handler: "NetworkOnly" as const,
    method: "GET" as const,
  },
] as const;

export const PWA_UPDATE_BEHAVIOR = {
  registerType: "prompt" as const,
  autoReload: false,
};
