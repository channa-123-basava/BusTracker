import { useState, useEffect, useRef } from 'react';
import { busAPI, routeAPI, tripAPI } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import LiveMap from '../../components/common/LiveMap';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  BusIcon, RouteIcon, PlayIcon, StopIcon, SpinnerIcon,
  WifiIcon, WifiOffIcon, MapPinIcon, ActivityIcon
} from '../../components/common/Icons';
import toast from 'react-hot-toast';

const DriverDashboard = () => {
  const { user, updateUser } = useAuth();
  const { socket, sendLocationUpdate, connected } = useSocket();
  const [activeTrip, setActiveTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [currentPos, setCurrentPos] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [driverBuses, setDriverBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showBusList, setShowBusList] = useState(false);
  const [showRouteList, setShowRouteList] = useState(false);
  const [tripType, setTripType] = useState('morning');
  const watchIdRef = useRef(null);
  const intervalRef = useRef(null);
  const currentPosRef = useRef(null);
  const tripIdRef = useRef(null);

  const fetchMyTrip = async () => {
    try {
      const res = await tripAPI.getMyTrip();
      setActiveTrip(res.data.data.trip);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const fetchDriverData = async () => {
    try {
      const [busRes, routeRes] = await Promise.all([busAPI.getDriverBuses(), routeAPI.getAll()]);
      const buses = busRes.data.data.buses || [];
      setDriverBuses(buses);
      setRoutes(routeRes.data.data.routes || []);

      // The user object saved at login does not include the bus status.
      // Use the freshly fetched assigned bus so status changes made by an
      // admin are reflected on the driver dashboard.
      if (buses.length) {
        setSelectedBus((current) => current || buses[0]);
        setSelectedRoute((current) => current || buses[0].assignedRoute || null);
      }
    } catch (err) {
      console.error('Failed to fetch driver data:', err);
    }
  };

  useEffect(() => {
    fetchMyTrip();
    fetchDriverData();
    return () => stopTracking();
  }, []);

  useEffect(() => {
    if (!activeTrip?._id || tracking) return;

    const busId = activeTrip?.bus?._id || (typeof user?.assignedBus === 'string' ? user.assignedBus : user?.assignedBus?._id);
    startTracking(activeTrip._id, busId);
  }, [activeTrip?._id, user?.assignedBus, tracking]);

  const getCurrentPosition = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('Geolocation not supported')); return; }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true, timeout: 10000, maximumAge: 0,
    });
  });

  const startTracking = (tripId, busId) => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported on this device'); return; }
    if (watchIdRef.current !== null) return;

    tripIdRef.current = tripId;
    setTracking(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed } = pos.coords;
        const nextLocation = { latitude, longitude, speed: speed || 0, updatedAt: new Date() };
        currentPosRef.current = nextLocation;
        setCurrentPos(nextLocation);
        sendLocationUpdate({ tripId, busId, latitude, longitude, speed: speed || 0 });
      },
      (err) => {
        console.error('GPS error:', err);
        toast.error('GPS signal lost. Retrying...');
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );

    intervalRef.current = setInterval(async () => {
      const latestLocation = currentPosRef.current;
      if (!latestLocation || !tripIdRef.current) return;
      try {
        await tripAPI.updateLocation(tripIdRef.current, {
          latitude: latestLocation.latitude,
          longitude: latestLocation.longitude,
          speed: latestLocation.speed || 0,
        });
      } catch (err) {
        console.error('Location REST update failed:', err);
      }
    }, 15000);
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    currentPosRef.current = null;
    tripIdRef.current = null;
    setTracking(false);
  };

  const handleEnableGPS = async () => {
    try {
      const pos = await getCurrentPosition();
      const { latitude, longitude, speed } = pos.coords;
      const initialLocation = { latitude, longitude, speed: speed || 0, updatedAt: new Date() };
      currentPosRef.current = initialLocation;
      setCurrentPos(initialLocation);
      setGpsEnabled(true);
      toast.success('GPS enabled. You can now start the trip.');
    } catch (err) {
      if (err.code === 1) toast.error('Location permission denied. Please enable GPS.');
      else toast.error('Unable to access GPS.');
    }
  };
  
  const handleSelectBus = (bus) => {
    setSelectedBus(bus);
    setSelectedRoute(bus.assignedRoute || null);
    setShowBusList(false);
    toast.success(`Selected bus ${bus.busNumber}`);
  };

  const handleSelectRoute = (route) => {
    setSelectedRoute(route);
    setShowRouteList(false);
    toast.success(`Selected route ${route.routeName}`);
  };

  const handleStartTrip = async () => {
    if (!selectedBus) {
      toast.error('Please select your bus first.');
      return;
    }
    if (!selectedRoute) {
      toast.error('Please select your route first.');
      return;
    }
    if (!gpsEnabled) {
      toast.error('Please enable GPS before starting the trip.');
      return;
    }
    setStarting(true);
    try {
      const pos = await getCurrentPosition();
      const { latitude, longitude, speed } = pos.coords;
      const initialLocation = { latitude, longitude, speed: speed || 0, updatedAt: new Date() };
      currentPosRef.current = initialLocation;
      setCurrentPos(initialLocation);
      const res = await tripAPI.startTrip({ tripType, latitude, longitude });
      const trip = res.data.data.trip;
      setActiveTrip(trip);
      updateUser({ ...user, isOnTrip: true });
      toast.success('Trip started. Students will see your live bus location.');
      startTracking(trip._id, trip.bus?._id || (typeof user.assignedBus === 'string' ? user.assignedBus : user.assignedBus?._id));
    } catch (err) {
      if (err.code === 1) toast.error('Location permission denied. Please enable GPS.');
      else toast.error(err.response?.data?.message || 'Failed to start trip');
    } finally { setStarting(false); }
  };

  const handleEndTrip = async () => {
    if (!activeTrip) return;
    setEnding(true);
    try {
      await tripAPI.endTrip(activeTrip._id);
      stopTracking();
      setActiveTrip(null);
      updateUser({ ...user, isOnTrip: false });
      setCurrentPos(null);
      toast.success('Trip ended successfully');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to end trip'); }
    finally { setEnding(false); }
  };

  if (loading) return <LoadingSpinner text="Loading your dashboard..." />;

  const bus = activeTrip?.bus || selectedBus || user.assignedBus || null;
  const route = activeTrip?.route || selectedRoute || bus?.assignedRoute || null;
  const isTripActive = Boolean(activeTrip || user?.isOnTrip);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Driver Dashboard</h1>
          <p className="page-subtitle">Welcome, {user.name}</p>
        </div>
        <div className="flex items-center gap-2">
          {connected ? <WifiIcon size={15} className="text-emerald-500" /> : <WifiOffIcon size={15} className="text-red-400" />}
          <span className="text-sm text-slate-500">{connected ? 'Connected' : 'Offline'}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="stat-card">
          <div className="stat-icon bg-amber-100 text-amber-600"><BusIcon size={20} /></div>
          <div>
            <p className="text-sm text-slate-500">My Bus</p>
            <p className="font-bold text-slate-900">{user.assignedBus?.busNumber || bus?.busNumber || '-'}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon bg-blue-100 text-blue-600"><RouteIcon size={20} /></div>
          <div>
            <p className="text-sm text-slate-500">Route</p>
            <p className="font-bold text-slate-900 text-sm">{route?.routeName || user.assignedBus?.assignedRoute?.routeName || 'No route'}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className={`stat-icon ${isTripActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
            <ActivityIcon size={20} />
          </div>
          <div>
            <p className="text-sm text-slate-500">Status</p>
            <p className={`font-bold ${isTripActive ? 'text-emerald-600' : 'text-slate-500'}`}>{isTripActive ? 'On Trip' : 'Idle'}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className={`stat-icon ${tracking ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
            <MapPinIcon size={20} />
          </div>
          <div>
            <p className="text-sm text-slate-500">GPS</p>
            <p className={`font-bold text-sm ${tracking ? 'text-green-600' : 'text-slate-500'}`}>{tracking ? 'Broadcasting' : 'Not active'}</p>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-display font-bold text-slate-900 mb-4">Trip Control</h2>
        {!activeTrip ? (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 space-y-4">
              <div>
                <p className="text-sm font-medium text-slate-700 mb-3">Select Trip Type</p>
                <div className="flex gap-3">
                  {[
                    { value: 'morning', label: 'Morning', sub: 'Home to College' },
                    { value: 'evening', label: 'Evening', sub: 'College to Home' },
                    { value: 'special', label: 'Special', sub: 'Other trip' },
                  ].map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setTripType(t.value)}
                      className={`flex-1 rounded-xl p-3 text-center border-2 transition-all ${tripType === t.value ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
                    >
                      <p className="font-semibold text-sm">{t.label}</p>
                      <p className="text-xs mt-0.5 opacity-70">{t.sub}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
                  <p className="text-slate-500">Assigned Bus</p>
                  <button type="button" onClick={() => setShowBusList(!showBusList)} className="w-full text-left font-semibold text-slate-900 mt-1">
                    {selectedBus?.busNumber || bus?.busNumber || 'Select your bus'}
                  </button>
                  {showBusList && (
                    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      {driverBuses.length ? driverBuses.map((dBus) => (
                        <button
                          key={dBus._id}
                          type="button"
                          onClick={() => handleSelectBus(dBus)}
                          className="block w-full text-left rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                        >
                          {dBus.busNumber} - {dBus.assignedRoute?.routeName || 'No route'}
                        </button>
                      )) : <p className="text-xs text-slate-500">No buses assigned.</p>}
                    </div>
                  )}
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
                  <p className="text-slate-500">Assigned Route</p>
                  <button type="button" onClick={() => setShowRouteList(!showRouteList)} className="w-full text-left font-semibold text-slate-900 mt-1">
                    {selectedRoute?.routeName || route?.routeName || user.assignedBus?.assignedRoute?.routeName || 'Select your route'}
                  </button>
                  {showRouteList && (
                    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      {routes.length ? routes.map((r) => (
                        <button
                          key={r._id}
                          type="button"
                          onClick={() => handleSelectRoute(r)}
                          className="block w-full text-left rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
                        >
                          {r.routeName}
                        </button>
                      )) : <p className="text-xs text-slate-500">No routes available.</p>}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
                  <p className="text-slate-500">Bus Status</p>
                  <p className="font-semibold text-slate-900 mt-1">{bus?.status ? bus.status.charAt(0).toUpperCase() + bus.status.slice(1) : 'Unknown'}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
                  <p className="text-slate-500">GPS</p>
                  <p className={`font-semibold mt-1 ${gpsEnabled ? 'text-green-600' : 'text-slate-500'}`}>{gpsEnabled ? 'Enabled' : 'Disabled'}</p>
                </div>
              </div>
            </div>
            <button onClick={handleEnableGPS} disabled={gpsEnabled || starting} className="btn-secondary w-full py-3.5 text-sm">
              {gpsEnabled ? 'GPS Enabled' : 'Enable GPS'}
            </button>
            <button
              onClick={handleStartTrip}
              disabled={starting || !connected || !gpsEnabled || bus?.status !== 'active'}
              className="btn-success w-full py-3.5 text-sm"
            >
              {starting ? (<><SpinnerIcon size={16} className="animate-spin" /> Getting GPS location...</>) : (<><PlayIcon size={16} /> Start Trip</>)}
            </button>
            {!connected && <p className="text-xs text-center text-red-500">Connect to the internet to start a trip</p>}
            {bus?.status !== 'active' && <p className="text-xs text-center text-red-500">Your bus must be active to start the trip.</p>}
            <p className="text-xs text-center text-slate-500">Your phone’s browser location will be shared to students in real time once the trip begins.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-emerald-50 rounded-xl p-4 flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse flex-shrink-0" />
              <div>
                <p className="font-semibold text-emerald-800">Trip in Progress</p>
                <p className="text-sm text-emerald-600">
                  Started at {new Date(activeTrip.startTime).toLocaleTimeString()} - {activeTrip.tripType} trip
                </p>
              </div>
            </div>

            {currentPos && (
              <div className="bg-slate-50 rounded-xl p-3 text-xs font-mono text-slate-600">
                {currentPos.latitude?.toFixed(6)}, {currentPos.longitude?.toFixed(6)}
                {currentPos.updatedAt && (
                  <span className="ml-2 text-slate-400 font-sans">Updated {new Date(currentPos.updatedAt).toLocaleTimeString()}</span>
                )}
              </div>
            )}

            <button onClick={handleEndTrip} disabled={ending} className="btn-danger w-full py-3.5 text-sm">
              {ending ? (<><SpinnerIcon size={16} className="animate-spin" /> Ending trip...</>) : (<><StopIcon size={16} /> End Trip</>)}
            </button>
          </div>
        )}
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-bold text-slate-900">Live Map</h2>
          {tracking && <span className="badge badge-green"><span className="status-dot bg-emerald-500" />Broadcasting location</span>}
        </div>
        <LiveMap
          busLocation={currentPos}
          route={route}
          height="380px"
          autoPan={true}
          showRoute={!!route}
          center={currentPos ? [currentPos.latitude, currentPos.longitude] : [20.5937, 78.9629]}
        />
      </div>

      {route && (
        <div className="card p-5">
          <h2 className="font-display font-bold text-slate-900 mb-4">Route Details</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <span className="text-green-600 font-bold text-sm w-5 text-center">A</span>
              <div>
                <p className="text-xs text-slate-500">Source</p>
                <p className="font-medium text-slate-800">{route.source?.name}</p>
              </div>
            </div>
            {route.stops?.sort((a, b) => a.order - b.order).map((stop, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                <span className="text-slate-500 text-sm font-mono w-5 text-center">{stop.order}</span>
                <div className="flex-1">
                  <p className="font-medium text-slate-700">{stop.name}</p>
                  {stop.estimatedTime && <p className="text-xs text-slate-400">{stop.estimatedTime}</p>}
                </div>
              </div>
            ))}
            <div className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
              <span className="text-red-600 font-bold text-sm w-5 text-center">B</span>
              <div>
                <p className="text-xs text-slate-500">Destination</p>
                <p className="font-medium text-slate-800">{route.destination?.name}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverDashboard;
