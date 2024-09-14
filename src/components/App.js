import React, { useEffect, useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import MessageInput from './MessageInput';
import '../styles/App.css';

function App() {
    const [messages, setMessages] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [currentConversationId, setCurrentConversationId] = useState(generateUniqueId());
    const [currentConversationName, setCurrentConversationName] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        fetchConversationsFromBackend();
    }, []);

    const fetchConversationsFromBackend = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/conversations');
            let conversations = await response.json();

            conversations = conversations.map((conv) => ({
                ...conv,
                messages: conv.messages || [],
            }));

            setConversations(conversations);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    };

    const saveConversationToBackend = async (conversation) => {
        try {
            const response = await fetch('http://localhost:5000/api/conversations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(conversation),
            });
            const data = await response.json();
            console.log('Saved to backend:', data);
        } catch (error) {
            console.error('Error saving conversation:', error);
        }
    };

    const generateConversationName = (message) => {
        if (!message) return 'New Conversation';
        return message.length > 20 ? message.substring(0, 20) + '...' : message;
    };

    useEffect(() => {
        if (messages.length > 0) {
            const conversation = {
                conversation_id: currentConversationId,
                conversation_name: currentConversationName || 'New Conversation',
                messages: messages,
            };
            saveConversationToBackend(conversation);

            setConversations((prevConversations) => {
                const index = prevConversations.findIndex(
                    (conv) => conv.conversation_id === currentConversationId
                );

                if (index !== -1) {
                    const updatedConversations = [...prevConversations];
                    updatedConversations[index] = conversation;
                    return updatedConversations;
                } else {
                    return [...prevConversations, conversation];
                }
            });
        }
    }, [messages, currentConversationName]);

    const handleSend = async (messageText) => {
        const userMessage = { role: 'user', content: messageText };
        const updatedMessages = [...messages, userMessage];

        if (messages.length === 0) {
            const conversationName = generateConversationName(messageText);
            setCurrentConversationName(conversationName);

            setConversations((prevConversations) => {
                const index = prevConversations.findIndex(
                    (conv) => conv.conversation_id === currentConversationId
                );

                if (index !== -1) {
                    const updatedConversations = [...prevConversations];
                    updatedConversations[index].conversation_name = conversationName;
                    return updatedConversations;
                } else {
                    return [
                        ...prevConversations,
                        {
                            conversation_id: currentConversationId,
                            conversation_name: conversationName,
                            messages: updatedMessages,
                        },
                    ];
                }
            });
        }

        setMessages(updatedMessages);
        setIsTyping(true);

        try {
            const response = await fetch('http://localhost:5000/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversation_id: currentConversationId,
                    messages: updatedMessages,
                }),
            });

            const data = await response.json();
            setIsTyping(false);

            if (data.reply) {
                const botMessage = { role: 'assistant', content: data.reply };
                setMessages((prevMessages) => [...prevMessages, botMessage]);
            } else if (data.error) {
                console.error(data.error);
                alert('Error: ' + data.error);
            }
        } catch (error) {
            setIsTyping(false);
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        }
    };

    const createNewConversation = () => {
        const newConversationId = generateUniqueId();
        setCurrentConversationId(newConversationId);
        setCurrentConversationName('');
        setMessages([]);
    };

    const selectConversation = (conversationId) => {
        setCurrentConversationId(conversationId);
        const conversation = conversations.find((conv) => conv.conversation_id === conversationId);
        if (conversation) {
            setMessages(conversation.messages || []);
            setCurrentConversationName(conversation.conversation_name || '');
        } else {
            setMessages([]);
            setCurrentConversationName('');
        }
    };

    return (
        <div className="App">
            <Header />
            <div className="main-content">
                <Sidebar
                    conversations={conversations}
                    onSelectConversation={selectConversation}
                    onNewConversation={createNewConversation}
                    currentConversationId={currentConversationId}
                />
                <div className="chat-container">
                    <div className="chat-wrapper">
                        <ChatWindow messages={messages} isTyping={isTyping} />
                        <MessageInput onSend={handleSend} />
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
}

export default App;

function generateUniqueId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}
