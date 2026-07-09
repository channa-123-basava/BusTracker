import { useState, useEffect } from 'react';
import { tripAPI } from '../../api/services';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import LiveMap from '../../components/common/LiveMap';
import { TripIcon } from '../../components/common/Icons';
import { useSocket } from '../../context/SocketContext';

const TripsPage = () => {
  const { socket } = useSocket();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [activeBusLocations, setActiveBusLocations] = useState({});

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const res = await tripAPI.getAll(params);
      setTrips(res.data.data.trips);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { fetchTrips(); }, [filter]);

  useEffect(() => {
    if (!socket) return;
    const handleLocation = (data) => {
      setActiveBusLocations((prev) => ({
        ...prev,
        [data.busId]: { latitude: data.latitude, longitude: data.longitude, updatedAt: data.updatedAt, busId: data.busId },
      }));
    };
    socket.on('location_update', handleLocation);
    socket.on('trip_started', fetchTrips);
    socket.on('trip_ended', fetchTrips);
    return () => {
      socket.off('location_update', handleLocation);
      socket.off('trip_started', fetchTrips);
      socket.off('trip_ended', fetchTrips);
    };
  }, [socket]);

  const statusColor = { ongoing: 'badge-green', completed: 'badge-gray', cancelled: 'badge-red', scheduled: 'badge-yellow' };

  const ongoingTrips = trips.filter((t) => t.status === 'ongoing');
  const activeBusesForMap = ongoingTrips.map((t) => ({
    _id: t.bus?._id,
    busNumber: t.bus?.busNumber,
    currentLocation: activeBusLocations[t.bus?._id] || t.currentLocation,
    assignedRoute: t.route,
    assignedDriver: t.driver,
  }));

  if (loading) return <LoadingSpinner text="Loading trips..." />;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Trip Monitoring</h1>
          <p className="page-subtitle">{ongoingTrips.length} active trip{ongoingTrips.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          {['all', 'ongoing', 'completed', 'cancelled'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium capitalize transition-all ${filter === f ? 'bg-primary-600 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {ongoingTrips.length > 0 && (
        <div className="card p-5">
          <h2 className="font-display font-bold text-slate-900 mb-3">Live Bus Positions</h2>
          <LiveMap buses={activeBusesForMap} height="320px" zoom={12} showRoute={false} />
        </div>
      )}

      <div className="table-wrapper">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-head">
              <tr>
                <th className="th">Bus</th>
                <th className="th">Route</th>
                <th className="th">Driver</th>
                <th className="th">Type</th>
                <th className="th">Status</th>
                <th className="th">Start</th>
                <th className="th">End</th>
                <th className="th">Duration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {trips.length === 0 ? (
                <tr><td colSpan={8}><EmptyState icon={<TripIcon size={22} />} title="No trips found" /></td></tr>
              ) : trips.map((trip) => {
                const duration = trip.startTime && trip.endTime
                  ? Math.round((new Date(trip.endTime) - new Date(trip.startTime)) / 60000)
                  : null;
                return (
                  <tr key={trip._id} className="tr-hover">
                    <td className="td font-semibold">{trip.bus?.busNumber || '-'}</td>
                    <td className="td text-slate-500 text-xs">{trip.route?.routeName || '-'}</td>
                    <td className="td">{trip.driver?.name || '-'}</td>
                    <td className="td capitalize"><span className="badge badge-blue">{trip.tripType}</span></td>
                    <td className="td">
                      <span className={statusColor[trip.status]}>
                        {trip.status === 'ongoing' && <span className="status-dot bg-emerald-500" />}
                        {trip.status}
                      </span>
                    </td>
                    <td className="td text-xs text-slate-500">{trip.startTime ? new Date(trip.startTime).toLocaleString() : '-'}</td>
                    <td className="td text-xs text-slate-500">{trip.endTime ? new Date(trip.endTime).toLocaleString() : '-'}</td>
                    <td className="td text-xs">{duration ? `${duration} min` : '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TripsPage;
