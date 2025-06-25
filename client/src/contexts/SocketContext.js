import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket = io('http://localhost:5000');
      setSocket(newSocket);

      // Join chat room
      newSocket.emit('join', { userId: user.id, username: user.username });

      // Listen for new messages
      newSocket.on('newMessage', (message) => {
        setMessages(prev => [...prev, message]);
      });

      // Listen for user online status
      newSocket.on('userOnline', (userData) => {
        setUsers(prev => {
          const existingUser = prev.find(u => u._id === userData.userId);
          if (existingUser) {
            return prev.map(u => 
              u._id === userData.userId ? { ...u, isOnline: true } : u
            );
          }
          return [...prev, { _id: userData.userId, username: userData.username, isOnline: true }];
        });
        toast.success(`${userData.username} is now online`);
      });

      // Listen for user offline status
      newSocket.on('userOffline', (userData) => {
        setUsers(prev => 
          prev.map(u => 
            u._id === userData.userId ? { ...u, isOnline: false } : u
          )
        );
        toast(`${userData.username} is now offline`, { icon: '👋' });
      });

      // Listen for online users list
      newSocket.on('onlineUsers', (onlineUsers) => {
        setUsers(prev => {
          const updatedUsers = prev.map(u => ({
            ...u,
            isOnline: onlineUsers.some(online => online.username === u.username)
          }));
          return updatedUsers;
        });
      });

      // Listen for typing indicators
      newSocket.on('userTyping', (data) => {
        if (data.isTyping) {
          setTypingUsers(prev => {
            if (!prev.includes(data.username)) {
              return [...prev, data.username];
            }
            return prev;
          });
        } else {
          setTypingUsers(prev => prev.filter(username => username !== data.username));
        }
      });

      return () => {
        newSocket.close();
      };
    }
  }, [isAuthenticated, user]);

  const sendMessage = (content) => {
    if (socket && user) {
      socket.emit('sendMessage', {
        senderId: user.id,
        content
      });
    }
  };

  const sendTypingStatus = (isTyping) => {
    if (socket && user) {
      socket.emit('typing', {
        username: user.username,
        isTyping
      });
    }
  };

  const value = {
    socket,
    messages,
    setMessages,
    users,
    setUsers,
    typingUsers,
    sendMessage,
    sendTypingStatus
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}; 