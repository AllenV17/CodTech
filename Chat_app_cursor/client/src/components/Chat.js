import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './Chat.css';

const Chat = ({ user, onLogout }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Join chat
    newSocket.emit('join', { userId: user.id });

    // Load previous messages
    fetchMessages();

    // Socket event listeners
    newSocket.on('newMessage', (message) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('userJoined', (data) => {
      setMessages(prev => [...prev, {
        content: data.message,
        sender: { username: 'System' },
        timestamp: new Date(),
        isSystem: true
      }]);
    });

    newSocket.on('userTyping', (data) => {
      if (data.username !== user.username) {
        setTypingUsers(prev => {
          if (!prev.includes(data.username)) {
            return [...prev, data.username];
          }
          return prev;
        });
      }
    });

    newSocket.on('userStopTyping', (data) => {
      setTypingUsers(prev => prev.filter(username => username !== data.username));
    });

    return () => {
      newSocket.close();
    };
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/messages', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() && socket) {
      socket.emit('sendMessage', {
        userId: user.id,
        message: newMessage.trim()
      });
      setNewMessage('');
      setIsTyping(false);
      socket.emit('stopTyping', { username: user.username });
    }
  };

  const handleTyping = () => {
    if (!isTyping && socket) {
      setIsTyping(true);
      socket.emit('typing', { username: user.username });
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket.emit('stopTyping', { username: user.username });
    }, 1000);
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="chat-title">
          <h2>Chat Room</h2>
          <span className="online-indicator">
            {onlineUsers.length} online
          </span>
        </div>
        <div className="user-info">
          <span className="username">{user.username}</span>
          <button onClick={onLogout} className="logout-button">
            Logout
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`message ${message.sender._id === user.id ? 'own' : ''} ${message.isSystem ? 'system' : ''}`}
          >
            {!message.isSystem && (
              <div className="message-header">
                <span className="sender-name">{message.sender.username}</span>
                <span className="message-time">{formatTime(message.timestamp)}</span>
              </div>
            )}
            <div className="message-content">
              {message.content}
            </div>
          </div>
        ))}
        
        {typingUsers.length > 0 && (
          <div className="typing-indicator">
            {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="chat-input">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => {
            setNewMessage(e.target.value);
            handleTyping();
          }}
          placeholder="Type a message..."
          className="message-input"
        />
        <button type="submit" className="send-button">
          Send
        </button>
      </form>
    </div>
  );
};

export default Chat;
