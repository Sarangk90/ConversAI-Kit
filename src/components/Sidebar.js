// src/components/Sidebar.js
import React from 'react';
import '../styles/Sidebar.css';
import pencilIcon from '../assets/pencil-icon.png'; // Import the pencil icon

const Sidebar = ({ conversations, onSelectConversation, onNewConversation, currentConversationId }) => {
    return (
        <div className="sidebar">
            {/* New Chat Button with pencil icon */}
            <button className="new-chat-btn" onClick={onNewConversation}>
                <img src={pencilIcon} alt="New Chat Icon" />
                + New Chat
            </button>

            {/* List of conversations */}
            {conversations.map((conversation) => (
                <button
                    key={conversation.conversation_id}
                    className={`conversation ${conversation.conversation_id === currentConversationId ? 'active' : ''}`}
                    onClick={() => onSelectConversation(conversation.conversation_id)}
                >
                    {conversation.conversation_name || `Conversation ${conversation.conversation_id}`}
                </button>
            ))}
        </div>
    );
};

export default Sidebar;
