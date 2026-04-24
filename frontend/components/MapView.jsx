'use client';
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const yellowIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

function FitBounds({ locations }) {
  const map = useMap();
  useEffect(() => {
    if (locations.length > 0) {
      const bounds = locations.map(l => [l.latitude, l.longitude]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [locations]);
  return null;
}

export default function MapView({ locations, members = [] }) {
  const getMemberName = (userId) => {
    const member = members.find(m => m.id === userId || m.userId === userId);
    return member ? (member.fullName || member.name || member.email) : userId;
  };

  const center = locations.length > 0
    ? [locations[0].latitude, locations[0].longitude]
    : [20.5937, 78.9629];

  return (
    <MapContainer center={center} zoom={5} style={{ height: '100%', width: '100%', background: '#1a1a1a' }}>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
      />
      {locations.map((loc, i) => (
        <Marker key={i} position={[loc.latitude, loc.longitude]} icon={yellowIcon}>
          <Popup>
            <div style={{ color: '#000' }}>
              <strong>{getMemberName(loc.userId)}</strong>
              {loc.address && <div style={{ fontSize: '12px', marginTop: '4px' }}>📍 {loc.address}</div>}
              <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                Updated: {new Date(loc.updatedAt).toLocaleTimeString()}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
      {locations.length > 1 && <FitBounds locations={locations} />}
    </MapContainer>
  );
}