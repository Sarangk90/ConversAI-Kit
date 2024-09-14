import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import '../styles/ChatWindow.css';

const ChatWindow = ({ messages, isTyping }) => {
    const chatWindowRef = useRef(null);

    // Smooth scrolling when new messages are added
    useEffect(() => {
        if (chatWindowRef.current) {
            chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className="chat-window" ref={chatWindowRef}>
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
