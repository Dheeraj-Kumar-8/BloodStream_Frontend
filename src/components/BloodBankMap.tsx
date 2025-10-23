import { useEffect, useMemo, useState } from 'react';
import { Circle, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import type { LatLngExpression } from 'leaflet';
import L from 'leaflet';
import markerIcon2xUrl from 'leaflet/dist/images/marker-icon-2x.png';
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';
import type { BloodBank } from '../types';

const defaultIcon = L.icon({
  iconRetinaUrl: markerIcon2xUrl,
  iconUrl: markerIconUrl,
  shadowUrl: markerShadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface BloodBankMapProps {
  banks: BloodBank[];
  center?: {
    lat: number;
    lng: number;
  };
  radiusKm?: number;
}

// Default to India (approximate centroid)
const fallbackCenter: LatLngExpression = [20.5937, 78.9629];

const toLatLng = (coordinates: [number, number]): LatLngExpression => [coordinates[1], coordinates[0]];

const BloodBankMap = ({ banks, center, radiusKm = 50 }: BloodBankMapProps) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const markers = useMemo(
    () =>
      banks.filter((bank) => Array.isArray(bank.location?.coordinates) && bank.location?.coordinates.length === 2),
    [banks]
  );

  const mapCenter: LatLngExpression = useMemo(() => {
    if (center) {
      return [center.lat, center.lng];
    }
    if (markers.length > 0) {
      return toLatLng(markers[0].location!.coordinates);
    }
    return fallbackCenter;
  }, [center, markers]);

  if (!isClient) {
    return null;
  }

  const defaultZoom = useMemo(() => {
    // Wider zoom when using country fallback
    if (!center && markers.length === 0) return 5;
    return 12;
  }, [center, markers.length]);

  return (
    <div className="relative h-96 w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40">
      <MapContainer center={mapCenter} zoom={defaultZoom} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {radiusKm && center && (
          <Circle
            center={[center.lat, center.lng]}
            radius={radiusKm * 1000}
            pathOptions={{ color: '#f87171', fillColor: '#f87171', fillOpacity: 0.08 }}
          />
        )}
        {markers.map((bank) => {
          const coords = bank.location?.coordinates as [number, number];
          const position = toLatLng(coords);
          return (
            <Marker key={bank._id} position={position} icon={defaultIcon}>
              <Popup>
                <div className="space-y-1">
                  <p className="font-semibold">{bank.name}</p>
                  {bank.address && <p className="text-sm">{bank.address}</p>}
                  {bank.distanceKm !== undefined && (
                    <p className="text-xs text-slate-500">{bank.distanceKm.toFixed(1)} km away</p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
      {markers.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/60 text-sm text-slate-300">
          No blood banks with map coordinates match this search yet.
        </div>
      )}
    </div>
  );
};

export default BloodBankMap;
