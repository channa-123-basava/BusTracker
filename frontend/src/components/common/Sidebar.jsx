import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useSocket } from '../../context/SocketContext';
// theme toggle removed
import {
  MenuIcon, CloseIcon, BellIcon, LogoutIcon,
  WifiIcon, WifiOffIcon
} from './Icons';

const Sidebar = ({ links, role }) => {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { connected } = useSocket();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const roleStyles = {
    admin:   { bg: 'bg-purple-600',  ring: 'ring-purple-200',  label: 'Administrator' },
    driver:  { bg: 'bg-emerald-600', ring: 'ring-emerald-200', label: 'Driver' },
    student: { bg: 'bg-primary-600', ring: 'ring-primary-200', label: 'Student' },
  };
  const rs = roleStyles[role] || roleStyles.student;

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Mobile top bar */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-100 px-4 h-14 flex items-center justify-between shadow-sm">
        <button onClick={() => setOpen(true)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600">
          <MenuIcon size={20} />
        </button>
        <span className="font-display font-bold text-slate-900 text-sm tracking-tight">College Bus Tracker</span>
        <NavLink to={`/${role}/notifications`} className="relative p-1.5 rounded-lg hover:bg-slate-100 text-slate-600">
          <BellIcon size={20} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center font-bold leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </NavLink>
      </header>

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full z-40 w-64 bg-white border-r border-slate-100 flex flex-col
        transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:z-auto`}>

        {/* Logo */}
        <div className="h-16 flex items-center px-5 border-b border-slate-100 gap-3">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 6v6m0 0H3l-1 4v2h1.5M8 12h8m0-6v6m0 0h5l1 4v2h-1.5M8 18a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0m5 0a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0M3 6h18a1 1 0 0 1 1 1v5H2V7a1 1 0 0 1 1-1z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="font-display font-bold text-slate-900 text-sm leading-tight truncate">College Bus Tracker</p>
            <p className="text-xs text-slate-400">Transport Management</p>
          </div>
          <button onClick={() => setOpen(false)} className="ml-auto lg:hidden p-1 rounded hover:bg-slate-100 text-slate-500">
            <CloseIcon size={16} />
          </button>
        </div>

        {/* User info */}
        <div className="px-4 py-4 border-b border-slate-50">
          <div className="flex items-center gap-3 px-2">
            <div className={`w-9 h-9 ${rs.bg} ring-2 ${rs.ring} rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0`}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate">{rs.label}</p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => isActive ? 'sidebar-link-active' : 'sidebar-link'}
              onClick={() => setOpen(false)}
            >
              <span className="w-5 h-5 flex-shrink-0 text-current">{link.icon}</span>
              <span>{link.label}</span>
              {link.label === 'Notifications' && unreadCount > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold min-w-[20px] text-center leading-tight">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-slate-100 space-y-1">
          {/* theme toggle removed */}
          <div className="flex items-center gap-2 px-3 py-2">
            {connected
              ? <WifiIcon size={14} className="text-emerald-500" />
              : <WifiOffIcon size={14} className="text-red-400" />}
            <span className={`text-xs ${connected ? 'text-emerald-600' : 'text-red-500'}`}>
              {connected ? 'Live — Connected' : 'Disconnected'}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogoutIcon size={16} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
