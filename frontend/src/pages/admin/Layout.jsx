import { Outlet } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import { DashboardIcon, BusIcon, RouteIcon, StudentIcon, DriverIcon, TripIcon, BellIcon } from '../../components/common/Icons';

const adminLinks = [
  { to: '/admin', end: true, icon: <DashboardIcon size={18} />, label: 'Dashboard' },
  { to: '/admin/buses', icon: <BusIcon size={18} />, label: 'Buses' },
  { to: '/admin/routes', icon: <RouteIcon size={18} />, label: 'Routes' },
  { to: '/admin/students', icon: <StudentIcon size={18} />, label: 'Students' },
  { to: '/admin/drivers', icon: <DriverIcon size={18} />, label: 'Drivers' },
  { to: '/admin/trips', icon: <TripIcon size={18} />, label: 'Trips' },
  { to: '/admin/notifications', icon: <BellIcon size={18} />, label: 'Notifications' },
];

const AdminLayout = () => (
  <DashboardLayout sidebarLinks={adminLinks} role="admin">
    <Outlet />
  </DashboardLayout>
);

export default AdminLayout;
