import React from 'react';
import './Message.css';

const Message = ({ message, isOwn, formatTime }) => {
  return (
    <div className={`message ${isOwn ? 'own' : 'other'}`}>
      <div className="message-content">
        {!isOwn && (
          <div className="message-avatar">
            {message.sender.username.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="message-bubble">
          {!isOwn && (
            <div className="message-sender">{message.sender.username}</div>
          )}
          <div className="message-text">{message.content}</div>
          <div className="message-time">{formatTime(message.timestamp)}</div>
        </div>
      </div>
    </div>
  );
};

export default Message; 