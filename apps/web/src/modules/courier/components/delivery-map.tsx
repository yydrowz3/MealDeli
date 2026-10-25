import { useI18n } from "../../../shared/i18n";
import { divIcon } from "leaflet";
import type { Marker as LeafletMarker } from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer, ZoomControl } from "react-leaflet";
import type { MarkerProps } from "react-leaflet";
import { useEffect, useRef } from "react";

import { MapFrame } from "../../../shared/ui";
import type { DemoRoute } from "../model/demo-route";
import { MapFallback } from "./map-fallback";

// Preserve the original 12px divIcon anchor while rendering the existing 2rem markers.
const pickupIcon = divIcon({
  className:
    "grid! place-items-center size-8 border-2 border-solid border-white rounded-full shadow-md text-white font-extrabold bg-[#087f5b]",
  iconSize: [32, 32],
  iconAnchor: [6, 6],
  html: "R",
});
const destinationIcon = divIcon({
  className:
    "grid! place-items-center size-8 border-2 border-solid border-white rounded-full shadow-md text-white font-extrabold bg-[#334155]",
  iconSize: [32, 32],
  iconAnchor: [6, 6],
  html: "⌂",
});
const courierIcon = divIcon({
  className:
    "grid! place-items-center size-8 border-2 border-solid border-white rounded-full shadow-md text-white font-extrabold bg-[#c2410c] motion-reduce:transition-none",
  iconSize: [32, 32],
  iconAnchor: [6, 6],
  html: "➤",
});

function AccessibleMarker({ label, ...props }: MarkerProps & { label: string }) {
  const marker = useRef<LeafletMarker>(null);
  useEffect(() => {
    // Leaflet only applies alt to image icons. Our div icons need an explicit
    // accessible name, including when the language changes during a delivery.
    marker.current?.getElement()?.setAttribute("aria-label", label);
  }, [label]);
  return <Marker {...props} ref={marker} alt={label} title={label} />;
}

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
  const { t, language } = useI18n();
  const courier = route.path[route.progressIndex] ?? route.restaurant;
  const completed = route.path.slice(0, route.progressIndex + 1);
  const remaining = route.path.slice(route.progressIndex);

  return (
    <MapFrame
      attribution={failed ? null : <span>© OpenStreetMap contributors</span>}
      description={t("courier.simulatedLocation")}
      fallbackSlot={<MapFallback restaurantName={restaurantName} route={route} />}
      onSkipMap={onSkipMap}
      state={failed ? "fallback" : "ready"}
      title={t("courier.demoRoute")}
    >
      <div
        aria-label={t("courier.mapLabel")}
        className="relative h-96 overflow-hidden rounded-card md:h-120"
      >
        <MapContainer
          // Important utilities override Leaflet's unlayered vendor styles locally.
          className="h-full w-full bg-neutral-soft! [&_.leaflet-control-zoom_a]:bg-surface! [&_.leaflet-control-zoom_a]:text-charcoal! [&_.leaflet-control-zoom_a]:border-border! [&_.leaflet-control-attribution]:bg-surface! [&_.leaflet-control-attribution]:text-charcoal! [&_.leaflet-control-attribution_a]:text-action!"
          center={courier}
          scrollWheelZoom={false}
          zoom={14}
          zoomControl={false}
        >
          <ZoomControl
            key={language}
            zoomInTitle={t("courier.zoomIn")}
            zoomOutTitle={t("courier.zoomOut")}
          />
          <TileLayer
            attribution="© OpenStreetMap contributors"
            eventHandlers={{ tileerror: () => onTileFailure?.() }}
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Polyline pathOptions={{ color: "#b7c2bd", weight: 6 }} positions={remaining} />
          <Polyline pathOptions={{ color: "#087f5b", weight: 7 }} positions={completed} />
          <AccessibleMarker
            label={t("courier.pickup", { name: restaurantName })}
            icon={pickupIcon}
            position={route.restaurant}
          />
          <AccessibleMarker
            label={t("courier.destination")}
            icon={destinationIcon}
            position={route.destination}
          />
          <AccessibleMarker label={t("courier.location")} icon={courierIcon} position={courier} />
        </MapContainer>
        <ul className="sr-only">
          <li>{t("courier.pickup", { name: restaurantName })}</li>
          <li>{t("courier.destination")}</li>
          <li>{t("courier.location")}</li>
        </ul>
      </div>
    </MapFrame>
  );
}
