import React, { useState, useEffect } from 'react';
import '../styles/Sidebar.css';

interface Conversation {
    conversation_id: string;
    conversation_name: string;
    last_updated: string;
}

interface SidebarProps {
    conversations: Conversation[];
    onSelectConversation: (conversationId: string) => void;
    onNewConversation: () => void;
    currentConversationId: string | null;
}

type GroupedConversations = {
    [key: string]: Conversation[];
};

// Utility function to format conversation date
const getConversationGrouping = (lastUpdated: string): string => {
    const now = new Date();
    const conversationDate = new Date(lastUpdated);
    const oneDayInMs = 24 * 60 * 60 * 1000;

    const isToday = now.toDateString() === conversationDate.toDateString();
    const isYesterday = (now.getTime() - conversationDate.getTime()) < oneDayInMs * 2 && !isToday;
    const withinLast7Days = (now.getTime() - conversationDate.getTime()) < oneDayInMs * 7 && !isToday && !isYesterday;

    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";
    if (withinLast7Days) return "Previous 7 Days";
    return "Older";
};

// Group conversations based on Today, Yesterday, Previous 7 Days, and Older
const groupConversationsByDate = (conversations: Conversation[]): GroupedConversations => {
    return conversations.reduce((grouped: GroupedConversations, conversation) => {
        const group = getConversationGrouping(conversation.last_updated);
        if (!grouped[group]) grouped[group] = [];
        grouped[group].push(conversation);
        return grouped;
    }, {});
};

const Sidebar: React.FC<SidebarProps> = ({ 
    conversations, 
    onSelectConversation, 
    onNewConversation, 
    currentConversationId 
}) => {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const groupedConversations = groupConversationsByDate(conversations);

    // Add event listener to handle class changes
    useEffect(() => {
        const sidebarElement = document.querySelector('.sidebar');
        if (!sidebarElement) return;

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                    const element = mutation.target as HTMLElement;
                    setIsCollapsed(element.classList.contains('collapsed'));
                }
            });
        });
        
        observer.observe(sidebarElement, { attributes: true });
        
        return () => observer.disconnect();
    }, []);

    return (
        <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <button className="new-chat-btn" onClick={onNewConversation}>
                    <svg
                        stroke="currentColor"
                        fill="none"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        height="16"
                        width="16"
                    >
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    {!isCollapsed && <span>New chat</span>}
                </button>
            </div>

            <div className="sidebar-content">
                {!isCollapsed && Object.keys(groupedConversations).map((group) => (
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

            <button 
                className="collapse-button" 
                onClick={() => setIsCollapsed(!isCollapsed)}
                title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                >
                    {isCollapsed ? (
                        <path d="M13 19l-6-6 6-6" />
                    ) : (
                        <path d="M19 19l-6-6 6-6" />
                    )}
                </svg>
            </button>
        </div>
    );
};

export default Sidebar; 