import { useI18n } from "../../../shared/i18n";
import type { DemoRoute } from "../model/demo-route";

export type MapFallbackProps = Readonly<{
  route: DemoRoute;
  restaurantName: string;
}>;

export function MapFallback({ route, restaurantName }: MapFallbackProps) {
  const { t } = useI18n();
  const progress = route.progressIndex / Math.max(route.path.length - 1, 1);
  return (
    <div
      className="relative min-h-[460px] overflow-hidden rounded-[0.9rem] [@media(max-width:767px)]:min-h-[48vh] bg-neutral-soft [background-image:linear-gradient(var(--color-border)_1px,transparent_1px),linear-gradient(90deg,var(--color-border)_1px,transparent_1px)] [background-size:28px_28px]"
      data-testid="courier-map-fallback"
    >
      <svg
        className="absolute inset-0 size-full"
        aria-hidden="true"
        preserveAspectRatio="none"
        viewBox="0 0 100 60"
      >
        <path
          fill="none"
          stroke="var(--color-muted)"
          strokeLinecap="round"
          strokeWidth="3"
          d="M 8 48 C 32 42, 58 22, 92 10"
        />
        <path
          fill="none"
          stroke="var(--color-jade)"
          strokeLinecap="round"
          strokeWidth="3"
          d="M 8 48 C 32 42, 58 22, 92 10"
          pathLength="1"
          style={{ strokeDasharray: `${progress} 1` }}
        />
      </svg>
      <span
        aria-label={t("courier.pickup", { name: restaurantName })}
        className="grid place-items-center size-8 border-2 border-solid border-white rounded-[999px] [box-shadow:0_2px_8px_rgb(0_0_0/30%)] text-white font-[800] absolute -translate-1/2 bg-[#087f5b] left-[8%] top-[80%]"
        role="img"
      >
        R
      </span>
      <span
        aria-label={t("courier.destination")}
        className="grid place-items-center size-8 border-2 border-solid border-white rounded-[999px] [box-shadow:0_2px_8px_rgb(0_0_0/30%)] text-white font-[800] absolute -translate-1/2 bg-[#334155] left-[92%] top-[18%]"
        role="img"
      >
        ⌂
      </span>
      <span
        aria-label={t("courier.location")}
        className="grid place-items-center size-8 border-2 border-solid border-white rounded-[999px] [box-shadow:0_2px_8px_rgb(0_0_0/30%)] text-white font-[800] absolute -translate-1/2 bg-[#c2410c] motion-reduce:transition-none"
        role="img"
        style={{ left: `${8 + progress * 84}%`, top: `${80 - progress * 62}%` }}
      >
        ➤
      </span>
    </div>
  );
}
