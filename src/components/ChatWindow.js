// ChatWindow.js

import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import '../styles/ChatWindow.css';
import botAvatar from '../assets/bot-avatar.png'; // Adjust path according to your file structure

const ChatWindow = ({ messages }) => {
    const chatWindowRef = useRef(null);

    // Smooth scrolling when new messages are added
    useEffect(() => {
        if (chatWindowRef.current) {
            chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
        }
    }, [messages]);

    if (!messages || messages.length === 0) {
        return (
            <div className="chat-window-empty">
                <div className="empty-state-content">
                    <img src={botAvatar} alt="Bot Avatar" className="bot-avatar-empty"/>
                    <p>Select a conversation or start a new one to begin chatting!</p>
                </div>
            </div>
        );
    }
    return (
        <div className="chat-window" ref={chatWindowRef}>
            <div className="chat-content">
                {messages.map((message, index) => (
                    <MessageBubble key={index} message={message} role={message.role} />
                ))}
            </div>
        </div>
    );

};

export default ChatWindow;
