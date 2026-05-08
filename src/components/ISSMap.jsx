import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom ISS marker SVG
const ISS_ICON = L.divIcon({
  className: '',
  html: `<div style="
    width: 36px; height: 36px;
    background: radial-gradient(circle, #3b82f6 0%, #1d4ed8 60%, transparent 70%);
    border-radius: 50%;
    border: 2px solid #60a5fa;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 12px #3b82f6, 0 0 24px #3b82f640;
    font-size: 18px; line-height: 1;
  ">🛸</div>`,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

export default function ISSMap() {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markerRef = useRef(null);
  const pathRef = useRef(null);
  const { issPosition, issHistory } = useStore();

  // Initialize map once
  useEffect(() => {
    if (leafletMap.current) return;
    leafletMap.current = L.map(mapRef.current, {
      center: [0, 0],
      zoom: 2,
      zoomControl: true,
      attributionControl: true,
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(leafletMap.current);
  }, []);

  // Update marker and path when position changes
  useEffect(() => {
    if (!leafletMap.current || !issPosition?.iss_position) return;

    const lat = parseFloat(issPosition.iss_position.latitude);
    const lon = parseFloat(issPosition.iss_position.longitude);
    if (isNaN(lat) || isNaN(lon)) return;

    // Update or create marker
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lon]);
    } else {
      markerRef.current = L.marker([lat, lon], { icon: ISS_ICON })
        .addTo(leafletMap.current)
        .bindTooltip(`ISS — Lat: ${lat.toFixed(2)}, Lon: ${lon.toFixed(2)}`, { permanent: false });
    }

    // Draw trajectory path (last 15 positions)
    if (pathRef.current) {
      leafletMap.current.removeLayer(pathRef.current);
    }
    if (issHistory.length >= 2) {
      const coords = issHistory.map(p => [
        parseFloat(p.iss_position.latitude),
        parseFloat(p.iss_position.longitude),
      ]);
      pathRef.current = L.polyline(coords, {
        color: '#ef4444',
        weight: 2,
        opacity: 0.7,
        dashArray: '6 4',
      }).addTo(leafletMap.current);
    }

    // Pan to current position
    leafletMap.current.panTo([lat, lon], { animate: true, duration: 1 });
  }, [issPosition, issHistory]);

  return (
    <div
      ref={mapRef}
      style={{ width: '100%', height: '100%', minHeight: 300, zIndex: 0 }}
    />
  );
}
