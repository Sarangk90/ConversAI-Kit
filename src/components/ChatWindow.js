// src/components/ChatWindow.js
import React from 'react';
import MessageBubble from './MessageBubble';
import '../styles/ChatWindow.css';

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
