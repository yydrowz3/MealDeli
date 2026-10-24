import { Button, Card, DateTime, Money } from "../../../shared/ui";
import { DEMO_PROMOTION, type PromotionRestaurant } from "../model/promotion";

export type PromotionCardProps = Readonly<{
  restaurant: PromotionRestaurant;
  active: boolean;
  onPromote: () => void;
}>;

export function PromotionCard({ restaurant, active, onPromote }: PromotionCardProps) {
  if (active && restaurant.promotedUntil) {
    return (
      <Card className="grid [align-items:start] gap-4">
        <p className="mb-2 text-jade-text text-[length:var(--text-small)] font-[750] tracking-[0.08em] uppercase">
          Promotion active
        </p>
        <h2>{restaurant.name} is promoted</h2>
        <p>
          Promoted until <DateTime value={restaurant.promotedUntil} />
        </p>
        <p>Active promotions cannot be extended or renewed early.</p>
      </Card>
    );
  }
  return (
    <Card className="grid [align-items:start] gap-4">
      <p className="text-[clamp(1.6rem,4vw,2.4rem)] font-[750]">
        <Money minor={DEMO_PROMOTION.priceMinor} /> / {DEMO_PROMOTION.durationDays} days
      </p>
      <p>Promoted restaurants appear ahead of regular listings during the promotion period.</p>
      <strong>Demo payment — no real charge will be made.</strong>
      <Button
        className="[justify-self:start] [@media(max-width:47.99rem)]:justify-self-stretch"
        onClick={onPromote}
      >
        Promote for $9.99
      </Button>
    </Card>
  );
}
