import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { busAPI, studentAPI, driverAPI, routeAPI, tripAPI } from '../../api/services';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import LiveMap from '../../components/common/LiveMap';
import { useSocket } from '../../context/SocketContext';
import { BusIcon, StudentIcon, DriverIcon, RouteIcon } from '../../components/common/Icons';

const StatCard = ({ icon, label, value, sub, color, to }) => (
  <Link to={to} className="stat-card hover:shadow-card-hover transition-all duration-200 group">
    <div className={`stat-icon ${color}`}>{icon}</div>
    <div>
      <p className="text-2xl font-display font-bold text-slate-900 group-hover:text-primary-700 transition-colors">{value}</p>
      <p className="text-sm font-medium text-slate-700">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </Link>
);

const AdminDashboard = () => {
  const { socket } = useSocket();
  const [stats, setStats] = useState({ buses: 0, students: 0, drivers: 0, routes: 0, activeTrips: 0 });
  const [activeBuses, setActiveBuses] = useState([]);
  const [recentTrips, setRecentTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [busRes, studentRes, driverRes, routeRes, tripRes, activeBusRes] = await Promise.all([
        busAPI.getAll(),
        studentAPI.getAll(),
        driverAPI.getAll(),
        routeAPI.getAll(),
        tripAPI.getAll({ status: 'ongoing' }),
        busAPI.getActive(),
      ]);
      setStats({
        buses: busRes.data.data.count,
        students: studentRes.data.data.count,
        drivers: driverRes.data.data.count,
        routes: routeRes.data.data.count,
        activeTrips: tripRes.data.data.count,
      });
      setActiveBuses(activeBusRes.data.data.buses);
      const allTrips = await tripAPI.getAll({});
      setRecentTrips(allTrips.data.data.trips.slice(0, 5));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (!socket) return;
    const handleLocation = (data) => {
      setActiveBuses((prev) =>
        prev.map((b) =>
          b._id === data.busId
            ? { ...b, currentLocation: { latitude: data.latitude, longitude: data.longitude, updatedAt: data.updatedAt } }
            : b
        )
      );
    };
    const refresh = () => fetchData();
    socket.on('location_update', handleLocation);
    socket.on('trip_started', refresh);
    socket.on('trip_ended', refresh);
    return () => {
      socket.off('location_update', handleLocation);
      socket.off('trip_started', refresh);
      socket.off('trip_ended', refresh);
    };
  }, [socket]);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  const statCards = [
    { icon: <BusIcon size={20} />, label: 'Total Buses', value: stats.buses, sub: `${stats.activeTrips} on trip`, color: 'bg-amber-100 text-amber-600', to: '/admin/buses' },
    { icon: <StudentIcon size={20} />, label: 'Students', value: stats.students, sub: 'Registered', color: 'bg-blue-100 text-blue-600', to: '/admin/students' },
    { icon: <DriverIcon size={20} />, label: 'Drivers', value: stats.drivers, sub: 'Active drivers', color: 'bg-emerald-100 text-emerald-600', to: '/admin/drivers' },
    { icon: <RouteIcon size={20} />, label: 'Routes', value: stats.routes, sub: 'Configured', color: 'bg-purple-100 text-purple-600', to: '/admin/routes' },
  ];

  const statusColor = { ongoing: 'badge-green', completed: 'badge-gray', cancelled: 'badge-red', scheduled: 'badge-yellow' };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Monitor your entire fleet in real time</p>
        </div>
        {stats.activeTrips > 0 && (
          <span className="badge badge-green">
            <span className="status-dot bg-emerald-500" />
            {stats.activeTrips} Active Trip{stats.activeTrips > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-display font-bold text-slate-900">Live Fleet Map</h2>
            <p className="text-sm text-slate-500">{activeBuses.length} bus{activeBuses.length !== 1 ? 'es' : ''} currently on trip</p>
          </div>
          {activeBuses.length === 0 && <span className="badge badge-gray">No active trips</span>}
        </div>
        <LiveMap buses={activeBuses} height="380px" zoom={12} />
      </div>

      <div className="card">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-display font-bold text-slate-900">Recent Trips</h2>
          <Link to="/admin/trips" className="text-xs text-primary-600 hover:text-primary-700 font-medium">View all</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="table-head">
              <tr>
                <th className="th">Bus</th>
                <th className="th">Route</th>
                <th className="th">Driver</th>
                <th className="th">Status</th>
                <th className="th">Start Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentTrips.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-400 text-sm">No trips recorded yet</td></tr>
              ) : recentTrips.map((trip) => (
                <tr key={trip._id} className="tr-hover">
                  <td className="td font-medium">{trip.bus?.busNumber || '-'}</td>
                  <td className="td text-slate-500">{trip.route?.routeName || '-'}</td>
                  <td className="td">{trip.driver?.name || '-'}</td>
                  <td className="td"><span className={statusColor[trip.status]}>{trip.status}</span></td>
                  <td className="td text-slate-500">{trip.startTime ? new Date(trip.startTime).toLocaleString() : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
