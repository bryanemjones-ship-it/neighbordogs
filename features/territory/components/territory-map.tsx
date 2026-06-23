"use client";

import { useEffect } from "react";
import L from "leaflet";
import { Circle, MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet's default icon path issues with Next.js/Webpack
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

const MILES_TO_METERS = 1609.34;

type TerritoryMapProps = {
  lat: number;
  lng: number;
  radiusMiles: number;
  className?: string;
};

function FitCircleBounds({
  lat,
  lng,
  radiusMiles,
}: {
  lat: number;
  lng: number;
  radiusMiles: number;
}) {
  const map = useMap();

  useEffect(() => {
    const radiusMeters = radiusMiles * MILES_TO_METERS;
    const latOffset = radiusMeters / 111320;
    const lngOffset =
      radiusMeters / (111320 * Math.cos((lat * Math.PI) / 180));
    const bounds = L.latLngBounds(
      [lat - latOffset, lng - lngOffset],
      [lat + latOffset, lng + lngOffset],
    );
    map.fitBounds(bounds, { padding: [20, 20], maxZoom: 15 });
  }, [map, lat, lng, radiusMiles]);

  return null;
}

export function TerritoryMap({
  lat,
  lng,
  radiusMiles,
  className,
}: TerritoryMapProps) {
  const radiusMeters = radiusMiles * MILES_TO_METERS;

  return (
    <div className={className ?? "h-72 w-full"}>
      <MapContainer
        center={[lat, lng]}
        zoom={13}
        scrollWheelZoom={false}
        className="h-full w-full rounded-xl"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <Circle
          center={[lat, lng]}
          radius={radiusMeters}
          pathOptions={{
            color: "#459A5E",
            fillColor: "#4FA76B",
            fillOpacity: 0.22,
            weight: 2.5,
          }}
        />
        <Marker position={[lat, lng]} />
        <FitCircleBounds lat={lat} lng={lng} radiusMiles={radiusMiles} />
      </MapContainer>
    </div>
  );
}
