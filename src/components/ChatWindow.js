// src/components/ChatWindow.js
import React from 'react';
import MessageBubble from './MessageBubble'; // Import the MessageBubble component
import '../styles/ChatWindow.css'; // Ensure this is correctly linked

const ChatWindow = ({ messages, isTyping }) => {
    return (
        <div className="chat-window">
            {messages.map((message, index) => (
                <MessageBubble key={index} message={message} role={message.role} />
            ))}
            {isTyping && (
                <MessageBubble message={{ content: 'The bot is typing...' }} role="bot" />
            )}
        </div>
    );
};

export default ChatWindow;
