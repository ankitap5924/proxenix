import React, { useState, useEffect, useRef } from 'react';
import { Send, Smile } from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';
import Message from './Message';
import './MessageArea.css';

const MessageArea = ({ user, messages }) => {
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const { sendMessage, sendTypingStatus, typingUsers } = useSocket();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessage(newMessage.trim());
      setNewMessage('');
      sendTypingStatus(false);
      setIsTyping(false);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    if (!isTyping && e.target.value) {
      setIsTyping(true);
      sendTypingStatus(true);
    } else if (isTyping && !e.target.value) {
      setIsTyping(false);
      sendTypingStatus(false);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="message-area">
      {/* Header */}
      <div className="message-header">
        <h2>Group Chat</h2>
        <div className="typing-indicator">
          {typingUsers.length > 0 && (
            <span className="typing-text">
              {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="no-messages">
            <Smile size={48} />
            <h3>No messages yet</h3>
            <p>Start the conversation by sending a message!</p>
          </div>
        ) : (
          messages.map((message) => (
            <Message
              key={message._id}
              message={message}
              isOwn={message.sender._id === user.id}
              formatTime={formatTime}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSubmit} className="message-input-container">
        <div className="message-input-wrapper">
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            placeholder="Type a message..."
            className="message-input"
            maxLength={500}
          />
          <button type="submit" className="send-button" disabled={!newMessage.trim()}>
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default MessageArea; 