import React from 'react';
import { Users, LogOut, Circle } from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ user, users, onLogout }) => {
  const formatLastSeen = (lastSeen) => {
    if (!lastSeen) return 'Never';
    
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffInMinutes = Math.floor((now - lastSeenDate) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <div className="chat-sidebar">
      <div className="sidebar-header">
        <div className="user-info">
          <div className="user-avatar">
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div className="user-details">
            <h3>{user?.username}</h3>
            <span className="online-status online">Online</span>
          </div>
        </div>
        <button className="logout-btn" onClick={onLogout}>
          <LogOut size={20} />
        </button>
      </div>

      <div className="sidebar-content">
        <div className="users-header">
          <Users size={20} />
          <h4>Online Users ({users.filter(u => u.isOnline).length})</h4>
        </div>
        
        <div className="users-list">
          {users.length === 0 ? (
            <div className="no-users">
              <p>No other users online</p>
            </div>
          ) : (
            users.map((userItem) => (
              <div key={userItem._id} className="user-item">
                <div className="user-avatar small">
                  {userItem.username.charAt(0).toUpperCase()}
                </div>
                <div className="user-info">
                  <span className="username">{userItem.username}</span>
                  <span className={`status ${userItem.isOnline ? 'online' : 'offline'}`}>
                    <Circle size={8} />
                    {userItem.isOnline ? 'Online' : `Last seen ${formatLastSeen(userItem.lastSeen)}`}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 