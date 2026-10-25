import { useI18n } from "../../shared/i18n";
export function BrandLink() {
  const { t } = useI18n();
  return (
    <a
      aria-label={t("app.homeLabel")}
      className="inline-flex items-center gap-2 text-section font-bold"
      href="/"
    >
      <img alt="" height="36" src="/brand/mealdeli-mark-primary.svg" width="36" />
      <span className="max-[26rem]:hidden">MealDeli</span>
    </a>
  );
}
