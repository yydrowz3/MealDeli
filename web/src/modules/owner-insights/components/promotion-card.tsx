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
      <Card className="owner-insights-promotion-active">
        <p className="owner-insights-eyebrow">Promotion active</p>
        <h2>{restaurant.name} is promoted</h2>
        <p>
          Promoted until <DateTime value={restaurant.promotedUntil} />
        </p>
        <p>Active promotions cannot be extended or renewed early.</p>
      </Card>
    );
  }
  return (
    <Card className="owner-insights-promotion-offer">
      <p className="owner-insights-price">
        <Money minor={DEMO_PROMOTION.priceMinor} /> / {DEMO_PROMOTION.durationDays} days
      </p>
      <p>Promoted restaurants appear ahead of regular listings during the promotion period.</p>
      <strong>Demo payment — no real charge will be made.</strong>
      <Button onClick={onPromote}>Promote for $9.99</Button>
    </Card>
  );
}
