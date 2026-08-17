export type DemoPoint = Readonly<{ lat: number; lng: number }>;

export type DemoRoute = Readonly<{
  orderId: string;
  restaurant: DemoPoint;
  destination: DemoPoint;
  path: readonly DemoPoint[];
  progressIndex: number;
}>;

const ROUTE_STEPS = 26;

const routePairs: readonly Readonly<{
  restaurant: DemoPoint;
  waypoint: DemoPoint;
  destination: DemoPoint;
}>[] = [
  {
    restaurant: { lat: 40.7412, lng: -73.9896 },
    waypoint: { lat: 40.7448, lng: -73.9842 },
    destination: { lat: 40.7491, lng: -73.9788 },
  },
  {
    restaurant: { lat: 40.7287, lng: -73.9981 },
    waypoint: { lat: 40.7339, lng: -73.9948 },
    destination: { lat: 40.7395, lng: -73.9911 },
  },
  {
    restaurant: { lat: 40.7541, lng: -73.9864 },
    waypoint: { lat: 40.7502, lng: -73.9807 },
    destination: { lat: 40.7466, lng: -73.9743 },
  },
];

export function stableOrderHash(orderId: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < orderId.length; index += 1) {
    hash ^= orderId.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function interpolate(from: DemoPoint, to: DemoPoint, count: number): DemoPoint[] {
  return Array.from({ length: count }, (_, index) => {
    const ratio = index / (count - 1);
    return {
      lat: from.lat + (to.lat - from.lat) * ratio,
      lng: from.lng + (to.lng - from.lng) * ratio,
    };
  });
}

export function clampRouteProgress(value: number, pathLength = ROUTE_STEPS): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(Math.trunc(value), 0), Math.max(pathLength - 1, 0));
}

export function createDemoRoute(orderId: string, progressIndex = 0): DemoRoute {
  const pair = routePairs[stableOrderHash(orderId) % routePairs.length];
  const first = interpolate(pair.restaurant, pair.waypoint, 13);
  const second = interpolate(pair.waypoint, pair.destination, 14).slice(1);
  const path = [...first, ...second];
  return {
    orderId,
    restaurant: pair.restaurant,
    destination: pair.destination,
    path,
    progressIndex: clampRouteProgress(progressIndex, path.length),
  };
}

