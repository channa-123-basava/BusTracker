import { useNotifications } from '../../context/NotificationContext';
import EmptyState from '../../components/common/EmptyState';
import {
  BellIcon,
  TripIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
} from '../../components/common/Icons';
import { formatDistanceToNow } from 'date-fns';

const typeIcon = {
  trip_started: <TripIcon size={16} />,
  trip_ended: <CheckCircleIcon size={16} />,
  bus_delayed: <AlertTriangleIcon size={16} />,
  bus_arriving_soon: <BellIcon size={16} />,
  bus_arrived: <CheckCircleIcon size={16} />,
  general: <BellIcon size={16} />,
  alert: <AlertTriangleIcon size={16} />,
};

const typeBg = {
  trip_started: 'bg-emerald-50 text-emerald-600',
  trip_ended: 'bg-slate-100 text-slate-500',
  bus_delayed: 'bg-amber-50 text-amber-600',
  bus_arriving_soon: 'bg-blue-50 text-blue-600',
  bus_arrived: 'bg-emerald-50 text-emerald-600',
  general: 'bg-slate-100 text-slate-500',
  alert: 'bg-red-50 text-red-600',
};

const StudentNotifications = () => {
  const {
    notifications,
    markRead,
    markAllRead,
    unreadCount,
  } = useNotifications();

  const user = JSON.parse(localStorage.getItem('cbt_user') || '{}');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">
            {unreadCount > 0
              ? `${unreadCount} unread notification${
                  unreadCount > 1 ? 's' : ''
                }`
              : 'All caught up'}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="btn-secondary text-sm"
          >
            Mark All Read
          </button>
        )}
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<BellIcon size={24} />}
              title="No notifications yet"
              description="Bus updates and alerts will appear here."
            />
          </div>
        ) : (
          notifications.map((notification) => {
            const isRead = notification.readBy?.includes(user?._id);

            return (
              <div
                key={notification._id}
                onClick={() => {
                  if (!isRead) {
                    markRead(notification._id);
                  }
                }}
                className={`card px-5 py-4 flex items-start gap-4 cursor-pointer hover:shadow-card-hover transition-all ${
                  !isRead
                    ? 'border-l-4 border-l-primary-500'
                    : ''
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    typeBg[notification.type] ||
                    'bg-slate-100 text-slate-500'
                  }`}
                >
                  {typeIcon[notification.type] || (
                    <BellIcon size={18} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-sm font-semibold ${
                        !isRead
                          ? 'text-slate-900'
                          : 'text-slate-700'
                      }`}
                    >
                      {notification.title}
                    </p>

                    {!isRead && (
                      <span className="w-2.5 h-2.5 bg-primary-500 rounded-full flex-shrink-0 mt-1"></span>
                    )}
                  </div>

                  <p className="text-sm text-slate-500 mt-1">
                    {notification.message}
                  </p>

                  <p className="text-xs text-slate-400 mt-2">
                    {formatDistanceToNow(
                      new Date(notification.createdAt),
                      {
                        addSuffix: true,
                      }
                    )}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default StudentNotifications;