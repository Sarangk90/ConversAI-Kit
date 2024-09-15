import React from 'react';
import '../styles/Sidebar.css';
import pencilIcon from '../assets/pencil-icon.png';

const Sidebar = ({ conversations, onSelectConversation, onNewConversation, currentConversationId }) => {
    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <button className="new-chat-btn" onClick={onNewConversation}>
                    <img src={pencilIcon} alt="New Chat Icon" />
                    + New Chat
                </button>
            </div>

            <div className="sidebar-content">
                {conversations.map((conversation) => (
                    <button
                        key={conversation.conversation_id}  // Ensure unique key
                        className={`conversation ${conversation.conversation_id === currentConversationId ? 'active' : ''}`}
                        onClick={() => onSelectConversation(conversation.conversation_id)}
                    >
                        {conversation.conversation_name || `Conversation ${conversation.conversation_id}`}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Sidebar;
