import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import axios from 'axios';
import Sidebar from './Sidebar';
import MessageArea from './MessageArea';
import './Chat.css';

const Chat = () => {
  const { user, logout } = useAuth();
  const { messages, setMessages, users, setUsers } = useSocket();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Fetch messages
        const messagesResponse = await axios.get('/api/messages');
        setMessages(messagesResponse.data);

        // Fetch users
        const usersResponse = await axios.get('/api/users');
        setUsers(usersResponse.data);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [setMessages, setUsers]);

  if (loading) {
    return (
      <div className="chat-loading">
        <div className="loading-spinner"></div>
        <p>Loading chat...</p>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <Sidebar user={user} users={users} onLogout={logout} />
      <MessageArea user={user} messages={messages} />
    </div>
  );
};

export default Chat; 