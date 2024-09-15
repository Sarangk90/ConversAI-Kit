// ChatWindow.js

import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import '../styles/ChatWindow.css';

const ChatWindow = ({ messages }) => {
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
        </div>
    );
};

export default ChatWindow;
