import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useSocket } from '../../context/SocketContext';
import { tripAPI, busAPI, routeAPI } from '../../api/services';
import LiveMap from '../../components/common/LiveMap';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Modal from '../../components/common/Modal';
import { BusIcon, RouteIcon, ActivityIcon, ClockIcon, PhoneIcon, MapPinIcon, BellIcon, UserIcon } from '../../components/common/Icons';

const StudentDashboard = () => {
  const { user } = useAuth();
  const { notifications, unreadCount } = useNotifications();
  const { socket, connected, trackBus } = useSocket();
  const [activeTrip, setActiveTrip] = useState(null);
  const [busLocation, setBusLocation] = useState(null);
  const [busInfo, setBusInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eta, setEta] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [distanceToBus, setDistanceToBus] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [listsLoading, setListsLoading] = useState(true);

  const assignedBusId = user?.assignedBus?._id || user?.assignedBus;
  const [displayedBusId, setDisplayedBusId] = useState(assignedBusId || null);
  const [selectedRouteLocal, setSelectedRouteLocal] = useState(null);
  const [showBusModal, setShowBusModal] = useState(false);
  const [showRouteModal, setShowRouteModal] = useState(false);

  const fetchBusAndTrip = async () => {
    const busIdToUse = displayedBusId || assignedBusId;
    if (!busIdToUse) { setLoading(false); return; }
    try {
      const [tripRes, busRes] = await Promise.all([
        tripAPI.getTripByBus(busIdToUse),
        busAPI.getOne(busIdToUse),
      ]);
      const trip = tripRes.data.data.trip;
      setActiveTrip(trip);
      setBusInfo(busRes.data.data.bus);
      setBusLocation(trip?.currentLocation || busRes.data.data.bus?.currentLocation || null);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchBusAndTrip(); }, [assignedBusId, displayedBusId]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => setCurrentLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      () => setCurrentLocation(null),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  useEffect(() => {
    if (!currentLocation || !busLocation?.latitude || !busLocation?.longitude) {
      setDistanceToBus(null);
      return;
    }

    const toRad = (value) => (value * Math.PI) / 180;
    const earthRadiusKm = 6371;
    const dLat = toRad(busLocation.latitude - currentLocation.latitude);
    const dLon = toRad(busLocation.longitude - currentLocation.longitude);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(currentLocation.latitude)) * Math.cos(toRad(busLocation.latitude)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    setDistanceToBus(earthRadiusKm * c);
  }, [currentLocation, busLocation]);

  useEffect(() => {
    const fetchLists = async () => {
      try {
        setListsLoading(true);
        const [rRes, bRes] = await Promise.all([routeAPI.getAll(), busAPI.getAll()]);
        setRoutes(rRes.data.data.routes || rRes.data.data || []);
        setBuses(bRes.data.data.buses || bRes.data.data || []);
      } catch (err) { console.error('Failed to load routes/buses', err); }
      finally { setListsLoading(false); }
    };
    fetchLists();
  }, []);

  useEffect(() => {
    const busIdToUse = displayedBusId || assignedBusId;
    if (!socket || !busIdToUse) return;

    const handleLocation = (data) => {
      if (data.busId?.toString() === busIdToUse?.toString()) {
        const nextLocation = {
          latitude: data.latitude,
          longitude: data.longitude,
          updatedAt: data.updatedAt || new Date().toISOString(),
        };
        setBusLocation(nextLocation);
        if (activeTrip?.route?.estimatedDuration) setEta(`${activeTrip.route.estimatedDuration} min`);
      }
    };
    const handleTripStarted = () => fetchBusAndTrip();
    const handleTripEnded = () => { setActiveTrip(null); setBusLocation(null); setEta(null); };

    socket.on('location_update', handleLocation);
    socket.on('trip_started', handleTripStarted);
    socket.on('trip_ended', handleTripEnded);

    // A socket instance is created before it is connected. Subscribe both now
    // (when already connected) and after every reconnect so the student always
    // receives updates for the selected bus.
    const subscribeToBus = () => trackBus(busIdToUse);
    socket.on('connect', subscribeToBus);
    if (connected) subscribeToBus();

    return () => {
      socket.off('location_update', handleLocation);
      socket.off('trip_started', handleTripStarted);
      socket.off('trip_ended', handleTripEnded);
      socket.off('connect', subscribeToBus);
    };
  }, [socket, connected, assignedBusId, displayedBusId, activeTrip, trackBus]);

  if (loading) return <LoadingSpinner text="Loading your bus info..." />;

  const route = selectedRouteLocal || activeTrip?.route || busInfo?.assignedRoute;
  const driver = activeTrip?.driver;
  const arrivalLabel = eta || (activeTrip && route?.estimatedDuration ? `${route.estimatedDuration} min` : activeTrip ? 'Calculating' : '-');
  const distanceLabel = distanceToBus !== null ? `${distanceToBus.toFixed(1)} km away` : (activeTrip ? 'Locating...' : 'Not available');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Bus Tracker</h1>
          <p className="page-subtitle">Hello, {user.name}</p>
          <p className="text-sm text-slate-500">Department: {user.department || '-'}</p>
        </div>
        {activeTrip && (
          <span className="badge badge-green text-sm px-3 py-1.5">
            <span className="status-dot bg-emerald-500" /> Bus is on the way
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="stat-icon bg-primary-100 text-primary-600"><UserIcon size={20} /></div>
          <div>
            <p className="text-xs text-slate-500">Student</p>
            <p className="font-bold text-slate-900">{user?.name || '-'}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-amber-100 text-amber-600"><BusIcon size={20} /></div>
          <div>
            <p className="text-xs text-slate-500">Assigned Bus</p>
            <p className="font-bold text-slate-900">{busInfo?.busNumber || 'Not assigned'}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-blue-100 text-blue-600"><RouteIcon size={20} /></div>
          <div>
            <p className="text-xs text-slate-500">Bus Route</p>
            <p className="font-bold text-slate-900 text-sm">{route?.routeName || 'Not assigned'}</p>
          </div>
        </div>
        <Link to="/student/notifications" className="stat-card hover:ring-2 hover:ring-primary-100 transition-shadow">
          <div className="stat-icon bg-purple-100 text-purple-600"><BellIcon size={20} /></div>
          <div>
            <p className="text-xs text-slate-500">Notifications</p>
            <p className="font-bold text-slate-900">{unreadCount ? `${unreadCount} unread` : 'All caught up'}</p>
          </div>
        </Link>
      </div>

      {!assignedBusId ? (
        <div className="card p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
            <BusIcon size={22} />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No Bus Assigned</h3>
          <p className="text-slate-500 text-sm">Contact your administrator to get assigned to a bus route.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
            <div className="stat-card">
              <div className="stat-icon bg-amber-100 text-amber-600"><BusIcon size={20} /></div>
              <div>
                <p className="text-xs text-slate-500">Bus Number</p>
                <p className="font-bold text-slate-900 cursor-pointer" onClick={() => setShowBusModal(true)}>{busInfo?.busNumber || '-'}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon bg-blue-100 text-blue-600"><RouteIcon size={20} /></div>
              <div>
                <p className="text-xs text-slate-500">Route</p>
                <p className="font-bold text-slate-900 text-sm cursor-pointer" onClick={() => setShowRouteModal(true)}>{route?.routeName || '-'}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className={`stat-icon ${activeTrip ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                <ActivityIcon size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-500">Bus Status</p>
                <p className={`font-bold ${activeTrip ? 'text-emerald-600' : 'text-slate-500'}`}>{activeTrip ? 'On the Way' : 'Not Started'}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon bg-purple-100 text-purple-600"><ClockIcon size={20} /></div>
              <div>
                <p className="text-xs text-slate-500">Est. Arrival</p>
                <p className="font-bold text-slate-900">{arrivalLabel}</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon bg-rose-100 text-rose-600"><MapPinIcon size={20} /></div>
              <div>
                <p className="text-xs text-slate-500">Distance to Bus</p>
                <p className="font-bold text-slate-900">{distanceLabel}</p>
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-bold text-slate-900">Live Bus Location</h2>
              {busLocation && (
                <span className="text-xs text-slate-500">
                  Updated {busLocation.updatedAt ? new Date(busLocation.updatedAt).toLocaleTimeString() : '-'}
                </span>
              )}
            </div>
            {!activeTrip && !busLocation ? (
              <div className="h-[300px] bg-slate-50 rounded-xl flex items-center justify-center flex-col gap-3">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-slate-400 shadow-sm">
                  <BusIcon size={22} />
                </div>
                <p className="text-slate-500 text-sm">Bus has not started yet</p>
                <p className="text-xs text-slate-400">The map will update automatically when the trip starts</p>
              </div>
            ) : (
              <LiveMap
                busLocation={busLocation}
                route={route}
                height="360px"
                autoPan={true}
                showRoute={!!route}
                center={busLocation
                  ? [busLocation.latitude, busLocation.longitude]
                  : route?.source
                  ? [route.source.latitude, route.source.longitude]
                  : [20.5937, 78.9629]}
              />
            )}
          </div>

          {activeTrip && (
            <div className="card p-5">
              <h2 className="font-display font-bold text-slate-900 mb-4">Trip Information</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">Trip Type</p>
                  <p className="font-semibold capitalize">{activeTrip.tripType}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">Started At</p>
                  <p className="font-semibold">{activeTrip.startTime ? new Date(activeTrip.startTime).toLocaleTimeString() : '-'}</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-500 mb-1">Driver</p>
                  <p className="font-semibold">{driver?.name || '-'}</p>
                </div>
                {driver?.phone && (
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-xs text-slate-500 mb-1">Driver Phone</p>
                    <a href={`tel:${driver.phone}`} className="font-semibold text-primary-600 hover:underline inline-flex items-center gap-1">
                      <PhoneIcon size={13} /> {driver.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Routes and Buses lists */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card p-5">
              <h2 className="font-display font-bold text-slate-900 mb-3">Available Routes</h2>
              {listsLoading ? (
                <p className="text-sm text-slate-500">Loading routes...</p>
              ) : routes.length === 0 ? (
                <p className="text-sm text-slate-500">No routes available.</p>
              ) : (
                <ul className="space-y-2">
                  {routes.map((r) => (
                    <li key={r._id} className="p-3 rounded-lg bg-slate-50">
                      <p className="font-semibold text-slate-800">{r.routeName}</p>
                      <p className="text-xs text-slate-500">{r.source?.name || 'N/A'} → {r.destination?.name || 'N/A'}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card p-5">
              <h2 className="font-display font-bold text-slate-900 mb-3">Buses</h2>
              {listsLoading ? (
                <p className="text-sm text-slate-500">Loading buses...</p>
              ) : buses.length === 0 ? (
                <p className="text-sm text-slate-500">No buses found.</p>
              ) : (
                <ul className="space-y-2">
                  {buses.map((b) => (
                    <li key={b._id} className="p-3 rounded-lg bg-slate-50 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-800">{b.busNumber}</p>
                        <p className="text-xs text-slate-500">Status: {b.status || 'unknown'}</p>
                      </div>
                      <div className="text-sm text-slate-500">Route: {b.assignedRoute?.routeName || '-'}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Bus selection modal */}
          <Modal isOpen={showBusModal} onClose={() => setShowBusModal(false)} title="Select a Bus" size="md">
            {listsLoading ? (
              <p className="text-sm text-slate-500">Loading buses...</p>
            ) : buses.length === 0 ? (
              <p className="text-sm text-slate-500">No buses found.</p>
            ) : (
              <ul className="space-y-2">
                {buses.map((b) => (
                  <li key={b._id} className="p-3 rounded-lg bg-slate-50 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">{b.busNumber}</p>
                      <p className="text-xs text-slate-500">Route: {b.assignedRoute?.routeName || '-'}</p>
                    </div>
                    <button
                      onClick={() => { setDisplayedBusId(b._id); setShowBusModal(false); setSelectedRouteLocal(null); }}
                      className="btn btn-sm btn-primary"
                    >
                      View
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Modal>

          {/* Route selection modal */}
          <Modal isOpen={showRouteModal} onClose={() => setShowRouteModal(false)} title="Select a Route" size="md">
            {listsLoading ? (
              <p className="text-sm text-slate-500">Loading routes...</p>
            ) : routes.length === 0 ? (
              <p className="text-sm text-slate-500">No routes available.</p>
            ) : (
              <ul className="space-y-2">
                {routes.map((r) => (
                  <li key={r._id} className="p-3 rounded-lg bg-slate-50 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">{r.routeName}</p>
                      <p className="text-xs text-slate-500">{r.source?.name || 'N/A'} → {r.destination?.name || 'N/A'}</p>
                    </div>
                    <button
                      onClick={() => { setSelectedRouteLocal(r); setShowRouteModal(false); }}
                      className="btn btn-sm btn-primary"
                    >
                      Select
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Modal>

          {route?.stops?.length > 0 && (
            <div className="card p-5">
              <h2 className="font-display font-bold text-slate-900 mb-4">Route Stops</h2>
              <div className="relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-100" />
                <div className="space-y-3">
                  <div className="flex items-center gap-4 relative">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-bold z-10">A</div>
                    <div>
                      <p className="font-semibold text-slate-800">{route.source?.name}</p>
                      <p className="text-xs text-slate-500">Start</p>
                    </div>
                  </div>
                  {route.stops.sort((a, b) => a.order - b.order).map((stop, i) => (
                    <div key={i} className="flex items-center gap-4 relative">
                      <div className="w-8 h-8 bg-blue-100 border-2 border-blue-300 rounded-full flex items-center justify-center text-blue-700 text-xs font-bold z-10">{stop.order}</div>
                      <div>
                        <p className="font-medium text-slate-700">{stop.name}</p>
                        {stop.estimatedTime && <p className="text-xs text-slate-400">ETA {stop.estimatedTime}</p>}
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-4 relative">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold z-10">B</div>
                    <div>
                      <p className="font-semibold text-slate-800">{route.destination?.name}</p>
                      <p className="text-xs text-slate-500">Destination</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-slate-900">Recent Notifications</h2>
          <Link to="/student/notifications" className="text-sm font-medium text-primary-600 hover:text-primary-700">View all</Link>
        </div>
        {notifications.length === 0 ? (
          <p className="text-sm text-slate-500">No notifications yet. Bus updates and alerts will appear here.</p>
        ) : (
          <div className="space-y-3">
            {notifications.slice(0, 3).map((notification) => (
              <div key={notification._id} className="flex items-start gap-3 rounded-lg bg-slate-50 p-3">
                <BellIcon size={18} className="mt-0.5 shrink-0 text-primary-600" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{notification.title}</p>
                  <p className="text-sm text-slate-500 truncate">{notification.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
