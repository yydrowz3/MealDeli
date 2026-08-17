export function isPromotionActive(
  promotedUntil: string | null,
  now: Date | number = Date.now(),
): boolean {
  if (!promotedUntil) return false;
  const expiry = Date.parse(promotedUntil);
  const current = typeof now === "number" ? now : now.getTime();
  return Number.isFinite(expiry) && expiry > current;
}
