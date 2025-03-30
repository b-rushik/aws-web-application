import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../hooks/useAuth';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Simulate fetching notifications
    if (user) {
      const mockNotifications = [
        { id: 1, message: 'Your paper has been approved', read: false, date: new Date() },
        { id: 2, message: 'New paper request assigned', read: false, date: new Date(Date.now() - 86400000) }
      ];
      setNotifications(mockNotifications);
    }
  }, [user]);

  const markAsRead = (id) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  };

  return (
    <div className="notifications">
      <h3>Notifications</h3>
      {notifications.length === 0 ? (
        <p>No new notifications</p>
      ) : (
        <ul>
          {notifications.map(notification => (
            <li 
              key={notification.id} 
              className={notification.read ? 'read' : 'unread'}
              onClick={() => markAsRead(notification.id)}
            >
              <span>{notification.message}</span>
              <small>{new Date(notification.date).toLocaleString()}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Notifications;