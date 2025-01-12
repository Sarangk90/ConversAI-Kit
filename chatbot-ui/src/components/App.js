import React, {useEffect, useRef, useState} from 'react';
import Sidebar from './Sidebar';
import ChatWindow from './ChatWindow';
import MessageInput from './MessageInput';
import '../styles/App.css';
import {useLocation, useNavigate} from "react-router-dom";

// API Configuration
const API_CONFIG = {
    BASE_URL: 'http://localhost:5001',
    ENDPOINTS: {
        CONVERSATIONS: '/api/conversations',
        GENERATE_NAME: '/api/generate_name',
        STREAM_CHAT: '/api/stream_chat'
    }
};

function App() {
    // State variables
    const [messages, setMessages] = useState([]);
    const [messagesByConversation, setMessagesByConversation] = useState({});
    const [conversations, setConversations] = useState([]);
    const [currentConversationId, setCurrentConversationId] = useState(null);
    const [currentConversationName, setCurrentConversationName] = useState('');
    const [abortController, setAbortController] = useState(null); // New state for aborting stream

    const messageInputRef = useRef(null);  // <-- Create the ref

    const location = useLocation(); // Access the URL parameters
    const navigate = useNavigate();   // To update the URL

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const conversationId = params.get('conversation_id');

        if (conversationId) {
            selectConversation(conversationId); // Load the conversation based on URL parameter
        }
    }, [location]);


    useEffect(() => {
        fetchConversationsFromBackend();
    }, []);

    // useEffect to load messages when currentConversationId changes
    useEffect(() => {
        if (currentConversationId) {
            const conversation = conversations.find(conv => conv.conversation_id === currentConversationId);

            // Only fetch messages if the conversation is NOT new
            if (conversation && !conversation.isNew) {
                if (!messagesByConversation[currentConversationId]) {
                    fetchMessagesForConversation(currentConversationId);
                } else {
                    // Update messagesByConversation
                    setMessages(messagesByConversation[currentConversationId]);
                    setCurrentConversationName(conversation.conversation_name || 'New Conversation');
                }
            } else {
                // Handle the new conversation (set up empty state)
                setMessages(messagesByConversation[currentConversationId]);
                setCurrentConversationName('New Conversation');
            }
        }
    }, [currentConversationId, messagesByConversation, conversations]);

    // Fetch all conversations (IDs and names) from the backend
    const fetchConversationsFromBackend = async () => {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONVERSATIONS}`);
            const conversationsData = await response.json();

            // Sort conversations by lastUpdated in descending order
            const sortedConversations = sortConversationsByLastUpdated(conversationsData);

            setConversations(sortedConversations);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    };

    // Fetch messages for a specific conversation from the backend
    const fetchMessagesForConversation = async (conversationId) => {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONVERSATIONS}/${conversationId}`);
            const data = await response.json();

            // Update messagesByConversation
            setMessagesByConversation((prev) => ({
                ...prev,
                [conversationId]: data.messages || [],
            }));

            // Update messages and conversation name if still viewing this conversation
            if (conversationId === currentConversationId) {
                setMessages(data.messages || []);
                setCurrentConversationName(data.conversation_name || 'New Conversation');
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
            setMessages([]);
            setCurrentConversationName('New Conversation');
        }
    };

    const saveConversationToBackend = async (conversation) => {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CONVERSATIONS}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(conversation),
            });
            const data = await response.json();
            console.log('Saved to backend:', data);

            // Update conversations list, whether it's a new conversation or an existing one
            setConversations((prevConversations) => {
                const index = prevConversations.findIndex(
                    (conv) => conv.conversation_id === conversation.conversation_id
                );
                if (index !== -1) {
                    // Update existing conversation's name and lastUpdated
                    const updatedConversations = [...prevConversations];
                    updatedConversations[index] = {
                        ...updatedConversations[index],
                        conversation_name: conversation.conversation_name,
                        last_updated: data.last_updated // Use lastUpdated from backend
                    };
                    return sortConversationsByLastUpdated(updatedConversations);
                } else {
                    // Add new conversation
                    return sortConversationsByLastUpdated([
                        ...prevConversations,
                        {
                            conversation_id: conversation.conversation_id,
                            conversation_name: conversation.conversation_name,
                            last_updated: data.last_updated  // Use lastUpdated from backend
                        },
                    ]);
                }
            });
        } catch (error) {
            console.error('Error saving conversation:', error);
        }
    };

    // Function to sort conversations by lastUpdated
    const sortConversationsByLastUpdated = (conversations) => {
        return conversations.sort((a, b) => new Date(b.last_updated) - new Date(a.last_updated));
    };

    // Generate a conversation name based on the first message
    const generateConversationName = async (message) => {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.GENERATE_NAME}`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({message}),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            let name = data.name || 'New Conversation';

            // Clean the name by removing leading/trailing whitespace and any surrounding double quotes
            name = name.trim().replace(/^"(.*)"$/, '$1');
            return name;
        } catch (error) {
            console.error('Error fetching conversation name:', error);
            return 'New Conversation';
        }
    };

    // New function to handle updating UI state when user sends a message
    const updateUIWithUserMessage = (conversationId, userMessage, updatedMessages) => {
        // Update messages in the UI
        setMessagesByConversation((prev) => ({
            ...prev,
            [conversationId]: updatedMessages,
        }));

        if (conversationId === currentConversationId) {
            setMessages(updatedMessages);
        }
    };

    // Helper function to update messages in the UI
    const updateMessagesInUI = (conversationId, updatedMessages) => {
        setMessagesByConversation((prev) => ({
            ...prev,
            [conversationId]: [...updatedMessages],
        }));

        if (conversationId === currentConversationId) {
            setMessages([...updatedMessages]);
        }
    };

    // Simple throttle function
    const throttleUpdate = (callback, limit = 200) => {
        let lastExecutionTime = 0;
        return (...args) => {
            const now = Date.now();
            if (now - lastExecutionTime >= limit) {
                callback(...args);
                lastExecutionTime = now;
            }
        };
    };

    // Function to handle processing each chunk of the bot's response
    const processStreamChunk = (chunkValue, assistantMessage, updatedMessages, conversationId) => {
        let buffer = chunkValue;
        let lines = buffer.split('\n');

        for (let i = 0; i < lines.length - 1; i++) {
            const line = lines[i].trim();
            if (line.startsWith('data: ')) {
                const jsonStr = line.substring(6).trim();
                if (jsonStr) {
                    try {
                        const data = JSON.parse(jsonStr);
                        if (data.content) {
                            assistantMessage.content += data.content;

                            // Update the assistant's message in the state
                            updatedMessages[updatedMessages.length - 1] = {...assistantMessage};
                            updateMessagesInUI(conversationId, updatedMessages);
                        } else if (data.error) {
                            console.error('Error from server:', data.error);
                            throw new Error(data.error);
                        }
                    } catch (e) {
                        console.error('Error parsing JSON:', e);
                    }
                }
            }
        }

        return lines[lines.length - 1];
    };

    // Function to stream bot responses and update the conversation
    const streamBotResponse = async (conversationId, updatedMessages, model) => {
        const controller = new AbortController();
        setAbortController(controller);

        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.STREAM_CHAT}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversation_id: conversationId,
                    messages: updatedMessages,
                    model: model,
                }),
                signal: controller.signal,
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            let assistantMessage = { role: 'assistant', content: '' };
            updatedMessages.push(assistantMessage);

            const throttledUpdate = throttleUpdate((newMessages) => {
                updateMessagesInUI(conversationId, newMessages);
            });

            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';

            while (true) {
                const { value, done } = await reader.read();
                if (done) break;

                if (value) {
                    const chunkValue = decoder.decode(value);
                    buffer = processStreamChunk(chunkValue, assistantMessage, updatedMessages, conversationId);
                    throttledUpdate(updatedMessages);
                }
            }

            // Final update
            updateMessagesInUI(conversationId, updatedMessages);
            return updatedMessages;

        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Stream aborted');
            } else {
                handleError(error, 'Error during streaming');
            }
            return updatedMessages;
        } finally {
            setAbortController(null);
            if (messageInputRef.current) {
                messageInputRef.current.resetButton();
            }
        }
    };

    // New stopStreaming function
    const stopStreaming = () => {
        if (abortController) {
            abortController.abort(); // Stop the streaming by aborting the request
        }
    };
    // New function to handle saving conversation to the backend
    const saveConversation = async (conversationId, conversationName, messages) => {
        try {
            await saveConversationToBackend({
                conversation_id: conversationId,
                conversation_name: conversationName,
                messages: messages,
            });
        } catch (error) {
            console.error('Error saving conversation:', error);
        }
    };

    // Refactored handleSend method
    const handleSend = async (message, selectedModel) => {
        const userMessage = {
            role: 'user',
            content: message.text || '',
            model: selectedModel
        };

        // If there are images, format them as content array
        if (message.images && message.images.length > 0) {
            userMessage.content = [
                { type: 'text', text: message.text || '' },
                ...message.images.map(image => {
                    // Extract the base64 data after the comma
                    const base64Data = image.split(',')[1];
                    return {
                        type: 'image_url',
                        image_url: { 
                            url: `data:image/jpeg;base64,${base64Data}`
                        }
                    };
                })
            ];
        }

        let conversationId = currentConversationId;
        let conversationName = currentConversationName;

        // Check if no conversation is selected or present in the URL
        if (!conversationId) {
            conversationId = generateUniqueId();
            conversationName = 'New Conversation';

            // Create a new conversation
            setCurrentConversationId(conversationId);
            setCurrentConversationName(conversationName);
            setMessages([]);

            // Immediately add "New Conversation" to the sidebar
            setConversations((prevConversations) => [
                {
                    conversation_id: conversationId,
                    conversation_name: conversationName,
                    last_updated: new Date().toISOString(),
                },
                ...prevConversations,
            ]);

            // Update the URL with the new conversation ID
            navigate(`/?conversation_id=${conversationId}`);
        }

        const prevMessages = messagesByConversation[conversationId] || [];
        let updatedMessages = [...prevMessages, userMessage];

        // Update the UI with the new message immediately
        updateUIWithUserMessage(conversationId, userMessage, updatedMessages);

        // Generate conversation name if it's a new conversation
        const conversationNamePromise = (conversationName === 'New Conversation')
            ? generateConversationName(message.text || 'Image message')
                .then((name) => {
                    setCurrentConversationName(name);
                    conversationName = name;
                    return name;
                })
                .catch((error) => {
                    handleError(error, 'Error generating conversation name');
                    return conversationName;  // Return the placeholder name
                })
            : Promise.resolve(conversationName);

        // Start streaming bot response asynchronously
        const botResponsePromise = streamBotResponse(conversationId, updatedMessages, selectedModel);

        // Wait for both the conversation name and bot response before saving
        Promise.all([conversationNamePromise, botResponsePromise])
            .then(([finalConversationName, finalMessages]) => {
                // Save the conversation to the backend after both are resolved
                saveConversation(conversationId, finalConversationName, finalMessages);
            })
            .catch((error) => {
                handleError(error, 'Error resolving promises');
            });
    };

    // Centralized error handler
    const handleError = (error, customMessage) => {
        console.error(customMessage, error);
        alert(`${customMessage}: ${error.message || error}`);
    };

    useEffect(() => {
        if (currentConversationId) {
            navigate(`/?conversation_id=${currentConversationId}`);
        }
    }, [currentConversationId, navigate]);

    // Handle selecting a conversation
    const selectConversation = (conversationId) => {
        setCurrentConversationId(conversationId);
    };

    // Handle creating a new conversation
    const createNewConversation = () => {

        // Check if there is already a "New Conversation" in the list
        const existingNewConversation = conversations.find(conv => conv.conversation_name === 'New Conversation');

        if (existingNewConversation) {
            // Switch to the existing "New Conversation"
            setCurrentConversationId(existingNewConversation.conversation_id);
            setCurrentConversationName('New Conversation');
            setMessages(messagesByConversation[existingNewConversation.conversation_id] || []);
            if (messageInputRef.current) {
                messageInputRef.current.focus();
            }
            return;
        }
        const newConversationId = generateUniqueId();

        setCurrentConversationId(newConversationId);
        setCurrentConversationName('New Conversation');
        setMessages([]);

        // Immediately add "New Conversation" to the sidebar
        setConversations((prevConversations) => [
            {
                conversation_id: newConversationId,
                conversation_name: 'New Conversation',
                last_updated: new Date().toISOString(),
            },
            ...prevConversations,
        ]);
        if (messageInputRef.current) {
            messageInputRef.current.focus();
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
                <button 
                    className="expand-sidebar-button"
                    onClick={() => document.querySelector('.sidebar').classList.remove('collapsed')}
                    title="Show sidebar"
                >
                    <svg
                        width="8"
                        height="24"
                        viewBox="0 0 8 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M6 3L1 12L6 21" />
                    </svg>
                </button>
                <div className="chat-container">
                    <div className="chat-wrapper">
                        <ChatWindow
                            messages={messages}
                        />
                        <MessageInput onSend={handleSend}
                                      onStop={stopStreaming}
                                      ref={messageInputRef}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;

// Function to generate a unique ID for new conversations
function generateUniqueId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}