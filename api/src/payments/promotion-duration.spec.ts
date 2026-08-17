import {
  assertPromotionDaysContract,
  PROMOTION_DAYS,
} from './promotion-duration';

describe('promotion duration contract', () => {
  it('is fixed at seven days for the demo client contract', () => {
    expect(PROMOTION_DAYS).toBe(7);
    expect(assertPromotionDaysContract('7')).toBe(7);
    expect(assertPromotionDaysContract(7)).toBe(7);
  });

  it('rejects a configured duration that would disagree with the client', () => {
    expect(() => assertPromotionDaysContract('14')).toThrow(
      'PROMOTION_DAYS must be 7',
    );
  });
});
