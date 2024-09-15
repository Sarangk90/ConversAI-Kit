import React from 'react';
import '../styles/Sidebar.css';
import pencilIcon from '../assets/pencil-icon.png';

// Utility function to format conversation date
const getConversationGrouping = (lastUpdated) => {
    const now = new Date();
    const conversationDate = new Date(lastUpdated);
    const oneDayInMs = 24 * 60 * 60 * 1000;

    const isToday = now.toDateString() === conversationDate.toDateString();
    const isYesterday = (now - conversationDate) < oneDayInMs * 2 && !isToday;
    const withinLast7Days = (now - conversationDate) < oneDayInMs * 7 && !isToday && !isYesterday;

    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";
    if (withinLast7Days) return "Previous 7 Days";
    return "Older";
};

// Group conversations based on Today, Yesterday, Previous 7 Days, and Older
const groupConversationsByDate = (conversations) => {
    return conversations.reduce((grouped, conversation) => {
        const group = getConversationGrouping(conversation.last_updated);
        if (!grouped[group]) grouped[group] = [];
        grouped[group].push(conversation);
        return grouped;
    }, {});
};

const Sidebar = ({ conversations, onSelectConversation, onNewConversation, currentConversationId }) => {
    const groupedConversations = groupConversationsByDate(conversations);

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <button className="new-chat-btn" onClick={onNewConversation}>
                    <img src={pencilIcon} alt="New Chat Icon" />
                    + New Chat
                </button>
            </div>

            <div className="sidebar-content">
                {Object.keys(groupedConversations).map((group) => (
                    <div key={group} className="conversation-group">
                        <div className="conversation-group-header">{group}</div>
                        {groupedConversations[group].map((conversation) => (
                            <button
                                key={conversation.conversation_id}
                                className={`conversation ${conversation.conversation_id === currentConversationId ? 'active' : ''}`}
                                onClick={() => onSelectConversation(conversation.conversation_id)}
                            >
                                {conversation.conversation_name || `Conversation ${conversation.conversation_id}`}
                            </button>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Sidebar;
