const BLOCKED_UBER_HOSTS = new Set(["cn-geo1.uber.com", "tb-static.uber.com"]);

export function isUberAssetUrl(source: string | null): boolean {
  if (!source) return false;
  try {
    const host = new URL(source, "https://mealdeli.local").hostname.toLowerCase();
    return BLOCKED_UBER_HOSTS.has(host) || host.endsWith(".uber.com");
  } catch {
    return false;
  }
}
