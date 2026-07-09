import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationAPI } from '../api/services';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await notificationAPI.getAll();
      const notifs = res.data.data.notifications;
      setNotifications(notifs);
      const unread = notifs.filter((n) => !n.readBy?.includes(user._id)).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time notifications via socket
  useEffect(() => {
    if (!socket) return;
    const handleNew = (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((c) => c + 1);
      toast(notification.message, {
        duration: 5000,
      });
    };
    socket.on('new_notification', handleNew);
    return () => socket.off('new_notification', handleNew);
  }, [socket]);

  const markRead = async (id) => {
    await notificationAPI.markRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, readBy: [...(n.readBy || []), user._id] } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await notificationAPI.markAllRead();
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, readBy: [...new Set([...(n.readBy || []), user._id])] }))
    );
    setUnreadCount(0);
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, fetchNotifications, markRead, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
