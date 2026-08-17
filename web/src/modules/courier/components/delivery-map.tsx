import { divIcon } from "leaflet";
import { MapContainer, Marker, Polyline, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import { MapFrame } from "../../../shared/ui";
import type { DemoRoute } from "../model/demo-route";
import { MapFallback } from "./map-fallback";

const pickupIcon = divIcon({ className: "courier-leaflet-marker courier-leaflet-marker--pickup", html: "R" });
const destinationIcon = divIcon({ className: "courier-leaflet-marker courier-leaflet-marker--destination", html: "⌂" });
const courierIcon = divIcon({ className: "courier-leaflet-marker courier-leaflet-marker--courier", html: "➤" });

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
      <div aria-label="Simulated delivery map" className="courier-leaflet-map">
        <MapContainer center={courier} scrollWheelZoom={false} zoom={14}>
          <TileLayer
            attribution="© OpenStreetMap contributors"
            eventHandlers={{ tileerror: () => onTileFailure?.() }}
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Polyline pathOptions={{ color: "#b7c2bd", weight: 6 }} positions={remaining} />
          <Polyline pathOptions={{ color: "#087f5b", weight: 7 }} positions={completed} />
          <Marker alt={`Pickup: ${restaurantName}`} icon={pickupIcon} position={route.restaurant} />
          <Marker alt="Demo delivery destination" icon={destinationIcon} position={route.destination} />
          <Marker alt="Simulated courier location" icon={courierIcon} position={courier} />
        </MapContainer>
        <ul className="courier-map-labels">
          <li>Pickup: {restaurantName}</li>
          <li>Demo delivery destination</li>
          <li>Simulated courier location</li>
        </ul>
      </div>
    </MapFrame>
  );
}

