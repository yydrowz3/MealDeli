export const PROMOTION_DAYS = 7 as const;

export function assertPromotionDaysContract(
  configuredValue: unknown,
): typeof PROMOTION_DAYS {
  if (
    configuredValue === undefined ||
    configuredValue === null ||
    configuredValue === ''
  ) {
    return PROMOTION_DAYS;
  }
  const parsed = Number(configuredValue);
  if (parsed !== PROMOTION_DAYS) {
    throw new Error(
      `PROMOTION_DAYS must be ${PROMOTION_DAYS} to match the client contract.`,
    );
  }
  return PROMOTION_DAYS;
}
