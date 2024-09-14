import React, { useEffect, useState } from 'react';
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
    let accumulatedChunk = ''; // Accumulate message chunks here

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

    // Debounce function for smoother updates
    const debounce = (func, delay) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), delay);
        };
    };

    const debouncedSetMessages = debounce(setMessages, 100);  // Update every 100ms

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
            const response = await fetch('http://localhost:5000/api/stream_chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversation_id: currentConversationId,
                    messages: updatedMessages,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            // Create a new assistant message and add it to messages
            let assistantMessage = { role: 'assistant', content: '' };
            setMessages((prevMessages) => [...prevMessages, assistantMessage]);

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');

            let done = false;

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;

                if (value) {
                    const chunkValue = decoder.decode(value);
                    accumulatedChunk += chunkValue;

                    // Process complete events in the accumulated chunk
                    const events = parseSSE(accumulatedChunk);

                    events.forEach((event) => {
                        if (event.data && event.data.content) {
                            assistantMessage.content += event.data.content;

                            // Use debounced updates to render content smoothly
                            debouncedSetMessages((prevMessages) => {
                                const updatedMessages = [...prevMessages];
                                updatedMessages[updatedMessages.length - 1] = { ...assistantMessage };
                                return updatedMessages;
                            });
                        } else if (event.data && event.data.error) {
                            console.error('Error from server:', event.data.error);
                            alert('Error from server: ' + event.data.error);
                        }
                    });

                    // Clear out processed events
                    accumulatedChunk = removeProcessedEvents(accumulatedChunk);
                }
            }

            setIsTyping(false);
        } catch (error) {
            setIsTyping(false);
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        }
    };

    function parseSSE(text) {
        const events = [];
        const lines = text.split('\n');
        let event = {};

        lines.forEach((line) => {
            if (line.startsWith('data: ')) {
                const data = line.substring(6).trim();
                if (data) {
                    try {
                        const jsonData = JSON.parse(data);
                        event.data = jsonData;
                    } catch (e) {
                        console.error('Failed to parse JSON:', e);
                    }
                }
            } else if (line.startsWith('event: ')) {
                event.event = line.substring(7).trim();
            } else if (line === '') {
                // End of an event
                if (Object.keys(event).length > 0) {
                    events.push(event);
                    event = {};
                }
            }
        });

        return events;
    }

    function removeProcessedEvents(text) {
        const lastEventIndex = text.lastIndexOf('\n\n');
        if (lastEventIndex !== -1) {
            return text.substring(lastEventIndex + 2);
        }
        return text;
    }

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
        </div>
    );
}

export default App;

function generateUniqueId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}
