import { Outlet } from 'react-router-dom';
import DashboardLayout from '../../components/common/DashboardLayout';
import { RouteIcon, BellIcon, UserIcon } from '../../components/common/Icons';

const studentLinks = [
  { to: '/student', end: true, icon: <RouteIcon size={18} />, label: 'Track My Bus' },
  { to: '/student/notifications', icon: <BellIcon size={18} />, label: 'Notifications' },
  { to: '/student/profile', icon: <UserIcon size={18} />, label: 'My Profile' },
];

const StudentLayout = () => (
  <DashboardLayout sidebarLinks={studentLinks} role="student">
    <Outlet />
  </DashboardLayout>
);

export default StudentLayout;
