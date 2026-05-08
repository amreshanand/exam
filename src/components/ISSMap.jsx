import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Custom ISS marker SVG
// Custom ISS marker SVG with radar-like pulse
const ISS_ICON = L.divIcon({
  className: '',
  html: `<div class="relative flex items-center justify-center">
    <div class="absolute w-12 h-12 rounded-full bg-blue-500/20 animate-ping"></div>
    <div class="absolute w-8 h-8 rounded-full bg-blue-500/30 animate-pulse"></div>
    <div style="
      width: 40px; height: 40px;
      background: radial-gradient(circle, #388BFD 0%, #0D1117 80%);
      border-radius: 12px;
      border: 2px solid #388BFD;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 0 20px #388BFD, inset 0 0 10px #388BFD;
      transform: rotate(45deg);
      transition: all 0.5s ease;
    ">
      <div style="transform: rotate(-45deg); font-size: 20px;">📡</div>
    </div>
  </div>`,
  iconSize: [48, 48],
  iconAnchor: [24, 24],
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
        color: '#388BFD',
        weight: 3,
        opacity: 0.6,
        dashArray: '8 8',
        lineCap: 'round',
        lineJoin: 'round',
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
