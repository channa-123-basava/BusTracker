import { Outlet } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import { BusIcon, BellIcon, UserIcon } from '../../components/common/Icons';

const driverLinks = [
  { to: '/driver', end: true, icon: <BusIcon size={18} />, label: 'Dashboard' },
  { to: '/driver/notifications', icon: <BellIcon size={18} />, label: 'Notifications' },
  { to: '/driver/profile', icon: <UserIcon size={18} />, label: 'My Profile' },
];

const DriverLayout = () => (
  <DashboardLayout sidebarLinks={driverLinks} role="driver">
    <Outlet />
  </DashboardLayout>
);

export default DriverLayout;
