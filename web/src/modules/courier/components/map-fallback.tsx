import type { DemoRoute } from "../model/demo-route";

export type MapFallbackProps = Readonly<{
  route: DemoRoute;
  restaurantName: string;
}>;

export function MapFallback({ route, restaurantName }: MapFallbackProps) {
  const progress = route.progressIndex / Math.max(route.path.length - 1, 1);
  return (
    <div className="courier-map-fallback" data-testid="courier-map-fallback">
      <svg aria-hidden="true" preserveAspectRatio="none" viewBox="0 0 100 60">
        <path className="courier-route-remaining" d="M 8 48 C 32 42, 58 22, 92 10" />
        <path
          className="courier-route-complete"
          d="M 8 48 C 32 42, 58 22, 92 10"
          pathLength="1"
          style={{ strokeDasharray: `${progress} 1` }}
        />
      </svg>
      <span
        aria-label={`Pickup: ${restaurantName}`}
        className="courier-map-marker courier-map-marker--pickup"
        role="img"
      >
        R
      </span>
      <span
        aria-label="Demo delivery destination"
        className="courier-map-marker courier-map-marker--destination"
        role="img"
      >
        ⌂
      </span>
      <span
        aria-label="Simulated courier location"
        className="courier-map-marker courier-map-marker--courier"
        role="img"
        style={{ left: `${8 + progress * 84}%`, top: `${80 - progress * 62}%` }}
      >
        ➤
      </span>
    </div>
  );
}
