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
      <Card className="grid items-start gap-4">
        <p className="mb-2 text-jade-text text-small font-bold uppercase">
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
    <Card className="grid items-start gap-4">
      <p className="text-3xl font-bold">
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
      <Button className="justify-self-start max-md:justify-self-stretch" onClick={onPromote}>
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
