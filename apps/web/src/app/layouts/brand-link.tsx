import { useI18n } from "../../shared/i18n";
export function BrandLink() {
  const { t } = useI18n();
  return (
    <a
      aria-label={t("app.homeLabel")}
      className="inline-flex items-center gap-2 text-[1.25rem] font-[750] no-underline"
      href="/"
    >
      <img alt="" height="36" src="/brand/mealdeli-mark-primary.svg" width="36" />
      <span className="[@media(max-width:25.999rem)]:hidden">MealDeli</span>
    </a>
  );
}
