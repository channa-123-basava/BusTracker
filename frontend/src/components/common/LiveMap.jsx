import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Bus marker — clean circular pin with bus glyph (no emoji)
const createBusIcon = (color = '#2563EB') =>
  L.divIcon({
    className: 'bus-marker-icon',
    html: `
      <div style="position:relative">
        <div style="
          background:${color};border:3px solid white;border-radius:50%;
          width:34px;height:34px;display:flex;align-items:center;justify-content:center;
          box-shadow:0 4px 12px rgba(0,0,0,0.25);
        ">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 6v6m0 0H3l-1 4v2h1.5M8 12h8m0-6v6m0 0h5l1 4v2h-1.5M8 18a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0m5 0a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0M3 6h18a1 1 0 0 1 1 1v5H2V7a1 1 0 0 1 1-1z"/>
          </svg>
        </div>
        <div style="
          position:absolute;bottom:-5px;left:50%;transform:translateX(-50%);
          width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;
          border-top:7px solid ${color};
        "></div>
      </div>`,
    iconSize: [38, 44],
    iconAnchor: [19, 44],
    popupAnchor: [0, -44],
  });

const createStopIcon = () =>
  L.divIcon({
    className: '',
    html: `<div style="background:#3B82F6;border:3px solid white;border-radius:50%;width:13px;height:13px;box-shadow:0 2px 6px rgba(0,0,0,0.3);"></div>`,
    iconSize: [13, 13],
    iconAnchor: [6.5, 6.5],
  });

const createTerminalIcon = (color, glyphPath) =>
  L.divIcon({
    className: '',
    html: `
      <div style="
        background:${color};border:3px solid white;border-radius:50%;
        width:22px;height:22px;display:flex;align-items:center;justify-content:center;
        box-shadow:0 3px 10px rgba(0,0,0,0.3);
      ">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          ${glyphPath}
        </svg>
      </div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

const startTerminalIcon = createTerminalIcon('#16A34A', '<polyline points="20 6 9 17 4 12"/>');
const endTerminalIcon = createTerminalIcon('#DC2626', '<rect x="4" y="4" width="16" height="16" rx="2"/>');

const PanToBus = ({ position }) => {
  const map = useMap();
  useEffect(() => {
    if (position?.latitude && position?.longitude) {
      map.setView([position.latitude, position.longitude], map.getZoom(), { animate: true });
    }
  }, [position?.latitude, position?.longitude]);
  return null;
};

const LiveMap = ({
  busLocation,
  route,
  buses = [],
  height = '400px',
  autoPan = false,
  showRoute = true,
  center = [20.5937, 78.9629],
  zoom = 13,
}) => {
  const routeCoords = route?.path?.map((p) => [p.latitude, p.longitude]) || [];
  const stopCoords = route?.stops || [];

  return (
    <MapContainer
      center={
        busLocation
          ? [busLocation.latitude, busLocation.longitude]
          : buses.length > 0
          ? [buses[0].currentLocation?.latitude || center[0], buses[0].currentLocation?.longitude || center[1]]
          : center
      }
      zoom={zoom}
      style={{ height, width: '100%', borderRadius: '0.75rem' }}
      zoomControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {autoPan && busLocation && <PanToBus position={busLocation} />}

      {busLocation?.latitude && busLocation?.longitude && (
        <Marker position={[busLocation.latitude, busLocation.longitude]} icon={createBusIcon('#D97706')}>
          <Popup>
            <div>
              <p className="font-semibold text-slate-800 text-sm">Your Bus</p>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                {busLocation.latitude.toFixed(5)}, {busLocation.longitude.toFixed(5)}
              </p>
              {busLocation.updatedAt && (
                <p className="text-xs text-slate-400 mt-1">
                  Updated {new Date(busLocation.updatedAt).toLocaleTimeString()}
                </p>
              )}
            </div>
          </Popup>
        </Marker>
      )}

      {buses.map((bus) =>
        bus.currentLocation?.latitude ? (
          <Marker
            key={bus._id}
            position={[bus.currentLocation.latitude, bus.currentLocation.longitude]}
            icon={createBusIcon(bus.color || '#D97706')}
          >
            <Popup>
              <div>
                <p className="font-semibold text-slate-800 text-sm">Bus {bus.busNumber}</p>
                {bus.assignedRoute && <p className="text-xs text-slate-600 mt-1">Route: {bus.assignedRoute.routeName}</p>}
                {bus.assignedDriver && <p className="text-xs text-slate-600">Driver: {bus.assignedDriver.name}</p>}
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  {bus.currentLocation.latitude.toFixed(5)}, {bus.currentLocation.longitude.toFixed(5)}
                </p>
              </div>
            </Popup>
          </Marker>
        ) : null
      )}

      {showRoute && routeCoords.length > 1 && (
        <Polyline positions={routeCoords} color="#2563EB" weight={4} opacity={0.65} dashArray="8 4" />
      )}

      {showRoute && route?.source && (
        <Marker position={[route.source.latitude, route.source.longitude]} icon={startTerminalIcon}>
          <Popup>
            <p className="font-semibold text-sm">{route.source.name}</p>
            <p className="text-xs text-slate-500">Source</p>
          </Popup>
        </Marker>
      )}

      {showRoute && route?.destination && (
        <Marker position={[route.destination.latitude, route.destination.longitude]} icon={endTerminalIcon}>
          <Popup>
            <p className="font-semibold text-sm">{route.destination.name}</p>
            <p className="text-xs text-slate-500">Destination</p>
          </Popup>
        </Marker>
      )}

      {showRoute &&
        stopCoords.map((stop, i) => (
          <Marker key={i} position={[stop.latitude, stop.longitude]} icon={createStopIcon()}>
            <Popup>
              <p className="font-semibold text-sm">{stop.name}</p>
              {stop.estimatedTime && <p className="text-xs text-slate-500">ETA {stop.estimatedTime}</p>}
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
};

export default LiveMap;
