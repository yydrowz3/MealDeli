import { useI18n } from "../../../shared/i18n";
import { Trans } from "react-i18next";
import { Button, Card, DateTime, Money } from "../../../shared/ui";
import { DEMO_PROMOTION, type PromotionRestaurant } from "../model/promotion";

export type PromotionCardProps = Readonly<{
  restaurant: PromotionRestaurant;
  active: boolean;
  onPromote: () => void;
}>;

export function PromotionCard({ restaurant, active, onPromote }: PromotionCardProps) {
  const { t, i18n, language } = useI18n();
  if (active && restaurant.promotedUntil) {
    return (
      <Card className="grid [align-items:start] gap-4">
        <p className="mb-2 text-jade-text text-[length:var(--text-small)] font-[750] tracking-[0.08em] uppercase">
          {t("insights.active")}
        </p>
        <h2>{t("insights.promotedName", { name: restaurant.name })}</h2>
        <p>
          {t("insights.promotedUntil")} <DateTime value={restaurant.promotedUntil} />
        </p>
        <p>{t("insights.renewHelp")}</p>
      </Card>
    );
  }
  return (
    <Card className="grid [align-items:start] gap-4">
      <p className="text-[clamp(1.6rem,4vw,2.4rem)] font-[750]">
        <Trans
          key={language}
          i18n={i18n}
          i18nKey="insights.durationPrice"
          count={DEMO_PROMOTION.durationDays}
          components={{ price: <Money minor={DEMO_PROMOTION.priceMinor} /> }}
        />
      </p>
      <p>{t("insights.listingHelp")}</p>
      <strong>{t("insights.demoHelp")}</strong>
      <Button
        className="[justify-self:start] [@media(max-width:47.99rem)]:justify-self-stretch"
        onClick={onPromote}
      >
        <Trans
          key={language}
          i18n={i18n}
          i18nKey="insights.promotePrice"
          components={{ price: <Money minor={DEMO_PROMOTION.priceMinor} /> }}
        />
      </Button>
    </Card>
  );
}
