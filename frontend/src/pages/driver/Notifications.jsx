import { useNotifications } from '../../context/NotificationContext';
import EmptyState from '../../components/common/EmptyState';
import { BellIcon, TripIcon, AlertTriangleIcon, CheckCircleIcon } from '../../components/common/Icons';
import { formatDistanceToNow } from 'date-fns';

const typeIcon = {
  trip_started: <TripIcon size={16} />, trip_ended: <CheckCircleIcon size={16} />,
  bus_delayed: <AlertTriangleIcon size={16} />, bus_arrived: <CheckCircleIcon size={16} />,
  general: <BellIcon size={16} />, alert: <AlertTriangleIcon size={16} />,
};
const typeBg = {
  trip_started: 'bg-emerald-50 text-emerald-600', trip_ended: 'bg-slate-100 text-slate-500',
  bus_delayed: 'bg-amber-50 text-amber-600', bus_arrived: 'bg-emerald-50 text-emerald-600',
  general: 'bg-blue-50 text-blue-600', alert: 'bg-red-50 text-red-600',
};

const DriverNotifications = () => {
  const { notifications, markRead, markAllRead, unreadCount } = useNotifications();
  const user = JSON.parse(localStorage.getItem('cbt_user') || '{}');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && <button onClick={markAllRead} className="btn-secondary text-sm">Mark All Read</button>}
      </div>
      <div className="card divide-y divide-slate-50">
        {notifications.length === 0 ? (
          <EmptyState icon={<BellIcon size={22} />} title="No notifications" description="You'll be notified about trip updates here" />
        ) : notifications.map((n) => {
          const isRead = n.readBy?.includes(user?._id);
          return (
            <div
              key={n._id}
              className={`flex items-start gap-4 px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors ${!isRead ? 'bg-blue-50/40' : ''}`}
              onClick={() => !isRead && markRead(n._id)}
            >
              <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${typeBg[n.type] || 'bg-slate-100 text-slate-500'}`}>
                {typeIcon[n.type] || <BellIcon size={16} />}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-medium ${!isRead ? 'text-slate-900' : 'text-slate-600'}`}>{n.title}</p>
                  {!isRead && <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5" />}
                </div>
                <p className="text-sm text-slate-500 mt-0.5">{n.message}</p>
                <p className="text-xs text-slate-400 mt-1">{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DriverNotifications;
