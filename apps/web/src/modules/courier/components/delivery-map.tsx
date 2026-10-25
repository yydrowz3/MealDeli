import { divIcon } from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer } from "react-leaflet";

import { MapFrame } from "../../../shared/ui";
import type { DemoRoute } from "../model/demo-route";
import { MapFallback } from "./map-fallback";

// Preserve the original 12px divIcon anchor while rendering the existing 2rem markers.
const pickupIcon = divIcon({
  className:
    "grid! place-items-center size-8 border-2 border-solid border-white rounded-[999px] [box-shadow:0_2px_8px_rgb(0_0_0/30%)] text-white font-[800] bg-[#087f5b]",
  iconSize: [32, 32],
  iconAnchor: [6, 6],
  html: "R",
});
const destinationIcon = divIcon({
  className:
    "grid! place-items-center size-8 border-2 border-solid border-white rounded-[999px] [box-shadow:0_2px_8px_rgb(0_0_0/30%)] text-white font-[800] bg-[#334155]",
  iconSize: [32, 32],
  iconAnchor: [6, 6],
  html: "⌂",
});
const courierIcon = divIcon({
  className:
    "grid! place-items-center size-8 border-2 border-solid border-white rounded-[999px] [box-shadow:0_2px_8px_rgb(0_0_0/30%)] text-white font-[800] bg-[#c2410c] motion-reduce:transition-none",
  iconSize: [32, 32],
  iconAnchor: [6, 6],
  html: "➤",
});

export type DeliveryMapProps = Readonly<{
  route: DemoRoute;
  restaurantName: string;
  failed?: boolean;
  onTileFailure?: () => void;
  onSkipMap: () => void;
}>;

export function DeliveryMap({
  route,
  restaurantName,
  failed = false,
  onTileFailure,
  onSkipMap,
}: DeliveryMapProps) {
  const courier = route.path[route.progressIndex] ?? route.restaurant;
  const completed = route.path.slice(0, route.progressIndex + 1);
  const remaining = route.path.slice(route.progressIndex);

  return (
    <MapFrame
      attribution={failed ? null : <span>© OpenStreetMap contributors</span>}
      description="Location is simulated for this demo."
      fallbackSlot={<MapFallback restaurantName={restaurantName} route={route} />}
      onSkipMap={onSkipMap}
      state={failed ? "fallback" : "ready"}
      title="Demo route"
    >
      <div
        aria-label="Simulated delivery map"
        className="relative min-h-[460px] overflow-hidden rounded-[0.9rem] [@media(max-width:767px)]:min-h-[48vh]"
      >
        <MapContainer
          // Important utilities override Leaflet's unlayered vendor styles locally.
          className="min-h-[460px] w-full bg-neutral-soft! [@media(max-width:767px)]:min-h-[48vh] [&_.leaflet-control-zoom_a]:bg-surface! [&_.leaflet-control-zoom_a]:text-charcoal! [&_.leaflet-control-zoom_a]:border-border! [&_.leaflet-control-attribution]:bg-surface! [&_.leaflet-control-attribution]:text-charcoal! [&_.leaflet-control-attribution_a]:text-action!"
          center={courier}
          scrollWheelZoom={false}
          zoom={14}
        >
          <TileLayer
            attribution="© OpenStreetMap contributors"
            eventHandlers={{ tileerror: () => onTileFailure?.() }}
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Polyline pathOptions={{ color: "#b7c2bd", weight: 6 }} positions={remaining} />
          <Polyline pathOptions={{ color: "#087f5b", weight: 7 }} positions={completed} />
          <Marker alt={`Pickup: ${restaurantName}`} icon={pickupIcon} position={route.restaurant} />
          <Marker
            alt="Demo delivery destination"
            icon={destinationIcon}
            position={route.destination}
          />
          <Marker alt="Simulated courier location" icon={courierIcon} position={courier} />
        </MapContainer>
        <ul className="list-none p-0 absolute [inline-size:1px] [block-size:1px] overflow-hidden [clip:rect(0,0,0,0)]">
          <li>Pickup: {restaurantName}</li>
          <li>Demo delivery destination</li>
          <li>Simulated courier location</li>
        </ul>
      </div>
    </MapFrame>
  );
}
